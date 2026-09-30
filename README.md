# Gireesh — portfolio launch video

A 14.75s, 1920×1080 @ 60fps launch video for the [greenportfolio](https://github.com/gireeshkumarreddy/greenportfolio) site, built with [Remotion](https://www.remotion.dev/).

The stationery on the site's cutting mat tells the story: the pencil writes "what if…" and sketches the frame, the homepage tours top to bottom, the folder releases the three case studies, the scissors cut to Work and About, and one pencil thread connects all six pages before the end card.

## Setup

```sh
npm install
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run studio` | Open Remotion Studio to preview and scrub the timeline |
| `npm run capture` | Re-capture full-page screenshots of `site/` into `public/shots` (uses local Chrome) |
| `python sfx.py` | Synthesise the soundtrack to `out/sfx.wav` (needs numpy + scipy) |
| `npm run render` | Render the video (no audio) to `out/gireesh-launch.mp4` |

Add the soundtrack:

```sh
ffmpeg -i out/gireesh-launch.mp4 -i out/sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/gireesh-launch-final.mp4
```

## Layout

- `src/Launch.tsx` — the whole composition; scenes are timed in frames (60fps)
- `public/shots` — full-page captures of all six pages
- `public/assets` — stationery cut-outs and fonts from the site
- `site/` — copy of the portfolio's `dist` used for capturing
- `sfx.py` — sound design cued to the same frame timeline
