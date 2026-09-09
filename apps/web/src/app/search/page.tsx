'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Search, X, Filter, Users, Briefcase, Calendar, MessageCircle,
  GraduationCap, Building2, FileText, Sparkles, ChevronDown,
  MapPin, Clock, ArrowRight, Loader2, History, Command,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleBadge } from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';
import { SanitizedHtml } from '@/components/common/SanitizedHtml';

type SearchCategory = 'all' | 'people' | 'jobs' | 'events' | 'groups' | 'mentors' | 'opportunities';

type SearchResult = {
  id: string;
  type: 'user' | 'job' | 'event' | 'group' | 'opportunity';
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  href: string;
  meta?: Record<string, string>;
  tags?: string[];
  highlight?: string;
};

type SearchResponse = {
  results: SearchResult[];
  total: number;
  categories: {
    people: number;
    jobs: number;
    events: number;
    groups: number;
    mentors: number;
    opportunities: number;
  };
};

const RECENT_SEARCHES_KEY = 'cfb:recent-searches';
const MAX_RECENT_SEARCHES = 6;

async function performSearch(
  query: string,
  category: SearchCategory,
  page: number = 1
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    category,
    page: String(page),
    limit: '20',
  });
  return apiRequest<SearchResponse>(`/api/v1/search?${params}`);
}

const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: React.ElementType }> = {
  all: { label: 'All', icon: Sparkles },
  people: { label: 'People', icon: Users },
  jobs: { label: 'Jobs', icon: Briefcase },
  events: { label: 'Events', icon: Calendar },
  groups: { label: 'Groups', icon: Building2 },
  mentors: { label: 'Mentors', icon: GraduationCap },
  opportunities: { label: 'Opportunities', icon: FileText },
};

function SearchResultSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-border/40">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
    user: { icon: Users, color: 'text-blue-500' },
    job: { icon: Briefcase, color: 'text-emerald-500' },
    event: { icon: Calendar, color: 'text-purple-500' },
    group: { icon: Building2, color: 'text-orange-500' },
    opportunity: { icon: FileText, color: 'text-cyan-500' },
  };

  const config = typeConfig[result.type] || typeConfig.user;
  const Icon = config.icon;

  return (
    <Link href={result.href}>
      <Card className="group hover:border-primary/50 transition-all duration-150">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {result.imageUrl ? (
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={result.imageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary-emphasis">
                  {result.title[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                'bg-muted'
              )}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground group-hover:text-primary-emphasis transition-colors truncate">
                  {result.title}
                </h3>
                <Badge variant="secondary" className="text-2xs shrink-0">
                  {result.type}
                </Badge>
              </div>

              {result.subtitle && (
                <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
              )}

              {result.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {result.highlight ? (
                    <SanitizedHtml as="span" profile="highlight" html={result.highlight} />
                  ) : (
                    result.description
                  )}
                </p>
              )}

              {result.meta && Object.keys(result.meta).length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  {result.meta.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="icon-2xs" aria-hidden="true" />
                      {result.meta.location}
                    </span>
                  )}
                  {result.meta.date && (
                    <span className="flex items-center gap-1">
                      <Clock className="icon-2xs" aria-hidden="true" />
                      {result.meta.date}
                    </span>
                  )}
                </div>
              )}

              {result.tags && result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-2xs h-5">
                      {tag}
                    </Badge>
                  ))}
                  {result.tags.length > 3 && (
                    <Badge variant="outline" className="text-2xs h-5">
                      +{result.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <ArrowRight className="icon-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ query, category }: { query: string; category: SearchCategory }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Search className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {query
          ? `We couldn't find any ${category === 'all' ? 'results' : category} matching "${query}"`
          : 'Enter a search term to find people, jobs, events, and more'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/discover">
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="icon-sm" aria-hidden="true" />
            Browse People
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline" size="sm" className="gap-2">
            <Briefcase className="icon-sm" aria-hidden="true" />
            Browse Jobs
          </Button>
        </Link>
        <Link href="/events">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="icon-sm" aria-hidden="true" />
            Browse Events
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const initialCategory = (searchParams?.get('category') as SearchCategory) || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored) as string[]);
    } catch {}
  }, []);

  // Cmd/Ctrl+K shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (category !== 'all') params.set('category', category);
    
    const newUrl = params.toString() ? `/search?${params}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, category, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQuery, category],
    queryFn: () => performSearch(debouncedQuery, category),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // Save successful searches to localStorage
  useEffect(() => {
    if (debouncedQuery.length >= 2 && data?.total) {
      setRecentSearches(prev => {
        const updated = [debouncedQuery, ...prev.filter((s) => s !== debouncedQuery)].slice(0, MAX_RECENT_SEARCHES);
        try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  }, [debouncedQuery, data?.total]);

  const results = data?.results || [];
  const total = data?.total || 0;
  const categories = data?.categories || {
    people: 0,
    jobs: 0,
    events: 0,
    groups: 0,
    mentors: 0,
    opportunities: 0,
  };

  return (
    <AppShell title="Search" description="Find people, jobs, events, and more">
      <div className="">
        {/* Search Input */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" aria-hidden="true" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for people, jobs, events, groups..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 150)}
              className="pl-10 pr-20 h-11"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {!query && (
                <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground font-mono">
                  <Command className="h-2.5 w-2.5" aria-hidden="true" />K
                </kbd>
              )}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="icon-sm" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Recent searches dropdown */}
          {inputFocused && !query && recentSearches.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 z-50 rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  Recent searches
                </span>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch {}
                  }}
                  className="text-2xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); inputRef.current?.blur(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-secondary/60 transition-colors text-left"
                >
                  <History className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{term}</span>
                  <X
                    className="icon-2xs text-muted-foreground hover:text-foreground shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSearches(prev => {
                        const updated = prev.filter((s) => s !== term);
                        try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch {}
                        return updated;
                      });
                    }} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {/* Category Tabs */}
          <div className="mt-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 min-w-max">
              {(Object.entries(CATEGORY_CONFIG) as [SearchCategory, typeof CATEGORY_CONFIG[SearchCategory]][]).map(
                ([key, config]) => {
                  const Icon = config.icon;
                  const count = key === 'all' ? total : categories[key as keyof typeof categories] || 0;
                  const isActive = category === key;

                  return (
                    <Button
                      key={key}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategory(key)}
                      className={cn(
                        'gap-1.5 text-xs',
                        !isActive && 'border-border/60'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                      {debouncedQuery.length >= 2 && count > 0 && (
                        <Badge
                          variant={isActive ? 'secondary' : 'outline'}
                          className="ml-1 h-4 px-1 text-2xs"
                        >
                          {count}
                        </Badge>
                      )}
                    </Button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-4">
          {debouncedQuery.length < 2 ? (
            <EmptyState query="" category={category} />
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SearchResultSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <X className="h-7 w-7 text-destructive-emphasis" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Search failed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong. Please try again.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : results.length === 0 ? (
            <EmptyState query={debouncedQuery} category={category} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {total} result{total !== 1 ? 's' : ''} for "{debouncedQuery}"
                </p>
              </div>
              <div className="space-y-3">
                {results.map((result) => (
                  <ResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick Links */}
        {debouncedQuery.length < 2 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/discover" className="group">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Users className="icon-md text-blue-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary-emphasis transition-colors">
                        Discover People
                      </p>
                      <p className="text-xs text-muted-foreground">Find co-founders and collaborators</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/mentoring" className="group">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <GraduationCap className="icon-md text-purple-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary-emphasis transition-colors">
                        Find Mentors
                      </p>
                      <p className="text-xs text-muted-foreground">Connect with experienced advisors</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/jobs" className="group">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Briefcase className="icon-md text-emerald-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary-emphasis transition-colors">
                        Browse Jobs
                      </p>
                      <p className="text-xs text-muted-foreground">Startup roles and opportunities</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/events" className="group">
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Calendar className="icon-md text-orange-500" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary-emphasis transition-colors">
                        Upcoming Events
                      </p>
                      <p className="text-xs text-muted-foreground">Meetups, webinars, and more</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
