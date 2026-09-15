'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Video, FileText, Award, Clock, TrendingUp, Play, ExternalLink, Sparkles, Flame, Bookmark, CheckCircle2, ChevronRight, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { BilingualText } from '@/components/common/BilingualText';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMeProfile, listLearningResources, getLearningCategories, type LearningResourceItem } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { learningEn, learningEl } from '@/lib/i18n/strings-learning';
import { bilingualInline } from '@/lib/i18n/format';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';

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
  { key: 'all', labelKey: 'type_all' as const },
  { key: 'course', labelKey: 'type_course' as const },
  { key: 'guide', labelKey: 'type_guide' as const },
  { key: 'video', labelKey: 'type_video' as const },
  { key: 'article', labelKey: 'type_article' as const },
] as const;
type TypeFilterKey = typeof TYPE_FILTERS[number]['key'];

interface LearningPath {
  id: string;
  titleKey: 'path_fast_title' | 'path_fund_title' | 'path_growth_title' | 'path_team_title';
  descKey: 'path_fast_desc' | 'path_fund_desc' | 'path_growth_desc' | 'path_team_desc';
  category: string;
  steps: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  color: string;
  glyph: CfbGlyphName;
}

const LEARNING_PATHS: LearningPath[] = [
  { id: 'lp1', titleKey: 'path_fast_title', descKey: 'path_fast_desc', category: 'Product', steps: 8, duration: '12 hours', level: 'beginner', progress: 0, color: 'bg-status-accent-bg border-status-accent-border', glyph: 'spark' },
  { id: 'lp2', titleKey: 'path_fund_title', descKey: 'path_fund_desc', category: 'Fundraising', steps: 6, duration: '9 hours', level: 'intermediate', progress: 33, color: 'bg-status-success-bg border-status-success-border', glyph: 'wallet' },
  { id: 'lp3', titleKey: 'path_growth_title', descKey: 'path_growth_desc', category: 'Marketing', steps: 5, duration: '7 hours', level: 'intermediate', progress: 60, color: 'bg-status-warning-bg border-status-warning-border', glyph: 'chart' },
  { id: 'lp4', titleKey: 'path_team_title', descKey: 'path_team_desc', category: 'Leadership', steps: 4, duration: '5 hours', level: 'advanced', progress: 0, color: 'bg-status-info-bg border-status-info-border', glyph: 'people' },
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
  article: { labelKey: 'type_article' as const, icon: FileText, color: 'text-status-info', bg: 'bg-status-info-bg' },
  video:   { labelKey: 'type_video' as const,   icon: Video,    color: 'text-status-accent', bg: 'bg-status-accent-bg' },
  course:  { labelKey: 'type_course' as const,  icon: BookOpen, color: 'text-status-success', bg: 'bg-status-success-bg' },
  guide:   { labelKey: 'type_guide' as const,   icon: Award,    color: 'text-status-warning', bg: 'bg-status-warning-bg' },
};

