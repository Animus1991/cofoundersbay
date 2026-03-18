'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Camera,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  Target,
  Clock,
  Languages,
  DollarSign,
  GraduationCap,
  Rocket,
  TrendingUp,
  Building2,
  Save,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getMeProfile, listSkills, updateProfile, uploadAvatar, getAIProfileSuggestions, type Skill, type ProfileSuggestions } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleBadge } from '@/components/common/RoleBadge';
import { ProfileCompletionCard, calculateProfileCompletion } from '@/components/common/ProfileCompletion';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type Role = 'founder' | 'mentor' | 'investor' | 'org';

type ProfileFormData = {
  // Basic info
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  timezone: string;
  
  // Links
  websiteUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  twitterUrl: string;

  // Skills & expertise
  skills: string[];
  industries: string[];
  languages: string[];

  // Role-specific
  role: Role;
  
  // Founder specific
  lookingFor: string[];
  startupStage: string;
  commitment: string;
  
  // Mentor specific
  expertiseAreas: string[];
  availability: string;
  meetingPreference: string;
  hourlyRate: string;

  // Investor specific
  investmentFocus: string[];
  investmentStages: string[];
  checkSizeMin: string;
  checkSizeMax: string;
  geography: string[];

  // Org specific
  orgType: string;
  programTypes: string[];
};

const defaultFormData: ProfileFormData = {
  displayName: '',
  headline: '',
  bio: '',
  avatarUrl: '',
  location: '',
  timezone: '',
  websiteUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  twitterUrl: '',
  skills: [],
  industries: [],
  languages: [],
  role: 'founder',
  lookingFor: [],
  startupStage: '',
  commitment: '',
  expertiseAreas: [],
  availability: '',
  meetingPreference: '',
  hourlyRate: '',
  investmentFocus: [],
  investmentStages: [],
  checkSizeMin: '',
  checkSizeMax: '',
  geography: [],
  orgType: '',
  programTypes: [],
};

const roleOptions: { value: Role; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'founder', label: 'Founder', icon: Rocket, description: 'Building or looking to build a startup' },
  { value: 'mentor', label: 'Mentor', icon: GraduationCap, description: 'Helping founders grow' },
  { value: 'investor', label: 'Investor', icon: TrendingUp, description: 'Investing in startups' },
  { value: 'org', label: 'Organization', icon: Building2, description: 'Accelerator, incubator, or hub' },
];

const startupStages = [
  { value: 'idea', label: 'Idea' },
  { value: 'mvp', label: 'MVP' },
  { value: 'traction', label: 'Traction' },
  { value: 'scaling', label: 'Scaling' },
];
const commitmentLevels = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'weekends', label: 'Weekends only' },
  { value: 'flexible', label: 'Flexible' },
];
const lookingForOptions = ['Co-founder', 'CTO', 'Designer', 'Marketing', 'Sales', 'Operations', 'Other'];
const industryOptions = ['AI/ML', 'Fintech', 'Healthtech', 'E-commerce', 'SaaS', 'Marketplace', 'Gaming', 'Education', 'Climate', 'Web3', 'Hardware', 'Consumer', 'Enterprise', 'Other'];
const expertiseOptions = ['Product', 'Engineering', 'Design', 'Marketing', 'Sales', 'Operations', 'Finance', 'Legal', 'HR', 'Fundraising', 'Growth', 'Strategy'];
const availabilityOptions = ['1-2 hours/week', '3-5 hours/week', '5-10 hours/week', 'On-demand'];
const investmentStageOptions = [
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B+' },
  { value: 'bootstrapped', label: 'Bootstrapped' },
];
const orgTypeOptions = ['Accelerator', 'Incubator', 'Hub', 'University', 'Corporate', 'Government'];
const programOptions = ['Acceleration', 'Incubation', 'Mentorship', 'Funding', 'Office space', 'Events'];

function normalizeFounderStage(input: string): string {
  const s = input.trim().toLowerCase();
  if (!s) return '';
  if (s === 'idea') return 'idea';
  if (s === 'mvp') return 'mvp';
  if (s === 'traction' || s === 'early traction' || s === 'early') return 'traction';
  if (s === 'scaling' || s === 'scale' || s === 'growth') return 'scaling';
  return s;
}

function normalizeCommitment(input: string): string {
  const s = input.trim().toLowerCase();
  if (!s) return '';
  if (s === 'full-time' || s === 'full time') return 'full-time';
  if (s === 'part-time' || s === 'part time') return 'part-time';
  if (s === 'weekends' || s === 'weekends only') return 'weekends';
  if (s === 'flexible') return 'flexible';
  return s;
}

