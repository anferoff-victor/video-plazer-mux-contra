import { isMediaSeekCapable, useMedia } from '@videojs/react';
import { usePlayer } from '@videojs/react/video';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { Apple } from './Apple';
import { Dish } from './Dish';
import { formatTime, nearestFraction, pointAt, spokenTime } from './geometry';
import type { SaucerLayout } from './layout';
import type { Tilt } from './useTilt';

/** Seconds moved by an arrow key while the apple has focus. */
const STEP = 5;
/** Fraction of the timeline moved by Page Up / Page Down. */
const LARGE_STEP = 0.1;
const SEEK_THROTTLE = 110;

/** Tilt below this (≈4°) is treated as level, so a hand tremor never seeks. */
const TILT_DEAD_ZONE = 0.07;
/** Acceleration, in px/s², of an apple on a rim tipped fully on its side. */
const TILT_GRAVITY = 2600;
/** Rolling friction, per second. */
const TILT_FRICTION = 2.4;
const TILT_BOUNCE = 0.25;
/** Below this speed (px/s) on a level dish the apple is considered at rest. */
const TILT_REST = 8;

interface Motion {
  fraction: number;
  rendered: number;
  dragging: boolean;
  dragFraction: number;
  /** Shown after a drag ends, until the media catches up with the seek. */
  holdUntil: number;
  tilting: boolean;
  velocity: number;
  resumeAfterTilt: boolean;
  lastSeek: number;
  lastSought: number;
  last: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface RimProps {
  layout: SaucerLayout;
  tilt: Tilt;
}

/**
 * The rim of the saucer is the seek bar. An apple rolls clockwise from 12 o'clock as the video plays
 * and the painted ornament lights up behind it. Drag the apple, press anywhere on the rim, use the
 * arrow keys, or — on a phone — tilt the device and let it roll.
 */
export function Rim({ layout, tilt }: RimProps) {
  const store = usePlayer();
  const media = useMedia();
  const duration = usePlayer((s) => s.duration);
  const currentTime = usePlayer((s) => s.currentTime);
  const paused = usePlayer((s) => s.paused);
  const buffered = usePlayer((s) => s.buffered);

  const appleRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<SVGPathElement>(null);
  const bufferRef = useRef<SVGPathElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const releaseLock = useRef<(() => void) | null>(null);

  const motion = useRef<Motion>({
    fraction: 0,
    rendered: -1,
    dragging: false,
    dragFraction: 0,
    holdUntil: 0,
    tilting: false,
    velocity: 0,
    resumeAfterTilt: false,
    lastSeek: 0,
    lastSought: -1,
    last: 0,
  });

  // The animation loop reads the latest values through this ref instead of re-subscribing each render.
  const live = useRef({ layout, duration, currentTime, paused, media, store, tilt });
  live.current = { layout, duration, currentTime, paused, media, store, tilt };

  useEffect(() => {
    motion.current.rendered = -1;
  }, [layout]);

  useEffect(() => {
    const end = duration > 0 && buffered.length ? buffered[buffered.length - 1]![1] / duration : 0;
    bufferRef.current?.setAttribute('stroke-dasharray', `${Math.min(end, 1).toFixed(4)} 1`);
  }, [buffered, duration, layout]);

  useEffect(() => {
    let frame = 0;

    const seekTo = (fraction: number, force: boolean) => {
      const { duration: total, store: player } = live.current;
      const state = motion.current;
      const now = performance.now();
      if (!(total > 0)) return;
      if (!force && now - state.lastSeek < SEEK_THROTTLE) return;
      const time = fraction * total;
      if (Math.abs(time - state.lastSought) < 0.04) return;
      state.lastSeek = now;
      state.lastSought = time;
      void player.seek(time);
    };

    const render = (fraction: number) => {
      const state = motion.current;
      const { layout: l } = live.current;
      if (Math.abs(fraction - state.rendered) * l.track.total < 0.2) return;
      state.rendered = fraction;

      const { x, y } = pointAt(l.track, fraction);
      const apple = appleRef.current;
      if (apple) {
        // Rolling without slipping: the apple turns by the distance travelled over its radius.
        const roll = prefersReducedMotion() ? 0 : ((fraction * l.track.total) / (l.apple / 2)) * (180 / Math.PI);
        apple.style.transform = `translate3d(${(x - l.apple / 2).toFixed(2)}px, ${(y - l.apple / 2).toFixed(2)}px, 0)`;
        apple.style.setProperty('--saucer-apple-roll', `${roll.toFixed(1)}deg`);
      }
      litRef.current?.setAttribute('stroke-dasharray', `${fraction.toFixed(5)} 1`);
    };

    /** Follow the playhead, except briefly after a seek while the media is still catching up. */
    const follow = (now: number, playhead: number, total: number) => {
      const state = motion.current;
      const settled = Math.abs(playhead - state.fraction) * total < 0.35;
      if (now >= state.holdUntil || settled) {
        state.holdUntil = 0;
        state.fraction = playhead;
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const state = motion.current;
      const { layout: l, duration: total, media: m, tilt: t, store: player } = live.current;
      const dt = Math.min((now - (state.last || now)) / 1000, 0.05);
      state.last = now;

      const time = isMediaSeekCapable(m) && Number.isFinite(m.currentTime) ? m.currentTime : live.current.currentTime;
      const playhead = total > 0 ? Math.min(Math.max(time / total, 0), 1) : 0;

      if (state.dragging) {
        state.fraction = state.dragFraction;
        seekTo(state.fraction, false);
      } else if (t.status === 'on' && total > 0) {
        const g = t.gravity.current;
        const tilted = Math.hypot(g.x, g.y) >= TILT_DEAD_ZONE;

        if (!state.tilting && tilted) {
          // Tilting grabs the apple: playback holds while it rolls and resumes once the dish is level.
          state.tilting = true;
          state.velocity = 0;
          state.fraction = playhead;
          state.resumeAfterTilt = !live.current.paused;
          if (state.resumeAfterTilt) player.pause();
          appleRef.current?.setAttribute('data-tilting', '');
        }

        if (state.tilting) {
          const { angle } = pointAt(l.track, state.fraction);
          // Only the part of gravity that points along the rim moves the apple.
          const along = tilted ? g.x * Math.cos(angle) + g.y * Math.sin(angle) : 0;
          state.velocity += ((TILT_GRAVITY * along) / l.track.total - TILT_FRICTION * state.velocity) * dt;
          state.fraction += state.velocity * dt;

          // The start line is a wall: the apple bounces off it instead of wrapping round.
          if (state.fraction < 0) {
            state.fraction = 0;
            state.velocity = -state.velocity * TILT_BOUNCE;
          } else if (state.fraction > 1) {
            state.fraction = 1;
            state.velocity = -state.velocity * TILT_BOUNCE;
          }

          seekTo(state.fraction, false);

          if (!tilted && Math.abs(state.velocity) * l.track.total < TILT_REST) {
            state.tilting = false;
            state.velocity = 0;
            seekTo(state.fraction, true);
            state.holdUntil = now + 600;
            appleRef.current?.removeAttribute('data-tilting');
            if (state.resumeAfterTilt && state.fraction < 1) void player.play();
          }
        } else {
          follow(now, playhead, total);
        }
      } else {
        if (state.tilting) {
          // Tilt was switched off mid-roll.
          state.tilting = false;
          appleRef.current?.removeAttribute('data-tilting');
          seekTo(state.fraction, true);
          state.holdUntil = now + 600;
          if (state.resumeAfterTilt) void player.play();
        }
        follow(now, playhead, total);
      }

      render(state.fraction);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const fractionFromEvent = (event: { clientX: number; clientY: number }, target: Element): number => {
    const box = target.closest('.saucer-rim')!.getBoundingClientRect();
    return nearestFraction(layout.track, event.clientX - box.left, event.clientY - box.top);
  };

  const showPreview = (fraction: number) => {
    const preview = previewRef.current;
    if (!preview || !(duration > 0)) return;
    const { x, y, angle } = pointAt(layout.track, fraction);
    // Sit the label just inside the well, clear of a fingertip on the rim.
    const reach = layout.rim / 2 + 26;
    preview.style.transform = `translate(-50%, -50%) translate(${(x - Math.sin(angle) * reach).toFixed(1)}px, ${(y + Math.cos(angle) * reach).toFixed(1)}px)`;
    preview.textContent = formatTime(fraction * duration);
    preview.setAttribute('data-visible', '');
  };

  const hidePreview = () => previewRef.current?.removeAttribute('data-visible');

  const onPointerDown = (event: ReactPointerEvent<Element>) => {
    if (event.button !== 0 || !(duration > 0)) return;
    event.preventDefault();
    const target = event.currentTarget;
    const state = motion.current;
    const rimElement = target.closest('.saucer-rim') as HTMLElement;

    state.dragging = true;
    state.tilting = false;
    state.dragFraction = fractionFromEvent(event, target);
    releaseLock.current = store.requestControlsLock?.() ?? null;
    rimElement.setAttribute('data-dragging', '');
    appleRef.current?.focus({ preventScroll: true });
    showPreview(state.dragFraction);

    const move = (e: PointerEvent) => {
      let next = fractionFromEvent(e, rimElement);
      // The rim is a closed loop, but time is not: do not let a drag jump across the start line.
      if (Math.abs(next - state.dragFraction) > 0.5) next = state.dragFraction > 0.5 ? 1 : 0;
      state.dragFraction = next;
      showPreview(next);
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      state.dragging = false;
      state.fraction = state.dragFraction;
      state.lastSeek = 0;
      state.lastSought = -1;
      void store.seek(state.dragFraction * duration);
      state.holdUntil = performance.now() + 800;
      releaseLock.current?.();
      releaseLock.current = null;
      rimElement.removeAttribute('data-dragging');
      hidePreview();
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  // A native listener, so it runs before the player's own arrow-key shortcuts on the container and
  // can claim the key with preventDefault. A React handler would fire after them and seek twice.
  useEffect(() => {
    const apple = appleRef.current;
    if (!apple) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const { duration: total, store: player, media: m } = live.current;
      if (!(total > 0) || event.altKey || event.ctrlKey || event.metaKey) return;
      const now = isMediaSeekCapable(m) && Number.isFinite(m.currentTime) ? m.currentTime : live.current.currentTime;
      let next: number;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          next = now + STEP;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          next = now - STEP;
          break;
        case 'PageUp':
          next = now + total * LARGE_STEP;
          break;
        case 'PageDown':
          next = now - total * LARGE_STEP;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total;
          break;
        default:
          return;
      }

      event.preventDefault();
      void player.seek(Math.min(Math.max(next, 0), total));
    };

    apple.addEventListener('keydown', onKeyDown);
    return () => apple.removeEventListener('keydown', onKeyDown);
  }, []);

  const ready = duration > 0;

  return (
    <div
      className="saucer-rim"
      data-tilt={tilt.status === 'on' ? '' : undefined}
      style={{ ['--saucer-apple-size' as string]: `${layout.apple}px` }}
    >
      <Dish layout={layout} litRef={litRef} bufferRef={bufferRef} />

      <svg
        className="saucer-rim-hit"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden="true"
        focusable="false"
      >
        <path
          d={layout.track.d}
          fill="none"
          stroke="transparent"
          strokeWidth={layout.rim + 12}
          onPointerDown={onPointerDown}
          onPointerMove={(event) => {
            if (!motion.current.dragging && event.pointerType === 'mouse') {
              showPreview(fractionFromEvent(event, event.currentTarget));
            }
          }}
          onPointerLeave={() => {
            if (!motion.current.dragging) hidePreview();
          }}
        />
      </svg>

      <div
        ref={appleRef}
        className="saucer-apple"
        role="slider"
        tabIndex={ready ? 0 : -1}
        aria-label="Seek"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={ready ? Math.round(duration) : 0}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${spokenTime(currentTime)} of ${spokenTime(duration)}`}
        aria-disabled={ready ? undefined : true}
        data-paused={paused ? '' : undefined}
        onPointerDown={onPointerDown}
      >
        <span className="saucer-apple-shadow" aria-hidden="true" />
        <Apple />
      </div>

      <div ref={previewRef} className="saucer-preview" aria-hidden="true" />
    </div>
  );
}
