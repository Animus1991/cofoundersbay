#!/usr/bin/env node
/**
 * Two real accounts, end to end, in a real browser (docs §113).
 *
 * The browser probes run on the demo and the acceptance run has no screen, so a
 * page could pass both and still break where they meet. This drives what only
 * two members can do: register through the form, connect, write to each other,
 * share a data room file, read each other's notifications, and delete both
 * accounts, which also leaves the database as it found it.
 *
 *   node scripts/real-accounts-browser.mjs            needs web on :3000, API on :3001
 *   BASE=http://localhost:3100 node scripts/real-accounts-browser.mjs
 *   SHOTS=some/folder node scripts/real-accounts-browser.mjs
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(join(root, 'apps', 'web', 'package.json'))('@playwright/test');

const BASE = process.env.BASE ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;
const stamp = Date.now();
const password = 'Smoke-Test-2026-xQ7!';

const results = [];
const check = (name, ok, detail = '') => {
  results.push(Boolean(ok));
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// A stand-in microphone, so a voice note can be recorded with no device and no prompt.
const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const pageErrors = [];
const serverErrors = new Set();

async function member(label, role) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('cfb_cookie_consent', 'true');
      localStorage.setItem('cookie_consent', 'accepted');
      localStorage.setItem('cfb_locale', 'el');
    } catch {
      // Private mode: the page falls back to its defaults.
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => pageErrors.push(`${label}: ${e.message.slice(0, 140)}`));
  page.on('response', (r) => {
    if (r.status() >= 500) serverErrors.add(`${label}: ${r.status()} ${r.url().replace(BASE, '').slice(0, 70)}`);
  });
  return { label, role, email: `cfb-smoke-${label}-${stamp}@example.test`, page, id: null, registered: false };
}

// Same origin through the web's proxy, with the double-submit token the app sends.
const call = (m, method, url, body) => m.page.evaluate(async ({ method, url, body }) => {
  const csrf = document.cookie.match(/(?:^|;\s*)cfb_csrf=([^;]*)/)?.[1];
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* an empty body */ }
  // The API wraps a success as { success, data }.
  return { status: res.status, data: data?.data ?? data };
}, { method, url, body });

const upload = (m, name) => m.page.evaluate(async ({ name }) => {
  const csrf = document.cookie.match(/(?:^|;\s*)cfb_csrf=([^;]*)/)?.[1];
  const form = new FormData();
  form.append('file', new File(['%PDF-1.7\n%smoke\n'], `${name}.pdf`, { type: 'application/pdf' }));
  form.append('name', name);
  const res = await fetch('/api/fundraising/documents', {
    method: 'POST',
    credentials: 'include',
    headers: csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {},
    body: form,
  });
  let data = null;
  try { data = await res.json(); } catch { /* an empty body */ }
  return { status: res.status, data: data?.data ?? data };
}, { name });

async function open(m, path, wait = 2600) {
  await m.page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await m.page.waitForTimeout(wait);
  return m.page.evaluate(() => document.body.innerText);
}

async function openThread(m, name) {
  await open(m, '/messages', 3500);
  await m.page.getByText(name).filter({ visible: true }).first().click({ force: true, timeout: 10000 }); // The row has a covering link, which is what a tap lands on.
  await m.page.waitForTimeout(1500);
}

async function shot(m, name) {
  if (SHOTS) await m.page.screenshot({ path: join(SHOTS, `real-${m.label}-${name}.png`) });
}

async function register(m) {
  await open(m, '/register', 3000);
  await m.page.locator('input[type="email"]').first().fill(m.email);
  await m.page.locator('input[type="password"]').first().fill(password);
  if (m.role === 'investor') await m.page.getByText('Επενδυτής', { exact: true }).first().click();
  const boxes = m.page.locator('input[type="checkbox"], button[role="checkbox"]');
  for (let i = 0; i < await boxes.count(); i++) await boxes.nth(i).click().catch(() => {});
  await m.page.locator('form button[type="submit"]').first().click();
  await m.page.waitForURL((u) => !u.pathname.startsWith('/register'), { timeout: 30000 }).catch(() => {});
  await m.page.waitForTimeout(2000);
  const me = await call(m, 'GET', '/api/auth/me');
  m.registered = me.status === 200;
  m.id = me.data?.user?.id ?? null;
  check(`${m.label}: registers through the form`, m.registered && m.id, `role ${m.role}`);
  if (!m.registered) throw new Error(`${m.label} has no session`);
}

