'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FailedLine } from '@/components/dashboard/SectionCard';

/**
 * An /org screen whose organisation or list was not read.
 *
 * Each of these screens drew its tiles as 0, its tabs as "All 0" and its
 * empty state ("No cohorts yet", "No mentors invited yet") when the read had
 * failed: an organisation with nothing in it, instead of one that was not
 * read. They return this instead, with Try again (docs §96).
 */
export function OrgReadFailed({ en, el, busy, onRetry }: { en?: string; el?: string; busy?: boolean; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FailedLine
            en={en ?? 'Your organisation could not be read just now.'}
            el={el ?? 'Ο οργανισμός σας δεν διαβάστηκε αυτή τη στιγμή.'}
            busy={busy}
            onRetry={onRetry}
          />
        </CardContent>
      </Card>
    </div>
  );
}
