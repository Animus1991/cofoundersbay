// Text cut off by a clipping ancestor with no ellipsis (docs §69): a compact
// BilingualText inside line-clamp, or a select value wider than its trigger,
// was cut mid-letter. Scrolling containers are not clips. Must report 0.
//   node .probes/clipped_text.mjs <routes.txt> [width=1440] [rail]
// "rail" pins every page rail open first. Env: BASE, ROLE (default existing_founder).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');
const BASE = process.env.BASE ?? 'http://localhost:3000';
const routes = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean);
const W = Number(process.argv[3] ?? 1440);
const openRail = process.argv[4] === 'rail';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
await ctx.addCookies([{ name: 'cfb_session', value: 'probe', domain: 'localhost', path: '/' }, { name: 'cfb_primary_role', value: process.env.ROLE ?? 'existing_founder', domain: 'localhost', path: '/' }]);
await ctx.addInitScript(() => { localStorage.setItem('user', JSON.stringify({ id: 'u_1', role: 'user' })); localStorage.setItem('cfb_demo_data', '1'); localStorage.setItem('cfb_cookie_consent', 'true'); for (const k of Object.keys(localStorage)) if (k.startsWith('cfb.tour.')) localStorage.setItem(k, 'done'); });
const page = await ctx.newPage();
let total = 0;
for (const route of routes) {
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(700);
    for (let i = 0; i < 3 && (await page.locator('[aria-label*="Skip tour"]').count()); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
    if (openRail) {
      const pin = page.locator('button[aria-pressed][aria-label*="Keep page tools open"]').first();
      if (await pin.count()) { await pin.click().catch(() => {}); await page.waitForTimeout(800); }
    }
    const hits = await page.evaluate(() => {
      const out = [];
      const clipOf = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return p; } return null; };
      const tw = document.createTreeWalker(document.querySelector('#main-content')?.parentElement || document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (tw.nextNode()) {
        const n = tw.currentNode; if (!n.textContent.trim()) continue;
        const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
        if (el.closest('.sr-only, script, style, [aria-hidden="true"], svg')) continue;
        const r = document.createRange(); r.selectNodeContents(n); const tr = r.getBoundingClientRect();
        if (tr.width < 1) continue;
        const c = clipOf(el); if (!c) continue;
        const cs = getComputedStyle(c); if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
        const cr = c.getBoundingClientRect();
        const over = tr.right - (cr.right - parseFloat(cs.borderRightWidth));
        if (over <= 2) continue;
        // An ellipsis on the element or on a block ancestor up to the clip counts as handled.
        let ell = false; for (let p = el; p && p !== c.parentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.textOverflow === 'ellipsis' && s.display !== 'inline' && s.overflowX === 'hidden') { ell = true; break; } }
        if (ell) continue;
        if (cr.width < 30) continue;
        out.push({ over: Math.round(over), text: n.textContent.trim().slice(0, 50), cls: (el.getAttribute('class') || '').slice(0, 60), clip: (c.getAttribute('class') || c.tagName).slice(0, 60) });
      }
      return out;
    });
    if (hits.length) { total += hits.length; console.log(route, JSON.stringify(hits.slice(0, 4))); }
  } catch (e) { console.log(route, 'ERR', String(e.message).slice(0, 60)); }
}
console.log('total', total);
await browser.close();
