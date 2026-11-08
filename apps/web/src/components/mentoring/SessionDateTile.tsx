'use client';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialsOf } from '@/lib/utils';

/**
 * The date tile every session row opens with: month over day, one anatomy for
 * bookings and mentorship sessions alike. It is the card's mark (where a
 * person's card has an avatar): 2.5rem like an avatar, so the title beside
 * it keeps the card's title step and the day (text-sm) never outranks it.
 */
export function SessionDateTile({ date, face }: {
  date: Date;
  /** The other person in the session, on the tile's corner (docs §115): the day and who with, at a glance. */
  face?: { src?: string | null; name: string } | null;
}) {
  const fmtDate = useDateFormat();
  return (
    <div data-card-mark="" className="relative flex h-10 w-10 flex-col items-center justify-center self-start rounded-xl bg-primary/5 leading-none">
      <span className="text-2xs uppercase text-muted-foreground">
        {fmtDate(date, { month: 'short' })}
      </span>
      <span className="mt-0.5 text-sm font-bold tabular-nums">{date.getUTCDate()}</span>
      {face ? (
        <Avatar className="absolute -bottom-1.5 -right-1.5 h-5 w-5 border-2 border-card" data-keep-icon="" data-session-face="">
          {face.src ? <AvatarImage src={face.src} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-2xs font-semibold text-primary-accessible">{initialsOf(face.name)}</AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
