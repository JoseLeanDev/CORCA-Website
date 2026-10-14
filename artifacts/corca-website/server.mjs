// Standalone static server. Only Node.js built-ins; there is no API or mail endpoint.
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { routes, redirects } from './routes.mjs';

const root = path.join(import.meta.dirname, 'site');
const zip = promisify(gzip);
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};
function errorPage(res, method, status, english = false) {
  const title = status === 404
    ? (english ? 'Page not found' : 'Página no encontrada')
    : (english ? 'Request unavailable' : 'Solicitud no disponible');
  const content = Buffer.from(`<!doctype html><html lang="${english ? 'en' : 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | CORCA</title></head><body><h1>${title}</h1><a href="${english ? '/en' : '/'}">${english ? 'Go to home' : 'Ir al inicio'}</a></body></html>`);
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8', 'Content-Length': content.length,
    'Cache-Control': 'no-store', ...(status === 405 ? { Allow: 'GET, HEAD' } : {}),
  });
  res.end(method === 'HEAD' ? undefined : content);
}
export const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  let pathname;
  let search;
  try {
    const url = new URL(req.url, 'http://static.invalid');
    pathname = decodeURIComponent(url.pathname);
    search = url.search;
    if (/[\u0000-\u001f\\]/.test(pathname)) throw new Error('Invalid URL');
  } catch { errorPage(res, req.method, 400); return; }
  const english = /^\/en(?:\/|$)/.test(pathname);
  if (!['GET', 'HEAD'].includes(req.method)) {
    // In particular, a POST cannot return a fake success for the unconfigured form.
    req.resume();
    errorPage(res, req.method, 405, english);
    return;
  }
  const trimmed = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const target = redirects[pathname] || redirects[trimmed] ||
    (pathname !== trimmed && Object.hasOwn(routes, trimmed) ? trimmed : null);
  if (target) { res.writeHead(301, { Location: target + search, 'Cache-Control': 'no-cache' }); res.end(); return; }
  const page = Object.hasOwn(routes, pathname) ? routes[pathname] : null;
  // Serve only pages and public resources, never source/config/scripts/uploads.
  if (!page && !pathname.startsWith('/assets/') && !['/robots.txt', '/sitemap.xml'].includes(pathname)) {
    errorPage(res, req.method, 404, english); return;
  }
  try {
    const file = path.resolve(root, page || pathname.slice(1));
    if (!file.startsWith(root + path.sep)) { errorPage(res, req.method, 404, english); return; }
    const resolved = await realpath(file);
    if (!resolved.startsWith(root + path.sep)) { errorPage(res, req.method, 404, english); return; }
    const info = await stat(resolved);
    if (!info.isFile()) { errorPage(res, req.method, 404, english); return; }
    let data = await readFile(resolved);
    const type = types[path.extname(resolved)] || 'application/octet-stream';
    const etag = `W/"${createHash('sha256').update(data).digest('hex').slice(0, 24)}"`;
    const compressible = /^(text\/|application\/xml)/.test(type);
    const headers = {
      'Content-Type': type, ETag: etag, 'Last-Modified': info.mtime.toUTCString(),
      'Cache-Control': page ? 'no-cache' : 'public, max-age=3600',
      ...(compressible ? { Vary: 'Accept-Encoding' } : {}),
    };
    if ((req.headers['if-none-match'] || '').split(',').map(v => v.trim()).includes(etag)) {
      res.writeHead(304, headers); res.end(); return;
    }
    const acceptsGzip = (req.headers['accept-encoding'] || '').split(',').some(value => {
      const [name, quality] = value.trim().split(';');
      return name === 'gzip' && (!quality || Number(quality.trim().replace(/^q=/, '')) > 0);
    });
    if (compressible && acceptsGzip) { data = await zip(data); headers['Content-Encoding'] = 'gzip'; }
    headers['Content-Length'] = data.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) errorPage(res, req.method, 404, english);
    else {
      process.stderr.write(`Static file read failed: ${error.code || 'unknown'}\n`);
      errorPage(res, req.method, 500, english);
    }
  }
});
server.listen(port, '0.0.0.0', () => process.stdout.write(`CORCA: static HTML server on port ${port}\n`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
});
