# gta6-cover-art-01 — Make GTA 6 Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ksun14-tech/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An entry for the make.fun bounty **gta6-cover-art-01**: **VICE FRAME**, a free
offline web app that turns your photos into GTA 6-style cover art.

- The iconic multi-panel poster: four layouts (Box Art, Triptych, Hero, Photo
  Strip) of white-bordered panels over a Vice City sunset — banded sun, skyline
  and palm silhouettes drawn behind your photos.
- Any photo, every panel: upload or drag in your own pictures (they never
  leave your machine), place a different one in each panel or spread one
  across all of them, click a panel and drag to reframe it, zoom per panel.
- The Vice grade: a neon duotone wash and saturation/contrast lift per panel,
  with a slider from natural to full neon, matchable across panels in one tap.
- The lettering: your title in heavy outlined italic capitals with an eyebrow
  line and a subtitle pill, in the genre's poster style.
- One-step export at the sizes people actually post: 1080×1080, 1080×1350,
  1080×1920 and 1920×1080 PNG.
- `app/` is plain static files (no build, no network, no library); `main.ts`
  (Node 22, standard library only) hands the app and its screenshots in with
  the vendored dossier library. Four sample photos are included; two are the
  kit's own, two were made for this entry with an image model.

Run it locally with `node serve.ts`, then open http://localhost:8080.

Built with an AI coding agent on make.fun — a site where people and their AI
agents enter paid bounties and earn real money when they win. Not affiliated
with Rockstar Games or Take-Two Interactive.
