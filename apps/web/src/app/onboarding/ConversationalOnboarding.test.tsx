import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createProfile, listSkills } from '@/lib/api';
import { saveOnboardingProgress, loadOnboardingProgress } from '@/lib/onboarding-progress';
import { ConversationalOnboarding } from './ConversationalOnboarding';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/api', () => ({ createProfile: vi.fn(), listSkills: vi.fn() }));

/**
 * Onboarding picks up after a reload, and its finish says what is next
 * instead of leaving the page before anyone can read it.
 */

const form = { displayName: 'Maria', headline: 'Founder at Harbor', location: 'Athens', bio: '', role: 'founder' as const, skillIds: [] };

afterEach(cleanup);
beforeEach(() => {
  // jsdom has no layout, so no scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
  push.mockReset();
  vi.mocked(listSkills).mockResolvedValue([{ id: 'sales', name: 'Sales', slug: 'sales', category: null }] as never);
  vi.mocked(createProfile).mockResolvedValue({} as never);
});

describe('conversational onboarding', () => {
  it('picks up where a reload left it, with the earlier answers shown', async () => {
    saveOnboardingProgress('u1', { step: 'skills', form });
    render(<ConversationalOnboarding />);
    expect(await screen.findByText('Picked up where you left off.')).toBeTruthy();
    expect(screen.getByText('Maria')).toBeTruthy();
    expect(screen.getByText('Founder at Harbor')).toBeTruthy();
    expect(await screen.findByTestId('onboarding-complete-button')).toBeTruthy();
  });

  it('ends on what is next, not on a redirect, and forgets the saved answers', async () => {
    saveOnboardingProgress('u1', { step: 'skills', form });
    render(<ConversationalOnboarding />);
    fireEvent.click(await screen.findByTestId('onboarding-complete-button'));
    const matches = await screen.findByTestId('onboarding-matches-button', {}, { timeout: 4000 });
    expect(createProfile).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Maria', role: 'founder' }));
    expect(loadOnboardingProgress('u1')).toBeNull();
    await new Promise((r) => setTimeout(r, 1700));
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(matches);
    expect(push).toHaveBeenCalledWith('/matches');
  });

  it('still returns a member to the need card they came from', async () => {
    sessionStorage.setItem('cfb_return_to', '/commitments/card-1');
    saveOnboardingProgress('u1', { step: 'skills', form });
    render(<ConversationalOnboarding />);
    fireEvent.click(await screen.findByTestId('onboarding-complete-button'));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/commitments/card-1'), { timeout: 4000 });
  });
});
