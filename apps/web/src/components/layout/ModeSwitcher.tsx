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
import { useI18n } from '@/components/common/I18nProvider';

interface ModeSwitcherProps {
  currentMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  expanded: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, expanded }: ModeSwitcherProps) {
  const { t } = useI18n();

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'min-w-0 shrink-0 overflow-hidden border-b border-border/60 bg-secondary/30',
          // Expanded: one row per mode. A 3-up grid gives each label only ~66px,
          // which forced 10px/8px type and still truncated the Greek labels.
          // Full-width rows fit both languages at legible sizes and match the
          // nav list directly below.
          expanded ? 'flex flex-col gap-0.5 px-2 py-2' : 'flex flex-col gap-1 px-1 py-2',
        )}
      >
        {sidebarModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          const labelEl = SIDEBAR_MODE_EL[mode.id];

          const button = (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              title={!expanded ? t(mode.shortLabel) : undefined}
              className={cn(
                'flex items-center rounded-md transition-all duration-150 min-w-0 overflow-hidden',
                expanded
                  ? 'w-full gap-2.5 px-2.5 py-1.5 text-left'
                  : 'h-9 w-9 justify-center',
                isActive
                  ? 'bg-primary/10 text-primary-accessible shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
              aria-pressed={isActive}
              aria-label={bilingualAria(mode.shortLabel, labelEl)}
            >
              <NavIcon name={glyphForMode(mode.id)} fallback={Icon} className="icon-sm shrink-0" />
              {expanded && (
                <BilingualText
                  en={mode.shortLabel}
                  el={labelEl}
                  stacked
                  className="min-w-0 flex-1 text-sm"
                  primaryClassName="font-medium"
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
