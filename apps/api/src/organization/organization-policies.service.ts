import { ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  MENTOR_POOL_REQUEST_NOTE_MAX,
  ORG_POLICY_KEYS,
  ORG_POLICY_PROBLEM_COPY,
  readOrgPolicies,
  type MentorPoolStanding,
  type OrgPolicies,
  type OrgPolicyProblem,
} from '@cofounderbay/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrganizationService } from './organization.service';

/** A refusal in the standard error shape, with the Greek beside the English. */
export function orgPolicyRefusal(problem: OrgPolicyProblem) {
  const copy = ORG_POLICY_PROBLEM_COPY[problem];
  const conflict = problem === 'already_in_pool' || problem === 'already_requested';
  const body = { success: false, error: { code: conflict ? 'CONFLICT' : 'FORBIDDEN', message: copy.en, details: { reason: 'org_policy', problem, messageEl: copy.el } } };
  return conflict ? new ConflictException(body) : new ForbiddenException(body);
}

/**
 * The organisation's access policies (docs §103), read and applied.
 *
 * They were saved under `settings.policies` by the settings page and read by
 * nothing. This is where they are read: the directory and the public pages
 * (`publicProfile`), programme applications (`openApplications`), mentors
 * asking to join the pool (`mentorSelfRegistration`) and the founders'
 * workspaces (`workspaceAccess`).
 */
