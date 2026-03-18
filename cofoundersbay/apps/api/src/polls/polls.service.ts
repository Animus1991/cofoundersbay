import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PollOptionView = { id: string; label: string; votes: number };
export type PollView = {
  id: string;
  question: string;
  options: PollOptionView[];
  totalVotes: number;
  userVoted: string | null;
  isActive: boolean;
};

@Injectable()
export class PollsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivePoll(viewerUserId?: string | null): Promise<PollView | null> {
    const now = new Date();
    const poll = await this.prisma.poll.findFirst({
      where: {
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
        votes: viewerUserId
          ? { where: { userId: viewerUserId }, select: { optionId: true } }
          : false,
      },
    });

    if (!poll) return null;

    const options = await Promise.all(
      poll.options.map(async (opt) => ({
        id: opt.id,
        label: opt.label,
        votes: await this.prisma.pollVote.count({ where: { optionId: opt.id } }),
      })),
    );

    const totalVotes = options.reduce((s, o) => s + o.votes, 0);
    const userVote = viewerUserId
      ? await this.prisma.pollVote.findUnique({
          where: { pollId_userId: { pollId: poll.id, userId: viewerUserId } },
          select: { optionId: true },
        })
      : null;

    return {
      id: poll.id,
      question: poll.question,
      options,
      totalVotes,
      userVoted: userVote?.optionId ?? null,
      isActive: poll.isActive,
    };
  }

  async vote(pollId: string, optionId: string, userId: string): Promise<{ ok: true }> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    if (!poll.isActive) throw new ConflictException('Poll is closed');
    if (poll.endsAt && poll.endsAt < new Date())
      throw new ConflictException('Poll has ended');

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) throw new NotFoundException('Option not found');

    await this.prisma.pollVote.upsert({
      where: { pollId_userId: { pollId, userId } },
      create: { pollId, optionId, userId },
      update: { optionId },
    });

    return { ok: true };
  }
}
