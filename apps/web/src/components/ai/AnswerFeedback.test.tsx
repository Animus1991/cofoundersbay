import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  setAnswerFeedback: vi.fn(async () => ({})),
  clearAnswerFeedback: vi.fn(async () => ({ ok: true })),
}));
const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), ...api }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => toast }));

import { AnswerFeedback } from './AnswerFeedback';

const up = () => screen.getByRole('button', { name: /^Helpful answer/ });
const down = () => screen.getByRole('button', { name: /^Not a helpful answer/ });

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('the thumbs under an answer (docs §111)', () => {
  it('sends the verdict with the assistant’s name, and the same thumb takes it back', async () => {
    render(<AnswerFeedback answerId="assistant-1" source="builtin" />);
    fireEvent.click(up());
    expect(up().getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(api.setAnswerFeedback).toHaveBeenCalledWith('assistant-1', { helpful: true, source: 'builtin' }));
    fireEvent.click(up());
    await waitFor(() => expect(api.clearAnswerFeedback).toHaveBeenCalledWith('assistant-1'));
    expect(up().getAttribute('aria-pressed')).toBe('false');
  });

  it('offers the reasons on a 👎 only, and a reason is optional', async () => {
    render(<AnswerFeedback answerId="assistant-2" source="builtin" />);
    expect(screen.queryByRole('group')).toBeNull();
    fireEvent.click(down());
    await waitFor(() => expect(api.setAnswerFeedback).toHaveBeenLastCalledWith('assistant-2', { helpful: false, source: 'builtin' }));
    fireEvent.click(screen.getByRole('button', { name: /Hard to follow/ }));
    await waitFor(() => expect(api.setAnswerFeedback).toHaveBeenLastCalledWith('assistant-2', { helpful: false, reason: 'unclear', source: 'builtin' }));
    fireEvent.click(up());
    await waitFor(() => expect(api.setAnswerFeedback).toHaveBeenLastCalledWith('assistant-2', { helpful: true, source: 'builtin' }));
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('shows the saved verdict again after a reload', () => {
    const first = render(<AnswerFeedback answerId="assistant-3" source="builtin" />);
    fireEvent.click(up());
    first.unmount();
    render(<AnswerFeedback answerId="assistant-3" source="builtin" />);
    expect(up().getAttribute('aria-pressed')).toBe('true');
  });

  it('goes back and says so when the save fails', async () => {
    api.setAnswerFeedback.mockRejectedValueOnce(new Error('offline'));
    render(<AnswerFeedback answerId="assistant-4" source="builtin" />);
    fireEvent.click(down());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not save your rating', 'offline'));
    expect(down().getAttribute('aria-pressed')).toBe('false');
    expect(window.localStorage.getItem('cfb:answer-votes')).not.toContain('assistant-4');
  });
});
