'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/connections', en: 'Connections', el: 'Συνδέσεις' },
  { href: '/intros', en: 'Introductions', el: 'Γνωριμίες' },
  { href: '/shortlist', en: 'Saved profiles', el: 'Αποθηκευμένα' },
  { href: '/endorsements', en: 'Endorsements', el: 'Συστάσεις' },
] as const;

/**
 * The network as one place (docs §115): four pages that are one subject, a
 * press apart. Each keeps its address, so links, the sidebar and the assistant
 * go on working, and each keeps its own data and its own controls.
 */
export function NetworkTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label={bilingualAria('Network', 'Δίκτυο')} className="-mx-1 overflow-x-auto px-1 scrollbar-hide" data-network-tabs="">
      <ul className="flex w-max gap-1 border-b border-border">
        {TABS.map((tab) => {
          const here = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={here ? 'page' : undefined}
                className={cn(
                  'tap-target-y inline-flex items-center border-b-2 px-3 py-2 text-sm transition-colors',
                  here ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <BilingualText en={tab.en} el={tab.el} compact />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
