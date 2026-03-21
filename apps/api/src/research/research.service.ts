import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ResearchNodeType, ResearchBoardVisibility } from '@prisma/client';

export type ResearchBoardDto = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  visibility: ResearchBoardVisibility;
  canvasState: unknown;
  tags: string[];
  color: string | null;
  icon: string | null;
  isPinned: boolean;
  isArchived: boolean;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ResearchNodeDto = {
  id: string;
  boardId: string;
  type: ResearchNodeType;
  title: string | null;
  content: string | null;
  url: string | null;
  uploadId: string | null;
  upload: {
    id: string;
    url: string;
    mimeType: string | null;
    originalName: string | null;
    sizeBytes: number | null;
  } | null;
  posX: number;
  posY: number;
  width: number;
  height: number;
  zIndex: number;
  color: string | null;
  collapsed: boolean;
  locked: boolean;
  refEntityType: string | null;
  refEntityId: string | null;
  metadata: unknown;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ResearchConnectorDto = {
  id: string;
  boardId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  color: string | null;
  style: string | null;
  createdAt: string;
};

@Injectable()
export class ResearchService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Boards ────────────────────────────────────────────────────────────────

  async listBoards(userId: string): Promise<ResearchBoardDto[]> {
    const boards = await this.prisma.researchBoard.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
        ],
        isArchived: false,
      },
      include: {
        _count: { select: { nodes: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });

    return boards.map((b) => ({
      id: b.id,
      ownerId: b.ownerId,
      title: b.title,
      description: b.description,
      visibility: b.visibility,
      canvasState: b.canvasState,
      tags: b.tags,
      color: b.color,
      icon: b.icon,
      isPinned: b.isPinned,
      isArchived: b.isArchived,
      nodeCount: b._count.nodes,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));
  }

  async getBoard(userId: string, boardId: string): Promise<ResearchBoardDto & { nodes: ResearchNodeDto[]; connectors: ResearchConnectorDto[] }> {
    const board = await this.prisma.researchBoard.findUnique({
      where: { id: boardId },
      include: {
        _count: { select: { nodes: true } },
        nodes: {
          include: {
            upload: {
              select: { id: true, url: true, mimeType: true, originalName: true, sizeBytes: true },
            },
          },
          orderBy: { zIndex: 'asc' },
        },
        connectors: true,
        collaborators: { select: { userId: true, role: true } },
      },
    });

    if (!board) throw new NotFoundException('Board not found');

    const hasAccess =
      board.ownerId === userId ||
      board.collaborators.some((c) => c.userId === userId) ||
      board.visibility === 'public';

    if (!hasAccess) throw new ForbiddenException('Access denied');

    return {
      id: board.id,
      ownerId: board.ownerId,
      title: board.title,
      description: board.description,
      visibility: board.visibility,
      canvasState: board.canvasState,
      tags: board.tags,
      color: board.color,
      icon: board.icon,
      isPinned: board.isPinned,
      isArchived: board.isArchived,
      nodeCount: board._count.nodes,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
      nodes: board.nodes.map((n) => ({
        id: n.id,
        boardId: n.boardId,
        type: n.type,
        title: n.title,
        content: n.content,
        url: n.url,
        uploadId: n.uploadId,
        upload: n.upload,
        posX: n.posX,
        posY: n.posY,
        width: n.width,
        height: n.height,
        zIndex: n.zIndex,
        color: n.color,
        collapsed: n.collapsed,
        locked: n.locked,
        refEntityType: n.refEntityType,
        refEntityId: n.refEntityId,
        metadata: n.metadata,
        tags: n.tags,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      connectors: board.connectors.map((c) => ({
        id: c.id,
        boardId: c.boardId,
        fromNodeId: c.fromNodeId,
        toNodeId: c.toNodeId,
        label: c.label,
        color: c.color,
        style: c.style,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  async createBoard(
    userId: string,
    data: { title: string; description?: string; visibility?: ResearchBoardVisibility; tags?: string[]; color?: string; icon?: string },
  ): Promise<ResearchBoardDto> {
    const board = await this.prisma.researchBoard.create({
      data: {
        ownerId: userId,
        title: data.title,
        description: data.description,
        visibility: data.visibility ?? 'private',
        tags: data.tags ?? [],
        color: data.color,
        icon: data.icon,
      },
      include: { _count: { select: { nodes: true } } },
    });

    return {
      id: board.id,
      ownerId: board.ownerId,
      title: board.title,
      description: board.description,
      visibility: board.visibility,
      canvasState: board.canvasState,
      tags: board.tags,
      color: board.color,
      icon: board.icon,
      isPinned: board.isPinned,
      isArchived: board.isArchived,
      nodeCount: board._count.nodes,
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
    };
  }

  async updateBoard(
    userId: string,
    boardId: string,
    data: {
      title?: string;
      description?: string;
      visibility?: ResearchBoardVisibility;
      canvasState?: unknown;
      tags?: string[];
      color?: string;
      icon?: string;
      isPinned?: boolean;
      isArchived?: boolean;
    },
  ): Promise<ResearchBoardDto> {
    const board = await this.prisma.researchBoard.findUnique({
      where: { id: boardId },
      include: { collaborators: { where: { userId, role: { in: ['editor', 'admin'] } } } },
    });

    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId && board.collaborators.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.researchBoard.update({
      where: { id: boardId },
      data: {
        title: data.title,
        description: data.description,
        visibility: data.visibility,
        canvasState: data.canvasState as object,
        tags: data.tags,
        color: data.color,
        icon: data.icon,
        isPinned: data.isPinned,
        isArchived: data.isArchived,
      },
      include: { _count: { select: { nodes: true } } },
    });

    return {
      id: updated.id,
      ownerId: updated.ownerId,
      title: updated.title,
      description: updated.description,
      visibility: updated.visibility,
      canvasState: updated.canvasState,
      tags: updated.tags,
      color: updated.color,
      icon: updated.icon,
      isPinned: updated.isPinned,
      isArchived: updated.isArchived,
      nodeCount: updated._count.nodes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteBoard(userId: string, boardId: string): Promise<void> {
    const board = await this.prisma.researchBoard.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Only the owner can delete a board');

    await this.prisma.researchBoard.delete({ where: { id: boardId } });
  }

  // ─── Nodes ─────────────────────────────────────────────────────────────────

  async createNode(
    userId: string,
    boardId: string,
    data: {
      type: ResearchNodeType;
      title?: string;
      content?: string;
      url?: string;
      uploadId?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      color?: string;
      refEntityType?: string;
      refEntityId?: string;
      metadata?: unknown;
      tags?: string[];
    },
  ): Promise<ResearchNodeDto> {
    await this.assertBoardAccess(userId, boardId, 'edit');

    // Get max zIndex
    const maxZ = await this.prisma.researchNode.aggregate({
      where: { boardId },
      _max: { zIndex: true },
    });

    const node = await this.prisma.researchNode.create({
      data: {
        boardId,
        type: data.type,
        title: data.title,
        content: data.content,
        url: data.url,
        uploadId: data.uploadId,
        posX: data.posX ?? 0,
        posY: data.posY ?? 0,
        width: data.width ?? 280,
        height: data.height ?? 200,
        zIndex: (maxZ._max.zIndex ?? 0) + 1,
        color: data.color,
        refEntityType: data.refEntityType,
        refEntityId: data.refEntityId,
        metadata: data.metadata as object,
        tags: data.tags ?? [],
      },
      include: {
        upload: { select: { id: true, url: true, mimeType: true, originalName: true, sizeBytes: true } },
      },
    });

    return {
      id: node.id,
      boardId: node.boardId,
      type: node.type,
      title: node.title,
      content: node.content,
      url: node.url,
      uploadId: node.uploadId,
      upload: node.upload,
      posX: node.posX,
      posY: node.posY,
      width: node.width,
      height: node.height,
      zIndex: node.zIndex,
      color: node.color,
      collapsed: node.collapsed,
      locked: node.locked,
      refEntityType: node.refEntityType,
      refEntityId: node.refEntityId,
      metadata: node.metadata,
      tags: node.tags,
      createdAt: node.createdAt.toISOString(),
      updatedAt: node.updatedAt.toISOString(),
    };
  }

  async updateNode(
    userId: string,
    nodeId: string,
    data: {
      title?: string;
      content?: string;
      url?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      zIndex?: number;
      color?: string;
      collapsed?: boolean;
      locked?: boolean;
      metadata?: unknown;
      tags?: string[];
    },
  ): Promise<ResearchNodeDto> {
    const node = await this.prisma.researchNode.findUnique({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('Node not found');

    await this.assertBoardAccess(userId, node.boardId, 'edit');

    if (node.locked && data.locked !== false) {
      throw new BadRequestException('Node is locked');
    }

    const updated = await this.prisma.researchNode.update({
      where: { id: nodeId },
      data: {
        title: data.title,
        content: data.content,
        url: data.url,
        posX: data.posX,
        posY: data.posY,
        width: data.width,
        height: data.height,
        zIndex: data.zIndex,
        color: data.color,
        collapsed: data.collapsed,
        locked: data.locked,
        metadata: data.metadata as object,
        tags: data.tags,
      },
      include: {
        upload: { select: { id: true, url: true, mimeType: true, originalName: true, sizeBytes: true } },
      },
    });

    return {
      id: updated.id,
      boardId: updated.boardId,
      type: updated.type,
      title: updated.title,
      content: updated.content,
      url: updated.url,
      uploadId: updated.uploadId,
      upload: updated.upload,
      posX: updated.posX,
      posY: updated.posY,
      width: updated.width,
      height: updated.height,
      zIndex: updated.zIndex,
      color: updated.color,
      collapsed: updated.collapsed,
      locked: updated.locked,
      refEntityType: updated.refEntityType,
      refEntityId: updated.refEntityId,
      metadata: updated.metadata,
      tags: updated.tags,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updateNodesBatch(
    userId: string,
    boardId: string,
    updates: Array<{ id: string; posX?: number; posY?: number; width?: number; height?: number; zIndex?: number }>,
  ): Promise<void> {
    await this.assertBoardAccess(userId, boardId, 'edit');

    await this.prisma.$transaction(
      updates.map((u) =>
        this.prisma.researchNode.update({
          where: { id: u.id },
          data: {
            posX: u.posX,
            posY: u.posY,
            width: u.width,
            height: u.height,
            zIndex: u.zIndex,
          },
        }),
      ),
    );
  }

  async deleteNode(userId: string, nodeId: string): Promise<void> {
    const node = await this.prisma.researchNode.findUnique({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('Node not found');

    await this.assertBoardAccess(userId, node.boardId, 'edit');

    await this.prisma.researchNode.delete({ where: { id: nodeId } });
  }

  // ─── Connectors ────────────────────────────────────────────────────────────

  async createConnector(
    userId: string,
    boardId: string,
    data: { fromNodeId: string; toNodeId: string; label?: string; color?: string; style?: string },
  ): Promise<ResearchConnectorDto> {
    await this.assertBoardAccess(userId, boardId, 'edit');

    const connector = await this.prisma.researchConnector.create({
      data: {
        boardId,
        fromNodeId: data.fromNodeId,
        toNodeId: data.toNodeId,
        label: data.label,
        color: data.color,
        style: data.style ?? 'solid',
      },
    });

    return {
      id: connector.id,
      boardId: connector.boardId,
      fromNodeId: connector.fromNodeId,
      toNodeId: connector.toNodeId,
      label: connector.label,
      color: connector.color,
      style: connector.style,
      createdAt: connector.createdAt.toISOString(),
    };
  }

  async updateConnector(
    userId: string,
    connectorId: string,
    data: { label?: string; color?: string; style?: string },
  ): Promise<ResearchConnectorDto> {
    const connector = await this.prisma.researchConnector.findUnique({ where: { id: connectorId } });
    if (!connector) throw new NotFoundException('Connector not found');

    await this.assertBoardAccess(userId, connector.boardId, 'edit');

    const updated = await this.prisma.researchConnector.update({
      where: { id: connectorId },
      data: {
        label: data.label,
        color: data.color,
        style: data.style,
      },
    });

    return {
      id: updated.id,
      boardId: updated.boardId,
      fromNodeId: updated.fromNodeId,
      toNodeId: updated.toNodeId,
      label: updated.label,
      color: updated.color,
      style: updated.style,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async deleteConnector(userId: string, connectorId: string): Promise<void> {
    const connector = await this.prisma.researchConnector.findUnique({ where: { id: connectorId } });
    if (!connector) throw new NotFoundException('Connector not found');

    await this.assertBoardAccess(userId, connector.boardId, 'edit');

    await this.prisma.researchConnector.delete({ where: { id: connectorId } });
  }

  // ─── Collaborators ─────────────────────────────────────────────────────────

  async listCollaborators(userId: string, boardId: string) {
    await this.assertBoardAccess(userId, boardId, 'view');

    const collaborators = await this.prisma.researchBoardCollaborator.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true, headline: true } },
          },
        },
      },
      orderBy: { addedAt: 'asc' },
    });

    // Also include the owner
    const board = await this.prisma.researchBoard.findUnique({
      where: { id: boardId },
      select: {
        ownerId: true,
        owner: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true, headline: true } },
          },
        },
      },
    });

    return {
      owner: {
        id: board!.owner.id,
        email: board!.owner.email,
        role: 'owner' as const,
        displayName: board!.owner.profile?.displayName ?? null,
        avatarUrl: board!.owner.profile?.avatarUrl ?? null,
        headline: board!.owner.profile?.headline ?? null,
        addedAt: null,
      },
      collaborators: collaborators.map((c) => ({
        id: c.id,
        userId: c.userId,
        email: c.user.email,
        role: c.role,
        displayName: c.user.profile?.displayName ?? null,
        avatarUrl: c.user.profile?.avatarUrl ?? null,
        headline: c.user.profile?.headline ?? null,
        addedAt: c.addedAt.toISOString(),
      })),
    };
  }

  async addCollaborator(
    requesterId: string,
    boardId: string,
    data: { userId: string; role: string },
  ) {
    const board = await this.prisma.researchBoard.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== requesterId) throw new ForbiddenException('Only the owner can add collaborators');
    if (data.userId === requesterId) throw new BadRequestException('Cannot add yourself as collaborator');

    const existing = await this.prisma.researchBoardCollaborator.findUnique({
      where: { boardId_userId: { boardId, userId: data.userId } },
    });

    if (existing) {
      return this.prisma.researchBoardCollaborator.update({
        where: { id: existing.id },
        data: { role: data.role },
      });
    }

    return this.prisma.researchBoardCollaborator.create({
      data: { boardId, userId: data.userId, role: data.role },
    });
  }

  async updateCollaborator(requesterId: string, boardId: string, targetUserId: string, role: string) {
    const board = await this.prisma.researchBoard.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== requesterId) throw new ForbiddenException('Only the owner can change roles');

    await this.prisma.researchBoardCollaborator.update({
      where: { boardId_userId: { boardId, userId: targetUserId } },
      data: { role },
    });
  }

  async removeCollaborator(requesterId: string, boardId: string, targetUserId: string) {
    const board = await this.prisma.researchBoard.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    // Owner can remove anyone; collaborators can remove themselves
    if (board.ownerId !== requesterId && requesterId !== targetUserId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.researchBoardCollaborator.delete({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    }).catch(() => {});
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  async listNodeComments(userId: string, nodeId: string) {
    const node = await this.prisma.researchNode.findUnique({ where: { id: nodeId }, select: { boardId: true } });
    if (!node) throw new NotFoundException('Node not found');
    await this.assertBoardAccess(userId, node.boardId, 'view');

    const comments = await this.prisma.researchComment.findMany({
      where: { nodeId },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((c) => ({
      id: c.id,
      nodeId: c.nodeId,
      authorId: c.authorId,
      authorName: c.author.profile?.displayName ?? 'Unknown',
      authorAvatar: c.author.profile?.avatarUrl ?? null,
      body: c.body,
      resolved: c.resolved,
      posX: c.posX,
      posY: c.posY,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createComment(
    userId: string,
    nodeId: string,
    data: { body: string; posX?: number; posY?: number },
  ) {
    const node = await this.prisma.researchNode.findUnique({ where: { id: nodeId }, select: { boardId: true } });
    if (!node) throw new NotFoundException('Node not found');
    await this.assertBoardAccess(userId, node.boardId, 'view');

    const comment = await this.prisma.researchComment.create({
      data: {
        nodeId,
        authorId: userId,
        body: data.body,
        posX: data.posX,
        posY: data.posY,
      },
      include: {
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return {
      id: comment.id,
      nodeId: comment.nodeId,
      authorId: comment.authorId,
      authorName: comment.author.profile?.displayName ?? 'Unknown',
      authorAvatar: comment.author.profile?.avatarUrl ?? null,
      body: comment.body,
      resolved: comment.resolved,
      posX: comment.posX,
      posY: comment.posY,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  async updateComment(userId: string, commentId: string, data: { body?: string; resolved?: boolean }) {
    const comment = await this.prisma.researchComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const node = await this.prisma.researchNode.findUnique({ where: { id: comment.nodeId }, select: { boardId: true } });
    if (!node) throw new NotFoundException('Node not found');

    // Author can edit body; anyone with board edit access can resolve
    if (data.body !== undefined && comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit comment body');
    }
    if (data.resolved !== undefined) {
      await this.assertBoardAccess(userId, node.boardId, 'edit');
    }

    const updated = await this.prisma.researchComment.update({
      where: { id: commentId },
      data: { body: data.body, resolved: data.resolved },
      include: {
        author: { select: { id: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    return {
      id: updated.id,
      nodeId: updated.nodeId,
      authorId: updated.authorId,
      authorName: updated.author.profile?.displayName ?? 'Unknown',
      authorAvatar: updated.author.profile?.avatarUrl ?? null,
      body: updated.body,
      resolved: updated.resolved,
      posX: updated.posX,
      posY: updated.posY,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.researchComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const node = await this.prisma.researchNode.findUnique({ where: { id: comment.nodeId }, select: { boardId: true } });
    if (!node) throw new NotFoundException('Node not found');

    if (comment.authorId !== userId) {
      // Board owner/admin can also delete
      await this.assertBoardAccess(userId, node.boardId, 'edit');
    }

    await this.prisma.researchComment.delete({ where: { id: commentId } });
  }

  // ─── AI Analysis ───────────────────────────────────────────────────────────

  async analyzeBoard(
    userId: string,
    boardId: string,
    openaiKey: string | null,
  ): Promise<{
    summary: string;
    themes: string[];
    insights: string[];
    suggestedTags: string[];
    connections: Array<{ from: string; to: string; reason: string }>;
    gaps: string[];
  }> {
    await this.assertBoardAccess(userId, boardId, 'view');

    const board = await this.prisma.researchBoard.findUnique({
      where: { id: boardId },
      include: {
        nodes: {
          select: { id: true, type: true, title: true, content: true, tags: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!board) throw new NotFoundException('Board not found');

    const nodeText = board.nodes
      .map((n) => `[${n.type.toUpperCase()}] ${n.title ?? '(untitled)'}: ${(n.content ?? '').slice(0, 500)}`)
      .join('\n');

    if (!nodeText.trim()) {
      return {
        summary: 'This board is empty. Add some notes, documents, or links to get AI analysis.',
        themes: [],
        insights: [],
        suggestedTags: [],
        connections: [],
        gaps: [],
      };
    }

    if (openaiKey) {
      try {
        return await this.callOpenAIBoardAnalysis(board.title, nodeText, openaiKey);
      } catch {
        // fallback to rule-based
      }
    }

    return this.fallbackBoardAnalysis(board.title, board.nodes);
  }

  private async callOpenAIBoardAnalysis(
    boardTitle: string,
    nodeText: string,
    openaiKey: string,
  ) {
    const prompt = `You are an expert startup ecosystem analyst. Analyze this research board titled "${boardTitle}" for a CoFounderBay user.

Board content:
${nodeText.slice(0, 4000)}

Respond with JSON (no markdown):
{
  "summary": "2-3 sentence summary of what this board is researching",
  "themes": ["key theme 1", "key theme 2", "..."],
  "insights": ["specific insight 1", "specific insight 2", "..."],
  "suggestedTags": ["tag1", "tag2", "..."],
  "connections": [{"from": "topic A", "to": "topic B", "reason": "how they relate"}],
  "gaps": ["missing area 1", "missing area 2"]
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 700,
        temperature: 0.5,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return JSON.parse(data.choices[0].message.content);
  }

  private fallbackBoardAnalysis(boardTitle: string, nodes: Array<{ type: string; title: string | null; content: string | null; tags: string[] }>) {
    const allTags = nodes.flatMap((n) => n.tags);
    const tagCounts: Record<string, number> = {};
    allTags.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);

    const typeCount: Record<string, number> = {};
    nodes.forEach((n) => { typeCount[n.type] = (typeCount[n.type] ?? 0) + 1; });

    const noteCount = typeCount.note ?? 0;
    const docCount = typeCount.document ?? 0;
    const linkCount = typeCount.link ?? 0;

    return {
      summary: `Board "${boardTitle}" contains ${nodes.length} items — ${noteCount} notes, ${docCount} documents, ${linkCount} links. ${topTags.length > 0 ? `Main tags: ${topTags.slice(0, 3).join(', ')}.` : ''}`,
      themes: topTags.slice(0, 5),
      insights: [
        nodes.length > 0 ? `${nodes.length} research items organized on this board` : 'Board is empty',
        noteCount > 0 ? `${noteCount} notes with research findings` : null,
        linkCount > 0 ? `${linkCount} external links and references` : null,
      ].filter(Boolean) as string[],
      suggestedTags: ['research', 'analysis', boardTitle.toLowerCase().replace(/\s+/g, '-')],
      connections: [],
      gaps: nodes.length < 3 ? ['Add more content to get meaningful insights'] : [],
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async assertBoardAccess(userId: string, boardId: string, level: 'view' | 'edit'): Promise<void> {
    const board = await this.prisma.researchBoard.findUnique({
      where: { id: boardId },
      include: { collaborators: { where: { userId } } },
    });

    if (!board) throw new NotFoundException('Board not found');

    if (board.ownerId === userId) return;

    const collab = board.collaborators[0];
    if (!collab) {
      if (board.visibility === 'public' && level === 'view') return;
      throw new ForbiddenException('Access denied');
    }

    if (level === 'edit' && collab.role === 'viewer') {
      throw new ForbiddenException('Edit access denied');
    }
  }
}
