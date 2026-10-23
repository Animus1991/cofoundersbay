import { BadRequestException, ConflictException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import {
  ORG_INVITE_PROBLEM_COPY,
  ORG_INVITE_ROLE_COPY,
  ORG_INVITE_TTL_DAYS,
  canAnswerOrgInvite,
  maskInviteEmail,
  orgInviteState,
  readOrgInvite,
  type OrgInviteProblem,
  type OrgInviteRole,
} from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../mailer/email-queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrganizationService } from './organization.service';

const DAY = 86_400_000;

function refusal(problem: OrgInviteProblem) {
  const copy = ORG_INVITE_PROBLEM_COPY[problem];
  const details = { reason: 'org_invite_invalid', problem, messageEl: copy.el };
  const body = { success: false, error: { code: problem === 'already_member' || problem === 'already_invited' ? 'CONFLICT' : 'VALIDATION_ERROR', message: copy.en, details } };
  return problem === 'already_member' || problem === 'already_invited' ? new ConflictException(body) : new BadRequestException(body);
}

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Organisation invitations by email (docs §100).
 *
 * Owners and admins invite (the same `checkAdminAccess` that guards adding
 * a member); the invitee accepts signed in with the invited address, which
 * is what makes a forwarded link useless to anyone else. Accepting creates
 * the membership with the invited role and `invitedBy`, exactly as the
 * admin's "add by user id" does.
 */
