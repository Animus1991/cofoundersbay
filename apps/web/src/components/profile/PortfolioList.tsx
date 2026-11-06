'use client';

import { BilingualText } from '@/components/common/BilingualText';
import { PORTFOLIO_TYPES, type PortfolioItem } from '@/lib/portfolio';

/** Links only to http(s): the API refuses anything else, and this does not assume it. */
function safeUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

/** A member's work: one row each, the title a link when there is one (docs §111). */
export function PortfolioList({ items }: { items: PortfolioItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const type = PORTFOLIO_TYPES.find((t) => t.value === item.type);
        const href = safeUrl(item.url);
        return (
          <li key={item.id} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
            <p className="text-sm font-medium text-foreground">
              {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline-offset-4 hover:underline">{item.title}</a> : item.title}
            </p>
            {type ? <p className="text-xs text-muted-foreground"><BilingualText en={type.en} el={type.el} compact /></p> : null}
            {item.description ? <p className="card-body text-muted-foreground">{item.description}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
