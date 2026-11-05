import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast';
import type { ExpertReviewItem } from '@/lib/api';

const updateExpertReview = vi.fn(async (_id: string, body: Record<string, unknown>) => ({ review: { id: 'r1', ...body } }));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  updateExpertReview: (id: string, body: Record<string, unknown>) => updateExpertReview(id, body),
}));
// The browser's own confirm stands in for the dialog provider.
vi.stubGlobal('confirm', () => true);

import { AskedOfMe } from './AskedOfMe';

afterEach(() => {
  cleanup();
  updateExpertReview.mockClear();
});

const review = (status: ExpertReviewItem['status']): ExpertReviewItem => ({
  id: 'r1',
  requester: { id: 'user-sofia', displayName: 'Sofia Alexiou', headline: 'Founder at Meltemi', avatarUrl: null },
  expert: { id: 'me', displayName: 'Alex Demo', headline: null, avatarUrl: null },
  workspaceId: null,
  reviewType: 'pitch_deck',
  status,
  requestMessage: 'Does our customer slide convince?',
  documents: [],
  summaryFeedback: null,
  strengths: [],
  improvements: [],
  scoreOverall: null,
  scoresByArea: {},
  isPaid: false,
  agreedFee: null,
  currency: 'EUR',
  requestedAt: '2026-10-27T10:00:00Z',
  acceptedAt: null,
  dueDate: null,
  submittedAt: null,
  rating: null,
  ratingComment: null,
});

function renderList(props: Partial<Parameters<typeof AskedOfMe>[0]>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AskedOfMe reviews={[review('requested')]} draft={null} onDraftUsed={() => {}} focusId={null} {...props} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('reviews asked of the reader (docs §111)', () => {
  it('shows what was asked and accepts it', async () => {
    renderList({});
    expect(screen.getAllByText(/Does our customer slide convince/).length).toBeGreaterThan(0);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Accept/ })); });
    await waitFor(() => expect(updateExpertReview).toHaveBeenCalledWith('r1', { status: 'accepted' }));
  });

  it('opens the form filled from the assistant’s draft, and submits through "being written"', async () => {
    const onDraftUsed = vi.fn();
    renderList({
      reviews: [review('accepted')],
      draft: { reviewId: 'r1', summaryFeedback: 'The problem lands; the traction does not yet.', strengths: 'Problem: named early', improvements: 'Traction: lead with retention', scoreOverall: '7' },
      onDraftUsed,
    });
    await waitFor(() => expect(onDraftUsed).toHaveBeenCalled());
    expect((screen.getByLabelText(/Summary/) as HTMLTextAreaElement).value).toBe('The problem lands; the traction does not yet.');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Submit review/ })); });
    await waitFor(() => expect(updateExpertReview).toHaveBeenCalledTimes(2));
    expect(updateExpertReview.mock.calls[0]).toEqual(['r1', { status: 'in_progress' }]);
    expect(updateExpertReview.mock.calls[1][1]).toMatchObject({
      status: 'submitted',
      summaryFeedback: 'The problem lands; the traction does not yet.',
      strengths: [{ area: 'Problem', comment: 'named early' }],
      improvements: [{ area: 'Traction', recommendation: 'lead with retention' }],
      scoreOverall: 7,
    });
  });

  it('says how reviewers are found when nothing is asked', () => {
    renderList({ reviews: [] });
    expect(screen.getAllByText(/Nobody has asked you for a review yet/).length).toBeGreaterThan(0);
  });
});
