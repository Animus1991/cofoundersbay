'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  RefreshCw,
  Copy,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { PageRail, type PageRailSection } from '@/components/layout/PageRail';
import { BUILDER_BTN, BuilderStageHeader, useBuilderPrimaryText } from './BuilderStageChrome';
import { ApplicationProgramsChrome } from './ApplicationProgramsChrome';
import {
  deriveApplicationStatus,
  mergeEmptyApplicationAnswers,
  mergeSavedApplications,
  pickGeneratedAnswers,
  requiredCompletion,
  type ApplicationTemplate,
} from './application-model';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import {
  applicationQuestionCopy,
  applicationTipCopy,
} from '@/lib/i18n/strings-application-questions';
import { bilingualAria } from '@/lib/i18n/format';
import { useToast } from '@/components/ui/toast';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';

interface ApplicationGeneratorProps {
  onSave?: (data: ApplicationTemplate[]) => void | Promise<void>;
  onGenerate?: (app: ApplicationTemplate) => Promise<unknown>;
  workspaceData?: Record<string, unknown>;
  initialData?: unknown;
  hideTitle?: boolean;
  /** Dedicated /builder/applications page: stats and program picker live in the rail. */
  pageRail?: boolean;
  /** Extra rail families from the host page (linked destinations). */
  extraSections?: PageRailSection[];
  contentRevision?: string;
}

export {
  deriveApplicationStatus,
  mergeSavedApplications,
  requiredCompletion,
} from './application-model';
export type { ApplicationTemplate } from './application-model';

function applicationsEqual(a: ApplicationTemplate, b: ApplicationTemplate): boolean {
  return JSON.stringify(a.questions.map((q) => q.answer)) === JSON.stringify(b.questions.map((q) => q.answer))
    && a.status === b.status;
}

function programAskPrompt(app: ApplicationTemplate): string {
  const empty = app.questions.filter((q) => !q.answer.trim()).map((q) => q.id);
  return [
    `Draft empty ${app.name} answers from Idea Core, the GTM board, and Harbor's $750K seed (Athens Tech Angels, $375K committed).`,
    'Fill only empty fields.',
    empty.length
      ? `Start with the ${empty.length} empty ${empty.length === 1 ? 'answer' : 'answers'}.`
      : 'Every required field has text — propose what to tighten, do not overwrite.',
  ].join(' ');
}

function questionAskPrompt(app: ApplicationTemplate, questionEn: string, filled: boolean): string {
  return filled
    ? `Tighten this ${app.name} answer: ${questionEn}`
    : `Draft an answer to this ${app.name} question from Idea Core and the $750K seed: ${questionEn}`;
}

