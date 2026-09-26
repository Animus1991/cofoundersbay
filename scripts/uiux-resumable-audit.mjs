/**
 * Read-only rendering probe against the already-running preview.
 * Usage: node scripts/uiux-resumable-audit.mjs --width=390 --limit=8
 * Re-run to resume; --retry-failed revisits completed failures.
 * Requires Playwright browser libraries (e.g. the Nix shell documented in docs/audit/README.txt).
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, renameSync, existsSync, copyFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';

const root = new URL('../apps/web/src/app/', import.meta.url).pathname;
const out = new URL('../docs/audit/', import.meta.url).pathname;
const requireWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { chromium } = requireWeb('@playwright/test');
let AxeBuilder;
try { AxeBuilder = requireWeb('@axe-core/playwright').default; } catch { /* record unavailable below */ }
const flags = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [name, ...value] = arg.replace(/^--/, '').split('=');
  return [name, value.length ? value.join('=') : true];
}));
const width = Number(flags.width ?? 390);
const limit = Number(flags.limit ?? 8);
const base = flags.base ?? 'http://localhost:80';
const requestedRole = 'existing_founder';
if (![390, 1440].includes(width) || !Number.isInteger(limit) || limit < 1 || !/^http:\/\/localhost(?::\d+)?$/.test(base)) {
  throw new Error('Use --width=390|1440 --limit=positiveInteger --base=http://localhost:80');
}
const routeFiles = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) walk(join(dir, item.name));
    else if (item.isFile() && /^page\.[jt]sx?$/.test(item.name)) routeFiles.push(join(dir, item.name));
  }
}
walk(root);
const routeMap = new Map();
for (const file of routeFiles.sort()) {
  const parts = relative(root, file).split('/').slice(0, -1);
  if (parts.some((part) => part.startsWith('@') || part.startsWith('[') || part.startsWith('(.)'))) continue;
  const route = '/' + parts.filter((part) => !/^\(.*\)$/.test(part)).join('/');
  if (routeMap.has(route)) throw new Error(`Duplicate static route ${route}: ${file} and ${routeMap.get(route)}`);
  routeMap.set(route, relative(root, file));
}
const routes = [...routeMap.keys()].sort();
mkdirSync(out, { recursive: true });
function atomic(path, data) {
  const temp = `${path}.tmp.${process.pid}`;
  writeFileSync(temp, JSON.stringify(data, null, 2) + '\n');
  renameSync(temp, path);
}
atomic(join(out, 'static-routes.json'), { generatedAt: new Date().toISOString(), source: 'apps/web/src/app/**/page.[jt]sx?', count: routes.length, routes: Object.fromEntries(routeMap) });
const key = (route) => route === '/' ? 'root' : route.slice(1).replaceAll('/', '__');
const evidencePath = (route) => join(out, 'evidence', String(width), `${key(route)}.json`);
function overview() {
  const rows = routes.map((route) => {
    const file = evidencePath(route);
    if (!existsSync(file)) return { requestedRoute: route, status: 'not_tested' };
    try { return JSON.parse(readFileSync(file, 'utf8')); }
    catch (e) { return { requestedRoute: route, status: 'invalid_checkpoint', error: String(e) }; }
  });
  const tally = Object.fromEntries([...new Set(rows.map((r) => r.status))].map((status) => [status, rows.filter((r) => r.status === status).length]));
  atomic(join(out, `results-${width}.json`), { generatedAt: new Date().toISOString(), width, base, requestedRole, roleNote: 'Demo mode fixes rendered role to existing_founder; cookie alone does not establish authorization.', sourceRouteCount: routes.length, tally, rows });
  return tally;
}
async function preflight() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`${base}/login`, { signal: controller.signal });
    return response.status === 200 ? null : `GET /login returned ${response.status}`;
  } catch (error) { return `GET /login failed: ${error.message}`; }
  finally { clearTimeout(timer); }
}
const down = await preflight();
if (down) {
  atomic(join(out, `availability-${width}.json`), { at: new Date().toISOString(), base, error: down, browserNotStarted: true });
  console.error(`Preview unavailable; stopped without navigating: ${down}`);
  overview();
  process.exitCode = 2;
} else {
  let browser;
  try {
    browser = await chromium.launch({ executablePath: flags.browser ?? '/repl/tools/bin/chromium' });
    const pending = routes.filter((route) => {
      if (flags.route && flags.route !== route) return false;
      const path = evidencePath(route);
      if (!existsSync(path)) return true;
      if (flags['retry-incomplete']) {
        try { return ['loading', 'navigation_or_measurement_failure', 'invalid_checkpoint'].includes(JSON.parse(readFileSync(path, 'utf8')).status); }
        catch { return true; }
      }
      if (flags['retry-failed']) {
        try { return JSON.parse(readFileSync(path, 'utf8')).status !== 'pass'; } catch { return true; }
      }
      return false;
    }).slice(0, limit);
    let failuresInARow = 0;
    for (const route of pending) {
      const unavailable = await preflight();
      if (unavailable) {
        atomic(join(out, `availability-${width}.json`), { at: new Date().toISOString(), base, error: unavailable, stoppedBeforeRoute: route });
        console.error(`Preview unavailable before ${route}: ${unavailable}`);
        break;
      }
      const row = {
        requestedRoute: route, sourceFile: routeMap.get(route), width, requestedRole,
        mode: 'synthetic preview demo (read-only navigation; no form submission)',
        startedAt: new Date().toISOString(), status: 'incomplete', actualFinalUrl: null,
        httpStatus: null, renderedRole: null, axe: { status: AxeBuilder ? 'not_run' : 'unavailable' },
        consoleErrors: [], pageErrors: [],
      };
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      await context.addCookies([
        { name: 'cfb_session', value: 'preview-demo', domain: 'localhost', path: '/' },
        { name: 'cfb_primary_role', value: requestedRole, domain: 'localhost', path: '/' },
        { name: 'cfb_preview_demo', value: '1', domain: 'localhost', path: '/' },
      ]);
      await context.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({ id: 'preview-demo-user', email: 'demo@cofounderbay.com', role: 'founder', displayName: 'Alex Demo', firstName: 'Alex', lastName: 'Demo' }));
        localStorage.setItem('cfb_demo_data', '1');
        localStorage.setItem('accessToken', 'preview-demo');
        localStorage.setItem('cookie_consent', 'accepted');
      });
      const page = await context.newPage();
      page.on('pageerror', (e) => row.pageErrors.push(e.message.slice(0, 250)));
      page.on('console', (msg) => {
        if (msg.type() === 'error') row.consoleErrors.push(msg.text().replace(/https?:\/\/[^\s)]+/g, '[URL]').slice(0, 250));
      });
      try {
        const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 35000 });
        row.httpStatus = response?.status() ?? null;
        // Wait for meaningful content rather than interpreting skeleton/loading as a pass.
        await page.waitForFunction(() => {
          const main = document.querySelector('#main-content, main') || document.body;
          const text = main?.innerText?.trim() || '';
          const loading = [...document.querySelectorAll('[role="status"],[aria-busy="true"],[class*="skeleton" i]')]
            .some((el) => el.getClientRects().length && /loading|φορτών|skeleton/i.test((el.innerText || el.className || '').toString()));
          return text.split(/\s+/).length >= 20 && !loading;
        }, null, { timeout: 12000 }).catch(() => {});
        await page.waitForTimeout(350);
        row.actualFinalUrl = page.url();
        row.finalPath = new URL(page.url()).pathname;
        row.measurement = await page.evaluate(() => {
          const main = document.querySelector('#main-content, main') || document.body;
          const text = main?.innerText?.trim() || '';
          const headings = [...document.querySelectorAll('h1')].filter((el) => el.getClientRects().length).map((el) => el.innerText.trim().slice(0, 100));
          const loadingElements = [...document.querySelectorAll('[role="status"],[aria-busy="true"],[class*="skeleton" i]')].filter((el) => el.getClientRects().length).slice(0, 5).map((el) => (el.innerText || el.getAttribute('aria-label') || el.className || '').toString().slice(0, 70));
          const unnamed = [...document.querySelectorAll('button,a[href],input,select,textarea')].filter((el) => {
            if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true') return false;
            if (el.tagName === 'INPUT' && el.type === 'hidden') return false;
            const label = el.labels?.length ? [...el.labels].map((l) => l.textContent).join(' ') : '';
            return !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || label || el.textContent || '').trim();
          }).slice(0, 15).map((el) => ({ tag: el.tagName.toLowerCase(), html: el.outerHTML.slice(0, 180) }));
          const de = document.documentElement;
          return {
            title: document.title.slice(0, 120), headings, wordCount: text.split(/\s+/).filter(Boolean).length,
            textExcerpt: text.slice(0, 220), loadingElements, bodyBusy: document.body.getAttribute('aria-busy'),
            horizontalOverflowPx: Math.max(0, de.scrollWidth - de.clientWidth),
            unnamedVisibleControls: unnamed,
            renderedRoleCookie: document.cookie.match(/(?:^|;\s*)cfb_primary_role=([^;]+)/)?.[1] ?? null,
            roleSignals: [...document.querySelectorAll('[data-role], [data-primary-role]')].slice(0, 5).map((e) => ({ role: e.getAttribute('data-role'), primary: e.getAttribute('data-primary-role') })),
          };
        });
        row.renderedRole = row.measurement.renderedRoleCookie === 'existing_founder'
          ? 'existing_founder (preview-demo fixed role, not authorization proof)'
          : `unverified (cookie: ${row.measurement.renderedRoleCookie ?? 'absent'})`;
        row.loadingState = row.measurement.wordCount < 20 || !!row.measurement.bodyBusy || (row.measurement.loadingElements.length > 0 && row.measurement.wordCount < 45);
        if (row.httpStatus === 200 && !row.loadingState && AxeBuilder) {
          try {
            const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
            row.axe = { status: 'completed', violations: result.violations.map((v) => ({
              id: v.id, impact: v.impact, description: v.help, count: v.nodes.length,
              nodes: v.nodes.slice(0, 4).map((n) => ({ target: n.target, failureSummary: n.failureSummary?.slice(0, 250) })),
            })), incompleteCount: result.incomplete.length };
          } catch (error) { row.axe = { status: 'error', error: String(error).slice(0, 250) }; }
        }
        row.status = row.httpStatus !== 200 ? 'http_failure'
          : row.finalPath !== route ? 'redirect'
          : row.loadingState ? 'loading'
          : row.pageErrors.length || row.consoleErrors.length || row.measurement.horizontalOverflowPx > 0 ||
            row.measurement.unnamedVisibleControls.length || row.axe.status === 'error' ||
            row.axe.violations?.length ? 'issue' : 'pass';
      } catch (error) {
        row.status = 'navigation_or_measurement_failure';
        row.error = String(error).slice(0, 400);
        row.actualFinalUrl = page.url();
      } finally {
        row.finishedAt = new Date().toISOString();
        mkdirSync(join(out, 'evidence', String(width)), { recursive: true });
        if (existsSync(evidencePath(route))) {
          const history = join(out, 'history', String(width));
          mkdirSync(history, { recursive: true });
          copyFileSync(evidencePath(route), join(history, `${key(route)}.${Date.now()}.json`));
        }
        atomic(evidencePath(route), row);
        await context.close();
      }
      console.log(`${width} ${route} ${row.status} HTTP=${row.httpStatus ?? '-'} final=${row.finalPath ?? row.actualFinalUrl}`);
      overview();
      if (row.httpStatus === 502 || row.httpStatus === 503 || row.status === 'navigation_or_measurement_failure') failuresInARow++;
      else failuresInARow = 0;
      if (failuresInARow >= 2) { console.error('Stopped after two consecutive server/navigation failures'); break; }
    }
  } finally {
    await browser?.close();
    console.log('Checkpoint tally:', overview());
  }
}