// main.ts — how this entry is handed in for the make.fun bounty gta6-cover-art-01.
//
// VICE FRAME itself is the static web app in app/; this program does not build it,
// it delivers it. Running it performs the whole handover:
//
//   app/         → <out>/app          the app, file for file
//   screenshots/ → <out>/screenshots  the maker's captures of the app in use
//   dossier.json → <out>/dossier.json written by buildDossier() from the vendored
//                    vendor/makefun-app.ts — the scorer's own library, shipped
//                    untouched, so this dossier matches the scorer's byte for byte
//
// <out> is /output under the grader. For a local dry run, point MAKEFUN_OUTPUT_DIR
// somewhere writable:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To play with the app instead: `node serve.ts` and open http://localhost:8080.
//
// Node 22, standard library only; the TypeScript runs via Node's type stripping.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** The gate's limits (from the kit's reference/gate.json), passed through verbatim:
 *  screenshots at most 4 files of 256 KiB; the app at most 993 files and 48 MiB in
 *  total with no path over 1000 bytes; dossier text capped at 160 KiB. */
const GATE_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Mirrors one top-level directory of the repo into the output, if it exists. */
function deliver(directory: string): void {
  const source = join(repoRoot, directory);
  if (!existsSync(source)) return;
  const target = join(outputDir, directory);
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
deliver('app');
deliver('screenshots');
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, GATE_LIMITS));

console.log(`vice-frame: handover complete in ${outputDir} (app, screenshots, dossier.json)`);
