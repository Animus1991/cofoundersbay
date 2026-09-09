'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Video, FileText, Award, Clock, TrendingUp, Play, ExternalLink, Sparkles, Flame, Bookmark, CheckCircle2, ChevronRight, Target, Users, BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMeProfile, listLearningResources, getLearningCategories, type LearningResourceItem } from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'course', label: 'Courses' },
  { key: 'guide', label: 'Guides' },
  { key: 'video', label: 'Videos' },
  { key: 'article', label: 'Articles' },
] as const;
type TypeFilterKey = typeof TYPE_FILTERS[number]['key'];

interface LearningPath {
  id: string;
  title: string;
  description: string;
  steps: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  progress: number; // 0-100
  color: string;
  icon: React.ElementType;
}

const LEARNING_PATHS: LearningPath[] = [
  { id: 'lp1', title: 'Founder Fast Track', description: 'Go from idea to funded startup in structured steps', steps: 8, duration: '12 hours', level: 'beginner', progress: 0, color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30', icon: Target },
  { id: 'lp2', title: 'Fundraising Mastery', description: 'Seed to Series A — pitching, term sheets, VC psychology', steps: 6, duration: '9 hours', level: 'intermediate', progress: 33, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30', icon: TrendingUp },
  { id: 'lp3', title: 'Growth Playbook', description: 'Proven frameworks for user acquisition and retention', steps: 5, duration: '7 hours', level: 'intermediate', progress: 60, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30', icon: BarChart3 },
  { id: 'lp4', title: 'Team & Culture Builder', description: 'Hire, retain, and lead high-performance startup teams', steps: 4, duration: '5 hours', level: 'advanced', progress: 0, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', icon: Users },
];

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
  article: { label: 'Article', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  video:   { label: 'Video',   icon: Video,    color: 'text-purple-500', bg: 'bg-purple-500/10' },
  course:  { label: 'Course',  icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  guide:   { label: 'Guide',   icon: Award,    color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  advanced: { label: 'Advanced', color: 'bg-red-500/20 text-red-700 dark:text-red-400' },
};

function ResourceCard({ resource }: { resource: Resource }) {
  const typeConfig = TYPE_CONFIG[resource.type] ?? TYPE_CONFIG.article;
  const difficultyConfig = DIFFICULTY_CONFIG[resource.difficulty] ?? DIFFICULTY_CONFIG.beginner;
  const [saved, setSaved] = React.useState(false);

  return (
    <Card className="card-interactive hover-lift group transition-all duration-300 hover:border-primary/30 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1 gap-3">
        {/* Type icon + title */}
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', typeConfig.bg, typeConfig.color)}>
            <typeConfig.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1.5 leading-snug">
              {resource.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={cn('text-2xs h-4 px-1.5 border-0', typeConfig.bg, typeConfig.color)}>
                {typeConfig.label}
              </Badge>
              <Badge variant="secondary" className={cn('text-2xs h-4 px-1.5', difficultyConfig.color)}>
                {difficultyConfig.label}
              </Badge>
              {resource.isFeatured && (
                <Badge variant="secondary" className="text-2xs h-4 px-1.5 bg-primary/10 text-primary-emphasis">
                  Featured
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className={cn('shrink-0 mt-0.5 transition-colors', saved ? 'text-primary-emphasis' : 'text-muted-foreground/40 hover:text-muted-foreground')}
          >
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {resource.description}
        </p>

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-secondary/60 px-2 py-0.5 text-2xs text-secondary-foreground">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{resource.author}</p>
            <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
              {resource.duration && (
                <span className="flex items-center gap-0.5"><Clock className="icon-2xs" aria-hidden="true" />{resource.duration}</span>
              )}
              {resource.completedBy && (
                <span className="flex items-center gap-0.5"><CheckCircle2 className="icon-2xs text-emerald-500" aria-hidden="true" />{resource.completedBy.toLocaleString()}</span>
              )}
            </div>
          </div>
          <Button variant="default" size="sm" className="gap-1 h-7 text-xs shrink-0" onClick={() => window.open(resource.url, '_blank')}>
            {resource.type === 'video' || resource.type === 'course' ? (
              <><Play className="icon-2xs" aria-hidden="true" />Start</>
            ) : (
              <><ExternalLink className="icon-2xs" aria-hidden="true" />Open</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LearningPathCard({ path }: { path: LearningPath }) {
  const Icon = path.icon;
  return (
    <div className={cn('relative rounded-xl border bg-gradient-to-br p-4 transition-all hover:shadow-md cursor-pointer', path.color)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-background/60')}>
          <Icon className="h-4.5 w-4.5 text-foreground" />
        </div>
        {path.progress > 0 && (
          <Badge variant="secondary" className="text-2xs bg-background/60">{path.progress}% done</Badge>
        )}
      </div>
      <h3 className="font-semibold text-sm text-foreground mb-1">{path.title}</h3>
      <p className="text-2xs text-muted-foreground line-clamp-2 mb-3">{path.description}</p>
      <div className="flex items-center gap-3 text-2xs text-muted-foreground mb-2">
        <span className="flex items-center gap-0.5"><BookOpen className="icon-2xs" aria-hidden="true" />{path.steps} modules</span>
        <span className="flex items-center gap-0.5"><Clock className="icon-2xs" aria-hidden="true" />{path.duration}</span>
      </div>
      {path.progress > 0 && <Progress value={path.progress} className="h-1.5" />}
      <div className="mt-2 flex items-center gap-1 text-2xs font-medium text-primary-emphasis">
        {path.progress > 0 ? 'Continue path' : 'Start path'}
        <ChevronRight className="icon-2xs" aria-hidden="true" />
      </div>
    </div>
  );
}

const ROLE_CATEGORY_MAP: Record<string, string[]> = {
  founder: ['Fundraising', 'Product', 'Marketing', 'Sales', 'Leadership'],
  mentor: ['Leadership', 'Product', 'Sales'],
  investor: ['Fundraising', 'Leadership', 'Marketing'],
  org: ['Leadership', 'Marketing', 'Sales'],
};

// Map backend LearningResourceItem to local Resource shape
function backendToResource(r: LearningResourceItem): Resource {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    type: (r.type as Resource['type']) ?? 'article',
    category: r.category ?? 'General',
    duration: r.duration != null ? `${r.duration} min` : undefined,
    difficulty: (r.difficulty as Resource['difficulty']) ?? 'beginner',
    author: r.author ?? 'CoFounderBay',
    authorRole: '',
    url: r.url,
    isFeatured: r.isFeatured,
    tags: r.tags ?? [],
    completedBy: undefined,
  };
}

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: meData } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: getMeProfile,
    staleTime: 5 * 60_000,
  });

  // Fetch from real backend; fall back to DEMO_RESOURCES if empty (new installation)
  const { data: learningData, isLoading: learningLoading } = useQuery({
    queryKey: ['learning', selectedCategory !== 'All' ? selectedCategory : undefined, searchQuery || undefined],
    queryFn: () => listLearningResources({
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      search: searchQuery.trim() || undefined,
      limit: 50,
    }),
    staleTime: 5 * 60_000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['learning-categories'],
    queryFn: getLearningCategories,
    staleTime: 60 * 60_000,
  });

  // Dynamic category list from backend (fallback to hardcoded CATEGORIES)
  const allCategories = categoriesData?.categories?.length
    ? ['All', ...categoriesData.categories]
    : CATEGORIES;

  // Use backend data if available, fall back to DEMO_RESOURCES
  const allResources: Resource[] = learningData?.resources?.length
    ? learningData.resources.map(backendToResource)
    : DEMO_RESOURCES;

  const userRole = meData?.profile?.role ?? 'founder';
  const userSkills = meData?.profile?.skills?.map((s) => s.skillName.toLowerCase()) ?? [];

  const recommendedResources = allResources.filter((r) => {
    const roleCategories = ROLE_CATEGORY_MAP[userRole] ?? [];
    const matchesRole = roleCategories.includes(r.category);
    const matchesSkill = userSkills.some((skill) =>
      r.tags.some((tag) => tag.toLowerCase().includes(skill) || skill.includes(tag.toLowerCase()))
    );
    return matchesRole || matchesSkill;
  }).slice(0, 4);

  // If backend is handling filtering, skip client-side filter; otherwise apply client-side
  const filteredResources = (learningData?.resources?.length ? allResources : allResources).filter((resource) => {
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesType = typeFilter === 'all' || resource.type === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesType && matchesSearch;
  });

  const featuredResources = filteredResources.filter((r) => r.isFeatured);
  const regularResources = filteredResources.filter((r) => !r.isFeatured);

  const inProgressPaths = LEARNING_PATHS.filter((p) => p.progress > 0 && p.progress < 100);
  const totalResourceCount = allResources.length;
  const courseCount = allResources.filter((r) => r.type === 'course').length;
  const totalHours = Math.round(allResources.reduce((acc, r) => {
    const match = r.duration?.match(/(\d+\.?\d*)/);
    return acc + (match ? parseFloat(match[1]) : 0);
  }, 0));

  return (
    <AppShell
      title="Learning Hub"
      description="Courses, guides, and resources to grow your startup"
    >
      <div className="space-y-6 pb-10">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Resources', value: totalResourceCount, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Courses', value: courseCount, icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Hours', value: `${totalHours}h`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'In Progress', value: inProgressPaths.length, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((s) => {
          const SIcon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm border-border/50">
              <CardContent className="flex items-center gap-2.5 p-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                  <SIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Learning Paths */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="icon-sm text-primary-emphasis" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Learning Paths</h2>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
              View all <ChevronRight className="icon-2xs" aria-hidden="true" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LEARNING_PATHS.map((path) => <LearningPathCard key={path.id} path={path} />)}
          </div>
        </div>
      )}

      {/* Recommended for you */}
      {recommendedResources.length > 0 && activeTab === 'all' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="icon-sm text-primary-emphasis" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended for you
            </h2>
            <Badge variant="secondary" className="text-2xs capitalize">{userRole}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedResources.map((resource) => (
              <ResourceCard key={`rec-${resource.id}`} resource={resource} />
            ))}
          </div>
        </div>
      )}

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
              <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search courses, guides, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TYPE_FILTERS.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTypeFilter(tf.key)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                    typeFilter === tf.key
                      ? 'border-primary bg-primary/20 text-primary-emphasis'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >{tf.label}</button>
              ))}
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                    selectedCategory === category
                      ? 'border-primary bg-primary/20 text-primary-emphasis'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {learningLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Featured Resources */}
          {!learningLoading && featuredResources.length > 0 && activeTab === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="icon-sm text-primary-emphasis" aria-hidden="true" />
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
          {!learningLoading && regularResources.length > 0 && (
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
          {!learningLoading && filteredResources.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/30" aria-hidden="true" />
              <p className="font-medium text-foreground">No resources found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  );
}
