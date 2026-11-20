// main.ts — the handover program for this make.fun entry (gta6-cover-art-01).
//
// The deliverable itself is the static web app in app/; nothing here builds or
// bundles it. This program simply delivers it the way the scorer expects:
//
//   app/         →  <out>/app          mirrored file for file
//   screenshots/ →  <out>/screenshots  the maker's stills of the app in use
//   dossier.json →  <out>/dossier.json produced by buildDossier() from
//                    vendor/makefun-app.ts — the scorer's own library, shipped
//                    untouched, so the dossier it writes here is the dossier
//                    the scorer would write from the same files
//
// <out> is $MAKEFUN_OUTPUT_DIR when that is set, and /output under the grader.
// A local dry run:   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To try the app:    node serve.ts, then open http://localhost:8080
//
// Node 22, standard library only; the types are stripped by Node itself.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** The scorer's ceilings, forwarded to the dossier library exactly as the
 *  kit's gate reference publishes them: at most 4 screenshots of at most
 *  256 KiB each; the app at most 993 files and 48 MiB in total, no path over
 *  1000 bytes; the dossier's text capped at 160 KiB. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

/** Directories that make up the handover, in the order they are shipped. */
const PARTS = ['app', 'screenshots'] as const;

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Mirrors one named directory from the repo into the output directory.
 *  A part that does not exist is skipped rather than treated as an error. */
function ship(name: string): void {
  const from = join(root, name);
  if (!existsSync(from)) return;
  const to = join(outDir, name);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
for (const part of PARTS) ship(part);
const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Report the dossier's size alongside the delivery: it is the one artefact
// whose size the gate caps, so seeing it in the log makes a dry run useful.
console.log(
  `vice-frame: delivered app/ + screenshots/ + dossier.json `
  + `(${Buffer.byteLength(dossier)} bytes) to ${outDir}`,
);
