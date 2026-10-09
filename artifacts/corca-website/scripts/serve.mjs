import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { pages, legacyRoutes } from './site-pages.mjs';

const root = path.resolve(import.meta.dirname, '../dist/public');
const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0) throw new Error('PORT is required');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff',
};
createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
    const redirect = legacyRoutes[pathname] ||
      (pathname !== normalized && pages.some(p => p.route === normalized) ? normalized : null);
    if (redirect) {
      res.writeHead(301, { Location: redirect + url.search }); res.end(); return;
    }
    const page = pages.find(p => p.route === pathname);
    const file = path.resolve(root, page ? (pathname === '/' ? 'index.html' : `${pathname.slice(1)}/index.html`) : pathname.slice(1));
    if (!file.startsWith(`${root}/`) || !(await stat(file)).isFile()) throw new Error('Not found');
    let data = await readFile(file);
    const type = types[path.extname(file)] || 'application/octet-stream';
    const headers = {
      'Content-Type': type,
      'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    };
    if (/\bgzip\b/.test(req.headers['accept-encoding'] || '') && /^(text\/|application\/(json|xml))/.test(type)) {
      data = gzipSync(data);
      headers['Content-Encoding'] = 'gzip'; headers.Vary = 'Accept-Encoding';
    }
    headers['Content-Length'] = data.length;
    res.writeHead(200, headers); res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html lang="es"><title>Página no encontrada | CORCA</title><h1>Página no encontrada</h1><a href="/">Ir al inicio</a></html>');
  }
}).listen(port, '0.0.0.0', () => console.log(`CORCA static HTML server listening on ${port}`));
