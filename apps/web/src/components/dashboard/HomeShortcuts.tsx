'use client';

import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { Card, CardContent } from '@/components/ui/card';
import { HOME_ASK, type HomeRole } from '@/lib/home-ask';
import { cn } from '@/lib/utils';
import { useHomeAskRun } from '@/components/dashboard/HomeAskHero';
import { YourPagesRow } from '@/components/dashboard/YourPages';

const row = 'axis-row flex min-h-9 min-w-0 items-center gap-2.5 rounded-md py-1.5 text-sm text-foreground transition-colors hover:bg-accent';

/**
 * The home's shortcuts in the page's tools (docs §116/§125): the reader's
 * pages, then the role's chips as a list — a prompt asks the assistant, an
 * href opens its page, exactly what the chips under the question box did.
 */
export function HomeShortcuts({ role, pages = true }: {
  role: HomeRole;
  /** The rail can carry "Your pages" as its own section; then this renders only the actions. */
  pages?: boolean;
}) {
  const run = useHomeAskRun();
  return (
    <div className="space-y-3" data-testid="home-shortcuts">
      {pages ? <YourPagesRow /> : null}
      {/* No card title: the rail section above it is already called "Quick actions". */}
      <Card>
        <CardContent>
          <div className="flex flex-col">
            {HOME_ASK[role].actions.map((action) => (
              action.href ? (
                <Link key={action.id} href={action.href} className={row}>
                  <CfbGlyph name={action.glyph} className="icon-sm shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <BilingualText en={action.en} el={action.el} compact wrap />
                  </span>
                </Link>
              ) : (
                <button key={action.id} type="button" className={cn(row, 'w-full text-left')} onClick={() => run(action)}>
                  <CfbGlyph name={action.glyph} className="icon-sm shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <BilingualText en={action.en} el={action.el} compact wrap />
                  </span>
                </button>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
