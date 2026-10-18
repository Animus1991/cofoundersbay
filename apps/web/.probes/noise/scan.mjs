/**
 * Noise scan: oversized in-flow type and in-flow shadows, measured — not
 * guessed — inside `main#main-content` at 1440px for every route in
 * apps/web/.probes/all-routes.txt, signed in as demo platform_admin like
 * scripts/platform-sweep.mjs.
 *
 *   node apps/web/.probes/noise/scan.mjs [out.json]
 *
 * Reports:
 *   type    — text nodes whose computed font-size is > 24px
 *   shadows — elements whose computed box-shadow is not 'none' while
 *             position static/relative (in-flow)
 *
 * Presentation surfaces are exempt from the type rule: '/', '/pitch/*',
 * '/t/*', '/c/*', '/p/*', '/share/*', and the hero h1 on '/pricing'.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const BASE = 'http://localhost:3000';
const OUT = process.argv[2] ?? new URL('./before.json', import.meta.url).pathname;
const routes = readFileSync(new URL('../all-routes.txt', import.meta.url), 'utf8')
  .split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// Routes where display type is part of the surface, not noise.
const TYPE_EXEMPT = (route) =>
  route === '/' || /^\/(pitch|t|c|p|share)(\/|$)/.test(route);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([
  { name: 'cfb_session', value: 'probe', domain: 'localhost', path: '/' },
  { name: 'cfb_primary_role', value: 'platform_admin', domain: 'localhost', path: '/' },
]);
await ctx.addInitScript(() => {
  localStorage.setItem('user', JSON.stringify({ id: 'u_1', email: 'a@b.test', role: 'admin' }));
  localStorage.setItem('cfb_demo_data', '1');
  localStorage.setItem('cookie_consent', 'accepted');
});
const page = await ctx.newPage();

const typeFindings = [];
const shadowFindings = [];
const hazeFindings = [];
const buttonShadowFindings = [];
const errors = [];

for (const route of routes) {
  const pageErrors = [];
  const onErr = (e) => pageErrors.push(e.message.slice(0, 120));
  page.on('pageerror', onErr);
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    if (!resp || resp.status() >= 400) {
      errors.push({ route, status: resp?.status() ?? 0 });
      continue;
    }
    await page.waitForTimeout(800);
  } catch (e) {
    errors.push({ route, nav: e.message.slice(0, 120) });
    continue;
  } finally {
    page.off('pageerror', onErr);
  }
  if (pageErrors.length) errors.push({ route, pageErrors });

  let found;
  try {
    found = await page.evaluate((typeExempt) => {
    const main = document.querySelector('main#main-content')
      || document.querySelector('main')
      || document.body;
    if (!main) return { noMain: true };
    const sel = (el) => {
      const parts = [];
      for (let n = el; n && n !== main && parts.length < 5; n = n.parentElement) {
        let p = n.tagName.toLowerCase();
        if (n.id) p += `#${n.id}`;
        else if (typeof n.className === 'string' && n.className.trim()) {
          const cls = n.className.trim().split(/\s+/).slice(0, 2).join('.');
          p += `.${cls}`;
        }
        parts.push(p);
      }
      return parts.join(' < ');
    };
    const overlayAncestor = (el) =>
      el.closest('[data-canvas], .react-flow, [role="dialog"], [role="menu"], [role="alertdialog"], [role="status"], [data-radix-popper-content-wrapper], [data-sonner-toast], [data-slot="popover-content"], [data-slot="tooltip"], [data-slot="dropdown-menu-content"], [data-slot="hover-card-content"], [data-slot="sheet-content"]')
      || (() => { for (let n = el.parentElement; n; n = n.parentElement) {
        const pos = getComputedStyle(n).position;
        if (pos === 'fixed' || pos === 'absolute' || pos === 'sticky') return true;
      } return false; })();

    const type = [];
    const shadows = [];
    const haze = [];
    const buttonShadow = [];
    const seen = new Set();
    for (const el of main.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      // Largest text: report the element whose own font-size exceeds the cap
      // and that carries direct text (dedupe nested ancestors of one string).
      const fs = parseFloat(cs.fontSize);
      const tag = el.tagName.toLowerCase();
      const skip = typeExempt === 'all'
        || (typeExempt === 'pricing-h1' && (tag === 'h1' || el.closest('h1')));
      if (fs > 24 && !skip) {
        let own = '';
        for (const n of el.childNodes) {
          if (n.nodeType === 3) own += n.textContent;
        }
        if (own.trim()) {
          const key = sel(el) + '|' + own.trim().slice(0, 40);
          if (!seen.has(key)) {
            seen.add(key);
            type.push({ selector: sel(el), text: own.trim().slice(0, 80), px: fs });
          }
        }
      }
      // In-flow shadows: static/relative, inside the column, not an overlay.
      // Skip shadows that cannot render anything: every layer fully
      // transparent, or pure spread-only "rings" (0 offset, 0 blur = a
      // hairline, not elevation).
      if (cs.boxShadow !== 'none' && (cs.position === 'static' || cs.position === 'relative')) {
        const layers = cs.boxShadow.match(/rgba?\([^)]*\)[^,]*|[^,]+/g) || [];
        const visible = layers.some((layer) => {
          const m = layer.match(/rgba?\(([^)]*)\)/);
          const alpha = m ? parseFloat(m[1].split(',').pop()) : 1;
          if (!(alpha > 0)) return false;
          const nums = (layer.replace(/rgba?\([^)]*\)/, '').match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
          // nums: x, y, blur, spread — spread-only (x=y=blur=0) is a ring.
          return nums.slice(0, 3).some((v) => v !== 0);
        });
        if (visible && !overlayAncestor(el)) {
          shadows.push({ selector: sel(el), shadow: cs.boxShadow.slice(0, 80), position: cs.position });
        }
      }

      // Detector 3 — "haze": computed filter blur, blur-* classes (backdrop
      // excluded: it frosts a surface, not the page), and ::before/::after
      // wearing a shadow or blur.
      const cls = typeof el.className === 'string' ? el.className : '';
      const hasBlurCls = /(^|\s|[:])(?!backdrop)blur-/.test(cls) || cls.includes(' blur ');
      if (cs.filter.includes('blur(') || hasBlurCls) {
        const r2 = el.getBoundingClientRect();
        haze.push({ selector: sel(el), filter: cs.filter.slice(0, 60), cls: cls.match(/\S*blur\S*/g)?.join(' ') ?? '', w: Math.round(r2.width), h: Math.round(r2.height) });
      }
      for (const pseudo of ['::before', '::after']) {
        const pcs = getComputedStyle(el, pseudo);
        if (pcs.content !== 'none' && (pcs.boxShadow !== 'none' || pcs.filter.includes('blur('))) {
          haze.push({ selector: sel(el) + pseudo, filter: pcs.filter.slice(0, 60), shadow: (pcs.boxShadow !== 'none' ? pcs.boxShadow.slice(0, 60) : '') });
        }
      }

      // Detector 4 — "button-shadow": shadowed buttons/links and in-flow
      // glow/pulse-ring classes.
      const isButton = el.matches('button, [role="button"], a.inline-flex');
      if (isButton && cs.boxShadow !== 'none') {
        const layers = cs.boxShadow.match(/rgba?\([^)]*\)[^,]*|[^,]+/g) || [];
        const visible = layers.some((layer) => {
          const m = layer.match(/rgba?\(([^)]*)\)/);
          const alpha = m ? parseFloat(m[1].split(',').pop()) : 1;
          if (!(alpha > 0)) return false;
          const nums = (layer.replace(/rgba?\([^)]*\)/, '').match(/-?\d+(?:\.\d+)?px/g) || []).map(parseFloat);
          return nums.slice(0, 3).some((v) => v !== 0);
        });
        if (visible) buttonShadow.push({ selector: sel(el), shadow: cs.boxShadow.slice(0, 80) });
      }
      if (/\b(shadow-glow|glow-|animate-glow|animate-pulse-ring|pulse-glow)/.test(cls) && !overlayAncestor(el)) {
        buttonShadow.push({ selector: sel(el), glowCls: cls.match(/\S*(glow|pulse-ring)\S*/g)?.join(' ') ?? '' });
      }
    }
    return { type, shadows, haze, buttonShadow };
    }, TYPE_EXEMPT(route) ? 'all' : route === '/pricing' ? 'pricing-h1' : null);
  } catch (e) {
    // A client-side navigation mid-measure (auth redirect) destroys the
    // context; the route is measured as skipped, not crashed.
    errors.push({ route, eval: String(e.message || e).slice(0, 120) });
    continue;
  }

  if (found?.noMain) { errors.push({ route, noMain: true }); continue; }
  for (const t of found?.type ?? []) typeFindings.push({ route, ...t });
  for (const s of found?.shadows ?? []) shadowFindings.push({ route, ...s });
  for (const h of found?.haze ?? []) hazeFindings.push({ route, ...h });
  for (const b2 of found?.buttonShadow ?? []) buttonShadowFindings.push({ route, ...b2 });
}

await browser.close();
const out = { generatedAt: new Date().toISOString(), routes: routes.length, type: typeFindings, shadows: shadowFindings, haze: hazeFindings, buttonShadow: buttonShadowFindings, errors };
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`routes=${routes.length} type=${typeFindings.length} shadows=${shadowFindings.length} haze=${hazeFindings.length} buttonShadow=${buttonShadowFindings.length} errors=${errors.length} -> ${OUT}`);
