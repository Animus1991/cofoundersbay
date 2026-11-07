/**
 * How much a page asks of the eye before any scrolling (docs §115): the words,
 * the controls and the pictures on its first screen, on a phone and on a desktop.
 * The numbers are the measure in the first-screen plan; the bar is the
 * Communities page, which people find restful.
 *
 *   pnpm --filter @cofounderbay/web build && next start -p 3100
 *   BASE=http://localhost:3100 node scripts/first-screen-density.mjs
 *   ROUTES=/matches,/discover OUT=density.json node scripts/first-screen-density.mjs
 *
 * Images under 48px are not counted, so 40px faces do not show in the figures.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { census } from './ai-coverage.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(join(HERE, '../apps/web/package.json'))('@playwright/test');
const BASE = process.env.BASE ?? 'http://localhost:3100';
const routes = process.env.ROUTES ? process.env.ROUTES.split(',') : census().map((row) => row.route).filter((route) => !route.includes('['));
export const BAR = { phone: { words: 60, controls: 12 }, desktop: { words: 125, controls: 20 } };

const browser = await chromium.launch();
const out = [];
for (const { w, h } of [{ w: 390, h: 780 }, { w: 1440, h: 900 }]) {
  const phone = w < 600;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone });
  if (!process.env.SIGNED_OUT) {
    const host = new URL(BASE).hostname;
    await ctx.addCookies([
      { name: 'cfb_session', value: 'preview-demo', domain: host, path: '/' },
      { name: 'cfb_preview_demo', value: '1', domain: host, path: '/' },
      { name: 'cfb_primary_role', value: process.env.ROLE ?? 'existing_founder', domain: host, path: '/' },
    ]);
  }
  await ctx.addInitScript(() => { try {
    localStorage.setItem('cfb_cookie_consent', 'true'); localStorage.setItem('cookie_consent', 'accepted'); localStorage.setItem('cfb_locale', 'el');
    for (const tour of ['founder-dashboard', 'investor', 'mentor', 'provider', 'org']) localStorage.setItem(`cfb.tour.${tour}.v1`, 'done');
  } catch { /* a context without storage still measures */ } });
  const page = await ctx.newPage();
  for (const route of routes) {
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);
      await page.evaluate(() => [...document.querySelectorAll('.fixed.inset-0')].filter((el) => String(el.className).includes('z-[80]')).forEach((el) => el.remove()));
      const measured = await page.evaluate(({ vw, vh }) => {
        const main = document.querySelector('main') ?? document.body;
        const inFold = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0; };
        const visible = (el) => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
        const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
        let words = 0;
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent.trim();
          if (!text || !node.parentElement || !visible(node.parentElement) || !inFold(node.parentElement)) continue;
          if (node.parentElement.closest('nav,[data-mobile-tabs],script,style')) continue;
          words += text.split(/\s+/).length;
        }
        // A stop for the keyboard is what the reader has to weigh; a face that repeats the name's link is not one.
        const controls = [...main.querySelectorAll('a[href],button,select,input,textarea,[role="button"]')].filter((el) => inFold(el) && visible(el) && !el.closest('nav') && el.tabIndex !== -1);
        const images = [...main.querySelectorAll('img')].filter((el) => visible(el) && el.getBoundingClientRect().width >= 48);
        return { words, controls: controls.length, imagesFirstScreen: images.filter(inFold).length, imagesPage: images.length, height: document.documentElement.scrollHeight };
      }, { vw: w, vh: h });
      out.push({ route, width: w, ...measured });
    } catch (error) {
      out.push({ route, width: w, error: String(error).slice(0, 100) });
    }
  }
  await ctx.close();
}
await browser.close();
if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(out));
const over = out.filter((row) => !row.error && (row.width < 600
  ? row.words > BAR.phone.words || row.controls > BAR.phone.controls
  : row.words > BAR.desktop.words || row.controls > BAR.desktop.controls));
console.log(`${out.length} measures, ${over.length} past the bar`);
for (const row of over) console.log(`${row.route} @${row.width}: ${row.words} words, ${row.controls} controls`);
