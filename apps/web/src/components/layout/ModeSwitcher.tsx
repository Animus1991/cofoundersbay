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

interface ModeSwitcherProps {
  currentMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  expanded: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, expanded }: ModeSwitcherProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'min-w-0 shrink-0 overflow-hidden border-b border-border/60 bg-secondary/30',
          expanded ? 'grid grid-cols-3 gap-0.5 px-1.5 py-1.5' : 'flex flex-col gap-1 px-1 py-2',
        )}
      >
        {sidebarModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          const labelEl = SIDEBAR_MODE_EL[mode.id];
          const aria = bilingualAria(mode.shortLabel, labelEl);

          const button = (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              title={!expanded ? aria : aria}
              className={cn(
                'flex items-center justify-center rounded-md transition-all duration-150 min-w-0 overflow-hidden',
                expanded
                  ? 'min-h-10 flex-col gap-0.5 px-1 py-1.5 text-center sm:min-h-0'
                  : 'h-9 w-9',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
              aria-pressed={isActive}
              aria-label={aria}
            >
              <Icon className={cn('shrink-0', expanded ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
              {expanded && (
                <BilingualText
                  en={mode.shortLabel}
                  el={labelEl}
                  stacked
                  className="w-full max-w-full"
                  primaryClassName="text-[10px] font-medium leading-tight truncate"
                  secondaryClassName="text-[8px] leading-tight truncate"
                />
              )}
            </button>
          );

          if (!expanded) {
            return (
              <Tooltip key={mode.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <BilingualText en={mode.shortLabel} el={labelEl} />
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </TooltipProvider>
  );
}
