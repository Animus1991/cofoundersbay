'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Filter, TrendingUp, Clock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'event' | 'opportunity';
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  url: string;
  matchScore?: number;
}

interface AdvancedSearchProps {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const SEARCH_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'users', label: 'People' },
  { value: 'posts', label: 'Posts' },
  { value: 'events', label: 'Events' },
  { value: 'opportunities', label: 'Opportunities' },
];

export function AdvancedSearch({ onSelect, placeholder = 'Search...', className }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, selectedTypes],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const params = new URLSearchParams({
        q: debouncedQuery,
        types: selectedTypes.join(','),
      });

      const response = await fetch(`/api/v1/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();
      return data.results || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const response = await fetch(`/api/v1/search/suggestions?q=${debouncedQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();
      return data.suggestions || [];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = useCallback((result: SearchResult) => {
    const newRecent = [result.title, ...recentSearches.filter((s) => s !== result.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_searches', JSON.stringify(newRecent));
    
    setQuery('');
    setIsOpen(false);
    
    if (onSelect) {
      onSelect(result);
    } else {
      window.location.href = result.url;
    }
  }, [recentSearches, onSelect]);

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const toggleType = (type: string) => {
    if (type === 'all') {
      setSelectedTypes(['all']);
    } else {
      const newTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes.filter((t) => t !== 'all'), type];
      
      setSelectedTypes(newTypes.length === 0 ? ['all'] : newTypes);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Filter className="h-3 w-3 mr-1" />
                {selectedTypes.includes('all') ? 'All' : selectedTypes.length}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SEARCH_TYPES.map((type) => (
                <DropdownMenuItem
                  key={type.value}
                  onClick={() => toggleType(type.value)}
                  className={selectedTypes.includes(type.value) ? 'bg-accent' : ''}
                >
                  {selectedTypes.includes(type.value) ? '✓ ' : ''}{type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isOpen && (
        <Card
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto"
        >
          <CardContent className="p-0">
            {!query && recentSearches.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleRecentSearch(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {debouncedQuery && suggestions.length > 0 && (
              <div className="p-3 border-b">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Suggestions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            )}

            {!isLoading && debouncedQuery && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-2 opacity-40" />
                <p>No results found for "{debouncedQuery}"</p>
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="divide-y">
                {results.map((result: SearchResult) => (
                  <div
                    key={result.id}
                    className="p-3 hover:bg-secondary/40 cursor-pointer transition-colors"
                    onClick={() => handleSelect(result)}
                  >
                    <div className="flex items-center gap-3">
                      {result.avatarUrl ? (
                        <img
                          src={result.avatarUrl}
                          alt={result.title}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{result.title}</h4>
                          {result.matchScore && (
                            <Badge variant="secondary" className="text-xs">
                              {result.matchScore}% match
                            </Badge>
                          )}
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {result.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
