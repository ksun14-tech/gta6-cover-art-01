// serve.ts — a pocket static server for trying VICE FRAME locally.
//
//   node serve.ts              → http://localhost:8080
//   node serve.ts --port 8932  → http://localhost:8932
//
// It serves only the files under app/, refuses anything that resolves outside that
// directory, and caches nothing (so an edit shows on the next refresh). Node 22,
// standard library only. It exists for local development and screenshot sessions;
// the entry itself is the static app, which any static host can serve as-is.

import { createReadStream, statSync, type Stats } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const DEFAULT_PORT = 8080;

/** Content types for everything the app (and its samples) can contain. */
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

/** The --port value if it is a usable port number, else the default. */
function chosenPort(argv: string[]): number {
  const flag = argv.indexOf('--port');
  const value = flag === -1 ? NaN : Number(argv[flag + 1]);
  return Number.isInteger(value) && value > 0 && value < 65536 ? value : DEFAULT_PORT;
}

/** Maps a request path to a file inside app/, or null when it tries to climb out. */
function fileInsideApp(pathname: string): string | null {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '');
  const candidate = join(APP_ROOT, relative === '' || relative === '.' ? 'index.html' : relative);
  return candidate === APP_ROOT || candidate.startsWith(APP_ROOT + sep) ? candidate : null;
}

function sendText(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function sendFile(res: ServerResponse, path: string, stat: Stats): void {
  res.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': 'no-store',
  });
  createReadStream(path).pipe(res);
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const path = fileInsideApp(pathname);
  if (path === null) {
    sendText(res, 403, 'forbidden');
    return;
  }
  let stat: Stats;
  try {
    stat = statSync(path);
  } catch {
    sendText(res, 404, 'not found');
    return;
  }
  if (stat.isDirectory()) {
    sendText(res, 403, 'forbidden');
    return;
  }
  sendFile(res, path, stat);
});

const port = chosenPort(process.argv.slice(2));
server.listen(port, () => {
  console.log(`vice-frame: serving app/ at http://localhost:${port}`);
});
