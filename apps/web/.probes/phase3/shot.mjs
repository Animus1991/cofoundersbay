// Phase 3: ring strokes + haze removal. /readiness (emblem crop),
// /dashboard/founder (emblem beside commitments seam), /reputation, /profile.
//   node .probes/phase3/shot.mjs
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const OUT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([
  { name: 'cfb_session', value: 'probe', domain: 'localhost', path: '/' },
  { name: 'cfb_primary_role', value: 'platform_admin', domain: 'localhost', path: '/' },
]);
await ctx.addInitScript(() => {
  localStorage.setItem('user', JSON.stringify({ id: 'preview-demo-user', email: 'alex@harbor.example', role: 'admin' }));
  localStorage.setItem('cfb_demo_data', '1');
  localStorage.setItem('cookie_consent', 'accepted');
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

const go = async (route, settle = 2200) => {
  await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => errors.push('NAV:' + e.message.slice(0, 80)));
  await page.waitForTimeout(settle);
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
};
const results = [];
const rec = async (name, route) => {
  results.push({ name, overflow: await go(route) });
  await page.screenshot({ path: `${OUT}${name}.png` });
};

await rec('readiness-1440', '/readiness');
// Emblem close-up: crop the ring figure region.
const emblem = page.locator('.score-emblem-figure').first();
if (await emblem.count()) {
  const box = await emblem.boundingBox();
  if (box) await page.screenshot({ path: `${OUT}readiness-emblem-1440.png`, clip: { x: Math.max(0, box.x - 130), y: Math.max(0, box.y - 130), width: box.width + 260, height: box.height + 260 } });
}
await rec('dashboard-founder-1440', '/dashboard/founder', 2600);
await rec('reputation-1440', '/reputation');
await rec('profile-1440', '/profile');

await page.setViewportSize({ width: 390, height: 844 });
await rec('readiness-390', '/readiness');
await rec('dashboard-founder-390', '/dashboard/founder');
await rec('reputation-390', '/reputation');
await rec('profile-390', '/profile');

console.log(JSON.stringify({ results, errors }, null, 1));
await b.close();
