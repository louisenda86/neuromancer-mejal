/* Minimal static server for local verification. Serves the project root with
   the same content types the worker uses, so what you check locally is what
   ships. No dependencies. */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 4181;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (pathname === '/og.png') pathname = '/public/og.png';


  const target = join(root, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!target.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const stats = statSync(target);
    if (stats.isDirectory()) throw new Error('directory');
    response.writeHead(200, {
      'content-type': MIME[extname(target)] || 'application/octet-stream',
      'content-length': stats.size,
      'cache-control': 'no-store'
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}).listen(port, () => {
  console.log(`neuromancer // serving ${root} on http://localhost:${port}`);
});
