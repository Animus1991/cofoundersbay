'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb, Target, TrendingUp, FileText, Code, DollarSign,
  Users, Rocket, CheckCircle2, Presentation, Award, Plus,
  ArrowRight, AlertCircle, Clock, CheckCircle, GitBranch,
  Share2, UserPlus, Loader2, BarChart3, RefreshCw, ChevronRight,
  MoreHorizontal, Trash2, Mail, Crown, Eye, Edit2, Shield,
  MessageSquare, Star, Activity, Zap, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { useBuilder } from '@/contexts/BuilderContext';
import { ActivityTimeline } from './ActivityTimeline';
import { useToast } from '@/components/ui/toast';
import type { BuilderDocument, BuilderCollaborator } from '@/lib/builder-api';

// ── Document type metadata ─────────────────────────────────────────────────

const DOC_META: Record<string, { label: string; icon: React.ElementType; description: string; tab: string }> = {
  idea_core:              { label: 'Idea Core',           icon: Lightbulb,      description: 'Core problem and solution definition',          tab: 'idea-core' },
  business_model_canvas:  { label: 'Business Model',      icon: Target,         description: 'Value proposition and business model',          tab: 'bmc' },
  market_analysis:        { label: 'Market Analysis',     icon: TrendingUp,     description: 'TAM/SAM/SOM and competitive landscape',         tab: 'market' },
  pitch_deck:             { label: 'Pitch Deck',          icon: Presentation,   description: 'Investor and stakeholder presentations',         tab: 'pitch-deck' },
  mvp_plan:               { label: 'MVP Planner',         icon: Rocket,         description: 'Product roadmap and technical requirements',     tab: 'mvp' },
  technical_architecture: { label: 'Tech Architecture',  icon: Code,           description: 'Technology stack and system design',            tab: 'mvp' },
  financial_plan:         { label: 'Financial Planning',  icon: DollarSign,     description: 'Revenue models and projections',                tab: 'financials' },
  prd:                    { label: 'PRD & User Stories',  icon: FileText,       description: 'Product requirements and features',             tab: 'mvp' },
  branding_kit:           { label: 'Branding Kit',        icon: Star,           description: 'Brand identity and messaging',                  tab: 'overview' },
  application:            { label: 'Applications',        icon: CheckCircle2,   description: 'Accelerator and funding applications',           tab: 'applications' },
  swot_analysis:          { label: 'SWOT Analysis',       icon: BarChart3,      description: 'Strengths, weaknesses, opportunities, threats',  tab: 'market' },
  lean_canvas:            { label: 'Lean Canvas',         icon: Target,         description: 'Lean startup model canvas',                     tab: 'bmc' },
  competitive_analysis:   { label: 'Competitive Analysis',icon: Shield,         description: 'Competitor landscape and positioning',          tab: 'market' },
  go_to_market:           { label: 'Go-to-Market',        icon: Zap,            description: 'Launch and growth strategy',                    tab: 'market' },
  fundraising_memo:       { label: 'Fundraising Memo',    icon: BookOpen,       description: 'Investment thesis and ask',                     tab: 'overview' },
  product_roadmap:        { label: 'Product Roadmap',     icon: ChevronRight,   description: 'Feature timeline and prioritization',           tab: 'mvp' },
};

const DEFAULT_DOC_TYPES = [
  'idea_core', 'business_model_canvas', 'market_analysis', 'pitch_deck',
  'mvp_plan', 'financial_plan',
] as const;

// ── Role display helpers ───────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; tone: StatusTone; icon: React.ElementType }> = {
  owner:     { label: 'Owner',     tone: 'warning', icon: Crown },
  editor:    { label: 'Editor',    tone: 'info',    icon: Edit2 },
  commenter: { label: 'Commenter', tone: 'accent',  icon: MessageSquare },
  viewer:    { label: 'Viewer',    tone: 'neutral', icon: Eye },
};

function roleChip(role: string) {
  return STATUS[ROLE_META[role]?.tone ?? 'neutral'].chip;
}

function docStatus(doc: BuilderDocument): 'not-started' | 'in-progress' | 'reviewed' | 'completed' {
  if (doc.status === 'approved') return 'completed';
  if (doc.status === 'review') return 'reviewed';
  if (doc.status === 'in_progress' || (doc.status === 'draft' && doc.completionPercent > 0)) return 'in-progress';
  return 'not-started';
}

function statusColor(s: string) {
  switch (s) {
    case 'completed': return 'bg-status-success';
    case 'in-progress': return 'bg-status-warning';
    case 'reviewed': return 'bg-status-info';
    default: return 'bg-muted-foreground/30';
  }
}

