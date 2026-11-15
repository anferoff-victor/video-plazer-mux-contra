import { buildLoop, halfChord, type Loop } from './geometry';

export interface SaucerLayout {
  width: number;
  height: number;
  /** Superellipse exponent: 2 is a true oval, higher values square the shoulders. */
  shape: number;
  /** Rim thickness in px. */
  rim: number;
  /** Apple diameter in px. */
  apple: number;
  outer: Loop;
  inner: Loop;
  /** Center line of the rim: the path the apple rolls along. */
  track: Loop;
  outerBeads: Loop;
  innerBeads: Loop;
  /** Usable width for the control bar near the bottom of the well. */
  chord: number;
  /** Distance from the bottom of the player to the bottom of the control bar. */
  barBottom: number;
  /** Vertical center and largest size of the opening play button: the clear space above the bar. */
  centerY: number;
  centerMax: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Space kept between the control bar and the inner lip of the dish. */
const BAR_MARGIN = 8;

export function computeLayout(
  width: number,
  height: number,
  shape: number,
  /** Measured size of the control bar, so it can be seated where the well is wide enough for it. */
  bar: { width: number; height: number } = { width: 260, height: 52 }
): SaucerLayout {
  const short = Math.min(width, height);
  const rim = clamp(short * 0.105, 24, 78);
  const apple = clamp(rim * 1.25, 36, 92);
  // The apple overhangs the rim a little, so the dish is inset to keep it inside the player box.
  const inset = Math.max((apple - rim) / 2 + 2, 3);
  const cx = width / 2;
  const cy = height / 2;
  const a = Math.max(width / 2 - inset, 10);
  const b = Math.max(height / 2 - inset, 10);
  const loop = (offset: number) => buildLoop(cx, cy, Math.max(a - offset, 4), Math.max(b - offset, 4), shape);

  // Seat the bar as low as it fits: its bottom corners must stay inside the well, so on a rounder
  // dish or a narrower player it moves up to where the well is wide enough.
  const innerA = a - rim;
  const innerB = b - rim;
  const reach = Math.min((bar.width / 2 + BAR_MARGIN) / innerA, 0.98);
  const fits = innerB * (1 - reach ** shape) ** (1 / shape);
  const barDrop = Math.max(Math.min(fits, innerB - Math.max(rim * 0.3, BAR_MARGIN)), 0);
  const dy = Math.max(barDrop - bar.height, 0);

  return {
    width,
    height,
    shape,
    rim,
    apple,
    outer: loop(0),
    inner: loop(rim),
    track: loop(rim / 2),
    outerBeads: loop(rim * 0.17),
    innerBeads: loop(rim * 0.83),
    chord: 2 * halfChord(innerA, innerB, shape, dy),
    barBottom: height / 2 - barDrop,
    centerY: (inset + rim + (height / 2 + barDrop - bar.height)) / 2,
    centerMax: Math.max(height / 2 + barDrop - bar.height - (inset + rim) - 20, 44),
  };
}
