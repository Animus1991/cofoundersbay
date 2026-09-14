'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, LayoutGrid, List, MoreVertical, Star, MessageSquare,
  ExternalLink, ChevronRight, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, CfbGlyphWell, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useToast } from '@/components/ui/toast';
import { bilingualAria } from '@/lib/i18n/format';
import {
  projectEn,
  projectEl,
  useProjectPrimaryText,
  PROJECT_STAGE_KEYS,
  PROJECT_STAGE_FULL_KEYS,
} from '@/lib/i18n/strings-projects';
import { cn } from '@/lib/utils';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import {
  listDemoProjects,
  toggleDemoStar,
  isOwnedProject,
  isJoinedProject,
  demoProjectStats,
  PROJECT_STATUS_GLYPH,
  type DemoProject,
  type ProjectStatus,
} from '@/lib/projects-demo';

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: 'bg-status-accent-bg text-status-accent border-status-accent-border',
  validating: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  building: 'bg-status-info-bg text-status-info border-status-info-border',
  launched: 'bg-status-success-bg text-status-success border-status-success-border',
  scaling: 'bg-status-info-bg text-status-info border-status-info-border',
};

const STAGE_PILLS: { value: string; glyph: CfbGlyphName; labelKey: keyof typeof PROJECT_STAGE_KEYS }[] = [
  { value: 'all', glyph: 'briefcase', labelKey: 'all' },
  { value: 'idea', glyph: 'spark', labelKey: 'idea' },
  { value: 'validating', glyph: 'target', labelKey: 'validating' },
  { value: 'building', glyph: 'builder', labelKey: 'building' },
  { value: 'launched', glyph: 'award', labelKey: 'launched' },
  { value: 'scaling', glyph: 'chart', labelKey: 'scaling' },
];

type TabId = 'discover' | 'mine' | 'joined' | 'starred';

function StageBadge({ status }: { status: ProjectStatus }) {
  const key = PROJECT_STAGE_FULL_KEYS[status];
  return (
    <Badge variant="outline" className={cn('gap-1 rounded-full text-2xs', STATUS_COLOR[status])}>
      <CfbGlyph name={PROJECT_STATUS_GLYPH[status]} className="icon-sm" />
      {key ? <BilingualText en={projectEn(key)} el={projectEl(key)} compact /> : status}
    </Badge>
  );
}

