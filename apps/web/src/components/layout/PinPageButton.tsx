'use client';

import { usePathname } from 'next/navigation';
import { Star } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useUsageProfile } from '@/hooks/useUsageProfile';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { canShortcut, pageKey, pageLabel, pinPage, unpinPage } from '@/lib/usage-profile';
import { cn } from '@/lib/utils';

/** Whether the page at this path can be one of the reader's pages: a static page that is not a home. */
export function isPinnablePath(pathname: string | null | undefined): boolean {
  const key = pathname ? pageKey(pathname) : null;
  return Boolean(key && canShortcut(key));
}

/**
 * The star beside a page's title: pins the page to the reader's own pages
 * (every home's "Your pages", the command palette, G then its number), or
 * takes it off. From the AI Studio prototype's PinToggle, which pins from
 * the page itself rather than from a list somewhere else (docs §110).
 *
 * Same shape and size as the help button beside it. Each change says what
 * it did and can be taken back from the toast.
 */
export function PinPageButton() {
  const pathname = usePathname();
  const sayOne = useBilingualString();
  const { success, error } = useToast();
  const { ready, store } = useUsageProfile();
  const key = pathname ? pageKey(pathname) : null;
  if (!key || !canShortcut(key)) return null;

  const pinned = ready && store.pins.includes(key);
  const label = pageLabel(key);
  const name = sayOne(label.en, label.el);

  function toggle() {
    if (!key) return;
    if (pinned) {
      const result = unpinPage(key);
      if (!result.ok) return;
      success(sayOne(`${label.en} is off your pages.`, `Η σελίδα «${label.el}» βγήκε από τις σελίδες σας.`), undefined, {
        action: { label: sayOne('Undo', 'Αναίρεση'), onClick: () => pinPage(key, result.index) },
      });
      return;
    }
    const result = pinPage(key);
    if (!result.ok) {
      if (result.reason === 'full') error(sayOne('All six places are taken.', 'Και οι έξι θέσεις είναι πιασμένες.'), sayOne('Unpin a page first, from your home or Settings.', 'Ξεκαρφιτσώστε πρώτα μία σελίδα, από την αρχική ή τις Ρυθμίσεις.'));
      return;
    }
    success(
      sayOne(`${label.en} is pinned to your pages.`, `Η σελίδα «${label.el}» καρφιτσώθηκε στις σελίδες σας.`),
      sayOne(`On every home and in the command palette; G then ${result.index + 1} opens it.`, `Σε κάθε αρχική και στην παλέτα εντολών· το G και μετά ${result.index + 1} την ανοίγει.`),
      { action: { label: sayOne('Undo', 'Αναίρεση'), onClick: () => unpinPage(key) } },
    );
  }

  const aria = pinned
    ? bilingualAria(`Unpin ${label.en} from your pages`, `Ξεκαρφίτσωμα «${label.el}» από τις σελίδες σας`)
    : bilingualAria(`Pin ${label.en} to your pages`, `Καρφίτσωμα «${label.el}» στις σελίδες σας`);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={pinned}
      aria-label={aria}
      title={pinned ? sayOne(`Pinned: ${name}`, `Καρφιτσωμένη: ${name}`) : sayOne('Pin to your pages', 'Καρφίτσωμα στις σελίδες σας')}
      data-pin-page=""
      data-testid="pin-current-page"
      disabled={!ready}
      data-keep-icon=""
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-ring md:h-9 md:w-9 lg:h-[calc(36px*var(--chrome-y))] lg:w-[36px]',
        pinned
          ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
          : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
      )}
    >
      <Star className={cn('icon-sm', pinned && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
