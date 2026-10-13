import { readFileSync, existsSync, cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { Plugin } from 'vite';
// @ts-ignore Plain JS shared configuration.
import { pages, localizedPages, legacyRoutes } from './site-pages.mjs';

export function staticSitePlugin(root: string): Plugin {
  function middleware(req: any, res: any, next: () => void) {
    let url: URL;
    try { url = new URL(req.url, 'http://localhost'); } catch { return next(); }
    const pathname = decodeURIComponent(url.pathname);
    const legacy = legacyRoutes[pathname];
    const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
    if (legacy || (pathname !== normalized && localizedPages.some((p: any) => p.route === normalized))) {
      res.writeHead(301, { Location: (legacy || normalized) + url.search }); res.end(); return;
    }
    if (!localizedPages.some((p: any) => p.route === pathname)) return next();
    const file = path.join(root, 'public/prerender', pathname.slice(1), 'index.html');
    if (!existsSync(file)) {
      res.writeHead(503); res.end('Static pages missing. Run pnpm run seo:generate.'); return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(readFileSync(file));
  }
  return {
    name: 'corca-static-site',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return readFileSync(path.join(root, 'public/prerender/index.html'), 'utf8');
      },
    },
    configureServer(server) {
      server.middlewares.use(middleware);
      let timer: ReturnType<typeof setTimeout>;
      let running = false;
      let pending = false;
      const generate = () => {
        if (running) { pending = true; return; }
        running = true;
        const child = spawn(process.execPath, [path.join(root, 'scripts/prerender.mjs')], { cwd: root, stdio: 'inherit' });
        child.on('exit', code => {
          running = false;
          if (code === 0) server.ws.send({ type: 'full-reload' });
          else server.config.logger.error('Static generation failed. Keeping previous readable pages.');
          if (pending) { pending = false; generate(); }
        });
      };
      server.watcher.on('change', file => {
        if (!pages.some((p: any) => path.join(root, p.source) === file)
          && file !== path.join(root, 'assets/responsive.css')
          && file !== path.join(root, 'content/en.json')
          && file !== path.join(root, 'public/assets/site-language.js')) return;
        clearTimeout(timer);
        timer = setTimeout(generate, 300);
      });
    },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
    closeBundle() {
      const generated = path.join(root, 'public/prerender');
      const dist = path.join(root, 'dist/public');
      if (!existsSync(generated)) throw new Error('Run seo:generate before building.');
      cpSync(generated, dist, { recursive: true });
      rmSync(path.join(dist, 'prerender'), { recursive: true, force: true });
      // Public source pages are served by redirects, not duplicated in production.
      for (const legacy of Object.keys(legacyRoutes)) {
        if (legacy !== '/index.html') rmSync(path.join(dist, legacy.slice(1)), { force: true });
      }
      rmSync(path.join(dist, 'assets/mapa-guatemala.gif'), { force: true });
    },
  };
}