@Injectable()
export class OrganizationPoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async policiesOf(orgId: string): Promise<OrgPolicies> {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    if (!org) throw new NotFoundException('Organization not found');
    return readOrgPolicies(org.settings);
  }

  /** For the settings page: members read them. */
  async read(orgId: string, userId: string) {
    await this.organizations.checkMemberAccess(orgId, userId);
    return { policies: await this.policiesOf(orgId) };
  }

  /** Owners and admins change them; only the four switches are written, the rest of `settings` is kept. */
  async update(orgId: string, userId: string, body: Record<string, unknown>) {
    await this.organizations.checkAdminAccess(orgId, userId);
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    if (!org) throw new NotFoundException('Organization not found');
    const current = readOrgPolicies(org.settings);
    const next = { ...current };
    for (const key of ORG_POLICY_KEYS) {
      if (typeof body[key] === 'boolean') next[key] = body[key] as boolean;
    }
    const settings = org.settings && typeof org.settings === 'object' && !Array.isArray(org.settings) ? (org.settings as Record<string, unknown>) : {};
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { settings: { ...settings, policies: next } as Prisma.InputJsonValue },
    });
    return { policies: next };
  }

  /** Organisations that turned "Public profile" off: out of the directory and the public reads. */
  async hiddenIds(): Promise<string[]> {
    const rows = await this.prisma.organization.findMany({
      where: { settings: { path: ['policies', 'publicProfile'], equals: false } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async isHidden(orgId: string): Promise<boolean> {
    return !(await this.policiesOf(orgId)).publicProfile;
  }

  async isActiveMember(orgId: string, userId: string | null | undefined): Promise<boolean> {
    if (!userId) return false;
    const m = await this.prisma.organizationMembership.findFirst({ where: { organizationId: orgId, userId, isActive: true }, select: { id: true } });
    return Boolean(m);
  }

  /** `openApplications` off: only the organisation's own members apply. */
  async assertCanApply(orgId: string, userId: string) {
    const policies = await this.policiesOf(orgId);
    if (policies.openApplications) return;
    if (await this.isActiveMember(orgId, userId)) return;
    throw orgPolicyRefusal('applications_closed');
  }

  /** `workspaceAccess` off on the organisation of this tenant: its admins do not open founders' workspaces. */
  async assertWorkspaceAccess(tenantId: string) {
    const orgs = await this.prisma.organization.findMany({ where: { tenantId }, select: { settings: true } });
    if (orgs.some((o) => !readOrgPolicies(o.settings).workspaceAccess)) throw orgPolicyRefusal('workspace_access_off');
  }

  // ── Mentors asking to join the pool (`mentorSelfRegistration`) ─────────────

  private async isMentor(userId: string): Promise<boolean> {
    const [user, listing] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      this.prisma.mentorProfile.findUnique({ where: { userId }, select: { id: true } }),
    ]);
    return user?.role === 'mentor' || Boolean(listing);
  }

  /** Where this person stands with the pool of the organisation behind `slug`. */
  async standing(slug: string, userId: string): Promise<{ organizationId: string; name: string; standing: MentorPoolStanding; isMentor: boolean }> {
    const org = await this.prisma.organization.findUnique({ where: { slug }, select: { id: true, name: true, displayName: true, isActive: true, settings: true } });
    if (!org || !org.isActive) throw new NotFoundException('Organization not found');
    const policies = readOrgPolicies(org.settings);
    if (!policies.publicProfile && !(await this.isActiveMember(org.id, userId))) throw new NotFoundException('Organization not found');
    const row = await this.prisma.organizationMentor.findUnique({ where: { organizationId_userId: { organizationId: org.id, userId } }, select: { isActive: true, requestedAt: true } });
    const standing: MentorPoolStanding = row?.isActive ? 'in_pool' : row?.requestedAt ? 'requested' : policies.mentorSelfRegistration ? 'can_request' : 'closed';
    return { organizationId: org.id, name: org.displayName ?? org.name, standing, isMentor: await this.isMentor(userId) };
  }

  async requestToJoin(orgId: string, userId: string, body: Record<string, unknown>) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true, displayName: true, settings: true, isActive: true } });
    if (!org || !org.isActive) throw new NotFoundException('Organization not found');
    if (!readOrgPolicies(org.settings).mentorSelfRegistration) throw orgPolicyRefusal('mentor_requests_closed');
    if (!(await this.isMentor(userId))) throw orgPolicyRefusal('not_a_mentor');
    const existing = await this.prisma.organizationMentor.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId } } });
    if (existing?.isActive) throw orgPolicyRefusal('already_in_pool');
    if (existing?.requestedAt) throw orgPolicyRefusal('already_requested');
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, MENTOR_POOL_REQUEST_NOTE_MAX) || null : null;
    const row = existing
      ? await this.prisma.organizationMentor.update({ where: { id: existing.id }, data: { isActive: false, requestedAt: new Date(), requestNote: note, assignedBy: null } })
      : await this.prisma.organizationMentor.create({ data: { organizationId: orgId, userId, isActive: false, requestedAt: new Date(), requestNote: note } });

    // The owners and admins hear of it; the request waits on them.
    if (this.notifications) {
      const [admins, who] = await Promise.all([
        this.prisma.organizationMembership.findMany({ where: { organizationId: orgId, isActive: true, role: { in: ['owner', 'admin'] } }, select: { userId: true } }),
        this.prisma.profile.findUnique({ where: { userId }, select: { displayName: true } }),
      ]);
      const name = who?.displayName ?? 'A mentor';
      await Promise.all(admins.map((a) => this.notifications!.createNotification({
        userId: a.userId,
        type: 'mentor_request',
        title: `${name} asked to join your mentor pool`,
        body: note,
        link: '/org/mentors#requests',
        meta: { organizationId: orgId, requestId: row.id, titleEl: `${name}: αίτημα ένταξης στη δεξαμενή μεντόρων σας` },
      }).catch(() => undefined)));
    }
    return { request: { id: row.id, requestedAt: row.requestedAt?.toISOString() ?? null, note: row.requestNote } };
  }

  /** The mentor takes their own waiting request back. */
  async withdraw(orgId: string, userId: string) {
    const row = await this.prisma.organizationMentor.findUnique({ where: { organizationId_userId: { organizationId: orgId, userId } } });
    if (!row || row.isActive || !row.requestedAt) throw new NotFoundException('No request is waiting');
    await this.prisma.organizationMentor.delete({ where: { id: row.id } });
    return { ok: true };
  }

  async listRequests(orgId: string, adminId: string) {
    await this.organizations.checkAdminAccess(orgId, adminId);
    const rows = await this.prisma.organizationMentor.findMany({
      where: { organizationId: orgId, isActive: false, requestedAt: { not: null } },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true, headline: true } },
            mentorProfile: { select: { skills: true, industries: true } },
          },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });
    return {
      requests: rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        displayName: r.user?.profile?.displayName ?? null,
        avatarUrl: r.user?.profile?.avatarUrl ?? null,
        headline: r.user?.profile?.headline ?? null,
        expertise: [...(r.user?.mentorProfile?.skills ?? []), ...(r.user?.mentorProfile?.industries ?? [])].slice(0, 6),
        note: r.requestNote,
        requestedAt: r.requestedAt?.toISOString() ?? null,
      })),
    };
  }

  async answer(orgId: string, adminId: string, requestId: string, accept: boolean) {
    await this.organizations.checkAdminAccess(orgId, adminId);
    const row = await this.prisma.organizationMentor.findFirst({ where: { id: requestId, organizationId: orgId, isActive: false, requestedAt: { not: null } } });
    if (!row) throw new NotFoundException('No request is waiting');
    if (accept) {
      await this.prisma.organizationMentor.update({ where: { id: row.id }, data: { isActive: true, assignedBy: adminId, assignedAt: new Date() } });
    } else {
      await this.prisma.organizationMentor.delete({ where: { id: row.id } });
    }
    if (this.notifications) {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, displayName: true, slug: true } });
      const name = org?.displayName ?? org?.name ?? 'The organisation';
      await this.notifications.createNotification({
        userId: row.userId,
        type: 'mentor_request',
        title: accept ? `${name} added you to its mentor pool` : `${name} did not add you to its mentor pool`,
        link: org?.slug ? `/org/${org.slug}` : null,
        meta: { organizationId: orgId, titleEl: accept ? `Ο οργανισμός ${name} σας πρόσθεσε στη δεξαμενή μεντόρων του` : `Ο οργανισμός ${name} δεν σας πρόσθεσε στη δεξαμενή μεντόρων του` },
      }).catch(() => undefined);
    }
    return { ok: true, accepted: accept };
  }
}
