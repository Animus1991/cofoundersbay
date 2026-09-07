'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Presentation, 
  Target,
  Users,
  TrendingUp,
  DollarSign,
  Lightbulb,
  BarChart3,
  Rocket,
  Award,
  Sparkles,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  initialData?: Partial<PitchDeckData>;
  workspaceName?: string;
  ideaCore?: Record<string, unknown>;
  askPrompt?: string;
}

const SLIDE_TEMPLATES = [
  { type: 'cover', title: 'Cover', icon: Presentation, description: 'Company name, tagline, and visual identity' },
  { type: 'problem', title: 'Problem', icon: Target, description: 'The pain point you are solving' },
  { type: 'solution', title: 'Solution', icon: Lightbulb, description: 'Your unique approach to solving the problem' },
  { type: 'market', title: 'Market Opportunity', icon: TrendingUp, description: 'TAM, SAM, SOM and market dynamics' },
  { type: 'product', title: 'Product', icon: Rocket, description: 'Product demo, features, and benefits' },
  { type: 'traction', title: 'Traction', icon: BarChart3, description: 'Key metrics, growth, and milestones' },
  { type: 'business-model', title: 'Business Model', icon: DollarSign, description: 'How you make money' },
  { type: 'competition', title: 'Competition', icon: Award, description: 'Competitive landscape and positioning' },
  { type: 'team', title: 'Team', icon: Users, description: 'Founders and key team members' },
  { type: 'financials', title: 'Financials', icon: DollarSign, description: 'Revenue projections and unit economics' },
  { type: 'ask', title: 'The Ask', icon: Target, description: 'Funding amount and use of funds' },
  { type: 'closing', title: 'Closing', icon: Presentation, description: 'Contact info and call to action' }
];

const defaultPitchDeckData: PitchDeckData = {
  deckType: 'investor',
  slides: [],
  companyName: '',
  tagline: '',
  askAmount: '',
  useOfFunds: []
};

export function PitchDeckBuilder({ onSave, initialData, workspaceName, ideaCore, askPrompt }: PitchDeckBuilderProps) {
  const { success } = useToast();
  const [data, setData] = useState<PitchDeckData>({ ...defaultPitchDeckData, ...initialData });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const filledSlides = data.slides.filter(s => s.content.trim().length > 0).length;
    const totalSlides = data.slides.length;
    setCompletionPercentage(totalSlides ? (filledSlides / totalSlides) * 100 : 0);
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
        title: template.title,
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
      title: template.title,
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

  const copilotPrompt = askPrompt
    ?? `Help me build a ${data.deckType} pitch deck for ${data.companyName || workspaceName || 'this startup'} with ${data.slides.length} slides. Draft Cover and Problem from the Idea Core.`;

  const currentSlide = data.slides[currentSlideIndex];

  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      {/* Toolbar */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-10 gap-1 px-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            {data.slides.length} slides
          </Badge>
          <select
            value={data.deckType}
            onChange={(e) => setData(prev => ({ ...prev, deckType: e.target.value as PitchDeckData['deckType'] }))}
            className="min-h-10 max-w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="investor">Investor Deck</option>
            <option value="accelerator">Accelerator Deck</option>
            <option value="cofounder">Co-founder Deck</option>
            <option value="grant">Grant Application</option>
            <option value="competition">Competition Deck</option>
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            className="min-h-10"
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Fill sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-10"
            onClick={() => success('PDF export is not wired yet', 'Ask AI to outline slides, or copy the editor text.')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="min-h-10" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Deck Completion</span>
          <span>{completionPercentage.toFixed(0)}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-4">
        {/* Slide Navigator */}
        <div className="order-2 min-w-0 space-y-4 lg:order-1 lg:col-span-1">
          {data.slides.length > 0 && (
            <Card className="min-w-0">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Slides</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[min(40vh,320px)] space-y-1 overflow-y-auto p-2 lg:max-h-[400px]">
                {data.slides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-md p-2 text-left",
                      index === currentSlideIndex 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-5 shrink-0 font-mono text-xs">{index + 1}</span>
                      <span className="truncate text-sm">{slide.title}</span>
                    </div>
                    <div className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      slide.content ? "bg-green-500" : "bg-gray-300"
                    )} />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add Slide */}
          <Card className="min-w-0">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Add Slide</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-1">
              {SLIDE_TEMPLATES.map(template => {
                const Icon = template.icon;
                const exists = data.slides.some(s => s.type === template.type);
                return (
                  <Button
                    key={template.type}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-auto min-h-11 w-full justify-start gap-2 px-2 py-2",
                      exists && "opacity-50"
                    )}
                    onClick={() => addSlide(template.type)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs">{template.title}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Slide Editor */}
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-3">
          {data.slides.length === 0 ? (
            <Card className="min-w-0">
              <CardContent className="flex flex-col items-center px-4 py-10 text-center">
                <Presentation className="mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-lg font-semibold">No slides yet</h3>
                <p className="mb-4 max-w-sm text-sm leading-snug text-muted-foreground">
                  Ask AI to draft from Idea Core, fill a sample outline, or add slides below.
                </p>
                <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                  <AIInsightButton className="min-h-11 w-full" prompt={copilotPrompt} />
                  <Button className="min-h-11 w-full" onClick={generateWithAI} disabled={isGenerating}>
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Fill sample
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentSlide ? (
            <Card className="min-w-0">
              <CardHeader className="flex flex-col gap-3 space-y-0 p-3 sm:p-6">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 font-mono text-xs text-muted-foreground">
                      {currentSlideIndex + 1}/{data.slides.length}
                    </div>
                    <Input
                      value={currentSlide.title}
                      onChange={(e) => updateSlide('title', e.target.value)}
                      className="h-10 w-full min-w-0 font-semibold"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setCurrentSlideIndex(Math.min(data.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === data.slides.length - 1}
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10"
                    onClick={() => moveSlide(currentSlideIndex, 'up')}
                    disabled={currentSlideIndex === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10"
                    onClick={() => moveSlide(currentSlideIndex, 'down')}
                    disabled={currentSlideIndex === data.slides.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10"
                    onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {viewMode === 'edit' ? 'Preview' : 'Edit'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="min-h-10"
                    onClick={() => removeSlide(currentSlideIndex)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6">
                {viewMode === 'edit' ? (
                  <>
                    <div>
                      <Label>Slide Content</Label>
                      <Textarea
                        value={currentSlide.content}
                        onChange={(e) => updateSlide('content', e.target.value)}
                        placeholder="Enter slide content (use bullet points, key messages)..."
                        className="min-h-[180px] font-mono text-sm sm:min-h-[250px]"
                      />
                    </div>
                    <div>
                      <Label>Speaker Notes</Label>
                      <Textarea
                        value={currentSlide.notes}
                        onChange={(e) => updateSlide('notes', e.target.value)}
                        placeholder="Notes for the presenter..."
                        className="min-h-[80px] text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div className="min-h-[220px] rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white sm:min-h-[350px] sm:p-8">
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
          <CardTitle className="text-base">Deck Information</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0 space-y-1.5">
              <Label>Company Name</Label>
              <Input
                className="min-h-11"
                value={data.companyName}
                onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Your company name"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label>Tagline</Label>
              <Input
                className="min-h-11"
                value={data.tagline}
                onChange={(e) => setData(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="Your company tagline"
              />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label>Funding Ask</Label>
              <Input
                className="min-h-11"
                value={data.askAmount}
                onChange={(e) => setData(prev => ({ ...prev, askAmount: e.target.value }))}
                placeholder="e.g., $500,000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
