'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Zap, ArrowRight, Check, Loader2, Bot, Rocket } from 'lucide-react';
import { createProfile, listSkills, type Skill } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';

type Role = 'founder' | 'mentor' | 'investor' | 'org';

interface Message {
  id: string;
  from: 'bot' | 'user';
  content: React.ReactNode;
  timestamp: Date;
}

type Step =
  | 'welcome'
  | 'name'
  | 'role'
  | 'headline'
  | 'location'
  | 'bio'
  | 'skills'
  | 'submitting'
  | 'done';

const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'founder', label: 'Founder', desc: 'Building and leading a startup', icon: Rocket },
  { value: 'mentor', label: 'Mentor', desc: 'Coaching and guiding teams', icon: User },
  { value: 'investor', label: 'Investor', desc: 'Backing early-stage teams', icon: Zap },
  { value: 'org', label: 'Organization', desc: 'Representing a company or institution', icon: Briefcase },
];

const BOT_QUESTIONS: Record<Step, string> = {
  welcome: "👋 Welcome to CoFounderBay! I'm going to help you set up your profile in a few quick steps. Ready?",
  name: "Great! First, what should we call you? (Your display name)",
  role: "Nice to meet you! What best describes your role?",
  headline: "Perfect. What's your professional headline? (e.g., \"Founder @ Stealth | Building AI tools\")",
  location: "Where are you based?",
  bio: "Tell us a bit about yourself — what you're working on and what you're looking for.",
  skills: "What are your key skills? Select all that apply.",
  submitting: "Creating your profile...",
  done: "🎉 Your profile is ready! Welcome to CoFounderBay.",
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="icon-sm text-primary-accessible" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="icon-sm text-primary-accessible" />
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end justify-end gap-2 animate-fade-in">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-3">
        <p className="text-sm text-primary-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

export function ConversationalOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [showTyping, setShowTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useRef({
    displayName: '',
    headline: '',
    location: '',
    bio: '',
    role: 'founder' as Role,
    skillIds: [] as string[],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, showTyping, scrollToBottom]);

  const addBotMessage = useCallback((content: React.ReactNode, delay = 600) => {
    setShowTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setShowTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), from: 'bot', content, timestamp: new Date() },
        ]);
        resolve();
      }, delay);
    });
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: 'user', content, timestamp: new Date() },
    ]);
  }, []);

  // Init: show welcome message
  useEffect(() => {
    void addBotMessage(BOT_QUESTIONS.welcome, 800).then(() => {
      setTimeout(() => void addBotMessage("Let's start! What should we call you?", 400), 200);
      setStep('name');
    });
    // Load skills in background
    listSkills().then(setSkills).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advanceTo = useCallback(async (nextStep: Step, userMsg?: string) => {
    if (userMsg) addUserMessage(userMsg);
    await addBotMessage(BOT_QUESTIONS[nextStep], 700);
    setStep(nextStep);
    setInputValue('');
    setTimeout(() => (inputRef.current as HTMLInputElement | null)?.focus(), 100);
  }, [addBotMessage, addUserMessage]);

  const handleSubmitName = useCallback(async () => {
    const name = inputValue.trim();
    if (!name) return;
    form.current.displayName = name;
    await advanceTo('role', name);
  }, [inputValue, advanceTo]);

  const handleSelectRole = useCallback(async (role: Role, label: string) => {
    form.current.role = role;
    setSelectedRole(role);
    await advanceTo('headline', label);
  }, [advanceTo]);

  const handleSubmitHeadline = useCallback(async () => {
    const h = inputValue.trim();
    if (!h) return;
    form.current.headline = h;
    await advanceTo('location', h);
  }, [inputValue, advanceTo]);

  const handleSubmitLocation = useCallback(async () => {
    const loc = inputValue.trim();
    form.current.location = loc;
    await advanceTo('bio', loc || 'Not specified');
  }, [inputValue, advanceTo]);

  const handleSubmitBio = useCallback(async () => {
    const bio = inputValue.trim();
    form.current.bio = bio;
    await advanceTo('skills', bio.length > 60 ? bio.slice(0, 57) + '...' : bio || 'Skipped');
  }, [inputValue, advanceTo]);

  const handleToggleSkill = useCallback((skillId: string, skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
    form.current.skillIds = selectedSkills.includes(skillId)
      ? selectedSkills.filter((s) => s !== skillId)
      : [...selectedSkills, skillId];
  }, [selectedSkills]);

  const handleSubmitSkills = useCallback(async () => {
    form.current.skillIds = selectedSkills;
    const skillNames = skills
      .filter((s) => selectedSkills.includes(s.id))
      .map((s) => s.name)
      .join(', ') || 'None selected';

    addUserMessage(skillNames);
    setSubmitting(true);
    setStep('submitting');

    try {
      await createProfile({
        displayName: form.current.displayName,
        headline: form.current.headline || undefined,
        bio: form.current.bio || undefined,
        location: form.current.location || undefined,
        role: form.current.role,
        skillIds: form.current.skillIds.length ? form.current.skillIds : undefined,
      });
      await addBotMessage(BOT_QUESTIONS.done, 500);
      setStep('done');
      setTimeout(() => router.push('/'), 1500);
    } catch {
      await addBotMessage("Oops! Something went wrong. Let me try again...", 500);
      setSubmitting(false);
      setStep('skills');
    }
  }, [selectedSkills, skills, addBotMessage, addUserMessage, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'name') void handleSubmitName();
      else if (step === 'headline') void handleSubmitHeadline();
      else if (step === 'location') void handleSubmitLocation();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Logo size="xs" />
          <p className="text-xs text-muted-foreground border-l border-border pl-3">Profile Setup</p>
          {/* Progress dots */}
          <div className="ml-auto flex gap-1.5">
            {(['name', 'role', 'headline', 'location', 'bio', 'skills'] as Step[]).map((s, i) => {
              const steps: Step[] = ['name', 'role', 'headline', 'location', 'bio', 'skills', 'submitting', 'done'];
              const current = steps.indexOf(step);
              const thisStep = steps.indexOf(s);
              return (
                <span
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    thisStep < current ? 'w-4 bg-primary' :
                    thisStep === current ? 'w-4 bg-primary/50' :
                    'w-1.5 bg-border',
                  )}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) =>
          msg.from === 'bot'
            ? <BotBubble key={msg.id}>{msg.content}</BotBubble>
            : <UserBubble key={msg.id}>{msg.content as string}</UserBubble>
        )}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Role selection */}
          {step === 'role' && !showTyping && (
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void handleSelectRole(value, label)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                    selectedRole === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50',
                  )}
                >
                  <Icon className="icon-md text-primary-accessible shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Skills multi-select */}
          {step === 'skills' && !showTyping && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {(skills.length ? skills : [
                  { id: 'react', name: 'React', slug: 'react', category: null },
                  { id: 'node', name: 'Node.js', slug: 'node', category: null },
                  { id: 'product', name: 'Product Management', slug: 'product', category: null },
                  { id: 'fundraising', name: 'Fundraising', slug: 'fundraising', category: null },
                  { id: 'sales', name: 'Sales', slug: 'sales', category: null },
                  { id: 'marketing', name: 'Marketing', slug: 'marketing', category: null },
                  { id: 'design', name: 'UI/UX Design', slug: 'design', category: null },
                  { id: 'ml', name: 'Machine Learning', slug: 'ml', category: null },
                ]).map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleToggleSkill(skill.id, skill.name)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selectedSkills.includes(skill.id)
                        ? 'border-primary bg-primary/10 text-primary-accessible'
                        : 'border-border text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    {selectedSkills.includes(skill.id) && <Check className="inline icon-sm mr-1" />}
                    {skill.name}
                  </button>
                ))}
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleSubmitSkills}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="icon-sm animate-spin" /> : <ArrowRight className="icon-sm" />}
                {submitting ? 'Creating profile...' : 'Complete Setup'}
              </Button>
            </div>
          )}

          {/* Text input */}
          {(step === 'name' || step === 'headline' || step === 'location') && !showTyping && (
            <div className="flex gap-2">
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  step === 'name' ? 'Your name...' :
                  step === 'headline' ? 'Your professional headline...' :
                  'City, Country...'
                }
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={() => {
                  if (step === 'name') void handleSubmitName();
                  else if (step === 'headline') void handleSubmitHeadline();
                  else if (step === 'location') void handleSubmitLocation();
                }}
                disabled={step === 'name' && !inputValue.trim()}
                size="icon"
              >
                <ArrowRight className="icon-sm" />
              </Button>
            </div>
          )}

          {/* Bio textarea */}
          {step === 'bio' && !showTyping && (
            <div className="space-y-2">
              <Textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                autoFocus
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => void handleSubmitBio()}
                >
                  Skip
                </button>
                <Button onClick={() => void handleSubmitBio()} className="gap-2">
                  <ArrowRight className="icon-sm" />
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <Button className="w-full gap-2" onClick={() => router.push('/')}>
              <ArrowRight className="icon-sm" />
              Explore CoFounderBay
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
