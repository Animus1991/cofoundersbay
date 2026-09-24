'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { isPreviewDemo } from '@/lib/preview-demo';
import { fundraisingRoundView, fmtMoney } from '@/lib/fundraising-demo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageRail, type PageRailSection } from '@/components/layout/PageRail';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  X,
  Copy,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import {
  BUILDER_BTN,
  BUILDER_CARD_TITLE,
  BUILDER_STAT,
  BuilderAskAiButton,
  BuilderStageHeader,
  useBuilderPrimaryText,
} from './BuilderStageChrome';
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
  bmc?: Record<string, unknown>;
  askPrompt?: string;
}

type SlideTitleKey =
  | 'slide_cover'
  | 'slide_problem'
  | 'slide_solution'
  | 'slide_market'
  | 'slide_product'
  | 'slide_traction'
  | 'slide_bmc'
  | 'slide_comp'
  | 'slide_team'
  | 'slide_fin'
  | 'slide_ask'
  | 'slide_close';

type SlideHintKey =
  | 'hint_slide_cover'
  | 'hint_slide_problem'
  | 'hint_slide_solution'
  | 'hint_slide_market'
  | 'hint_slide_product'
  | 'hint_slide_traction'
  | 'hint_slide_bmc'
  | 'hint_slide_comp'
  | 'hint_slide_team'
  | 'hint_slide_fin'
  | 'hint_slide_ask'
  | 'hint_slide_close';

