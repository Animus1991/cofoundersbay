'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

/**
 * Global toggle for showing/hiding sample data across all pages.
 *
 * Labelled "Sample data", not "Demo": the top bar also shows a "Demo account"
 * badge for the shared preview login, and two controls both reading "Demo"
 * were indistinguishable. The ON state is the visually "filled" one — the old
 * styling used ghost+muted for ON and a dashed outline for OFF, which inverted
 * the affordance.
 */
export function DemoDataToggle({ className }: { className?: string }) {
  const { showDemoData, toggleDemoData } = useDemoData();
  const label = showDemoData
    ? bilingualAria('Sample data is on — click to hide it', 'Τα δείγματα δεδομένων είναι ενεργά — κλικ για απόκρυψη')
    : bilingualAria('Sample data is off — click to show it', 'Τα δείγματα δεδομένων είναι ανενεργά — κλικ για εμφάνιση');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleDemoData}
            aria-pressed={showDemoData}
            aria-label={label}
            className={cn(
              'gap-1.5 px-2 font-medium',
              showDemoData
                ? 'bg-secondary text-foreground hover:bg-secondary/80'
                : 'text-muted-foreground hover:text-foreground',
              className,
            )}
          >
            {showDemoData
              ? <Eye className="icon-sm" aria-hidden="true" />
              : <EyeOff className="icon-sm" aria-hidden="true" />}
            <span className="hidden sm:inline">
              <BilingualText en="Sample data" el="Δείγμα" compact />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-[240px]">
          <p className="mb-1 text-xs font-medium">
            <BilingualText
              en={showDemoData ? 'Sample data: on' : 'Sample data: off'}
              el={showDemoData ? 'Δείγμα δεδομένων: ενεργό' : 'Δείγμα δεδομένων: ανενεργό'}
            />
          </p>
          <p className="text-2xs text-muted-foreground">
            <BilingualText
              en={showDemoData
                ? 'Pages are filled with example content so you can explore. Nothing here is saved.'
                : 'Pages show only your real data. Turn on to fill them with examples.'}
              el={showDemoData
                ? 'Οι σελίδες γεμίζουν με παραδείγματα για εξερεύνηση. Τίποτα δεν αποθηκεύεται.'
                : 'Οι σελίδες δείχνουν μόνο τα πραγματικά σας δεδομένα. Ενεργοποιήστε για παραδείγματα.'}
            />
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
