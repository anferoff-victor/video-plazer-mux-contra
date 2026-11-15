import { useId } from 'react';

/**
 * The apple that rolls around the rim. Its colors come from the `--saucer-apple-*` custom properties,
 * so an apple skin is a handful of colors. The body rotates as it rolls; the gloss does not, which is
 * what makes a flat drawing read as a rolling ball.
 */
export function Apple() {
  const id = useId();
  const body = `${id}-body`;
  const shade = `${id}-shade`;

  return (
    <span className="saucer-apple-art" aria-hidden="true">
      <svg className="saucer-apple-body" viewBox="0 0 100 100" focusable="false">
        <defs>
          <radialGradient id={body} cx="38%" cy="34%" r="75%">
            <stop offset="0" style={{ stopColor: 'var(--saucer-apple-light)' }} />
            <stop offset="0.45" style={{ stopColor: 'var(--saucer-apple-mid)' }} />
            <stop offset="1" style={{ stopColor: 'var(--saucer-apple-dark)' }} />
          </radialGradient>
          <radialGradient id={shade} cx="50%" cy="50%" r="50%">
            <stop offset="0.72" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.38" />
          </radialGradient>
        </defs>
        <path
          d="M50 24C39 11 11 15 11 47c0 26 18 45 33 45 3 0 4.5-1.5 6-1.5s3 1.5 6 1.5c15 0 33-19 33-45 0-32-28-36-39-23Z"
          fill={`url(#${body})`}
        />
        <path
          d="M30 30c-8 8-10 24-5 36"
          fill="none"
          stroke="var(--saucer-apple-blush)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M50 24C39 11 11 15 11 47c0 26 18 45 33 45 3 0 4.5-1.5 6-1.5s3 1.5 6 1.5c15 0 33-19 33-45 0-32-28-36-39-23Z"
          fill={`url(#${shade})`}
        />
        <path d="M50 27c-1-8 1-15 6-21" fill="none" stroke="var(--saucer-apple-stem)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M55 15c7-11 21-12 28-7-5 10-18 13-28 7Z" fill="var(--saucer-apple-leaf)" />
        <path d="M58 14c8-4 15-5 22-5" fill="none" stroke="rgb(0 0 0 / 0.25)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg className="saucer-apple-gloss" viewBox="0 0 100 100" focusable="false">
        <ellipse cx="35" cy="37" rx="9" ry="15" transform="rotate(28 35 37)" fill="#fff" opacity="0.5" />
        <circle cx="29" cy="30" r="4" fill="#fff" opacity="0.75" />
      </svg>
    </span>
  );
}
