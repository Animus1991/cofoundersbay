'use client';

import { useState } from 'react';
import {
  Tags,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  Folder,
  Hash,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
  children?: TaxonomyItem[];
};

type TaxonomyCategory = {
  id: string;
  name: string;
  description: string;
  items: TaxonomyItem[];
};

function TaxonomyItemRow({ item, level = 0 }: { item: TaxonomyItem; level?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors border-b last:border-b-0',
          level > 0 && 'bg-muted/30'
        )}
        style={{ paddingLeft: `${16 + level * 24}px` }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
          </Button>
        ) : (
          <div className="w-6" />
        )}
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 font-medium">{item.name}</span>
        <span className="text-sm text-muted-foreground">{item.slug}</span>
        <Badge variant="secondary" className="text-xs">
          {item.count}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              Add Child
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && hasChildren && (
        <>
          {item.children!.map((child) => (
            <TaxonomyItemRow key={child.id} item={child} level={level + 1} />
          ))}
        </>
      )}
    </>
  );
}

function TaxonomyCategoryCard({ category }: { category: TaxonomyCategory }) {
  const [search, setSearch] = useState('');

  const filteredItems = category.items.filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${category.name.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <div className="border-t max-h-[400px] overflow-y-auto">
          {filteredItems.map((item) => (
            <TaxonomyItemRow key={item.id} item={item} />
          ))}
          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No items found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminTaxonomyPage() {
  // Mock data
  const taxonomies: TaxonomyCategory[] = [
    {
      id: 'industries',
      name: 'Industries',
      description: 'Industry categories for startups and profiles',
      items: [
        {
          id: '1',
          name: 'Technology',
          slug: 'technology',
          count: 450,
          children: [
            { id: '1a', name: 'AI/ML', slug: 'ai-ml', count: 120 },
            { id: '1b', name: 'SaaS', slug: 'saas', count: 180 },
            { id: '1c', name: 'DevTools', slug: 'devtools', count: 75 },
          ],
        },
        {
          id: '2',
          name: 'FinTech',
          slug: 'fintech',
          count: 230,
          children: [
            { id: '2a', name: 'Payments', slug: 'payments', count: 85 },
            { id: '2b', name: 'Banking', slug: 'banking', count: 65 },
            { id: '2c', name: 'Insurance', slug: 'insurance', count: 45 },
          ],
        },
        { id: '3', name: 'HealthTech', slug: 'healthtech', count: 156 },
        { id: '4', name: 'CleanTech', slug: 'cleantech', count: 98 },
        { id: '5', name: 'EdTech', slug: 'edtech', count: 87 },
      ],
    },
    {
      id: 'skills',
      name: 'Skills',
      description: 'Skills and expertise tags',
      items: [
        { id: 's1', name: 'Product Management', slug: 'product-management', count: 320 },
        { id: 's2', name: 'Software Engineering', slug: 'software-engineering', count: 580 },
        { id: 's3', name: 'Marketing', slug: 'marketing', count: 245 },
        { id: 's4', name: 'Sales', slug: 'sales', count: 198 },
        { id: 's5', name: 'Design', slug: 'design', count: 176 },
        { id: 's6', name: 'Data Science', slug: 'data-science', count: 145 },
        { id: 's7', name: 'Finance', slug: 'finance', count: 132 },
      ],
    },
    {
      id: 'stages',
      name: 'Startup Stages',
      description: 'Funding and development stages',
      items: [
        { id: 'st1', name: 'Idea', slug: 'idea', count: 234 },
        { id: 'st2', name: 'Pre-seed', slug: 'pre-seed', count: 312 },
        { id: 'st3', name: 'Seed', slug: 'seed', count: 256 },
        { id: 'st4', name: 'Series A', slug: 'series-a', count: 89 },
        { id: 'st5', name: 'Series B+', slug: 'series-b-plus', count: 45 },
      ],
    },
  ];

  return (
    <AppShell>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Taxonomy Management</h1>
            <p className="text-muted-foreground">
              Manage categories, tags, and classification systems
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{taxonomies.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">
                {taxonomies.reduce((acc, t) => acc + t.items.length, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Industries</p>
              <p className="text-2xl font-bold">
                {taxonomies.find((t) => t.id === 'industries')?.items.length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Skills</p>
              <p className="text-2xl font-bold">
                {taxonomies.find((t) => t.id === 'skills')?.items.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Taxonomy Categories */}
        <div className="space-y-6">
          {taxonomies.map((category) => (
            <TaxonomyCategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
