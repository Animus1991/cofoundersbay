/**
 * Phone sweep: every route at the widths people hold a phone at, measuring
 * what breaks a page on a phone and no unit test can see.
 *
 *  - xScroll      the page scrolls sideways, and the outermost element that
 *                 pushes it (skipping anything inside a scroll container);
 *  - zoomInputs   text fields under 16px: iOS Safari zooms the page into a
 *                 field like that on focus and leaves it zoomed. The sweep
 *                 browses as an iPhone, so `IosFieldZoom` caps the viewport
 *                 when it is mounted; with the cap these are counted, not
 *                 failed (`zoomMitigated`);
 *  - smallTargets controls under WCAG 2.2's minimum target (2.5.8, 24×24 CSS
 *                 px), after the standard's spacing exception and without
 *                 inline links in running text, which the standard exempts;
 *  - cutText      a control's or heading's words cut off with no ellipsis;
 *  - edgeCut      content past the screen's edge that a clipping container
 *                 hides instead of scrolling (the page does not scroll
 *                 sideways, so xScroll is 0, and the content is just gone);
 *  - covered      a control under a fixed bar (the tab bar, the chat
 *                 launcher, page tools) both with the page scrolled to its
 *                 end and at its start, i.e. not reachable by scrolling;
 *  - fixedClash   two fixed elements painted over each other;
 *  - errors       uncaught page errors.
 *
 * Run from the repo root against a running server (preview demo session):
 *
 *   node scripts/mobile-sweep.mjs [routes.txt] [widths=320,360,390,414,430]
 *
 * Env: SWEEP_BASE (default http://localhost:3000), ROLE (default
 * existing_founder; platform_admin renders every role's section), OUT (a
 * JSON file for every row), ONLY (a substring a route must contain).
 *
 * Measurement, not proof: a route that passes rendered cleanly at these
 * widths for one role, with the demo's data. Docs §107 has the numbers.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const BASE = process.env.SWEEP_BASE ?? 'http://localhost:3000';
const ROLE = process.env.ROLE ?? 'existing_founder';
const routes = readFileSync(process.argv[2] ?? new URL('./platform-sweep-routes.txt', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map((r) => r.trim())
  .filter((r) => r && !r.startsWith('#'))
  .filter((r) => !process.env.ONLY || r.includes(process.env.ONLY));
const WIDTHS = (process.argv[3] ?? '320,360,390,414,430').split(',').map(Number);

/** Runs in the page. Everything it reports is measured from the DOM. */
function measure() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const out = { xScroll: 0, overflow: [], edgeCut: [], zoomInputs: [], zoomMitigated: false, smallTargets: [], cutText: [], covered: [], fixedClash: [] };
  const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
  out.zoomMitigated = /maximum-scale\s*=\s*1(\.0*)?\s*(,|$)/i.test(viewport);
  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const name = (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.innerText || el.getAttribute('title') || '')
      .replace(/\s+/g, ' ').trim().slice(0, 40);
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 4).join('.') : '';
    return `${tag}${cls ? '.' + cls : ''}${name ? ` «${name}»` : ''}`;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false;
    if (el.closest('[aria-hidden="true"], [inert], .sr-only')) return false;
    return true;
  };
  const clipsX = (el) => ['hidden', 'auto', 'scroll', 'clip'].includes(getComputedStyle(el).overflowX);

  // Sideways scroll and its source.
  out.xScroll = Math.max(0, document.documentElement.scrollWidth - W);
  if (out.xScroll > 1) {
    const offenders = [];
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right <= W + 1 || r.width === 0 || !visible(el)) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (clipsX(a) && a.getBoundingClientRect().right <= W + 1) { clipped = true; break; }
      }
      if (clipped || getComputedStyle(el).position === 'fixed') continue;
      offenders.push(el);
    }
    // The outermost ones: a child of an offender says nothing new.
    out.overflow = offenders
      .filter((el) => !offenders.includes(el.parentElement))
      .slice(0, 4)
      .map((el) => `${describe(el)} → ${Math.round(el.getBoundingClientRect().right - W)}px`);
  }

  // Content cut at the screen's edge by a container that hides it. Only
  // elements with words of their own or controls, and only when no
  // scrolling container between them would let the reader reach them.
  {
    const cut = [];
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.right <= W + 1 || r.left >= W || r.width < 2 || !visible(el)) continue;
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const control = el.matches('a[href], button, input, select, textarea, [role="button"], [role="tab"]');
      if (!ownText && !control) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === 'auto' || ox === 'scroll') break;
        // An ellipsis is drawn at the element's own right edge, so one past
        // the clip is cut as well: the words just stop. Except inline text
        // inside a block that ellipsizes itself: the block draws the "…" at
        // its own edge (a `truncate` row holding a `truncate` span).
        if ((ox === 'hidden' || ox === 'clip') && a.getBoundingClientRect().right <= W + 1) {
          const inlineInEllipsis = getComputedStyle(el).display === 'inline' && getComputedStyle(a).textOverflow === 'ellipsis';
          if (!inlineInEllipsis) cut.push(el);
          break;
        }
      }
    }
    out.edgeCut = cut.filter((el) => !cut.includes(el.parentElement)).slice(0, 4).map((el) => `${describe(el)} → ${Math.round(el.getBoundingClientRect().right - W)}px`);
  }

  // Text fields iOS zooms into.
  for (const el of document.querySelectorAll('input, textarea, select')) {
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (['hidden', 'checkbox', 'radio', 'range', 'file', 'color', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    if (!visible(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 16) out.zoomInputs.push(`${describe(el)} ${size.toFixed(1)}px`);
  }

  // Targets: WCAG 2.2 SC 2.5.8 with its spacing exception.
  const targets = [...document.querySelectorAll('a[href], button, [role="button"], [role="tab"], [role="link"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, summary')]
    .filter((el) => visible(el) && !el.disabled);
  // The area a pointer hits: the box, plus an absolutely placed ::before or
  // ::after band around it (the `tap-extend` utilities), as the browser counts it.
  const hitRect = (el) => {
    const r = el.getBoundingClientRect();
    let { left, right, top, bottom } = r;
    for (const pseudo of ['::before', '::after']) {
      const cs = getComputedStyle(el, pseudo);
      if (!cs.content || cs.content === 'none' || cs.position !== 'absolute') continue;
      const px = (v) => (v.endsWith('px') ? parseFloat(v) : 0);
      top = Math.min(top, r.top + Math.min(0, px(cs.top)));
      bottom = Math.max(bottom, r.bottom - Math.min(0, px(cs.bottom)));
      left = Math.min(left, r.left + Math.min(0, px(cs.left)));
      right = Math.max(right, r.right - Math.min(0, px(cs.right)));
    }
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  };
  const rects = targets.map((el) => hitRect(el));
  const inlineInText = (el) => {
    if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') return false;
    const block = el.parentElement;
    return Boolean(block && (block.innerText || '').trim().length > (el.innerText || '').trim().length + 12);
  };
  const square = (r) => {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return { left: cx - 12, right: cx + 12, top: cy - 12, bottom: cy + 12 };
  };
  const meets = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  targets.forEach((el, i) => {
    const r = rects[i];
    if (r.width >= 24 && r.height >= 24) return;
    if (inlineInText(el)) return;
    // Offscreen (a carousel's hidden page, a drawer): not a target right now.
    if (r.right < 0 || r.left > W) return;
    const mine = square(r);
    const crowded = targets.some((other, j) => {
      if (j === i || other.contains(el) || el.contains(other)) return false;
      const o = rects[j];
      const theirs = o.width >= 24 && o.height >= 24 ? o : square(o);
      return meets(mine, theirs);
    });
    if (crowded) out.smallTargets.push(`${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  });

  // Words cut off with no ellipsis.
  for (const el of document.querySelectorAll('button, a, h1, h2, h3, h4, label, [role="tab"], th')) {
    if (!visible(el) || !(el.innerText || '').trim()) continue;
    const cs = getComputedStyle(el);
    if (!['hidden', 'clip'].includes(cs.overflowX) || cs.textOverflow === 'ellipsis') continue;
    if (el.scrollWidth > el.clientWidth + 1) out.cutText.push(`${describe(el)} ${el.scrollWidth}/${el.clientWidth}`);
  }

  // Fixed elements: which clash, and what they hide at the end of the page.
  const fixed = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || !visible(el)) return false;
    const r = el.getBoundingClientRect();
    // Full-screen layers (dialogs, scrims) are not bars.
    return !(r.width >= W - 2 && r.height >= H - 2) && r.bottom > 0 && r.top < H;
  });
  const outermostFixed = fixed.filter((el) => !fixed.some((other) => other !== el && other.contains(el)));
  for (let i = 0; i < outermostFixed.length; i++) {
    for (let j = i + 1; j < outermostFixed.length; j++) {
      const a = outermostFixed[i].getBoundingClientRect();
      const b = outermostFixed[j].getBoundingClientRect();
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 4 && h > 4) out.fixedClash.push(`${describe(outermostFixed[i])} × ${describe(outermostFixed[j])}`);
    }
  }
  const main = document.querySelector('main') || document.body;
  for (const el of main.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')) {
    if (!visible(el) || outermostFixed.some((f) => f.contains(el))) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= H) continue;
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), W - 1);
    const cy = Math.min(Math.max(r.top + r.height / 2, 0), H - 1);
    const top = document.elementFromPoint(cx, cy);
    if (!top || el.contains(top) || top.contains(el)) continue;
    const bar = outermostFixed.find((f) => f.contains(top));
    if (bar) {
      el.setAttribute('data-sweep-covered', describe(bar));
      out.covered.push(`${describe(el)} under ${describe(bar)}`);
    }
  }
  return out;
}

/** At the top of the page: which of the controls covered at the end are still covered. */
function stillCovered() {
  const H = window.innerHeight;
  const W = window.innerWidth;
  const out = [];
  for (const el of document.querySelectorAll('[data-sweep-covered]')) {
    const bar = el.getAttribute('data-sweep-covered');
    el.removeAttribute('data-sweep-covered');
    const r = el.getBoundingClientRect();
    // Off screen at the top of the page: reached by scrolling between the two.
    if (r.bottom <= 0 || r.top >= H) continue;
    const top = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), W - 1), Math.min(Math.max(r.top + r.height / 2, 0), H - 1));
    if (!top || el.contains(top) || top.contains(el)) continue;
    if (getComputedStyle(top).position === 'fixed' || top.closest('nav, button, [role="dialog"]')) out.push(`${el.tagName.toLowerCase()} «${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40)}» under ${bar}`);
  }
  return out;
}

const browser = await chromium.launch();
const contexts = await Promise.all(WIDTHS.map(async (width) => {
  const ctx = await browser.newContext({
    viewport: { width, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    // An iPhone, so the page treats the sweep as one (IosFieldZoom reads it).
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  });
  await ctx.addCookies([
    { name: 'cfb_session', value: 'preview-demo', url: BASE },
    { name: 'cfb_preview_demo', value: '1', url: BASE },
    { name: 'cfb_primary_role', value: ROLE, url: BASE },
  ]);
  await ctx.addInitScript(() => {
    localStorage.setItem('cfb_demo_data', '1');
    localStorage.setItem('cfb_locale', 'el');
    localStorage.setItem('cfb:primary-language', 'el');
    localStorage.setItem('cfb_tour_seen_all', '1');
    localStorage.setItem('cfb_cookie_consent', 'true');
  });
  const page = await ctx.newPage();
  return { width, ctx, page };
}));

const rows = [];
const started = Date.now();
for (const route of routes) {
  await Promise.all(contexts.map(async ({ width, page }) => {
    const errors = [];
    const onError = (e) => errors.push(e.message.slice(0, 100));
    page.on('pageerror', onError);
    let status = 0;
    try {
      const res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 }));
      status = res?.status() ?? 0;
      await page.addStyleTag({ content: '.fixed.inset-0.z-\\[80\\]{display:none!important}' });
      await page.waitForTimeout(700);
      // To the end, and again while images below the fold keep growing the
      // page: a control "under the tab bar" at a scroll that was not the end
      // is only below the fold.
      for (let pass = 0; pass < 4; pass++) {
        const settled = await page.evaluate(() => {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, document.documentElement.scrollHeight);
          return Math.abs(window.scrollY - (document.documentElement.scrollHeight - window.innerHeight)) < 2;
        });
        await page.waitForTimeout(350);
        if (settled && pass > 0) break;
      }
      const m = await page.evaluate(measure);
      if (m.covered.length) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(250);
        m.covered = await page.evaluate(stillCovered);
      }
      rows.push({ route, width, status, errors, ...m });
    } catch (e) {
      rows.push({ route, width, status, errors: [...errors, String(e).slice(0, 100)], xScroll: 0, overflow: [], edgeCut: [], zoomInputs: [], zoomMitigated: false, smallTargets: [], cutText: [], covered: [], fixedClash: [] });
    } finally {
      page.off('pageerror', onError);
    }
  }));
}
await browser.close();

if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(rows, null, 1));
const bad = (r) => r.errors.length || r.xScroll > 1 || r.edgeCut.length || (r.zoomInputs.length && !r.zoomMitigated) || r.smallTargets.length || r.cutText.length || r.covered.length || r.fixedClash.length || (r.status && r.status >= 400);
const failing = rows.filter(bad);
console.log(`${routes.length} routes × ${WIDTHS.join('/')}px as ${ROLE}: ${rows.length - failing.length}/${rows.length} clean, ${Math.round((Date.now() - started) / 1000)}s`);
const total = (key) => rows.reduce((n, r) => n + (Array.isArray(r[key]) ? r[key].length : 0), 0);
const unmitigated = rows.filter((r) => r.zoomInputs.length && !r.zoomMitigated).length;
console.log(`xScroll ${rows.filter((r) => r.xScroll > 1).length} · edgeCut ${total('edgeCut')} · zoomInputs ${total('zoomInputs')} (unmitigated on ${unmitigated} pages) · smallTargets ${total('smallTargets')} · cutText ${total('cutText')} · covered ${total('covered')} · fixedClash ${total('fixedClash')} · errors ${total('errors')}`);
for (const r of failing) {
  const parts = [
    r.status >= 400 ? `status ${r.status}` : '',
    r.xScroll > 1 ? `xScroll ${r.xScroll}px: ${r.overflow.join(' | ')}` : '',
    r.edgeCut.length ? `edge: ${r.edgeCut.join(' | ')}` : '',
    r.zoomInputs.length && !r.zoomMitigated ? `zoom: ${r.zoomInputs.slice(0, 3).join(' | ')}` : '',
    r.smallTargets.length ? `targets(${r.smallTargets.length}): ${r.smallTargets.slice(0, 3).join(' | ')}` : '',
    r.cutText.length ? `cut: ${r.cutText.slice(0, 3).join(' | ')}` : '',
    r.covered.length ? `covered: ${r.covered.slice(0, 2).join(' | ')}` : '',
    r.fixedClash.length ? `clash: ${r.fixedClash.slice(0, 2).join(' | ')}` : '',
    r.errors.length ? `errors: ${r.errors.slice(0, 2).join(' | ')}` : '',
  ].filter(Boolean);
  console.log(`${r.route} @${r.width}: ${parts.join(' ; ')}`);
}
