import { chromium } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pages, legacyRoutes, productionOrigin } from './site-pages.mjs';

const root = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(root, 'public');
const output = path.join(publicDir, 'prerender');
await mkdir(output, { recursive: true });
await mkdir(path.join(publicDir, '_templates'), { recursive: true });

// The original GIF is a map, not essential animation. Ship a small static WebP.
// The opening GIF frame is blank; frame 100 contains the full coverage map.
await sharp(path.join(root, 'assets/mapa-guatemala.gif'), { page: 100 })
  .resize({ width: 960, withoutEnlargement: true }).webp({ quality: 85 })
  .toFile(path.join(publicDir, 'assets/mapa-guatemala.webp'));
const logo = await sharp(path.join(root, 'assets/corca-logo-navy.png'))
  .resize({ width: 760, height: 240, fit: 'inside' }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#f6f7f9' } })
  .composite([{ input: logo, gravity: 'centre' }]).webp({ quality: 90 })
  .toFile(path.join(publicDir, 'assets/corca-social.webp'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' };
// Independent local source server: never depends on the preview workflow.
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html';
    const file = path.resolve(root, name);
    if (!file.startsWith(`${root}/`)) throw new Error('Invalid path');
    let content;
    try { content = await readFile(path.join(publicDir, name)); }
    catch { content = await readFile(file); }
    // Prefer the authoritative editable HTML over its public mirror.
    if (pages.some(page => page.source === name)) content = await readFile(file);
    res.setHeader('Content-Type', types[path.extname(name)] || 'application/octet-stream');
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.CHROMIUM_PATH || execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim();
let browser;
try {
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  for (const pageInfo of pages) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/${encodeURIComponent(pageInfo.source)}`);
    await page.waitForSelector('#dc-root > .sc-host', { timeout: 60000 });
    // Resolve animated counters to their final values before serializing.
    await page.evaluate(() => window.__dcSetProps(window.__dcRootName(), { contadoresAnimados: false }));
    await page.waitForTimeout(300);
    const snapshot = await page.evaluate(async ({ pageInfo, legacyRoutes, productionOrigin }) => {
      const host = document.querySelector('#dc-root > .sc-host');
      host.querySelectorAll('[data-reveal]').forEach(el => {
        el.style.opacity = '1'; el.style.transform = 'none';
      });
      // Add the canonical route and asset paths to static HTML AND runtime templates.
      for (const anchor of host.querySelectorAll('a[href]')) {
        const href = anchor.getAttribute('href');
        const legacy = decodeURIComponent(href.split('#')[0]).replace(/^\.?\//, '');
        if (legacyRoutes[`/${legacy}`]) anchor.setAttribute('href', legacyRoutes[`/${legacy}`]);
        if (href === '#inicio') anchor.setAttribute('href', '/');
        if (anchor.textContent.trim() === 'Sea nuestro distribuidor') anchor.setAttribute('href', '/contacto');
      }
      const descriptions = {
        'slot-hero-planta.webp': 'Planta de manufactura de fideos Chao Mein de CORCA',
        'slot-manufactura-linea.webp': 'Línea de producción de fideos Chao Mein',
        'slot-mf-hero.webp': 'Manufactura de fideos Chao Mein en la planta de CORCA',
        'slot-como-trabajamos.webp': 'Operación logística y distribución de CORCA',
        'slot-distribucion-hero.webp': 'Distribución de productos de consumo masivo de CORCA',
      };
      await Promise.all([...host.querySelectorAll('img')].map(async img => {
        let src = img.getAttribute('src');
        if (src?.includes('mapa-guatemala.gif')) src = src.replace('.gif', '.webp');
        if (src && !/^(https?:|data:|\/)/.test(src)) src = `/${src.replace(/^\.\//, '')}`;
        if (src) img.setAttribute('src', src);
        const decorative = img.closest('[aria-hidden="true"]');
        if (!img.getAttribute('alt') && !decorative) {
          const file = (src || '').split('/').pop();
          const context = img.closest('.rg-brand')?.querySelector('h3')?.textContent
            || img.closest('article')?.querySelector('h3')?.textContent;
          img.alt = descriptions[file] || context || file?.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || 'CORCA';
        }
        // Preserve intrinsic ratio; inline/CSS dimensions still control the layout.
        if (img.naturalWidth && img.naturalHeight) {
          img.setAttribute('width', img.naturalWidth);
          img.setAttribute('height', img.naturalHeight);
          if (img.style.height && !img.style.width) img.style.width = 'auto';
          if (img.style.width && !img.style.height) img.style.height = 'auto';
        }
        const hero = src?.includes('hero');
        img.loading = hero || img.closest('header') ? 'eager' : 'lazy';
        img.decoding = 'async';
        if (hero) img.setAttribute('fetchpriority', 'high');
      }));
      for (const el of host.querySelectorAll('*')) {
        for (const attr of [...el.attributes]) {
          if (attr.name.startsWith('data-dc-')) el.removeAttribute(attr.name);
        }
      }
      const content = host.outerHTML;
      if (content.includes('{{')) throw new Error('Unresolved template marker');
      const styles = [...document.head.querySelectorAll('style, link[rel="stylesheet"], link[rel="preconnect"]')]
        .map(el => {
          const clone = el.cloneNode(true);
          if (clone.getAttribute('href')?.startsWith('assets/')) clone.setAttribute('href', `/${clone.getAttribute('href')}`);
          return clone.outerHTML;
        }).join('\n');
      return { content, styles };
    }, { pageInfo, legacyRoutes, productionOrigin });
    if (errors.length) throw new Error(`${pageInfo.route}: ${errors.join('; ')}`);
    const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const url = productionOrigin + pageInfo.route;
    const image = `${productionOrigin}/assets/corca-social.webp`;
    const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(pageInfo.title)}</title>
