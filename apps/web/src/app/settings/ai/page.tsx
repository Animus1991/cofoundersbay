'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sparkles,
  Sliders,
  MessageSquare,
  Shield,
  Zap,
  Languages,
  ThermometerSun,
  ArrowLeft,
  Save,
  Loader2,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { getAIModels, getAIAgents, getAIHealth, type AgentConfig } from '@/lib/ai-api';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { cn } from '@/lib/utils';

type AIPreferences = {
  preferredModel: string;
  preferredProvider: string;
  temperature: number;
  maxTokens: number;
  responseStyle: 'concise' | 'detailed' | 'casual' | 'formal';
  responseLanguage: string;
  useEmoji: boolean;
  enableStreaming: boolean;
  enableSuggestions: boolean;
  enableContextMemory: boolean;
  enableAutoSave: boolean;
  saveConversations: boolean;
  shareForTraining: boolean;
  anonymizeData: boolean;
  defaultAgent: string;
};

const DEFAULT_PREFS: AIPreferences = {
  preferredModel: 'llama3.2',
  preferredProvider: 'ollama',
  temperature: 0.7,
  maxTokens: 2048,
  responseStyle: 'concise',
  responseLanguage: 'en',
  useEmoji: false,
  enableStreaming: true,
  enableSuggestions: true,
  enableContextMemory: true,
  enableAutoSave: true,
  saveConversations: true,
  shareForTraining: false,
  anonymizeData: true,
  defaultAgent: 'general',
};

