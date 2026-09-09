import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility coverage for the authenticated half of the app.
 *
 * These routes sit behind the auth middleware and behind AdminGuard, and they
 * call the API on mount — so they cannot be rendered at all without a session
 * and something answering /api. The Playwright project supplies both: a session
 * cookie, seeded localStorage, and the stub in e2e/mock-api.mjs.
 *
 * Rendering them against the stub is not only an accessibility check. The first
 * run of this fixture is what surfaced the useAIChat crash that blanked every
 * authenticated page when the agents payload was malformed.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** One representative route per section, plus every role dashboard. */
const ROUTES = [
  { path: '/dashboard/founder', name: 'founder dashboard' },
  { path: '/dashboard/mentor', name: 'mentor dashboard' },
  { path: '/dashboard/investor', name: 'investor dashboard' },
  { path: '/dashboard/incubator', name: 'incubator dashboard' },
  { path: '/dashboard/provider', name: 'provider dashboard' },
  { path: '/discover', name: 'discover' },
  { path: '/matches', name: 'matches' },
  { path: '/messages', name: 'messages' },
  { path: '/settings', name: 'settings' },
  { path: '/settings/notifications', name: 'notification settings' },
  { path: '/notifications', name: 'notifications' },
  { path: '/achievements', name: 'achievements' },
  { path: '/feed', name: 'feed' },
  { path: '/milestones', name: 'milestones' },
  { path: '/admin', name: 'admin overview' },
  { path: '/admin/tenants', name: 'admin tenants' },
  { path: '/tenant/dashboard', name: 'tenant dashboard' },
];

/**
 * Establishes the session the middleware and AdminGuard look for.
 * AdminGuard reads `localStorage.user.role`; the middleware only checks that
 * the `cfb_session` cookie exists.
 */
async function signIn(page: Page) {
  await page.context().addCookies([
    { name: 'cfb_session', value: 'e2e', domain: 'localhost', path: '/' },
    { name: 'cfb_primary_role', value: 'platform_admin', domain: 'localhost', path: '/' },
  ]);
  await page.context().addInitScript(() => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 'u_1', email: 'admin@cofounderbay.test', role: 'admin' }),
    );
    // Pin the demo-data toggle so the assertions do not depend on its default.
    localStorage.setItem('cfb_demo_data', '1');
    // Dismiss the cookie banner, which otherwise overlays every page.
    localStorage.setItem('cookie_consent', 'accepted');
  });
}

test.describe('authenticated routes', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  for (const route of ROUTES) {
    test(`${route.name} renders and has no WCAG A/AA violations`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // A page that threw during render would otherwise "pass" the axe scan by
      // virtue of showing the error boundary, which is itself accessible.
      expect(pageErrors, `uncaught errors on ${route.path}`).toEqual([]);
      await expect(page.locator('main#main-content')).toHaveCount(1);

      const results = await new AxeBuilder({ page })
        .withTags(TAGS)
        // Radix mounts a Tabs/DropdownMenu panel only while it is open, so the
        // inactive triggers' `aria-controls` point at ids that do not exist yet.
        // That is library behaviour, not app markup — force-mounting every panel
        // to satisfy the rule would cost more than it buys. The dangling-ref
        // check below still covers ids the app writes itself.
        .disableRules(['aria-valid-attr-value'])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`,
      );
      expect(summary, `axe violations on ${route.path}`).toEqual([]);
    });
  }

  test('no app-authored aria-controls points at a missing element', async ({ page }) => {
    await page.goto('/discover', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Complements the disabled axe rule above: Radix generates ids prefixed
    // `radix-`, so anything else that dangles is ours and is a real bug.
    const dangling = await page.evaluate(() =>
      [...document.querySelectorAll('[aria-controls]')]
        .map((el) => el.getAttribute('aria-controls') ?? '')
        .filter((id) => id && !id.startsWith('radix-') && !document.getElementById(id)),
    );
    expect(dangling).toEqual([]);
  });

  test('the app shell is mounted exactly once', async ({ page }) => {
    await page.goto('/discover', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('aside')).toHaveCount(1);
  });

  test('the shell survives client-side navigation within a section', async ({ page }) => {
    await page.goto('/investor/pipeline', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1800);

    // Tag the live nodes; if navigation remounts the shell the tags are lost.
    await page.evaluate(() => {
      document.querySelector('aside')?.setAttribute('data-probe', 'x');
      document.querySelector('main#main-content')?.setAttribute('data-probe', 'x');
    });

    const target = page.locator('a[href^="/investor/"]').first();
    await target.click();
    await page.waitForTimeout(1800);

    await expect(page.locator('aside[data-probe="x"]')).toHaveCount(1);
    await expect(page.locator('main#main-content[data-probe="x"]')).toHaveCount(1);
  });
});
