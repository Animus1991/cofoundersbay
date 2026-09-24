'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Save,
  RefreshCw,
  Copy,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BUILDER_BTN, BuilderStageHeader, useBuilderPrimaryText } from './BuilderStageChrome';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import {
  applicationQuestionCopy,
  applicationTipCopy,
} from '@/lib/i18n/strings-application-questions';
import { bilingualAria } from '@/lib/i18n/format';
import { useToast } from '@/components/ui/toast';

interface ApplicationQuestion {
  id: string;
  question: string;
  answer: string;
  maxLength?: number;
  tips?: string;
  required: boolean;
}

interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;
  descKey?: 'app_yc_desc' | 'app_ts_desc' | 'app_uni_desc' | 'app_grant_desc';
  glyph: CfbGlyphName;
  deadline?: string;
  deadlineKey?: 'app_deadline_rolling' | 'app_deadline_varies';
  website?: string;
  questions: ApplicationQuestion[];
  status: 'draft' | 'in-progress' | 'completed' | 'submitted';
}

interface ApplicationGeneratorProps {
  onSave?: (data: ApplicationTemplate[]) => void | Promise<void>;
  workspaceData?: Record<string, unknown>;
  initialData?: unknown;
  hideTitle?: boolean;
}

export function requiredCompletion(app: { questions: ApplicationQuestion[] }): number {
  const required = app.questions.filter((q) => q.required);
  if (required.length === 0) return 100;
  const answered = required.filter((q) => q.answer.trim().length > 0);
  return Math.round((answered.length / required.length) * 100);
}

export function deriveApplicationStatus(
  app: ApplicationTemplate,
): ApplicationTemplate['status'] {
  if (app.status === 'submitted') return 'submitted';
  const pct = requiredCompletion(app);
  if (pct === 0) return 'draft';
  if (pct === 100) return 'completed';
  return 'in-progress';
}

function seedApplications(): ApplicationTemplate[] {
  return APPLICATION_TEMPLATES.map((tpl) => ({ ...tpl, status: 'draft' as const }));
}

function asApplicationList(saved: unknown): unknown[] | null {
  if (Array.isArray(saved)) return saved;
  if (!saved || typeof saved !== 'object') return null;
  const outer = saved as Record<string, unknown>;
  if (Array.isArray(outer.applications)) return outer.applications;
  if (outer.applications && typeof outer.applications === 'object') {
    const inner = outer.applications as Record<string, unknown>;
    if (Array.isArray(inner.applications)) return inner.applications;
    if (Array.isArray(inner.list)) return inner.list;
  }
  return null;
}

export function mergeSavedApplications(saved: unknown): ApplicationTemplate[] {
  const seed = seedApplications();
  const list = asApplicationList(saved);
  if (!list) return seed;
  return seed.map((tpl) => {
    const match = list.find((item) => item && typeof item === 'object' && (item as { id?: string }).id === tpl.id) as
      | { questions?: { id: string; answer?: string }[]; status?: ApplicationTemplate['status'] }
      | undefined;
    if (!match) return tpl;
    const questions = tpl.questions.map((q) => {
      const found = match.questions?.find((mq) => mq.id === q.id);
      return found && typeof found.answer === 'string' ? { ...q, answer: found.answer } : q;
    });
    const next = { ...tpl, questions, status: match.status ?? tpl.status };
    return { ...next, status: deriveApplicationStatus(next) };
  });
}

