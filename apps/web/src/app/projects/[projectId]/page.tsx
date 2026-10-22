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
import { ProjectNeedCard } from '@/components/commitments/ProjectNeedCard';
import { NonGuaranteeNote } from '@/components/commitments/NonGuaranteeNote';
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
  PROJECT_STAGE_FULL_KEYS,
} from '@/lib/i18n/strings-projects';
import { cn, initialsOf } from '@/lib/utils';
import { BUILDER_BTN } from '@/components/builder/BuilderStageChrome';
import { CANCELLED, ROW_GONE, rowOptions, usePageControls, type PageControlRunResult } from '@/lib/page-controls';
import {
  getDemoProject,
  toggleDemoStar,
  deleteDemoProject,
  requestJoinDemoProject,
  applyDemoRole,
  hasJoinRequest,
  appliedRolesFor,
  isOwnedProject,
  isJoinedProject,
  PROJECT_STATUS_GLYPH,
  type ProjectStatus,
} from '@/lib/projects-demo';
import { FactLine } from '@/components/common/FactLine';
import { StatusText } from '@/components/common/StatusText';
import { RowHead } from '@/components/dashboard/SectionCard';
import { Counter } from '@/components/ui/counter';
import { useAskAssistant } from '@/hooks/useAskAssistant';

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
  const { open: openAskAi } = usePopupChat();
  const { ask: askInPlace } = useAskAssistant();
  const { success } = useToast();
  const confirm = useConfirm();
  const projectId = String(params?.projectId ?? '');
  const project = useMemo(() => getDemoProject(projectId), [projectId]);
  const [starred, setStarred] = useState(() => getDemoProject(projectId)?.isStarred ?? false);
  const [joinRequested, setJoinRequested] = useState(() => hasJoinRequest(projectId));
  const [appliedRoles, setAppliedRoles] = useState(() => appliedRolesFor(projectId));
  const [tab, setTab] = useState('overview');
  const owned = project ? isOwnedProject(project) : false;
  const joined = project ? isJoinedProject(project) : false;

  function handleShare() {
    if (!project) return;
    const url = `${window.location.origin}/projects/${project.id}`;
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    success('Link copied', 'Anyone with the link can open this project.');
  }

  async function handleDelete(): Promise<PageControlRunResult> {
    if (!project) return ROW_GONE;
    if (!(await confirm(deleteConfirmCopy({ en: 'project', el: 'έργου' }, project.name)))) return CANCELLED;
    deleteDemoProject(project.id);
    success('Project deleted');
    router.push('/projects');
  }

  function handleJoin() {
    if (!project) return;
    if (requestJoinDemoProject(project.id)) {
      setJoinRequested(true);
      success('Request sent', 'The founder can accept from their inbox.');
    }
  }

  function handleApply(roleTitle: string) {
    if (!project) return;
    if (applyDemoRole(project.id, roleTitle)) {
      setAppliedRoles(appliedRolesFor(project.id));
      success('Application noted', 'The team will see it next to this role.');
    }
  }

  // Offered to the assistant, above the missing-project return: the header's
  // star, share and delete (which asks). Projects are kept in this browser
  // until a projects API exists, so each writes there.
  const missingEn = project ? undefined : 'This project was not found.';
  const missingEl = project ? undefined : 'Το έργο δεν βρέθηκε.';
  usePageControls([
    { id: 'star_project', labelEn: 'Star this project', labelEl: 'Προσθήκη του έργου στα αγαπημένα', writes: true, unavailableEn: missingEn ?? (starred ? 'It is already starred.' : undefined), unavailableEl: missingEl ?? (starred ? 'Είναι ήδη στα αγαπημένα.' : undefined), undo: () => ({ control: 'unstar_project' }), run: () => { if (project) setStarred(toggleDemoStar(project.id)); } },
    { id: 'unstar_project', labelEn: 'Unstar this project', labelEl: 'Αφαίρεση του έργου από τα αγαπημένα', writes: true, unavailableEn: missingEn ?? (starred ? undefined : 'It is not starred.'), unavailableEl: missingEl ?? (starred ? undefined : 'Δεν είναι στα αγαπημένα.'), undo: () => ({ control: 'star_project' }), run: () => { if (project) setStarred(toggleDemoStar(project.id)); } },
    { id: 'share_project', labelEn: 'Copy a link to this project', labelEl: 'Αντιγραφή συνδέσμου του έργου', writes: false, unavailableEn: missingEn, unavailableEl: missingEl, run: handleShare },
    { id: 'request_join', labelEn: 'Request to join this project', labelEl: 'Αίτημα ένταξης σε αυτό το έργο', writes: true, unavailableEn: missingEn ?? (owned ? 'You own this project.' : joined ? "You're on this team." : joinRequested ? 'Request already sent.' : undefined), unavailableEl: missingEl ?? (owned ? 'Αυτό το έργο είναι δικό σας.' : joined ? 'Είστε στην ομάδα.' : joinRequested ? 'Το αίτημα έχει ήδη σταλεί.' : undefined), run: handleJoin },
    { id: 'apply_role', labelEn: 'Apply to an open role', labelEl: 'Αίτηση σε ανοιχτό ρόλο', writes: true, unavailableEn: missingEn ?? (owned ? 'You own this project.' : !project?.rolesNeeded.length ? 'This project has no open roles.' : project.rolesNeeded.every((role) => appliedRoles.includes(role.title)) ? 'Applications are already noted.' : undefined), unavailableEl: missingEl ?? (owned ? 'Αυτό το έργο είναι δικό σας.' : !project?.rolesNeeded.length ? 'Αυτό το έργο δεν έχει ανοιχτούς ρόλους.' : project.rolesNeeded.every((role) => appliedRoles.includes(role.title)) ? 'Οι αιτήσεις έχουν ήδη καταχωρηθεί.' : undefined), options: rowOptions((project?.rolesNeeded ?? []).filter((role) => !appliedRoles.includes(role.title)), (role) => role.title, (role) => role.title), run: (v) => { if (v) handleApply(v); } },
    { id: 'delete_project', labelEn: 'Delete this project', labelEl: 'Διαγραφή του έργου', writes: true, unavailableEn: missingEn, unavailableEl: missingEl, run: () => handleDelete() },
  ]);

  if (!project) {
    return (
      <AppShell showHelp contentClassName="builder-copy overflow-x-clip">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <CfbGlyph name="briefcase" className="icon-lg text-muted-foreground/50" />
          <div>
            <p className="page-section font-medium text-foreground">
              <BilingualText en={projectEn('missing_title')} el={projectEl('missing_title')} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <BilingualText en={projectEn('missing_hint')} el={projectEl('missing_hint')} />
            </p>
          </div>
          <Button className={BUILDER_BTN} asChild>
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
      askAi={
        current.name.includes('Harbor') || current.id === '1'
          ? {
              en: 'Help with this Harbor project from Idea Core, the GTM board, and the €750K seed (Athens Tech Angels, €375K committed).',
              el: 'Βοήθησέ με σε αυτό το project του Harbor από τον Πυρήνα ιδέας, τον πίνακα GTM και τον γύρο €750K (Athens Tech Angels, €375K δεσμευμένα).',
            }
          : {
              en: 'Help me decide whether to join or start from Builder artefacts.',
              el: 'Βοήθησέ με να αποφασίσω αν θα συμμετάσχω ή θα ξεκινήσω από τα στοιχεία του Builder.',
            }
      }
      contentClassName="builder-copy overflow-x-clip"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => {
              setStarred(toggleDemoStar(project.id));
            }}
            aria-pressed={starred}
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
              <DropdownMenuItem onClick={() => askInPlace(
                current.name.includes('Harbor') || current.id === '1'
                  ? {
                      en: 'Draft an edit to this Harbor project from Idea Core, the GTM board, and the €750K seed (Athens Tech Angels, €375K committed).',
                      el: 'Ετοίμασε μια αλλαγή σε αυτό το project του Harbor από τον Πυρήνα ιδέας, τον πίνακα GTM και τον γύρο €750K (Athens Tech Angels, €375K δεσμευμένα).',
                    }
                  : {
                      en: 'Draft an edit to this project from Builder artefacts.',
                      el: 'Ετοίμασε μια αλλαγή σε αυτό το project από τα στοιχεία του Builder.',
                    },
              )}>
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
      <div className="space-y-6">
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
              <h2 className="page-section font-semibold text-foreground">{project.name}</h2>
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
            {/* GitHub's repository tabs carry their counts ("Issues 12"); a
                count tells the reader whether a tab is worth opening. */}
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
              <TabsList className="rounded-xl">
                <TabsTrigger value="overview" className="rounded-xl"><BilingualText en={projectEn('tab_overview')} el={projectEl('tab_overview')} compact /></TabsTrigger>
                <TabsTrigger value="team" className="rounded-xl">
                  <BilingualText en={projectEn('tab_team')} el={projectEl('tab_team')} compact />
                  {project.members.length > 0 ? <Counter value={project.members.length} /> : null}
                </TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-xl">
                  <BilingualText en={projectEn('tab_milestones')} el={projectEl('tab_milestones')} compact />
                  {project.milestones.length > 0 ? <Counter value={project.milestones.length} /> : null}
                </TabsTrigger>
                <TabsTrigger value="updates" className="rounded-xl">
                  <BilingualText en={projectEn('tab_updates')} el={projectEl('tab_updates')} compact />
                  {project.updates.length > 0 ? <Counter value={project.updates.length} /> : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* What the project needs and offers for it, as a need card. */}
                <ProjectNeedCard projectId={project.id} owned={owned} />
                <Card>
                  <CardHeader>
                    <CardTitle><BilingualText en={projectEn('about')} el={projectEl('about')} compact /></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {/* Seed projects carry a Greek translation with the same
                          paragraph structure; pair paragraphs by index. User
                          projects have no `descriptionEl` and render as typed. */}
                      {(() => {
                        const elParas = project.descriptionEl?.split('\n\n') ?? [];
                        return project.description.split('\n\n').map((p, i) => (
                          <p key={i} className="card-body text-muted-foreground">
                            {elParas[i] ? <BilingualText en={p} el={elParas[i]} wrap /> : p}
                          </p>
                        ));
                      })()}
                    </div>
                    <FactLine className="mt-4" items={project.tags} />
                  </CardContent>
                </Card>

                {project.rolesNeeded.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle><BilingualText en={projectEn('open_roles')} el={projectEl('open_roles')} compact /></CardTitle>
                    <Badge variant="outline" className="rounded-full">
                      {project.rolesNeeded.length}{' '}
                      {project.rolesNeeded.length === 1
                        ? <BilingualText en={projectEn('position_one')} el={projectEl('position_one')} compact />
                        : <BilingualText en={projectEn('positions')} el={projectEl('positions')} compact />}
                    </Badge>
                  </CardHeader>
                  <CardContent className="card-rows">
                    {project.rolesNeeded.map((role) => (
                      <div key={role.title} className="min-w-0 space-y-1.5">
                        <RowHead
                          titleAs="h4"
                          title={role.titleEl ? <BilingualText en={role.title} el={role.titleEl} wrap /> : role.title}
                          subtitle={(
                            <FactLine
                              items={[
                                role.commitment
                                  ? role.commitment === 'Full-time'
                                    ? <BilingualText key="c" en={projectEn('commit_full')} el={projectEl('commit_full')} compact />
                                    : role.commitment === 'Part-time'
                                      ? <BilingualText key="c" en={projectEn('commit_part')} el={projectEl('commit_part')} compact />
                                      : role.commitment
                                  : null,
                                role.equity ? <span key="e">{role.equity} <BilingualText en={projectEn('equity')} el={projectEl('equity')} compact /></span> : null,
                              ]}
                            />
                          )}
                          aside={!owned ? (
                            // Outline: "Request to join" beside is the page's one filled button (docs §83).
                            <Button
                              size="sm"
                              variant="outline"
                              className={BUILDER_BTN}
                              disabled={appliedRoles.includes(role.title)}
                              onClick={() => handleApply(role.title)}
                            >
                              <BilingualText
                                en={appliedRoles.includes(role.title) ? projectEn('applied_btn') : projectEn('apply')}
                                el={appliedRoles.includes(role.title) ? projectEl('applied_btn') : projectEl('apply')}
                                compact
                              />
                            </Button>
                          ) : undefined}
                        />
                        {role.description ? (
                          <p className="card-body text-muted-foreground">
                            {role.descriptionEl
                              ? <BilingualText en={role.description} el={role.descriptionEl} wrap />
                              : role.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {project.rolesNeeded.some((role) => role.equity) ? <NonGuaranteeNote /> : null}
                  </CardContent>
                </Card>
                )}
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle><BilingualText en={projectEn('team_members')} el={projectEl('team_members')} compact /></CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {project.teamSize}/{project.maxTeamSize} <BilingualText en={projectEn('members')} el={projectEl('members')} compact />
                    </span>
                  </CardHeader>
                  <CardContent className="card-rows">
                    {project.members.map((member) => (
                      <RowHead
                        key={member.id}
                        mark={(
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary-accessible">
                              {initialsOf(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        title={(
                          <Link href={`/profiles/${member.id}`} className="transition-colors hover:text-primary-accessible">
                            {member.name}
                          </Link>
                        )}
                        subtitle={member.roleEl
                          ? <BilingualText en={member.role} el={member.roleEl} compact />
                          : member.role}
                        asideStays
                        aside={(
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => openAskAi(member.id, 'messages')} aria-label={bilingualAria(`Message ${member.name}`, `Μήνυμα προς ${member.name}`)}>
                              <MessageSquare className="icon-sm" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" asChild aria-label={bilingualAria(`Schedule a call with ${member.name}`, `Προγραμματισμός κλήσης με ${member.name}`)}>
                              <Link href="/calendar">
                                <Video className="icon-sm" />
                              </Link>
                            </Button>
                          </>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle><BilingualText en={projectEn('milestones')} el={projectEl('milestones')} compact /></CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {project.progress ?? 0}% <BilingualText en={projectEn('complete_pct')} el={projectEl('complete_pct')} compact />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <Progress value={project.progress ?? 0} className="mb-6 h-2" />
                    <div className="card-rows">
                      {project.milestones.map((milestone) => (
                        <RowHead
                          key={milestone.id}
                          titleAs="h4"
                          mark={(
                            <div
                              data-card-mark=""
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl',
                                milestone.status === 'completed' && 'bg-status-success-bg text-status-success',
                                milestone.status === 'in_progress' && 'bg-status-info-bg text-status-info',
                                milestone.status === 'pending' && 'bg-muted text-muted-foreground',
                              )}
                            >
                              {milestone.status === 'completed' ? (
                                <CheckCircle2 className="icon-sm" aria-hidden="true" />
                              ) : milestone.status === 'in_progress' ? (
                                <CfbGlyph name="flag" className="icon-sm" />
                              ) : (
                                <Circle className="icon-sm" aria-hidden="true" />
                              )}
                            </div>
                          )}
                          title={(
                            <span className={cn(milestone.status === 'completed' && 'text-muted-foreground')}>
                              {milestone.titleEl
                                ? <BilingualText en={milestone.title} el={milestone.titleEl} wrap />
                                : milestone.title}
                            </span>
                          )}
                          subtitle={<StatusText value={milestone.status} />}
                          aside={<span className="tabular-nums">{formatShortDate(milestone.date, primary) || '—'}</span>}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle><BilingualText en={projectEn('updates')} el={projectEl('updates')} compact /></CardTitle>
                  </CardHeader>
                  <CardContent className="card-rows">
                    {project.updates.map((update) => (
                      <div key={update.id} className="min-w-0 space-y-1.5">
                        <p className="card-body text-foreground">
                          {update.contentEl
                            ? <BilingualText en={update.content} el={update.contentEl} wrap />
                            : update.content}
                        </p>
                        <FactLine items={[update.author, formatShortDate(update.date, primary) || '—']} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3">
                {owned ? (
                  <p className="card-body text-muted-foreground">
                    <BilingualText en={projectEn('own_this')} el={projectEl('own_this')} wrap />
                  </p>
                ) : joined ? (
                  <p className="card-body text-muted-foreground">
                    <BilingualText en={projectEn('on_team')} el={projectEl('on_team')} wrap />
                  </p>
                ) : (
                  <Button
                    className={`w-full gap-2 ${BUILDER_BTN}`}
                    disabled={joinRequested}
                    onClick={handleJoin}
                  >
                    <CfbGlyph name="people" className="icon-sm" />
                    <BilingualText
                      en={joinRequested ? projectEn('requested') : projectEn('request_join')}
                      el={joinRequested ? projectEl('requested') : projectEl('request_join')}
                      compact
                    />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-auto min-h-9 w-full gap-2 whitespace-normal py-1.5 ${BUILDER_BTN}`}
                    title={bilingualAria(projectEn('message_team'), projectEl('message_team'))}
                    onClick={() => openAskAi(project.founder.id, 'messages')}
                  >
                    <CfbGlyph name="messages" className="icon-sm shrink-0" />
                    <BilingualText en={projectEn('message_short')} el={projectEl('message_short')} compact />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-auto min-h-9 w-full gap-2 whitespace-normal py-1.5 ${BUILDER_BTN}`}
                    title={bilingualAria(projectEn('schedule_call'), projectEl('schedule_call'))}
                    asChild
                  >
                    <Link href="/calendar">
                      <CfbGlyph name="calendar" className="icon-sm shrink-0" />
                      <BilingualText en={projectEn('schedule_short')} el={projectEl('schedule_short')} compact />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {project.members.length > 0 ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="flex items-center">
                    <BilingualText en={projectEn('tab_team')} el={projectEl('tab_team')} compact />
                    <Counter value={project.members.length} />
                  </CardTitle>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {project.teamSize}/{project.maxTeamSize}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="flex flex-wrap gap-1.5">
                    {project.members.map((member) => (
                      <li key={member.id}>
                        <Link href={`/profiles/${member.id}`} title={member.name} aria-label={member.name} className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Avatar className="h-9 w-9 ring-2 ring-background">
                            <AvatarImage src={member.avatar} alt="" />
                            <AvatarFallback className="bg-primary/10 text-xs text-primary-accessible">{initialsOf(member.name)}</AvatarFallback>
                          </Avatar>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setTab('team')} className="text-xs font-medium text-primary-accessible underline-offset-4 hover:underline">
                    <BilingualText en={projectEn('see_team')} el={projectEl('see_team')} compact />
                  </button>
                </CardContent>
              </Card>
            ) : null}

            {project.milestones.length > 0 ? (() => {
              const states = (['completed', 'in_progress', 'pending'] as const)
                .map((state) => ({ state, count: project.milestones.filter((m) => m.status === state).length }))
                .filter((s) => s.count > 0);
              const tone: Record<string, string> = { completed: 'bg-status-success', in_progress: 'bg-status-info', pending: 'bg-muted-foreground/40' };
              return (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle><BilingualText en={projectEn('progress')} el={projectEl('progress')} compact /></CardTitle>
                    <span className="text-xs tabular-nums text-muted-foreground">{project.progress ?? 0}%</span>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      {states.map((s) => (
                        <span key={s.state} className={tone[s.state]} style={{ width: `${(s.count / project.milestones.length) * 100}%` }} />
                      ))}
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {states.map((s) => (
                        <li key={s.state} className="flex items-center gap-1.5">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', tone[s.state])} aria-hidden="true" />
                          <StatusText value={s.state} />
                          <span className="tabular-nums text-foreground">{s.count}</span>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => setTab('milestones')} className="text-xs font-medium text-primary-accessible underline-offset-4 hover:underline">
                      {project.milestones.length} <BilingualText en={projectEn('milestones_of')} el={projectEl('milestones_of')} compact />
                    </button>
                  </CardContent>
                </Card>
              );
            })() : null}

            <Card>
              <CardHeader>
                <CardTitle><BilingualText en={projectEn('project_info')} el={projectEl('project_info')} compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {([
                    { label: 'info_stage' as const, value: project.stage },
                    { label: 'info_industry' as const, value: project.industry },
                    { label: 'info_location' as const, value: project.location },
                  ]).map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-muted-foreground">
                        <BilingualText en={projectEn(row.label)} el={projectEl(row.label)} compact />
                      </dt>
                      <dd className="card-body font-medium text-foreground">
                        {row.label === 'info_stage' && row.value ? <StatusText value={row.value} /> : row.value || '—'}
                      </dd>
                    </div>
                  ))}
                  {project.website ? (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        <BilingualText en={projectEn('info_website')} el={projectEl('info_website')} compact />
                      </dt>
                      <dd className="card-body font-medium">
                        <a href={project.website} target="_blank" rel="noopener noreferrer" className="break-all text-primary-accessible hover:underline">
                          {project.website.replace('https://', '')}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      <BilingualText en={projectEn('info_founded')} el={projectEl('info_founded')} compact />
                    </dt>
                    <dd className="card-body font-medium tabular-nums text-foreground">{formatShortDate(project.createdAt, primary) || '—'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><BilingualText en={projectEn('founder')} el={projectEl('founder')} compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <RowHead
                  mark={(
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={project.founder.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary-accessible">
                        {initialsOf(project.founder.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  title={(
                    <Link href={`/profiles/${project.founder.id}`} className="transition-colors hover:text-primary-accessible">
                      {project.founder.name}
                    </Link>
                  )}
                  subtitle={<RoleBadge role={project.founder.role} size="sm" />}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><BilingualText en={projectEn('link_into')} el={projectEl('link_into')} compact /></CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {([
                    { href: '/builder?tab=idea-core', key: 'link_idea', glyph: 'spark' },
                    { href: '/milestones', key: 'link_milestones', glyph: 'flag' },
                    { href: '/research', key: 'link_research', glyph: 'search' },
                    { href: '/fundraising', key: 'link_fundraising', glyph: 'wallet' },
                    { href: '/matches', key: 'link_matches', glyph: 'matches' },
                  ] as const).map((link) => (
                    <li key={link.key}>
                      <Link href={link.href} className="flex items-center gap-2 text-foreground underline-offset-4 hover:text-primary-accessible hover:underline">
                        <CfbGlyph name={link.glyph} className="icon-sm shrink-0 text-muted-foreground" />
                        <BilingualText en={projectEn(link.key)} el={projectEl(link.key)} compact />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
