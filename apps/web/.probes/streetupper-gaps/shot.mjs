// Landing-page shots for the StreetUpper gaps: live stats strip/grid and the
// "one card, three sentences" section, at 1440 and 390, with and without the
// demo world's data.
//   node .probes/streetupper-gaps/shot.mjs
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const OUT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();

async function shot(width, demo, tag) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  if (demo) {
    await ctx.addInitScript(() => {
      localStorage.setItem('cfb_demo_data', '1');
      localStorage.setItem('cookie_consent', 'accepted');
    });
  } else {
    await ctx.addInitScript(() => {
      localStorage.setItem('cookie_consent', 'accepted');
    });
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => errors.push(String(e)));
  await page.waitForTimeout(2500);

  const hero = page.locator('section').first();
  await hero.screenshot({ path: `${OUT}landing-hero-${tag}.png` }).catch(() => {});

  const cards = page.locator('#need-cards');
  await cards.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(600);
  await cards.screenshot({ path: `${OUT}landing-need-cards-${tag}.png` }).catch(async () => {
    await page.screenshot({ path: `${OUT}landing-need-cards-${tag}-full.png`, fullPage: false }).catch(() => {});
  });

  const stats = page.locator('section', { hasText: 'A thriving ecosystem' });
  await stats.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  await stats.screenshot({ path: `${OUT}landing-stats-${tag}.png` }).catch(() => {});

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`${tag}: errors=${errors.length} horizontalOverflow=${overflow} heroStats=${await page.locator('section').first().innerText().then((t) => /\d/.test(t)).catch(() => '?')}`);
  await ctx.close();
}

await shot(1440, true, '1440-demo');
await shot(390, true, '390-demo');
await shot(1440, false, '1440-nodata');
await shot(390, false, '390-nodata');
await b.close();