function statusLabel(s: string) {
  switch (s) {
    case 'completed': return 'Completed';
    case 'in-progress': return 'In Progress';
    case 'reviewed': return 'Under Review';
    default: return 'Not Started';
  }
}

function dimensionLabel(d: string) {
  const map: Record<string, string> = {
    team: 'Team Readiness', market: 'Market Validation', product: 'Product Definition',
    business: 'Business Model', funding: 'Funding Readiness', execution: 'Execution Plan',
  };
  return map[d] ?? d;
}

function dimensionColor(score: number) {
  if (score >= 80) return STATUS.success.text;
  if (score >= 60) return STATUS.info.text;
  if (score >= 40) return STATUS.warning.text;
  return STATUS.danger.text;
}

function readinessStatusChip(status: string) {
  if (status === 'excellent' || status === 'good') return STATUS.success.chip;
  if (status === 'needs-work') return STATUS.warning.chip;
  if (status === 'critical') return STATUS.danger.chip;
  return STATUS.neutral.chip;
}

function docStatusChip(status: string) {
  if (status === 'approved') return STATUS.success.chip;
  if (status === 'review') return STATUS.info.chip;
  if (status === 'in_progress') return STATUS.warning.chip;
  return STATUS.neutral.chip;
}

// ── Invite Collaborator Dialog ─────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (userId: string, role: string) => Promise<void>;
}

function InviteCollaboratorDialog({ open, onClose, onInvite }: InviteDialogProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      await onInvite(userId.trim(), role);
      setUserId('');
      setRole('viewer');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
          <DialogDescription>Add a team member, mentor, or advisor to this workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-user">User ID or Email</Label>
            <Input
              id="invite-user"
              placeholder="Enter user ID..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor — can edit all documents</SelectItem>
                <SelectItem value="commenter">Commenter — can comment and suggest</SelectItem>
                <SelectItem value="viewer">Viewer — read-only access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !userId.trim()}>
            {loading && <Loader2 className="icon-sm mr-2 animate-spin" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Document Dialog ─────────────────────────────────────────────────

interface CreateDocDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (type: string, title: string) => Promise<void>;
}

