'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, ExternalLink, Package, TrendingUp, DollarSign } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { listMarketplaceServices, type MarketplaceCategory } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  logo?: string;
  pricing: string;
  avgRating: number;
  reviewCount: number;
  tags: string[];
  featured?: boolean;
}

const CATEGORIES = ['All', 'Analytics', 'Productivity', 'Marketing', 'Design', 'Development', 'Finance'];

const DEMO_TOOLS: Tool[] = [
  {
    id: '1',
    name: 'Mixpanel',
    description: 'Product analytics that help you convert, engage, and retain more users',
    category: 'Analytics',
    url: 'https://mixpanel.com',
    pricing: 'Free - $999/mo',
    avgRating: 4.5,
    reviewCount: 234,
    tags: ['Analytics', 'Product', 'Growth'],
    featured: true,
  },
  {
    id: '2',
    name: 'Notion',
    description: 'All-in-one workspace for notes, docs, wikis, and project management',
    category: 'Productivity',
    url: 'https://notion.so',
    pricing: 'Free - $15/user/mo',
    avgRating: 4.8,
    reviewCount: 1203,
    tags: ['Productivity', 'Collaboration', 'Docs'],
    featured: true,
  },
  {
    id: '3',
    name: 'Figma',
    description: 'Collaborative interface design tool with real-time collaboration',
    category: 'Design',
    url: 'https://figma.com',
    pricing: 'Free - $45/editor/mo',
    avgRating: 4.9,
    reviewCount: 892,
    tags: ['Design', 'Prototyping', 'UI/UX'],
  },
  {
    id: '4',
    name: 'Stripe',
    description: 'Payment infrastructure for the internet. Accept payments globally.',
    category: 'Finance',
    url: 'https://stripe.com',
    pricing: '2.9% + 30¢ per transaction',
    avgRating: 4.7,
    reviewCount: 567,
    tags: ['Payments', 'Finance', 'API'],
  },
  {
    id: '5',
    name: 'Vercel',
    description: 'Deploy web projects with zero configuration and automatic scaling',
    category: 'Development',
    url: 'https://vercel.com',
    pricing: 'Free - $20/user/mo',
    avgRating: 4.6,
    reviewCount: 445,
    tags: ['Hosting', 'Deployment', 'Serverless'],
  },
  {
    id: '6',
    name: 'Mailchimp',
    description: 'Email marketing platform with automation and analytics',
    category: 'Marketing',
    url: 'https://mailchimp.com',
    pricing: 'Free - $350/mo',
    avgRating: 4.3,
    reviewCount: 678,
    tags: ['Email', 'Marketing', 'Automation'],
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-semibold text-foreground truncate">
                {tool.name}
              </h3>
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {tool.category}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">{tool.avgRating.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {tool.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          <span>{tool.pricing}</span>
        </div>

        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary/60 px-2 py-0.5 text-[10px] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground">{tool.reviewCount} reviews</span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(tool.url, '_blank')}
          >
            Visit
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['marketplace', selectedCategory !== 'All' ? selectedCategory.toLowerCase() : undefined, searchQuery || undefined],
    queryFn: () => listMarketplaceServices({
      category: selectedCategory !== 'All' ? selectedCategory.toLowerCase() as MarketplaceCategory : undefined,
      search: searchQuery.trim() || undefined,
      limit: 50,
    }),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const backendTools: Tool[] = (apiData?.services ?? []).map((s) => ({
    id: s.id,
    name: s.title,
    description: s.description ?? '',
    category: s.category.charAt(0).toUpperCase() + s.category.slice(1),
    url: s.websiteUrl ?? s.contactUrl ?? '#',
    logo: s.providerLogo ?? undefined,
    pricing: s.pricing ?? 'Contact',
    avgRating: 0,
    reviewCount: 0,
    tags: s.tags,
    featured: s.isFeatured,
  }));

  const allTools = backendTools.length > 0 ? backendTools : DEMO_TOOLS;

  const filteredTools = allTools.filter((tool) => {
    const matchesCategory = selectedCategory === 'All' || tool.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredTools = filteredTools.filter((t) => t.featured);
  const regularTools = filteredTools.filter((t) => !t.featured);

  return (
    <AppShell
      title="Marketplace"
      description="Discover tools and resources to grow your startup"
    >
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools, categories, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                selectedCategory === category
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Featured Tools */}
      {!isLoading && featuredTools.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Featured Tools
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* All Tools */}
      {!isLoading && regularTools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All Tools
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regularTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 mb-4 text-muted-foreground/30" />
          <p className="font-medium text-foreground">No tools found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </AppShell>
  );
}
