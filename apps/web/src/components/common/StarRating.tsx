import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bilingualInline } from '@/lib/i18n/format';

/**
 * The read-only five-star row a review card draws. Two page-local copies
 * (/mentor/reviews and /provider/reviews) rendered the same row; the
 * interactive star INPUT on endorsements is a different control and stays
 * its own thing.
 */
export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    // data-keep-icon: inside a card the decorative-icon rule hides every
    // bare glyph, and these stars are the rating itself.
    <div
      data-keep-icon=""
      className={cn('flex gap-0.5', className)}
      role="img"
      aria-label={bilingualInline(`${rating} of 5 stars`, `${rating} από 5 αστέρια`)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'icon-sm',
            star <= rating ? 'fill-status-warning text-status-warning' : 'text-muted-foreground/30'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
