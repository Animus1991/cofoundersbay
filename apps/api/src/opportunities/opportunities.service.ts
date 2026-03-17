import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type OpportunityType = 'job' | 'cofounder' | 'investment' | 'partnership' | 'mentorship' | 'other';

export interface CreateOpportunityDto {
  title: string;
  description?: string;
  type?: OpportunityType;
  company?: string;
  location?: string;
  isRemote?: boolean;
  url?: string;
  tags?: string[];
  deadline?: string;
}

export interface UpdateOpportunityDto {
  title?: string;
  description?: string;
  type?: OpportunityType;
  company?: string;
  location?: string;
  isRemote?: boolean;
  url?: string;
  tags?: string[];
  deadline?: string;
  isActive?: boolean;
}

export interface OpportunityFilters {
  type?: OpportunityType;
  isRemote?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOpportunityDto) {
    return this.prisma.opportunity.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'job',
        company: dto.company,
        location: dto.location,
        isRemote: dto.isRemote ?? false,
        url: dto.url,
        tags: dto.tags || [],
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(filters: OpportunityFilters = {}) {
    const { type, isRemote, search, limit = 20, offset = 0 } = filters;

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (isRemote !== undefined) where.isRemote = isRemote;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [opportunities, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: {
          createdBy: {
            select: {
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return {
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        type: o.type,
        company: o.company,
        location: o.location,
        isRemote: o.isRemote,
        url: o.url,
        tags: o.tags as string[] || [],
        deadline: o.deadline?.toISOString() || null,
        isActive: o.isActive,
        createdBy: {
          displayName: o.createdBy.profile?.displayName || 'Unknown',
          avatarUrl: o.createdBy.profile?.avatarUrl || null,
        },
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      hasMore: offset + opportunities.length < total,
    };
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return {
      id: opportunity.id,
      title: opportunity.title,
      description: opportunity.description,
      type: opportunity.type,
      company: opportunity.company,
      location: opportunity.location,
      isRemote: opportunity.isRemote,
      url: opportunity.url,
      tags: opportunity.tags as string[] || [],
      deadline: opportunity.deadline?.toISOString() || null,
      isActive: opportunity.isActive,
      createdBy: {
        id: opportunity.createdBy.id,
        displayName: opportunity.createdBy.profile?.displayName || 'Unknown',
        avatarUrl: opportunity.createdBy.profile?.avatarUrl || null,
      },
      createdAt: opportunity.createdAt.toISOString(),
      updatedAt: opportunity.updatedAt.toISOString(),
    };
  }

  async update(id: string, userId: string, dto: UpdateOpportunityDto, isAdmin = false) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    if (opportunity.createdById !== userId && !isAdmin) {
      throw new ForbiddenException('You can only edit your own opportunities');
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isRemote !== undefined && { isRemote: dto.isRemote }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline ? new Date(dto.deadline) : null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    if (opportunity.createdById !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own opportunities');
    }

    await this.prisma.opportunity.delete({ where: { id } });
    return { ok: true };
  }
}
