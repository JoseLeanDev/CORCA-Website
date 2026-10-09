import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { pages, legacyRoutes, productionOrigin } from './site-pages.mjs';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:23517';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim(),
  args: ['--no-sandbox'],
});
try {
  for (const info of pages) {
    const response = await fetch(origin + info.route);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert(!html.includes('{{'), `Raw template markers on ${info.route}`);
    assert(html.includes('name="description"'), 'Missing description');
    assert(html.includes(`href="${productionOrigin}${info.route}"`), 'Wrong canonical');
    assert(html.includes('property="og:image"'), 'Missing social image');
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      const page = await browser.newPage({ javaScriptEnabled: false, viewport });
      await page.goto(origin + info.route, { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('h1').count(), 1, `${info.route} h1`);
      assert(await page.locator('header').isVisible(), 'Header invisible without JS');
      const issues = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 2,
        images: [...document.images].filter(img => !img.alt && !img.closest('[aria-hidden="true"]')).map(img => img.src),
        placeholders: document.body.textContent.includes('{{'),
        brokenLinks: [...document.querySelectorAll('a[href]')].filter(a => /\.dc\.html/.test(a.getAttribute('href'))).length,
      }));
      assert(!issues.overflow, `${info.route} overflow at ${viewport.width}`);
      assert.equal(issues.images.length, 0, `${info.route} missing alt`);
      assert(!issues.placeholders);
      assert.equal(issues.brokenLinks, 0);
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + info.route, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body > #dc-root > .sc-host', { timeout: 60000 });
    await page.waitForFunction(() => !document.getElementById('corca-static'));
    assert.equal(await page.title(), info.title);
    assert.equal(errors.length, 0, errors.join('; '));
    if (info.route === '/manufactura') {
      const track = page.locator('.cw-carousel-track');
      const before = await track.getAttribute('style');
      await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
      assert.notEqual(await track.getAttribute('style'), before, 'Product carousel inactive');
    }
    if (info.route === '/distribucion') {
      const carousel = page.locator('#mundi-globales-carousel');
      const viewport = carousel.locator('.cw-brand-carousel-viewport');
      await carousel.scrollIntoViewIfNeeded();
      const before = await viewport.evaluate(el => el.scrollLeft);
      await carousel.locator('button').last().click();
      await page.waitForTimeout(700);
      assert(await viewport.evaluate(el => el.scrollLeft) > before, 'Brand carousel inactive');
    }
    await page.close();
    console.log(`PASS ${info.route}: static HTML, mobile, desktop, interactive runtime`);
  }
  for (const [legacy, route] of Object.entries(legacyRoutes)) {
    const res = await fetch(origin + encodeURI(legacy), { redirect: 'manual' });
    assert.equal(res.status, 301, legacy);
    assert.equal(res.headers.get('location'), route);
  }
  const slow = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const session = await slow.context().newCDPSession(slow);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false, latency: 400, downloadThroughput: 50000, uploadThroughput: 25000,
  });
  await slow.route('**/support.js', route => route.abort());
  await slow.goto(origin + '/quienes-somos', { waitUntil: 'domcontentloaded' });
  assert(await slow.getByText('De la distribución a la manufactura y nuevos mercados', { exact: true }).isVisible());
  assert(!await slow.locator('body').innerText().then(text => text.includes('{{')));
  console.log('PASS slow mobile: 6x CPU, limited network, runtime blocked; content readable');
  await slow.close();
} finally { await browser.close(); }
