'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { bilingualAria } from '@/lib/i18n/format';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from '@/lib/i18n/LanguagePreferenceContext';
import { CfbGlyph } from '@/components/icons/CfbGlyph';

const SEARCH_EN = 'Search founders, mentors, skills…';
const SEARCH_EL = 'Αναζήτηση ιδρυτών, μεντόρων, δεξιοτήτων…';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { primary, showSecondary } = useLanguagePreference();
  const resolved = resolveBilingualPair(SEARCH_EN, SEARCH_EL, primary, showSecondary);

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
          placeholder={resolved.primaryText}
          className="pl-9"
          lang={resolved.primaryLang}
          aria-label={bilingualAria(SEARCH_EN, SEARCH_EL)}
        />
      </form>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 md:hidden"
        onClick={() => router.push('/search')}
        aria-label={bilingualAria(SEARCH_EN, SEARCH_EL)}
      >
        <CfbGlyph name="discover" className="icon-md" />
      </Button>
    </>
  );
}