function unwrapPitchDeck(
  raw?: Partial<PitchDeckData> | { pitchDeck?: Partial<PitchDeckData> },
): Partial<PitchDeckData> {
  if (!raw || typeof raw !== 'object') return {};
  if (Array.isArray((raw as PitchDeckData).slides)) return raw as Partial<PitchDeckData>;
  const nested = (raw as { pitchDeck?: Partial<PitchDeckData> }).pitchDeck;
  if (nested && typeof nested === 'object') return nested;
  return raw as Partial<PitchDeckData>;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const SLIDE_TEMPLATES: {
  type: string;
  titleKey: SlideTitleKey;
  hintKey: SlideHintKey;
  glyph: CfbGlyphName;
}[] = [
  { type: 'cover', titleKey: 'slide_cover', hintKey: 'hint_slide_cover', glyph: 'builder' },
  { type: 'problem', titleKey: 'slide_problem', hintKey: 'hint_slide_problem', glyph: 'target' },
  { type: 'solution', titleKey: 'slide_solution', hintKey: 'hint_slide_solution', glyph: 'spark' },
  { type: 'market', titleKey: 'slide_market', hintKey: 'hint_slide_market', glyph: 'chart' },
  { type: 'product', titleKey: 'slide_product', hintKey: 'hint_slide_product', glyph: 'flag' },
  { type: 'traction', titleKey: 'slide_traction', hintKey: 'hint_slide_traction', glyph: 'award' },
  { type: 'business-model', titleKey: 'slide_bmc', hintKey: 'hint_slide_bmc', glyph: 'wallet' },
  { type: 'competition', titleKey: 'slide_comp', hintKey: 'hint_slide_comp', glyph: 'shield' },
  { type: 'team', titleKey: 'slide_team', hintKey: 'hint_slide_team', glyph: 'people' },
  { type: 'financials', titleKey: 'slide_fin', hintKey: 'hint_slide_fin', glyph: 'wallet' },
  { type: 'ask', titleKey: 'slide_ask', hintKey: 'hint_slide_ask', glyph: 'target' },
  { type: 'closing', titleKey: 'slide_close', hintKey: 'hint_slide_close', glyph: 'builder' },
];

const DECK_TYPES: {
  value: PitchDeckData['deckType'];
  labelKey: 'pitch_investor' | 'pitch_accel' | 'pitch_cofounder' | 'pitch_grant' | 'pitch_comp';
  hintKey:
    | 'pitch_type_hint_investor'
    | 'pitch_type_hint_accel'
    | 'pitch_type_hint_cofounder'
    | 'pitch_type_hint_grant'
    | 'pitch_type_hint_competition';
}[] = [
  { value: 'investor', labelKey: 'pitch_investor', hintKey: 'pitch_type_hint_investor' },
  { value: 'accelerator', labelKey: 'pitch_accel', hintKey: 'pitch_type_hint_accel' },
  { value: 'cofounder', labelKey: 'pitch_cofounder', hintKey: 'pitch_type_hint_cofounder' },
  { value: 'grant', labelKey: 'pitch_grant', hintKey: 'pitch_type_hint_grant' },
  { value: 'competition', labelKey: 'pitch_comp', hintKey: 'pitch_type_hint_competition' },
];

const defaultPitchDeckData: PitchDeckData = {
  deckType: 'investor',
  slides: [],
  companyName: '',
  tagline: '',
  askAmount: '',
  useOfFunds: [],
};

function snapshotOf(data: PitchDeckData) {
  return JSON.stringify(data);
}

export function PitchDeckBuilder({
  onSave,
  initialData,
  hideTitle = false,
  workspaceName,
  ideaCore,
  bmc,
  askPrompt,
}: PitchDeckBuilderProps) {
  const t = useBuilderPrimaryText();
  const { success } = useToast();
  const didHydrate = useRef(false);
  const savedRef = useRef(snapshotOf({ ...defaultPitchDeckData, ...unwrapPitchDeck(initialData) }));
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
    const merged = { ...defaultPitchDeckData, ...next };
    setData(merged);
    savedRef.current = snapshotOf(merged);
  }, [initialData]);

  useEffect(() => {
    const filledSlides = data.slides.filter((s) => s.content.trim().length > 0).length;
    const totalSlides = Math.max(data.slides.length, 1);
    setCompletionPercentage((filledSlides / totalSlides) * 100);
  }, [data.slides]);

  useEffect(() => {
    if (!data.companyName && workspaceName) {
      setData((prev) => {
        if (prev.companyName) return prev;
        const next = { ...prev, companyName: workspaceName };
        try {
          const saved = JSON.parse(savedRef.current) as PitchDeckData;
          if (!saved.companyName) savedRef.current = snapshotOf(next);
        } catch {
          savedRef.current = snapshotOf(next);
        }
        return next;
      });
    }
  }, [workspaceName, data.companyName]);

  /*
   * The ask follows the round the same way the company name follows the
   * workspace. /fundraising and the dashboard both say the showcase is raising
   * a $750K seed; this deck said "—" beside "Funding ask" on the same account,
   * which is the kind of contradiction between adjacent pages the product is
   * meant not to have. Demo only: the round model is the demo's, and seeding a
   * real founder's deck with a sample figure would be inventing their ask.
   * Same guard as the company name — never overwrite something typed.
   */
  useEffect(() => {
    if (data.askAmount || !isPreviewDemo()) return;
    const round = fundraisingRoundView();
    const ask = fmtMoney(round.target, round.currency);
    setData((prev) => {
      if (prev.askAmount) return prev;
      const next = { ...prev, askAmount: ask };
      try {
        const saved = JSON.parse(savedRef.current) as PitchDeckData;
        if (!saved.askAmount) savedRef.current = snapshotOf(next);
      } catch {
        savedRef.current = snapshotOf(next);
      }
      return next;
    });
  }, [data.askAmount]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (data.slides.length === 0) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentSlideIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentSlideIndex((index) => Math.min(data.slides.length - 1, index + 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data.slides.length]);

  const generateWithAI = async () => {
    setIsGenerating(true);
    const name = data.companyName || workspaceName || 'Your startup';
    const problem = asText(ideaCore?.problemStatement) || null;
    const solution = asText(ideaCore?.solution) || null;
    const unique = asText(ideaCore?.uniqueValue) || null;
    const proposition = asText(bmc?.valueProposition) || asText(bmc?.valuePropositions) || null;

    setTimeout(() => {
      setData((prev) => {
        const nextSlides = [...prev.slides];
        SLIDE_TEMPLATES.forEach((template) => {
          const existingIdx = nextSlides.findIndex((slide) => slide.type === template.type);
          const content = getGeneratedContent(template.type, {
            name,
            problem,
            solution,
            unique,
            proposition,
          });
          const notes = getGeneratedNotes(template.type);
          if (existingIdx === -1) {
            nextSlides.push({
              id: `slide-${Date.now()}-${template.type}`,
              type: template.type,
              title: builderEn(template.titleKey),
              content,
              notes,
              order: nextSlides.length,
            });
          } else if (!nextSlides[existingIdx].content.trim()) {
            nextSlides[existingIdx] = { ...nextSlides[existingIdx], content, notes };
          }
        });
        return {
          ...prev,
          slides: nextSlides,
          companyName: prev.companyName || name,
          tagline: prev.tagline || unique || 'Where Great Teams Are Built',
          askAmount: prev.askAmount || '$500,000',
          useOfFunds: prev.useOfFunds.length
            ? prev.useOfFunds
            : [
                'Product Development (40%)',
                'Marketing & Growth (30%)',
                'Team Expansion (20%)',
                'Operations (10%)',
              ],
        };
      });
      setIsGenerating(false);
    }, 3000);
  };

  const getGeneratedContent = (
    type: string,
    ctx: {
      name: string;
      problem: string | null;
      solution: string | null;
      unique: string | null;
      proposition: string | null;
    },
  ): string => {
    const contents: Record<string, string> = {
      cover: `${ctx.name}\n\n${ctx.unique || 'Where Great Teams Are Built'}\n\nAI-Powered Startup Formation & Execution Platform`,
      problem: ctx.problem
        ? ctx.problem
        : '• 90% of startups fail, and 23% fail due to team issues\n• Finding the right co-founder is like finding a needle in a haystack\n• No structured way to validate team compatibility before committing\n• Founders waste months on misaligned partnerships',
      solution: ctx.solution
        ? ctx.solution
        : '• AI-powered co-founder matching based on complementary skills and goals\n• Shared startup workspaces for collaborative execution\n• AI-generated startup documents (BMC, pitch decks, market analysis)\n• Readiness scoring and progress tracking\n• Mentor and accelerator ecosystem integration',
      market:
        'TAM: $50B - Global startup ecosystem tools\nSAM: $8B - English-speaking markets\nSOM: $200M - First 3 years focus\n\n• 500M+ aspiring entrepreneurs globally\n• Growing remote work enabling global team formation\n• AI tools adoption accelerating in startup space',
      product:
        '• Intelligent Matching Engine - Find complementary co-founders\n• Startup Builder Workspace - Collaborative document creation\n• AI Document Generation - BMC, pitch decks, market analysis\n• Readiness Assessment - Track startup maturity\n• Ecosystem Integration - Mentors, accelerators, universities',
      traction:
        '• 1,000+ registered users\n• 150+ successful co-founder matches\n• 50+ startup workspaces created\n• 85% user satisfaction rate\n• 15% month-over-month growth\n• Featured in TechCrunch, Product Hunt',
      'business-model': ctx.proposition
        ? ctx.proposition
        : 'Freemium SaaS Model:\n\n• Free: Basic matching, limited workspace\n• Pro ($49/mo): Full AI generation, unlimited workspaces\n• Enterprise ($999/mo): Organization features, white-label\n• AI Packs: Pay-per-use document generation\n\nTarget: 80% gross margin',
      competition:
        'Direct Competitors:\n• Founder2be - Limited features, no AI\n• CoFoundersLab - Outdated UX, no execution tools\n\nOur Advantages:\n• Only platform combining matching + execution\n• AI-native architecture\n• Ecosystem integration (mentors, accelerators)',
      team: '• CEO - 10+ years startup experience, 2 exits\n• CTO - Ex-Google, AI/ML expertise\n• CPO - Former product lead at Stripe\n• Advisors from Y Combinator, Sequoia',
      financials:
        'Projections (Year 1-3):\n\nYear 1: $150K ARR, 500 paid users\nYear 2: $800K ARR, 2,500 paid users\nYear 3: $3M ARR, 10,000 paid users\n\nUnit Economics:\n• CAC: $50 | LTV: $400 | LTV/CAC: 8x\n• Payback: 3 months | Gross Margin: 80%',
      ask: 'Raising: $500,000 Seed Round\n\nUse of Funds:\n• Product Development (40%) - AI features, mobile app\n• Marketing & Growth (30%) - User acquisition, content\n• Team Expansion (20%) - Engineering, sales\n• Operations (10%) - Infrastructure, legal',
      closing: `${ctx.name}\n\nBuilding the future of startup team formation\n\nContact: founders@cofounderbay.com\nWebsite: cofounderbay.com\n\nLet's build something great together.`,
    };
    return contents[type] || '';
  };

  const getGeneratedNotes = (type: string): string => {
    const notes: Record<string, string> = {
      cover: 'Keep this slide simple and impactful. 5 seconds to capture attention.',
      problem: 'Make the problem relatable. Use specific data points.',
      solution: 'Focus on the unique value proposition. Show, don\'t just tell.',
      market: 'Be realistic with numbers. Investors will verify.',
      product: 'Consider a live demo if possible. Screenshots are good backup.',
      traction: 'Lead with your strongest metrics. Be honest about stage.',
      'business-model': 'Show path to profitability. Unit economics matter.',
      competition: 'Acknowledge competitors. Show why you win.',
      team: 'Highlight relevant experience. Show why this team can execute.',
      financials: 'Be conservative. Show you understand the business.',
      ask: 'Be specific about use of funds. Show 18-24 month runway.',
      closing: 'End with a clear call to action. Make it easy to follow up.',
    };
    return notes[type] || '';
  };

  const addSlide = (type: string) => {
    const template = SLIDE_TEMPLATES.find((item) => item.type === type);
    if (!template) return;

    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      type: template.type,
      title: builderEn(template.titleKey),
      content: '',
      notes: '',
      order: data.slides.length,
    };

    setData((prev) => ({ ...prev, slides: [...prev.slides, newSlide] }));
    setCurrentSlideIndex(data.slides.length);
  };

  const addRemainingSlides = () => {
    setData((prev) => {
      const next = [...prev.slides];
      SLIDE_TEMPLATES.forEach((template) => {
        if (next.some((slide) => slide.type === template.type)) return;
        next.push({
          id: `slide-${Date.now()}-${template.type}`,
          type: template.type,
          title: builderEn(template.titleKey),
          content: '',
          notes: '',
          order: next.length,
        });
      });
      return { ...prev, slides: next };
    });
  };

  const updateSlide = (field: keyof Slide, value: string) => {
    setData((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === currentSlideIndex ? { ...slide, [field]: value } : slide,
      ),
    }));
  };

  const removeSlide = (index: number) => {
    setData((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index),
    }));
    if (currentSlideIndex >= data.slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, data.slides.length - 2));
    }
  };

  const duplicateSlide = (index: number) => {
    const slide = data.slides[index];
    if (!slide) return;
    const copy: Slide = {
      ...slide,
      id: `slide-${Date.now()}`,
      order: index + 1,
    };
    setData((prev) => ({
      ...prev,
      slides: [...prev.slides.slice(0, index + 1), copy, ...prev.slides.slice(index + 1)],
    }));
    setCurrentSlideIndex(index + 1);
  };

  const moveSlide = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= data.slides.length) return;

    const newSlides = [...data.slides];
    [newSlides[fromIndex], newSlides[toIndex]] = [newSlides[toIndex], newSlides[fromIndex]];
    setData((prev) => ({ ...prev, slides: newSlides }));
    setCurrentSlideIndex(toIndex);
  };

  const handleSave = () => {
    savedRef.current = snapshotOf(data);
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

  const copyCurrentSlide = async () => {
    const slide = data.slides[currentSlideIndex];
    if (!slide) return;
    const text = [slide.title, slide.content, slide.notes].filter((part) => part.trim()).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      success(t(builderEn('pitch_copied'), builderEl('pitch_copied')));
    } catch {
      /* clipboard can be denied; export remains available */
    }
  };

  const fillFromArtefacts = () => {
    const problem = asText(ideaCore?.problemStatement);
    const solution = asText(ideaCore?.solution);
    const unique = asText(ideaCore?.uniqueValue);
    const proposition = asText(bmc?.valueProposition) || asText(bmc?.valuePropositions);
    setData((prev) => ({
      ...prev,
      companyName: prev.companyName || workspaceName || prev.companyName,
      tagline: prev.tagline || unique || prev.tagline,
      slides: prev.slides.map((slide) => {
        if (slide.content.trim()) return slide;
        if (slide.type === 'cover' && (prev.companyName || workspaceName || unique)) {
          return {
            ...slide,
            content: [prev.companyName || workspaceName, unique].filter(Boolean).join('\n\n'),
          };
        }
        if (slide.type === 'problem' && problem) return { ...slide, content: problem };
        if (slide.type === 'solution' && solution) return { ...slide, content: solution };
        if (slide.type === 'business-model' && proposition) return { ...slide, content: proposition };
        if (slide.type === 'ask' && prev.askAmount) {
          return {
            ...slide,
            content: [prev.askAmount, ...prev.useOfFunds.filter((line) => line.trim())].join('\n'),
          };
        }
        return slide;
      }),
    }));
    success(t(builderEn('pitch_filled_core'), builderEl('pitch_filled_core')));
  };

  const copilotPrompt =
    askPrompt ??
    `Help me build a ${data.deckType} pitch deck for ${data.companyName || workspaceName || 'this startup'} with ${data.slides.length} slides. Draft Cover and Problem from the Idea Core.`;

  const currentSlide = data.slides[currentSlideIndex];
  const filledCount = data.slides.filter((slide) => slide.content.trim().length > 0).length;
  const missingTemplates = SLIDE_TEMPLATES.filter(
    (template) => !data.slides.some((slide) => slide.type === template.type),
  );
  const emptySlides = data.slides.filter((slide) => !slide.content.trim());
  const dirty = snapshotOf(data) !== savedRef.current;
  const activeDeck = DECK_TYPES.find((item) => item.value === data.deckType) ?? DECK_TYPES[0];
  const wordCount = currentSlide
    ? currentSlide.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const canFillFromArtefacts = Boolean(
    asText(ideaCore?.problemStatement) ||
      asText(ideaCore?.solution) ||
      asText(ideaCore?.uniqueValue) ||
      asText(bmc?.valueProposition) ||
      asText(bmc?.valuePropositions) ||
      data.askAmount,
  );

  const renderSlideTitle = (slide: Slide) => {
    const template = SLIDE_TEMPLATES.find((item) => item.type === slide.type);
    if (template && slide.title === builderEn(template.titleKey)) {
      return <BilingualText en={builderEn(template.titleKey)} el={builderEl(template.titleKey)} compact />;
    }
    return slide.title;
  };

  /*
   * What is about the deck, rather than in it.
   *
   * The twelve slides and the generate buttons are the page. A strip
   * restating the deck's own metadata above them is not, and neither is the
   * details form at the foot - company name, tagline, ask and use of funds
   * are what the cover and the ask slide read from, which makes them
   * settings for the deck rather than a slide in it.
   */
  const rail: PageRailSection[] = [
    {
      id: 'deck-summary',
      glyph: 'chart',
      labelEn: 'Deck summary',
      labelEl: 'Σύνοψη deck',
      content: (
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex flex-col justify-center gap-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className={BUILDER_STAT}>{completionPercentage.toFixed(0)}%</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <BilingualText en={builderEn('pitch_complete')} el={builderEl('pitch_complete')} compact />
                      </p>
                    </div>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {filledCount}/{Math.max(data.slides.length, SLIDE_TEMPLATES.length)}{' '}
                      <BilingualText en={builderEn('pitch_filled')} el={builderEl('pitch_filled')} compact />
                    </p>
                  </div>
                  <Progress value={completionPercentage} className="h-1.5" />
                  <p className="text-xs leading-snug text-muted-foreground">
                    <BilingualText en={builderEn('pitch_complete_hint')} el={builderEl('pitch_complete_hint')} />
                  </p>
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <Label className="text-xs text-muted-foreground">
                    <BilingualText en={builderEn('pitch_deck_type')} el={builderEl('pitch_deck_type')} compact />
                  </Label>
                  <Select
                    value={data.deckType}
                    onValueChange={(value) =>
                      setData((prev) => ({ ...prev, deckType: value as PitchDeckData['deckType'] }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 min-h-8 w-full rounded-xl text-xs"
                      aria-label={bilingualAria(builderEn('pitch_deck_type'), builderEl('pitch_deck_type'))}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECK_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {t(builderEn(item.labelKey), builderEl(item.labelKey))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-snug text-muted-foreground">
                    <BilingualText en={builderEn(activeDeck.hintKey)} el={builderEl(activeDeck.hintKey)} />
                  </p>
                </div>

                <div className="flex flex-col justify-center gap-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      <BilingualText en={builderEn('pitch_company')} el={builderEl('pitch_company')} compact />
                    </span>
                    <span className="min-w-0 truncate font-medium">{data.companyName || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      <BilingualText en={builderEn('pitch_ask')} el={builderEl('pitch_ask')} compact />
                    </span>
                    <span className="min-w-0 truncate font-medium">{data.askAmount || '—'}</span>
                  </div>
                  <Button asChild variant="ghost" size="sm" className={`${BUILDER_BTN} justify-start px-0`}>
                    <Link href="/readiness">
                      <CfbGlyph name="award" className="icon-sm mr-1.5" />
                      <BilingualText en={builderEn('pitch_readiness')} el={builderEl('pitch_readiness')} compact />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'deck-details',
      glyph: 'briefcase',
      labelEn: 'Deck details',
      labelEl: 'Στοιχεία deck',
      content: (
        <div className="space-y-3">
          <Card className="min-w-0">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className={BUILDER_CARD_TITLE}>
                <BilingualText en={builderEn('pitch_info')} el={builderEl('pitch_info')} compact />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                <BilingualText en={builderEn('pitch_info_hint')} el={builderEl('pitch_info_hint')} />
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="min-w-0 space-y-1.5">
                  <Label>
                    <BilingualText en={builderEn('pitch_company')} el={builderEl('pitch_company')} compact />
                  </Label>
                  <Input
                    className="min-h-11 rounded-xl"
                    value={data.companyName}
                    onChange={(event) => setData((prev) => ({ ...prev, companyName: event.target.value }))}
                    placeholder={t(builderEn('pitch_company_ph'), builderEl('pitch_company_ph'))}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label>
                    <BilingualText en={builderEn('pitch_tagline')} el={builderEl('pitch_tagline')} compact />
                  </Label>
                  <Input
                    className="min-h-11 rounded-xl"
                    value={data.tagline}
                    onChange={(event) => setData((prev) => ({ ...prev, tagline: event.target.value }))}
                    placeholder={t(builderEn('pitch_tagline_ph'), builderEl('pitch_tagline_ph'))}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label>
                    <BilingualText en={builderEn('pitch_ask')} el={builderEl('pitch_ask')} compact />
                  </Label>
                  <Input
                    className="min-h-11 rounded-xl"
                    value={data.askAmount}
                    onChange={(event) => setData((prev) => ({ ...prev, askAmount: event.target.value }))}
                    placeholder={t(builderEn('pitch_ask_ph'), builderEl('pitch_ask_ph'))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  <BilingualText en={builderEn('pitch_use_funds')} el={builderEl('pitch_use_funds')} compact />
                </Label>
                {data.useOfFunds.map((line, index) => (
                  <div key={`fund-${index}`} className="flex gap-2">
                    <Input
                      className="rounded-xl"
                      value={line}
                      onChange={(event) => {
                        const next = [...data.useOfFunds];
                        next[index] = event.target.value;
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
                  className={BUILDER_BTN}
                  onClick={() => setData((prev) => ({ ...prev, useOfFunds: [...prev.useOfFunds, ''] }))}
                >
                  <BilingualText en={builderEn('pitch_add_use')} el={builderEl('pitch_add_use')} compact />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];
  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      {/* Declared and rendered here: this is a component, not a page, so
          there is no AppShell to take a `rail` prop. PageRail is fixed, so
          it lands exactly where that prop would have put it. */}
      <PageRail sections={rail} />
      <BuilderStageHeader
        glyph="builder"
        titleEn={builderEn('tab_pitch')}
        titleEl={builderEl('tab_pitch')}
        subtitleEn={builderEn('pitch_lead')}
        subtitleEl={builderEl('pitch_lead')}
        hideTitle={hideTitle}
        showAskAi={!hideTitle}
        askPrompt={copilotPrompt}
        extraActions={
          <>
            {dirty && (
              <span className="text-xs text-muted-foreground">
                <BilingualText en={builderEn('pitch_unsaved')} el={builderEl('pitch_unsaved')} compact />
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className={BUILDER_BTN}
              onClick={generateWithAI}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="icon-sm mr-1.5 animate-spin" />
              ) : (
                <CfbGlyph name="spark" className="icon-sm mr-1.5" />
              )}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_generate')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_generate')}
                compact
              />
            </Button>
            <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={handleExport}>
              <Download className="icon-sm mr-1.5" />
              <BilingualText en={builderEn('pitch_export')} el={builderEl('pitch_export')} compact />
            </Button>
            <Button size="sm" className={BUILDER_BTN} onClick={handleSave}>
              <Save className="icon-sm mr-1.5" />
              <BilingualText en={builderEn('save')} el={builderEl('save')} compact />
            </Button>
          </>
        }
      />


      {data.slides.length === 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={cn(BUILDER_CARD_TITLE, 'flex items-center gap-2')}>
              <CfbGlyph name="flag" className="icon-sm" />
              <BilingualText en={builderEn('pitch_outline')} el={builderEl('pitch_outline')} compact />
            </CardTitle>
            <p className="text-xs leading-snug text-muted-foreground">
              <BilingualText en={builderEn('pitch_outline_hint')} el={builderEl('pitch_outline_hint')} />
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
              <AIInsightButton className={`w-full sm:w-auto ${BUILDER_BTN}`} prompt={copilotPrompt} />
              <Button
                size="sm"
                className={`w-full sm:w-auto ${BUILDER_BTN}`}
                onClick={generateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="icon-sm mr-1.5 animate-spin" />
                ) : (
                  <CfbGlyph name="spark" className="icon-sm mr-1.5" />
                )}
                <BilingualText en={builderEn('pitch_gen_full')} el={builderEl('pitch_gen_full')} compact />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SLIDE_TEMPLATES.map((template, index) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => addSlide(template.type)}
                  className="flex min-h-11 items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left transition-colors hover:border-border hover:bg-muted/30"
                >
                  <span className="mt-0.5 w-5 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
                  <CfbGlyph name={template.glyph} className="mt-0.5 icon-sm shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      <BilingualText en={builderEn(template.titleKey)} el={builderEl(template.titleKey)} compact />
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      <BilingualText en={builderEn(template.hintKey)} el={builderEl(template.hintKey)} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {(missingTemplates.length > 0 || emptySlides.length > 0) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {missingTemplates.length > 0 && (
                <Card className={STATUS.danger.border}>
                  <CardHeader className="pb-3">
                    <CardTitle className={cn(BUILDER_CARD_TITLE, 'flex items-center gap-2', STATUS.danger.text)}>
                      <AlertTriangle className="icon-sm" />
                      <BilingualText en={builderEn('pitch_missing')} el={builderEl('pitch_missing')} compact />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {missingTemplates.slice(0, 4).map((template) => (
                      <button
                        key={template.type}
                        type="button"
                        onClick={() => addSlide(template.type)}
                        className="flex w-full items-start gap-2 rounded-xl p-1.5 text-left text-sm hover:bg-muted/40"
                      >
                        <CfbGlyph name={template.glyph} className="mt-0.5 icon-sm shrink-0" />
                        <span className="min-w-0">
                          <BilingualText en={builderEn(template.titleKey)} el={builderEl(template.titleKey)} compact />
                        </span>
                      </button>
                    ))}
                    <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={addRemainingSlides}>
                      <BilingualText en={builderEn('pitch_add_remaining')} el={builderEl('pitch_add_remaining')} compact />
                    </Button>
                  </CardContent>
                </Card>
              )}
              {emptySlides.length > 0 && (
                <Card className={STATUS.success.border}>
                  <CardHeader className="pb-3">
                    <CardTitle className={cn(BUILDER_CARD_TITLE, 'flex items-center gap-2', STATUS.success.text)}>
                      <CfbGlyph name="spark" className="icon-sm" />
                      <BilingualText en={builderEn('pitch_next_write')} el={builderEl('pitch_next_write')} compact />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {emptySlides.slice(0, 4).map((slide) => {
                      const index = data.slides.findIndex((item) => item.id === slide.id);
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setCurrentSlideIndex(index)}
                          className="flex w-full items-start gap-2 rounded-xl p-1.5 text-left text-sm hover:bg-muted/40"
                        >
                          <CheckCircle2 className="mt-0.5 icon-sm shrink-0 text-status-success" />
                          <span className="min-w-0">{renderSlideTitle(slide)}</span>
                        </button>
                      );
                    })}
                    {canFillFromArtefacts && (
                      <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={fillFromArtefacts}>
                        <BilingualText en={builderEn('pitch_fill_core')} el={builderEl('pitch_fill_core')} compact />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid min-w-0 gap-6 lg:grid-cols-4">
            <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-1">
              <Card className="min-w-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">
                    <BilingualText en={builderEn('pitch_slides')} el={builderEl('pitch_slides')} compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[min(40vh,320px)] space-y-1 overflow-y-auto p-2 lg:max-h-[400px]">
                  {data.slides.map((slide, index) => (
                    <button
                      type="button"
                      key={slide.id}
                      className={cn(
                        'group flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl p-2 text-left transition-colors',
                        index === currentSlideIndex
                          ? 'bg-muted/50 text-foreground'
                          : 'hover:bg-muted/40',
                      )}
                      onClick={() => setCurrentSlideIndex(index)}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
                        <span className="truncate text-sm">{renderSlideTitle(slide)}</span>
                      </div>
                      <div
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          slide.content.trim() ? 'bg-status-success' : 'bg-muted-foreground/30',
                        )}
                      />
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">
                    <BilingualText en={builderEn('pitch_add')} el={builderEl('pitch_add')} compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid max-h-[280px] grid-cols-2 gap-1 overflow-y-auto p-2 sm:grid-cols-1">
                  <p className="col-span-2 px-2 pb-1 text-2xs text-muted-foreground sm:col-span-1">
                    <BilingualText en={builderEn('pitch_add_hint')} el={builderEl('pitch_add_hint')} />
                  </p>
                  {SLIDE_TEMPLATES.map((template) => {
                    const exists = data.slides.some((slide) => slide.type === template.type);
                    return (
                      <Button
                        key={template.type}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-auto min-h-10 w-full justify-start gap-2 rounded-xl px-2 py-2',
                          exists && 'opacity-60',
                        )}
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

            <div className="order-1 min-w-0 lg:order-2 lg:col-span-3">
              {currentSlide ? (
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
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className="font-mono text-xs text-muted-foreground">
                            {currentSlideIndex + 1}/{data.slides.length}
                          </span>
                          <Input
                            value={currentSlide.title}
                            onChange={(event) => updateSlide('title', event.target.value)}
                            className="h-10 w-full min-w-0 rounded-xl font-semibold"
                          />
                        </CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl"
                        onClick={() =>
                          setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))
                        }
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
                        className={BUILDER_BTN}
                        onClick={() => moveSlide(currentSlideIndex, 'up')}
                        disabled={currentSlideIndex === 0}
                        aria-label={bilingualAria(builderEn('pitch_move_up'), builderEl('pitch_move_up'))}
                      >
                        <ArrowUp className="icon-sm" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={BUILDER_BTN}
                        onClick={() => moveSlide(currentSlideIndex, 'down')}
                        disabled={currentSlideIndex === data.slides.length - 1}
                        aria-label={bilingualAria(builderEn('pitch_move_down'), builderEl('pitch_move_down'))}
                      >
                        <ArrowDown className="icon-sm" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={BUILDER_BTN}
                        onClick={() => duplicateSlide(currentSlideIndex)}
                      >
                        <Copy className="icon-sm mr-1.5" />
                        <BilingualText en={builderEn('pitch_duplicate')} el={builderEl('pitch_duplicate')} compact />
                      </Button>
                      <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={copyCurrentSlide}>
                        <BilingualText en={builderEn('pitch_copy')} el={builderEl('pitch_copy')} compact />
                      </Button>
                      <BuilderAskAiButton
                        labelEn={builderEn('pitch_ask_slide')}
                        labelEl={builderEl('pitch_ask_slide')}
                        prompt={`Help me write this ${currentSlide.title} pitch-deck slide from my Idea Core and BMC. Keep it investor-clear and specific. Current draft: ${currentSlide.content || '(empty)'}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className={BUILDER_BTN}
                        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                      >
                        <Eye className="icon-sm mr-1.5" />
                        <BilingualText
                          en={viewMode === 'edit' ? builderEn('pitch_preview') : builderEn('pitch_edit')}
                          el={viewMode === 'edit' ? builderEl('pitch_preview') : builderEl('pitch_edit')}
                          compact
                        />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={BUILDER_BTN}
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
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <Label>
                              <BilingualText en={builderEn('pitch_content')} el={builderEl('pitch_content')} compact />
                            </Label>
                            <span className="text-2xs tabular-nums text-muted-foreground">
                              {wordCount} <BilingualText en={builderEn('pitch_words')} el={builderEl('pitch_words')} compact />
                            </span>
                          </div>
                          <Textarea
                            value={currentSlide.content}
                            onChange={(event) => updateSlide('content', event.target.value)}
                            placeholder={t(builderEn('pitch_content_ph'), builderEl('pitch_content_ph'))}
                            className="min-h-[180px] rounded-xl text-sm sm:min-h-[250px]"
                          />
                        </div>
                        <div>
                          <Label>
                            <BilingualText en={builderEn('pitch_notes')} el={builderEl('pitch_notes')} compact />
                          </Label>
                          <Textarea
                            value={currentSlide.notes}
                            onChange={(event) => updateSlide('notes', event.target.value)}
                            placeholder={t(builderEn('pitch_notes_ph'), builderEl('pitch_notes_ph'))}
                            className="min-h-[80px] rounded-xl text-sm"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video min-h-[220px] rounded-2xl border border-border/60 bg-background p-6 sm:min-h-0 sm:p-8">
                        <p className="mb-3 font-mono text-xs text-muted-foreground">
                          {currentSlideIndex + 1}/{data.slides.length}
                        </p>
                        <h2 className="builder-title mb-4 text-lg font-semibold tracking-tight">
                          {currentSlide.title}
                        </h2>
                        {currentSlide.content.trim() ? (
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{currentSlide.content}</div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            <BilingualText
                              en={builderEn('pitch_preview_empty')}
                              el={builderEl('pitch_preview_empty')}
                            />
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
