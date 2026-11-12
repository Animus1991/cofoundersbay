'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { CardMoreMenu, type CardMoreItem } from '@/components/common/CardMoreMenu';
import { PersonHovercard } from '@/components/common/PersonHovercard';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { bilingualAria } from '@/lib/i18n/format';
import { pressableProps } from '@/lib/pressable';
import { cn, initialsOf } from '@/lib/utils';

const PHOTO = { md: 'h-14 w-14', lg: 'h-16 w-16', xl: 'h-20 w-20' } as const;

/**
 * A person, the same way on every list (docs §115): a face large enough to
 * recognise, the name and what they do, one fact that says why they are here,
 * and one thing to do next. The score, the connection and the saved state keep
 * their own sources; this is only how they are set, so they read alike on
 * Matches, For you, Members, Saved profiles and the rest.
 *
 * Whatever else the card could do sits in `more`, in the same place every time.
 */
export function PersonCard({
  userId,
  name,
  avatarUrl,
  role,
  headline,
  meta,
  fact,
  aside,
  primary,
  more = [],
  photo = 'lg',
  photoMark,
  nameMark,
  edge,
  onOpen,
  onProfileOpen,
  selected = false,
  href,
  children,
  className,
}: {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  role?: string | null;
  /** What they do. One or two lines; the rest is on the profile. */
  headline?: ReactNode;
  /** Under the headline: where they are, where a commitment stands. */
  meta?: ReactNode;
  /** The one thing that says why this person is on this list. */
  fact?: ReactNode;
  /** At the right of the head: the score, a state. */
  aside?: ReactNode;
  /** The card's one decision. */
  primary?: ReactNode;
  more?: CardMoreItem[];
  photo?: keyof typeof PHOTO;
  /** Over the photo's corner: the verified check, an online dot. */
  photoMark?: ReactNode;
  /** Beside the name: the verified badge. */
  nameMark?: ReactNode;
  /** The face or the name was followed: a page may count it. */
  onProfileOpen?: () => void;
  /** A thin line down the left edge in the score's colour. */
  edge?: string;
  /** Pressing the card itself: a preview, where the page has one. */
  onOpen?: () => void;
  selected?: boolean;
  /** Where the name and the face lead. */
  href?: string;
  /** Anything a page must keep on the card, under the fact. */
  children?: ReactNode;
  className?: string;
}) {
  const profile = href ?? `/profiles/${userId}`;
  return (
    <Card
      data-person-card=""
      className={cn(
        // A column, so a row of cards in a grid keeps its actions on one line
        // at the bottom: the grid stretches every card to the tallest, and a
        // shorter card left an 83px band under its buttons (docs §122.5).
        'group relative flex flex-col overflow-hidden transition-all duration-200 hover:border-primary/30',
        selected && 'ring-2 ring-primary ring-offset-1',
        onOpen && 'cursor-pointer',
        className,
      )}
      onClick={(event) => {
        // Radix menus portal out of the card, so their clicks are not inside a button here.
        const target = event.target as HTMLElement;
        if (onOpen && !target.closest('button, a, [role="menuitem"], [role="menu"]')) onOpen();
      }}
      {...(onOpen ? pressableProps({ role: 'link', label: bilingualAria(`Preview ${name}`, `Προεπισκόπηση: ${name}`) }) : {})}
    >
      {edge ? <div className="absolute inset-y-0 left-0 w-0.5 transition-all duration-200 group-hover:w-1" style={{ background: edge } as CSSProperties} /> : null}
      <CardContent className="flex flex-1 flex-col gap-3">
        <CardHead
          mark={(
            // The name beside it is the same link: one stop for the keyboard and for a screen reader.
            <Link href={profile} onClick={onProfileOpen} tabIndex={-1} aria-hidden="true" className="relative block rounded-full">
              <Avatar className={cn(PHOTO[photo], 'border border-border')}>
                <AvatarImage src={avatarUrl || undefined} alt="" />
                <AvatarFallback className="bg-muted text-sm font-semibold text-foreground">{initialsOf(name)}</AvatarFallback>
              </Avatar>
              {photoMark}
            </Link>
          )}
          title={(
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <PersonHovercard userId={userId}>
                <Link href={profile} onClick={onProfileOpen} className="person-name transition-colors hover:text-primary-accessible">{name}</Link>
              </PersonHovercard>
              {nameMark}
              {role ? <RoleBadge role={role} size="sm" /> : null}
            </span>
          )}
          subtitle={headline ? <span className="line-clamp-2">{headline}</span> : undefined}
          meta={meta}
          aside={aside}
        />
        {fact ? <div className="text-xs text-foreground" data-person-fact="">{fact}</div> : null}
        {children}
        {primary || more.length > 0 ? (
          <CardFoot end className="mt-auto">
            {primary}
            <CardMoreMenu name={name} items={more} />
          </CardFoot>
        ) : null}
      </CardContent>
    </Card>
  );
}
