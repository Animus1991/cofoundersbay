'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MoreVertical, Star, Share2, MessageSquare,
  Edit, Trash2, CheckCircle2, Circle, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppShell } from '@/components/layout/AppShell';
import { RoleBadge } from '@/components/common/RoleBadge';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useToast } from '@/components/ui/toast';
import { useConfirm, deleteConfirmCopy } from '@/components/ui/confirm-dialog';
import { bilingualAria, formatShortDate } from '@/lib/i18n/format';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import {
  projectEn,
  projectEl,
  useProjectPrimaryText,
  PROJECT_STAGE_FULL_KEYS,
} from '@/lib/i18n/strings-projects';
import { cn } from '@/lib/utils';
import { usePageControls } from '@/lib/page-controls';
import {
  getDemoProject,
  toggleDemoStar,
  deleteDemoProject,
  PROJECT_STATUS_GLYPH,
  type ProjectStatus,
} from '@/lib/projects-demo';

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: 'bg-status-accent-bg text-status-accent border-status-accent-border',
  validating: 'bg-status-warning-bg text-status-warning border-status-warning-border',
  building: 'bg-status-info-bg text-status-info border-status-info-border',
  launched: 'bg-status-success-bg text-status-success border-status-success-border',
  scaling: 'bg-status-info-bg text-status-info border-status-info-border',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { primary } = useLanguagePreference();
  const t = useProjectPrimaryText();
  const { open: openAskAi } = usePopupChat();
  const { success } = useToast();
  const confirm = useConfirm();
  const projectId = String(params?.projectId ?? '');
  const project = useMemo(() => getDemoProject(projectId), [projectId]);
  const [starred, setStarred] = useState(() => getDemoProject(projectId)?.isStarred ?? false);

  function handleShare() {
    if (!project) return;
    const url = `${window.location.origin}/projects/${project.id}`;
    void navigator.clipboard?.writeText(url);
    success(t(projectEn('share_done'), projectEl('share_done')), t(projectEn('share_hint'), projectEl('share_hint')));
  }

  async function handleDelete() {
    if (!project) return;
    if (await confirm(deleteConfirmCopy({ en: 'project', el: 'έργου' }, project.name))) {
      deleteDemoProject(project.id);
      success(t(projectEn('deleted'), projectEl('deleted')), project.name);
      router.push('/projects');
    }
  }

  // Offered to the assistant, above the missing-project return: the header's
  // star, share and delete (which asks). Projects are kept in this browser
  // until a projects API exists, so each writes there.
  const missingEn = project ? undefined : 'This project was not found.';
  const missingEl = project ? undefined : 'Το έργο δεν βρέθηκε.';
  usePageControls([
    { id: 'star_project', labelEn: 'Star this project', labelEl: 'Αστέρι σε αυτό το έργο', writes: true, unavailableEn: missingEn ?? (starred ? 'It is already starred.' : undefined), unavailableEl: missingEl ?? (starred ? 'Έχει ήδη αστέρι.' : undefined), undo: () => ({ control: 'unstar_project' }), run: () => { if (project) setStarred(toggleDemoStar(project.id)); } },
    { id: 'unstar_project', labelEn: 'Unstar this project', labelEl: 'Αφαίρεση αστεριού από το έργο', writes: true, unavailableEn: missingEn ?? (starred ? undefined : 'It is not starred.'), unavailableEl: missingEl ?? (starred ? undefined : 'Δεν έχει αστέρι.'), undo: () => ({ control: 'star_project' }), run: () => { if (project) setStarred(toggleDemoStar(project.id)); } },
    { id: 'share_project', labelEn: 'Copy a link to this project', labelEl: 'Αντιγραφή συνδέσμου του έργου', writes: false, unavailableEn: missingEn, unavailableEl: missingEl, run: handleShare },
    { id: 'delete_project', labelEn: 'Delete this project', labelEl: 'Διαγραφή του έργου', writes: true, unavailableEn: missingEn, unavailableEl: missingEl, run: () => void handleDelete() },
  ]);

  if (!project) {
    return (
      <AppShell showHelp>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
          <CfbGlyph name="briefcase" className="icon-lg text-muted-foreground/50" />
          <div>
            <p className="font-medium text-foreground">
              <BilingualText en={projectEn('missing_title')} el={projectEl('missing_title')} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <BilingualText en={projectEn('missing_hint')} el={projectEl('missing_hint')} />
            </p>
          </div>
          <Button className="rounded-xl" asChild>
            <Link href="/projects">
              <BilingualText en={projectEn('back_projects')} el={projectEl('back_projects')} compact />
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const current = project;
  const stageKey = PROJECT_STAGE_FULL_KEYS[current.status];


  return (
    <AppShell
      showHelp
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => openAskAi()}>
            <CfbGlyph name="spark" className="icon-sm" />
            <BilingualText en={projectEn('ask_ai')} el={projectEl('ask_ai')} compact />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => {
              setStarred(toggleDemoStar(project.id));
            }}
            aria-label={bilingualAria(
              starred ? projectEn('unstar') : projectEn('star'),
              starred ? projectEl('unstar') : projectEl('star'),
            )}
          >
            <Star className={cn('icon-md', starred && 'fill-status-warning text-status-warning')} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={handleShare} aria-label={bilingualAria(projectEn('share'), projectEl('share'))}>
            <Share2 className="icon-md" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl" aria-label={bilingualAria(projectEn('more'), projectEl('more'))}>
                <MoreVertical className="icon-md" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => openAskAi()}>
                <Edit className="icon-sm mr-2" />
                <BilingualText en={projectEn('edit')} el={projectEl('edit')} compact />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <CfbGlyph name="discover" className="icon-sm mr-2" />
                  <BilingualText en={projectEn('public_page')} el={projectEl('public_page')} compact />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive-accessible" onClick={() => void handleDelete()}>
                <Trash2 className="icon-sm mr-2" />
                <BilingualText en={projectEn('delete')} el={projectEl('delete')} compact />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 rounded-xl"
            onClick={() => router.push('/projects')}
            aria-label={bilingualAria(projectEn('back_projects'), projectEl('back_projects'))}
          >
            <ArrowLeft className="icon-md" />
          </Button>
          <CfbGlyph name="briefcase" className="mt-2 icon-md shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
              <Badge variant="outline" className={cn('gap-1 rounded-full text-2xs', STATUS_COLOR[project.status])}>
                <CfbGlyph name={PROJECT_STATUS_GLYPH[project.status]} className="icon-sm" />
                {stageKey ? <BilingualText en={projectEn(stageKey)} el={projectEl(stageKey)} compact /> : project.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {project.taglineEl
                ? <BilingualText en={project.tagline} el={project.taglineEl} wrap />
                : project.tagline}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="rounded-xl">
                <TabsTrigger value="overview" className="rounded-xl"><BilingualText en={projectEn('tab_overview')} el={projectEl('tab_overview')} compact /></TabsTrigger>
                <TabsTrigger value="team" className="rounded-xl"><BilingualText en={projectEn('tab_team')} el={projectEl('tab_team')} compact /></TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-xl"><BilingualText en={projectEn('tab_milestones')} el={projectEl('tab_milestones')} compact /></TabsTrigger>
                <TabsTrigger value="updates" className="rounded-xl"><BilingualText en={projectEn('tab_updates')} el={projectEl('tab_updates')} compact /></TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-base"><BilingualText en={projectEn('about')} el={projectEl('about')} compact /></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {/* Seed projects carry a Greek translation with the same
                          paragraph structure; pair paragraphs by index. User
                          projects have no `descriptionEl` and render as typed. */}
                      {(() => {
                        const elParas = project.descriptionEl?.split('\n\n') ?? [];
                        return project.description.split('\n\n').map((p, i) => (
                          <p key={i} className="text-muted-foreground">
                            {elParas[i] ? <BilingualText en={p} el={elParas[i]} wrap /> : p}
                          </p>
                        ));
                      })()}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base"><BilingualText en={projectEn('open_roles')} el={projectEl('open_roles')} compact /></CardTitle>
                    <Badge variant="outline" className="rounded-full">
                      {project.rolesNeeded.length} <BilingualText en={projectEn('positions')} el={projectEl('positions')} compact />
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.rolesNeeded.map((role) => (
                      <div key={role.title} className="rounded-xl border border-border/60 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-foreground">{role.title}</h4>
                            {role.description ? <p className="text-sm text-muted-foreground">{role.description}</p> : null}
                          </div>
                          <Button
                            size="sm"
                            className="rounded-xl"
                            onClick={() => success(
                              t(projectEn('applied'), projectEl('applied')),
                              t(projectEn('applied_hint'), projectEl('applied_hint')),
                            )}
                          >
                            <BilingualText en={projectEn('apply')} el={projectEl('apply')} compact />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {role.commitment ? (
                            <span className="flex items-center gap-1">
                              <CfbGlyph name="briefcase" className="icon-sm" />
                              {role.commitment}
                            </span>
                          ) : null}
                          {role.equity ? (
                            <span className="flex items-center gap-1">
                              <CfbGlyph name="chart" className="icon-sm" />
                              {role.equity} <BilingualText en={projectEn('equity')} el={projectEl('equity')} compact />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card className="rounded-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base"><BilingualText en={projectEn('team_members')} el={projectEl('team_members')} compact /></CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {project.teamSize}/{project.maxTeamSize} <BilingualText en={projectEn('members')} el={projectEl('members')} compact />
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary-accessible">
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link href={`/profiles/${member.id}`} className="font-medium text-foreground transition-colors hover:text-primary-accessible">
                            {member.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => openAskAi(member.id)} aria-label={bilingualAria(`Message ${member.name}`, `Μήνυμα προς ${member.name}`)}>
                            <MessageSquare className="icon-sm" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" asChild aria-label={bilingualAria(`Schedule a call with ${member.name}`, `Προγραμματισμός κλήσης με ${member.name}`)}>
                            <Link href="/calendar">
                              <Video className="icon-sm" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="space-y-4">
                <Card className="rounded-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base"><BilingualText en={projectEn('milestones')} el={projectEl('milestones')} compact /></CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {project.progress ?? 0}% <BilingualText en={projectEn('complete_pct')} el={projectEl('complete_pct')} compact />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <Progress value={project.progress ?? 0} className="mb-6 h-2" />
                    <div className="space-y-4">
                      {project.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start gap-4">
                          <div className={cn(
                            'mt-0.5 rounded-full p-1',
                            milestone.status === 'completed' && 'bg-status-success-bg text-status-success',
                            milestone.status === 'in_progress' && 'bg-status-info-bg text-status-info',
                            milestone.status === 'pending' && 'bg-muted text-muted-foreground',
                          )}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle2 className="icon-sm" />
                            ) : milestone.status === 'in_progress' ? (
                              <CfbGlyph name="flag" className="icon-sm" />
                            ) : (
                              <Circle className="icon-sm" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className={cn('font-medium', milestone.status === 'completed' && 'text-muted-foreground line-through')}>
                                {milestone.title}
                              </h4>
                              <span className="text-sm text-muted-foreground">
                                {formatShortDate(milestone.date, primary) || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates" className="space-y-4">
                <Card className="rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-base"><BilingualText en={projectEn('updates')} el={projectEl('updates')} compact /></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.updates.map((update) => (
                      <div key={update.id} className="border-l-2 border-primary/30 py-2 pl-4">
                        <p className="text-foreground">{update.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{update.author}</span>
                          <span>•</span>
                          <span>{formatShortDate(update.date, primary) || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="rounded-xl">
              <CardContent className="space-y-3 p-4">
                <Button
                  className="w-full gap-2 rounded-xl"
                  onClick={() => success(
                    t(projectEn('requested'), projectEl('requested')),
                    t(projectEn('requested_hint'), projectEl('requested_hint')),
                  )}
                >
                  <CfbGlyph name="people" className="icon-sm" />
                  <BilingualText en={projectEn('request_join')} el={projectEl('request_join')} compact />
                </Button>
                <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => openAskAi(project.founder.id)}>
                  <CfbGlyph name="messages" className="icon-sm" />
                  <BilingualText en={projectEn('message_team')} el={projectEl('message_team')} compact />
                </Button>
                <Button variant="outline" className="w-full gap-2 rounded-xl" asChild>
                  <Link href="/calendar">
                    <CfbGlyph name="calendar" className="icon-sm" />
                    <BilingualText en={projectEn('schedule_call')} el={projectEl('schedule_call')} compact />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base"><BilingualText en={projectEn('project_info')} el={projectEl('project_info')} compact /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  { glyph: 'briefcase' as const, label: 'info_stage' as const, value: project.stage },
                  { glyph: 'target' as const, label: 'info_industry' as const, value: project.industry },
                  { glyph: 'building' as const, label: 'info_location' as const, value: project.location },
                ]).map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                      <CfbGlyph name={row.glyph} className="icon-sm text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xs text-muted-foreground">
                        <BilingualText en={projectEn(row.label)} el={projectEl(row.label)} compact />
                      </p>
                      <p className="text-sm font-medium">{row.value || '—'}</p>
                    </div>
                  </div>
                ))}
                {project.website ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                      <CfbGlyph name="discover" className="icon-sm text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xs text-muted-foreground">
                        <BilingualText en={projectEn('info_website')} el={projectEl('info_website')} compact />
                      </p>
                      <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-accessible hover:underline">
                        {project.website.replace('https://', '')}
                      </a>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                    <CfbGlyph name="calendar" className="icon-sm text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xs text-muted-foreground">
                      <BilingualText en={projectEn('info_founded')} el={projectEl('info_founded')} compact />
                    </p>
                    <p className="text-sm font-medium">{formatShortDate(project.createdAt, primary) || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-base"><BilingualText en={projectEn('founder')} el={projectEl('founder')} compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profiles/${project.founder.id}`} className="group flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={project.founder.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary-accessible">
                      {project.founder.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground transition-colors group-hover:text-primary-accessible">
                      {project.founder.name}
                    </p>
                    <RoleBadge role={project.founder.role} size="sm" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
