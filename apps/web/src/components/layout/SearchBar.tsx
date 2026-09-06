'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { CfbGlyph } from '@/components/icons/CfbGlyph';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  }

  return (
    <>
      <form onSubmit={submit} className="relative hidden w-full max-w-md md:block">
        <CfbGlyph name="discover" className="pointer-events-none absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={bilingualInline('Search founders, mentors, skills…', 'Αναζήτηση ιδρυτών, μεντόρων, δεξιοτήτων…')}
          className="pl-9"
          aria-label={bilingualAria('Search', 'Αναζήτηση')}
        />
      </form>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 md:hidden"
        onClick={() => router.push('/search')}
        aria-label={bilingualAria('Search', 'Αναζήτηση')}
      >
        <CfbGlyph name="discover" className="icon-md" />
      </Button>
    </>
  );
}
