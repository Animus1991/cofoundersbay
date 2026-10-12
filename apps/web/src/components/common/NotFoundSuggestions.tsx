'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { suggestPages, type NotFoundSuggestion } from '@/lib/not-found-suggestions';

/**
 * "Did you mean" for a mistyped address. Renders nothing until the path is
 * known, and nothing when no real page is close, so a random 404 stays as it is.
 */
export function NotFoundSuggestions() {
  const [hits, setHits] = useState<NotFoundSuggestion[]>([]);

  useEffect(() => {
    setHits(suggestPages(window.location.pathname));
  }, []);

  if (hits.length === 0) return null;

  return (
    <div className="mt-6 max-w-md">
      <p className="text-sm text-muted-foreground">Did you mean</p>
      <p className="mt-1 text-sm text-muted-foreground" lang="el">Μήπως εννοείτε</p>
      <ul className="mt-3 space-y-2">
        {hits.map((hit) => (
          <li key={hit.path}>
            <Link href={hit.path} className="text-sm font-medium text-primary-accessible hover:underline">
              {hit.title}
            </Link>
            {hit.titleEl ? (
              <span className="mt-0.5 block text-sm text-muted-foreground" lang="el">{hit.titleEl}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
