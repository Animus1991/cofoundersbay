// Mentoring coherence: one demo session shows both mentoring stores on all
// sides - /mentor/sessions, /dashboard/mentor, /coaching, /mentoring,
// /mentor/mentees. Clicks Confirm on the requested booking to prove the
// write path, then re-shoots.
//   node .probes/mentoring-coherence/shot.mjs
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

// 1. Mentor sessions - the requested booking from Giorgos should be here with
//    Confirm, beside the confirmed one from Sofia.
let m = await go('/mentor/sessions');
await page.screenshot({ path: `${OUT}mentor-sessions-1440.png` });
const sessionsText = await page.locator('#main-content, main').innerText();
console.log('mentor-sessions overflow=%d giorgos=%s sofia=%s confirm=%s', m.overflow,
  /giorgos/i.test(sessionsText), /sofia/i.test(sessionsText), /confirm/i.test(sessionsText));

// 2. Click Confirm on the requested (Giorgos) booking.
const confirmBtn = page.locator('main button', { hasText: 'Confirm' }).first();
if (await confirmBtn.count()) {
  await confirmBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}mentor-sessions-confirmed-1440.png` });
  const after = await page.locator('#main-content, main').innerText();
  console.log('after-confirm: requestedLeft=%s', /awaiting your confirmation/i.test(after));
} else {
  console.log('after-confirm: no Confirm button found');
}

// 3. Mentor dashboard - banner + upcoming count.
m = await go('/dashboard/mentor');
await page.screenshot({ path: `${OUT}dashboard-mentor-1440.png` });
const dashText = await page.locator('#main-content, main').innerText();
console.log('dashboard overflow=%d awaitLine=%s', m.overflow, /await your confirmation|επιβεβαίωση/i.test(dashText));

// 4. Mentees - orphan strip + per-mentee meta.
m = await go('/mentor/mentees');
await page.screenshot({ path: `${OUT}mentor-mentees-1440.png` });
const menteesText = await page.locator('#main-content, main').innerText();
console.log('mentees overflow=%d orphanStrip=%s bookingMeta=%s', m.overflow,
  /without a mentorship|χωρίς σχέση/i.test(menteesText), /booking|κράτηση/i.test(menteesText));

// 5. Coaching - Sarah's confirmed booking on the founder side.
m = await go('/coaching');
await page.screenshot({ path: `${OUT}coaching-1440.png` });
const coachText = await page.locator('#main-content, main').innerText();
console.log('coaching overflow=%d sarah=%s bookingChip=%s', m.overflow, /sarah/i.test(coachText), /Booking|Κράτηση/.test(coachText));

// 6. Mentoring - My sessions tab shows both stores.
await go('/mentoring');
await page.locator('button[role=tab]', { hasText: 'My sessions' }).first().click().catch(() => {});
await page.waitForTimeout(2500);
m = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
await page.screenshot({ path: `${OUT}mentoring-sessions-1440.png` });
const mentText = await page.locator('#main-content, main').innerText();
console.log('mentoring overflow=%d sarah=%s mentorshipChip=%s bookingChip=%s', m.overflow,
  /sarah/i.test(mentText), /Mentorship|Σχέση καθοδήγησης/.test(mentText), /Booking|Κράτηση/.test(mentText));

// 7. Phone widths.
await page.setViewportSize({ width: 390, height: 844 });
for (const [route, name] of [['/mentor/sessions', 'mentor-sessions'], ['/coaching', 'coaching'], ['/mentoring', 'mentoring'], ['/dashboard/mentor', 'dashboard-mentor']]) {
  await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(2000);
  if (name === 'mentoring') await page.locator('button[role=tab]', { hasText: 'My sessions' }).first().click().catch(() => {});
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: `${OUT}${name}-390.png` });
  console.log('%s-390 overflow=%d', name, ov);
}

console.log('pageerrors=%d', errors.length, errors.slice(0, 5));
await b.close();
