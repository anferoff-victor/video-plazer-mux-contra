import { memo, useId, type ReactNode, type Ref } from 'react';

import { pointAt } from './geometry';
import type { SaucerLayout } from './layout';

/** Rim thickness in the motifs' own coordinate space. −y points away from the well. */
const UNIT = 100;

const PETALS = [0, 60, 120, 180, 240, 300];

/** A curl of "grass" with a cluster of berries: the staple of Khokhloma painting. */
function Berries() {
  return (
    <>
      <path
        d="M-92 16C-70-22-30-30-8-10 6 4-2 22-16 20-27 18-30 6-22 0"
        fill="none"
        stroke="var(--saucer-paint-1)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M-72-4q4-16 20-20M-52-14q8-12 23-9M-8-10C8-22 22-18 34-6"
        fill="none"
        stroke="var(--saucer-paint-1)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="36" cy="-6" r="15" fill="var(--saucer-paint-2)" />
      <circle cx="63" cy="8" r="13" fill="var(--saucer-paint-2)" />
      <circle cx="41" cy="20" r="11" fill="var(--saucer-paint-2)" />
      <circle cx="31" cy="-11" r="3.6" fill="var(--saucer-paint-1)" />
      <circle cx="59" cy="4" r="3.2" fill="var(--saucer-paint-1)" />
      <circle cx="38" cy="17" r="2.8" fill="var(--saucer-paint-1)" />
    </>
  );
}

/** A six-petal flower between two leaves. */
function Flower() {
  return (
    <>
      <path d="M-80 8C-60-24-24-24-8-4-32-8-58 0-80 8Z" fill="var(--saucer-paint-3)" />
      <path d="M80-8C60 24 24 24 8 4 32 8 58 0 80-8Z" fill="var(--saucer-paint-3)" />
      <path
        d="M-70 4C-52-8-34-10-16-6M70-4C52 8 34 10 16 6"
        fill="none"
        stroke="var(--saucer-lacquer-deep)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      {PETALS.map((deg) => (
        <circle key={deg} cx="15" cy="0" r="10.5" fill="var(--saucer-paint-2)" transform={`rotate(${deg})`} />
      ))}
      <circle r="8" fill="var(--saucer-paint-1)" />
    </>
  );
}

function ornament(layout: SaucerLayout): ReactNode[] {
  const { track, rim } = layout;
  const scale = rim / UNIT;
  const unitLength = rim * 2.25;
  // An even count keeps the two motifs alternating all the way round.
  const count = Math.max(Math.round(track.total / unitLength / 2) * 2, 4);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < count; i++) {
    // Half a unit of offset leaves 12 o'clock free for the start line.
    const { x, y, angle } = pointAt(track, (i + 0.5) / count);
    nodes.push(
      <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((angle * 180) / Math.PI).toFixed(2)}) scale(${scale.toFixed(4)})`}>
        {i % 2 === 0 ? <Berries /> : <Flower />}
      </g>
    );
  }

  return nodes;
}

function beadGap(total: number, size: number): string {
  const count = Math.max(Math.round(total / size), 8);
  return `0 ${(total / count).toFixed(3)}`;
}

export interface DishProps {
  layout: SaucerLayout;
  /** Path whose dash length reveals the painted ornament up to the playhead. */
  litRef: Ref<SVGPathElement>;
  bufferRef: Ref<SVGPathElement>;
}

/**
 * The painted dish. It is drawn in the player's own pixel space so the ornament keeps its proportions
 * at every size and aspect ratio. Only two dash arrays change during playback; everything else is static.
 */
export const Dish = memo(function Dish({ layout, litRef, bufferRef }: DishProps) {
  const id = useId();
  const { width, height, rim, outer, inner, track, outerBeads, innerBeads } = layout;
  const top = pointAt(track, 0);

  return (
    <svg
      className="saucer-dish"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-lacquer`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--saucer-lacquer-light)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--saucer-lacquer)' }} />
          <stop offset="1" style={{ stopColor: 'var(--saucer-lacquer-deep)' }} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-well`}>
          <path d={inner.d} />
        </clipPath>
        <mask id={`${id}-lit`} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          <path
            ref={litRef}
            d={track.d}
            pathLength={1}
            fill="none"
            stroke="#fff"
            strokeWidth={rim * 1.02}
            strokeDasharray="0 1"
          />
        </mask>
        <g id={`${id}-ornament`}>{ornament(layout)}</g>
      </defs>

      {/* Shade the dish casts inside the well, so the video sits below the rim. */}
      <path
        d={inner.d}
        fill="none"
        stroke="#000"
        strokeOpacity="0.38"
        strokeWidth={rim * 0.5}
        clipPath={`url(#${id}-well)`}
      />

      <path d={`${outer.d}${inner.d}`} fillRule="evenodd" fill={`url(#${id}-lacquer)`} />
      <path d={outerBeads.d} fill="none" stroke={`url(#${id}-sheen)`} strokeWidth={rim * 0.22} />

      <path d={outer.d} fill="none" stroke="var(--saucer-edge)" strokeWidth={Math.max(rim * 0.05, 1.5)} />
      <path d={inner.d} fill="none" stroke="var(--saucer-edge)" strokeWidth={Math.max(rim * 0.06, 1.5)} />

      <use href={`#${id}-ornament`} className="saucer-ornament-unlit" />
      <g mask={`url(#${id}-lit)`}>
        <use href={`#${id}-ornament`} />
        <path
          d={outerBeads.d}
          fill="none"
          stroke="var(--saucer-paint-2)"
          strokeWidth={rim * 0.13}
          strokeLinecap="round"
          strokeDasharray={beadGap(outerBeads.total, rim * 0.27)}
        />
      </g>
      <path
        className="saucer-beads-unlit"
        d={outerBeads.d}
        fill="none"
        stroke="var(--saucer-paint-2)"
        strokeWidth={rim * 0.13}
        strokeLinecap="round"
        strokeDasharray={beadGap(outerBeads.total, rim * 0.27)}
      />

      {/* Buffered range: a string of beads along the inner lip. */}
      <path
        className="saucer-beads-idle"
        d={innerBeads.d}
        fill="none"
        stroke="var(--saucer-paint-1)"
        strokeWidth={rim * 0.085}
        strokeLinecap="round"
        strokeDasharray={beadGap(innerBeads.total, rim * 0.2)}
      />
      <path
        ref={bufferRef}
        className="saucer-buffer"
        d={innerBeads.d}
        pathLength={1}
        fill="none"
        stroke="var(--saucer-paint-1)"
        strokeWidth={Math.max(rim * 0.05, 1.5)}
        strokeDasharray="0 1"
      />

      {/* Start and finish line at 12 o'clock. */}
      <line
        x1={top.x}
        y1={top.y - rim * 0.5}
        x2={top.x}
        y2={top.y + rim * 0.5}
        stroke="var(--saucer-edge)"
        strokeWidth={Math.max(rim * 0.07, 2)}
      />
      <circle cx={top.x} cy={top.y - rim * 0.5} r={rim * 0.13} fill="var(--saucer-edge)" />
      <circle cx={top.x} cy={top.y + rim * 0.5} r={rim * 0.13} fill="var(--saucer-edge)" />
    </svg>
  );
});
