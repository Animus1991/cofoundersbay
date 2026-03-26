'use client';

import { cn } from '@/lib/utils';
import { sidebarModes, type SidebarMode } from './nav-modes';

interface ModeSwitcherProps {
  currentMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  expanded: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, expanded }: ModeSwitcherProps) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-border/60 bg-secondary/30',
        expanded ? 'gap-1 px-2 py-1.5' : 'flex-col gap-1 px-1 py-2',
      )}
    >
      {sidebarModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            title={!expanded ? mode.label : undefined}
            className={cn(
              'flex items-center justify-center rounded-md transition-all duration-150',
              expanded
                ? 'flex-1 gap-1.5 px-2 py-1.5 text-xs font-medium'
                : 'h-9 w-9',
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
            aria-pressed={isActive}
            aria-label={mode.label}
          >
            <Icon className={cn('flex-shrink-0', expanded ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            {expanded && <span className="truncate">{mode.shortLabel}</span>}
          </button>
        );
      })}
    </div>
  );
}
