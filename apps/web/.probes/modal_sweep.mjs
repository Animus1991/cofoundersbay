import { createRequire } from 'node:module';
const requireFromWeb = createRequire(new URL('../package.json', import.meta.url));
const { chromium } = requireFromWeb('@playwright/test');

const BASE = 'http://localhost:3000';
const W = Number(process.env.W || 1440);

const CASES = [
  { route: '/milestones', trigger: /New milestone|Νέο ορόσημο/i, name: 'milestone-new' },
  { route: '/groups', trigger: /Create|Δημιουργία/i, name: 'group-create' },
  { route: '/messages', trigger: /New message|Νέο μήνυμα/i, name: 'message-compose' },
];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
await ctx.addCookies([
  { name: 'cfb_session', value: 'probe', domain: 'localhost', path: '/' },
  { name: 'cfb_primary_role', value: 'platform_admin', domain: 'localhost', path: '/' },
]);
await ctx.addInitScript(() => {
  localStorage.setItem('user', JSON.stringify({ id: 'u_1', email: 'a@b.test', role: 'admin' }));
  localStorage.setItem('cfb_demo_data', '1');
  localStorage.setItem('cookie_consent', 'accepted');
  for (const tour of ['matches', 'founder-dashboard', 'milestones', 'groups', 'messages']) {
    for (const u of ['preview', 'u_1', 'preview-demo-user']) localStorage.setItem(`cfb.tour.${tour}.${u}`, 'done');
  }
});

for (const c of CASES) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 90)));
  await page.goto(BASE + c.route, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('NAV ' + e.message.slice(0, 60)));
  await page.waitForTimeout(900);

  const trigger = page.getByRole('button', { name: c.trigger }).first();
  const found = await trigger.count().then(() => true).catch(() => false);
  if (!found) { console.log(c.route, '| trigger not found'); await page.close(); continue; }
  await trigger.click().catch((e) => errors.push('CLICK ' + e.message.slice(0, 60)));
  await page.waitForTimeout(700);

  const dialog = page.getByRole('dialog').first();
  const open = await dialog.count();
  if (!open) { console.log(c.route, '| no dialog opened', errors.join(' | ')); await page.close(); continue; }

  const metrics = await dialog.evaluate((d) => {
    const r = d.getBoundingClientRect();
    const unnamed = [];
    for (const el of d.querySelectorAll('button, input, select, textarea, [role="button"]')) {
      const name = el.getAttribute('aria-label')
        || el.getAttribute('aria-labelledby')
        || el.getAttribute('title')
        || (el.textContent || '').trim()
        || el.getAttribute('placeholder')
        || (el.labels && el.labels.length ? 'label' : '')
        || '';
      if (!name) unnamed.push(el.tagName + '.' + (el.className + '').split(' ')[0]);
    }
    const focusEl = document.activeElement;
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      overVw: r.right > window.innerWidth || r.left < 0,
      overVh: r.bottom > window.innerHeight,
      unnamed: unnamed.slice(0, 6),
      focusedTag: focusEl ? focusEl.tagName : 'none',
      insideDialog: focusEl ? d.contains(focusEl) : false,
    };
  });
  await page.screenshot({ path: `.probes/modal-${c.name}-${W}.png` });

  // Escape should close it
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const stillOpen = await page.getByRole('dialog').count();
  console.log(c.route, '| open:', !!open, '| esc-closed:', !stillOpen, '|', JSON.stringify(metrics), '| errors:', errors.join('; ') || 'none');
  await page.close();
}
await b.close();
