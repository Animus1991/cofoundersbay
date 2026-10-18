// Wide-viewport fixes: /builder/applications, /research, /research/board-gtm,
// /milestones, /fundraising at 1440 and 2200x1200, signed in (platform_admin,
// demo world). Reports horizontal overflow and, on the board route, whether
// the minimap and the Co chat bubble overlap.
//   node .probes/wide-fixes/shot.mjs
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const OUT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  '/builder/applications',
  '/research',
  '/research/board-gtm',
  '/milestones',
  '/fundraising',
];

const b = await chromium.launch();

async function sweep(width, height, tag) {
  const ctx = await b.newContext({ viewport: { width, height } });
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

  for (const route of ROUTES) {
    const errors = [];
    const onErr = (e) => errors.push(String(e).slice(0, 100));
    page.on('pageerror', onErr);
    const resp = await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => { errors.push('NAV:' + e.message.slice(0, 80)); return null; });
    await page.waitForTimeout(1800);
    page.off('pageerror', onErr);

    const metrics = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      let mapRect = null, bubbleRect = null;
      const map = document.querySelector('canvas')?.closest('[data-canvas-chrome]')
        ?? [...document.querySelectorAll('[data-canvas-chrome]')].find((el) => el.querySelector('canvas'));
      if (map) {
        const r = map.getBoundingClientRect();
        mapRect = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
      // The Co chat bubble: a fixed/absolute round button near bottom-right.
      const cands = [...document.querySelectorAll('button, a')].filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        return r.width > 30 && r.width < 80 && Math.abs(r.width - r.height) < 4
          && r.right > innerWidth - 90 && r.bottom > innerHeight - 90;
      });
      if (cands.length) {
        const r = cands[cands.length - 1].getBoundingClientRect();
        bubbleRect = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
      let overlap = null;
      if (mapRect && bubbleRect) {
        const ox = Math.max(0, Math.min(mapRect.x + mapRect.w, bubbleRect.x + bubbleRect.w) - Math.max(mapRect.x, bubbleRect.x));
        const oy = Math.max(0, Math.min(mapRect.y + mapRect.h, bubbleRect.y + bubbleRect.h) - Math.max(mapRect.y, bubbleRect.y));
        overlap = ox > 2 && oy > 2;
      }
      return { overflow, mapRect, bubbleRect, overlap };
    });

    const name = route.replace(/\//g, '-').replace(/^-/, '') || 'home';
    await page.screenshot({ path: `${OUT}${name}-${tag}.png` });
    console.log(`${tag} ${route}: status=${resp?.status() ?? '?'} errors=${errors.length} overflow=${metrics.overflow} map/bubble overlap=${metrics.overlap}${errors.length ? ' :: ' + errors.join(' | ') : ''}`);
  }
  await ctx.close();
}

await sweep(1440, 900, '1440');
await sweep(2200, 1200, '2200');
await sweep(390, 844, '390');
await b.close();
