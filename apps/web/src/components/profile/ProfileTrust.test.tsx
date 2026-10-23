import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { MyOpenTo } from '@/lib/open-to-api';
import { AvatarVerifiedMark, OwnOpenToPill } from './ProfileTrust';

/**
 * The own profile's trust marks follow what the profile's cards hold. Before, every
 * avatar carried "Verified member", every header "Open to work", and the
 * rail said "LinkedIn: not connected" whatever the person had done.
 */

afterEach(cleanup);

describe('the avatar check', () => {
  it('is absent without a verification signal', () => {
    const { container } = render(<AvatarVerifiedMark methods={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('names how the person is verified', () => {
    render(<AvatarVerifiedMark methods={['work_email']} />);
    expect(screen.getByText(/Verified: Work email · Επαληθευμένο προφίλ: Εταιρικό email/)).toBeTruthy();
  });
});

describe('the "Open to" pill', () => {
  it('offers the setting when nothing is set, instead of claiming "Open to work"', () => {
    render(<OwnOpenToPill openTo={{ signal: null, active: false }} />);
    const link = screen.getByRole('link', { name: /Set what you are open to/ });
    expect(link.getAttribute('href')).toBe('/profile#open-to');
    expect(screen.queryByText(/Open to work/)).toBeNull();
  });

  it('lists what was chosen and who sees it', () => {
    const openTo: MyOpenTo = { active: true, signal: { kinds: ['cofounder', 'mentor'], visibility: 'nobody', note: null, expiresAt: '2027-01-01T00:00:00.000Z' } };
    render(<OwnOpenToPill openTo={openTo} />);
    const link = screen.getByRole('link', { name: /Open to: co-founding, mentoring/ });
    expect(link.textContent).toContain('Matching only');
  });

  it('treats an expired signal as unset', () => {
    const openTo: MyOpenTo = { active: false, signal: { kinds: ['advisor'], visibility: 'everyone', note: null, expiresAt: '2026-01-01T00:00:00.000Z' } };
    render(<OwnOpenToPill openTo={openTo} />);
    expect(screen.getByRole('link', { name: /Set what you are open to/ })).toBeTruthy();
  });
});

describe('the trust cards live on the profile (docs §99)', () => {
  const read = (rel: string) => readFileSync(join(__dirname, '..', '..', rel), 'utf8');

  it('the own profile mounts Verification, Open to and How you like to work; Settings does not', () => {
    const profile = read('app/profile/page.tsx');
    const settings = read('app/settings/page.tsx');
    for (const card of ['<VerificationCard', '<OpenToCard', '<CompatibilityCard']) {
      expect(profile).toContain(card);
      expect(settings).not.toContain(card);
    }
    expect(profile).toContain('useScrollToHash()');
  });
});

describe('no constant trust claims', () => {
  const read = (rel: string) => readFileSync(join(__dirname, '..', '..', rel), 'utf8');

  it('the own profile draws no fixed "Verified member" or "Open to work"', () => {
    const page = read('app/profile/page.tsx');
    expect(page).not.toMatch(/profileEn\('verified_member'\)|profileEn\('open_to_work'\)/);
    // One mark for being verified, read from the signal, beside the name as
    // on everyone else's profile; the photo carried a second (docs §75).
    expect(page).toContain('<VerifiedBadge methods={trust.methods}');
    expect(page).not.toContain('<AvatarVerifiedMark');
    expect(page).toContain('<OwnOpenToPill');
  });

  it.each(['components/members/MembersPageClient.tsx', 'app/mentor/profile/page.tsx', 'app/provider/profile/page.tsx'])(
    '%s shows the real verification beside a name',
    (rel) => {
      const src = read(rel);
      expect(src).toContain('<PersonVerifiedBadge');
      expect(src).not.toMatch(/<BadgeCheck className="icon-sm text-muted-foreground( shrink-0)?" \/>/);
    },
  );
});
