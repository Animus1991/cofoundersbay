'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, CfbGlyphWell, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BuilderAskAiButton, BuilderStageHeader, useBuilderPrimaryText } from './BuilderStageChrome';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { bilingualAria } from '@/lib/i18n/format';
import { AIInsightButton } from '@/components/ai/AIInsightButton';
import { useToast } from '@/components/ui/toast';

interface Slide {
  id: string;
  type: string;
  title: string;
  content: string;
  notes: string;
  order: number;
}

interface PitchDeckData {
  deckType: 'investor' | 'accelerator' | 'cofounder' | 'grant' | 'competition';
  slides: Slide[];
  companyName: string;
  tagline: string;
  askAmount: string;
  useOfFunds: string[];
}

interface PitchDeckBuilderProps {
  onSave?: (data: PitchDeckData) => void;
  initialData?: Partial<PitchDeckData> | { pitchDeck?: Partial<PitchDeckData> };
  /** Dedicated `/builder/pitch-deck` route — AppShell already shows the title. */
  hideTitle?: boolean;
  workspaceName?: string;
  ideaCore?: Record<string, unknown>;
  askPrompt?: string;
}

function unwrapPitchDeck(
  raw?: Partial<PitchDeckData> | { pitchDeck?: Partial<PitchDeckData> },
): Partial<PitchDeckData> {
  if (!raw || typeof raw !== 'object') return {};
  if (Array.isArray((raw as PitchDeckData).slides)) return raw as Partial<PitchDeckData>;
  const nested = (raw as { pitchDeck?: Partial<PitchDeckData> }).pitchDeck;
  if (nested && typeof nested === 'object') return nested;
  return raw as Partial<PitchDeckData>;
}

const SLIDE_TEMPLATES: { type: string; titleKey: 'slide_cover' | 'slide_problem' | 'slide_solution' | 'slide_market' | 'slide_product' | 'slide_traction' | 'slide_bmc' | 'slide_comp' | 'slide_team' | 'slide_fin' | 'slide_ask' | 'slide_close'; glyph: CfbGlyphName }[] = [
  { type: 'cover', titleKey: 'slide_cover', glyph: 'builder' },
  { type: 'problem', titleKey: 'slide_problem', glyph: 'target' },
  { type: 'solution', titleKey: 'slide_solution', glyph: 'spark' },
  { type: 'market', titleKey: 'slide_market', glyph: 'chart' },
  { type: 'product', titleKey: 'slide_product', glyph: 'flag' },
  { type: 'traction', titleKey: 'slide_traction', glyph: 'award' },
  { type: 'business-model', titleKey: 'slide_bmc', glyph: 'wallet' },
  { type: 'competition', titleKey: 'slide_comp', glyph: 'shield' },
  { type: 'team', titleKey: 'slide_team', glyph: 'people' },
  { type: 'financials', titleKey: 'slide_fin', glyph: 'wallet' },
  { type: 'ask', titleKey: 'slide_ask', glyph: 'target' },
  { type: 'closing', titleKey: 'slide_close', glyph: 'builder' },
];

const defaultPitchDeckData: PitchDeckData = {
  deckType: 'investor',
  slides: [],
  companyName: '',
  tagline: '',
  askAmount: '',
  useOfFunds: []
};

