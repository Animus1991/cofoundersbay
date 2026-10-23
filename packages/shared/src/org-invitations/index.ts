/**
 * Inviting someone into an organisation by email (docs §100).
 *
 * Organisations could add a member only by typing their internal user id,
 * which no screen shows. The owner chose email invitations: an admin writes
 * an address and a role; the person gets an email (and, with an account, a
 * notification) with a link; they accept signed in with that same address,
 * and only then become a member. One set of rules for the API and the demo.
 */

/** Roles an invitation may carry. Owner is never invited: an owner makes another owner from the members list. */
export const ORG_INVITE_ROLES = ['admin', 'program_manager', 'mentor', 'reviewer', 'member'] as const;
export type OrgInviteRole = (typeof ORG_INVITE_ROLES)[number];

export const ORG_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'cancelled', 'expired'] as const;
export type OrgInviteStatus = (typeof ORG_INVITE_STATUSES)[number];

/** How long a link stays good. */
export const ORG_INVITE_TTL_DAYS = 14;
export const ORG_INVITE_MESSAGE_MAX = 500;

export const ORG_INVITE_ROLE_COPY: Record<OrgInviteRole, { en: string; el: string }> = {
  admin: { en: 'Admin', el: 'Διαχειριστής' },
  program_manager: { en: 'Program manager', el: 'Υπεύθυνος προγράμματος' },
  mentor: { en: 'Mentor', el: 'Μέντορας' },
  reviewer: { en: 'Reviewer', el: 'Αξιολογητής' },
  member: { en: 'Member', el: 'Μέλος' },
};

export type OrgInviteProblem =
  | 'email_invalid'
  | 'role_invalid'
  | 'message_too_long'
  | 'already_member'
  | 'already_invited'
  | 'not_pending'
  | 'expired'
  | 'wrong_email';

export const ORG_INVITE_PROBLEM_COPY: Record<OrgInviteProblem, { en: string; el: string }> = {
  email_invalid: { en: 'Write one email address.', el: 'Γράψτε μία διεύθυνση email.' },
  role_invalid: { en: 'Choose a role: admin, program manager, mentor, reviewer or member.', el: 'Επιλέξτε ρόλο: διαχειριστής, υπεύθυνος προγράμματος, μέντορας, αξιολογητής ή μέλος.' },
  message_too_long: { en: `A note is at most ${ORG_INVITE_MESSAGE_MAX} characters.`, el: `Το σημείωμα έχει έως ${ORG_INVITE_MESSAGE_MAX} χαρακτήρες.` },
  already_member: { en: 'Someone with this email is already a member.', el: 'Κάποιος με αυτό το email είναι ήδη μέλος.' },
  already_invited: { en: 'This email already has an invitation waiting; resend it instead.', el: 'Αυτό το email έχει ήδη πρόσκληση σε αναμονή· στείλτε την ξανά.' },
  not_pending: { en: 'This invitation is no longer open.', el: 'Αυτή η πρόσκληση δεν είναι πια ανοιχτή.' },
  expired: { en: 'This invitation has expired; ask for a new one.', el: 'Η πρόσκληση έληξε· ζητήστε νέα.' },
  wrong_email: { en: 'This invitation was sent to another email address. Sign in with that address to accept it.', el: 'Η πρόσκληση στάλθηκε σε άλλη διεύθυνση email. Συνδεθείτε με εκείνη τη διεύθυνση για να την αποδεχτείτε.' },
};

/** Lower-case and trimmed: the form two addresses are compared in. */
export function normaliseInviteEmail(value: string): string {
  return value.trim().toLowerCase();
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OrgInviteInput = { email: string; role: OrgInviteRole; message: string | null };

/** Read an invitation form: one address, a role, an optional note. */
export function readOrgInvite(body: Record<string, unknown>): { ok: true; value: OrgInviteInput } | { ok: false; problem: OrgInviteProblem } {
  const email = typeof body.email === 'string' ? normaliseInviteEmail(body.email) : '';
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, problem: 'email_invalid' };
  const role = typeof body.role === 'string' ? body.role : 'member';
  if (!(ORG_INVITE_ROLES as readonly string[]).includes(role)) return { ok: false, problem: 'role_invalid' };
  const raw = typeof body.message === 'string' ? body.message.trim() : '';
  if (raw.length > ORG_INVITE_MESSAGE_MAX) return { ok: false, problem: 'message_too_long' };
  return { ok: true, value: { email, role: role as OrgInviteRole, message: raw || null } };
}

/** The status a stored invitation has now: a pending one past its date is expired. */
export function orgInviteState(invite: { status: string; expiresAt: string | Date }, now: number): OrgInviteStatus {
  const status = (ORG_INVITE_STATUSES as readonly string[]).includes(invite.status) ? (invite.status as OrgInviteStatus) : 'pending';
  if (status === 'pending' && new Date(invite.expiresAt).getTime() <= now) return 'expired';
  return status;
}

/** Whether this signed-in person may accept (or decline) the invitation. */
export function canAnswerOrgInvite(
  invite: { status: string; expiresAt: string | Date; email: string },
  readerEmail: string | null | undefined,
  now: number,
): { ok: true } | { ok: false; problem: OrgInviteProblem } {
  const state = orgInviteState(invite, now);
  if (state === 'expired') return { ok: false, problem: 'expired' };
  if (state !== 'pending') return { ok: false, problem: 'not_pending' };
  if (!readerEmail || normaliseInviteEmail(readerEmail) !== normaliseInviteEmail(invite.email)) return { ok: false, problem: 'wrong_email' };
  return { ok: true };
}

/** "s•••@example.com": enough for the invitee to recognise the address, not to harvest it. */
export function maskInviteEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 1)}•••@${domain}`;
}
