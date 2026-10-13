import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { localizedPages, productionOrigin } from './site-pages.mjs';

const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:23517';
const translations = JSON.parse(await readFile(new URL('../content/en.json', import.meta.url), 'utf8'));
const spanishKeys = Object.keys(translations).filter(key => key !== translations[key]);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || execFileSync('which', ['chromium'], { encoding: 'utf8' }).trim(),
  args: ['--no-sandbox'],
});
async function remainingSpanish(page) {
  return page.evaluate(keys => {
    const es = new Set(keys);
    const remaining = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style,svg,template')) continue;
      const text = node.data.replace(/\s+/g, ' ').trim();
      if (es.has(text)) remaining.push(text);
    }
    for (const element of document.querySelectorAll('[alt],[placeholder],[aria-label],[aria-roledescription]')) {
      for (const attribute of ['alt', 'placeholder', 'aria-label', 'aria-roledescription']) {
        const value = element.getAttribute(attribute);
        if (es.has(value)) remaining.push(value);
      }
    }
    return [...new Set(remaining)];
  }, spanishKeys);
}
try {
  for (const info of localizedPages) {
    const html = await (await fetch(origin + info.route)).text();
    assert(html.includes(`<html lang="${info.locale}">`));
    assert(!html.includes('{{'));
    assert(html.includes(`href="${productionOrigin}${info.route}"`));
    assert(html.includes('hreflang="en"'));
    assert(html.includes('hreflang="es"'));
    for (const width of [360, 1440]) {
      const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width, height: 900 } });
      await page.goto(origin + info.route, { waitUntil: 'domcontentloaded' });
      const selector = page.locator('.cw-language-switch');
      assert(await selector.isVisible(), 'Language switch hidden');
      assert.equal(await selector.locator('a[hreflang="es"]').getAttribute('href'), info.esRoute);
      assert.equal(await selector.locator('a[hreflang="en"]').getAttribute('href'), info.enRoute);
      assert.equal(await selector.locator('a[aria-current="true"]').getAttribute('lang'), info.locale);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${info.route}: overflow at ${width}`);
      if (info.locale === 'en') {
        assert.deepEqual(await remainingSpanish(page), [], `${info.route} static text not translated`);
        const wrongLinks = await page.locator('a[href]').evaluateAll(anchors => anchors
          .filter(a => !a.closest('.cw-language-switch') && /^\/(quienes-somos|manufactura|distribucion|contacto)$/.test(a.getAttribute('href')))
          .map(a => a.href));
        assert.deepEqual(wrongLinks, [], 'Navigation leaves English');
      }
      await page.close();
    }
    if (info.locale === 'en') {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + info.route, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.getElementById('corca-static'));
      assert.equal(await page.title(), info.title);
      assert.deepEqual(await remainingSpanish(page), [], `${info.route} interactive text not translated`);
      if (info.esRoute === '/manufactura') {
        const track = page.locator('.cw-carousel-track');
        const before = await track.getAttribute('style');
        await page.getByRole('button', { name: 'Next', exact: true }).click();
        assert.notEqual(await track.getAttribute('style'), before);
        assert.deepEqual(await remainingSpanish(page), [], 'Carousel repaint reverted to Spanish');
      }
      if (info.esRoute === '/contacto') {
        await page.getByRole('button', { name: 'Distribute your brands', exact: true }).click();
        assert(await page.getByRole('button', { name: 'Distribute your brands', exact: true }).isVisible());
        await page.getByRole('button', { name: 'Send message', exact: true }).click();
        assert(await page.getByText('Thank you for getting in touch!', { exact: true }).isVisible());
        await page.getByRole('button', { name: 'Send another message', exact: true }).click();
        assert(await page.getByPlaceholder('Your name').isVisible());
        assert.deepEqual(await remainingSpanish(page), [], 'Form repaint reverted to Spanish');
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log(`PASS ${info.route}: ${info.locale}, switch, full translation, no-JS, mobile/desktop`);
  }
  const page = await browser.newPage();
  await page.goto(origin + '/manufactura');
  await page.locator('.cw-language-switch a[hreflang="en"]').click();
  await page.waitForURL('**/en/manufacturing');
  await page.getByRole('link', { name: 'About Us', exact: true }).first().click();
  await page.waitForURL('**/en/about-us');
  await page.locator('.cw-language-switch a[hreflang="es"]').click();
  await page.waitForURL('**/quienes-somos');
  console.log('PASS switching languages and navigating preserves the corresponding page');
  await page.close();
} finally { await browser.close(); }