export function ApplicationGenerator({
  onSave,
  onGenerate,
  initialData,
  hideTitle = false,
  pageRail = false,
  extraSections,
  contentRevision,
}: ApplicationGeneratorProps) {
  const t = useBuilderPrimaryText();
  const { success, error: toastError } = useToast();
  const { ask } = usePopupChat();
  const [applications, setApplications] = useState<ApplicationTemplate[]>(() => mergeSavedApplications(initialData));
  const [activeApp, setActiveApp] = useState<string>('yc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingQuestionId, setGeneratingQuestionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setApplications(mergeSavedApplications(initialData));
    // Reload when the document version changes (save / restore), not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRevision]);

  const currentApp = applications.find((a) => a.id === activeApp);

  const generateWithAI = async () => {
    if (!currentApp) return;
    if (!onGenerate) {
      ask(programAskPrompt(currentApp));
      return;
    }
    setIsGenerating(true);
    try {
      const raw = await onGenerate(currentApp);
      if (raw == null) {
        toastError('Could not generate');
        return;
      }
      const incoming = pickGeneratedAnswers(raw);
      const merged = mergeEmptyApplicationAnswers(currentApp, incoming);
      if (applicationsEqual(currentApp, merged)) {
        success('Nothing to change');
        return;
      }
      setApplications((prev) => prev.map((app) => (app.id === currentApp.id ? merged : app)));
      success('Draft filled empty answers only.');
    } catch {
      toastError('Could not generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOneAnswer = async (questionId: string, promptEn: string) => {
    if (!currentApp) return;
    const question = currentApp.questions.find((q) => q.id === questionId);
    if (!question) return;
    if (question.answer.trim()) {
      ask(questionAskPrompt(currentApp, promptEn, true));
      return;
    }
    if (!onGenerate) {
      ask(questionAskPrompt(currentApp, promptEn, false));
      return;
    }
    setGeneratingQuestionId(questionId);
    try {
      const raw = await onGenerate(currentApp);
      if (raw == null) {
        toastError('Could not generate');
        return;
      }
      const incoming = pickGeneratedAnswers(raw);
      const draft = incoming[questionId];
      if (!draft?.trim()) {
        ask(questionAskPrompt(currentApp, promptEn, false));
        return;
      }
      const merged = mergeEmptyApplicationAnswers(currentApp, { [questionId]: draft });
      setApplications((prev) => prev.map((app) => (app.id === currentApp.id ? merged : app)));
      success('Draft filled empty answers only.');
    } catch {
      toastError('Could not generate');
    } finally {
      setGeneratingQuestionId(null);
    }
  };

  const updateAnswer = (questionId: string, answer: string) => {
    setApplications((prev) => prev.map((app) => {
      if (app.id !== activeApp) return app;
      const next: ApplicationTemplate = {
        ...app,
        questions: app.questions.map((q) =>
          q.id === questionId ? { ...q, answer } : q,
        ),
      };
      return { ...next, status: deriveApplicationStatus(next) };
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopiedId(id);
    success('Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(applications);
      success('Applications saved', 'Written to the workspace artefact.');
    } catch {
      toastError('Could not save');
    } finally {
      setIsSaving(false);
    }
  };

  const markSubmitted = async () => {
    if (!currentApp || requiredCompletion(currentApp) < 100) return;
    const nextList = applications.map((app) => (
      app.id === activeApp ? { ...app, status: 'submitted' as const } : app
    ));
    setApplications(nextList);
    try {
      await onSave?.(nextList);
      success('Marked submitted', 'The programme stays in this workspace artefact.');
    } catch {
      toastError('Could not save');
    }
  };

  usePageControls([
    choiceControl(
      'active_program',
      'Active program',
      'Ενεργό πρόγραμμα',
      applications.map((app) => ({ value: app.id, en: app.name, el: app.name })),
      activeApp,
      setActiveApp,
    ),
    {
      id: 'save_applications',
      labelEn: 'Save programme applications',
      labelEl: 'Αποθήκευση αιτήσεων προγράμματος',
      writes: true,
      options: [{ value: 'all', labelEn: 'All four templates', labelEl: 'Και τα τέσσερα πρότυπα' }],
      run: () => { void handleSave(); },
    },
  ]);
  usePageList([
    {
      id: 'applications',
      labelEn: 'Programme applications',
      labelEl: 'Αιτήσεις σε προγράμματα',
      rows: applications.map((app) =>
        `${app.name} · ${deriveApplicationStatus(app)} · ${requiredCompletion(app)}% of required answers${app.id === activeApp ? ' · open' : ''}`,
      ),
      total: applications.length,
    },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'progress',
      glyph: 'chart',
      labelEn: 'Application progress',
      labelEl: 'Πρόοδος αιτήσεων',
      content: (
        <ApplicationProgramsChrome
          applications={applications}
          activeApp={activeApp}
          onSelect={setActiveApp}
          layout="rail"
          part="stats"
        />
      ),
    },
    {
      id: 'programs',
      glyph: 'applications',
      labelEn: 'Programs',
      labelEl: 'Προγράμματα',
      badge: applications.filter((app) => app.status === 'in-progress' || app.status === 'completed' || app.status === 'submitted').length || null,
      content: (
        <ApplicationProgramsChrome
          applications={applications}
          activeApp={activeApp}
          onSelect={setActiveApp}
          layout="rail"
          part="picker"
        />
      ),
    },
  ];

  return (
    <>
      {pageRail ? <PageRail sections={[...rail, ...(extraSections ?? [])]} /> : null}
    <div className="space-y-6">
      <BuilderStageHeader
        glyph="applications"
        titleEn={builderEn('app_title')}
        titleEl={builderEl('app_title')}
        subtitleEn={builderEn('app_sub')}
        subtitleEl={builderEl('app_sub')}
        hideTitle={hideTitle}
        showAskAi={!hideTitle}
        askPrompt={currentApp ? programAskPrompt(currentApp) : undefined}
        extraActions={
          <>
            <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={() => void generateWithAI()} disabled={isGenerating || isSaving}>
              {isGenerating ? <RefreshCw className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="spark" className="icon-sm mr-2" />}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_generate')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_generate')}
                compact
              />
            </Button>
            <Button size="sm" className={BUILDER_BTN} onClick={() => void handleSave()} disabled={isSaving || isGenerating}>
              <Save className="icon-sm mr-2" />
              <BilingualText en={builderEn('app_save_all')} el={builderEl('app_save_all')} compact />
            </Button>
          </>
        }
      />

      {!pageRail && (
        <ApplicationProgramsChrome
          applications={applications}
          activeApp={activeApp}
          onSelect={setActiveApp}
          layout="cards"
        />
      )}

      {currentApp && (
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CfbGlyph name={currentApp.glyph} className="icon-sm shrink-0 text-primary-accessible" />
                <div>
                  <CardTitle>
                    {currentApp.name}{' '}
                    <BilingualText en={builderEn('app_application')} el={builderEl('app_application')} compact />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentApp.questions.length}{' '}
                    <BilingualText en={builderEn('app_questions')} el={builderEl('app_questions')} compact />
                    {' · '}
                    {requiredCompletion(currentApp)}% <BilingualText en={builderEn('complete')} el={builderEl('complete')} compact />
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {requiredCompletion(currentApp) === 100 && currentApp.status !== 'submitted' && (
                  <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={() => void markSubmitted()}>
                    <CheckCircle2 className="icon-sm mr-2" />
                    <BilingualText en={builderEn('app_mark_submitted')} el={builderEl('app_mark_submitted')} compact />
                  </Button>
                )}
                {currentApp.website && (
                  <Button asChild variant="outline" size="sm" className={BUILDER_BTN}>
                    {currentApp.website.startsWith('http') ? (
                      <a
                        href={currentApp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={bilingualAria(builderEn('app_view'), builderEl('app_view'))}
                      >
                        <ExternalLink className="icon-sm mr-2" />
                        <BilingualText en={builderEn('app_view')} el={builderEl('app_view')} compact />
                      </a>
                    ) : (
                      <Link
                        href={currentApp.website}
                        aria-label={bilingualAria(builderEn('app_view'), builderEl('app_view'))}
                      >
                        <ExternalLink className="icon-sm mr-2" />
                        <BilingualText en={builderEn('app_view')} el={builderEl('app_view')} compact />
                      </Link>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentApp.questions.map((question, index) => {
              const prompt = applicationQuestionCopy(question.id, question.question);
              const tip = applicationTipCopy(question.id, question.tips);
              const busy = generatingQuestionId === question.id;
              return (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Label className="flex items-start gap-2">
                      <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <BilingualText en={prompt.en} el={prompt.el} />
                        {question.required && <span className="ml-1 text-status-danger">*</span>}
                      </span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={BUILDER_BTN}
                        aria-label={bilingualAria(builderEn('app_ask_fill'), builderEl('app_ask_fill'))}
                        disabled={busy || isGenerating}
                        onClick={() => void generateOneAnswer(question.id, prompt.en)}
                      >
                        {busy ? <RefreshCw className="icon-sm animate-spin" /> : <CfbGlyph name="spark" className="icon-sm" />}
                        <span className="sr-only">
                          <BilingualText en={builderEn('app_ask_fill')} el={builderEl('app_ask_fill')} compact />
                        </span>
                      </Button>
                      {question.answer && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={BUILDER_BTN}
                          onClick={() => copyToClipboard(question.answer, question.id)}
                          aria-label={copiedId === question.id
                            ? bilingualAria('Answer copied', 'Η απάντηση αντιγράφηκε')
                            : bilingualAria('Copy this answer', 'Αντιγραφή απάντησης')}
                          title={copiedId === question.id
                            ? bilingualAria('Answer copied', 'Η απάντηση αντιγράφηκε')
                            : bilingualAria('Copy this answer', 'Αντιγραφή απάντησης')}
                        >
                          {copiedId === question.id ? (
                            <CheckCircle2 className="icon-sm text-status-success" aria-hidden="true" />
                          ) : (
                            <Copy className="icon-sm" aria-hidden="true" />
                          )}
                        </Button>
                      )}
                      {question.maxLength && (
                        <Badge variant="outline" className="rounded-xl text-xs">
                          {question.answer.length}/{question.maxLength}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Textarea
                    value={question.answer}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder={t(builderEn('app_answer_ph'), builderEl('app_answer_ph'))}
                    className={cn(
                      'min-h-[100px] rounded-xl',
                      question.maxLength && question.answer.length > question.maxLength && 'border-status-danger',
                    )}
                    maxLength={question.maxLength ? question.maxLength * 1.5 : undefined}
                  />

                  {tip && (
                    <p className="flex items-start gap-1 text-xs text-muted-foreground">
                      <CfbGlyph name="spark" className="icon-sm mt-0.5 shrink-0" />
                      <BilingualText en={tip.en} el={tip.el} />
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
