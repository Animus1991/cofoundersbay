'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Plus,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Crown,
  Eye,
  Edit2,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { useBuilder } from '@/contexts/BuilderContext';
import { ActivityTimeline } from './ActivityTimeline';
import { useToast } from '@/components/ui/toast';
import type { BuilderDocument } from '@/lib/builder-api';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BUILDER_BTN, BUILDER_STAT } from './BuilderStageChrome';
import {
  builderEn,
  builderEl,
  builderDocLabel,
  builderDocDescription,
  BUILDER_DOC_TYPES,
  BUILDER_PREVIEW_HINT_EL,
} from '@/lib/i18n/strings-builder';
import { bilingualInline, bilingualAria } from '@/lib/i18n/format';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from '@/lib/i18n/LanguagePreferenceContext';
import { AIInsightButton } from '@/components/ai/AIInsightButton';

function PreviewHint({ text }: { text: string }) {
  const el = BUILDER_PREVIEW_HINT_EL[text];
  if (!el) return <>{text}</>;
  return <BilingualText en={text} el={el} wrap />;
}

const MOBILE_DIALOG =
  'max-md:top-[max(0.5rem,env(safe-area-inset-top))] max-md:translate-y-0';

// ── Document type metadata ─────────────────────────────────────────────────

const DOC_GLYPH: Record<string, CfbGlyphName> = {
  idea_core: 'spark',
  business_model_canvas: 'target',
  market_analysis: 'chart',
  pitch_deck: 'builder',
  mvp_plan: 'flag',
  technical_architecture: 'sliders',
  financial_plan: 'wallet',
  prd: 'book',
  branding_kit: 'spark',
  application: 'applications',
  swot_analysis: 'chart',
  lean_canvas: 'target',
  competitive_analysis: 'shield',
  go_to_market: 'flag',
  fundraising_memo: 'wallet',
  product_roadmap: 'flag',
};

const DEFAULT_DOC_TYPES = [
  'idea_core', 'business_model_canvas', 'market_analysis', 'pitch_deck',
  'mvp_plan', 'financial_plan',
] as const;

function docGlyph(type: string): CfbGlyphName {
  return DOC_GLYPH[type] ?? 'book';
}

function docLabelEn(type: string) {
  return builderDocLabel(type, 'en');
}

function docLabelEl(type: string) {
  return builderDocLabel(type, 'el');
}

// ── Role display helpers ───────────────────────────────────────────────────

