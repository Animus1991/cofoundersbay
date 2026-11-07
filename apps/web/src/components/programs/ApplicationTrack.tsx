'use client';

import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

const STEPS = [
  { en: 'Applied', el: 'Αίτηση' },
  { en: 'Decision', el: 'Απόφαση' },
  { en: 'Taking part', el: 'Συμμετοχή' },
  { en: 'Finished', el: 'Ολοκλήρωση' },
] as const;

type Track = { reached: number; stopped: boolean; en: string; el: string };

/**
 * Where an application stands, from the status the organiser sets. "Applied"
 * stayed on the card whatever had happened since, so an acceptance or a no
 * could only be learned from the assistant. A status this build does not know
 * shows nothing rather than a guess.
 */
export function applicationTrack(status: string | undefined): Track | null {
  switch (status) {
    case 'applied':
    case 'pending':
      return { reached: 0, stopped: false, en: 'Sent. The organiser decides next.', el: 'Εστάλη. Η απόφαση είναι του οργανισμού.' };
    case 'accepted':
      return { reached: 1, stopped: false, en: 'Accepted. The programme starts next.', el: 'Έγινε δεκτή. Ακολουθεί η έναρξη του προγράμματος.' };
    case 'active':
      return { reached: 2, stopped: false, en: 'You are taking part.', el: 'Συμμετέχετε.' };
    case 'completed':
      return { reached: 3, stopped: false, en: 'You finished this programme.', el: 'Ολοκληρώσατε αυτό το πρόγραμμα.' };
    case 'rejected':
      return { reached: 1, stopped: true, en: 'Not accepted this time.', el: 'Δεν έγινε δεκτή αυτή τη φορά.' };
    case 'dropped':
      return { reached: 2, stopped: true, en: 'You left the programme.', el: 'Αποχωρήσατε από το πρόγραμμα.' };
    case 'withdrawn':
      return { reached: 0, stopped: true, en: 'You withdrew the application.', el: 'Αποσύρατε την αίτηση.' };
    default:
      return null;
  }
}

/** The four steps and the sentence under them, on a programme you applied to. */
export function ApplicationTrack({ status, className }: { status: string | undefined; className?: string }) {
  const track = applicationTrack(status);
  if (!track) return null;
  return (
    <div className={cn('space-y-1.5', className)} data-application-track={status}>
      <ol className="flex gap-1.5" aria-label={bilingualAria('Where your application stands', 'Πού βρίσκεται η αίτησή σας')}>
        {STEPS.map((step, index) => {
          const reached = index <= track.reached;
          return (
            <li key={step.en} className="min-w-0 flex-1 space-y-1" aria-current={index === track.reached ? 'step' : undefined}>
              <span
                aria-hidden="true"
                className={cn('block h-1 rounded-full', !reached ? 'bg-border' : track.stopped && index === track.reached ? 'bg-muted-foreground/50' : 'bg-primary')}
              />
              <span className={cn('block truncate text-xs', reached ? 'text-foreground' : 'text-muted-foreground')}>
                <BilingualText en={step.en} el={step.el} compact />
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground"><BilingualText en={track.en} el={track.el} compact wrap /></p>
    </div>
  );
}
