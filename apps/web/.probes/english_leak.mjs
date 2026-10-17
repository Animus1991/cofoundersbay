// English a Greek reader sees or hears. One language is the default display
// (2026-10-14), so an English-only string has no Greek beside it any more.
// For every route, in Greek, collects:
//   controls - visible text of buttons, links, tabs, labels, headings with
//              Latin words and no Greek
//   text     - any other visible text node in <main> like that
//   aria     - aria-label / title on visible elements with no Greek
//   ph       - input/textarea placeholders with no Greek
//   dates    - English dates and units ("Sat, 10 Oct", "3h ago", "Oct")
// Proper nouns (people, companies, emails) show up too: read the summary,
// the counts are not a score.
//   node .probes/english_leak.mjs <routes.txt> [routes2.txt] > summary.txt
//   ROLE=existing_founder DISPLAY=primary-only BASE=http://127.0.0.1:3000 OUT=leak.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireFromWeb = createRequire(new URL('../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');
const BASE = process.env.BASE ?? 'http://127.0.0.1:3000';
const ROLE = process.env.ROLE ?? 'existing_founder';
const DISPLAY = process.env.DISPLAY ?? 'primary-only';
const OUT = process.env.OUT ?? '';
const routes = process.argv.slice(2).flatMap((f) => readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('/')));

function scan() {
  const LATIN = /[A-Za-z]{3,}/;
  const GREEK = /[Ͱ-Ͽἀ-῿]/;
  const DATE = /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b,?\s+\d|\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\b|\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\b|\b\d+\s?(?:min|mins|hrs?|h|d|w|mo)\b(?:\s+ago)?/;
  const visible = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      if (n.classList?.contains('sr-only')) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const main = document.querySelector('#main-content') || document.querySelector('main') || document.body;
  const out = { controls: [], text: [], aria: [], ph: [], dates: [] };
  const seen = new Set();
  const push = (bucket, value) => {
    const key = `${bucket}|${value}`;
    if (!seen.has(key)) { seen.add(key); out[bucket].push(value); }
  };
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const t = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (!t || GREEK.test(t)) continue;
    const el = node.parentElement;
    if (!el || el.closest('.bilingual-secondary, code, pre, kbd, script, style, svg, [contenteditable="true"], [data-no-i18n]')) continue;
    if (!visible(el)) continue;
    if (DATE.test(t)) push('dates', t.slice(0, 70));
    if (!LATIN.test(t)) continue;
    const ctl = el.closest('button, a, [role="button"], [role="tab"], [role="menuitem"], label, th, h1, h2, h3, h4, legend, summary');
    if (ctl) push('controls', `${ctl.tagName.toLowerCase()}${ctl.getAttribute('role') ? `[${ctl.getAttribute('role')}]` : ''}: ${t.slice(0, 70)}`);
    else push('text', `${el.tagName.toLowerCase()}: ${t.slice(0, 70)}`);
  }
  for (const el of document.querySelectorAll('[aria-label], [title]')) {
    const v = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    if (!v || !LATIN.test(v) || GREEK.test(v) || !visible(el)) continue;
    push('aria', `${el.tagName.toLowerCase()}[${el.hasAttribute('aria-label') ? 'aria' : 'title'}]: ${v.slice(0, 70)}`);
  }
  for (const el of main.querySelectorAll('input[placeholder], textarea[placeholder]')) {
    const v = el.getAttribute('placeholder').trim();
    if (v && LATIN.test(v) && !GREEK.test(v) && visible(el)) push('ph', v.slice(0, 70));
  }
  return out;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([
  { name: 'cfb_session', value: 'preview-demo', url: BASE },
  { name: 'cfb_preview_demo', value: '1', url: BASE },
  { name: 'cfb_primary_role', value: ROLE, url: BASE },
]);
await ctx.addInitScript((display) => {
  localStorage.setItem('cfb_demo_data', '1');
  localStorage.setItem('cookie_consent', 'accepted');
  localStorage.setItem('cfb_cookie_consent', 'true');
  localStorage.setItem('cfb_locale', 'el');
  localStorage.setItem('cfb:primary-language', 'el');
  localStorage.setItem('cfb:language-display', display);
}, DISPLAY);
const page = await ctx.newPage();
const results = {};
for (const [i, route] of routes.entries()) {
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(4500);
    results[route] = await page.evaluate(scan);
  } catch (error) {
    results[route] = { error: String(error).slice(0, 160) };
  }
  const r = results[route];
  process.stderr.write(`${i + 1}/${routes.length} ${route} ${r.error ? 'FAILED' : `controls=${r.controls.length} text=${r.text.length} aria=${r.aria.length} dates=${r.dates.length}`}\n`);
  if (OUT) writeFileSync(OUT, JSON.stringify(results, null, 1));
}
await browser.close();

// Summary: each string once, with how many routes show it, most-shared first.
for (const bucket of ['controls', 'aria', 'ph', 'dates', 'text']) {
  const where = new Map();
  for (const [route, r] of Object.entries(results)) {
    for (const item of r[bucket] ?? []) {
      if (!where.has(item)) where.set(item, []);
      where.get(item).push(route);
    }
  }
  const rows = [...where].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  console.log(`\n===== ${bucket}: ${rows.length} distinct`);
  for (const [item, rs] of rows) console.log(`${String(rs.length).padStart(3)} | ${item} | ${rs.slice(0, 3).join(', ')}`);
}