const english = /wants to connect|accepted your connection|New message from|gave you access|shared a document|shared \d+ documents|A founder|Someone/;

const founder = await member('founder', 'founder');
const investor = await member('investor', 'investor');
const mentor = await member('mentor', 'founder');

try {
  await register(founder);
  await register(investor);
  await register(mentor);

  // A name, so that what the other member reads is about a person.
  for (const [m, name] of [[founder, 'Δοκιμή Ιδρυτής'], [investor, 'Δοκιμή Επενδυτής'], [mentor, 'Δοκιμή Τρίτο Μέλος']]) {
    const saved = await call(m, 'PATCH', '/api/me/profile', { displayName: name, headline: 'Δοκιμαστικό προφίλ' });
    check(`${m.label}: the profile saves a name`, saved.status < 300, saved.status < 300 ? '' : `${saved.status} ${JSON.stringify(saved.data).slice(0, 160)}`);
  }

  // Connect: one asks, the other answers on the page.
  const asked = await call(founder, 'POST', '/api/connections', { receiverId: investor.id, message: 'Γεια σας' });
  check('connect: the request goes out', asked.status < 300, `${asked.status} ${asked.status < 300 ? '' : JSON.stringify(asked.data).slice(0, 160)}`);
  let body = await open(investor, '/notifications');
  check('connect: the other member is told, in Greek', body.includes('αίτημα σύνδεσης') && !english.test(body), body.match(english)?.[0] ?? '');
  await shot(investor, 'notifications');
  await open(investor, '/connections');
  await investor.page.getByRole('button', { name: /^Αποδοχή/ }).first().click();
  await investor.page.waitForTimeout(1800);
  const status = await call(founder, 'GET', `/api/connections/status/${investor.id}`);
  check('connect: accepting on the page connects them', JSON.stringify(status.data).includes('accepted') || JSON.stringify(status.data).includes('connected'), JSON.stringify(status.data).slice(0, 120));
  body = await open(founder, '/notifications');
  check('connect: the founder is told, in Greek', body.includes('αποδοχή της σύνδεσής σας') && !english.test(body), body.match(english)?.[0] ?? '');

  // Write: the composer goes over the socket, which nothing else here exercises.
  const direct = await call(founder, 'POST', '/api/messages/conversations/direct', { userId: investor.id });
  check('message: a conversation opens', direct.status < 300 && direct.data?.conversationId, String(direct.status));
  await openThread(founder, 'Δοκιμή Επενδυτής');
  const composer = founder.page.getByPlaceholder(/Πληκτρολογήστε/).first();
  const words = `Δοκιμαστικό μήνυμα ${stamp}`;
  await composer.fill(words);
  await composer.press('Enter');
  await founder.page.waitForTimeout(2500);
  await shot(founder, 'message-sent');
  await openThread(investor, 'Δοκιμή Ιδρυτής');
  body = await investor.page.evaluate(() => document.body.innerText);
  check('message: it reaches the other member', body.includes(words));
  await shot(investor, 'message-read');

  // Change what was said: the founder corrects one message and takes another back.
  const bubble = (m, text) => m.page.getByText(text, { exact: false }).last();
  await bubble(founder, words).hover();
  await founder.page.getByTitle(/Επεξεργασία/).first().click();
  const corrected = `Διορθωμένο μήνυμα ${stamp}`;
  await composer.fill(corrected);
  await composer.press('Enter');
  await founder.page.waitForTimeout(1500);
  await openThread(investor, 'Δοκιμή Ιδρυτής');
  body = await investor.page.evaluate(() => document.body.innerText);
  check('edit: the other member reads the correction', body.includes(corrected) && !body.includes(words));
  check('edit: and sees that it changed', body.includes('επεξεργάστηκε'));

  const regret = `Μήνυμα προς διαγραφή ${stamp}`;
  await composer.fill(regret);
  await composer.press('Enter');
  await founder.page.waitForTimeout(1800);
  await bubble(founder, regret).hover();
  await founder.page.getByTitle(/Διαγραφή/).first().click();
  await founder.page.getByRole('dialog').getByRole('button', { name: 'Διαγραφή' }).click();
  await founder.page.waitForTimeout(1500);
  await openThread(investor, 'Δοκιμή Ιδρυτής');
  body = await investor.page.evaluate(() => document.body.innerText);
  check('delete: it is gone for the other member', !body.includes(regret));

  // A voice note: recorded, uploaded, and playable on the other side.
  await founder.page.getByRole('button', { name: /Εγγραφή φωνητικού μηνύματος/ }).click();
  await founder.page.waitForTimeout(1600);
  check('voice: the recording shows', await founder.page.locator('[data-voice-banner]').isVisible());
  await founder.page.locator('[data-voice-banner]').getByRole('button', { name: /Αποστολή/ }).click();
  await founder.page.waitForTimeout(3000);
  await shot(founder, 'voice-sent');
  await openThread(investor, 'Δοκιμή Ιδρυτής');
  const note = investor.page.locator('[data-voice-note]').last();
  check('voice: the other member gets a player', await note.count() > 0);
  // The element itself, so the page's Content-Security-Policy is part of the test.
  const playable = await note.evaluate((audio) => new Promise((resolve) => {
    const done = () => resolve({ ready: audio.readyState, error: audio.error?.code ?? null, src: audio.src.slice(0, 60) });
    if (audio.readyState >= 1) done();
    audio.addEventListener('loadedmetadata', done, { once: true });
    audio.addEventListener('error', done, { once: true });
    audio.load();
    setTimeout(done, 6000);
  }));
  check('voice: the browser can play it', playable.ready >= 1 && !playable.error, JSON.stringify(playable));
  await shot(investor, 'voice-read');

  // Forward: to a third member, marked as forwarded.
  const toThird = await call(founder, 'POST', '/api/messages/conversations/direct', { userId: mentor.id });
  check('forward: a second conversation opens', toThird.status < 300, String(toThird.status));
  await openThread(founder, 'Δοκιμή Επενδυτής');
  await shot(founder, 'before-forward');
  await bubble(founder, corrected).hover({ timeout: 8000 });
  await founder.page.getByTitle(/Προώθηση/).first().click();
  await founder.page.waitForTimeout(500);
  await founder.page.locator('[data-forward-targets]').getByText('Δοκιμή Τρίτο Μέλος').click();
  await founder.page.waitForTimeout(1800);
  await openThread(mentor, 'Δοκιμή Ιδρυτής');
  body = await mentor.page.evaluate(() => document.body.innerText);
  check('forward: the third member reads it', body.includes(corrected));
  check('forward: marked as forwarded', body.includes('Προωθημένο'));

  // Share: a linked investor sees a shared file and nothing else.
  const lead = await call(founder, 'POST', '/api/fundraising/leads', {
    investorName: 'Δοκιμή Επενδυτής',
    status: 'prospect',
    nextStep: 'Κλήση την Τρίτη',
    nextFollowUpAt: new Date(Date.now() + 2 * 864e5).toISOString(),
  });
  check('data room: the lead saves', lead.status < 300, `${lead.status} ${lead.status < 300 ? '' : JSON.stringify(lead.data).slice(0, 180)}`);
  const leadId = lead.data?.leads?.find((l) => l.investorName === 'Δοκιμή Επενδυτής')?.id;
  const linked = await call(founder, 'PATCH', `/api/fundraising/leads/${leadId}`, { platformUserId: investor.id });
  check('data room: the lead is linked to the account', linked.status < 300, `${linked.status} ${linked.status < 300 ? '' : JSON.stringify(linked.data).slice(0, 180)}`);
  const secret = await upload(founder, 'Ιδιωτικό έγγραφο');
  const shared = await upload(founder, 'Κοινό έγγραφο');
  check('data room: two files upload', secret.status < 300 && shared.status < 300, `${secret.status} ${shared.status}`);
  const docs = shared.data?.documents ?? [];
  const sharedId = docs.find((d) => d.name === 'Κοινό έγγραφο')?.id;
  const secretId = docs.find((d) => d.name === 'Ιδιωτικό έγγραφο')?.id;
  check('data room: both are in the state the API returns', sharedId && secretId, `${docs.length} documents`);
  const shareOne = await call(founder, 'POST', '/api/fundraising/documents/sharing', { documentIds: [sharedId], shared: true });
  check('data room: one is shared', shareOne.status < 300, `${shareOne.status} ${shareOne.status < 300 ? '' : JSON.stringify(shareOne.data).slice(0, 180)}`);

  body = await open(investor, '/data-room', 3000);
  check('data room: the investor reads the shared file on the page', body.includes('Κοινό έγγραφο'));
  check('data room: and not the other one', !body.includes('Ιδιωτικό έγγραφο'));
  await shot(investor, 'data-room');
  const allowed = await investor.page.evaluate(async (id) => (await fetch(`/api/fundraising/documents/${id}/file`, { credentials: 'include' })).status, sharedId);
  const refused = await investor.page.evaluate(async (id) => (await fetch(`/api/fundraising/documents/${id}/file`, { credentials: 'include' })).status, secretId);
  check('data room: the shared file downloads', allowed === 200, String(allowed));
  check('data room: the other file is refused', refused === 403 || refused === 404, String(refused));
  body = await open(investor, '/notifications');
  check('data room: the investor is told, in Greek', /κοινή χρήση εγγράφου|πρόσβαση στο data room/.test(body) && !english.test(body), body.match(english)?.[0] ?? '');

  body = await open(founder, '/fundraising', 3000);
  check('fundraising: the founder reads the lead and its next step', body.includes('Δοκιμή Επενδυτής') && body.includes('Κλήση την Τρίτη'));
  await founder.page.getByRole('tab', { name: /Data room/ }).first().click();
  await founder.page.waitForTimeout(1200);
  body = await founder.page.evaluate(() => document.body.innerText);
  check('fundraising: it shows who opened the file', body.includes('Το άνοιξαν: Δοκιμή Επενδυτής'));
  await shot(founder, 'data-room-opened');

  // A link for someone without an account (docs §114): made on the page, opened with no session.
  await founder.page.getByRole('button', { name: /Κοινοποίηση data room/ }).first().click();
  await founder.page.waitForTimeout(800);
  const links = founder.page.locator('[data-room-links]');
  check('link: offered on a real account', await links.isVisible());
  await links.getByLabel('Για ποιον είναι').fill('Για την Εύα');
  await links.getByRole('button', { name: /Δημιουργία συνδέσμου/ }).click();
  await founder.page.waitForTimeout(1500);
  const address = await links.locator('input[readonly]').inputValue();
  check('link: the address is shown once', /\/dd\//.test(address), address.slice(0, 40));
  const stranger = await browser.newContext({ viewport: { width: 390, height: 780 } });
  const outside = await stranger.newPage();
  await outside.goto(address, { waitUntil: 'domcontentloaded' });
  await outside.waitForTimeout(2600);
  body = await outside.evaluate(() => document.body.innerText);
  check('link: opens with no account', body.includes('Κοινό έγγραφο'), body.slice(0, 80));
  check('link: and not the private file', !body.includes('Ιδιωτικό έγγραφο'));
  const file = await outside.evaluate(async () => (await fetch(document.querySelector('a[href*="/documents/"]').href)).status);
  check('link: the file downloads', file === 200, String(file));
  await links.getByRole('button', { name: /Ανάκληση/ }).first().click();
  await founder.page.waitForTimeout(1200);
  await outside.reload({ waitUntil: 'domcontentloaded' });
  await outside.waitForTimeout(2600);
  body = await outside.evaluate(() => document.body.innerText);
  check('link: a revoked link no longer opens', body.includes('δεν ανοίγει') && !body.includes('Κοινό έγγραφο'), body.slice(0, 80));
  await stranger.close();
  await founder.page.keyboard.press('Escape');

  // The cap table and the note to an investor, on the live path.
  await open(founder, '/fundraising', 3000);
  await founder.page.getByRole('tab', { name: /Cap table/ }).click();
  await founder.page.waitForTimeout(600);
  await founder.page.getByLabel('Κάτοχος').fill('Δοκιμή Ιδρυτής');
  await founder.page.getByLabel('Μετοχές').fill('900');
  await founder.page.locator('[data-cap-table]').getByRole('button', { name: /Προσθήκη/ }).click();
  await founder.page.waitForTimeout(1500);
  await open(founder, '/fundraising', 3000);
  await founder.page.getByRole('tab', { name: /Cap table/ }).click();
  await founder.page.waitForTimeout(600);
  check('cap table: it survives a reload', (await founder.page.locator('[data-cap-table]').innerText()).includes('Δοκιμή Ιδρυτής'));
  await founder.page.getByRole('tab', { name: /Pipeline/ }).click();
  await founder.page.waitForTimeout(500);
  await founder.page.getByRole('button', { name: /Γράψτε email/ }).first().click();
  await founder.page.waitForTimeout(800);
  check('email: starts from the next step', (await founder.page.locator('#investor-email-body').inputValue()).length > 20);
  await founder.page.keyboard.press('Escape');

  // Steps on a milestone, and the home that reads it.
  const due = await call(founder, 'POST', '/api/milestones', { title: 'Δοκιμή ορόσημο', dueDate: '2026-01-01' });
  check('milestone: saves', due.status < 300, String(due.status));
  await open(founder, '/milestones', 3000);
  const steps = founder.page.locator('[data-milestone-checklist]').first();
  await steps.locator('button').first().click();
  await steps.getByPlaceholder(/Ένα βήμα/).fill('Πρώτο βήμα');
  await steps.getByRole('button', { name: /Προσθήκη/ }).last().click();
  await founder.page.waitForTimeout(1200);
  await steps.getByRole('checkbox').first().click();
  await founder.page.waitForTimeout(1500);
  const saved = await call(founder, 'GET', `/api/milestones/${due.data.id}`);
  check('milestone: a tick reaches the database', saved.data?.progress === 100 && saved.data?.checklist?.[0]?.done === true, JSON.stringify(saved.data?.checklist ?? null).slice(0, 80));
  body = await open(founder, '/dashboard', 3000);
  check('home: Today names the overdue milestone', (await founder.page.locator('[data-home-today]').innerText()).includes('Δοκιμή ορόσημο'));
  body = await open(founder, '/notifications', 3000);
  check('notifications: and so does this page', body.includes('Εκπρόθεσμο ορόσημο: Δοκιμή ορόσημο'));
} catch (e) {
  check('ran to the end', false, e.message.split('\n')[0].slice(0, 180));
} finally {
  for (const m of [founder, investor, mentor]) {
    if (!m.registered) continue;
    const gone = await call(m, 'POST', '/api/account/delete', { password, email: m.email });
    check(`${m.label}: the account deletes itself`, gone.status < 300, `${gone.status} ${gone.status < 300 ? '' : JSON.stringify(gone.data).slice(0, 200)}`);
  }
  await browser.close();
  console.log('page errors', pageErrors.length, [...new Set(pageErrors)].slice(0, 6));
  console.log('server errors', serverErrors.size, [...serverErrors].slice(0, 10));
  const passed = results.filter(Boolean).length;
  console.log(`${passed}/${results.length} passed`);
  process.exitCode = passed === results.length && pageErrors.length === 0 && serverErrors.size === 0 ? 0 : 1;
}
