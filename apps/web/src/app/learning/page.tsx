'use client';

import { useState } from 'react';
import { Search, BookOpen, Video, FileText, Award, Clock, TrendingUp, Play, ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'course' | 'guide';
  category: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  author: string;
  authorRole: string;
  url: string;
  isFeatured?: boolean;
  tags: string[];
  completedBy?: number;
}

const CATEGORIES = ['All', 'Fundraising', 'Product', 'Marketing', 'Sales', 'Leadership', 'Tech'];

const DEMO_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'The Complete Guide to Seed Fundraising',
    description: 'Everything you need to know about raising your first round. From pitch deck to term sheets.',
    type: 'guide',
    category: 'Fundraising',
    duration: '45 min read',
    difficulty: 'intermediate',
    author: 'Sarah Chen',
    authorRole: 'VC Partner',
    url: '#',
    isFeatured: true,
    tags: ['Pitch Deck', 'Term Sheets', 'VC'],
    completedBy: 1247,
  },
  {
    id: '2',
    title: 'Building Your First MVP in 30 Days',
    description: 'Step-by-step video course on validating ideas and shipping fast with no-code tools.',
    type: 'course',
    category: 'Product',
    duration: '4.5 hours',
    difficulty: 'beginner',
    author: 'Alex Kumar',
    authorRole: 'Product Lead',
    url: '#',
    isFeatured: true,
    tags: ['MVP', 'No-Code', 'Validation'],
    completedBy: 892,
  },
  {
    id: '3',
    title: 'Growth Marketing Playbook 2024',
    description: 'Latest tactics and case studies from successful B2B SaaS companies achieving product-market fit.',
    type: 'article',
    category: 'Marketing',
    duration: '20 min read',
    difficulty: 'advanced',
    author: 'Maria Santos',
    authorRole: 'Growth Lead',
    url: '#',
    tags: ['Growth', 'B2B', 'SaaS'],
    completedBy: 567,
  },
  {
    id: '4',
    title: 'Sales for Technical Founders',
    description: 'How to sell when you hate selling. Frameworks and scripts that actually work.',
    type: 'video',
    category: 'Sales',
    duration: '1.5 hours',
    difficulty: 'beginner',
    author: 'James Wilson',
    authorRole: 'Sales Coach',
    url: '#',
    tags: ['Sales', 'Founders', 'B2B'],
    completedBy: 734,
  },
  {
    id: '5',
    title: 'Building High-Performance Teams',
    description: 'Leadership principles for scaling from 5 to 50 people without losing culture.',
    type: 'course',
    category: 'Leadership',
    duration: '3 hours',
    difficulty: 'intermediate',
    author: 'David Park',
    authorRole: 'CEO',
    url: '#',
    tags: ['Leadership', 'Culture', 'Hiring'],
    completedBy: 423,
  },
  {
    id: '6',
    title: 'System Design for Startups',
    description: 'Architecture patterns that scale without over-engineering. Real-world examples.',
    type: 'guide',
    category: 'Tech',
    duration: '35 min read',
    difficulty: 'advanced',
    author: 'Lisa Zhang',
    authorRole: 'CTO',
    url: '#',
    tags: ['Architecture', 'Scaling', 'Backend'],
    completedBy: 645,
  },
];

const TYPE_CONFIG = {
  article: { label: 'Article', icon: FileText, color: 'text-blue-500' },
  video: { label: 'Video', icon: Video, color: 'text-purple-500' },
  course: { label: 'Course', icon: BookOpen, color: 'text-emerald-500' },
  guide: { label: 'Guide', icon: Award, color: 'text-amber-500' },
};

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  advanced: { label: 'Advanced', color: 'bg-red-500/20 text-red-700 dark:text-red-400' },
};

function ResourceCard({ resource }: { resource: Resource }) {
  const typeConfig = TYPE_CONFIG[resource.type];
  const difficultyConfig = DIFFICULTY_CONFIG[resource.difficulty];

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/60', typeConfig.color)}>
              <typeConfig.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-semibold text-foreground line-clamp-2 mb-1">
                {resource.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {typeConfig.label}
                </Badge>
                <Badge variant="secondary" className={cn('text-[10px]', difficultyConfig.color)}>
                  {difficultyConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {resource.description}
        </p>

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
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
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-foreground">{resource.author}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{resource.authorRole}</span>
              {resource.duration && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {resource.duration}
                  </div>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(resource.url, '_blank')}
          >
            {resource.type === 'video' || resource.type === 'course' ? (
              <>
                <Play className="h-3 w-3" />
                Watch
              </>
            ) : (
              <>
                <ExternalLink className="h-3 w-3" />
                Read
              </>
            )}
          </Button>
        </div>

        {resource.completedBy && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="h-3 w-3" />
            <span>{resource.completedBy.toLocaleString()} completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = DEMO_RESOURCES.filter((resource) => {
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredResources = filteredResources.filter((r) => r.isFeatured);
  const regularResources = filteredResources.filter((r) => !r.isFeatured);

  return (
    <AppShell
      title="Learning"
      description="Courses, guides, and resources to grow your startup"
    >
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses, guides, topics..."
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

          {/* Featured Resources */}
          {featuredResources.length > 0 && activeTab === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Featured Resources
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* All Resources */}
          {regularResources.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                All Resources
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredResources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No resources found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
