import { useState } from 'react';

import { SaucerPlayer } from './SaucerPlayer';
import type { AppleTheme, DishTheme } from './skin/SaucerSkin';

/** Public playback ID of the Mux asset this page plays. */
const MUX_PLAYBACK_ID = import.meta.env.VITE_MUX_PLAYBACK_ID ?? '00nIvQX2zNzBr00dDwE00Ny2Deotliq35qkJrfbhfvUhK4';
const VIDEO_SRC: string | undefined = import.meta.env.VITE_VIDEO_SRC;

const DISHES: { value: DishTheme; label: string; note: string }[] = [
  { value: 'khokhloma', label: 'Khokhloma', note: 'Black lacquer, gold and red' },
  { value: 'gzhel', label: 'Gzhel', note: 'Cobalt on white porcelain' },
  { value: 'silver', label: 'Silver', note: 'The saucer from the tale' },
];

const APPLES: { value: AppleTheme; label: string }[] = [
  { value: 'red', label: 'Ripe red' },
  { value: 'golden', label: 'Golden' },
  { value: 'green', label: 'Green' },
];

function Choice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: T; label: string; note?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="choice">
      <legend>{legend}</legend>
      <div className="choice-options">
        {options.map((option) => (
          <label key={option.value} className="choice-option" data-value={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="choice-swatch" aria-hidden="true" />
            <span className="choice-label">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function App() {
  const [dish, setDish] = useState<DishTheme>('khokhloma');
  const [apple, setApple] = useState<AppleTheme>('red');

  return (
    <main className="page" data-dish={dish}>
      <header className="hero">
        <p className="eyebrow">A skin for the Video.js v10 player</p>
        <h1>Silver Saucer</h1>
        <p className="lede">
          In the old tale, an apple rolled around a silver saucer shows you faraway cities, fields and seas. Here the
          saucer is the player, and the apple rolling around its rim is the seek bar.
        </p>
      </header>

      <section className="stage" aria-label="Player">
        <SaucerPlayer playbackId={MUX_PLAYBACK_ID} src={VIDEO_SRC} dish={dish} apple={apple} />
      </section>

      <section className="choices" aria-label="Skin options">
        <Choice legend="Dish" name="dish" options={DISHES} value={dish} onChange={setDish} />
        <Choice legend="Apple" name="apple" options={APPLES} value={apple} onChange={setApple} />
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title">How to roll the apple</h2>
        <ul>
          <li>
            <h3>Drag it</h3>
            <p>Grab the apple, or press anywhere on the rim. The painting lights up behind it as the video plays.</p>
          </li>
          <li>
            <h3>Tilt it</h3>
            <p>
              On a phone, tap the tilt button and tip the device. The apple rolls downhill with real weight and the
              video follows. Hold it level and playback carries on.
            </p>
          </li>
          <li>
            <h3>Use the keys</h3>
            <p>
              Tab to the apple and press the arrow keys. Space plays, M mutes, F goes fullscreen, and Home and End jump
              to either side of the start line.
            </p>
          </li>
        </ul>
      </section>

      <section className="notes" aria-labelledby="notes-title">
        <h2 id="notes-title">Design notes</h2>
        <p>
          A seek bar is a line because film was a strip. A saucer has no line, only a rim, so time runs clockwise from
          12 o'clock like a clock face. The ornament is drawn in code along that rim, so it stays crisp at any size, and
          a dish or an apple theme is a handful of CSS custom properties.
        </p>
        <p>
          Everything a player needs is still here: play, time, volume, captions, speed, picture-in-picture and
          fullscreen sit in one opaque bar that stays readable over any footage. Focus rings are always on, touch
          targets are 44px, and with reduced motion the apple slides without spinning.
        </p>
        <p className="credit">
          After “The Tale of the Silver Saucer and the Ripe Apple” from Alexander Afanasyev's collection of Russian folk
          tales. Built with <a href="https://videojs.org">Video.js v10</a>. Apache-2.0.
        </p>
      </section>

      <footer className="footer">
        <p>
          © 2026 Victor Anferov, <a href="https://parnii.de">parnii.de</a>, Berlin
        </p>
      </footer>
    </main>
  );
}