const DIFFICULTY_CONFIG = {
  beginner: { labelKey: 'difficulty_beginner' as const, color: 'bg-status-success-bg text-status-success ' },
  intermediate: { labelKey: 'difficulty_intermediate' as const, color: 'bg-status-warning-bg text-status-warning ' },
  advanced: { labelKey: 'difficulty_advanced' as const, color: 'bg-status-danger-bg text-status-danger ' },
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
            <typeConfig.icon className="icon-md" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1.5 leading-snug">
              {resource.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={cn('text-2xs h-4 px-1.5 border-0', typeConfig.bg, typeConfig.color)}>
                <BilingualText en={learningEn(typeConfig.labelKey)} el={learningEl(typeConfig.labelKey)} compact />
              </Badge>
              <Badge variant="secondary" className={cn('text-2xs h-4 px-1.5', difficultyConfig.color)}>
                <BilingualText en={learningEn(difficultyConfig.labelKey)} el={learningEl(difficultyConfig.labelKey)} compact />
              </Badge>
              {resource.isFeatured && (
                <Badge variant="secondary" className="text-2xs h-4 px-1.5 bg-primary/10 text-primary-accessible">
                  <BilingualText en={learningEn('featured_badge')} el={learningEl('featured_badge')} compact />
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            // WCAG 2.5.8 wants 24x24 CSS px. The icon stays 16px; the negative margin cancels the extra 8px so nothing moves, only the hit area grows.
            className={cn(
              'shrink-0 -m-1 mt-0.5 inline-flex tap-target items-center justify-center transition-colors',
              saved ? 'text-primary-accessible' : 'text-muted-foreground/40 hover:text-muted-foreground',
            )}
          >
            <Bookmark className={cn('icon-sm', saved && 'fill-current')} />
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
                <span className="flex items-center gap-0.5"><Clock className="icon-sm" />{resource.duration}</span>
              )}
              {resource.completedBy && (
                <span className="flex items-center gap-0.5"><CheckCircle2 className="icon-sm text-status-success" />{resource.completedBy.toLocaleString('en-GB')}</span>
              )}
            </div>
          </div>
          <Button variant="default" size="sm" className="gap-1 h-7 text-xs shrink-0" onClick={() => window.open(resource.url, '_blank')}>
            {resource.type === 'video' || resource.type === 'course' ? (
              <><Play className="icon-sm" /><BilingualText en={learningEn('start')} el={learningEl('start')} compact /></>
            ) : (
              <><ExternalLink className="icon-sm" /><BilingualText en={learningEn('open')} el={learningEl('open')} compact /></>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LearningPathCard({ path, onSelect }: { path: LearningPath; onSelect: (category: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(path.category)}
      className={cn('relative rounded-xl border p-4 text-left transition-all hover:shadow-md', path.color)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-background/60')}>
          <CfbGlyph name={path.glyph} className="icon-md text-foreground" />
        </div>
        {path.progress > 0 && (
          <Badge variant="secondary" className="text-2xs bg-background/60">
            {learningEn('percent_done').replace('{n}', String(path.progress))}
          </Badge>
        )}
      </div>
      <h3 className="font-semibold text-sm text-foreground mb-1">
        <BilingualText en={learningEn(path.titleKey)} el={learningEl(path.titleKey)} compact />
      </h3>
      <p className="text-2xs text-muted-foreground line-clamp-2 mb-3">
        <BilingualText en={learningEn(path.descKey)} el={learningEl(path.descKey)} compact />
      </p>
      <div className="flex items-center gap-3 text-2xs text-muted-foreground mb-2">
        <span className="flex items-center gap-0.5">
          <BookOpen className="icon-sm" />
          {learningEn('modules').replace('{n}', String(path.steps))}
        </span>
        <span className="flex items-center gap-0.5"><Clock className="icon-sm" />{path.duration}</span>
      </div>
      {path.progress > 0 && <Progress value={path.progress} className="h-1.5" />}
      <div className="mt-2 flex items-center gap-1 text-2xs font-medium text-primary-accessible">
        {path.progress > 0
          ? <BilingualText en={learningEn('continue_path')} el={learningEl('continue_path')} compact />
          : <BilingualText en={learningEn('start_path')} el={learningEl('start_path')} compact />}
        <ChevronRight className="icon-sm" />
      </div>
    </button>
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
    queryKey: queryKeys.me.profile(),
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
    const matchesPath = selectedCategory === 'All' || r.category === selectedCategory;
    return (matchesRole || matchesSkill) && matchesPath;
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
    <AppShell showHelp askAi="Which readiness gap should I study first, and which learning path or resource matches it?">
      <div className="space-y-6 pb-10">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { labelKey: 'stat_resources' as const, value: totalResourceCount, icon: BookOpen, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
          { labelKey: 'stat_courses' as const, value: courseCount, icon: Play, color: 'text-status-success', bg: 'bg-status-success-bg' },
          { labelKey: 'stat_hours' as const, value: `${totalHours}h`, icon: Clock, color: 'text-status-info', bg: 'bg-status-info-bg' },
          { labelKey: 'stat_progress' as const, value: inProgressPaths.length, icon: Flame, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
        ].map((s) => {
          const SIcon = s.icon;
          return (
            <Card key={s.labelKey} className="shadow-sm border-border/50">
              <CardContent className="flex items-center gap-2.5 p-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', s.bg, s.color)}>
                  <SIcon className="icon-sm" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{s.value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">
                    <BilingualText en={learningEn(s.labelKey)} el={learningEl(s.labelKey)} compact />
                  </p>
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
              <Target className="icon-sm text-primary-accessible" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <BilingualText en={learningEn('paths')} el={learningEl('paths')} compact />
              </h2>
            </div>
            {/* "View all" had nothing to reveal — the grid below already
                renders every path. A count says something true in the space
                the promise was occupying. */}
            <span className="text-xs tabular-nums text-muted-foreground">
              {LEARNING_PATHS.length}{' '}
              <BilingualText en="paths" el="μονοπάτια" compact />
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LEARNING_PATHS.map((path) => (
              <LearningPathCard
                key={path.id}
                path={path}
                onSelect={(category) => {
                  setSelectedCategory(category);
                  setActiveTab('all');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended for you */}
      {recommendedResources.length > 0 && activeTab === 'all' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="icon-sm text-primary-accessible" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BilingualText en={learningEn('recommended')} el={learningEl('recommended')} compact />
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
          <TabsTrigger value="all">
            <BilingualText en={learningEn('tab_all')} el={learningEl('tab_all')} compact />
          </TabsTrigger>
          <TabsTrigger value="saved">
            <BilingualText en={learningEn('tab_saved')} el={learningEl('tab_saved')} compact />
          </TabsTrigger>
          <TabsTrigger value="completed">
            <BilingualText en={learningEn('tab_completed')} el={learningEl('tab_completed')} compact />
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={bilingualInline(learningEn('search'), learningEl('search'))}
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
                      ? 'border-primary bg-primary/20 text-primary-accessible'
                      : 'border-border/60 text-muted-foreground hover:border-primary/40',
                  )}
                >{<BilingualText en={learningEn(tf.labelKey)} el={learningEl(tf.labelKey)} compact />}</button>
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
                      ? 'border-primary bg-primary/20 text-primary-accessible'
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
                <TrendingUp className="icon-sm text-primary-accessible" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <BilingualText en={learningEn('featured')} el={learningEl('featured')} compact />
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
                <BilingualText en={learningEn('all_resources')} el={learningEl('all_resources')} compact />
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
              <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground">
                <BilingualText en={learningEn('empty')} el={learningEl('empty')} compact />
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <BilingualText en={learningEn('empty_hint')} el={learningEl('empty_hint')} compact />
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  );
}