const RESPONSE_STYLES = [
  { value: 'concise', label: 'Concise', desc: 'Short, to-the-point answers' },
  { value: 'detailed', label: 'Detailed', desc: 'Comprehensive explanations' },
  { value: 'casual', label: 'Casual', desc: 'Friendly, conversational tone' },
  { value: 'formal', label: 'Formal', desc: 'Professional, business-like' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'el', label: 'Greek (Ελληνικά)' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'de', label: 'German (Deutsch)' },
  { value: 'it', label: 'Italian (Italiano)' },
  { value: 'pt', label: 'Portuguese (Português)' },
  { value: 'zh', label: 'Chinese (中文)' },
  { value: 'ja', label: 'Japanese (日本語)' },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        checked ? 'bg-primary' : 'bg-secondary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export default function AISettingsPage() {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<AIPreferences>(DEFAULT_PREFS);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch AI health status
  const { data: health } = useQuery({
    queryKey: ['ai-health'],
    queryFn: () => getAIHealth().catch(() => ({ available: false, models: [] })),
    staleTime: 30000,
  });

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => getAIModels().catch(() => ({ models: [] })),
    staleTime: 60000,
  });

  // Fetch available agents
  const { data: agentsData } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => getAIAgents().catch(() => ({ agents: [] })),
    staleTime: 60000,
  });

  const models = modelsData?.models || [];
  const agents = agentsData?.agents || [];
  const isAIAvailable = health?.available ?? false;

  const updatePref = <K extends keyof AIPreferences>(key: K, value: AIPreferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // In a real implementation, this would save to the API
    // For now, we'll just save to localStorage and show success
    try {
      localStorage.setItem('ai-preferences', JSON.stringify(prefs));
      success('AI preferences saved successfully');
      setHasChanges(false);
    } catch (err) {
      showError('Failed to save preferences');
    }
  };

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-preferences');
      if (saved) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="icon-sm" />
            Back to Settings
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <CfbGlyph name="spark" className="icon-md" />
                </div>
                AI Assistant Settings
              </h1>
              <p className="mt-1 text-muted-foreground">
                Customize how the AI assistant works for you
              </p>
            </div>
            <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
              {hasChanges ? <Save className="icon-sm" /> : <CheckCircle2 className="icon-sm" />}
              {hasChanges ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>

        {/* AI Status Banner */}
        <Card className={cn(
          'mb-6 border-2',
          isAIAvailable ? 'border-status-success-border bg-status-success-bg' : 'border-status-warning-border bg-status-warning-bg'
        )}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isAIAvailable ? 'bg-status-success-bg' : 'bg-status-warning-bg'
              )}>
                {isAIAvailable ? (
                  <Zap className="icon-md text-status-success" />
                ) : (
                  <Info className="icon-md text-status-warning" />
                )}
              </div>
              <div>
                <p className={cn(
                  'font-medium',
                  isAIAvailable ? 'text-status-success' : 'text-status-warning'
                )}>
                  {isAIAvailable ? 'AI Assistant is Online' : 'AI Assistant is Offline'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAIAvailable 
                    ? `${models.length} model(s) available via Ollama`
                    : 'Start Ollama to enable AI features. Run: ollama serve'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="icon-md text-primary-accessible" />
                Model Configuration
              </CardTitle>
              <CardDescription>
                Choose which AI model to use and configure its behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Preferred Model</Label>
                  <Select
                    value={prefs.preferredModel}
                    onValueChange={(v) => updatePref('preferredModel', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.length > 0 ? (
                        models.map((m: any) => (
                          <SelectItem key={m.name} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="llama3.2">llama3.2 (recommended)</SelectItem>
                          <SelectItem value="llama3.1:8b">llama3.1:8b</SelectItem>
                          <SelectItem value="mistral">mistral</SelectItem>
                          <SelectItem value="phi-3">phi-3</SelectItem>
                          <SelectItem value="deepseek-r1">deepseek-r1</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The AI model that powers your assistant
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Agent</Label>
                  <Select
                    value={prefs.defaultAgent}
                    onValueChange={(v) => updatePref('defaultAgent', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.length > 0 ? (
                        agents.map((a: AgentConfig) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="general">General Assistant</SelectItem>
                          <SelectItem value="matching">Co-Founder Matching</SelectItem>
                          <SelectItem value="pitch-coach">Pitch Coach</SelectItem>
                          <SelectItem value="research">Research Assistant</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The default AI persona for new conversations
                  </p>
                </div>
              </div>

              {/* Temperature Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ThermometerSun className="icon-sm text-muted-foreground" />
                  Creativity (Temperature)
                </Label>
                <Select
                  value={String(prefs.temperature)}
                  onValueChange={(v) => updatePref('temperature', parseFloat(v))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.1">0.1 - Very Precise</SelectItem>
                    <SelectItem value="0.3">0.3 - Focused</SelectItem>
                    <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                    <SelectItem value="0.7">0.7 - Creative (Default)</SelectItem>
                    <SelectItem value="0.9">0.9 - Very Creative</SelectItem>
                    <SelectItem value="1.0">1.0 - Maximum Creativity</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Higher values make responses more varied and creative
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label>Max Response Length</Label>
                <Select
                  value={String(prefs.maxTokens)}
                  onValueChange={(v) => updatePref('maxTokens', parseInt(v))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">Short (512 tokens)</SelectItem>
                    <SelectItem value="1024">Medium (1024 tokens)</SelectItem>
                    <SelectItem value="2048">Long (2048 tokens)</SelectItem>
                    <SelectItem value="4096">Very Long (4096 tokens)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Response Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="icon-md text-blue-500" />
                Response Style
              </CardTitle>
              <CardDescription>
                Customize how the AI communicates with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Style Selection */}
              <div className="grid gap-3 sm:grid-cols-2">
                {RESPONSE_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => updatePref('responseStyle', style.value as any)}
                    className={cn(
                      'flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all',
                      prefs.responseStyle === style.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="font-medium">{style.label}</span>
                    <span className="text-sm text-muted-foreground">{style.desc}</span>
                  </button>
                ))}
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="icon-sm text-muted-foreground" />
                  Response Language
                </Label>
                <Select
                  value={prefs.responseLanguage}
                  onValueChange={(v) => updatePref('responseLanguage', v)}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Use Emoji */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Use Emojis</p>
                  <p className="text-sm text-muted-foreground">
                    Include emojis in AI responses for a friendlier tone
                  </p>
                </div>
                <Toggle
                  checked={prefs.useEmoji}
                  onChange={(v) => updatePref('useEmoji', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="icon-md text-status-success" />
                Features
              </CardTitle>
              <CardDescription>
                Enable or disable AI assistant features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: 'enableStreaming', label: 'Streaming Responses', desc: 'See AI responses as they are generated' },
                { key: 'enableSuggestions', label: 'Suggested Questions', desc: 'Show quick action suggestions in chat' },
                { key: 'enableContextMemory', label: 'Context Memory', desc: 'AI remembers context from earlier in the conversation' },
                { key: 'enableAutoSave', label: 'Auto-Save Conversations', desc: 'Automatically save your chat history' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Toggle
                    checked={prefs[key as keyof AIPreferences] as boolean}
                    onChange={(v) => updatePref(key as keyof AIPreferences, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="icon-md text-status-warning" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control how your AI conversation data is handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: 'saveConversations', label: 'Save Conversations', desc: 'Store your AI chat history for future reference' },
                { key: 'anonymizeData', label: 'Anonymize Data', desc: 'Remove personally identifiable information from saved data' },
                { key: 'shareForTraining', label: 'Help Improve AI', desc: 'Allow anonymized conversations to improve the AI (optional)' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Toggle
                    checked={prefs[key as keyof AIPreferences] as boolean}
                    onChange={(v) => updatePref(key as keyof AIPreferences, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Available Agents Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CfbGlyph name="spark" className="icon-md text-primary-accessible" />
                Available AI Agents
              </CardTitle>
              <CardDescription>
                Specialized AI assistants for different tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {(agents.length > 0 ? agents : [
                  { id: 'general', name: 'General Assistant', description: 'Platform help and FAQs' },
                  { id: 'matching', name: 'Co-Founder Matching', description: 'Find the right co-founder' },
                  { id: 'pitch-coach', name: 'Pitch Coach', description: 'Improve your pitch deck' },
                  { id: 'research', name: 'Research Assistant', description: 'Market research & analysis' },
                  { id: 'fundraising', name: 'Fundraising Advisor', description: 'Raise capital effectively' },
                  { id: 'growth-strategist', name: 'Growth Strategist', description: 'Scale your startup' },
                ]).map((agent: any) => (
                  <div
                    key={agent.id}
                    className="flex items-start gap-3 rounded-lg border border-border/60 p-3 bg-card"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-accessible">
                      <CfbGlyph name="spark" className="icon-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
