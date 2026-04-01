'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  onClick: (selectedIds: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
}

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  actions: BulkAction[];
  entityLabel?: string;
  className?: string;
  position?: 'top' | 'bottom';
}

export function BulkActionBar({
  selectedIds,
  onClearSelection,
  actions,
  entityLabel = 'item',
  className,
  position = 'bottom',
}: BulkActionBarProps) {
  const count = selectedIds.length;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: position === 'bottom' ? 24 : -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'bottom' ? 24 : -24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'fixed z-40 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5',
            'bg-popover border border-border rounded-full shadow-2xl',
            'ring-1 ring-primary/20',
            position === 'bottom' ? 'bottom-6' : 'top-6',
            className,
          )}
        >
          {/* Count + clear */}
          <div className="flex items-center gap-2 pr-3 border-r border-border/60">
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
              {count}
            </span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {count === 1 ? `1 ${entityLabel}` : `${count} ${entityLabel}s`} selected
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="p-0.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant ?? 'secondary'}
                size="sm"
                disabled={action.disabled || action.loading}
                onClick={() => action.onClick(selectedIds)}
                className="h-7 text-xs gap-1.5"
              >
                {action.loading ? (
                  <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                ) : action.icon ? (
                  <action.icon className="h-3.5 w-3.5" />
                ) : null}
                {action.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Checkbox helper for use inside table rows / cards
interface BulkCheckboxProps {
  id: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export function BulkCheckbox({ id, selectedIds, onToggle, className }: BulkCheckboxProps) {
  const checked = selectedIds.includes(id);
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onToggle(id)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'h-4 w-4 rounded border-border cursor-pointer accent-primary',
        'transition-opacity',
        !checked && 'opacity-40 group-hover:opacity-100',
        className,
      )}
    />
  );
}

// Hook for managing bulk selection state
export function useBulkSelection(allIds: string[]) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...allIds]);
    }
  };

  const clear = () => setSelectedIds([]);

  const isAllSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < allIds.length;

  return { selectedIds, toggle, toggleAll, clear, isAllSelected, isPartiallySelected };
}

import React from 'react';
