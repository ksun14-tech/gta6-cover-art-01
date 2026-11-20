// The gta6-cover-art-01 entry program (Node 22, standard library only). The entry itself is the
// VICE FRAME web app in app/ — plain static files a desktop browser runs offline. This program
// hands it in: it copies app/ and screenshots/ from beside this file into the output directory
// and writes the dossier the judge reads, using the vendored make.fun library (vendor/
// makefun-app.ts, the scorer's own copy) so the summary matches the scorer's byte for byte.
//
// Locally, MAKEFUN_OUTPUT_DIR stands in for the grader's /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app, as static files.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// The screenshots (the first by name is the cover the judge leads with).
mkdirSync(join(out, 'screenshots'), { recursive: true });
const shotsDir = join(here, 'screenshots');
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The dossier, under the scorer's own caps (reference/gate.json): at most 4 screenshots of at
// most 256 KiB each, at most 993 app files totalling 48 MiB, no app path over 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`vice-frame: app and screenshots handed in at ${out}`);