export function PitchDeckBuilder({
  onSave,
  initialData,
  hideTitle = false,
  workspaceName,
  ideaCore,
  askPrompt,
}: PitchDeckBuilderProps) {
  const t = useBuilderPrimaryText();
  const { success } = useToast();
  const didHydrate = useRef(false);
  const [data, setData] = useState<PitchDeckData>({
    ...defaultPitchDeckData,
    ...unwrapPitchDeck(initialData),
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (didHydrate.current) return;
    const next = unwrapPitchDeck(initialData);
    const hasPayload = Boolean(
      next.slides?.length || next.companyName || next.tagline || next.askAmount || next.useOfFunds?.length,
    );
    if (!hasPayload) return;
    didHydrate.current = true;
    setData({ ...defaultPitchDeckData, ...next });
  }, [initialData]);

  useEffect(() => {
    const filledSlides = data.slides.filter((s) => s.content.trim().length > 0).length;
    const totalSlides = Math.max(data.slides.length, 1);
    setCompletionPercentage((filledSlides / totalSlides) * 100);
  }, [data.slides]);

  useEffect(() => {
    if (!data.companyName && workspaceName) {
      setData((prev) => (prev.companyName ? prev : { ...prev, companyName: workspaceName }));
    }
  }, [workspaceName, data.companyName]);

  const generateWithAI = async () => {
    setIsGenerating(true);
    const name = data.companyName || workspaceName || 'Your startup';
    const problem = typeof ideaCore?.problemStatement === 'string' && ideaCore.problemStatement.trim()
      ? ideaCore.problemStatement
      : null;
    const solution = typeof ideaCore?.solution === 'string' && ideaCore.solution.trim()
      ? ideaCore.solution
      : null;
    const unique = typeof ideaCore?.uniqueValue === 'string' && ideaCore.uniqueValue.trim()
      ? ideaCore.uniqueValue
      : null;

    setTimeout(() => {
      const generatedSlides: Slide[] = SLIDE_TEMPLATES.map((template, index) => ({
        id: `slide-${index}`,
        type: template.type,
        title: builderEn(template.titleKey),
        content: getGeneratedContent(template.type, { name, problem, solution, unique }),
        notes: getGeneratedNotes(template.type),
        order: index
      }));

      setData(prev => ({
        ...prev,
        slides: generatedSlides,
        companyName: prev.companyName || name,
        tagline: prev.tagline || unique || 'Where Great Teams Are Built',
        askAmount: prev.askAmount || '$500,000',
        useOfFunds: prev.useOfFunds.length ? prev.useOfFunds : [
          'Product Development (40%)',
          'Marketing & Growth (30%)',
          'Team Expansion (20%)',
          'Operations (10%)'
        ]
      }));
      setIsGenerating(false);
    }, 3000);
  };

  const getGeneratedContent = (
    type: string,
    ctx: { name: string; problem: string | null; solution: string | null; unique: string | null },
  ): string => {
    const contents: Record<string, string> = {
      'cover': `${ctx.name}\n\n${ctx.unique || 'Where Great Teams Are Built'}\n\nAI-Powered Startup Formation & Execution Platform`,
      'problem': ctx.problem
        ? ctx.problem
        : '• 90% of startups fail, and 23% fail due to team issues\n• Finding the right co-founder is like finding a needle in a haystack\n• No structured way to validate team compatibility before committing\n• Founders waste months on misaligned partnerships',
      'solution': ctx.solution
        ? ctx.solution
        : '• AI-powered co-founder matching based on complementary skills and goals\n• Shared startup workspaces for collaborative execution\n• AI-generated startup documents (BMC, pitch decks, market analysis)\n• Readiness scoring and progress tracking\n• Mentor and accelerator ecosystem integration',
      'market': 'TAM: $50B - Global startup ecosystem tools\nSAM: $8B - English-speaking markets\nSOM: $200M - First 3 years focus\n\n• 500M+ aspiring entrepreneurs globally\n• Growing remote work enabling global team formation\n• AI tools adoption accelerating in startup space',
      'product': '• Intelligent Matching Engine - Find complementary co-founders\n• Startup Builder Workspace - Collaborative document creation\n• AI Document Generation - BMC, pitch decks, market analysis\n• Readiness Assessment - Track startup maturity\n• Ecosystem Integration - Mentors, accelerators, universities',
      'traction': '• 1,000+ registered users\n• 150+ successful co-founder matches\n• 50+ startup workspaces created\n• 85% user satisfaction rate\n• 15% month-over-month growth\n• Featured in TechCrunch, Product Hunt',
      'business-model': 'Freemium SaaS Model:\n\n• Free: Basic matching, limited workspace\n• Pro ($49/mo): Full AI generation, unlimited workspaces\n• Enterprise ($999/mo): Organization features, white-label\n• AI Packs: Pay-per-use document generation\n\nTarget: 80% gross margin',
      'competition': 'Direct Competitors:\n• Founder2be - Limited features, no AI\n• CoFoundersLab - Outdated UX, no execution tools\n\nOur Advantages:\n• Only platform combining matching + execution\n• AI-native architecture\n• Ecosystem integration (mentors, accelerators)',
      'team': '• CEO - 10+ years startup experience, 2 exits\n• CTO - Ex-Google, AI/ML expertise\n• CPO - Former product lead at Stripe\n• Advisors from Y Combinator, Sequoia',
      'financials': 'Projections (Year 1-3):\n\nYear 1: $150K ARR, 500 paid users\nYear 2: $800K ARR, 2,500 paid users\nYear 3: $3M ARR, 10,000 paid users\n\nUnit Economics:\n• CAC: $50 | LTV: $400 | LTV/CAC: 8x\n• Payback: 3 months | Gross Margin: 80%',
      'ask': 'Raising: $500,000 Seed Round\n\nUse of Funds:\n• Product Development (40%) - AI features, mobile app\n• Marketing & Growth (30%) - User acquisition, content\n• Team Expansion (20%) - Engineering, sales\n• Operations (10%) - Infrastructure, legal',
      'closing': `${ctx.name}\n\nBuilding the future of startup team formation\n\nContact: founders@cofounderbay.com\nWebsite: cofounderbay.com\n\nLet's build something great together.`
    };
    return contents[type] || '';
  };

  const getGeneratedNotes = (type: string): string => {
    const notes: Record<string, string> = {
      'cover': 'Keep this slide simple and impactful. 5 seconds to capture attention.',
      'problem': 'Make the problem relatable. Use specific data points.',
      'solution': 'Focus on the unique value proposition. Show, don\'t just tell.',
      'market': 'Be realistic with numbers. Investors will verify.',
      'product': 'Consider a live demo if possible. Screenshots are good backup.',
      'traction': 'Lead with your strongest metrics. Be honest about stage.',
      'business-model': 'Show path to profitability. Unit economics matter.',
      'competition': 'Acknowledge competitors. Show why you win.',
      'team': 'Highlight relevant experience. Show why this team can execute.',
      'financials': 'Be conservative. Show you understand the business.',
      'ask': 'Be specific about use of funds. Show 18-24 month runway.',
      'closing': 'End with a clear call to action. Make it easy to follow up.'
    };
    return notes[type] || '';
  };

  const addSlide = (type: string) => {
    const template = SLIDE_TEMPLATES.find(t => t.type === type);
    if (!template) return;
    
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: template.type,
      title: builderEn(template.titleKey),
      content: '',
      notes: '',
      order: data.slides.length
    };
    
    setData(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
    setCurrentSlideIndex(data.slides.length);
  };

  const updateSlide = (field: keyof Slide, value: string) => {
    setData(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === currentSlideIndex ? { ...slide, [field]: value } : slide
      )
    }));
  };

  const removeSlide = (index: number) => {
    setData(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index)
    }));
    if (currentSlideIndex >= data.slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, data.slides.length - 2));
    }
  };

  const moveSlide = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= data.slides.length) return;
    
    const newSlides = [...data.slides];
    [newSlides[fromIndex], newSlides[toIndex]] = [newSlides[toIndex], newSlides[fromIndex]];
    setData(prev => ({ ...prev, slides: newSlides }));
    setCurrentSlideIndex(toIndex);
  };

  const handleSave = () => {
    onSave?.(data);
  };

  const handleExport = () => {
    const heading = data.companyName.trim() || 'Pitch Deck';
    const parts = [
      `# ${heading}`,
      data.tagline,
      data.askAmount ? `Ask: ${data.askAmount}` : '',
      data.useOfFunds.filter((line) => line.trim()).length
        ? `Use of funds:\n${data.useOfFunds.filter((line) => line.trim()).map((line) => `- ${line}`).join('\n')}`
        : '',
      ...data.slides.map((slide, index) => {
        const notes = slide.notes.trim() ? `\n\n_Notes:_ ${slide.notes}` : '';
        return `## ${index + 1}. ${slide.title}\n\n${slide.content}${notes}`;
      }),
    ].filter((block) => block && block.trim().length > 0);

    const blob = new Blob([parts.join('\n\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const slug = heading.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'pitch-deck';
    anchor.href = url;
    anchor.download = `${slug}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    success(t(builderEn('pitch_exported'), builderEl('pitch_exported')));
  };

  const copilotPrompt = askPrompt
    ?? `Help me build a ${data.deckType} pitch deck for ${data.companyName || workspaceName || 'this startup'} with ${data.slides.length} slides. Draft Cover and Problem from the Idea Core.`;

  const currentSlide = data.slides[currentSlideIndex];

  const renderSlideTitle = (slide: Slide) => {
    const template = SLIDE_TEMPLATES.find((item) => item.type === slide.type);
    if (template && slide.title === builderEn(template.titleKey)) {
      return <BilingualText en={builderEn(template.titleKey)} el={builderEl(template.titleKey)} compact />;
    }
    return slide.title;
  };

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <BuilderStageHeader
        glyph="builder"
        titleEn={builderEn('tab_pitch')}
        titleEl={builderEl('tab_pitch')}
        subtitleEn={builderEn('pitch_lead')}
        subtitleEl={builderEl('pitch_lead')}
        hideTitle={hideTitle}
        showAskAi={!hideTitle}
        completion={hideTitle ? undefined : completionPercentage}
        extraActions={
          <>
            <Badge variant="outline" className="gap-1.5 rounded-xl text-xs">
              {data.slides.length}{' '}
              <BilingualText en={builderEn('pitch_slides_n')} el={builderEl('pitch_slides_n')} compact />
            </Badge>
            <select
              value={data.deckType}
              onChange={(e) => setData((prev) => ({ ...prev, deckType: e.target.value as PitchDeckData['deckType'] }))}
              className="h-8 rounded-xl border bg-background px-3 text-sm"
              aria-label={bilingualAria(builderEn('pitch_investor'), builderEl('pitch_investor'))}
            >
              <option value="investor">{t(builderEn('pitch_investor'), builderEl('pitch_investor'))}</option>
              <option value="accelerator">{t(builderEn('pitch_accel'), builderEl('pitch_accel'))}</option>
              <option value="cofounder">{t(builderEn('pitch_cofounder'), builderEl('pitch_cofounder'))}</option>
              <option value="grant">{t(builderEn('pitch_grant'), builderEl('pitch_grant'))}</option>
              <option value="competition">{t(builderEn('pitch_comp'), builderEl('pitch_comp'))}</option>
            </select>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={generateWithAI} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="spark" className="icon-sm mr-2" />}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_generate')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_generate')}
                compact
              />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport}>
              <Download className="icon-sm mr-2" />
              <BilingualText en={builderEn('pitch_export')} el={builderEl('pitch_export')} compact />
            </Button>
            <Button size="sm" className="rounded-xl" onClick={handleSave}>
              <Save className="icon-sm mr-2" />
              <BilingualText en={builderEn('save')} el={builderEl('save')} compact />
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">
            <BilingualText en={builderEn('pitch_complete')} el={builderEl('pitch_complete')} compact />
          </span>
          <span className="tabular-nums text-muted-foreground">{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-3 rounded-full" />
        <p className="text-xs text-muted-foreground">
          <BilingualText en={builderEn('pitch_complete_hint')} el={builderEl('pitch_complete_hint')} />
        </p>
      </div>

      {/* Main Content */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-4">
        {/* Slide Navigator */}
        <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-1">
          <Card className="min-w-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                <BilingualText en={builderEn('pitch_slides')} el={builderEl('pitch_slides')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[min(40vh,320px)] space-y-1 overflow-y-auto p-2 lg:max-h-[400px]">
              {data.slides.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  <BilingualText en={builderEn('pitch_no_slides_list')} el={builderEl('pitch_no_slides_list')} />
                </p>
              ) : (
                data.slides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    className={cn(
                      'group flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left',
                      index === currentSlideIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                    )}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-5 shrink-0 font-mono text-xs">{index + 1}</span>
                      <span className="truncate text-sm">{renderSlideTitle(slide)}</span>
                    </div>
                    <div
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        slide.content.trim() ? 'bg-status-success' : 'bg-muted-foreground/30',
                      )}
                    />
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Add Slide */}
          <Card className="min-w-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">
                <BilingualText en={builderEn('pitch_add')} el={builderEl('pitch_add')} compact />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid max-h-[200px] grid-cols-2 gap-1 overflow-y-auto p-2 sm:grid-cols-1">
              <p className="col-span-2 px-2 pb-1 text-2xs text-muted-foreground sm:col-span-1">
                <BilingualText en={builderEn('pitch_add_hint')} el={builderEl('pitch_add_hint')} />
              </p>
              {SLIDE_TEMPLATES.map((template) => {
                const exists = data.slides.some((s) => s.type === template.type);
                return (
                  <Button
                    key={template.type}
                    variant="ghost"
                    size="sm"
                    className={cn('h-auto min-h-11 w-full justify-start gap-2 rounded-xl px-2 py-2', exists && 'opacity-60')}
                    onClick={() => addSlide(template.type)}
                  >
                    <CfbGlyph name={template.glyph} className="icon-sm shrink-0" />
                    <span className="truncate text-xs">
                      <BilingualText en={builderEn(template.titleKey)} el={builderEl(template.titleKey)} compact />
                    </span>
                    {exists && (
                      <span className="ml-auto text-2xs text-muted-foreground">
                        <BilingualText en={builderEn('pitch_in_deck')} el={builderEl('pitch_in_deck')} compact />
                      </span>
                    )}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Slide Editor */}
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-3">
          {data.slides.length === 0 ? (
            <Card className="flex h-[500px] min-w-0 items-center justify-center">
              <div className="text-center">
                <CfbGlyphWell name="builder" size="lg" className="mx-auto mb-4 opacity-70" />
                <h3 className="mb-2 text-lg font-semibold">
                  <BilingualText en={builderEn('pitch_empty')} el={builderEl('pitch_empty')} />
                </h3>
                <p className="mb-4 max-w-sm text-sm leading-snug text-muted-foreground">
                  <BilingualText en={builderEn('pitch_empty_hint')} el={builderEl('pitch_empty_hint')} />
                </p>
                <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                  <AIInsightButton className="min-h-11 w-full" prompt={copilotPrompt} />
                  <Button className="min-h-11 w-full rounded-xl" onClick={generateWithAI} disabled={isGenerating}>
                    {isGenerating ? <RefreshCw className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="spark" className="icon-sm mr-2" />}
                    <BilingualText en={builderEn('pitch_gen_full')} el={builderEl('pitch_gen_full')} compact />
                  </Button>
                </div>
              </div>
            </Card>
          ) : currentSlide ? (
            <Card className="min-w-0">
              <CardHeader className="flex flex-col gap-3 space-y-0 p-3 sm:p-6">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    aria-label={bilingualAria(builderEn('pitch_prev'), builderEl('pitch_prev'))}
                  >
                    <ChevronLeft className="icon-sm" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {currentSlideIndex + 1}/{data.slides.length}
                      </span>
                      <Input
                        value={currentSlide.title}
                        onChange={(e) => updateSlide('title', e.target.value)}
                        className="h-10 w-full min-w-0 rounded-xl font-semibold"
                      />
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={() => setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === data.slides.length - 1}
                    aria-label={bilingualAria(builderEn('pitch_next'), builderEl('pitch_next'))}
                  >
                    <ChevronRight className="icon-sm" />
                  </Button>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10 rounded-xl"
                    onClick={() => moveSlide(currentSlideIndex, 'up')}
                    disabled={currentSlideIndex === 0}
                    aria-label={bilingualAria(builderEn('pitch_move_up'), builderEl('pitch_move_up'))}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10 rounded-xl"
                    onClick={() => moveSlide(currentSlideIndex, 'down')}
                    disabled={currentSlideIndex === data.slides.length - 1}
                    aria-label={bilingualAria(builderEn('pitch_move_down'), builderEl('pitch_move_down'))}
                  >
                    ↓
                  </Button>
                  <BuilderAskAiButton
                    labelEn={builderEn('pitch_ask_slide')}
                    labelEl={builderEl('pitch_ask_slide')}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10 rounded-xl"
                    onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                  >
                    <Eye className="icon-sm mr-1" />
                    <BilingualText
                      en={viewMode === 'edit' ? builderEn('pitch_preview') : builderEn('pitch_edit')}
                      el={viewMode === 'edit' ? builderEl('pitch_preview') : builderEl('pitch_edit')}
                      compact
                    />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="min-h-10 rounded-xl"
                    onClick={() => removeSlide(currentSlideIndex)}
                  >
                    <BilingualText en={builderEn('pitch_delete')} el={builderEl('pitch_delete')} compact />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6">
                {viewMode === 'edit' ? (
                  <>
                    <div>
                      <Label><BilingualText en={builderEn('pitch_content')} el={builderEl('pitch_content')} compact /></Label>
                      <Textarea
                        value={currentSlide.content}
                        onChange={(e) => updateSlide('content', e.target.value)}
                        placeholder={t(builderEn('pitch_content_ph'), builderEl('pitch_content_ph'))}
                        className="min-h-[180px] rounded-xl font-mono text-sm sm:min-h-[250px]"
                      />
                    </div>
                    <div>
                      <Label><BilingualText en={builderEn('pitch_notes')} el={builderEl('pitch_notes')} compact /></Label>
                      <Textarea
                        value={currentSlide.notes}
                        onChange={(e) => updateSlide('notes', e.target.value)}
                        placeholder={t(builderEn('pitch_notes_ph'), builderEl('pitch_notes_ph'))}
                        className="min-h-[80px] rounded-xl text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div className="min-h-[220px] rounded-xl bg-foreground p-6 text-background sm:min-h-[350px] sm:p-8">
                    <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">{currentSlide.title}</h2>
                    <div className="whitespace-pre-wrap text-base leading-relaxed sm:text-lg">
                      {currentSlide.content}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Deck Info */}
      <Card className="min-w-0">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base">
            <BilingualText en={builderEn('pitch_info')} el={builderEl('pitch_info')} compact />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            <BilingualText en={builderEn('pitch_info_hint')} el={builderEl('pitch_info_hint')} />
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0 space-y-1.5">
              <Label><BilingualText en={builderEn('pitch_company')} el={builderEl('pitch_company')} compact /></Label>
              <Input
                className="min-h-11 rounded-xl"
                value={data.companyName}
                onChange={(e) => setData((prev) => ({ ...prev, companyName: e.target.value }))}
                placeholder={t(builderEn('pitch_company_ph'), builderEl('pitch_company_ph'))}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label><BilingualText en={builderEn('pitch_tagline')} el={builderEl('pitch_tagline')} compact /></Label>
              <Input
                className="min-h-11 rounded-xl"
                value={data.tagline}
                onChange={(e) => setData((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder={t(builderEn('pitch_tagline_ph'), builderEl('pitch_tagline_ph'))}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label><BilingualText en={builderEn('pitch_ask')} el={builderEl('pitch_ask')} compact /></Label>
              <Input
                className="min-h-11 rounded-xl"
                value={data.askAmount}
                onChange={(e) => setData((prev) => ({ ...prev, askAmount: e.target.value }))}
                placeholder={t(builderEn('pitch_ask_ph'), builderEl('pitch_ask_ph'))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label><BilingualText en={builderEn('pitch_use_funds')} el={builderEl('pitch_use_funds')} compact /></Label>
            {data.useOfFunds.map((line, index) => (
              <div key={`fund-${index}`} className="flex gap-2">
                <Input
                  className="rounded-xl"
                  value={line}
                  onChange={(e) => {
                    const next = [...data.useOfFunds];
                    next[index] = e.target.value;
                    setData((prev) => ({ ...prev, useOfFunds: next }));
                  }}
                  placeholder={t(builderEn('pitch_use_funds_ph'), builderEl('pitch_use_funds_ph'))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label={bilingualAria(builderEn('remove'), builderEl('remove'))}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      useOfFunds: prev.useOfFunds.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <X className="icon-sm" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setData((prev) => ({ ...prev, useOfFunds: [...prev.useOfFunds, ''] }))}
            >
              <BilingualText en={builderEn('pitch_add_use')} el={builderEl('pitch_add_use')} compact />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
