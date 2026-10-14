// Optional deployment preparation, never needed to render or serve the website.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { routes } from '../routes.mjs';
const supplied = process.argv[2];
if (!supplied) throw new Error('Usage: node scripts/set-domain.mjs https://your-domain.example');
const url = new URL(supplied);
if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('Use a public HTTPS origin without a path, query or credentials');
}
const root = path.resolve(import.meta.dirname, '../site');
const home = await readFile(path.join(root, 'index.html'), 'utf8');
const old = new URL(home.match(/rel="canonical"\s+href="([^"]+)"/)[1]).origin;
for (const file of [...Object.values(routes), 'robots.txt', 'sitemap.xml']) {
  const filename = path.join(root, file);
  await writeFile(filename, (await readFile(filename, 'utf8')).replaceAll(old, url.origin));
}
process.stdout.write(`Canonical, hreflang, social metadata, sitemap and robots updated to ${url.origin}\n`);
