import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { ToastProvider } from '@/components/ui/toast';
import { SkillEvidencePanel } from './SkillEvidencePanel';

vi.mock('@/lib/skill-evidence-api', () => ({
  getSkillEvidence: vi.fn(async () => [
    { name: 'Product', evidence: [{ id: 'e1', kind: 'milestone', refId: 'm1', label: 'Four clinics live', at: '' }], endorsements: 2, verifiedEndorsements: 1 },
    { name: 'Growth', evidence: [], endorsements: 0, verifiedEndorsements: 0 },
    { name: 'Go-to-market', evidence: [], endorsements: 1, verifiedEndorsements: 0 },
  ]),
  getEvidenceCandidates: vi.fn(async () => []),
  linkSkillEvidence: vi.fn(),
  unlinkSkillEvidence: vi.fn(),
}));

afterEach(cleanup);

function renderPanel(props: Parameters<typeof SkillEvidencePanel>[0]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LanguagePreferenceProvider>
        <ToastProvider>
          <SkillEvidencePanel {...props} />
        </ToastProvider>
      </LanguagePreferenceProvider>
    </QueryClientProvider>,
  );
}

// docs §75: someone's profile showed a "Skills" card and, under it, "Skills
// with evidence" naming the same skills again. Given the declared skills, the
// panel is the one skills card.
describe('the profile’s one skills card', () => {
  it('lists every declared skill once, with what backs it, then skills only endorsements name', async () => {
    renderPanel({ userId: 'user-elena', declared: ['Product', 'Growth', 'Fundraising'] });
    await waitFor(() => expect(screen.getByText('Four clinics live')).toBeTruthy());
    expect(screen.getByText('Skills')).toBeTruthy();
    expect(screen.queryByText('Skills with evidence')).toBeNull();
    const names = [...document.querySelectorAll('li > div > span.font-medium')].map((n) => n.textContent);
    expect(names).toEqual(['Product', 'Growth', 'Fundraising', 'Go-to-market']);
  });

  it('keeps its own title without the declared list', async () => {
    renderPanel({ userId: 'user-elena' });
    await waitFor(() => expect(screen.getByText('Skills with evidence')).toBeTruthy());
  });

  it('puts "No evidence linked yet" and its Add on one line on one’s own profile', async () => {
    renderPanel({ userId: 'me', editable: true });
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Add evidence/ }).length).toBe(3));
    const empty = screen.getAllByText(/No evidence linked yet/)[0];
    const row = empty.closest('div');
    expect(row?.querySelector('button')?.textContent).toMatch(/Add evidence/);
  });
});
