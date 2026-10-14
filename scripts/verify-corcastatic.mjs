// Workspace-only browser/HTTP regression checks. Not part of the client site.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { routes, redirects } from '../artifacts/corca-website/routes.mjs';
const base = process.env.CORCA_TEST_URL || 'http://127.0.0.1:23517';
const output = 'generated-artifacts/corca-verification';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim(),
  headless: true, args: ['--no-sandbox'],
});
const errors = [];
try {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const [route, file] of Object.entries(routes)) {
      const response = await page.goto(base + route, { waitUntil: 'load' });
      assert.equal(response.status(), 200, route);
      const html = await response.text();
      assert(!/\{\{|support\.js|site-boot|ReactDOM|babel|@vite/.test(html), `${route}: runtime removed`);
      await page.locator('h1').waitFor({ state: 'visible' });
      assert.equal(await page.locator('h1').count(), 1);
      for (const width of [360, 390, 768, 900, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(50);
        const measured = await page.evaluate(() => ({
          actual: document.documentElement.scrollWidth,
          expected: window.innerWidth,
          title: document.querySelector('h1').textContent.trim(),
          content: document.querySelector('main').textContent.length,
        }));
        assert(measured.content > 1500, `${route}: static content missing`);
        assert(measured.actual <= measured.expected + 1, `${route} JS=${javaScriptEnabled} at ${width}px: overflow ${measured.actual}px`);
      }
      if (javaScriptEnabled && !route.startsWith('/en')) {
        const name = file === 'index.html' ? 'home' : route.slice(1);
        await page.screenshot({ path: `${output}/${name}-desktop.png` });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: `${output}/${name}-mobile.png` });
      }
      console.log(`PASS ${route} JS=${javaScriptEnabled} all six screen sizes`);
    }
    await context.close();
  }
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/manufactura');
  const carousel = page.locator('#manufacturing-products');
  const next = page.locator('#productos [data-carousel-direction="1"]');
  const prev = page.locator('#productos [data-carousel-direction="-1"]');
  assert.equal(await page.locator('.cw-carousel-track > div').count(), 7);
  assert.equal(await page.locator('.cw-carousel-dots button').count(), 4);
  await next.click();
  await page.waitForTimeout(100);
  assert(await carousel.evaluate(element => element.scrollLeft) > 100);
  await page.locator('.cw-carousel-dots button').last().click();
  await page.waitForTimeout(100);
  assert(await next.isDisabled());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.cw-carousel-dots button').count(), 7);
  await page.locator('.cw-carousel-dots button').last().click();
  await page.waitForTimeout(100);
  assert(await next.isDisabled());
  assert(await carousel.evaluate(element => Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) < 3));
  await prev.click();
  await page.waitForTimeout(100);
  assert(!(await next.isDisabled()));

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(base + '/distribucion');
  for (const [id, count] of [['sabrocronchis-carousel', 5], ['mundi-globales-carousel', 17]]) {
    const group = page.locator('#' + id);
    assert.equal(await group.locator('.cw-brand-carousel-slide').count(), count);
    const viewport = group.locator('.cw-brand-carousel-viewport');
    const visible = await viewport.evaluate(element => [...element.querySelectorAll('.cw-brand-carousel-slide')].filter(slide => {
      const item = slide.getBoundingClientRect(); const bounds = element.getBoundingClientRect();
      return item.left >= bounds.left - 1 && item.right <= bounds.right + 1;
    }).length);
    assert.equal(visible, 4, id + ': four products per desktop view');
    const forward = group.locator('[data-carousel-direction="1"]');
    for (let i = 0; i < count; i++) {
      if (await forward.isDisabled()) break;
      await forward.click(); await page.waitForTimeout(50);
    }
    assert(await forward.isDisabled(), id + ': end reached');
    assert(await viewport.evaluate(element => Math.abs(element.scrollLeft - (element.scrollWidth - element.clientWidth)) < 3));
  }
  console.log('PASS manufacturing and distribution carousel controls, end bounds and resize');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/manufactura');
  await page.locator('.cw-menu-toggle').click();
  assert(await page.locator('#cw-nav-check').isChecked());
  await page.locator('#site-navigation .cw-contact-mobile').click();
  assert.equal(new URL(page.url()).pathname, '/contacto');
  await page.locator('.cw-language-switch a[href="/en/contact"]').click();
  assert.equal(new URL(page.url()).pathname, '/en/contact');
  const form = page.locator('#contact-form');
  await form.locator('input[name="name"]').fill('Test Visitor');
  await form.locator('input[name="email"]').fill('invalid-email');
  await form.locator('textarea[name="message"]').fill('Testing the native contact form.');
  assert(!(await form.evaluate(element => element.checkValidity())), 'Native email validation');
  await form.locator('.contact-topic').nth(1).click();
  assert(await form.locator('input[value="distribution"]').isChecked(), 'Native topic radio');
  await form.locator('input[name="email"]').fill('visitor@example.com');
  await form.locator('input[name="phone"]').fill('5551234567');
  const submissions = [];
  page.on('request', request => { if (request.method() === 'POST') submissions.push(request.url()); });
  await form.locator('[type="submit"]').click();
  assert((await page.locator('#contact-status').textContent()).includes('has not been sent'));
  assert.equal(await form.locator('textarea[name="message"]').inputValue(), 'Testing the native contact form.');
  assert.deepEqual(submissions, [], 'No API or mail request when delivery is unconfigured');
  await page.locator('.cw-language-switch a[href="/contacto"]').click();
  assert.equal(new URL(page.url()).pathname, '/contacto');
  await page.locator('.cw-menu-toggle').click();
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#cw-nav-check').isChecked()), 'Escape closes native mobile menu');
  console.log('PASS mobile menu/contact journey, ES/EN route switch, native form validation and honest no-send state');
  const assets = new Set();
  for (const file of Object.values(routes)) {
    const html = await readFile('artifacts/corca-website/site/' + file, 'utf8');
    for (const match of html.matchAll(/\/assets\/[\w./-]+/g)) assets.add(match[0]);
  }
  for (const asset of assets) {
    const response = await context.request.get(base + asset);
    assert.equal(response.status(), 200, asset);
  }
  for (const [old, target] of Object.entries(redirects)) {
    const response = await context.request.get(base + encodeURI(old) + '?from=test', { maxRedirects: 0 });
    assert.equal(response.status(), 301, old);
    assert.equal(response.headers().location, target + '?from=test');
  }
  for (const route of Object.keys(routes).filter(route => route !== '/')) {
    assert.equal((await context.request.get(base + route + '/', { maxRedirects: 0 })).status(), 301);
  }
  for (const url of ['/missing-page', '/en/missing', '/server.mjs', '/package.json', '/api/healthz', '/assets/%2e%2e%2fserver.mjs']) {
    assert.equal((await context.request.get(base + url)).status(), 404, url);
  }
  assert.equal((await context.request.post(base + '/contacto', { data: 'message=not-sent' })).status(), 405);
  const response = await context.request.get(base + '/', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(response.headers()['content-encoding'], 'gzip');
  assert.equal((await context.request.head(base + '/')).status(), 200);
  assert.equal((await context.request.get(base + '/', { headers: { 'If-None-Match': response.headers().etag } })).status(), 304);
  assert.equal((await context.request.get(base + '/', { headers: { 'Accept-Encoding': 'gzip;q=0' } })).headers()['content-encoding'], undefined);
  assert.deepEqual(errors, []);
  console.log(`PASS ${assets.size} resources, redirects, clean 404s, HEAD/gzip/ETag and no API or fake contact POST`);
  await context.close();
} finally {
  await browser.close();
}
