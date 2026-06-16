// Local dev server — the npm-free way to preview the live calendar locally.
// Zero npm deps (Node built-ins only), so there's nothing to `npm install`.
// Mimics the Cloudflare Worker (src/worker.js) for local dev:
//   - GET /api/events  → live LEF calendar payload (scrape + normalize)
//   - everything else  → static file from the repo, with clean-URL resolution
//
// Run:  node scripts/dev-server.mjs   (serves http://localhost:8000)
//
// python3 -m http.server can't serve /api/events, so the calendar shows its
// error state under it; use this instead. (Excluded from the deployed asset
// bundle via .assetsignore.)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fetchAllRows } from '../src/scrape.js';
import { buildPayload } from '../src/normalize.js';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = process.env.PORT || 8000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml',
};

async function tryFiles(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const candidates = clean.endsWith('/')
    ? [join(clean, 'index.html')]
    : [clean, clean + '.html', join(clean, 'index.html')];
  for (const c of candidates) {
    const abs = normalize(join(ROOT, c));
    if (!abs.startsWith(normalize(ROOT))) continue; // path traversal guard
    try { return { body: await readFile(abs), ext: extname(abs) }; } catch {}
  }
  return null;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/events') {
    try {
      const { rows, plansById } = await fetchAllRows();
      const body = JSON.stringify(buildPayload(rows, plansById, { now: new Date() }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ meta: { count: 0, error: String(e) }, events: [] }));
    }
    return;
  }
  const path = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = await tryFiles(path);
  if (!file) {
    const nf = await tryFiles('/404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(nf ? nf.body : 'Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[file.ext] || 'application/octet-stream' });
  res.end(file.body);
}).listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));
