"use client";

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <div className="relative hidden w-full max-w-md lg:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search founders, mentors, skills…"
        className="pl-9"
        aria-label="Search"
      />
    </div>
  );
}
