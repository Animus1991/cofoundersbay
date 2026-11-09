'use client';

import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { HOME_VARIANTS, type HomeVariant } from '@/lib/home-variant';
import { cn } from '@/lib/utils';

/**
 * Moves between the first page and the dashboard while the owner compares
 * them (docs §117). "First visit" shows the first page as a brand-new account
 * meets it, which the demo account otherwise would not.
 */
export function HomeVariantSwitch({ current, firstVisit = false }: { current: HomeVariant; firstVisit?: boolean }) {
  const item = (active: boolean) => cn(
    'tap-target-y inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
  );
  return (
    <nav aria-label={bilingualAria('Compare the first page', 'Σύγκριση αρχικής σελίδας')} className="-mx-1 overflow-x-auto px-1 scrollbar-hide" data-home-switch="">
      <ul className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg border border-border p-0.5">
        {HOME_VARIANTS.map((variant) => {
          const active = current === variant.value && !firstVisit;
          return (
            <li key={variant.value}>
              <Link href={variant.href} aria-current={active ? 'page' : undefined} className={item(active)}>
                <BilingualText en={variant.en} el={variant.el} compact />
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/home?first=1" aria-current={firstVisit ? 'page' : undefined} className={item(firstVisit)}>
            <BilingualText en="First visit" el="Πρώτη επίσκεψη" compact />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
