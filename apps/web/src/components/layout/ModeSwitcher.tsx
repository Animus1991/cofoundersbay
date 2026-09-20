'use client';

import { cn } from '@/lib/utils';
import { sidebarModes, type SidebarMode } from './nav-modes';
import { SIDEBAR_MODE_EL } from '@/lib/i18n/strings-nav';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NavIcon, glyphForMode } from '@/components/icons/CfbGlyph';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

/** Soft hyphens so the 3-up rail can break long Greek words without an ellipsis. */
const MODE_LABEL_EL_DISPLAY: Record<'work' | 'explore' | 'account', string> = {
  work: 'Εργασία',
  explore: 'Εξερεύ\u00ADνηση',
  account: 'Λογαρια\u00ADσμός',
};

interface ModeSwitcherProps {
  currentMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  expanded: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, expanded }: ModeSwitcherProps) {
  const { primary } = useLanguagePreference();

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'min-w-0 shrink-0 border-b border-border/50',
          // Compact 3-up when the drawer is open. Greek uses a soft hyphen so
          // a ~60px cell can break "Εξερεύνηση" / "Λογαριασμός" instead of
          // clipping to "Εξερε…". Overflow is allowed so the second line is
          // visible; the tooltip still carries both languages.
          expanded
            ? 'grid grid-cols-3 gap-0.5 px-1 py-1.5'
            : 'flex flex-col items-center gap-0.5 px-0 py-1.5',
        )}
      >
        {sidebarModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          const labelEl = SIDEBAR_MODE_EL[mode.id];
          const displayEl = MODE_LABEL_EL_DISPLAY[mode.id] ?? labelEl;

          const button = (
            <button
              onClick={() => onModeChange(mode.id)}
              className={cn(
                'flex min-w-0 items-center rounded-lg transition-colors duration-150',
                expanded
                  ? 'w-full min-h-[2.75rem] flex-col justify-center gap-0.5 px-0.5 py-1 text-center'
                  : 'h-9 w-9 justify-center lg:h-[36px] lg:w-[36px]',
                isActive
                  ? 'bg-primary/8 text-primary-accessible'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
              aria-pressed={isActive}
              aria-label={bilingualAria(mode.shortLabel, labelEl)}
            >
              <NavIcon
                name={glyphForMode(mode.id)}
                fallback={Icon}
                className={cn(expanded ? 'icon-sm' : 'icon-md', 'shrink-0')}
              />
              {expanded && (
                <span
                  lang={primary === 'el' ? 'el' : 'en'}
                  className="w-full px-0.5 text-center text-[10px] font-medium leading-[1.15] [hyphens:auto]"
                >
                  {primary === 'el' ? displayEl : mode.shortLabel}
                </span>
              )}
            </button>
          );

          return (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <BilingualText en={mode.shortLabel} el={labelEl} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
