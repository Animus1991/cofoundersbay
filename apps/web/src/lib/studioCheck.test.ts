import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMeProfile, getVentureReadiness, listMilestones } from '@/lib/api';
import { getWorkspaces } from '@/lib/builder-api';
import { listCommitmentThreads } from '@/lib/commitments-api';
import { getFundraising } from '@/lib/fundraising-api';
import { AREA_READERS } from './copilot-reads';
import { planCopilotTools } from './copilot-planner';
import { translate } from './i18n/translate';

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getMeProfile: vi.fn(),
  getVentureReadiness: vi.fn(),
  listMilestones: vi.fn(),
}));
vi.mock('@/lib/builder-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/builder-api')>()),
  getWorkspaces: vi.fn(),
}));
vi.mock('@/lib/commitments-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/commitments-api')>()),
  listCommitmentThreads: vi.fn(),
}));
vi.mock('@/lib/fundraising-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/fundraising-api')>()),
  getFundraising: vi.fn(),
}));

const el = { t: (s: string, v?: Record<string, string | number>) => translate('el', s, v), locale: 'el' };
const run = () => AREA_READERS.get_studio_check({}, el as never);
const complete = {
  role: 'founder', avatarUrl: 'a.png', headline: 'Founder', bio: 'Bio', location: 'Athens', skills: [{ id: 's1' }],
};

beforeEach(() => {
  vi.mocked(getMeProfile).mockResolvedValue({ profile: complete, hasCompletedOnboarding: true } as never);
  vi.mocked(getWorkspaces).mockResolvedValue({ data: [{ id: 'w1', name: 'Helios' }] } as never);
  vi.mocked(getVentureReadiness).mockResolvedValue({ overall: 72, dimensions: [], lowestDimension: { key: 'market', label: 'Market', score: 61 } } as never);
  vi.mocked(listMilestones).mockResolvedValue({ milestones: [], nextCursor: null, total: 0 } as never);
  vi.mocked(listCommitmentThreads).mockResolvedValue([] as never);
  vi.mocked(getFundraising).mockResolvedValue({ leads: [] } as never);
});

describe('the studio check', () => {
  it('is what /audit and the plain words ask for', () => {
    for (const ask of ['/audit', 'Audit my studio', 'Κάνε έλεγχο σε όλο το studio μου', 'έλεγχος studio']) {
      expect(planCopilotTools(ask).map((tool) => tool.name)).toContain('get_studio_check');
    }
  });

  it('says so when every area is in order, and offers nothing to open', async () => {
    const answer = await run();
    expect(answer.section).toContain('τίποτα δεν σας περιμένει');
    expect(answer.section).toContain('**Χρηματοδότηση** — Εντάξει.');
    expect(answer.actions).toEqual([]);
  });

  it('names what is missing and opens where it is fixed', async () => {
    vi.mocked(getMeProfile).mockResolvedValue({ profile: { ...complete, avatarUrl: null, bio: '' }, hasCompletedOnboarding: true } as never);
    vi.mocked(getWorkspaces).mockResolvedValue({ data: [] } as never);
    vi.mocked(listMilestones).mockResolvedValue({ milestones: [{ status: 'todo', dueDate: '2020-01-01' }], nextCursor: null, total: 1 } as never);
    const answer = await run();
    expect(answer.section).toContain('Περιοχές που θέλουν κάτι: 3 από 6.');
    expect(answer.section).toContain('Λείπουν: φωτογραφία · σύντομο βιογραφικό.');
    expect(answer.section).toContain('**Ορόσημα** — Εκπρόθεσμα: 1.');
    expect(answer.actions.map((action) => action.href)).toEqual(['/profile/edit', '/builder', '/milestones']);
  });

  it('never calls an area in order because its read failed', async () => {
    vi.mocked(listMilestones).mockRejectedValue(new Error('down'));
    const answer = await run();
    expect(answer.section).toContain('**Ορόσημα** — Δεν διαβάστηκε αυτή τη στιγμή.');
    expect(answer.section).not.toContain('**Ορόσημα** — Εντάξει.');
  });

  it('leaves the founder tools out for someone else', async () => {
    vi.mocked(getMeProfile).mockResolvedValue({ profile: { ...complete, role: 'mentor' }, hasCompletedOnboarding: true } as never);
    const answer = await run();
    expect(answer.section).not.toContain('Χρηματοδότηση');
    expect(answer.section).not.toContain('Startup Builder');
  });
});
