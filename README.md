# Silver Saucer — a fairy-tale skin for Video.js v10

Entry for the Video.js Skins Design Challenge on Contra (deadline: Nov 16, 11:59pm PST = Tue Nov 17, 08:59 Berlin).

The video plays in the well of a painted dish. The rim of the dish is the seek bar: an apple rolls clockwise
from 12 o'clock as the video plays and the ornament lights up behind it. On a phone, the tilt button turns on
real physics — gravity is projected onto the rim, the apple rolls downhill with inertia and friction, and the
video follows it.

## Run and deploy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run deploy     # build, then `vercel deploy --prod` (asks you to log in the first time)
```

Netlify works too: `npm run build`, then `npx netlify deploy --prod --dir dist`.

Set the video with an environment variable (locally in `.env`, on the host in project settings):

```
VITE_MUX_PLAYBACK_ID=<your public Mux playback ID>
```

Without it the page plays the asset whose playback ID is set in `src/App.tsx`. **For the Mux bonus point the asset must be
your own**: upload at mux.com → Video → Assets → copy the Playback ID.

## Use the skin in another site

Copy `src/skin/` and `src/SaucerPlayer.tsx`, install `@videojs/react@10.4.0`, then:

```tsx
<SaucerPlayer playbackId="…" dish="khokhloma" apple="red" />
```

`dish`: `khokhloma` | `gzhel` | `silver`. `apple`: `red` | `golden` | `green`.
The player box takes any size and aspect ratio (`style={{ aspectRatio: '4 / 3' }}`); the dish redraws itself.

Public CSS custom properties: `--media-accent-color`, `--media-border-radius`, `--media-font-family`,
`--saucer-backdrop`. A new dish theme is one CSS rule that sets the `--saucer-lacquer-*`, `--saucer-paint-*`,
`--saucer-edge` and `--saucer-ui-*` groups; a new apple sets `--saucer-apple-*`.

## Files

| File | What it does |
| --- | --- |
| `src/skin/SaucerSkin.tsx` | Skin root: Container, well, poster, feedback, hotkeys, gestures, error dialog |
| `src/skin/Rim.tsx` | The seek control: apple, drag, keyboard, tilt physics |
| `src/skin/Dish.tsx` | The painted dish, drawn as SVG along the rim |
| `src/skin/Controls.tsx` | Control bar and opening play button |
| `src/skin/useTilt.ts` | Device orientation → gravity in screen space (asks permission on iOS) |
| `src/skin/geometry.ts`, `layout.ts` | Superellipse rim, arc-length lookup, sizes |
| `src/skin/saucer-skin.css` | All styles and themes |

## Challenge checklist

| Requirement | Status |
| --- | --- |
| Uses Video.js v10 and plays video | `@videojs/react` 10.4.0, `createPlayer` + `videoFeatures` |
| Play/pause | Bar button, opening medallion, Space / K, click on the picture |
| Seek bar | The rim. Drag the apple, press the rim, arrow keys, Home/End, 0–9, tilt |
| Time | Current / duration in the bar; pointer time label on the rim |
| Volume / mute | Mute button + slider (slider hides under 640px; M and ↑/↓ always work) |
| Fullscreen | Bar button, F |
| Responsive | Dish redraws for any box; bar sheds controls at 640px and 500px; 44px targets on touch |
| Keyboard | Every control is a tab stop; menu closes with Escape and returns focus |
| Visible focus | White ring with a dark halo on every control, including the apple |
| Readable over any video | All text and icons sit on opaque surfaces, never on the picture |
| Reduced motion | Apple slides without spinning, transitions and the buffering animation are off |
| Extras | Captions, playback speed, picture-in-picture, error dialog, screen reader announcements, forced colors |

Tested in headless Chrome (desktop 1280px, phone 390px): keyboard seeking, menu, drag, fullscreen, and the tilt
physics with simulated sensor events. **Still to test by hand: a real iPhone and Android phone (tilt), Safari, Firefox.**

## Submission text (draft)

**Silver Saucer.** In a Russian folk tale, an apple rolled around a silver saucer shows you faraway cities,
fields and seas. That is a video player, described two hundred years early, so I built it. The video plays in the
well of a painted dish, and the rim is the seek bar: an apple rolls clockwise from 12 o'clock, and the Khokhloma
ornament lights up behind it. On a phone you can tilt the device and the apple rolls downhill with real weight,
taking the video with it. The ornament is drawn in code along the rim, so it is crisp at any size, and a dish or an
apple theme is a handful of CSS custom properties (Khokhloma, Gzhel and Silver ship with it). Underneath the
fairy tale it is a complete player: every control is keyboard reachable with a visible focus ring, text never sits
on the picture, touch targets are 44px, and reduced motion stops the apple from spinning.

## Optional raster assets (brief for image generation)

The skin needs no images. If you want a hand-painted look instead of the drawn ornament, these are the assets to
generate; each replaces one layer.

1. **Rim tile, per dish** — seamless horizontal strip, 2048×256 px, PNG. It is wrapped along the rim, so the left
   and right edges must tile. Top edge = outer edge of the dish. Flat lighting, no perspective, no shadow.
   - Khokhloma: black lacquer ground, gold grass curls, red berries, red and gold flowers, thin gold border lines.
   - Gzhel: white porcelain ground, cobalt brushwork in two tones.
   - Silver: brushed silver ground, engraved floral scroll, darker in the grooves.
   Also an "unlit" version of each (same drawing, 40% contrast) for the part the apple has not reached.
2. **Apple, per skin** — 512×512 px, transparent PNG, one apple seen from slightly above, stem up, centered, filling
   86% of the frame, soft top-left key light, no cast shadow (the skin draws it). Red, golden, green.
   For a true 3D roll: a sprite sheet of 24 frames (6×4 grid, 512 px each) of the apple turning once about a
   horizontal axis.
3. **Poster** — 1920×1080 JPG for the opening frame, if the video's own first frame is weak.

Style reference for all: traditional Russian decorative painting, saturated flat color, clean edges, no text, no
logos.
