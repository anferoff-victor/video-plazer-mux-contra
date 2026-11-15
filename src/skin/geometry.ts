/**
 * Geometry of the saucer: a superellipse ("squircle-oval") sampled into a closed loop that starts at
 * 12 o'clock and runs clockwise. Everything that lives on the rim — the painted ornament, the lit
 * progress, the apple — is placed by arc length along one of these loops.
 */
export interface Loop {
  /** Interleaved x,y of each sample. The last sample repeats the first. */
  pts: Float32Array;
  /** Cumulative arc length at each sample. */
  len: Float32Array;
  total: number;
  /** SVG path data, closed. */
  d: string;
  count: number;
}

export interface LoopPoint {
  x: number;
  y: number;
  /** Direction of travel, radians. */
  angle: number;
}

const pow = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;

export function buildLoop(cx: number, cy: number, a: number, b: number, n: number, count = 720): Loop {
  const pts = new Float32Array((count + 1) * 2);
  const len = new Float32Array(count + 1);
  const e = 2 / n;
  let d = '';
  let total = 0;

  for (let i = 0; i <= count; i++) {
    const phi = -Math.PI / 2 + (i / count) * Math.PI * 2;
    const x = cx + a * pow(Math.cos(phi), e);
    const y = cy + b * pow(Math.sin(phi), e);
    pts[i * 2] = x;
    pts[i * 2 + 1] = y;
    if (i > 0) total += Math.hypot(x - pts[i * 2 - 2]!, y - pts[i * 2 - 1]!);
    len[i] = total;
    if (i < count) d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  return { pts, len, total, d: `${d}Z`, count };
}

/** Point and travel direction at a fraction (0–1) of the loop's arc length. */
export function pointAt(loop: Loop, fraction: number): LoopPoint {
  const target = Math.min(Math.max(fraction, 0), 1) * loop.total;
  let lo = 0;
  let hi = loop.count;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (loop.len[mid]! <= target) lo = mid;
    else hi = mid;
  }
  const span = loop.len[hi]! - loop.len[lo]! || 1;
  const t = (target - loop.len[lo]!) / span;
  const x0 = loop.pts[lo * 2]!;
  const y0 = loop.pts[lo * 2 + 1]!;
  const x1 = loop.pts[hi * 2]!;
  const y1 = loop.pts[hi * 2 + 1]!;
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, angle: Math.atan2(y1 - y0, x1 - x0) };
}

/** Fraction (0–1) of the loop nearest to a point. */
export function nearestFraction(loop: Loop, x: number, y: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < loop.count; i++) {
    const dx = loop.pts[i * 2]! - x;
    const dy = loop.pts[i * 2 + 1]! - y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return loop.len[best]! / loop.total;
}

/** Half-width of the superellipse at a vertical offset from its center. */
export function halfChord(a: number, b: number, n: number, dy: number): number {
  const r = Math.min(Math.abs(dy) / b, 1);
  return a * (1 - r ** n) ** (1 / n);
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Spoken form for `aria-valuetext`. */
export function spokenTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const parts: string[] = [];
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (m) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  parts.push(`${s} ${s === 1 ? 'second' : 'seconds'}`);
  return parts.join(', ');
}
