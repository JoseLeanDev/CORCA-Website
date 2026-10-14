// Fast, dependency-free integrity/SEO check; this does not generate the website.
import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { routes, redirects } from '../routes.mjs';
const root = path.resolve(import.meta.dirname, '../site');
const titles = new Set();
const assets = new Set();
let origin;
for (const [route, filename] of Object.entries(routes)) {
  const html = await readFile(path.join(root, filename), 'utf8');
  assert(!/\{\{|<x-dc|<sc-for|<sc-if|<image-slot|site-boot|support\.js|text\/x-dc/.test(html), `${route}: obsolete runtime or unresolved content`);
  assert(html.includes(`<html lang="${route.startsWith('/en') ? 'en' : 'es'}"`), `${route}: language`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title && !titles.has(title), `${route}: missing/duplicate title`); titles.add(title);
  for (const marker of ['name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"', 'hreflang="es"', 'hreflang="en"', 'hreflang="x-default"']) assert(html.includes(marker), `${route}: ${marker}`);
  const canonical = new URL(html.match(/rel="canonical"\s+href="([^"]+)"/)?.[1]);
  origin ||= canonical.origin;
  assert.equal(canonical.origin, origin); assert.equal(canonical.pathname, route);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${route}: one h1`);
  assert(html.includes('id="main-content"') && html.includes('class="cw-language-switch"'), `${route}: landmarks and language switch`);
  for (const image of html.matchAll(/<img\b[^>]+>/g)) {
    assert(/\balt="/.test(image[0]) && /\bwidth="\d+"/.test(image[0]) && /\bheight="\d+"/.test(image[0]), `${route}: image attributes`);
  }
  for (const link of html.matchAll(/\bhref="([^"]+)"/g)) {
    const value = link[1].replaceAll('&amp;', '&');
    if (value.startsWith('#')) assert(ids.has(value.slice(1)), `${route}: broken anchor ${value}`);
    else if (value.startsWith('/') && !value.startsWith('/assets/')) {
      const url = new URL(value, origin);
      assert(Object.hasOwn(routes, url.pathname), `${route}: broken link ${value}`);
      assert(!url.hash || url.pathname !== route || ids.has(url.hash.slice(1)), `${route}: broken local anchor`);
    }
  }
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"|url\((?:&quot;|["'])?(\/assets\/[^)"'&]+)(?:&quot;|["'])?\)/g)) {
    assets.add((match[1] || match[2]).replaceAll('&amp;', '&').split('?')[0]);
  }
  if (route.endsWith('contact') || route === '/contacto') {
    assert(html.includes('id="contact-form"') && html.includes('id="contact-status"'), 'Honest contact form status');
    assert(!html.includes('Recibimos su mensaje') && !html.includes('We received your message'), 'No fake confirmation');
  }
}
for (const asset of assets) assert((await stat(path.join(root, asset.slice(1)))).isFile(), `Missing ${asset}`);
for (const filename of await readdir(path.join(root, 'assets'))) {
  assert(!/site-boot|site-language|translations|\.gif$/.test(filename), `Obsolete asset ${filename}`);
}
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
for (const route of Object.keys(routes)) assert(sitemap.includes(`<loc>${origin}${route}</loc>`), `Missing sitemap ${route}`);
assert(robots.includes(`${origin}/sitemap.xml`), 'Robots sitemap URL');
for (const target of Object.values(redirects)) assert(Object.hasOwn(routes, target), `Invalid redirect ${target}`);
const pkg = JSON.parse(await readFile(path.resolve(import.meta.dirname, '../package.json'), 'utf8'));
assert(!pkg.dependencies && !pkg.devDependencies, 'Standalone site must have zero installed dependencies');
process.stdout.write(`Static integrity passed: ${titles.size} pages, both languages, ${assets.size} assets, SEO, navigation and contact state.\n`);
