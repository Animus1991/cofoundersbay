/**
 * Visual-system scan, measured — the cursor.com reference: hairlines, one
 * accent, near-monochrome surfaces. Same auth/route loop as noise/scan.mjs.
 *
 *   node apps/web/.probes/system/scan.mjs [out.json]
 *
 * Detectors inside `main#main-content` (fallback main/body) at 1440px:
 *   1. cardInset  — descendant line-leaders whose left x strays >1px from the
 *      card title's left x (exempt: nested lists/trees, tables, right-aligned
 *      action containers, padded badges following a label).
 *   2. colours    — distinct alpha-composited color/bg/border values per route
 *      (rounded to 4/channel), count + samples.
 *   3. radius     — computed border-radius per component type; types with
 *      >1 distinct value and elements off the 6/10/12/14/18px ladder.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const BASE = 'http://localhost:3000';
const OUT = process.argv[3] ?? new URL('./flex-out.json', import.meta.url).pathname;
const routes = readFileSync(process.argv[2] ? new URL('../' + process.argv[2], import.meta.url) : new URL('../all-routes.txt', import.meta.url), 'utf8')
  .split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// Decorative colour is presentation there; findings are still recorded but
// flagged so the fix pass can skip them.
const COLOR_EXEMPT = (route) =>
  route === '/' || /^\/(pitch|t|c|p|share|themes|pricing)(\/|$)/.test(route) || route === '/pricing';

const RADIUS_LADDER = [6, 10, 12, 14, 18]; // rounded-full reported as 'full'

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

const perRoute = [];
const errors = [];

for (const route of routes) {
  const pageErrors = [];
  const onErr = (e) => pageErrors.push(e.message.slice(0, 120));
  page.on('pageerror', onErr);
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    if (!resp || resp.status() >= 400) { errors.push({ route, status: resp?.status() ?? 0 }); continue; }
    await page.waitForTimeout(700);
  } catch (e) {
    errors.push({ route, nav: e.message.slice(0, 100) });
    continue;
  } finally {
    page.off('pageerror', onErr);
  }
  if (pageErrors.length) errors.push({ route, pageErrors });

  let found;
  try {
    found = await page.evaluate(({ colorExempt, RADIUS_LADDER }) => {
      const main = document.querySelector('main#main-content')
        || document.querySelector('main') || document.body;
      const sel = (el) => {
        const parts = [];
        for (let n = el; n && n !== main && parts.length < 6; n = n.parentElement) {
          let p = n.tagName.toLowerCase();
          if (n.id) p += `#${n.id}`;
          else if (typeof n.className === 'string' && n.className.trim()) {
            const cls = n.className.trim().split(/\s+/).filter((c) => !c.includes('[')).slice(0, 2).join('.');
            if (cls) p += `.${cls}`;
          }
          parts.push(p);
        }
        return parts.join(' < ');
      };
      const own = (el) => {
        let t = '';
        for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
        return t.trim();
      };
      const visible = (el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      // ── Detector 1: card inset alignment ───────────────────────────────
      const cardInset = [];
      for (const card of main.querySelectorAll('[data-card], div.rounded-2xl.border.bg-card')) {
        if (!visible(card)) continue;
        const title = card.querySelector('h1,h2,h3,h4,h5,h6,[class*="card-title"],[class*="CardTitle"]')
          || card.querySelector('[class*="font-semibold"],[class*="font-bold"],strong');
        if (!title || !visible(title)) continue;
        const titleX = Math.round(title.getBoundingClientRect().left);
        const cardCls = typeof card.className === 'string' ? card.className.split(/\s+/).filter((c) => !c.includes('[')).slice(0, 3).join(' ') : '';
        for (const el of card.querySelectorAll('*')) {
          if (!visible(el)) continue;
          const cs = getComputedStyle(el);
          const isControl = el.matches('button,a,input,select,textarea,[role="button"],[role="tab"],[role="switch"],[role="link"]');
          if (!own(el) && !isControl) continue;
          // Exemptions: nested lists/trees, tables, right-aligned groups,
          // padded badges/chips after a label.
          if (el.closest('table,[role="grid"],[role="treeitem"],[role="dialog"],[data-radix-popper-content-wrapper]')) continue;
          let anc = el.closest('ul,ol');
          let nested = 0;
          for (let n = anc; n; n = n.parentElement?.closest('ul,ol')) nested++;
          if (nested >= 2) continue;
          if (el.closest('[class*="border-l-"],[class*="ml-auto"],[class*="justify-end"],[class*="text-right"]')) continue;
          if (el.closest('[class*="badge"],[class*="Badge"],[class*="chip"],[class*="bilingual"]') && !isControl) continue;
          if (el.closest('svg,canvas')) continue;
          // Centred content (empty states, hero blocks) does not owe the title line anything.
          if (!isControl && el.closest('[class*="text-center"],[class*="justify-center"],[class*="mx-auto"]')) continue;
          const r = el.getBoundingClientRect();
          const x = Math.round(r.left);
          if (Math.abs(x - titleX) <= 1) continue;
          // The introducer of the misalignment: the OUTERMOST descendant
          // whose own left is off the title line while its parent is on it —
          // i.e. the row carrying the pl-/px-/ml-/-mx-. Deeper elements are
          // inside the offset it created.
          let intro = el;
          for (let n = el; n && n !== card; n = n.parentElement) {
            if (Math.abs(Math.round(n.getBoundingClientRect().left) - titleX) > 1) intro = n;
            else break;
          }
          const parent = intro.parentElement;
          if (!parent) continue;
          // A flex-wrap row: a child first on a wrapped line is not a defect.
          if (getComputedStyle(parent).flexWrap === 'wrap') continue;
          // Line leader on the introducer: nothing earlier may share its
          // vertical band (icons centre-align, so compare overlap, not tops).
          const tr = intro.getBoundingClientRect();
          let isLeader = true;
          for (const sib of parent.children) {
            if (sib === intro) continue;
            const sr = sib.getBoundingClientRect();
            if (sr.width === 0 || sr.height === 0) continue;
            if (sr.left < tr.left - 1 && sr.top < tr.bottom - 1 && sr.bottom > tr.top + 1) { isLeader = false; break; }
          }
          if (!isLeader) continue;
          cardInset.push({ card: cardCls, path: sel(intro), leaf: sel(el), x, introX: Math.round(tr.left), titleX, text: (own(el) || el.textContent || '').slice(0, 50) });
          if (cardInset.length > 60) break;
        }
      }

      // ── Detector 2: colour budget ──────────────────────────────────────
      const bgMatch = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) || [255, 255, 255];
      const bgc = bgMatch.slice(0, 3).map(Number);
      const comp = (css) => {
        const m = css.match(/[\d.]+/g);
        if (!m || m.length < 3) return null;
        const a = m.length > 3 ? parseFloat(m[3]) : 1;
        const r = Math.round((a * m[0] + (1 - a) * bgc[0]) / 4) * 4;
        const g = Math.round((a * m[1] + (1 - a) * bgc[1]) / 4) * 4;
        const b = Math.round((a * m[2] + (1 - a) * bgc[2]) / 4) * 4;
        return `${r},${g},${b}`;
      };
      const colors = new Map(); // 'r,g,b' -> {count, samples[]}
      const addColor = (key, el, prop) => {
        if (!key) return;
        const e = colors.get(key) || { count: 0, samples: [] };
        e.count++;
        if (e.samples.length < 3) e.samples.push(sel(el) + ' @' + prop);
        colors.set(key, e);
      };
      for (const el of main.querySelectorAll('*')) {
        if (!visible(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.color) addColor(comp(cs.color), el, 'color');
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') addColor(comp(cs.backgroundColor), el, 'bg');
        if (cs.borderTopColor && cs.borderTopWidth !== '0px') addColor(comp(cs.borderTopColor), el, 'border');
      }

      // ── Detector 3: radius per component type ─────────────────────────
      const typeOf = (el, cs) => {
        if (el.matches('[data-card],div.rounded-2xl.border.bg-card')) return 'card';
        if (el.matches('[role="dialog"],[role="alertdialog"],[data-slot="sheet-content"]')) return 'dialog';
        if (el.matches('[role="menu"],[role="listbox"],[data-radix-popper-content-wrapper],[data-slot="popover-content"],[data-slot="dropdown-menu-content"]')) return 'popover';
        if (el.matches('[role="progressbar"],[class*="progress"]')) return 'progress';
        if (el.matches('[class*="avatar"],[class*="Avatar"]')) return 'avatar';
        if (el.matches('[role="tab"]')) return 'tab';
        if (el.matches('input,textarea,select,[role="combobox"],[role="textbox"]')) return 'field';
        if (el.matches('button,[role="button"],a.inline-flex[class*="h-"],a.inline-flex[class*="gap"]')) return 'button';
        if (el.matches('[class*="badge"],[class*="Badge"],[class*="chip"]')) return 'badge';
        if (el.matches('li,[role="listitem"],tr')) return 'row';
        if (el.matches('img,video,canvas')) return 'media';
        return null;
      };
      const radius = {}; // type -> Map(px -> {count, samples})
      for (const el of main.querySelectorAll('*')) {
        if (!visible(el)) continue;
        const cs = getComputedStyle(el);
        const t = typeOf(el, cs);
        if (!t) continue;
        const raw = parseFloat(cs.borderTopLeftRadius);
        if (!raw || raw === 0) continue;
        const r = el.getBoundingClientRect();
        const px = raw >= Math.min(r.width, r.height) / 2 ? 'full' : String(Math.round(raw));
        const e = radius[t] = radius[t] || {};
        e[px] = e[px] || { count: 0, samples: [] };
        e[px].count++;
        if (e[px].samples.length < 3) e[px].samples.push(sel(el));
      }
      const radiusFindings = [];
      for (const [t, map] of Object.entries(radius)) {
        const vals = Object.keys(map);
        if (vals.length > 1) {
          radiusFindings.push({ type: t, values: vals.map((v) => `${v}:${map[v].count}`), samples: vals.map((v) => map[v].samples[0]) });
        }
        for (const v of vals) {
          if (v !== 'full' && !RADIUS_LADDER.includes(Number(v))) {
            radiusFindings.push({ type: t, offLadder: v, count: map[v].count, samples: map[v].samples });
          }
        }
      }
      // ── Detector 4: type ladder discipline ───────────────────────────
      // (a) text < 12px; (b) text > 20px that is not the page title or a
      // page-stat figure ≤ 24; (c) per card: title/body hierarchy.
      const type = { small: [], big: [], cards: [] };
      for (const el of main.querySelectorAll('*')) {
        if (!visible(el) || !own(el)) continue;
        if (el.closest('svg,canvas')) continue; // chart encodings are not copy
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const t = own(el).slice(0, 40);
        if (fs < 12) type.small.push({ size: Math.round(fs * 10) / 10, path: sel(el), text: t });
        const isTitle = !!el.closest('h1');
        const isStat = !!el.closest('[class*="page-stat"],[class*="founder-dash-stat"]');
        if (fs > 20 && !(isTitle || (isStat && fs <= 24))) {
          type.big.push({ size: Math.round(fs * 10) / 10, path: sel(el), text: t });
        }
      }
      for (const card of main.querySelectorAll('[data-card], div.rounded-2xl.border.bg-card')) {
        if (!visible(card)) continue;
        const heading = card.querySelector('h1,h2,h3,h4,h5,h6,[class*="card-title"],[class*="CardTitle"]');
        const title = heading
          || card.querySelector('[class*="font-semibold"],[class*="font-bold"],strong');
        if (!title || !visible(title)) continue;
        const sizes = new Set(); const weights = new Set();
        const mediumLeaves = []; const leaves = []; const sizeCount = new Map();
        for (const el of card.querySelectorAll('*')) {
          if (!visible(el) || !own(el) || el.closest('svg,canvas')) continue;
          if (el === title || title.contains(el)) continue;
          const cs = getComputedStyle(el);
          // The bilingual echo spans (primary 0.93em, secondary 0.85em) are a
          // translation shadow, not hierarchy — attribute the wrapper's size.
          const bilingual = el.closest('[class*="bilingual-primary"],[class*="bilingual-secondary"],[class*="bilingual-separator"]');
          const fs = Math.round(parseFloat(bilingual ? getComputedStyle(bilingual.parentElement).fontSize : cs.fontSize) * 10) / 10;
          const w = cs.fontWeight === '400' ? 'normal' : cs.fontWeight;
          // Controls carry their own size/weight (Button is font-medium by
          // design); chips/badges are compact label capsules — neither is
          // prose hierarchy.
          const inControl = !!el.closest('button,a,[role="button"],[role="tab"],[class*="inline-flex"][class*="rounded-"]');
          if (!inControl && (!bilingual || el.classList.contains('bilingual-primary'))) { sizes.add(fs); sizeCount.set(fs, (sizeCount.get(fs) || 0) + 1); }
          leaves.push(el);
          if (w === '500' && !inControl) mediumLeaves.push(el); else if (w !== '500') weights.add(w);
        }
        const ts = Math.round(parseFloat(getComputedStyle(title).fontSize) * 10) / 10;
        // Modal body size — a card of captions is judged by its captions,
        // not by the first leaf whatever it happens to be.
        const bodySize = sizeCount.size ? [...sizeCount.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0] : null;
        const issue = [];
        // Hierarchy rules only apply where the card declares a heading.
        // A page-stat figure used as the card's heading is a figure, not a
        // title — the gap rule would only be measuring stat-vs-caption.
        if (heading && bodySize !== null && !heading.closest('[class*="page-stat"],[class*="founder-dash-stat"]')) {
          if (Math.abs(ts - bodySize) < 0.6) issue.push('flat:' + ts);
          else if (ts / bodySize > 1.45) issue.push('gap:' + ts + '/' + bodySize);
        }
        if (sizes.size > 3) issue.push('sizes:' + [...sizes].sort((a, b) => a - b).join(','));
        // font-medium is legal only where it labels a value on the same line.
        if (mediumLeaves.length) {
          const mediumLabels = mediumLeaves.every((m) => {
            const mr = m.getBoundingClientRect();
            return leaves.some((o) => {
              if (o === m || m.contains(o) || o.contains(m)) return false;
              const or = o.getBoundingClientRect();
              return or.top < mr.bottom - 1 && or.bottom > mr.top + 1;
            });
          });
          if (!mediumLabels) weights.add('500');
        }
        if (weights.size > 2) issue.push('weights:' + [...weights].join(','));
        if (issue.length) {
          const cls = typeof card.className === 'string' ? card.className.split(/\s+/).filter((c) => !c.includes('[')).slice(0, 3).join(' ') : '';
          type.cards.push({ card: cls, title: ts, body: bodySize, issue, path: sel(card) });
        }
      }

      // ── Detector 5: icon-only controls ───────────────────────────────
      const iconOnly = [];
      for (const el of main.querySelectorAll('button,[role="button"],a')) {
        if (!visible(el)) continue;
        // visible text = text nodes not inside .sr-only
        let visTxt = '';
        for (const n of el.childNodes) {
          if (n.nodeType === 3) visTxt += n.textContent;
          else if (n.nodeType === 1 && !n.classList?.contains('sr-only')) {
            for (const m of n.childNodes) {
              if (m.nodeType === 3) visTxt += m.textContent;
              else if (m.nodeType === 1 && !m.classList?.contains('sr-only') && m.tagName !== 'svg') visTxt += m.textContent || '';
            }
          }
        }
        visTxt = visTxt.replace(/\s+/g, ' ').trim();
        if (visTxt) continue;
        const svg = el.querySelector('svg');
        if (!svg) continue; // not icon-only — a textless control without a glyph is something else
        const name = (el.getAttribute('aria-label') || el.querySelector('.sr-only')?.textContent || '').trim() || null;
        const glyph = (svg.getAttribute('class') || '').match(/lucide-([a-z-]+)/)?.[1]
          || (svg.outerHTML.match(/data-(?:glyph|icon)="([^"]+)"/) || [])[1] || null;
        iconOnly.push({ path: sel(el), name, title: el.getAttribute('title') || null, glyph });
      }

      // ── Detector 6: empty states with no next move ───────────────────
      const empties = [];
      const emptySeen = new Set();
      const emptyRe = /^(No |Δεν |Nothing |Κανέν|There are no|Καμία |Κανένας |You have no|You haven't|Nothing here|No results)/i;
      for (const el of main.querySelectorAll('p,h3,h4,div,span')) {
        const t = (own(el) || '').trim();
        if (!emptyRe.test(t)) continue;
        // Not an empty state: a bullet/rule line inside a list, a form
        // prompt, or a block that already renders the list it would empty.
        if (el.closest('li,form')) continue;
        const block = el.closest('[data-card],section,[class*="rounded-2xl"],[class*="EmptyState"]') || el.parentElement;
        if (emptySeen.has(block)) continue;
        if (block.querySelectorAll('ul li,ol li').length > 1) continue;
        emptySeen.add(block);
        const action = [...block.querySelectorAll('a[href],button:not([disabled])')]
          .filter((a) => visible(a)).slice(0, 2)
          .map((a) => (a.textContent || '').trim().slice(0, 40));
        empties.push({ text: t.slice(0, 70), path: sel(el), action });
      }

      return {
        cardInset,
        colors: [...colors.entries()].map(([rgb, v]) => ({ rgb, ...v })).sort((a, b) => b.count - a.count),
        colorCount: colors.size,
        colorExempt,
        radius: radiusFindings,
        type,
        iconOnly,
        empties,
      };
    }, { colorExempt: COLOR_EXEMPT(route), RADIUS_LADDER });
  } catch (e) {
    errors.push({ route, eval: String(e.message || e).slice(0, 120) });
    continue;
  }
  perRoute.push({ route, colorExempt: found.colorExempt, colorCount: found.colorCount, cardInset: found.cardInset, colors: found.colors.slice(0, 24), radius: found.radius, type: found.type, iconOnly: found.iconOnly, empties: found.empties });
}

await browser.close();
const totals = {
  cardInset: perRoute.reduce((n, r) => n + r.cardInset.length, 0),
  maxColors: Math.max(...perRoute.map((r) => r.colorCount), 0),
  avgColors: Math.round(perRoute.reduce((n, r) => n + r.colorCount, 0) / Math.max(perRoute.length, 1)),
  radiusTypes: perRoute.reduce((n, r) => n + r.radius.length, 0),
  typeSmall: perRoute.reduce((n, r) => n + r.type.small.length, 0),
  typeBig: perRoute.reduce((n, r) => n + r.type.big.length, 0),
  typeCards: perRoute.reduce((n, r) => n + r.type.cards.length, 0),
  iconOnlyUnnamed: perRoute.reduce((n, r) => n + r.iconOnly.filter((i) => !i.name && !i.title).length, 0),
  iconOnlyTotal: perRoute.reduce((n, r) => n + r.iconOnly.length, 0),
  emptiesNoMove: perRoute.reduce((n, r) => n + r.empties.filter((e) => !e.action.length).length, 0),
  emptiesTotal: perRoute.reduce((n, r) => n + r.empties.length, 0),
};
const out = { generatedAt: new Date().toISOString(), routes: routes.length, totals, perRoute, errors };
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`routes=${routes.length} cardInset=${totals.cardInset} maxColors=${totals.maxColors} avgColors=${totals.avgColors} radiusFindings=${totals.radiusTypes} typeSmall=${totals.typeSmall} typeBig=${totals.typeBig} typeCards=${totals.typeCards} iconOnly=${totals.iconOnlyTotal}(${totals.iconOnlyUnnamed} unnamed) empties=${totals.emptiesTotal}(${totals.emptiesNoMove} no move) errors=${errors.length} -> ${OUT}`);
const worst = [...perRoute].sort((a, b) => b.colorCount - a.colorCount).slice(0, 10);
for (const w of worst) console.log(`  ${w.route} colors=${w.colorCount} inset=${w.cardInset.length}${w.colorExempt ? ' (exempt)' : ''}`);
