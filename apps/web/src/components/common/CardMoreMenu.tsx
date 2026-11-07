'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

export type CardMoreItem = {
  key: string;
  en: string;
  el: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  /** Passing, removing: said in the destructive colour so it is not chosen by habit. */
  destructive?: boolean;
};

/**
 * The rest of what a card can do, one press away (docs §115). A card asks for
 * one decision; everything else it could always do lives here, in the same
 * place on every card, and does exactly what its button did.
 */
export function CardMoreMenu({ name, items, className }: { name: string; items: CardMoreItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-card-more=""
          className={cn('shrink-0', className)}
          aria-label={bilingualAria(`More actions for ${name}`, `Περισσότερες ενέργειες: ${name}`)}
          title={bilingualAria('More', 'Περισσότερα')}
        >
          <MoreHorizontal className="icon-sm" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        {items.map((item) => {
          const Icon = item.icon;
          const body = (
            <>
              {Icon ? <span data-keep-icon=""><Icon className="icon-sm" /></span> : null}
              <BilingualText en={item.en} el={item.el} compact />
            </>
          );
          return item.href ? (
            <DropdownMenuItem key={item.key} asChild disabled={item.disabled} className="gap-2">
              <Link href={item.href}>{body}</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={item.key}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn('gap-2', item.destructive && 'text-destructive-accessible')}
            >
              {body}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
