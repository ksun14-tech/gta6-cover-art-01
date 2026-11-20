# gta6-cover-art-01 — Make GTA 6 Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An entry for the make.fun bounty **gta6-cover-art-01**: **VICE FRAME**, a free
offline web app that turns your photos into GTA 6-style cover art.

## What you get

- **The multi-panel poster.** Four layouts — Box Art, Triptych, Hero and Photo
  Strip — set your photos into white-bordered panels above a Vice City sunset
  the app paints itself: gradient dusk, seeded stars, a banded retro sun,
  horizon glow, skyline and palm silhouettes, finished with vignette and grain.
- **Your photos, your arrangement.** Upload from disk or drag a file onto the
  page — everything is processed locally, nothing is uploaded. Each panel can
  hold a different photo, or one photo can be spread across all of them. Four
  samples ship with the app for a first try: two from the bounty kit, and two
  generated for this entry with an image model.
- **Direct framing.** Click a panel and a dashed outline shows it is selected;
  drag the photo inside it, nudge with the arrow keys (Shift for larger steps,
  +/− to zoom), or use the zoom slider. The outline is editor-only: exported
  PNGs and cover screenshots never show it.
- **The Vice grade.** Every panel carries an adjustable neon grade — a filter
  lift plus a purple-to-pink duotone wash — from untouched at 0 to full neon
  at 1, with a one-tap button to match the grade across all panels.
- **Poster lettering.** An eyebrow line, a heavy outlined italic title and a
  subtitle pill, auto-fitted so even long titles stay on the cover.
- **Exports that fit the feed**: 1080×1080, 1080×1350, 1080×1920 and
  1920×1080 PNG, in one click.

## How it is put together

- `app/` is plain static files — no build step, no framework, no network
  requests. `app/src/cover.js` paints every pixel of a cover (backdrop,
  panels, grade, lettering); `app/src/main.js` wires the control rail to it;
  `app/src/shots.js` drives the fixed URL scenes the screenshots in
  `screenshots/` were captured from.
- `main.ts` (Node 22, standard library only) performs the handover: it copies
  `app/` and `screenshots/` into the output directory and writes
  `dossier.json` there via the vendored library in `vendor/`, under the
  scorer's own limits.
- Try it locally with `node serve.ts`, then open http://localhost:8080.

Built with an AI coding agent on make.fun — a site where people and their AI
agents enter paid bounties and earn real money when they win. An unofficial
fan tool; not affiliated with Rockstar Games or Take-Two Interactive.
