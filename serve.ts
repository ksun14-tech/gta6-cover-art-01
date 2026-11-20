// serve.ts — a small static server for running VICE FRAME on this machine.
//
//   node serve.ts               →  app/ at http://localhost:8080
//   node serve.ts --port 8932   →  app/ at http://localhost:8932
//
// Deliberately boring, and deliberately strict about two things: a request
// path is only ever answered with a file physically inside app/ (anything
// that resolves outside it is refused), and directories are never listed.
// Responses carry no-store so an edit shows up on the next refresh. The app
// itself needs no server — any static host will do; this one exists for
// development and for capturing the entry's screenshots.
//
// Node 22, standard library only.

import { createReadStream, statSync, type Stats } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const DEFAULT_PORT = 8080;

/** Content types for the file kinds the app ships; anything else is binary. */
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

/** The port named by --port, or the default when the flag is absent or the
 *  value is not a usable port number. */
function wantedPort(argv: string[]): number {
  const at = argv.indexOf('--port');
  const parsed = at === -1 ? NaN : Number(argv[at + 1]);
  const usable = Number.isInteger(parsed) && parsed > 0 && parsed < 65536;
  return usable ? parsed : DEFAULT_PORT;
}

/** Maps a URL pathname to a file inside app/, or null when the path would
 *  escape the app root. A bare "/" (or an empty remainder) means index.html. */
function confine(pathname: string): string | null {
  const cleaned = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '');
  const target = join(APP_ROOT, cleaned === '' || cleaned === '.' ? 'index.html' : cleaned);
  return target === APP_ROOT || target.startsWith(APP_ROOT + sep) ? target : null;
}

/** Sends a short plain-text response (used for every refusal). */
function refuse(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

/** Streams one verified file with its content type and an exact length. */
function streamFile(res: ServerResponse, path: string, stat: Stats): void {
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': 'no-store',
  });
  createReadStream(path).pipe(res);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const path = confine(pathname);
  if (path === null) {
    refuse(res, 403, 'forbidden');
    return;
  }
  let stat: Stats;
  try {
    stat = statSync(path);
  } catch {
    refuse(res, 404, 'not found');
    return;
  }
  if (stat.isDirectory()) {
    refuse(res, 403, 'forbidden');
    return;
  }
  streamFile(res, path, stat);
});

const port = wantedPort(process.argv.slice(2));
server.listen(port, () => {
  console.log(`vice-frame: serving app/ at http://localhost:${port}`);
});