const APPLICATION_TEMPLATES: Omit<ApplicationTemplate, 'status'>[] = [
  {
    id: 'yc',
    name: 'Y Combinator',
    description: 'The most prestigious startup accelerator',
    descKey: 'app_yc_desc' as const,
    glyph: 'award',
    deadline: 'Rolling admissions',
    deadlineKey: 'app_deadline_rolling' as const,
    website: 'https://www.ycombinator.com/apply',
    questions: [
      { id: 'yc1', question: 'Describe what your company does in 50 characters or less.', answer: '', maxLength: 50, tips: 'Be extremely concise. Think elevator pitch in one sentence.', required: true },
      { id: 'yc2', question: 'What is your company going to make? Please describe your product and what it does or will do.', answer: '', maxLength: 500, tips: 'Focus on the product, not the market. Be specific about what you\'re building.', required: true },
      { id: 'yc3', question: 'Where do you live now, and where would the company be based after YC?', answer: '', required: true },
      { id: 'yc4', question: 'How long have the founders known one another and how did you meet?', answer: '', tips: 'YC values strong founder relationships. Be honest about your history.', required: true },
      { id: 'yc5', question: 'Why did you pick this idea to work on? Do you have domain expertise in this area?', answer: '', maxLength: 500, tips: 'Show your unique insight and why you\'re the right team.', required: true },
      { id: 'yc6', question: 'What\'s new about what you\'re making? What substitutes do people resort to because it doesn\'t exist yet?', answer: '', maxLength: 500, tips: 'Highlight your innovation and current workarounds.', required: true },
      { id: 'yc7', question: 'Who are your competitors? Who might become competitors?', answer: '', maxLength: 500, tips: 'Show you understand the landscape. Don\'t say "no competitors".', required: true },
      { id: 'yc8', question: 'How do or will you make money? How much could you make?', answer: '', maxLength: 500, tips: 'Be specific about your business model and market size.', required: true },
      { id: 'yc9', question: 'How will you get users? If your idea is the type that faces a chicken-and-egg problem, how will you overcome it?', answer: '', maxLength: 500, tips: 'Show a concrete go-to-market strategy.', required: true },
      { id: 'yc10', question: 'What have you learned so far from working on your product?', answer: '', maxLength: 500, tips: 'Share insights from customer discovery and building.', required: false },
      { id: 'yc11', question: 'If you have already participated in an incubator or accelerator, which one?', answer: '', required: false },
      { id: 'yc12', question: 'Why do you want to be part of Y Combinator?', answer: '', maxLength: 300, tips: 'Be specific about what you hope to gain from YC.', required: true }
    ]
  },
  {
    id: 'techstars',
    name: 'Techstars',
    description: 'Global accelerator network',
    descKey: 'app_ts_desc' as const,
    glyph: 'flag',
    deadline: 'Varies by program',
    deadlineKey: 'app_deadline_varies' as const,
    website: 'https://www.techstars.com/accelerators',
    questions: [
      { id: 'ts1', question: 'What does your company do? (One sentence)', answer: '', maxLength: 100, required: true },
      { id: 'ts2', question: 'What problem are you solving?', answer: '', maxLength: 500, required: true },
      { id: 'ts3', question: 'What is your solution?', answer: '', maxLength: 500, required: true },
      { id: 'ts4', question: 'What is your business model?', answer: '', maxLength: 300, required: true },
      { id: 'ts5', question: 'What traction do you have?', answer: '', maxLength: 500, tips: 'Include metrics, users, revenue, partnerships.', required: true },
      { id: 'ts6', question: 'What is your competitive advantage?', answer: '', maxLength: 300, required: true },
      { id: 'ts7', question: 'Tell us about your team.', answer: '', maxLength: 500, required: true },
      { id: 'ts8', question: 'Why Techstars? Why this program specifically?', answer: '', maxLength: 300, required: true },
      { id: 'ts9', question: 'What do you hope to accomplish during the program?', answer: '', maxLength: 300, required: true }
    ]
  },
  {
    id: 'university',
    name: 'University Incubator',
    description: 'Academic startup programs',
    descKey: 'app_uni_desc' as const,
    glyph: 'book',
    website: '/opportunities',
    questions: [
      { id: 'uni1', question: 'Project/Startup Name', answer: '', required: true },
      { id: 'uni2', question: 'Executive Summary (max 300 words)', answer: '', maxLength: 2000, required: true },
      { id: 'uni3', question: 'Problem Statement', answer: '', maxLength: 500, required: true },
      { id: 'uni4', question: 'Proposed Solution', answer: '', maxLength: 500, required: true },
      { id: 'uni5', question: 'Target Market', answer: '', maxLength: 300, required: true },
      { id: 'uni6', question: 'Team Background and Qualifications', answer: '', maxLength: 500, required: true },
      { id: 'uni7', question: 'Current Stage of Development', answer: '', maxLength: 300, required: true },
      { id: 'uni8', question: 'Resources Needed from the Incubator', answer: '', maxLength: 300, required: true },
      { id: 'uni9', question: 'Timeline and Milestones', answer: '', maxLength: 500, required: true },
      { id: 'uni10', question: 'Connection to University (if any)', answer: '', required: false }
    ]
  },
  {
    id: 'grant',
    name: 'Innovation Grant',
    description: 'Government and foundation grants',
    descKey: 'app_grant_desc' as const,
    glyph: 'building',
    website: '/fundraising',
    questions: [
      { id: 'gr1', question: 'Project Title', answer: '', required: true },
      { id: 'gr2', question: 'Abstract (max 250 words)', answer: '', maxLength: 1500, required: true },
      { id: 'gr3', question: 'Problem/Need Statement', answer: '', maxLength: 1000, required: true },
      { id: 'gr4', question: 'Innovation Description', answer: '', maxLength: 1500, required: true },
      { id: 'gr5', question: 'Technical Approach', answer: '', maxLength: 1500, required: true },
      { id: 'gr6', question: 'Market Opportunity', answer: '', maxLength: 1000, required: true },
      { id: 'gr7', question: 'Team Qualifications', answer: '', maxLength: 1000, required: true },
      { id: 'gr8', question: 'Budget Overview', answer: '', maxLength: 500, required: true },
      { id: 'gr9', question: 'Expected Outcomes and Impact', answer: '', maxLength: 1000, required: true },
      { id: 'gr10', question: 'Sustainability Plan', answer: '', maxLength: 500, required: true }
    ]
  }
];

