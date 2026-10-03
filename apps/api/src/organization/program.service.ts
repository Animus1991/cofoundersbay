import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from './organization.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProgramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationService: OrganizationService,
  ) {}

  async create(userId: string, orgId: string, data: {
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    programType: string;
    startDate?: Date;
    endDate?: Date;
    applicationDeadline?: Date;
    capacity?: number;
    isPublic?: boolean;
    logoUrl?: string;
    coverImageUrl?: string;
    curriculum?: Record<string, unknown>;
    requirements?: Record<string, unknown>;
    benefits?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  }) {
    await this.organizationService.checkMemberAccess(orgId, userId);

    // Check slug uniqueness within org
    const existing = await this.prisma.program.findFirst({
      where: { organizationId: orgId, slug: data.slug },
    });

    if (existing) {
      throw new BadRequestException('Program slug already exists in this organization');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    return this.prisma.program.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        tenantId: org?.tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        programType: data.programType as any,
        startDate: data.startDate,
        endDate: data.endDate,
        applicationDeadline: data.applicationDeadline,
        capacity: data.capacity,
        isPublic: data.isPublic ?? true,
        logoUrl: data.logoUrl,
        coverImageUrl: data.coverImageUrl,
        curriculum: data.curriculum as Prisma.InputJsonValue,
        requirements: data.requirements as Prisma.InputJsonValue,
        benefits: data.benefits as Prisma.InputJsonValue,
        settings: data.settings as Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        organization: true,
        participants: {
          include: { user: { select: { id: true, email: true, profile: true } } },
        },
        milestones: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { participants: true } },
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async findByOrganization(orgId: string, filters?: {
    status?: string;
    programType?: string;
    isPublic?: boolean;
  }) {
    return this.prisma.program.findMany({
      where: {
        organizationId: orgId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.programType && { programType: filters.programType as any }),
        ...(filters?.isPublic !== undefined && { isPublic: filters.isPublic }),
      },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findPublicPrograms(filters?: {
    programType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { programType, search, page = 1, limit = 20 } = filters || {};

    const where = {
      isPublic: true,
      status: { in: ['upcoming', 'active'] as any },
      ...(programType && { programType: programType as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [programs, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, logoUrl: true, type: true } },
          _count: { select: { participants: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.program.count({ where }),
    ]);

    return {
      programs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    description: string;
    shortDescription: string;
    status: string;
    startDate: Date;
    endDate: Date;
    applicationDeadline: Date;
    capacity: number;
    isPublic: boolean;
    isFeatured: boolean;
    logoUrl: string;
    coverImageUrl: string;
    curriculum: Record<string, unknown>;
    requirements: Record<string, unknown>;
    benefits: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    await this.organizationService.checkMemberAccess(program.organizationId, userId);

    return this.prisma.program.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string, userId: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    await this.organizationService.checkMemberAccess(program.organizationId, userId);

    // Soft delete by archiving
    return this.prisma.program.update({
      where: { id },
      data: { status: 'archived' },
    });
  }

  // Participant management
  async applyToProgram(programId: string, userId: string, application?: Record<string, unknown>) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    if (program.status !== 'upcoming' && program.status !== 'active') {
      throw new BadRequestException('Program is not accepting applications');
    }

    if (program.applicationDeadline && new Date() > program.applicationDeadline) {
      throw new BadRequestException('Application deadline has passed');
    }

    const existing = await this.prisma.programParticipant.findFirst({
      where: { programId, userId },
    });

    if (existing) {
      throw new BadRequestException('Already applied to this program');
    }

    return this.prisma.programParticipant.create({
      data: {
        programId,
        userId,
        application: application as Prisma.InputJsonValue,
        appliedAt: new Date(),
      },
    });
  }

  async updateParticipant(programId: string, adminUserId: string, participantId: string, data: {
    status?: string;
    role?: string;
    progress?: number;
    score?: number;
    rank?: number;
    notes?: string;
    feedback?: Record<string, unknown>;
  }) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    await this.organizationService.checkMemberAccess(program.organizationId, adminUserId);

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'accepted') {
      updateData.acceptedAt = new Date();
    } else if (data.status === 'completed') {
      updateData.completedAt = new Date();
    }

    return this.prisma.programParticipant.update({
      where: { id: participantId },
      data: updateData as any,
    });
  }

  /**
   * A program's participants, applicants included — `status` is what separates
   * them.
   *
   * Returned a bare array while its only client (`getProgramParticipants` in
   * the web) declared `{ participants }`, so every caller read `undefined`.
   * `apiRequest` casts without checking, which is exactly why that mismatch
   * could sit there unnoticed. The envelope matches every neighbouring
   * endpoint and leaves room for a total later.
   *
   * The whole `profile` relation was spread into the response; only four of
   * its fields are ever read, and one of the rest is the person's email.
   */
  async getParticipants(programId: string, filters?: {
    status?: string;
    role?: string;
  }) {
    const participants = await this.prisma.programParticipant.findMany({
      where: {
        programId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.role && { role: filters.role as any }),
      },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { displayName: true, avatarUrl: true, headline: true, location: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      participants: participants.map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        status: participant.status,
        role: participant.role,
        appliedAt: participant.joinedAt.toISOString(),
        acceptedAt: participant.acceptedAt?.toISOString() ?? null,
        completedAt: participant.completedAt?.toISOString() ?? null,
        score: participant.score ?? null,
        // The relation is optional in the schema: a participant whose account
        // has gone still belongs in the list, without a person attached.
        user: {
          id: participant.user?.id ?? participant.userId,
          profile: participant.user?.profile
            ? {
                displayName: participant.user.profile.displayName,
                avatarUrl: participant.user.profile.avatarUrl,
                headline: participant.user.profile.headline,
                location: participant.user.profile.location,
              }
            : null,
        },
      })),
    };
  }

  async getUserPrograms(userId: string) {
    return this.prisma.programParticipant.findMany({
      where: { userId },
      include: {
        program: {
          include: {
            organization: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  // Milestone management
  async addMilestone(programId: string, userId: string, data: {
    title: string;
    description?: string;
    dueDate?: Date;
    sortOrder?: number;
    requirements?: Record<string, unknown>;
    deliverables?: Record<string, unknown>;
    isRequired?: boolean;
  }) {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    await this.organizationService.checkMemberAccess(program.organizationId, userId);

    return this.prisma.programMilestone.create({
      data: {
        programId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        sortOrder: data.sortOrder ?? 0,
        requirements: data.requirements as Prisma.InputJsonValue,
        deliverables: data.deliverables as Prisma.InputJsonValue,
        isRequired: data.isRequired ?? true,
      },
    });
  }

  async updateMilestone(milestoneId: string, userId: string, data: Partial<{
    title: string;
    description: string;
    dueDate: Date;
    sortOrder: number;
    requirements: Record<string, unknown>;
    deliverables: Record<string, unknown>;
    isRequired: boolean;
  }>) {
    const milestone = await this.prisma.programMilestone.findUnique({
      where: { id: milestoneId },
      include: { program: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.organizationService.checkMemberAccess(milestone.program.organizationId, userId);

    return this.prisma.programMilestone.update({
      where: { id: milestoneId },
      data: data as any,
    });
  }

  async deleteMilestone(milestoneId: string, userId: string) {
    const milestone = await this.prisma.programMilestone.findUnique({
      where: { id: milestoneId },
      include: { program: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.organizationService.checkMemberAccess(milestone.program.organizationId, userId);

    await this.prisma.programMilestone.delete({
      where: { id: milestoneId },
    });

    return { success: true };
  }
}
