import {
  ORG_INVITE_ROLE_COPY,
  ORG_INVITE_TTL_DAYS,
  canAnswerOrgInvite,
  maskInviteEmail,
  orgInviteState,
  readOrgInvite,
  ORG_INVITE_PROBLEM_COPY,
  type OrgInviteProblem,
  type OrgInviteRole,
} from '@cofounderbay/shared';
import { DemoRefusal } from './demo-refusal';
import { ORG, ORG_ID, ORG_MENTORS, ORG_SLUG, ORG_STAFF } from './org-world';

/**
 * The demo organisation's invitations (docs §100), kept for the session and
 * answered with the API's own rules (`readOrgInvite`, `canAnswerOrgInvite`).
 * Two are waiting from the start; the demo person's own address is
 * Alex Demo's, so accepting one sent to someone else shows the refusal.
 */

const KEY = 'cfb:demo-org-invitations:v1';
const DAY = 86_400_000;
const ME = { id: 'preview-demo-user', name: 'Alex Demo', email: 'demo@cofounderbay.com' };

type StoredInvitation = {
  id: string;
  token: string;
  email: string;
  role: OrgInviteRole;
  message: string | null;
  status: string;
  sentAt: number;
  expiresAt: number;
  respondedAt: number | null;
  invitedByName: string;
};

function seed(now: number): StoredInvitation[] {
  return [
    { id: 'oinv-katerina', token: 'demo-invite-katerina', email: 'katerina@ledgerly.example', role: 'reviewer', message: 'We would value your eye on the spring applications.', status: 'pending', sentAt: now - 2 * DAY, expiresAt: now + 12 * DAY, respondedAt: null, invitedByName: 'Anna Lambrou' },
    { id: 'oinv-nikos', token: 'demo-invite-nikos', email: 'nikos@andreou.vc', role: 'mentor', message: null, status: 'pending', sentAt: now - 16 * DAY, expiresAt: now - 2 * DAY, respondedAt: null, invitedByName: ME.name },
  ];
}

function read(now: number): StoredInvitation[] {
  try {
    const raw = typeof window === 'undefined' ? null : window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredInvitation[]) : seed(now);
  } catch {
    return seed(now);
  }
}

function write(rows: StoredInvitation[]) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    // storage blocked: the change lasts this page view
  }
}

function refuse(problem: OrgInviteProblem): never {
  const copy = ORG_INVITE_PROBLEM_COPY[problem];
  throw new DemoRefusal(problem === 'already_member' || problem === 'already_invited' ? 409 : 400, copy.en, { reason: 'org_invite_invalid', problem, messageEl: copy.el });
}

const view = (r: StoredInvitation, now: number) => ({
  id: r.id,
  email: r.email,
  role: r.role,
  message: r.message,
  status: orgInviteState({ status: r.status, expiresAt: new Date(r.expiresAt) }, now),
  sentAt: new Date(r.sentAt).toISOString(),
  expiresAt: new Date(r.expiresAt).toISOString(),
  respondedAt: r.respondedAt ? new Date(r.respondedAt).toISOString() : null,
  invitedByName: r.invitedByName,
});

const memberEmails = () => new Set([...ORG_STAFF, ...ORG_MENTORS].map((p) => p.email.toLowerCase()));
/** A fresh link token: the clock and a per-session counter (demo data draws nothing at random). */
let issued = 0;
const newToken = (now: number) => `demo-invite-${now.toString(36)}${(issued += 1).toString(36)}`;
const linkFor = (token: string) => `${typeof window === 'undefined' ? '' : window.location.origin}/join/${token}`;

export function previewOrgInvitationsApi(pathname: string, method: string, body: Record<string, unknown>, now: number): unknown {
  const parts = pathname.split('/').filter(Boolean); // ['api', ...]
  if (parts[1] === 'organizations' && parts[2] === ORG_ID && parts[3] === 'invitations') {
    const rows = read(now);
    if (method === 'GET' && parts.length === 4) {
      const all = rows.map((r) => view(r, now)).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
      return { invitations: [...all.filter((i) => i.status === 'pending'), ...all.filter((i) => i.status !== 'pending')] };
    }
    if (method === 'POST' && parts.length === 4) {
      const input = readOrgInvite(body);
      if (!input.ok) refuse(input.problem);
      const { email, role, message } = input.value;
      if (memberEmails().has(email)) refuse('already_member');
      if (rows.some((r) => r.email === email && orgInviteState({ status: r.status, expiresAt: new Date(r.expiresAt) }, now) === 'pending')) refuse('already_invited');
      const token = newToken(now);
      const row: StoredInvitation = { id: `oinv-${token.slice(12)}`, token, email, role, message, status: 'pending', sentAt: now, expiresAt: now + ORG_INVITE_TTL_DAYS * DAY, respondedAt: null, invitedByName: ME.name };
      write([row, ...rows]);
      return { invitation: view(row, now), link: linkFor(token), emailStatus: 'demo', notified: false };
    }
    const row = rows.find((r) => r.id === parts[4]);
    if (!row) throw new DemoRefusal(404, 'Invitation not found', { messageEl: 'Η πρόσκληση δεν βρέθηκε.' });
    const state = orgInviteState({ status: row.status, expiresAt: new Date(row.expiresAt) }, now);
    if (method === 'POST' && parts[5] === 'resend') {
      if (state !== 'pending' && state !== 'expired') refuse('not_pending');
      row.token = newToken(now);
      row.status = 'pending';
      row.sentAt = now;
      row.expiresAt = now + ORG_INVITE_TTL_DAYS * DAY;
      write(rows);
      return { invitation: view(row, now), link: linkFor(row.token), emailStatus: 'demo', notified: false };
    }
    if (method === 'DELETE') {
      if (state !== 'pending') refuse('not_pending');
      row.status = 'cancelled';
      row.respondedAt = now;
      write(rows);
      return { ok: true };
    }
    return undefined;
  }

  if (parts[1] === 'organization-invitations' && parts[2]) {
    const token = decodeURIComponent(parts[2]);
    const rows = read(now);
    const row = rows.find((r) => r.token === token);
    if (!row) throw new DemoRefusal(404, 'Invitation not found', { messageEl: 'Η πρόσκληση δεν βρέθηκε.' });
    if (method === 'GET' && parts.length === 3) {
      return {
        invitation: {
          organization: { id: ORG_ID, name: ORG.name, slug: ORG_SLUG, logoUrl: null },
          role: row.role,
          roleLabel: ORG_INVITE_ROLE_COPY[row.role] ?? null,
          invitedByName: row.invitedByName,
          message: row.message,
          emailMasked: maskInviteEmail(row.email),
          status: orgInviteState({ status: row.status, expiresAt: new Date(row.expiresAt) }, now),
          expiresAt: new Date(row.expiresAt).toISOString(),
        },
      };
    }
    if (method === 'POST' && (parts[3] === 'accept' || parts[3] === 'decline')) {
      const verdict = canAnswerOrgInvite({ status: row.status, expiresAt: new Date(row.expiresAt), email: row.email }, ME.email, now);
      if (!verdict.ok) refuse(verdict.problem);
      row.status = parts[3] === 'accept' ? 'accepted' : 'declined';
      row.respondedAt = now;
      write(rows);
      return parts[3] === 'accept' ? { ok: true, organization: { id: ORG_ID, name: ORG.name, slug: ORG_SLUG } } : { ok: true };
    }
  }
  return undefined;
}