const ROLE_META: Record<string, { labelKey: 'role_owner' | 'role_editor_short' | 'role_commenter_short' | 'role_viewer_short'; tone: StatusTone; icon: LucideIcon }> = {
  owner:     { labelKey: 'role_owner',           tone: 'warning', icon: Crown },
  editor:    { labelKey: 'role_editor_short',    tone: 'info',    icon: Edit2 },
  commenter: { labelKey: 'role_commenter_short', tone: 'accent',  icon: MessageSquare },
  viewer:    { labelKey: 'role_viewer_short',    tone: 'neutral', icon: Eye },
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

function statusKey(s: string): 'status_completed' | 'status_in_progress' | 'status_reviewed' | 'status_not_started' {
  switch (s) {
    case 'completed': return 'status_completed';
    case 'in-progress': return 'status_in_progress';
    case 'reviewed': return 'status_reviewed';
    default: return 'status_not_started';
  }
}

function dimensionKey(d: string): 'dim_team' | 'dim_market' | 'dim_product' | 'dim_business' | 'dim_funding' | 'dim_execution' | null {
  const map: Record<string, 'dim_team' | 'dim_market' | 'dim_product' | 'dim_business' | 'dim_funding' | 'dim_execution'> = {
    team: 'dim_team', market: 'dim_market', product: 'dim_product',
    business: 'dim_business', funding: 'dim_funding', execution: 'dim_execution',
  };
  return map[d] ?? null;
}

function DimensionLabel({ d }: { d: string }) {
  const key = dimensionKey(d);
  if (!key) return <span>{d}</span>;
  return <BilingualText en={builderEn(key)} el={builderEl(key)} compact />;
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

function AskAiButton({
  labelEn,
  labelEl,
  prompt,
  variant = 'outline',
}: {
  labelEn?: string;
  labelEl?: string;
  prompt?: string;
  variant?: 'outline' | 'ghost' | 'secondary';
}) {
  const href = prompt
    ? `/ai?q=${encodeURIComponent(prompt)}`
    : '/ai?q=' + encodeURIComponent('Help me decide the next Startup Builder section to complete — Idea Core, BMC, Market, Pitch, MVP, or Financials.');
  return (
    <Button asChild variant={variant} size="sm" className="h-8 gap-1.5 text-xs">
      <Link href={href}>
        <CfbGlyph name="spark" className="icon-sm" aria-hidden="true" />
        <BilingualText en={labelEn ?? builderEn('ask_ai')} el={labelEl ?? builderEl('ask_ai')} compact />
      </Link>
    </Button>
  );
}

function usePrimaryText() {
  const { primary, showSecondary } = useLanguagePreference();
  return (en: string, el: string) => resolveBilingualPair(en, el, primary, showSecondary).primaryText;
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
  const t = usePrimaryText();

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
      <DialogContent className={MOBILE_DIALOG}>
        <DialogHeader>
          <DialogTitle>
            <BilingualText en={builderEn('invite_title')} el={builderEl('invite_title')} />
          </DialogTitle>
          <DialogDescription>
            <BilingualText en={builderEn('invite_desc')} el={builderEl('invite_desc')} />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="invite-user">
              <BilingualText en={builderEn('user_id')} el={builderEl('user_id')} compact />
            </Label>
            <Input
              id="invite-user"
              placeholder={t(builderEn('user_ph'), builderEl('user_ph'))}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              aria-label={bilingualAria(builderEn('user_id'), builderEl('user_id'))}
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">
              <BilingualText en={builderEn('role')} el={builderEl('role')} compact />
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">{t(builderEn('role_editor'), builderEl('role_editor'))}</SelectItem>
                <SelectItem value="commenter">{t(builderEn('role_commenter'), builderEl('role_commenter'))}</SelectItem>
                <SelectItem value="viewer">{t(builderEn('role_viewer'), builderEl('role_viewer'))}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" onClick={onClose}>
            <BilingualText en={builderEn('cancel')} el={builderEl('cancel')} compact />
          </Button>
          <Button className="min-h-11 w-full sm:w-auto" onClick={handleSubmit} disabled={loading || !userId.trim()}>
            {loading && <Loader2 className="icon-sm mr-2 animate-spin" />}
            <BilingualText en={builderEn('send_invite')} el={builderEl('send_invite')} compact />
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
  const t = usePrimaryText();

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
      <DialogContent className={MOBILE_DIALOG}>
        <DialogHeader>
          <DialogTitle>
            <BilingualText en={builderEn('create_doc')} el={builderEl('create_doc')} />
          </DialogTitle>
          <DialogDescription>
            <BilingualText en={builderEn('create_doc_desc')} el={builderEl('create_doc_desc')} />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>
              <BilingualText en={builderEn('doc_type')} el={builderEl('doc_type')} compact />
            </Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(BUILDER_DOC_TYPES).map((k) => (
                  <SelectItem key={k} value={k}>{t(docLabelEn(k), docLabelEl(k))}</SelectItem>
                ))}
                <SelectItem value="custom">{t(builderEn('custom_doc'), builderEl('custom_doc'))}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              <BilingualText en={builderEn('title')} el={builderEl('title')} compact />
            </Label>
            <Input
              placeholder={t(builderEn('title_ph'), builderEl('title_ph'))}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              aria-label={bilingualAria(builderEn('title'), builderEl('title'))}
              className="min-h-11"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" onClick={onClose}>
            <BilingualText en={builderEn('cancel')} el={builderEl('cancel')} compact />
          </Button>
          <Button className="min-h-11 w-full sm:w-auto" onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading && <Loader2 className="icon-sm mr-2 animate-spin" />}
            <BilingualText en={builderEn('create')} el={builderEl('create')} compact />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main BuilderWorkspace Component ───────────────────────────────────────

const DOC_TO_TAB: Record<string, string> = {
  idea_core: 'idea-core',
  business_model_canvas: 'bmc',
  market_analysis: 'market',
  pitch_deck: 'pitch-deck',
  mvp_plan: 'mvp',
  financial_plan: 'financials',
  application: 'applications',
};

export function BuilderWorkspace({ onOpenStage }: { onOpenStage?: (tab: string) => void } = {}) {
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
      success(bilingualInline(builderEn('toast_collab_added'), builderEl('toast_collab_added')));
    } catch {
      toastError(bilingualInline(builderEn('toast_collab_failed'), builderEl('toast_collab_failed')));
      throw new Error('invite failed');
    }
  }, [addCollaborator, success, toastError]);

  const handleCreateDoc = useCallback(async (type: string, title: string) => {
    try {
      const doc = await createDocument(type as any, title);
      success(bilingualInline(builderEn('toast_doc_created'), builderEl('toast_doc_created')));
      selectDocument(doc.id);
    } catch {
      toastError(bilingualInline(builderEn('toast_doc_failed'), builderEl('toast_doc_failed')));
      throw new Error('create failed');
    }
  }, [createDocument, selectDocument, success, toastError]);

  const handleRemoveCollaborator = useCallback(async (collaboratorId: string) => {
    try {
      await removeCollaborator(collaboratorId);
      success(bilingualInline(builderEn('toast_removed'), builderEl('toast_removed')));
    } catch {
      toastError(bilingualInline(builderEn('toast_remove_failed'), builderEl('toast_remove_failed')));
    }
  }, [removeCollaborator, success, toastError]);

  const handleReassess = async () => {
    setAssessingReadiness(true);
    try {
      await assessReadiness();
      success(bilingualInline(builderEn('toast_reassessed'), builderEl('toast_reassessed')));
    } catch {
      toastError(bilingualInline(builderEn('toast_assess_failed'), builderEl('toast_assess_failed')));
    } finally {
      setAssessingReadiness(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────

  if (isLoadingWorkspaces) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="min-w-0">
              <CardContent className="p-3">
                <Skeleton className="h-7 w-12 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    <div className="min-w-0 space-y-6 overflow-x-clip">
      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="builder-overview-stats grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={BUILDER_STAT}>{overallCompletion}%</div>
                <div className="mt-0.5 text-2xs uppercase leading-snug tracking-wide text-muted-foreground">
                  <BilingualText en={builderEn('completion')} el={builderEl('completion')} compact wrap />
                </div>
              </div>
              <CfbGlyph name="builder" className="icon-sm shrink-0 text-muted-foreground/70" />
            </div>
            <Progress value={overallCompletion} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={cn(BUILDER_STAT, dimensionColor(overallReadiness))}>
                  {assessingReadiness ? <Loader2 className="icon-lg animate-spin" /> : `${overallReadiness}%`}
                </div>
                <div className="mt-0.5 text-2xs uppercase leading-snug tracking-wide text-muted-foreground">
                  <BilingualText en={builderEn('readiness')} el={builderEl('readiness')} compact wrap />
                </div>
              </div>
              <CfbGlyph name="award" className="icon-sm shrink-0 text-muted-foreground/70" />
            </div>
            <Progress value={overallReadiness} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={cn(BUILDER_STAT, completedDocs > 0 ? STATUS.success.text : 'text-foreground')}>{completedDocs}</div>
                <div className="mt-0.5 text-2xs uppercase leading-snug tracking-wide text-muted-foreground">
                  <BilingualText en={builderEn('completed')} el={builderEl('completed')} compact wrap />
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {inProgressDocs}{' '}
                  <BilingualText en={builderEn('in_progress')} el={builderEl('in_progress')} compact />
                </div>
              </div>
              <CfbGlyph name="flag" className="icon-sm shrink-0 text-muted-foreground/70" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={cn(BUILDER_STAT, 'text-foreground')}>{collaborators.length}</div>
                <div className="mt-0.5 text-2xs uppercase leading-snug tracking-wide text-muted-foreground">
                  <BilingualText en={builderEn('collaborators')} el={builderEl('collaborators')} compact wrap />
                </div>
                <div className="mt-2 -space-x-1.5 flex min-h-5">
                  {collaborators.slice(0, 4).map(c => (
                    <Avatar key={c.id} className="h-5 w-5 border-2 border-background">
                      <AvatarImage src={c.user.avatarUrl} />
                      <AvatarFallback className="text-2xs">{(c.user?.displayName ?? 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
              <CfbGlyph name="people" className="icon-sm shrink-0 text-muted-foreground/70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl sm:w-auto">
            <TabsTrigger value="overview" className="min-h-10 gap-1.5 text-xs">
              <CfbGlyph name="builder" className="icon-sm" />
              <BilingualText en={builderEn('tab_overview')} el={builderEl('tab_overview')} compact />
            </TabsTrigger>
            <TabsTrigger value="documents" className="min-h-10 gap-1.5 text-xs">
              <CfbGlyph name="book" className="icon-sm" />
              <BilingualText en={builderEn('tab_documents')} el={builderEl('tab_documents')} compact />
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">{documents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="min-h-10 gap-1.5 text-xs">
              <CfbGlyph name="people" className="icon-sm" />
              <BilingualText en={builderEn('tab_team')} el={builderEl('tab_team')} compact />
              {collaborators.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">{collaborators.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="readiness" className="min-h-10 gap-1.5 text-xs">
              <CfbGlyph name="award" className="icon-sm" />
              <BilingualText en={builderEn('tab_readiness')} el={builderEl('tab_readiness')} compact />
            </TabsTrigger>
          </TabsList>

          <div className="builder-overview-type flex min-w-0 flex-wrap items-center gap-2">
            <AskAiButton
              labelEn={builderEn('ask_ai_plan')}
              labelEl={builderEl('ask_ai_plan')}
              prompt={`Startup Builder is ${overallCompletion}% complete and ${overallReadiness}% ready. Recommend the next artifact and draft the first section.`}
            />
            <Button size="sm" variant="outline" className={BUILDER_BTN} onClick={() => setShowInviteDialog(true)}>
              <CfbGlyph name="people" className="icon-sm mr-1.5" />
              <BilingualText en={builderEn('invite')} el={builderEl('invite')} compact />
            </Button>
            <Button size="sm" className={BUILDER_BTN} onClick={() => setShowCreateDocDialog(true)}>
              <Plus className="icon-sm mr-1.5" />
              <BilingualText en={builderEn('new_document')} el={builderEl('new_document')} compact />
            </Button>
          </div>
        </div>

        {/* ── Overview Tab ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="builder-overview-type space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Progress card. The flex column continues onto the content so
                the footer below can reach the bottom of whatever height this
                card is given by the taller card beside it. */}
            <Card className="flex min-w-0 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="flag" className="icon-sm" />
                  <BilingualText en={builderEn('startup_progress')} el={builderEl('startup_progress')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <BilingualText en={builderEn('overall_completion')} el={builderEl('overall_completion')} compact />
                    </span>
                    <span className="font-medium">{overallCompletion}%</span>
                  </div>
                  <Progress value={overallCompletion} className="h-1.5" />
                </div>

                {/* Every dimension, not the first four. This card sits beside
                    Quick Actions in a two-column row, so it stretched to that
                    card's height and ended 166px early — and the content that
                    would have filled the gap was already fetched and then
                    sliced away. The reader now sees the whole assessment, and
                    the same figures no longer disagree with /readiness, which
                    has always listed all of them. */}
                {readinessDimensions.map(dim => (
                  <div key={dim.dimension} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        <DimensionLabel d={dim.dimension} />
                      </span>
                      <span className={cn('font-medium', dimensionColor(dim.score))}>{dim.score}%</span>
                    </div>
                    <Progress value={dim.score} className="h-1.5" />
                  </div>
                ))}

                {assessingReadiness && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="icon-sm animate-spin" />
                    <BilingualText en={builderEn('assessing')} el={builderEl('assessing')} compact />
                  </div>
                )}

                {/* `mt-auto` puts this at the foot of whatever height the row
                    gives the card, so the 76px still left after un-slicing the
                    dimensions carries a way out of the card instead of air —
                    and the two surfaces that score the same venture, Builder
                    and /readiness, are finally linked from this side too. */}
                {readinessDimensions.length > 0 && (
                  <Button asChild variant="ghost" size="sm" className="mt-auto w-full justify-between gap-1.5">
                    <Link href="/readiness">
                      <BilingualText en={builderEn('full_readiness_report')} el={builderEl('full_readiness_report')} compact />
                      <ArrowRight className="icon-sm" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions card */}
            <Card className="min-w-0">
              <CardHeader className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">
                  <BilingualText en={builderEn('quick_actions')} el={builderEl('quick_actions')} compact />
                </CardTitle>
                <AIInsightButton
                  className="h-8 w-full sm:w-auto"
                  prompt={`Startup Builder is ${overallCompletion}% complete and ${overallReadiness}% ready. Documents: ${documents.map((d) => `${d.title} ${d.completionPercent}%`).join(', ') || 'none yet'}. Recommend the next artifact (Idea Core, BMC, interviews, pitch, MVP, financials) and draft the first section.`}
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {DEFAULT_DOC_TYPES.map(type => {
                  const existing = documents.find(d => d.type === type);
                  const labelEn = docLabelEn(type);
                  const labelEl = docLabelEl(type);
                  return (
                    <Button
                      key={type}
                      className="h-auto min-h-11 w-full justify-between rounded-xl px-3 py-2"
                      variant="outline"
                      onClick={() => {
                        if (existing) selectDocument(existing.id);
                        const tab = DOC_TO_TAB[type];
                        if (tab && onOpenStage) onOpenStage(tab);
                        else if (!existing) setShowCreateDocDialog(true);
                      }}
                    >
                      {/* The verb and the document name are one phrase, and
                          "Επεξεργασία Επιχειρηματικό μοντέλο" is 128px in a row
                          that gives it 79px at 1024px. Two lines rather than
                          "Edit Business Mo…". */}
                      <span className="flex min-w-0 items-start gap-2 text-left leading-snug">
                        <CfbGlyph name={docGlyph(type)} className="mt-0.5 icon-sm shrink-0 text-muted-foreground" />
                        <BilingualText
                          en={`${existing ? builderEn('edit') : builderEn('start')} ${labelEn}`}
                          el={`${existing ? builderEl('edit') : builderEl('start')} ${labelEl}`}
                          compact
                          wrap
                        />
                      </span>
                      {existing ? (
                        <Badge
                          variant="secondary"
                          className={cn('shrink-0 border text-xs', docStatusChip(existing.status))}
                        >
                          {existing.completionPercent}%
                        </Badge>
                      ) : (
                        <ChevronRight className="icon-sm shrink-0 text-muted-foreground" />
                      )}
                    </Button>
                  );
                })}

                {readinessAssessment?.blockers && readinessAssessment.blockers.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t pt-2">
                    <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                      <BilingualText en={builderEn('critical_gaps')} el={builderEl('critical_gaps')} compact />
                    </p>
                    {readinessAssessment.blockers.slice(0, 3).map((b, i) => (
                      <div key={i} className={cn('flex items-start gap-1.5 text-xs', STATUS.danger.text)}>
                        <AlertCircle className="icon-sm mt-0.5 shrink-0" />
                        <PreviewHint text={b} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {readinessAssessment?.nextMilestones && readinessAssessment.nextMilestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="spark" className={cn('icon-sm', STATUS.warning.icon)} />
                  <BilingualText en={builderEn('next_steps')} el={builderEl('next_steps')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {readinessAssessment.nextMilestones.slice(0, 6).map((milestone, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-sm">
                      <ChevronRight className="icon-sm mt-0.5 shrink-0 text-primary-accessible" />
                      <span className="text-muted-foreground"><PreviewHint text={milestone} /></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </div>

          {workspace && (
            <ActivityTimeline workspaceId={workspace.id} limit={15} />
          )}
        </TabsContent>

        {/* ── Documents Tab ─────────────────────────────────────────────── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          {isLoadingDocuments ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <CfbGlyph name="book" className="mx-auto mb-3 icon-lg text-muted-foreground/50" />
                <p className="mb-4 text-muted-foreground">
                  <BilingualText en={builderEn('no_docs')} el={builderEl('no_docs')} />
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" className={BUILDER_BTN} onClick={() => setShowCreateDocDialog(true)}>
                    <Plus className="icon-sm mr-2" />
                    <BilingualText en={builderEn('create_first')} el={builderEl('create_first')} compact />
                  </Button>
                  <AskAiButton
              labelEn={builderEn('ask_ai_plan')}
              labelEl={builderEl('ask_ai_plan')}
              prompt={`Startup Builder is ${overallCompletion}% complete and ${overallReadiness}% ready. Recommend the next artifact and draft the first section.`}
            />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map(doc => {
                const status = docStatus(doc);
                const sk = statusKey(status);
                return (
                  <Card
                    key={doc.id}
                    className="group cursor-pointer border-border/60 transition-colors hover:border-border hover:bg-muted/20"
                    onClick={() => selectDocument(doc.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <CfbGlyph name={docGlyph(doc.type)} className="icon-sm shrink-0 text-muted-foreground" />
                          <CardTitle className="truncate text-sm">{doc.title}</CardTitle>
                        </div>
                        <div className={cn('h-2 w-2 shrink-0 rounded-full', statusColor(status))} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {doc.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{doc.description}</p>
                      ) : builderDocDescription(doc.type, 'en') ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          <BilingualText
                            en={builderDocDescription(doc.type, 'en')}
                            el={builderDocDescription(doc.type, 'el')}
                          />
                        </p>
                      ) : null}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <BilingualText en={builderEn(sk)} el={builderEl(sk)} compact />
                          <span>{doc.completionPercent}%</span>
                        </div>
                        <Progress value={doc.completionPercent} className="h-1" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          v{doc.version}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary-accessible">
                          <BilingualText en={builderEn('open')} el={builderEl('open')} compact /> <ArrowRight className="icon-sm" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Card
                className="cursor-pointer border border-dashed border-border/50 bg-transparent transition-colors hover:border-border hover:bg-muted/30"
                onClick={() => setShowCreateDocDialog(true)}
              >
                <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <Plus className="icon-xl text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    <BilingualText en={builderEn('add_document')} el={builderEl('add_document')} compact />
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Collaboration Tab ─────────────────────────────────────────── */}
        <TabsContent value="collaboration" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="people" className="icon-sm" />
                  <BilingualText en={builderEn('team_members')} el={builderEl('team_members')} compact />
                </CardTitle>
                <Button size="sm" variant="outline" className={`${BUILDER_BTN} w-full sm:w-auto`} onClick={() => setShowInviteDialog(true)}>
                  <CfbGlyph name="people" className="icon-sm mr-1.5" />
                  <BilingualText en={builderEn('invite')} el={builderEl('invite')} compact />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {collaborators.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CfbGlyph name="people" className="mx-auto mb-3 icon-lg text-muted-foreground/50" />
                  <p className="mb-3 text-sm">
                    <BilingualText en={builderEn('no_collab')} el={builderEl('no_collab')} />
                  </p>
                  <Button size="sm" onClick={() => setShowInviteDialog(true)}>
                    <CfbGlyph name="people" className="icon-sm mr-1.5" />
                    <BilingualText en={builderEn('invite_first')} el={builderEl('invite_first')} compact />
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {collaborators.map(collab => {
                    const roleMeta = ROLE_META[collab.role] ?? ROLE_META.viewer;
                    const RoleIcon = roleMeta.icon;
                    return (
                      <div key={collab.id} className="flex items-center justify-between py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={collab.user.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {(collab.user?.displayName ?? 'U').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {collab.user?.displayName ?? collab.user.email}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{collab.user.email}</div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn('flex items-center gap-1 border px-2 text-xs', roleChip(collab.role))}
                          >
                            <RoleIcon className="h-2.5 w-2.5" />
                            <BilingualText en={builderEn(roleMeta.labelKey)} el={builderEl(roleMeta.labelKey)} compact />
                          </Badge>
                          {collab.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  aria-label={bilingualAria(builderEn('remove'), builderEl('remove'))}
                                >
                                  <MoreHorizontal className="icon-sm" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive-accessible"
                                  onClick={() => handleRemoveCollaborator(collab.id)}
                                >
                                  <Trash2 className="icon-sm mr-2" />
                                  <BilingualText en={builderEn('remove')} el={builderEl('remove')} compact />
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

          {workspace && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CfbGlyph name="sliders" className="icon-sm" />
                  <BilingualText en={builderEn('workspace_settings')} el={builderEl('workspace_settings')} compact />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      <BilingualText en={builderEn('startup')} el={builderEl('startup')} compact />
                    </span>
                    <span className="font-medium">{workspace.startupName ?? workspace.name}</span>
                  </div>
                  {workspace.industry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        <BilingualText en={builderEn('industry')} el={builderEl('industry')} compact />
                      </span>
                      <span className="font-medium capitalize">{workspace.industry}</span>
                    </div>
                  )}
                  {workspace.stage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        <BilingualText en={builderEn('stage')} el={builderEl('stage')} compact />
                      </span>
                      <Badge variant="secondary" className="text-xs capitalize">{workspace.stage}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      <BilingualText en={builderEn('visibility')} el={builderEl('visibility')} compact />
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">{workspace.visibility}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Readiness Tab ─────────────────────────────────────────────── */}
        <TabsContent value="readiness" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm leading-snug text-muted-foreground">
                {readinessAssessment
                  ? (
                    <BilingualText
                      en={`${builderEn('overall_readiness_line')}: ${readinessAssessment.readinessLevel} — ${overallReadiness}%`}
                      el={`${builderEl('overall_readiness_line')}: ${readinessAssessment.readinessLevel} — ${overallReadiness}%`}
                    />
                  )
                  : <BilingualText en={builderEn('run_to_see')} el={builderEl('run_to_see')} />}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AskAiButton />
              <Button
                size="sm"
                variant="outline"
                className={`${BUILDER_BTN} w-full shrink-0 sm:w-auto`}
                onClick={handleReassess}
                disabled={assessingReadiness}
              >
                {assessingReadiness ? (
                  <Loader2 className="icon-sm mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="icon-sm mr-1.5" />
                )}
                <BilingualText
                  en={assessingReadiness ? builderEn('assessing_short') : builderEn('reassess')}
                  el={assessingReadiness ? builderEl('assessing_short') : builderEl('reassess')}
                  compact
                />
              </Button>
            </div>
          </div>

          {readinessAssessment && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">
                      <BilingualText en={builderEn('overall_readiness')} el={builderEl('overall_readiness')} compact />
                    </span>
                    <span className={cn('font-bold', dimensionColor(overallReadiness))}>{overallReadiness}%</span>
                  </div>
                  <Progress value={overallReadiness} className="h-3" />
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 capitalize px-3 py-1 text-sm', dimensionColor(overallReadiness))}
                >
                  {readinessAssessment.readinessLevel}
                </Badge>
              </CardContent>
            </Card>
          )}

          {assessingReadiness ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          ) : readinessDimensions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {readinessDimensions.map(dim => (
                <Card key={dim.dimension} className="transition-colors hover:border-border">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        <DimensionLabel d={dim.dimension} />
                      </div>
                      <div className={cn('text-lg font-bold', dimensionColor(dim.score))}>{dim.score}%</div>
                    </div>
                    <Progress value={dim.score} className="h-1.5" />
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize border', readinessStatusChip(dim.status ?? ''))}
                    >
                      {dim.status?.replace('-', ' ')}
                    </Badge>
                    {dim.recommendations && dim.recommendations.length > 0 && (
                      <div className="space-y-1 border-t border-border/40 pt-1">
                        {dim.recommendations.slice(0, 2).map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <ChevronRight className="icon-sm mt-0.5 shrink-0 text-primary-accessible" />
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
                <CfbGlyph name="chart" className="mx-auto mb-3 icon-lg text-muted-foreground/50" />
                <p className="mb-3 text-sm text-muted-foreground">
                  <BilingualText en={builderEn('no_readiness')} el={builderEl('no_readiness')} />
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={handleReassess} disabled={assessingReadiness}>
                    {assessingReadiness ? <Loader2 className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="chart" className="icon-sm mr-2" />}
                    <BilingualText en={builderEn('run_assessment')} el={builderEl('run_assessment')} compact />
                  </Button>
                  <AskAiButton
              labelEn={builderEn('ask_ai_plan')}
              labelEl={builderEl('ask_ai_plan')}
              prompt={`Startup Builder is ${overallCompletion}% complete and ${overallReadiness}% ready. Recommend the next artifact and draft the first section.`}
            />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
