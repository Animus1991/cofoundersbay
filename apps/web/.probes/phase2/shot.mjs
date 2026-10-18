// Phase 2: shared session-row anatomy on /mentor/sessions + /coaching +
// /mentoring, consolidated Explore nav, /discover tab header links.
//   node .probes/phase2/shot.mjs
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
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: (document.querySelector('#main-content') || document.body).innerText.length,
  }));
};
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` });

const results = [];
const rec = async (name, route, settle) => {
  const r = await go(route, settle);
  await shot(name);
  results.push({ name, ...r });
};

await rec('mentor-sessions-1440', '/mentor/sessions');
await rec('coaching-1440', '/coaching');
await rec('mentoring-1440', '/mentoring');

// Discover: three tabs.
await go('/discover');
await shot('discover-search-1440');
await page.getByRole('tab', { name: /for you|για εσάς|suggestions/i }).first().click().catch(() => {});
await page.waitForTimeout(1200);
await shot('discover-suggestions-1440');
await page.getByRole('tab', { name: /matches|αντιστοιχ/i }).first().click().catch(() => {});
await page.waitForTimeout(1200);
await shot('discover-matches-1440');

// Explore sidebar mode: click the Explore mode button if present.
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button, a')];
  const el = btns.find((x) => /explore|εξερεύνηση/i.test(x.textContent || ''));
  el?.click();
});
await page.waitForTimeout(800);
await shot('sidebar-explore-1440');

// Phone widths.
await page.setViewportSize({ width: 390, height: 844 });
await rec('mentor-sessions-390', '/mentor/sessions');
await rec('coaching-390', '/coaching');
await rec('discover-390', '/discover');
await rec('mentoring-390', '/mentoring');

console.log(JSON.stringify({ results, errors }, null, 1));
await b.close();