@Injectable()
export class OrganizationInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationService,
    private readonly config: ConfigService,
    @Optional() private readonly emailQueue?: EmailQueueService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  private webBaseUrl(): string {
    return this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000';
  }

  private view(row: {
    id: string; email: string; role: string; message: string | null; status: string; expiresAt: Date; sentAt: Date;
    respondedAt: Date | null; invitedBy?: { profile?: { displayName?: string | null } | null } | null;
  }) {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      message: row.message,
      status: orgInviteState(row, Date.now()),
      sentAt: row.sentAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      respondedAt: row.respondedAt?.toISOString() ?? null,
      invitedByName: row.invitedBy?.profile?.displayName ?? null,
    };
  }

  /** The organisation's invitations, open ones first. Admins only. */
  async list(orgId: string, userId: string) {
    await this.organizations.checkAdminAccess(orgId, userId);
    const rows = await this.prisma.organizationInvitation.findMany({
      where: { organizationId: orgId },
      include: { invitedBy: { select: { profile: { select: { displayName: true } } } } },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
    const invitations = rows.map((r) => this.view(r));
    return { invitations: [...invitations.filter((i) => i.status === 'pending'), ...invitations.filter((i) => i.status !== 'pending')] };
  }

  async create(orgId: string, userId: string, body: Record<string, unknown>) {
    await this.organizations.checkAdminAccess(orgId, userId);
    const read = readOrgInvite(body);
    if (!read.ok) throw refusal(read.problem);
    const { email, role, message } = read.value;

    const member = await this.prisma.organizationMembership.findFirst({
      where: { organizationId: orgId, isActive: true, user: { email: { equals: email, mode: 'insensitive' } } },
      select: { id: true },
    });
    if (member) throw refusal('already_member');
    const open = await this.prisma.organizationInvitation.findFirst({
      where: { organizationId: orgId, email, status: 'pending', expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (open) throw refusal('already_invited');

    const token = randomBytes(24).toString('base64url');
    const row = await this.prisma.organizationInvitation.create({
      data: {
        organizationId: orgId,
        email,
        role,
        message,
        tokenHash: hash(token),
        invitedById: userId,
        expiresAt: new Date(Date.now() + ORG_INVITE_TTL_DAYS * DAY),
      },
      include: { invitedBy: { select: { profile: { select: { displayName: true } } } } },
    });
    const delivery = await this.deliver(orgId, row.invitedBy?.profile?.displayName ?? null, email, role, message, token);
    // The link goes back to the admin too: with email delivery off (no SMTP)
    // it is the only way it reaches the person, and it works only for them.
    return { invitation: this.view(row), link: `${this.webBaseUrl()}/join/${token}`, ...delivery };
  }

  /** A new link and a new date; the old link stops working. */
  async resend(orgId: string, userId: string, invitationId: string) {
    await this.organizations.checkAdminAccess(orgId, userId);
    const row = await this.prisma.organizationInvitation.findFirst({ where: { id: invitationId, organizationId: orgId } });
    if (!row) throw new NotFoundException('Invitation not found');
    const state = orgInviteState(row, Date.now());
    if (state !== 'pending' && state !== 'expired') throw refusal('not_pending');
    const token = randomBytes(24).toString('base64url');
    const updated = await this.prisma.organizationInvitation.update({
      where: { id: row.id },
      data: { tokenHash: hash(token), status: 'pending', sentAt: new Date(), expiresAt: new Date(Date.now() + ORG_INVITE_TTL_DAYS * DAY) },
      include: { invitedBy: { select: { profile: { select: { displayName: true } } } } },
    });
    const delivery = await this.deliver(orgId, updated.invitedBy?.profile?.displayName ?? null, row.email, row.role as OrgInviteRole, row.message, token);
    return { invitation: this.view(updated), link: `${this.webBaseUrl()}/join/${token}`, ...delivery };
  }

  async cancel(orgId: string, userId: string, invitationId: string) {
    await this.organizations.checkAdminAccess(orgId, userId);
    const row = await this.prisma.organizationInvitation.findFirst({ where: { id: invitationId, organizationId: orgId } });
    if (!row) throw new NotFoundException('Invitation not found');
    if (orgInviteState(row, Date.now()) !== 'pending') throw refusal('not_pending');
    await this.prisma.organizationInvitation.update({ where: { id: row.id }, data: { status: 'cancelled', respondedAt: new Date() } });
    return { ok: true };
  }

  /**
   * What the link shows before anyone signs in: the organisation, the role,
   * who invited, and the address masked. Nothing else about the
   * organisation or its members.
   */
  async preview(token: string) {
    const row = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash: hash(token) },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        invitedBy: { select: { profile: { select: { displayName: true } } } },
      },
    });
    if (!row) throw new NotFoundException('Invitation not found');
    return {
      invitation: {
        organization: row.organization,
        role: row.role,
        roleLabel: ORG_INVITE_ROLE_COPY[row.role as OrgInviteRole] ?? null,
        invitedByName: row.invitedBy?.profile?.displayName ?? null,
        message: row.message,
        emailMasked: maskInviteEmail(row.email),
        status: orgInviteState(row, Date.now()),
        expiresAt: row.expiresAt.toISOString(),
      },
    };
  }

  async accept(token: string, userId: string) {
    const { row, user } = await this.answerable(token, userId);
    const organization = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId: row.organizationId, userId } },
      });
      if (existing && !existing.isActive) {
        await tx.organizationMembership.update({ where: { id: existing.id }, data: { isActive: true, role: row.role as never, invitedBy: row.invitedById } });
      } else if (!existing) {
        await tx.organizationMembership.create({
          data: { organizationId: row.organizationId, userId, role: row.role as never, invitedBy: row.invitedById },
        });
      }
      await tx.organizationInvitation.update({
        where: { id: row.id },
        data: { status: 'accepted', acceptedById: user.id, respondedAt: new Date() },
      });
      return tx.organization.findUnique({ where: { id: row.organizationId }, select: { id: true, name: true, slug: true } });
    });
    return { ok: true, organization };
  }

  async decline(token: string, userId: string) {
    const { row } = await this.answerable(token, userId);
    await this.prisma.organizationInvitation.update({ where: { id: row.id }, data: { status: 'declined', respondedAt: new Date() } });
    return { ok: true };
  }

  private async answerable(token: string, userId: string) {
    const row = await this.prisma.organizationInvitation.findUnique({ where: { tokenHash: hash(token) } });
    if (!row) throw new NotFoundException('Invitation not found');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    const verdict = canAnswerOrgInvite(row, user?.email, Date.now());
    if (!verdict.ok) {
      if (verdict.problem === 'expired' && row.status === 'pending') {
        await this.prisma.organizationInvitation.update({ where: { id: row.id }, data: { status: 'expired' } });
      }
      throw refusal(verdict.problem);
    }
    return { row, user: user! };
  }

  /** The email, and a notification when the address already has an account. */
  private async deliver(orgId: string, inviterName: string | null, email: string, role: OrgInviteRole, message: string | null, token: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } });
    const orgName = org?.name ?? 'an organisation';
    const link = `${this.webBaseUrl()}/join/${token}`;
    const roleCopy = ORG_INVITE_ROLE_COPY[role];
    const who = inviterName ?? 'Someone';
    const lines = [
      `${who} invited you to join ${orgName} on CoFounderBay as ${roleCopy.en.toLowerCase()}.`,
      message ? `"${message}"` : null,
      `Open the invitation: ${link}`,
      `It expires in ${ORG_INVITE_TTL_DAYS} days. Accept it signed in with this email address.`,
      '',
      `${who} σας προσκάλεσε στον οργανισμό ${orgName} στο CoFounderBay ως ${roleCopy.el.toLowerCase()}.`,
      `Άνοιγμα πρόσκλησης: ${link}`,
      `Λήγει σε ${ORG_INVITE_TTL_DAYS} ημέρες. Αποδεχτείτε τη συνδεδεμένοι με αυτή τη διεύθυνση email.`,
    ].filter((l): l is string => l !== null);
    const emailStatus = this.emailQueue
      ? await this.emailQueue.enqueueSendEmail({
          to: email,
          subject: `${orgName} invited you to CoFounderBay · Πρόσκληση από ${orgName}`,
          text: lines.join('\n'),
        }).catch(() => 'failed' as const)
      : 'disabled';

    let notified = false;
    const account = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
    if (account && this.notifications) {
      await this.notifications.createNotification({
        userId: account.id,
        type: 'organization_invite',
        title: `${orgName} invited you to join as ${roleCopy.en.toLowerCase()}`,
        body: message,
        link: `/join/${token}`,
        meta: { organizationId: orgId, role, titleEl: `Ο οργανισμός ${orgName} σας προσκάλεσε ως ${roleCopy.el.toLowerCase()}` },
      }).then(() => { notified = true; }).catch(() => undefined);
    }
    return { emailStatus, notified };
  }
}
