'use client';

/**
 * The date tile every session row opens with: month over day, one anatomy for
 * bookings and mentorship sessions alike.
 */
export function SessionDateTile({ date }: { date: Date }) {
  return (
    <div className="flex w-14 min-w-[3.5rem] flex-col items-center justify-center self-start rounded-lg bg-primary/5 p-2">
      <span className="text-xs uppercase text-muted-foreground">
        {date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' })}
      </span>
      <span className="text-xl font-bold">{date.getUTCDate()}</span>
    </div>
  );
}