<meta name="description" content="${escape(pageInfo.description)}">
<link rel="icon" type="image/png" href="/assets/corca-logo-navy.png">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="es_GT">
<meta property="og:site_name" content="CORCA">
<meta property="og:title" content="${escape(pageInfo.title)}">
<meta property="og:description" content="${escape(pageInfo.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="CORCA — Corporación Caraliant, S.A.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(pageInfo.title)}">
<meta name="twitter:description" content="${escape(pageInfo.description)}">
<meta name="twitter:image" content="${image}">
${snapshot.styles}
<style>#corca-static{height:auto}body.corca-booting>#dc-root{display:none} [data-reveal]{opacity:1!important}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto!important}*{animation-duration:.01ms!important;animation-iteration-count:1!important}}</style>
<script defer src="/assets/site-boot.js" data-template="/_templates/${encodeURIComponent(pageInfo.source)}"></script>
</head><body><div id="corca-static">${snapshot.content}</div></body></html>`;
    const folder = path.join(output, pageInfo.route === '/' ? '' : pageInfo.route.slice(1));
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, 'index.html'), html);
    // Keep editable source intact, normalize URLs only in its runtime copy.
    let template = await readFile(path.join(root, pageInfo.source), 'utf8');
    for (const [legacy, route] of Object.entries(legacyRoutes)) template = template.replaceAll(legacy.slice(1), route);
    template = template.replaceAll('href="#inicio"', 'href="/"')
      .replaceAll('href="#contacto"', 'href="/contacto"')
      .replaceAll('assets/mapa-guatemala.gif', 'assets/mapa-guatemala.webp')
      .replaceAll('src="assets/', 'src="/assets/')
      .replaceAll(" 'assets/", " '/assets/")
      .replaceAll("'assets/", "'/assets/")
      .replaceAll('href="assets/', 'href="/assets/')
      .replaceAll('src="./image-slot.js"', 'src="/image-slot.js"');
    const alts = {
      'slot-hero-planta.webp': 'Planta de manufactura de fideos Chao Mein de CORCA',
      'slot-manufactura-linea.webp': 'Línea de producción de fideos Chao Mein',
      'slot-mf-hero.webp': 'Manufactura de fideos Chao Mein en la planta de CORCA',
      'slot-como-trabajamos.webp': 'Operación logística y distribución de CORCA',
    };
    template = template.replace(/<img\b[^>]*>/g, tag => {
      const src = tag.match(/\bsrc="([^"]+)"/)?.[1] || '';
      if (src === '{{ p.img }}') return tag.replace('alt=""', 'alt="{{ p.nombre }}"');
      if (!src || src.includes('{{')) return tag;
      const file = src.split('/').pop();
      const alt = alts[file] || file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      if (/\balt=""/.test(tag)) return tag.replace('alt=""', `alt="${alt}"`);
      if (!/\balt=/.test(tag)) return tag.replace('<img', `<img alt="${alt}"`);
      return tag;
    });
    template = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(pageInfo.title)}</title>`);
    // No counter reset after the static first paint.
    template = template.replaceAll('this.props.contadoresAnimados ?? true', 'this.props.contadoresAnimados ?? false');
    await writeFile(path.join(publicDir, '_templates', pageInfo.source), template);
    console.log(`Prerendered ${pageInfo.route}`);
    await page.close();
  }
  await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /_templates/\nDisallow: /prerender/\nSitemap: ${productionOrigin}/sitemap.xml\n`);
  await writeFile(path.join(publicDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${productionOrigin}${p.route}</loc></url>`).join('')}</urlset>\n`);
  console.log(`Map WebP: ${(await stat(path.join(publicDir, 'assets/mapa-guatemala.webp'))).size} bytes`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
