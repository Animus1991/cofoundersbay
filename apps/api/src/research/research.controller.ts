import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResearchService } from './research.service';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

const createBoardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['private', 'team', 'organization', 'public']).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['private', 'team', 'organization', 'public']).optional(),
  canvasState: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const createNodeSchema = z.object({
  type: z.enum(['note', 'document', 'image', 'pdf', 'link', 'reference']),
  title: z.string().max(500).optional(),
  content: z.string().optional(),
  url: z.string().url().optional(),
  uploadId: z.string().uuid().optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().min(100).max(2000).optional(),
  height: z.number().min(50).max(2000).optional(),
  color: z.string().optional(),
  refEntityType: z.string().optional(),
  refEntityId: z.string().optional(),
  metadata: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
});

const updateNodeSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().optional(),
  url: z.string().url().optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().min(100).max(2000).optional(),
  height: z.number().min(50).max(2000).optional(),
  zIndex: z.number().optional(),
  color: z.string().optional(),
  collapsed: z.boolean().optional(),
  locked: z.boolean().optional(),
  metadata: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
});

const batchUpdateNodesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      posX: z.number().optional(),
      posY: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      zIndex: z.number().optional(),
    }),
  ),
});

const createConnectorSchema = z.object({
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  label: z.string().max(200).optional(),
  color: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
});

const updateConnectorSchema = z.object({
  label: z.string().max(200).optional(),
  color: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
});

const addCollaboratorSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
});

const updateCollaboratorSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin']),
});

const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  posX: z.number().optional(),
  posY: z.number().optional(),
});

const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000).optional(),
  resolved: z.boolean().optional(),
});

@Controller('research')
@UseGuards(JwtAuthGuard)
export class ResearchController {
  constructor(
    private readonly research: ResearchService,
    private readonly config: ConfigService,
  ) {}

  // ─── Boards ────────────────────────────────────────────────────────────────

  @Get('boards')
  async listBoards(@CurrentUser() user: { id: string }) {
    const boards = await this.research.listBoards(user.id);
    return { boards };
  }

  @Get('boards/:boardId')
  async getBoard(@CurrentUser() user: { id: string }, @Param('boardId') boardId: string) {
    const board = await this.research.getBoard(user.id, boardId);
    return { board };
  }

  @Post('boards')
  async createBoard(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const data = createBoardSchema.parse(body);
    const board = await this.research.createBoard(user.id, data);
    return { board };
  }

  @Patch('boards/:boardId')
  async updateBoard(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Body() body: unknown,
  ) {
    const data = updateBoardSchema.parse(body);
    const board = await this.research.updateBoard(user.id, boardId, data);
    return { board };
  }

  @Delete('boards/:boardId')
  async deleteBoard(@CurrentUser() user: { id: string }, @Param('boardId') boardId: string) {
    await this.research.deleteBoard(user.id, boardId);
    return { ok: true };
  }

  // ─── Nodes ─────────────────────────────────────────────────────────────────

  @Post('boards/:boardId/nodes')
  async createNode(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Body() body: unknown,
  ) {
    const data = createNodeSchema.parse(body);
    const node = await this.research.createNode(user.id, boardId, data);
    return { node };
  }

  @Patch('boards/:boardId/nodes/batch')
  async batchUpdateNodes(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Body() body: unknown,
  ) {
    const { updates } = batchUpdateNodesSchema.parse(body);
    await this.research.updateNodesBatch(user.id, boardId, updates);
    return { ok: true };
  }

  @Patch('nodes/:nodeId')
  async updateNode(
    @CurrentUser() user: { id: string },
    @Param('nodeId') nodeId: string,
    @Body() body: unknown,
  ) {
    const data = updateNodeSchema.parse(body);
    const node = await this.research.updateNode(user.id, nodeId, data);
    return { node };
  }

  @Delete('nodes/:nodeId')
  async deleteNode(@CurrentUser() user: { id: string }, @Param('nodeId') nodeId: string) {
    await this.research.deleteNode(user.id, nodeId);
    return { ok: true };
  }

  // ─── Connectors ────────────────────────────────────────────────────────────

  @Post('boards/:boardId/connectors')
  async createConnector(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Body() body: unknown,
  ) {
    const data = createConnectorSchema.parse(body);
    const connector = await this.research.createConnector(user.id, boardId, data);
    return { connector };
  }

  @Patch('connectors/:connectorId')
  async updateConnector(
    @CurrentUser() user: { id: string },
    @Param('connectorId') connectorId: string,
    @Body() body: unknown,
  ) {
    const data = updateConnectorSchema.parse(body);
    const connector = await this.research.updateConnector(user.id, connectorId, data);
    return { connector };
  }

  @Delete('connectors/:connectorId')
  async deleteConnector(@CurrentUser() user: { id: string }, @Param('connectorId') connectorId: string) {
    await this.research.deleteConnector(user.id, connectorId);
    return { ok: true };
  }

  // ─── Collaborators ─────────────────────────────────────────────────────────

  @Get('boards/:boardId/collaborators')
  async listCollaborators(@CurrentUser() user: { id: string }, @Param('boardId') boardId: string) {
    return this.research.listCollaborators(user.id, boardId);
  }

  @Post('boards/:boardId/collaborators')
  async addCollaborator(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Body() body: unknown,
  ) {
    const data = addCollaboratorSchema.parse(body);
    const collab = await this.research.addCollaborator(user.id, boardId, data);
    return { collaborator: collab };
  }

  @Patch('boards/:boardId/collaborators/:targetUserId')
  async updateCollaborator(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() body: unknown,
  ) {
    const { role } = updateCollaboratorSchema.parse(body);
    await this.research.updateCollaborator(user.id, boardId, targetUserId, role);
    return { ok: true };
  }

  @Delete('boards/:boardId/collaborators/:targetUserId')
  async removeCollaborator(
    @CurrentUser() user: { id: string },
    @Param('boardId') boardId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    await this.research.removeCollaborator(user.id, boardId, targetUserId);
    return { ok: true };
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  @Get('nodes/:nodeId/comments')
  async listComments(@CurrentUser() user: { id: string }, @Param('nodeId') nodeId: string) {
    const comments = await this.research.listNodeComments(user.id, nodeId);
    return { comments };
  }

  @Post('nodes/:nodeId/comments')
  async createComment(
    @CurrentUser() user: { id: string },
    @Param('nodeId') nodeId: string,
    @Body() body: unknown,
  ) {
    const data = createCommentSchema.parse(body);
    const comment = await this.research.createComment(user.id, nodeId, data);
    return { comment };
  }

  @Patch('comments/:commentId')
  async updateComment(
    @CurrentUser() user: { id: string },
    @Param('commentId') commentId: string,
    @Body() body: unknown,
  ) {
    const data = updateCommentSchema.parse(body);
    const comment = await this.research.updateComment(user.id, commentId, data);
    return { comment };
  }

  @Delete('comments/:commentId')
  async deleteComment(@CurrentUser() user: { id: string }, @Param('commentId') commentId: string) {
    await this.research.deleteComment(user.id, commentId);
    return { ok: true };
  }

  // ─── AI Analysis ───────────────────────────────────────────────────────────

  @Post('boards/:boardId/analyze')
  async analyzeBoard(@CurrentUser() user: { id: string }, @Param('boardId') boardId: string) {
    const openaiKey = this.config.get<string>('OPENAI_API_KEY') ?? null;
    const analysis = await this.research.analyzeBoard(user.id, boardId, openaiKey);
    return { analysis };
  }
}
