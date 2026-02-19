'use client';

import { useState } from 'react';
import { BarChart3, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PollOption = { id: string; label: string; votes: number };
export type DashboardPollData = {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVoted?: string | null;
};

const defaultPoll: DashboardPollData = {
  id: '1',
  question: 'What topic should we cover in the next community call?',
  options: [
    { id: 'a', label: 'Fundraising & term sheets', votes: 42 },
    { id: 'b', label: 'Product-market fit', votes: 38 },
    { id: 'c', label: 'Hiring first team', votes: 28 },
  ],
  totalVotes: 108,
};

type DashboardPollProps = {
  data?: DashboardPollData | null;
  onVote?: (pollId: string, optionId: string) => void;
  className?: string;
};

export function DashboardPoll({ data = defaultPoll, onVote, className }: DashboardPollProps) {
  const poll = data ?? defaultPoll;
  const [voted, setVoted] = useState<string | null>(poll.userVoted ?? null);

  const handleVote = (optionId: string) => {
    if (voted) return;
    setVoted(optionId);
    onVote?.(poll.id, optionId);
  };

  const total = poll.options.reduce((s, o) => s + o.votes, 0) || 1;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Active poll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-foreground">{poll.question}</p>
        <ul className="space-y-2">
          {poll.options.map((opt) => {
            const pct = total ? Math.round((opt.votes / total) * 100) : 0;
            const isSelected = voted === opt.id;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => handleVote(opt.id)}
                  disabled={!!voted}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:bg-secondary/60',
                    voted && !isSelected && 'cursor-default opacity-80',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {isSelected && <Check className="h-4 w-4" />}
                      {opt.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/50"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{poll.totalVotes} votes</p>
      </CardContent>
    </Card>
  );
}
