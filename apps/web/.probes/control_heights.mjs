// Control heights per kind (button, field, tab), and rows of controls of
// unequal height side by side (docs §69). A field's own inner submit mark
// (the Ask AI composer) is not a row and is left out.
//   node .probes/control_heights.mjs <routes.txt> [width=1440] [out.json]
// Env: BASE, ROLE (default platform_admin, so every role surface renders).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const routes = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const W = Number(process.argv[3] ?? 1440);
const OUT = process.argv[4];
const BASE = process.env.BASE ?? 'http://localhost:3000';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
await ctx.addCookies([
  { name: 'cfb_session', value: 'probe', domain: 'localhost', path: '/' },
  { name: 'cfb_primary_role', value: process.env.ROLE ?? 'platform_admin', domain: 'localhost', path: '/' },
]);
await ctx.addInitScript(() => {
  localStorage.setItem('user', JSON.stringify({ id: 'u_1', role: 'admin' }));
  localStorage.setItem('cfb_demo_data', '1');
  localStorage.setItem('cfb_cookie_consent', 'true');
  for (const k of Object.keys(localStorage)) if (k.startsWith('cfb.tour.')) localStorage.setItem(k, 'done');
});
const page = await ctx.newPage();
const report = [];
for (const route of routes) {
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(700);
    for (let i = 0; i < 3 && (await page.locator('[aria-label*="Skip tour"]').count()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    report.push({ route, ...(await page.evaluate(() => {
      const root = document.querySelector('#main-content') || document.querySelector('main') || document.body;
      const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width >= 1 && r.height >= 1 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05 && !el.closest('[aria-hidden="true"]'); };
      const r1 = (n) => Math.round(n * 10) / 10;
      const label = (el) => (el.innerText || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const sel = 'button, a[data-slot="button"], [role="button"], [role="tab"], input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="range"]):not([type="file"]), select';
      const kindOf = (el) => (el.matches('input, select, [role="combobox"]') ? 'field' : el.matches('[role="tab"]') ? 'tab' : 'button');
      const controls = [];
      const groups = new Map();
      for (const el of root.querySelectorAll(sel)) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        const iconOnly = !(el.innerText || '').trim() && !el.matches('input, select');
        controls.push({ kind: kindOf(el), h: r1(r.height), iconOnly, text: label(el) });
        if (el.matches('[role="tab"]') || !el.parentElement) continue;
        if (!groups.has(el.parentElement)) groups.set(el.parentElement, []);
        groups.get(el.parentElement).push(el);
      }
      const rows = [];
      for (const els of groups.values()) {
        if (els.length < 2) continue;
        const items = els.map((el) => ({ el, r: el.getBoundingClientRect() }));
        const mid = (it) => it.r.top + it.r.height / 2;
        const line = items.filter((it) => Math.abs(mid(it) - mid(items[0])) < 6);
        if (line.length < 2) continue;
        const hs = line.map((it) => it.r.height);
        if (Math.max(...hs) - Math.min(...hs) <= 2.5) continue;
        // A field and the small mark inside it (the composer's send) is one control.
        if (line.length === 2 && line.some((it) => it.el.matches('input, textarea')) && line.some((it) => it.r.height < 26)) continue;
        rows.push(line.map((it) => `${r1(it.r.height)} ${label(it.el)}`));
      }
      return { controls, rows };
    })) });
  } catch (e) {
    report.push({ route, error: String(e.message).slice(0, 120) });
  }
}
await browser.close();
if (OUT) writeFileSync(OUT, JSON.stringify(report));
for (const kind of ['button', 'field', 'tab']) {
  const hs = {};
  for (const r of report) for (const c of r.controls ?? []) if (c.kind === kind && !(kind === 'button' && c.iconOnly)) hs[Math.round(c.h)] = (hs[Math.round(c.h)] ?? 0) + 1;
  console.log(`${kind} heights (px: count):`, Object.entries(hs).sort((a, b) => a[0] - b[0]).map(([h, n]) => `${h}:${n}`).join(', '));
}
const rows = report.flatMap((r) => (r.rows ?? []).map((row) => `${r.route}  ${row.join(' | ')}`));
console.log(`rows of unequal height: ${rows.length}`);
for (const row of rows.slice(0, 40)) console.log('  ' + row);