export function ApplicationGenerator({ onSave, workspaceData, initialData, hideTitle = false }: ApplicationGeneratorProps) {
  const t = useBuilderPrimaryText();
  const { success } = useToast();
  const [applications, setApplications] = useState<ApplicationTemplate[]>(() => mergeSavedApplications(initialData));
  const [activeApp, setActiveApp] = useState<string>('yc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    const merged = mergeSavedApplications(initialData);
    const hasAnswers = merged.some((app) => app.questions.some((q) => q.answer.trim().length > 0) || app.status === 'submitted');
    if (!hasAnswers) return;
    didHydrate.current = true;
    setApplications(merged);
  }, [initialData]);

  const currentApp = applications.find((a) => a.id === activeApp);

  const generateWithAI = async () => {
    if (!currentApp) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const generatedAnswers: Record<string, string> = {
        // YC Answers
        'yc1': 'AI-powered startup formation and team matching platform.',
        'yc2': 'CoFounderBay is an AI-powered platform that helps founders find co-founders, build startup documents, and validate their ideas. We combine intelligent matching algorithms with collaborative workspaces where teams can generate business model canvases, pitch decks, and market analyses together. Unlike simple networking platforms, we help founders prove they can execute together before committing.',
        'yc3': 'Currently based in San Francisco. The company would remain in SF after YC.',
        'yc4': 'We\'ve known each other for 3 years. We met at a startup weekend event where we built a prototype together and won first place. Since then, we\'ve collaborated on two side projects and realized we work exceptionally well together.',
        'yc5': 'Both founders have experienced the pain of finding the right co-founder firsthand. Our CEO spent 8 months searching for a technical co-founder, while our CTO joined two startups that failed due to team issues. We have deep expertise in AI/ML and marketplace dynamics from our previous roles at Google and Stripe.',
        'yc6': 'Current solutions are either pure networking (LinkedIn, CoFoundersLab) or pure document tools (Notion, Canva). We\'re the first to combine team formation with execution validation. People currently resort to posting on Twitter, attending endless networking events, or joining random teams without any way to test compatibility.',
        'yc7': 'Direct: CoFoundersLab (outdated, no AI), Founder2be (limited features). Indirect: LinkedIn, AngelList. Potential: Notion could add matching, but their DNA is productivity, not community. Our moat is the network effect of quality founders and the AI that learns from successful matches.',
        'yc8': 'Freemium SaaS: Free basic matching, Pro at $49/mo for AI generation and unlimited workspaces, Enterprise at $999/mo for organizations. TAM is $50B (startup tools), SAM is $8B (English markets), SOM is $200M in 3 years. We project $3M ARR by year 3.',
        'yc9': 'We\'ll start with warm outreach to startup communities (Indie Hackers, Twitter startup community, university entrepreneurship programs). We\'ll offer free workspace creation to attract founders, then monetize on AI features. For the chicken-and-egg problem, we\'re seeding with quality founders from our network and focusing on specific verticals (AI/ML founders) first.',
        'yc10': 'We learned that founders care more about execution compatibility than just skill matching. Our early users told us they wanted to "test drive" working together before committing. This led us to build the collaborative workspace feature, which became our most-used feature.',
        'yc11': '',
        'yc12': 'YC\'s network of founders is exactly what our platform needs to reach critical mass. We want access to the best founders in the world as both users and advisors. The YC brand would also help us close enterprise deals with accelerators and universities who want to use our platform.',
        
        // Techstars Answers
        'ts1': 'AI-powered platform for startup team formation and execution validation.',
        'ts2': '90% of startups fail, and 23% fail specifically due to team issues. Founders struggle to find the right co-founders, and when they do, there\'s no way to validate compatibility before committing. This leads to wasted time, failed partnerships, and startup deaths.',
        'ts3': 'CoFounderBay combines AI-powered matching with collaborative workspaces. Founders can discover complementary co-founders, then work together on AI-generated startup documents (BMC, pitch decks, market analysis) to test execution compatibility before committing.',
        'ts4': 'Freemium SaaS with Pro ($49/mo) and Enterprise ($999/mo) tiers. Additional revenue from AI generation packs and organization licensing.',
        'ts5': '1,000+ registered users, 150+ successful matches, 50+ active workspaces. 15% MoM growth. Featured in TechCrunch and Product Hunt. 85% user satisfaction. $5K MRR.',
        'ts6': 'Only platform combining matching + execution validation. AI-native architecture. Network effects from quality founder community. Integration with accelerator ecosystem.',
        'ts7': 'CEO: 10+ years startup experience, 2 exits, ex-Google. CTO: AI/ML expert, ex-Stripe. Advisors from YC and Sequoia.',
        'ts8': 'Techstars\' focus on founder development aligns perfectly with our mission. The mentor network would help us refine our product and go-to-market. We\'re specifically interested in the [City] program because of its strong enterprise connections.',
        'ts9': 'Launch enterprise product, close 10 accelerator partnerships, reach $50K MRR, raise seed round.',
        
        // University Incubator Answers
        'uni1': 'CoFounderBay',
        'uni2': 'CoFounderBay is an AI-powered startup formation platform that helps founders find co-founders, validate ideas, and build essential startup documents collaboratively. Our platform addresses the critical challenge that 23% of startups fail due to team issues. We combine intelligent matching algorithms with collaborative workspaces where teams can generate business model canvases, pitch decks, and market analyses together. Unlike simple networking platforms, we help founders prove they can execute together before committing. Our target market includes aspiring entrepreneurs, university students, and early-stage founders. We\'ve achieved 1,000+ users and 150+ successful matches. We\'re seeking incubator support for product development, mentorship, and access to the university\'s entrepreneurial community.',
        'uni3': 'Finding the right co-founder is one of the biggest challenges for aspiring entrepreneurs. Current solutions are either pure networking (limited effectiveness) or pure document tools (no team formation). There\'s no platform that helps founders both find partners AND validate they can work together effectively.',
        'uni4': 'An AI-powered platform combining intelligent co-founder matching with collaborative startup workspaces. Founders can discover complementary partners, then work together on AI-generated documents to test compatibility before committing.',
        'uni5': 'Primary: Aspiring entrepreneurs and early-stage founders (500M+ globally). Secondary: University students in entrepreneurship programs. Tertiary: Accelerators and incubators seeking team formation tools.',
        'uni6': 'CEO has 10+ years startup experience with 2 successful exits. CTO is an AI/ML expert with experience at major tech companies. Both founders have deep understanding of the startup ecosystem and the challenges of team formation.',
        'uni7': 'MVP launched with core matching and workspace features. 1,000+ users, 150+ matches. Currently developing advanced AI generation features.',
        'uni8': 'Mentorship from experienced entrepreneurs, access to university startup community for user research and early adoption, workspace/facilities, potential connection to university venture fund.',
        'uni9': 'Month 1-2: User research with university entrepreneurs. Month 3-4: Feature development based on feedback. Month 5-6: Launch to broader university community. Month 7-12: Scale and prepare for seed funding.',
        'uni10': 'Our CTO is an alumnus of the Computer Science department. We\'ve conducted preliminary user research with students from the business school.',
        
        // Grant Answers
        'gr1': 'CoFounderBay: AI-Powered Startup Team Formation Platform',
        'gr2': 'CoFounderBay addresses the critical challenge that 23% of startups fail due to team issues. Our AI-powered platform combines intelligent co-founder matching with collaborative workspaces, enabling founders to discover complementary partners and validate execution compatibility before committing. Unlike existing networking platforms, we provide tools for teams to work together on AI-generated startup documents, creating a "test drive" experience for potential partnerships. Our innovation lies in the integration of matching algorithms with execution validation, reducing the risk of team-related startup failures.',
        'gr3': 'Startup team formation is fundamentally broken. Founders spend months searching for co-founders through networking events, online platforms, and personal connections, with no way to validate compatibility. When partnerships form, there\'s no structured way to test if the team can actually execute together. This leads to 23% of startups failing specifically due to team issues, representing billions in wasted resources and unrealized potential.',
        'gr4': 'CoFounderBay introduces three key innovations: (1) AI-powered matching that considers not just skills but execution compatibility, work styles, and goals; (2) Collaborative workspaces where potential co-founders can work together on real startup documents before committing; (3) Readiness scoring that quantifies team maturity across multiple dimensions. Our approach is validated by early user feedback showing that founders value "test driving" partnerships before committing.',
        'gr5': 'Our platform uses machine learning models trained on successful startup team compositions to power matching. The collaborative workspace leverages large language models for document generation while maintaining cross-document consistency. Our readiness scoring engine uses multi-dimensional analysis across team, market, product, and execution factors. The architecture is built on modern cloud infrastructure ensuring scalability and security.',
        'gr6': 'The global market for startup ecosystem tools is $50B, with our serviceable market at $8B in English-speaking regions. We target a $200M obtainable market in 3 years. Growth drivers include increasing remote work (enabling global team formation), rising AI adoption in startup tools, and growing recognition of team importance in startup success.',
        'gr7': 'Our CEO brings 10+ years of startup experience with 2 successful exits and deep understanding of founder challenges. Our CTO has extensive AI/ML expertise from roles at leading tech companies. Together, we combine technical capability with market insight. Our advisory board includes successful entrepreneurs and investors.',
        'gr8': 'Requested funding: $150,000. Allocation: Product Development (50%) - AI model training, feature development; User Research (20%) - Customer discovery, usability testing; Infrastructure (15%) - Cloud services, security; Operations (15%) - Legal, administrative.',
        'gr9': 'Expected outcomes: 5,000 registered users, 500 successful matches, 100 active workspaces, validation of AI matching effectiveness. Impact: Reduced startup failure rate due to team issues, more efficient founder matching, democratized access to startup formation tools.',
        'gr10': 'Post-grant sustainability through SaaS revenue model. Freemium tier ensures accessibility while Pro and Enterprise tiers generate revenue. Path to profitability within 24 months of grant completion. Additional revenue potential from accelerator partnerships and white-label licensing.'
      };

      const idea = (workspaceData?.idea_core ?? workspaceData?.ideaCore) as Record<string, unknown> | undefined;
      if (idea && typeof idea.solution === 'string' && idea.solution.trim()) {
        generatedAnswers.yc2 = idea.solution;
        generatedAnswers.ts3 = idea.solution;
        generatedAnswers.uni4 = idea.solution;
      }
      if (idea && typeof idea.problemStatement === 'string' && idea.problemStatement.trim()) {
        generatedAnswers.ts2 = idea.problemStatement;
        generatedAnswers.uni3 = idea.problemStatement;
        generatedAnswers.gr3 = idea.problemStatement;
      }
      
      setApplications(prev => prev.map(app => {
        if (app.id !== activeApp) return app;
        const next: ApplicationTemplate = {
          ...app,
          questions: app.questions.map(q => ({
            ...q,
            answer: generatedAnswers[q.id] || q.answer
          })),
        };
        return { ...next, status: deriveApplicationStatus(next) };
      }));
      
      setIsGenerating(false);
    }, 3000);
  };

  const updateAnswer = (questionId: string, answer: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== activeApp) return app;
      const next: ApplicationTemplate = {
        ...app,
        questions: app.questions.map(q => 
          q.id === questionId ? { ...q, answer } : q
        ),
      };
      return { ...next, status: deriveApplicationStatus(next) };
    }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async () => {
    await onSave?.(applications);
    success(
      t(builderEn('app_saved'), builderEl('app_saved')),
      t(builderEn('app_saved_hint'), builderEl('app_saved_hint')),
    );
  };

  const markSubmitted = () => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== activeApp) return app;
        if (requiredCompletion(app) < 100) return app;
        return { ...app, status: 'submitted' as const };
      }),
    );
  };

  const stats = useMemo(() => {
    const completions = applications.map((app) => requiredCompletion(app));
    const avg = completions.length
      ? Math.round(completions.reduce((sum, n) => sum + n, 0) / completions.length)
      : 0;
    return {
      programs: applications.length,
      inProgress: applications.filter((app) => app.status === 'in-progress').length,
      ready: applications.filter((app) => app.status === 'completed').length,
      avg,
    };
  }, [applications]);

  const getStatusBadge = (status: ApplicationTemplate['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary">
            <BilingualText en={builderEn('app_draft')} el={builderEl('app_draft')} compact />
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className={cn('border', STATUS.warning.chip)}>
            <BilingualText en={builderEn('status_in_progress')} el={builderEl('status_in_progress')} compact />
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className={cn('border', STATUS.success.chip)}>
            <BilingualText en={builderEn('status_completed')} el={builderEl('status_completed')} compact />
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className={STATUS.success.chip}>
            <BilingualText en={builderEn('app_submitted')} el={builderEl('app_submitted')} compact />
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <BuilderStageHeader
        glyph="applications"
        titleEn={builderEn('app_title')}
        titleEl={builderEl('app_title')}
        subtitleEn={builderEn('app_sub')}
        subtitleEl={builderEl('app_sub')}
        hideTitle={hideTitle}
        showAskAi={!hideTitle}
        extraActions={
          <>
            <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={generateWithAI} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="icon-sm mr-2 animate-spin" /> : <CfbGlyph name="spark" className="icon-sm mr-2" />}
              <BilingualText
                en={isGenerating ? builderEn('generating') : builderEn('ai_generate')}
                el={isGenerating ? builderEl('generating') : builderEl('ai_generate')}
                compact
              />
            </Button>
            <Button size="sm" className={BUILDER_BTN} onClick={() => void handleSave()}>
              <Save className="icon-sm mr-2" />
              <BilingualText en={builderEn('app_save_all')} el={builderEl('app_save_all')} compact />
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { glyph: 'applications' as const, label: 'app_stat_programs' as const, value: String(stats.programs) },
            { glyph: 'flag' as const, label: 'app_stat_progress' as const, value: String(stats.inProgress) },
            { glyph: 'award' as const, label: 'app_stat_ready' as const, value: String(stats.ready) },
            { glyph: 'chart' as const, label: 'app_stat_avg' as const, value: `${stats.avg}%` },
          ] as const
        ).map((item) => (
          <Card key={item.label} className="rounded-xl">
            <CardContent className="flex items-center gap-3 p-4">
              <CfbGlyph name={item.glyph} className="icon-sm shrink-0 text-muted-foreground/70" />
              <div className="min-w-0">
                <p className="text-2xs text-muted-foreground">
                  <BilingualText en={builderEn(item.label)} el={builderEl(item.label)} compact />
                </p>
                <p className="text-lg font-semibold tracking-tight">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {applications.map((app) => {
          const completion = requiredCompletion(app);
          
          return (
            <Card 
              key={app.id}
              className={cn(
                "cursor-pointer rounded-xl transition-all",
                activeApp === app.id && "ring-2 ring-primary"
              )}
              onClick={() => setActiveApp(app.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <CfbGlyph name={app.glyph} className="icon-sm text-muted-foreground" />
                  {getStatusBadge(app.status)}
                </div>
                <h3 className="mb-1 text-base font-semibold">{app.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {app.descKey ? (
                    <BilingualText en={builderEn(app.descKey)} el={builderEl(app.descKey)} compact />
                  ) : (
                    app.description
                  )}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span><BilingualText en={builderEn('completion')} el={builderEl('completion')} compact /></span>
                    <span>{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-1.5" />
                </div>
                {(app.deadlineKey || app.deadline) && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="icon-sm" />
                    {app.deadlineKey ? (
                      <BilingualText en={builderEn(app.deadlineKey)} el={builderEl(app.deadlineKey)} compact />
                    ) : (
                      app.deadline
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {currentApp && (
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CfbGlyph name={currentApp.glyph} className="icon-lg" />
                <div>
                  <CardTitle className="text-base">
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
                  <Button variant="outline" size="sm" className={BUILDER_BTN} onClick={markSubmitted}>
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
                        asChild
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        aria-label={bilingualAria(builderEn('app_ask_fill'), builderEl('app_ask_fill'))}
                      >
                        <Link href={`/ai?q=${encodeURIComponent(`Help me answer this ${currentApp?.name ?? 'program'} application question: ${prompt.en}`)}`}>
                          <CfbGlyph name="spark" className="icon-sm" />
                          <span className="sr-only">
                            <BilingualText en={builderEn('app_ask_fill')} el={builderEl('app_ask_fill')} compact />
                          </span>
                        </Link>
                      </Button>
                      {question.answer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => copyToClipboard(question.answer, question.id)}
                        >
                          {copiedId === question.id ? (
                            <CheckCircle2 className="icon-sm text-status-success" />
                          ) : (
                            <Copy className="icon-sm" />
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
  );
}