function CreateDocumentDialog({ open, onClose, onCreate }: CreateDocDialogProps) {
  const [docType, setDocType] = useState('custom');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(docType, title.trim());
      setTitle('');
      setDocType('custom');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>Add a new startup artifact to this workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="icon-sm mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main BuilderWorkspace Component ───────────────────────────────────────

export function BuilderWorkspace() {
  const {
    workspace,
    documents,
    collaborators,
    readinessAssessment,
    isLoadingWorkspaces,
    isLoadingDocuments,
    assessReadiness,
    createDocument,
    addCollaborator,
    removeCollaborator,
    selectDocument,
  } = useBuilder();

  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateDocDialog, setShowCreateDocDialog] = useState(false);
  const [assessingReadiness, setAssessingReadiness] = useState(false);

  // Auto-assess readiness when workspace loads and no assessment exists
  useEffect(() => {
    if (workspace && !readinessAssessment && !assessingReadiness) {
      setAssessingReadiness(true);
      assessReadiness().finally(() => setAssessingReadiness(false));
    }
  }, [workspace?.id]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const completedDocs = documents.filter(d => d.status === 'approved').length;
  const inProgressDocs = documents.filter(d => d.status === 'in_progress' || d.status === 'review').length;
  const overallCompletion = documents.length
    ? Math.round(documents.reduce((s, d) => s + d.completionPercent, 0) / documents.length)
    : 0;

  const overallReadiness = readinessAssessment?.overallScore ?? 0;
  const readinessDimensions = readinessAssessment?.dimensions ?? [];

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleInvite = useCallback(async (userId: string, role: string) => {
    try {
      await addCollaborator(userId, role);
      success('Collaborator added successfully');
    } catch {
      toastError('Failed to add collaborator');
      throw new Error('invite failed');
    }
  }, [addCollaborator, success, toastError]);

  const handleCreateDoc = useCallback(async (type: string, title: string) => {
    try {
      const doc = await createDocument(type as any, title);
      success('Document created');
      selectDocument(doc.id);
    } catch {
      toastError('Failed to create document');
      throw new Error('create failed');
    }
  }, [createDocument, selectDocument, success, toastError]);

  const handleRemoveCollaborator = useCallback(async (collaboratorId: string) => {
    try {
      await removeCollaborator(collaboratorId);
      success('Collaborator removed');
    } catch {
      toastError('Failed to remove collaborator');
    }
  }, [removeCollaborator, success, toastError]);

  const handleReassess = async () => {
    setAssessingReadiness(true);
    try {
      await assessReadiness();
      success('Readiness assessment updated');
    } catch {
      toastError('Failed to assess readiness');
    } finally {
      setAssessingReadiness(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────

  if (isLoadingWorkspaces) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-7 w-12 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3"><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-3/4" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{overallCompletion}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Completion</div>
            <Progress value={overallCompletion} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn('text-2xl font-bold', dimensionColor(overallReadiness))}>
              {assessingReadiness ? <Loader2 className="icon-lg animate-spin mx-auto" /> : `${overallReadiness}%`}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Readiness</div>
            <Progress value={overallReadiness} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn('text-2xl font-bold', STATUS.success.text)}>{completedDocs}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Completed</div>
            <div className="text-xs text-muted-foreground mt-1.5">{inProgressDocs} in progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-accessible">{collaborators.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">Collaborators</div>
            <div className="flex justify-center mt-2 -space-x-1.5">
              {collaborators.slice(0, 4).map(c => (
                <Avatar key={c.id} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={c.user.avatarUrl} />
                  <AvatarFallback className="text-2xs">{(c.user?.displayName ?? 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1.5">{documents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collaboration">
              Team
              {collaborators.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1.5">{collaborators.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="readiness">Readiness</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="icon-sm mr-1.5" />
              Invite
            </Button>
            <Button size="sm" onClick={() => setShowCreateDocDialog(true)}>
              <Plus className="icon-sm mr-1.5" />
              New Document
            </Button>
          </div>
        </div>

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Progress card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Rocket className="icon-sm" />
                  Startup Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Completion</span>
                    <span className="font-medium">{overallCompletion}%</span>
                  </div>
                  <Progress value={overallCompletion} className="h-2" />
                </div>

                {readinessDimensions.slice(0, 4).map(dim => (
                  <div key={dim.dimension} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{dimensionLabel(dim.dimension)}</span>
                      <span className={cn('font-medium', dimensionColor(dim.score))}>{dim.score}%</span>
                    </div>
                    <Progress value={dim.score} className="h-1.5" />
                  </div>
                ))}

                {assessingReadiness && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="icon-sm animate-spin" />
                    Assessing readiness…
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DEFAULT_DOC_TYPES.map(type => {
                  const meta = DOC_META[type];
                  const existing = documents.find(d => d.type === type);
                  const Icon = meta?.icon ?? FileText;
                  return (
                    <Button
                      key={type}
                      className="w-full justify-between"
                      variant="outline"
                      onClick={() => {
                        if (existing) {
                          selectDocument(existing.id);
                        } else {
                          setShowCreateDocDialog(true);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="icon-sm text-muted-foreground" />
                        {existing ? `Edit ${meta?.label}` : `Start ${meta?.label}`}
                      </span>
                      {existing ? (
                        <Badge
                          variant="secondary"
                          className={cn('text-xs border', docStatusChip(existing.status))}
                        >
                          {existing.completionPercent}%
                        </Badge>
                      ) : (
                        <ChevronRight className="icon-sm text-muted-foreground" />
                      )}
                    </Button>
                  );
                })}

                {readinessAssessment?.blockers && readinessAssessment.blockers.length > 0 && (
                  <div className="pt-2 border-t mt-2 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Critical Gaps</p>
                    {readinessAssessment.blockers.slice(0, 3).map((b, i) => (
                      <div key={i} className={cn('flex items-start gap-1.5 text-xs', STATUS.danger.text)}>
                        <AlertCircle className="icon-sm mt-0.5 shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Next milestones */}
          {readinessAssessment?.nextMilestones && readinessAssessment.nextMilestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className={cn('icon-sm', STATUS.warning.icon)} />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {readinessAssessment.nextMilestones.slice(0, 6).map((milestone, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-sm">
                      <ChevronRight className="icon-sm text-primary-accessible mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{milestone}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          {workspace && (
            <ActivityTimeline workspaceId={workspace.id} limit={15} />
          )}
        </TabsContent>

        {/* ── Documents Tab ─────────────────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          {isLoadingDocuments ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3"><Skeleton className="h-5 w-32" /></CardHeader>
                  <CardContent><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-3/4" /></CardContent>
                </Card>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No documents yet. Create your first startup artifact.</p>
                <Button onClick={() => setShowCreateDocDialog(true)}>
                  <Plus className="icon-sm mr-2" />
                  Create First Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map(doc => {
                const meta = DOC_META[doc.type];
                const status = docStatus(doc);
                const Icon = meta?.icon ?? FileText;
                return (
                  <Card
                    key={doc.id}
                    className="hover:shadow-md transition-all cursor-pointer group border-border/60"
                    onClick={() => selectDocument(doc.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-md bg-primary/8 shrink-0">
                            <Icon className="icon-sm text-primary-accessible" />
                          </div>
                          <CardTitle className="text-sm truncate">{doc.title}</CardTitle>
                        </div>
                        <div className={cn('w-2 h-2 rounded-full shrink-0', statusColor(status))} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {doc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                      )}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{statusLabel(status)}</span>
                          <span>{doc.completionPercent}%</span>
                        </div>
                        <Progress value={doc.completionPercent} className="h-1" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          v{doc.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground group-hover:text-primary-accessible transition-colors flex items-center gap-1">
                          Open <ArrowRight className="icon-sm" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Add document card */}
              <Card
                className="hover:shadow-md transition-all cursor-pointer border-dashed border-2 border-border/40 hover:border-primary/40 bg-muted/20 hover:bg-primary/5"
                onClick={() => setShowCreateDocDialog(true)}
              >
                <CardContent className="py-8 flex flex-col items-center justify-center text-center gap-2">
                  <Plus className="icon-xl text-muted-foreground/40 group-hover:text-primary-accessible transition-colors" />
                  <p className="text-sm text-muted-foreground">Add Document</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Collaboration Tab ─────────────────────────────────────────── */}
        <TabsContent value="collaboration" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="icon-sm" />
                  Team Members
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="icon-sm mr-1.5" />
                  Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {collaborators.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-3">No collaborators yet</p>
                  <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="icon-sm mr-1.5" />
                    Invite First Collaborator
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {collaborators.map(collab => {
                    const roleMeta = ROLE_META[collab.role] ?? ROLE_META.viewer;
                    const RoleIcon = roleMeta.icon;
                    return (
                      <div key={collab.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={collab.user.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {(collab.user?.displayName ?? 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {collab.user?.displayName ?? collab.user.email}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{collab.user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn('text-xs flex items-center gap-1 px-2 border', roleChip(collab.role))}
                          >
                            <RoleIcon className="h-2.5 w-2.5" />
                            {roleMeta.label}
                          </Badge>
                          {collab.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="icon-sm" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive-accessible"
                                  onClick={() => handleRemoveCollaborator(collab.id)}
                                >
                                  <Trash2 className="icon-sm mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workspace info */}
          {workspace && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="icon-sm" />
                  Workspace Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startup</span>
                    <span className="font-medium">{workspace.startupName ?? workspace.name}</span>
                  </div>
                  {workspace.industry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium capitalize">{workspace.industry}</span>
                    </div>
                  )}
                  {workspace.stage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stage</span>
                      <Badge variant="secondary" className="text-xs capitalize">{workspace.stage}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility</span>
                    <Badge variant="outline" className="text-xs capitalize">{workspace.visibility}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Readiness Tab ─────────────────────────────────────────────── */}
        <TabsContent value="readiness" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {readinessAssessment
                  ? `Overall readiness: ${readinessAssessment.readinessLevel} — ${overallReadiness}%`
                  : 'Run an assessment to see your startup readiness scores'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReassess}
              disabled={assessingReadiness}
            >
              {assessingReadiness ? (
                <Loader2 className="icon-sm mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="icon-sm mr-1.5" />
              )}
              {assessingReadiness ? 'Assessing…' : 'Reassess'}
            </Button>
          </div>

          {/* Overall score */}
          {readinessAssessment && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-medium">Overall Readiness Score</span>
                    <span className={cn('font-bold', dimensionColor(overallReadiness))}>{overallReadiness}%</span>
                  </div>
                  <Progress value={overallReadiness} className="h-3" />
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 capitalize text-sm px-3 py-1', dimensionColor(overallReadiness))}
                >
                  {readinessAssessment.readinessLevel}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Dimension cards */}
          {assessingReadiness ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          ) : readinessDimensions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {readinessDimensions.map(dim => (
                <Card key={dim.dimension} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{dimensionLabel(dim.dimension)}</div>
                      <div className={cn('text-lg font-bold', dimensionColor(dim.score))}>{dim.score}%</div>
                    </div>
                    <Progress value={dim.score} className="h-2" />
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize border', readinessStatusChip(dim.status ?? ''))}
                    >
                      {dim.status?.replace('-', ' ')}
                    </Badge>
                    {dim.recommendations && dim.recommendations.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        {dim.recommendations.slice(0, 2).map((r, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <ChevronRight className="icon-sm text-primary-accessible mt-0.5 shrink-0" />
                            {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-3">
                  No readiness data yet. Complete some documents first, then run an assessment.
                </p>
                <Button onClick={handleReassess} disabled={assessingReadiness}>
                  {assessingReadiness ? <Loader2 className="icon-sm mr-2 animate-spin" /> : <Activity className="icon-sm mr-2" />}
                  Run Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <InviteCollaboratorDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onInvite={handleInvite}
      />
      <CreateDocumentDialog
        open={showCreateDocDialog}
        onClose={() => setShowCreateDocDialog(false)}
        onCreate={handleCreateDoc}
      />
    </div>
  );
}
