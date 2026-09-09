import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Routes reachable without a session. Everything else is behind the auth
 * middleware, which 307s to /login, so an unauthenticated crawl of them would
 * only ever assert against the login page.
 */
const PUBLIC_ROUTES = [
  { path: '/', name: 'landing' },
  { path: '/pricing', name: 'pricing' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/terms', name: 'terms' },
  { path: '/privacy', name: 'privacy' },
];

/**
 * Rules asserted on every public page. Scoped deliberately: this is a
 * regression guard for the defects fixed in the accessibility pass, not a
 * blanket audit that would fail on unrelated pre-existing issues and get
 * switched off within a week.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    // Cookie banner and floating UI mount after hydration; scanning before they
    // exist would miss exactly the kind of late-mounted control that regresses.
    await page.waitForTimeout(1200);

    const results = await scan(page);

    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}`,
    );
    expect(summary, `axe violations on ${route.path}`).toEqual([]);
  });
}

test('skip link is the first focusable element and targets main', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('Tab');

  const focused = page.locator(':focus');
  await expect(focused).toHaveClass(/skip-to-content/);
  await expect(focused).toHaveAttribute('href', '#main-content');
});

test('viewport does not lock zoom', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).not.toContain('user-scalable=no');
  expect(content).not.toContain('maximum-scale=1');
});

test('every icon-only control has an accessible name', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const unnamed = await page.evaluate(() => {
    const offenders: string[] = [];
    document.querySelectorAll('button, a[href]').forEach((el) => {
      const text = (el.textContent || '').trim();
      const named =
        text.length > 0 ||
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby') ||
        el.getAttribute('title');
      if (!named) offenders.push(el.outerHTML.slice(0, 120));
    });
    return offenders;
  });

  expect(unnamed, 'controls with no accessible name').toEqual([]);
});

test('toast region exists as a live region before any toast fires', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // The region must be in the DOM before a toast is inserted, or screen
  // readers do not announce the insertion.
  const region = page.locator('[role="region"][aria-label="Notifications"]');
  await expect(region).toHaveCount(1);
  await expect(region).toHaveAttribute('aria-live', 'polite');
});

test('security headers are present on a document response', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  const headers = response!.headers();

  expect(headers['content-security-policy']).toBeTruthy();
  expect(headers['content-security-policy']).toContain("object-src 'none'");
  expect(headers['permissions-policy']).toContain('geolocation=()');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-content-type-options']).toBe('nosniff');
});

test('unauthenticated app routes redirect to login', async ({ page }) => {
  const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  expect(response!.url()).toContain('/login');
  expect(response!.url()).toContain('redirect=%2Fdashboard');
});
