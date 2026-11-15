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
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function computeLayout(width: number, height: number, shape: number): SaucerLayout {
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

  const barHeight = 48;
  const barGap = Math.max(rim * 0.3, 8);
  const innerB = b - rim;
  const dy = Math.max(innerB - barGap - barHeight, 0);

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
    chord: 2 * halfChord(a - rim, innerB, shape, dy),
    barBottom: inset + rim + barGap,
  };
}