function ProjectCard({
  project,
  viewMode,
  onStar,
  onMessage,
  onShare,
}: {
  project: DemoProject;
  viewMode: 'grid' | 'list';
  onStar: (id: string) => void;
  onMessage: (project: DemoProject) => void;
  onShare: (project: DemoProject) => void;
}) {
  if (viewMode === 'list') {
    return (
      <Card className="rounded-xl border-border/60 transition-colors hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Link href={`/projects/${project.id}`} className="inline-flex tap-target-y items-center font-semibold text-foreground transition-colors hover:text-primary-accessible">
                  {project.name}
                </Link>
                <StageBadge status={project.status} />
                {project.isStarred && <Star className="icon-sm fill-status-warning text-status-warning" />}
              </div>
              <p className="line-clamp-1 text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-6">
              <div className="flex -space-x-2">
                {project.members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary-accessible">
                      {m.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{project.teamSize}</span>/{project.maxTeamSize}
              </div>
              <div className="flex max-w-[200px] flex-wrap gap-1">
                {project.rolesNeeded.slice(0, 2).map((role) => (
                  <Badge key={role.title} variant="secondary" className="rounded-full text-2xs">
                    {role.title}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <Link href={`/projects/${project.id}`}>
                  <BilingualText en={projectEn('view')} el={projectEl('view')} compact />
                  <ChevronRight className="icon-sm ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group rounded-xl border-border/60 transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Link href={`/projects/${project.id}`} className="inline-flex tap-target-y items-center font-semibold text-foreground transition-colors hover:text-primary-accessible">
                {project.name}
              </Link>
              {project.isStarred && <Star className="icon-sm fill-status-warning text-status-warning" />}
            </div>
            <StageBadge status={project.status} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={bilingualAria(projectEn('more'), projectEl('more'))}
              >
                <MoreVertical className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onStar(project.id)}>
                <Star className="icon-sm mr-2" />
                <BilingualText
                  en={project.isStarred ? projectEn('unstar') : projectEn('star')}
                  el={project.isStarred ? projectEl('unstar') : projectEl('star')}
                  compact
                />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMessage(project)}>
                <MessageSquare className="icon-sm mr-2" />
                <BilingualText en={projectEn('message_team')} el={projectEl('message_team')} compact />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onShare(project)}>
                <ExternalLink className="icon-sm mr-2" />
                <BilingualText en={projectEn('share')} el={projectEl('share')} compact />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-2xs">
              {tag}
            </Badge>
          ))}
        </div>

        {project.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-2xs">
              <span className="text-muted-foreground">
                <BilingualText en={projectEn('progress')} el={projectEl('progress')} compact />
              </span>
              <span className="font-medium tabular-nums">{project.progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        )}

        <div className="border-t border-border/60 pt-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CfbGlyph name="people" className="icon-sm" />
              <span>
                <span className="font-medium text-foreground">{project.teamSize}</span>/{project.maxTeamSize}{' '}
                <BilingualText en={projectEn('members')} el={projectEl('members')} compact />
              </span>
            </div>
            {project.messageCount && project.messageCount > 0 && (
              <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                <CfbGlyph name="messages" className="icon-sm" />
                {project.messageCount}
              </div>
            )}
          </div>

          <div className="mb-3 flex -space-x-2">
            {project.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={m.avatar} />
                <AvatarFallback className="bg-primary/10 text-xs text-primary-accessible">
                  {m.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {project.rolesNeeded.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-2xs font-medium text-muted-foreground">
                <BilingualText en={projectEn('looking_for')} el={projectEl('looking_for')} compact />
              </p>
              <div className="flex flex-wrap gap-1">
                {project.rolesNeeded.map((role) => (
                  <Badge key={role.title} variant="outline" className="rounded-full bg-primary/5 text-2xs text-primary-accessible border-primary/20">
                    {role.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button className="w-full rounded-xl" asChild>
          <Link href={`/projects/${project.id}`}>
            <BilingualText en={projectEn('view_project')} el={projectEl('view_project')} compact wrap />
            <ChevronRight className="icon-sm ml-1 shrink-0" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  glyph,
  titleEn,
  titleEl,
  hintEn,
  hintEl,
  action,
}: {
  glyph: CfbGlyphName;
  titleEn: string;
  titleEl: string;
  hintEn: string;
  hintEl: string;
  action: React.ReactNode;
}) {
  return (
    <Card className="rounded-xl border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <CfbGlyphWell name={glyph} size="lg" className="mb-4" />
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          <BilingualText en={titleEn} el={titleEl} />
        </h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          <BilingualText en={hintEn} el={hintEl} />
        </p>
        {action}
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const t = useProjectPrimaryText();
  const { open: openAskAi } = usePopupChat();
  const { success } = useToast();
  const [projects, setProjects] = useState(listDemoProjects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [tab, setTab] = useState<TabId>('discover');

  const stats = demoProjectStats(projects);
  const industries = [...new Set(projects.map((p) => p.industry))];
  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all' || industryFilter !== 'all';

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.industry.toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (industryFilter !== 'all' && p.industry !== industryFilter) return false;
      return true;
    });
  }, [projects, searchQuery, statusFilter, industryFilter]);

  const byTab: Record<TabId, DemoProject[]> = {
    discover: filtered,
    mine: filtered.filter((p) => isOwnedProject(p)),
    joined: filtered.filter((p) => isJoinedProject(p)),
    starred: filtered.filter((p) => p.isStarred),
  };

  const counts = {
    discover: projects.length,
    mine: projects.filter((p) => isOwnedProject(p)).length,
    joined: projects.filter((p) => isJoinedProject(p)).length,
    starred: projects.filter((p) => p.isStarred).length,
  };

  function refresh() {
    setProjects(listDemoProjects());
  }

  function handleStar(id: string) {
    toggleDemoStar(id);
    refresh();
  }

  function handleShare(project: DemoProject) {
    const url = `${window.location.origin}/projects/${project.id}`;
    void navigator.clipboard?.writeText(url);
    success(t(projectEn('share_done'), projectEl('share_done')), t(projectEn('share_hint'), projectEl('share_hint')));
  }

  function clearFilters() {
    setSearchQuery('');
    setStatusFilter('all');
    setIndustryFilter('all');
  }

  function renderList(items: DemoProject[], empty: { glyph: CfbGlyphName; title: 'empty_discover_title' | 'empty_mine_title' | 'empty_joined_title' | 'empty_starred_title'; hint: 'empty_discover_hint' | 'empty_mine_hint' | 'empty_joined_hint' | 'empty_starred_hint'; action: React.ReactNode }) {
    if (items.length === 0) {
      const filteredEmpty = hasActiveFilters;
      return (
        <EmptyState
          glyph={empty.glyph}
          titleEn={projectEn(filteredEmpty ? 'empty_filter_title' : empty.title)}
          titleEl={projectEl(filteredEmpty ? 'empty_filter_title' : empty.title)}
          hintEn={projectEn(filteredEmpty ? 'empty_filter_hint' : empty.hint)}
          hintEl={projectEl(filteredEmpty ? 'empty_filter_hint' : empty.hint)}
          action={
            filteredEmpty ? (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={clearFilters}>
                <BilingualText en={projectEn('clear_filters')} el={projectEl('clear_filters')} compact />
              </Button>
            ) : (
              empty.action
            )
          }
        />
      );
    }
    return (
      <div className={cn(viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3')}>
        {items.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            viewMode={viewMode}
            onStar={handleStar}
            onMessage={(p) => openAskAi(p.founder.id)}
            onShare={handleShare}
          />
        ))}
      </div>
    );
  }

  const createCta = (
    <Button size="sm" className="rounded-xl" asChild>
      <Link href="/projects/create">
        <Plus className="icon-sm mr-1.5" />
        <BilingualText en={projectEn('create')} el={projectEl('create')} compact />
      </Link>
    </Button>
  );

  return (
    <AppShell
      title="Projects"
      description="Discover startup projects or create your own to find co-founders"
      showHelp
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => openAskAi()}>
            <CfbGlyph name="spark" className="icon-sm" />
            <BilingualText en={projectEn('ask_ai')} el={projectEl('ask_ai')} compact />
          </Button>
          {createCta}
        </div>
      }
    >
      <div className="space-y-4">
        <SampleDataNotice
          surface="Projects"
          detail="Listed collaborations on this page are sample records until a projects API exists. Create Project still opens the form. Ask the assistant to find people instead of inventing live project data."
          askAiPrompt="Projects is still sample data. Help me find collaborators from matches and shortlist instead of treating these cards as live."
        />
        <button
          type="button"
          onClick={() => openAskAi()}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <CfbGlyphWell name="spark" size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">
              <BilingualText en={projectEn('ask_ai_plan')} el={projectEl('ask_ai_plan')} stacked />
            </span>
            <span className="block text-2xs text-muted-foreground">
              <BilingualText en={projectEn('ask_ai_hint')} el={projectEl('ask_ai_hint')} />
            </span>
          </span>
        </button>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { labelKey: 'stat_total' as const, value: stats.total, glyph: 'briefcase' as const, color: 'text-status-accent', bg: 'bg-status-accent-bg' },
            { labelKey: 'stat_active' as const, value: stats.active, glyph: 'builder' as const, color: 'text-status-info', bg: 'bg-status-info-bg' },
            { labelKey: 'stat_roles' as const, value: stats.openRoles, glyph: 'people' as const, color: 'text-status-success', bg: 'bg-status-success-bg' },
            { labelKey: 'stat_industries' as const, value: stats.industries, glyph: 'chart' as const, color: 'text-status-warning', bg: 'bg-status-warning-bg' },
          ].map((s) => (
            <Card key={s.labelKey} className="rounded-xl border-border/40">
              <CardContent className="flex items-center gap-3 p-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', s.bg, s.color)}>
                  <CfbGlyph name={s.glyph} className="icon-sm" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-none text-foreground tabular-nums">{s.value}</p>
                  {/* `truncate` on the wrapper *and* a truncating label: at
                      1024px these tiles give the label about 54px and
                      "Active / building · Ενεργά / κατασκευή" needs 97px. */}
                  <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
                    <BilingualText en={projectEn(s.labelKey)} el={projectEl(s.labelKey)} compact wrap />
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="space-y-4">
          <TabsList className="rounded-xl">
            {([
              { id: 'discover', key: 'tab_discover', count: counts.discover },
              { id: 'mine', key: 'tab_mine', count: counts.mine },
              { id: 'joined', key: 'tab_joined', count: counts.joined },
              { id: 'starred', key: 'tab_starred', count: counts.starred },
            ] as const).map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="rounded-xl gap-1.5">
                <BilingualText en={projectEn(item.key)} el={projectEl(item.key)} compact />
                <span className="tabular-nums text-2xs text-muted-foreground">{item.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(projectEn('search_ph'), projectEl('search_ph'))}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl pl-9"
                aria-label={bilingualAria(projectEn('search_ph'), projectEl('search_ph'))}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="icon-sm" />
                </button>
              )}
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder={t(projectEn('industry'), projectEl('industry'))} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{t(projectEn('all_industries'), projectEl('all_industries'))}</SelectItem>
                {industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-xl border border-border p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-xl"
                onClick={() => setViewMode('grid')}
                aria-label={bilingualAria(projectEn('view_grid'), projectEl('view_grid'))}
              >
                <LayoutGrid className="icon-sm" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-xl"
                onClick={() => setViewMode('list')}
                aria-label={bilingualAria(projectEn('view_list'), projectEl('view_list'))}
              >
                <List className="icon-sm" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {STAGE_PILLS.map((pill) => {
              const isActive = statusFilter === pill.value;
              const labelKey = PROJECT_STAGE_KEYS[pill.labelKey];
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setStatusFilter(pill.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border/60 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  <CfbGlyph name={pill.glyph} className="icon-sm" />
                  {labelKey ? <BilingualText en={projectEn(labelKey)} el={projectEl(labelKey)} compact /> : pill.value}
                </button>
              );
            })}
          </div>

          {byTab[tab].length > 0 && (
            <p className="text-2xs text-muted-foreground">
              {byTab[tab].length}{' '}
              {byTab[tab].length === 1
                ? <BilingualText en={projectEn('found_one')} el={projectEl('found_one')} compact />
                : <BilingualText en={projectEn('found')} el={projectEl('found')} compact />}
            </p>
          )}

          <TabsContent value="discover" className="space-y-4">
            {renderList(byTab.discover, {
              glyph: 'briefcase',
              title: 'empty_discover_title',
              hint: 'empty_discover_hint',
              action: createCta,
            })}
          </TabsContent>
          <TabsContent value="mine" className="space-y-4">
            {renderList(byTab.mine, {
              glyph: 'briefcase',
              title: 'empty_mine_title',
              hint: 'empty_mine_hint',
              action: createCta,
            })}
          </TabsContent>
          <TabsContent value="joined" className="space-y-4">
            {renderList(byTab.joined, {
              glyph: 'people',
              title: 'empty_joined_title',
              hint: 'empty_joined_hint',
              action: (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTab('discover')}>
                  <BilingualText en={projectEn('browse')} el={projectEl('browse')} compact />
                </Button>
              ),
            })}
          </TabsContent>
          <TabsContent value="starred" className="space-y-4">
            {renderList(byTab.starred, {
              glyph: 'bookmark',
              title: 'empty_starred_title',
              hint: 'empty_starred_hint',
              action: (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTab('discover')}>
                  <BilingualText en={projectEn('browse')} el={projectEl('browse')} compact />
                </Button>
              ),
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
