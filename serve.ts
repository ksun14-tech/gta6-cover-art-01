// serve.ts — a minimal static file server for previewing VICE FRAME locally.
//
//   node serve.ts               serves app/ at http://localhost:8080
//   node serve.ts --port 8932   serves app/ at http://localhost:8932
//
// Guarantees kept deliberately small: only files physically inside app/ are served
// (a path that resolves outside it is refused), directories are never listed, and
// responses are marked no-store so edits show up on the next refresh. Node 22,
// standard library only. The shipped app needs no server at all — any static host
// will do; this exists for development and for capturing the entry's screenshots.

import { createReadStream, statSync, type Stats } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const FALLBACK_PORT = 8080;

/** MIME types for every file kind the app ships. */
const MIME_TYPES: Record<string, string> = {
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

/** Reads --port from argv; anything unusable falls back to the default port. */
function portFromArgs(argv: string[]): number {
  const flagAt = argv.indexOf('--port');
  const parsed = flagAt === -1 ? NaN : Number(argv[flagAt + 1]);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : FALLBACK_PORT;
}

/** Resolves a URL pathname to a file inside app/, or null if it escapes the root. */
function resolveInsideApp(pathname: string): string | null {
  const cleaned = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '');
  const target = join(APP_DIR, cleaned === '' || cleaned === '.' ? 'index.html' : cleaned);
  return target === APP_DIR || target.startsWith(APP_DIR + sep) ? target : null;
}

function replyText(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function replyFile(res: ServerResponse, path: string, stat: Stats): void {
  res.writeHead(200, {
    'content-type': MIME_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': 'no-store',
  });
  createReadStream(path).pipe(res);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const path = resolveInsideApp(pathname);
  if (path === null) {
    replyText(res, 403, 'forbidden');
    return;
  }
  let stat: Stats;
  try {
    stat = statSync(path);
  } catch {
    replyText(res, 404, 'not found');
    return;
  }
  if (stat.isDirectory()) {
    replyText(res, 403, 'forbidden');
    return;
  }
  replyFile(res, path, stat);
});

const port = portFromArgs(process.argv.slice(2));
server.listen(port, () => {
  console.log(`vice-frame: app/ is live at http://localhost:${port}`);
});
