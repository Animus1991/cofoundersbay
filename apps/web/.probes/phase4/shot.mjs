// Phase 4: system pass (card inset, colour budget, radius). Six representative
// app routes at 1440 and 390.
//   node .probes/phase4/shot.mjs
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

const ROUTES = ['/dashboard/founder', '/projects', '/milestones', '/fundraising', '/commitments', '/settings'];
for (const r of ROUTES) await rec(`${r.slice(1).replace(/\//g, '-')}-1440`, r);

await page.setViewportSize({ width: 390, height: 844 });
for (const r of ROUTES) await rec(`${r.slice(1).replace(/\//g, '-')}-390`, r);

console.log(JSON.stringify({ results, errors }, null, 1));
await b.close();
