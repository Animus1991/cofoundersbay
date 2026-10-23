'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleName } from '@/components/common/RoleName';
import { STATUS } from '@/lib/semantic-colors';
import { cn, initialsOf } from '@/lib/utils';

export type RailPerson = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: string | null;
  /** The engine's score, 0-100; no chip without one. */
  matchScore?: number | null;
};

/**
 * People as a short list in a page rail: picture, name, the role's word and
 * the match score, each row a link to the profile. Discover's "Best matches"
 * and the Feed's "Suggested connections" draw the same rows from the same
 * recommendations (docs §86, §88).
 */
export function RailPeople({ people }: { people: RailPerson[] }) {
  return (
    <ul className="space-y-0.5">
      {people.map((p) => (
        <li key={p.userId}>
          <Link href={`/profiles/${p.userId}`} className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted/70">
            <Avatar className="h-8 w-8">
              <AvatarImage src={p.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="bg-muted text-2xs font-semibold text-muted-foreground">{initialsOf(p.displayName)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary-accessible">{p.displayName}</span>
              {p.role ? <span className="block text-xs text-muted-foreground"><RoleName role={p.role} /></span> : null}
            </span>
            {typeof p.matchScore === 'number' ? (
              <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums', p.matchScore >= 80 ? STATUS.success.chip : p.matchScore >= 60 ? STATUS.info.chip : STATUS.neutral.chip)}>
                {p.matchScore}%
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
