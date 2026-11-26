import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReadinessSummary } from './ReadinessSummary';
import { buildDemoAssessment } from '@/lib/readiness-assessment';
import { writeReadinessOverlay } from '@/lib/readiness-demo';

/**
 * The Builder's Readiness tab is the Readiness page in one card (owner,
 * 2026-11-26; docs §158): the same assessment, so the same figures, and the
 * way to the page.
 */
vi.mock('@/lib/preview-demo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/preview-demo')>()),
  isPreviewDemo: () => true,
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <>{en}</> }));

const renderSummary = () => render(
  <QueryClientProvider client={new QueryClient()}>
    <ReadinessSummary workspaceId="ws-1" />
  </QueryClientProvider>,
);

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('the readiness summary', () => {
  it('shows the page’s own score and criteria, and links to the page', async () => {
    const seed = buildDemoAssessment();
    const overall = Math.round((seed.overallScore / seed.overallMax) * 100);
    renderSummary();
    await waitFor(() => expect(document.querySelector('[data-readiness-summary="ready"]')).toBeTruthy());
    expect(screen.getByText(String(overall))).toBeTruthy();
    // Five criteria per dimension, as on the page: the team reads 3/5, not 3/6.
    const team = seed.dimensions.find((d) => d.dimension === 'team')!;
    const done = team.criteria.filter((c) => c.completed).length;
    const teamRow = document.querySelector('a[href="/readiness#dim-team"]')!;
    expect(teamRow.textContent).toContain(`${done}/${team.criteria.length}`);
    expect(team.criteria).toHaveLength(5);
    expect(document.querySelector('a[href="/readiness"]')).toBeTruthy();
  });

  it('follows a tick made on the page', async () => {
    renderSummary();
    await waitFor(() => expect(document.querySelector('[data-readiness-summary="ready"]')).toBeTruthy());
    const before = buildDemoAssessment();
    const team = before.dimensions.find((d) => d.dimension === 'team')!;
    const open = team.criteria.find((c) => !c.completed)!;
    writeReadinessOverlay({ [`team/${open.id}`]: true });
    window.dispatchEvent(new CustomEvent('cfb:readiness-updated'));
    const doneAfter = team.criteria.filter((c) => c.completed).length + 1;
    await waitFor(() => expect(document.querySelector('a[href="/readiness#dim-team"]')!.textContent).toContain(`${doneAfter}/${team.criteria.length}`));
  });
});
