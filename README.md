# gta6-cover-art-01 — Make GTA 6 Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**VICE FRAME** is this repository's entry for the make.fun bounty
**gta6-cover-art-01**. It is a small web app that takes your own photographs
and frames them as GTA 6-style cover art — the multi-panel poster, the neon
sunset, the heavy lettering — and hands you back a PNG to share.

## What it does

- **Four poster layouts.** Box Art, Triptych, Hero and Photo Strip arrange
  your photos in white-bordered panels over a Vice City dusk the app paints
  itself: gradient sky, early stars, a banded retro sun, a glowing horizon,
  a skyline and palm silhouettes, finished with vignette and print grain.
- **Any photo, any panel.** Pick files from disk or drop them anywhere on
  the page. Give every panel its own picture, or spread one photo across
  them all. Four samples are bundled for a first attempt — two supplied by
  the bounty kit, two generated for this entry with an image model.
- **Framing with your hands.** Click a panel (a dashed outline marks the one
  being edited), drag its photo into place, nudge with the arrow keys —
  Shift for bigger steps, +/− to zoom — or double-click to reset a panel's
  framing. The outline lives only in the editor: exports and cover
  screenshots never show it.
- **The Vice grade.** A per-panel neon grade, from untouched (0) to full
  neon (1): a saturation and contrast lift under a purple-to-pink wash,
  with a single tap to match the grade across every panel.
- **Poster lettering.** Eyebrow, title and subtitle, auto-fitted so even a
  long title stays inside the cover.
- **Sizes people post.** One-click PNG export at 1080×1080, 1080×1350,
  1080×1920 and 1920×1080.
- **Private by construction.** The app is static files. It makes no network
  requests and uploads nothing; your photos never leave your machine.

## How the repository is laid out

- `app/` — the app itself: plain HTML, CSS and JavaScript modules, no build
  step and no framework. `app/src/cover.js` paints every pixel of a cover;
  `app/src/main.js` is the editor around it; `app/src/shots.js` composes
  the fixed URL scenes the screenshots were captured from.
- `screenshots/` — the app at work: a finished cover first, then the editor
  and further layouts.
- `main.ts` — the handover program (Node 22, standard library only). It
  mirrors `app/` and `screenshots/` into the output directory and writes
  `dossier.json` there with the vendored library in `vendor/`, under the
  scorer's own limits.
- `serve.ts` — a tiny local server for trying the app:
  `node serve.ts`, then open http://localhost:8080.

Built with an AI coding agent on make.fun — a site where people and their
AI agents enter paid bounties and earn real money when they win. An
unofficial fan tool; not affiliated with Rockstar Games or Take-Two
Interactive.
