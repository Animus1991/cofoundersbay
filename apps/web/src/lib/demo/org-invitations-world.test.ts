import { afterEach, describe, expect, it } from 'vitest';
import { previewOrgInvitationsApi } from './org-invitations-world';

/*
 * The demo's invitations (docs §100) answer with the API's rules: a second
 * open invitation and a member's address are refused, resending replaces
 * the link, and the demo person (already a member, another address) gets
 * the "another email" refusal on accepting.
 */

const NOW = Date.parse('2026-10-24T10:00:00.000Z');
const LIST = '/api/organizations/org-aegean/invitations';
const call = (path: string, method = 'GET', body: Record<string, unknown> = {}, now = NOW) => previewOrgInvitationsApi(path, method, body, now) as any;
const problemOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return (err as { details?: { problem?: string } }).details?.problem ?? (err as Error).message;
  }
  return null;
};

afterEach(() => window.sessionStorage.clear());

describe('demo organisation invitations', () => {
  it('lists the open one first and the past-date one as expired', () => {
    const { invitations } = call(LIST);
    expect(invitations.map((i: any) => [i.email, i.status])).toEqual([
      ['katerina@ledgerly.example', 'pending'],
      ['nikos@andreou.vc', 'expired'],
    ]);
  });

  it('sends one, with a /join/ link, and refuses a second to the same address and a member', () => {
    const out = call(LIST, 'POST', { email: ' Sofia@Meltemi.example ', role: 'mentor' });
    expect(out.invitation).toMatchObject({ email: 'sofia@meltemi.example', role: 'mentor', status: 'pending' });
    expect(out.link).toMatch(/\/join\/demo-invite-/);
    expect(out.emailStatus).toBe('demo');
    expect(call(LIST).invitations[0].email).toBe('sofia@meltemi.example');
    expect(problemOf(() => call(LIST, 'POST', { email: 'sofia@meltemi.example' }))).toBe('already_invited');
    expect(problemOf(() => call(LIST, 'POST', { email: 'ioanna@aegeanlab.example' }))).toBe('already_member');
    expect(problemOf(() => call(LIST, 'POST', { email: 'nobody' }))).toBe('email_invalid');
  });

  it('resending an expired one opens it again with a new link; the old link stops', () => {
    expect(call('/api/organization-invitations/demo-invite-nikos').invitation.status).toBe('expired');
    const out = call(`${LIST}/oinv-nikos/resend`, 'POST');
    expect(out.invitation.status).toBe('pending');
    expect(problemOf(() => call('/api/organization-invitations/demo-invite-nikos'))).toBe('Invitation not found');
    const token = out.link.split('/join/')[1];
    expect(call(`/api/organization-invitations/${token}`).invitation).toMatchObject({ status: 'pending', emailMasked: 'n•••@andreou.vc' });
  });

  it('cancels an open one, and a cancelled one cannot be cancelled again', () => {
    call(`${LIST}/oinv-katerina`, 'DELETE');
    expect(call(LIST).invitations.find((i: any) => i.id === 'oinv-katerina').status).toBe('cancelled');
    expect(problemOf(() => call(`${LIST}/oinv-katerina`, 'DELETE'))).toBe('not_pending');
  });

  it('the link shows the organisation, the role and the masked address; accepting from another address is refused', () => {
    const { invitation } = call('/api/organization-invitations/demo-invite-katerina');
    expect(invitation).toMatchObject({ organization: { slug: 'aegean-lab' }, role: 'reviewer', roleLabel: { el: 'Αξιολογητής' }, emailMasked: 'k•••@ledgerly.example', invitedByName: 'Anna Lambrou' });
    expect(JSON.stringify(invitation)).not.toContain('katerina@');
    expect(problemOf(() => call('/api/organization-invitations/demo-invite-katerina/accept', 'POST'))).toBe('wrong_email');
    expect(problemOf(() => call('/api/organization-invitations/demo-invite-nikos/accept', 'POST'))).toBe('expired');
  });
});
