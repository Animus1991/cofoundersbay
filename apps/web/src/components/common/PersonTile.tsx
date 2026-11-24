'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { CardMoreMenu, type CardMoreItem } from '@/components/common/CardMoreMenu';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { roleRing, roleTone } from '@/lib/role-tone';
import { bilingualAria } from '@/lib/i18n/format';
import { cn, initialsOf } from '@/lib/utils';

/**
 * One person as a 200px portrait tile (docs §131.2, §134): the face leads,
 * the name and role badge sit under it, one line of why they are here, and
 * the one verb with the rest in the card's menu. The tile HomePeople drew,
 * shared so a role overview's people look the same as the home's.
 * `href` changes where the face and the name go (a match opens its match,
 * not the profile); without `userId` the name renders without a link or a
 * hovercard — the person may have no profile to open.
 */
export function PersonTile({ userId, name, avatarUrl, role, headline, reason, meta, action, more = [], href, className }: {
  userId?: string | null;
  name: string;
  avatarUrl?: string | null;
  role?: string | null;
  /** What they do, one line. */
  headline?: ReactNode;
  /** Why they are on this list, at most two lines. */
  reason?: { en: string; el: string } | null;
  /** Beside the role badge (a score, a state). */
  meta?: ReactNode;
  action: ReactNode;
  more?: CardMoreItem[];
  href?: string;
  className?: string;
}) {
  const dest = href ?? (userId ? `/profiles/${userId}` : undefined);
  const face = (
    <Avatar className={cn('h-[4.5rem] w-[4.5rem]', roleRing(role))}>
      <AvatarImage src={avatarUrl || undefined} alt="" />
      <AvatarFallback className={cn('text-sm font-semibold', roleTone(role))}>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
  const label = userId ? (
    <PersonHovercard userId={userId}>
      {dest ? (
        <Link href={dest} className="person-name transition-colors hover:text-primary-accessible">{name}</Link>
      ) : (
        <span className="person-name">{name}</span>
      )}
    </PersonHovercard>
  ) : (
    dest ? (
      <Link href={dest} className="person-name transition-colors hover:text-primary-accessible">{name}</Link>
    ) : (
      <span className="person-name">{name}</span>
    )
  );
  return (
    <Card className={cn('flex w-[200px] shrink-0 snap-start flex-col overflow-hidden', className)}>
      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        {dest ? (
          <Link href={dest} tabIndex={-1} aria-hidden="true" className="block self-center rounded-full">{face}</Link>
        ) : (
          <span className="block self-center">{face}</span>
        )}
        <div className="min-w-0 space-y-1 text-center">
          <p className="truncate">{label}</p>
          {role || meta ? (
            <span className="inline-flex items-center gap-1.5">
              {role ? <RoleBadge role={role} size="sm" /> : null}
              {meta}
            </span>
          ) : null}
          {headline ? <p className="truncate text-xs text-muted-foreground">{headline}</p> : null}
          {reason ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              <BilingualText en={reason.en} el={reason.el} compact wrap />
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center gap-1">
          <div className="min-w-0 flex-1 [&_button]:whitespace-nowrap">{action}</div>
          {more.length ? <CardMoreMenu name={name} items={more} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The rail the tiles ride on (docs §131.2): a horizontal scroll with snap on
 * the faint accent wash; the page does not scroll sideways, the rail does.
 */
export function PersonTileRail({ labelEn, labelEl, children }: {
  labelEn: string;
  labelEl: string;
  children: ReactNode;
}) {
  return (
    <div className="-mx-1 snap-x snap-mandatory overflow-x-auto px-1 pb-1 [scrollbar-gutter:stable]" aria-label={bilingualAria(labelEn, labelEl)}>
      <div className="flex w-max min-w-full gap-3 rounded-2xl bg-status-accent-bg/50 p-3">
        {children}
      </div>
    </div>
  );
}
