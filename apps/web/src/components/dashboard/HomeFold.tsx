'use client';

import type { ReactNode } from 'react';
import { BilingualText } from '@/components/common/BilingualText';
import { useStoredFlag } from '@/components/dashboard/FounderFirstMove';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The long part of a home, on a phone (docs §115). What waits and the figures
 * stay in view; the lists under them open with one press, and the choice is
 * remembered. From 1024px nothing folds, so a wide screen reads as it did.
 */
export function HomeFold({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const [open, setOpen] = useStoredFlag(storageKey);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full lg:hidden"
        aria-expanded={Boolean(open)}
        onClick={() => setOpen(!open)}
        data-home-fold=""
      >
        {open
          ? <BilingualText en="Show less" el="Λιγότερα" compact />
          : <BilingualText en="The rest of your home" el="Το υπόλοιπο της αρχικής" compact />}
      </Button>
      <div className={cn('min-w-0 space-y-6', !open && 'max-lg:hidden')}>{children}</div>
    </>
  );
}
