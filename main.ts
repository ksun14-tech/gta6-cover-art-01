// main.ts — the handover program for the make.fun bounty gta6-cover-art-01.
//
// The entry itself is VICE FRAME, the offline web app under app/ (plain static files, no
// build step). This program's whole job is to hand that app in the way the scorer expects:
//
//   1. copy app/         → <out>/app          (the app, exactly as authored)
//   2. copy screenshots/ → <out>/screenshots  (the maker's own captures of it in use)
//   3. write <out>/dossier.json with buildDossier() from the vendored library
//      (vendor/makefun-app.ts — the scorer's own copy, shipped unchanged, so the
//      dossier it writes here is byte-for-byte the one the scorer writes there)
//
// <out> is the grader's /output; locally, MAKEFUN_OUTPUT_DIR stands in for it:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To try the app itself instead: `node serve.ts`, then open http://localhost:8080.
//
// Node 22, standard library only; the .ts runs through Node's type stripping.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

/** The scorer's own limits (the kit's reference/gate.json), handed to buildDossier as-is:
 *  at most 4 screenshots of at most 256 KiB each; at most 993 app files totalling 48 MiB;
 *  no app path longer than 1000 bytes; the dossier's text capped at 160 KiB. */
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies one directory tree from the repository into the output, creating it first. */
function handOver(name: string): void {
  const from = join(repoDir, name);
  if (!existsSync(from)) return;
  mkdirSync(join(outDir, name), { recursive: true });
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
handOver('app');
handOver('screenshots');
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_LIMITS));

console.log(`vice-frame: app, screenshots and dossier handed in at ${outDir}`);
