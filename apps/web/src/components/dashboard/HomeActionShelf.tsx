'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { bilingualAria } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import type { HomeAskAction, HomeAskNow } from '@/lib/home-ask';

const CHIP = 'h-auto min-h-9 max-w-full gap-1.5 whitespace-normal rounded-full px-3 py-1.5 text-left text-xs';

/** Same actions as the composer and slash menu, grouped by urgency rather than colour alone. */
export function HomeActionShelf({ actions, now, run }: {
  actions: HomeAskAction[];
  now: HomeAskNow[];
  run: (action: HomeAskAction) => void;
}) {
  const say = useBilingualString();
  const intent = (action: HomeAskAction) => action.prompt
    ? say(`Ask the assistant: ${action.en}`, `Ρωτήστε τον βοηθό: ${action.el}`)
    : say(`Open: ${action.en}`, `Άνοιγμα: ${action.el}`);
  const content = (action: HomeAskAction) => <>
    <CfbGlyph name={action.glyph} className="icon-sm shrink-0" aria-hidden="true" />
    <BilingualText en={action.en} el={action.el} compact wrap />
  </>;
  return (
    <div className="space-y-3" data-testid="home-action-shelf">
      {now.length > 0 && (
        <div className="space-y-1.5" data-testid="home-attention-group">
          <p className="text-xs font-medium text-muted-foreground"><BilingualText en="Waiting on you" el="Σας περιμένουν" compact /></p>
          <ul className="flex flex-wrap gap-2" aria-label={bilingualAria('Waiting on you', 'Σας περιμένουν')}>
            {now.map((action) => <li key={action.id} className="max-w-full">
              <Button type="button" variant="outline" size="sm" data-home-now="" data-testid={`home-attention-${action.id}`}
                className={`${CHIP} border-primary-muted bg-primary-subtle`} title={intent(action)} onClick={() => run(action)}>
                {content(action)}<Counter value={action.count} tone="attention" />
              </Button>
            </li>)}
          </ul>
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground"><BilingualText en="Quick actions" el="Γρήγορες ενέργειες" compact /></p>
        <ul className="flex flex-wrap gap-2" aria-label={bilingualAria('Starting points', 'Σημεία εκκίνησης')} data-testid="home-starting-points">
          {actions.map((action) => <li key={action.id} className="max-w-full">
            {action.items?.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className={CHIP} data-testid={`home-action-${action.id}`}>
                    {content(action)}<ChevronDown className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-w-[calc(100vw-2rem)]" data-testid={`home-menu-${action.id}`}>
                  {action.items.map((item) => <DropdownMenuItem key={item.id} onSelect={() => run(item)} className="gap-2" title={intent(item)} data-testid={`home-menu-item-${action.id}-${item.id}`}>
                    {content(item)}
                    {item.prompt ? <Sparkles className="icon-sm ml-auto shrink-0" aria-hidden="true" /> : <ArrowUpRight className="icon-sm ml-auto shrink-0" aria-hidden="true" />}
                  </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : action.href && !action.prompt ? (
              <Button variant="outline" size="sm" className={CHIP} asChild>
                <Link href={action.href} title={intent(action)} data-testid={`home-action-${action.id}`}>
                  {content(action)}<ArrowUpRight className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className={CHIP} title={intent(action)} data-testid={`home-action-${action.id}`} onClick={() => run(action)}>
                {content(action)}<Sparkles className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" />
              </Button>
            )}
          </li>)}
        </ul>
      </div>
    </div>
  );
}