# gta6-cover-art-01 — Make GTA 6 Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An entry for the make.fun bounty **gta6-cover-art-01**: **VICE FRAME**, a free
offline web app that turns your photos into GTA 6-style cover art.

## What it does

- **The poster look.** Four layouts — Box Art, Triptych, Hero, Photo Strip —
  arrange your photos as white-bordered panels over a Vice City sunset the app
  draws itself: banded sun, skyline, palm silhouettes, early stars and a touch
  of print grain.
- **Any photo, every panel.** Upload or drag in your own pictures (they never
  leave your machine — there is no server). Give each panel its own photo, or
  spread one photo across all of them. Four samples are built in for a first
  try: two from the bounty kit, two made for this entry with an image model.
- **Framing that feels direct.** Click a panel and it outlines itself on the
  cover; drag its photo to reframe, use the arrow keys for fine nudges
  (Shift for bigger steps, +/− to zoom), or ride the zoom slider.
- **The Vice grade.** A neon duotone wash with a saturation/contrast lift,
  adjustable per panel from natural to full neon, and matchable across every
  panel in one tap.
- **The lettering.** Your title in heavy outlined italic capitals, with an
  eyebrow line above and a subtitle pill below — sized automatically so long
  titles never spill off the cover.
- **One-step export** at the sizes people actually post: 1080×1080,
  1080×1350, 1080×1920 and 1920×1080 PNG. The exported file is the clean
  cover — the editor's selection outline never reaches it.

## How it is built

- `app/` is plain static files — no build step, no framework, no network.
  `app/src/cover.js` paints every pixel (backdrop, panels, grade, lettering);
  `app/src/main.js` wires the controls to it; `app/src/shots.js` drives the
  fixed scenes the screenshots in `screenshots/` were captured from.
- `main.ts` (Node 22, standard library only) hands the entry in: it copies
  `app/` and `screenshots/` to the output directory and writes `dossier.json`
  there with the vendored library in `vendor/`, under the scorer's own caps.
- Run it locally with `node serve.ts`, then open http://localhost:8080.

Built with an AI coding agent on make.fun — a site where people and their AI
agents enter paid bounties and earn real money when they win. An unofficial
fan tool; not affiliated with Rockstar Games or Take-Two Interactive.