function normalizeInvestmentStage(input: string): string {
  const s = input.trim().toLowerCase();
  if (!s) return '';
  if (s === 'pre-seed' || s === 'pre seed') return 'pre-seed';
  if (s === 'seed') return 'seed';
  if (s === 'series a' || s === 'series-a') return 'series-a';
  if (s === 'series b+' || s === 'series-b+' || s === 'series b' || s === 'series-b') return 'series-b';
  if (s === 'bootstrapped') return 'bootstrapped';
  return s;
}

function TagInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  max = 10,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  max?: number;
}) {
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const cleaned = tag.trim();
    if (cleaned && !value.includes(cleaned) && value.length < max) {
      onChange([...value, cleaned]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border/60 bg-background/50 min-h-[60px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={value.length < max ? placeholder : `Max ${max} reached`}
          disabled={value.length >= max}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
        />
      </div>
      {/* Suggestions */}
      <div className="flex flex-wrap gap-1">
        {suggestions
          .filter((s) => !value.includes(s))
          .slice(0, 8)
          .map((s) => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

function SelectButtons({
  label,
  value,
  onChange,
  options,
  multiple = false,
}: {
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: ({ value: string; label: string } | string)[];
  multiple?: boolean;
}) {
  const normalized = options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  const toggle = (opt: string) => {
    if (multiple) {
      const arr = value as string[];
      if (arr.includes(opt)) {
        onChange(arr.filter((v) => v !== opt));
      } else {
        onChange([...arr, opt]);
      }
    } else {
      onChange(opt);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {normalized.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full border text-sm transition-colors',
              selected.includes(opt.value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormData>(defaultFormData);
  const [formInitialized, setFormInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [aiLoading, setAILoading] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<ProfileSuggestions | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const handleAISuggest = async () => {
    setAILoading(true);
    try {
      const { suggestions } = await getAIProfileSuggestions();
      setAISuggestions(suggestions);
      setShowAISuggestions(true);
    } catch {
      showError('AI unavailable', 'Could not load suggestions right now');
    } finally {
      setAILoading(false);
    }
  };
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);

  const { data: meData, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: getMeProfile,
    staleTime: 5 * 60_000,
  });

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => listSkills(),
    staleTime: 10 * 60_000,
  });
  const skillCatalog = (skillsData ?? []) as Array<{ id: string; name: string; slug: string; category: string | null }>;
  const loading = profileLoading;

  // Initialize form once profile loads
  useEffect(() => {
    if (!meData?.profile || formInitialized) return;
    const profile = meData.profile;
    const rolePayload = (profile.rolePayload ?? {}) as Record<string, unknown>;
    const links = (rolePayload.links ?? {}) as Record<string, unknown>;
    setForm({
      ...defaultFormData,
      displayName: profile.displayName ?? '',
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      location: profile.location ?? '',
      timezone: profile.timezone ?? '',
      websiteUrl: (typeof links.websiteUrl === 'string' ? links.websiteUrl : '') ?? '',
      linkedinUrl: (typeof links.linkedinUrl === 'string' ? links.linkedinUrl : '') ?? '',
      githubUrl: (typeof links.githubUrl === 'string' ? links.githubUrl : '') ?? '',
      twitterUrl: (typeof links.twitterUrl === 'string' ? links.twitterUrl : '') ?? '',
      skills: profile.skills?.map((s) => s.skillName) ?? [],
      industries: Array.isArray(rolePayload.industries)
        ? (rolePayload.industries as unknown[]).filter((x): x is string => typeof x === 'string')
        : typeof rolePayload.industry === 'string' ? [rolePayload.industry] : [],
      languages: profile.languages ?? [],
      role: (profile.role || 'founder') as Role,
      startupStage: normalizeFounderStage(typeof rolePayload.stage === 'string' ? rolePayload.stage : ''),
      commitment: normalizeCommitment(typeof rolePayload.commitment === 'string' ? rolePayload.commitment : ''),
      lookingFor: Array.isArray(rolePayload.rolesSought)
        ? (rolePayload.rolesSought as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      expertiseAreas: Array.isArray(rolePayload.expertiseAreas)
        ? (rolePayload.expertiseAreas as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      availability: (typeof rolePayload.availability === 'string' ? rolePayload.availability : '') ?? '',
      meetingPreference: (typeof rolePayload.meetingPreferences === 'string' ? rolePayload.meetingPreferences : '') ?? '',
      hourlyRate: (typeof rolePayload.hourlyRate === 'string' ? rolePayload.hourlyRate : '') ?? '',
      investmentFocus: Array.isArray(rolePayload.investmentFocus)
        ? (rolePayload.investmentFocus as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      investmentStages: Array.isArray(rolePayload.stages)
        ? (rolePayload.stages as unknown[]).filter((x): x is string => typeof x === 'string').map(normalizeInvestmentStage).filter(Boolean) : [],
      checkSizeMin: (typeof rolePayload.checkSizeMin === 'string' ? rolePayload.checkSizeMin : '') ?? '',
      checkSizeMax: (typeof rolePayload.checkSizeMax === 'string' ? rolePayload.checkSizeMax : '') ?? '',
      geography: Array.isArray(rolePayload.geography)
        ? (rolePayload.geography as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      orgType: (typeof rolePayload.organizationType === 'string' ? rolePayload.organizationType : '') ?? '',
      programTypes: Array.isArray(rolePayload.programTypes)
        ? (rolePayload.programTypes as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    });
    setFormInitialized(true);
  }, [meData, formInitialized]);

  // Update form field
  const updateField = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      const skillIds = form.skills
        .map((name) => {
          const match = skillCatalog.find((s) => s.name.toLowerCase() === name.toLowerCase());
          return match?.id ?? null;
        })
        .filter((id): id is string => typeof id === 'string');

      const links = {
        websiteUrl: form.websiteUrl.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        githubUrl: form.githubUrl.trim() || undefined,
        twitterUrl: form.twitterUrl.trim() || undefined,
      };

      const rolePayload: Record<string, unknown> = {
        ...(Object.values(links).some(Boolean) ? { links } : {}),
        ...(form.industries.length ? { industries: form.industries, industry: form.industries[0] } : {}),
      };

      if (form.role === 'founder') {
        if (form.startupStage) rolePayload.stage = form.startupStage;
        if (form.commitment) rolePayload.commitment = form.commitment;
        if (form.lookingFor.length) rolePayload.rolesSought = form.lookingFor;
      }

      if (form.role === 'mentor') {
        if (form.expertiseAreas.length) rolePayload.expertiseAreas = form.expertiseAreas;
        if (form.availability) rolePayload.availability = form.availability;
        if (form.meetingPreference) rolePayload.meetingPreferences = form.meetingPreference;
        if (form.hourlyRate) rolePayload.hourlyRate = form.hourlyRate;
      }

      if (form.role === 'investor') {
        if (form.investmentFocus.length) rolePayload.investmentFocus = form.investmentFocus;
        if (form.investmentStages.length) rolePayload.stages = form.investmentStages;
        if (form.geography.length) rolePayload.geography = form.geography;
        if (form.checkSizeMin) rolePayload.checkSizeMin = form.checkSizeMin;
        if (form.checkSizeMax) rolePayload.checkSizeMax = form.checkSizeMax;
        const typical = [form.checkSizeMin, form.checkSizeMax].filter(Boolean).join(' - ');
        if (typical) rolePayload.typicalCheckSize = typical;
      }

      if (form.role === 'org') {
        if (form.orgType) rolePayload.organizationType = form.orgType;
        if (form.programTypes.length) rolePayload.programTypes = form.programTypes;
      }

      await updateProfile({
        displayName: form.displayName,
        headline: form.headline || undefined,
        bio: form.bio || undefined,
        avatarUrl: form.avatarUrl || undefined,
        location: form.location || undefined,
        timezone: form.timezone || undefined,
        languages: form.languages.length ? form.languages : undefined,
        rolePayload: Object.keys(rolePayload).length ? rolePayload : undefined,
        skillIds,
      });
      queryClient.invalidateQueries({ queryKey: ['me', 'profile'] });
      // Sync updated name/avatar to localStorage so TopNav UserMenu reflects changes immediately
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
          localStorage.setItem('user', JSON.stringify({
            ...stored,
            displayName: form.displayName,
            avatarUrl: form.avatarUrl || stored.avatarUrl,
          }));
        } catch { /* silent */ }
      }
      success('Profile saved', 'Your changes have been saved successfully');
    } catch {
      showError('Save failed', 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  if (profileError) {
    return (
      <AppShell title="Edit Profile">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
          <p className="text-sm text-muted-foreground">Failed to load your profile.</p>
          <Button variant="secondary" size="sm" onClick={() => void refetchProfile()}>Try again</Button>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Edit Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const completionFields = calculateProfileCompletion(form as Record<string, unknown>);

  return (
    <AppShell
      title="Edit Profile"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="basic" className="gap-2">
                <User className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="role" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Role Details
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-2">
                <Globe className="h-4 w-4" />
                Links
              </TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              {/* Avatar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile Photo</CardTitle>
                  <CardDescription>A profile photo helps others recognize you</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={form.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {form.displayName[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        placeholder="Avatar URL (optional)"
                        value={form.avatarUrl}
                        onChange={(e) => updateField('avatarUrl', e.target.value)}
                      />
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;

                          setUploadingAvatar(true);
                          try {
                            const { upload } = await uploadAvatar(file);
                            updateField('avatarUrl', upload.url);
                            success('Avatar uploaded', 'Your photo has been updated');
                          } catch (err) {
                            showError('Upload failed', err instanceof Error ? err.message : 'Please try again');
                          } finally {
                            setUploadingAvatar(false);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="gap-2"
                        disabled={uploadingAvatar}
                        onClick={() => avatarFileRef.current?.click()}
                      >
                        {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        Upload
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload an image (max 5MB) or paste a URL.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Name & Headline */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Name & Headline</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 text-primary border-primary/30 hover:bg-primary/5"
                      onClick={handleAISuggest}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {aiLoading ? 'Analyzing...' : 'Improve with AI'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name *</label>
                    <Input
                      value={form.displayName}
                      onChange={(e) => updateField('displayName', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Headline</label>
                    <Input
                      value={form.headline}
                      onChange={(e) => updateField('headline', e.target.value)}
                      placeholder="e.g., Founder @ StartupXYZ | Building the future of..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea
                      value={form.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="Tell others about yourself..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">{form.bio.length}/500</p>
                  </div>

                  {/* AI Suggestions panel */}
                  {showAISuggestions && aiSuggestions && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">AI Suggestions</span>
                          <Badge variant="secondary" className="text-xs">
                            {aiSuggestions.completionScore}% complete
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAISuggestions(false)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {aiSuggestions.headline && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Suggested headline:</p>
                          <div className="flex items-start gap-2">
                            <p className="text-sm text-foreground flex-1 bg-background rounded-md px-3 py-2 border border-border">
                              {aiSuggestions.headline}
                            </p>
                            <Button size="sm" variant="outline" className="shrink-0 gap-1"
                              onClick={() => { updateField('headline', aiSuggestions.headline!); }}>
                              <CheckCircle2 className="h-3 w-3" /> Apply
                            </Button>
                          </div>
                        </div>
                      )}

                      {aiSuggestions.bio && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Suggested bio:</p>
                          <div className="flex items-start gap-2">
                            <p className="text-sm text-foreground flex-1 bg-background rounded-md px-3 py-2 border border-border">
                              {aiSuggestions.bio}
                            </p>
                            <Button size="sm" variant="outline" className="shrink-0 gap-1"
                              onClick={() => { updateField('bio', aiSuggestions.bio!); }}>
                              <CheckCircle2 className="h-3 w-3" /> Apply
                            </Button>
                          </div>
                        </div>
                      )}

                      {aiSuggestions.improvements.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Improvements:</p>
                          <ul className="space-y-1">
                            {aiSuggestions.improvements.map((imp, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                                <span className="text-primary mt-0.5">•</span>
                                {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiSuggestions.missingElements.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Missing:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {aiSuggestions.missingElements.map((el, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-amber-600 border-amber-200">
                                {el}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City / Country</label>
                    <Input
                      value={form.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      placeholder="e.g., Athens, Greece"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Input
                      value={form.timezone}
                      onChange={(e) => updateField('timezone', e.target.value)}
                      placeholder="e.g., Europe/Athens"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Skills & Industries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TagInput
                    label="Skills"
                    value={form.skills}
                    onChange={(v) => updateField('skills', v)}
                    suggestions={skillCatalog.length ? skillCatalog.map((s) => s.name) : expertiseOptions}
                    placeholder="Add a skill..."
                    max={15}
                  />
                  <TagInput
                    label="Industries"
                    value={form.industries}
                    onChange={(v) => updateField('industries', v)}
                    suggestions={industryOptions}
                    placeholder="Add an industry..."
                    max={5}
                  />
                  <TagInput
                    label="Languages"
                    value={form.languages}
                    onChange={(v) => updateField('languages', v)}
                    suggestions={['English', 'Greek', 'Spanish', 'French', 'German', 'Chinese']}
                    placeholder="Add a language..."
                    max={5}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role Details */}
            <TabsContent value="role" className="space-y-6 mt-6">
              {/* Role Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Role</CardTitle>
                  <CardDescription>Select your primary role in the ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roleOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField('role', opt.value)}
                          className={cn(
                            'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                            form.role === opt.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border/60 hover:border-primary/50'
                          )}
                        >
                          <div className={cn(
                            'rounded-lg p-2',
                            form.role === opt.value ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Founder-specific */}
              {form.role === 'founder' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Founder Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SelectButtons
                      label="Startup Stage"
                      value={form.startupStage}
                      onChange={(v) => updateField('startupStage', v as string)}
                      options={startupStages}
                    />
                    <SelectButtons
                      label="Commitment Level"
                      value={form.commitment}
                      onChange={(v) => updateField('commitment', v as string)}
                      options={commitmentLevels}
                    />
                    <SelectButtons
                      label="Looking For"
                      value={form.lookingFor}
                      onChange={(v) => updateField('lookingFor', v as string[])}
                      options={lookingForOptions}
                      multiple
                    />
                  </CardContent>
                </Card>
              )}

              {/* Mentor-specific */}
              {form.role === 'mentor' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Mentor Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <TagInput
                      label="Expertise Areas"
                      value={form.expertiseAreas}
                      onChange={(v) => updateField('expertiseAreas', v)}
                      suggestions={expertiseOptions}
                      placeholder="Add expertise..."
                      max={10}
                    />
                    <SelectButtons
                      label="Availability"
                      value={form.availability}
                      onChange={(v) => updateField('availability', v as string)}
                      options={availabilityOptions}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Meeting Preference</label>
                        <select
                          value={form.meetingPreference}
                          onChange={(e) => updateField('meetingPreference', e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select...</option>
                          <option value="video">Video calls</option>
                          <option value="in-person">In person</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hourly Rate (optional)</label>
                        <Input
                          value={form.hourlyRate}
                          onChange={(e) => updateField('hourlyRate', e.target.value)}
                          placeholder="e.g., $100/hour or Free"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Investor-specific */}
              {form.role === 'investor' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Investor Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SelectButtons
                      label="Investment Focus"
                      value={form.investmentFocus}
                      onChange={(v) => updateField('investmentFocus', v as string[])}
                      options={industryOptions}
                      multiple
                    />
                    <SelectButtons
                      label="Investment Stages"
                      value={form.investmentStages}
                      onChange={(v) => updateField('investmentStages', v as string[])}
                      options={investmentStageOptions}
                      multiple
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Check Size</label>
                        <Input
                          value={form.checkSizeMin}
                          onChange={(e) => updateField('checkSizeMin', e.target.value)}
                          placeholder="e.g., $25K"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Check Size</label>
                        <Input
                          value={form.checkSizeMax}
                          onChange={(e) => updateField('checkSizeMax', e.target.value)}
                          placeholder="e.g., $500K"
                        />
                      </div>
                    </div>
                    <TagInput
                      label="Geography Focus"
                      value={form.geography}
                      onChange={(v) => updateField('geography', v)}
                      suggestions={['Global', 'Europe', 'USA', 'MENA', 'Asia', 'LATAM']}
                      placeholder="Add region..."
                      max={5}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Org-specific */}
              {form.role === 'org' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SelectButtons
                      label="Organization Type"
                      value={form.orgType}
                      onChange={(v) => updateField('orgType', v as string)}
                      options={orgTypeOptions}
                    />
                    <SelectButtons
                      label="Programs Offered"
                      value={form.programTypes}
                      onChange={(v) => updateField('programTypes', v as string[])}
                      options={programOptions}
                      multiple
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Links */}
            <TabsContent value="links" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Social & Professional Links</CardTitle>
                  <CardDescription>Help others learn more about you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </label>
                    <Input
                      value={form.websiteUrl}
                      onChange={(e) => updateField('websiteUrl', e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </label>
                    <Input
                      value={form.linkedinUrl}
                      onChange={(e) => updateField('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </label>
                    <Input
                      value={form.githubUrl}
                      onChange={(e) => updateField('githubUrl', e.target.value)}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">𝕏</span>
                      X (Twitter)
                    </label>
                    <Input
                      value={form.twitterUrl}
                      onChange={(e) => updateField('twitterUrl', e.target.value)}
                      placeholder="https://x.com/yourhandle"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile completion */}
          <ProfileCompletionCard fields={completionFields} />

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={form.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {form.displayName[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {form.displayName || 'Your name'}
                    </span>
                    <RoleBadge role={form.role} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {form.headline || 'Your headline'}
                  </p>
                </div>
              </div>
              {form.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {form.skills.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
