'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search founders, mentors, skills…"
          className="pl-9"
          aria-label="Search"
        />
      </form>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden tap-target shrink-0"
        onClick={() => router.push('/search')}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>
    </>
  );
}
