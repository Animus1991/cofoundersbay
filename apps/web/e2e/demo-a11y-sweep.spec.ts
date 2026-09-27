import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Static WCAG 2.2 AA + layout sweep of the top founder-facing routes, run in
 * the built-in preview demo mode (no API). Run with:
 *
 *   A11Y_BASE_URL=http://localhost:3000 npx playwright test e2e/demo-a11y-sweep.spec.ts
 *
 * Writes a machine-readable report to test-results/demo-a11y-sweep.json so the
 * findings can be triaged outside the runner.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const ROUTES = [
  '/dashboard/founder',
  '/matches',
  '/discover',
  '/builder',
  '/builder/pitch-deck',
  '/builder/applications',
  '/research',
  '/readiness',
  '/analytics',
  '/messages',
  '/connections',
  '/milestones',
  '/projects',
  '/fundraising',
  '/opportunities',
  '/programs',
  '/marketplace',
  '/expert-reviews',
  '/feed',
  '/settings',
  '/org/cohorts/demo-cohort-1',
];

type Finding = {
  route: string;
  viewport: string;
  violations: { id: string; impact: string | null | undefined; help: string; nodes: number; targets: string[] }[];
  overflow: string[];
  status: number | null;
};

const findings: Finding[] = [];

async function waitForStableDom(page: Page, quietMs = 700, timeoutMs = 12_000) {
  await page.evaluate(
    ([quiet, limit]) =>
      new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        const done = () => { observer.disconnect(); resolve(); };
        const observer = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(done, quiet); });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        timer = setTimeout(done, quiet);
        setTimeout(done, limit);
      }),
    [quietMs, timeoutMs] as const,
  );
}

async function enterDemo(page: Page) {
  await page.goto('/demo');
  await page.waitForURL(/\/dashboard\/founder/, { timeout: 20_000 });
  // Tours are covered by their own test; keep them out of the page scans.
  await page.evaluate(() => {
    for (const id of ['matches', 'builder', 'research']) localStorage.setItem(`cfb.tour.${id}.preview-demo-user`, 'done');
  });
}

test.describe.configure({ mode: 'serial' });

for (const route of ROUTES) {
  test(`a11y + layout: ${route}`, async ({ page }, testInfo) => {
    await enterDemo(page);
    const response = await page.goto(route);
    await waitForStableDom(page);

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed')
        .slice(0, 5)
        .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0, 3).join('.')}`),
    );

    findings.push({
      route,
      viewport: testInfo.project.name,
      status: response?.status() ?? null,
      overflow,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
      })),
    });

    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect.soft(blocking, `${route} @ ${testInfo.project.name}: ${blocking.map((v) => v.id).join(', ')}`).toEqual([]);
    expect.soft(overflow, `${route} @ ${testInfo.project.name} overflows horizontally`).toEqual([]);
  });
}

test('first-run tour dialog is accessible', async ({ page }, testInfo) => {
  await page.goto('/demo');
  await page.waitForURL(/\/dashboard\/founder/, { timeout: 20_000 });
  await page.goto('/matches');
  const dialog = page.getByTestId('first-run-tour-step');
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog).toBeFocused();
  const results = await new AxeBuilder({ page }).withTags(TAGS).include('[data-testid="first-run-tour"]').analyze();
  findings.push({
    route: '/matches#tour',
    viewport: testInfo.project.name,
    status: 200,
    overflow: [],
    violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })),
  });
  expect.soft(results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('cfb.tour.matches.preview-demo-user'))).toBe('done');
});

test.afterAll(async ({}, testInfo) => {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/demo-a11y-sweep.${testInfo.project.name}.json`, JSON.stringify(findings, null, 2));
});
