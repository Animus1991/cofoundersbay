'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Rocket,
  GraduationCap,
  Award,
  Building,
  Sparkles,
  Save,
  RefreshCw,
  Copy,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

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
  icon: LucideIcon;
  deadline?: string;
  questions: ApplicationQuestion[];
  status: 'draft' | 'in-progress' | 'completed' | 'submitted';
}

interface ApplicationGeneratorProps {
  onSave?: (data: ApplicationTemplate[]) => void;
  workspaceData?: any;
}

const APPLICATION_TEMPLATES: Omit<ApplicationTemplate, 'status'>[] = [
  {
    id: 'yc',
    name: 'Y Combinator',
    description: 'The most prestigious startup accelerator',
    icon: Rocket,
    deadline: 'Rolling admissions',
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
    icon: Award,
    deadline: 'Varies by program',
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
    icon: GraduationCap,
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
    icon: Building,
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

export function ApplicationGenerator({ onSave, workspaceData }: ApplicationGeneratorProps) {
  const [applications, setApplications] = useState<ApplicationTemplate[]>(
    APPLICATION_TEMPLATES.map(t => ({ ...t, status: 'draft' as const }))
  );
  const [activeApp, setActiveApp] = useState<string>('yc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentApp = applications.find(a => a.id === activeApp);

  const calculateCompletion = (app: ApplicationTemplate) => {
    const requiredQuestions = app.questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => q.answer.trim().length > 0);
    return Math.round((answeredRequired.length / requiredQuestions.length) * 100);
  };

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
      
      setApplications(prev => prev.map(app => {
        if (app.id !== activeApp) return app;
        return {
          ...app,
          questions: app.questions.map(q => ({
            ...q,
            answer: generatedAnswers[q.id] || q.answer
          })),
          status: 'in-progress' as const
        };
      }));
      
      setIsGenerating(false);
    }, 3000);
  };

  const updateAnswer = (questionId: string, answer: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id !== activeApp) return app;
      return {
        ...app,
        questions: app.questions.map(q => 
          q.id === questionId ? { ...q, answer } : q
        ),
        status: 'in-progress' as const
      };
    }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = () => {
    onSave?.(applications);
  };

  const getStatusBadge = (status: ApplicationTemplate['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400 border-yellow-600">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600">Completed</Badge>;
      case 'submitted':
        return <Badge className="bg-green-600">Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <FileText className="icon-md text-orange-600 dark:text-orange-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Application Generator</h2>
            <p className="text-sm text-muted-foreground">
              Generate applications for accelerators, grants, and competitions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="icon-sm mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="icon-sm mr-2" aria-hidden="true" />
            )}
            AI Generate
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="icon-sm mr-2" aria-hidden="true" />
            Save All
          </Button>
        </div>
      </div>

      {/* Application Selector */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {applications.map(app => {
          const Icon = app.icon;
          const completion = calculateCompletion(app);
          
          return (
            <Card 
              key={app.id}
              className={cn(
                "cursor-pointer transition-all",
                activeApp === app.id && "ring-2 ring-primary"
              )}
              onClick={() => setActiveApp(app.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                <h3 className="font-semibold mb-1">{app.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{app.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Completion</span>
                    <span>{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-1.5" />
                </div>
                {app.deadline && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="icon-2xs" aria-hidden="true" />
                    {app.deadline}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Application Form */}
      {currentApp && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = currentApp.icon;
                  return <Icon className="h-6 w-6" />;
                })()}
                <div>
                  <CardTitle>{currentApp.name} Application</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentApp.questions.length} questions • {calculateCompletion(currentApp)}% complete
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="icon-sm mr-2" aria-hidden="true" />
                  View Program
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentApp.questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <Label className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </Label>
                  <div className="flex items-center gap-2">
                    {question.answer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(question.answer, question.id)}
                      >
                        {copiedId === question.id ? (
                          <CheckCircle2 className="icon-sm text-green-500" aria-hidden="true" />
                        ) : (
                          <Copy className="icon-sm" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                    {question.maxLength && (
                      <Badge variant="outline" className="text-xs">
                        {question.answer.length}/{question.maxLength}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Textarea
                  value={question.answer}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className={cn(
                    "min-h-[100px]",
                    question.maxLength && question.answer.length > question.maxLength && "border-red-500"
                  )}
                  maxLength={question.maxLength ? question.maxLength * 1.5 : undefined}
                />
                
                {question.tips && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Sparkles className="icon-2xs mt-0.5 shrink-0" aria-hidden="true" />
                    {question.tips}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
