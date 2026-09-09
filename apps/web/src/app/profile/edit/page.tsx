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
  GraduationCap,
  Rocket,
  TrendingUp,
  Building2,
  Save,
  ArrowLeft,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  LayoutDashboard,
  ShieldAlert,
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
import { calculateProfileCompletion } from '@/components/common/ProfileCompletion';
import { useToast } from '@/components/ui/toast';
import { ImageCropperTrigger } from '@/components/ui/image-cropper';
import { analytics } from '@/lib/analytics';
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
              <X className="icon-2xs" aria-hidden="true" />
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
      
      // Analytics
      void analytics.track('profile_updated', {
        fields_changed: Object.keys(rolePayload).concat(['displayName', 'headline', 'bio', 'location', 'languages']),
      });
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
          <Loader2 className="icon-xl animate-spin text-primary" aria-hidden="true" />
        </div>
      </AppShell>
    );
  }

  const completionFields = calculateProfileCompletion(form as Record<string, unknown>);
  const totalCompletionWeight = completionFields.reduce((sum, field) => sum + field.weight, 0);
  const completedCompletionWeight = completionFields
    .filter((field) => field.completed)
    .reduce((sum, field) => sum + field.weight, 0);
  const completionPercentage = totalCompletionWeight === 0
    ? 0
    : Math.round((completedCompletionWeight / totalCompletionWeight) * 100);
  const missingCompletionFields = completionFields.filter((field) => !field.completed);

  return (
    <AppShell
      title="Edit Profile"
      description="Update your personal details and how you appear to others"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <ArrowLeft className="icon-sm" aria-hidden="true" />
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            {saving ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Save className="icon-sm" aria-hidden="true" />}
            Save changes
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] pb-10">
        {/* Main content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 overflow-x-auto hide-scrollbar">
              <TabsTrigger 
                value="basic" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <User className="icon-sm" aria-hidden="true" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="role" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Briefcase className="icon-sm" aria-hidden="true" />
                Role Details
              </TabsTrigger>
              <TabsTrigger 
                value="links" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Globe className="icon-sm" aria-hidden="true" />
                Social Links
              </TabsTrigger>
              <TabsTrigger 
                value="portfolio" 
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <LayoutDashboard className="icon-sm" aria-hidden="true" />
                Portfolio
              </TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              {/* Avatar */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="icon-md text-primary" aria-hidden="true" />
                    Profile Photo
                  </CardTitle>
                  <CardDescription>A friendly face helps others recognize you and builds trust</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ImageCropperTrigger
                      cropShape="circle"
                      aspectRatio={1}
                      outputSize={400}
                      title="Crop Profile Photo"
                      onCrop={async (blob, dataUrl) => {
                        setUploadingAvatar(true);
                        try {
                          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                          const { upload } = await uploadAvatar(file);
                          updateField('avatarUrl', upload.url);
                          success('Avatar updated', 'Your photo has been cropped and uploaded');
                          void analytics.track('avatar_uploaded');
                        } catch (err) {
                          showError('Upload failed', err instanceof Error ? err.message : 'Please try again');
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                    >
                      <div className="relative group cursor-pointer">
                        <Avatar className="h-28 w-28 ring-4 ring-background shadow-md">
                          <AvatarImage src={form.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                            {form.displayName[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="icon-xl text-white" aria-hidden="true" />
                        </div>
                      </div>
                    </ImageCropperTrigger>
                    <div className="space-y-4 flex-1 w-full">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          placeholder="Paste image URL..."
                          value={form.avatarUrl}
                          onChange={(e) => updateField('avatarUrl', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="gap-2 sm:w-auto w-full"
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Camera className="icon-sm" aria-hidden="true" />}
                          Crop & Upload
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click the photo to crop & upload. Recommended size: 400x400px. JPG, PNG or WebP. Max 5MB.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Name & Headline */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <User className="icon-md text-primary" aria-hidden="true" />
                        Personal Identity
                      </CardTitle>
                      <CardDescription>How you'll appear across the platform</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 text-primary border-primary/30 hover:bg-primary/10 self-start"
                      onClick={handleAISuggest}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                      {aiLoading ? 'Analyzing Profile...' : 'AI Suggestions'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name <span className="text-destructive">*</span></label>
                    <Input
                      value={form.displayName}
                      onChange={(e) => updateField('displayName', e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="max-w-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Headline</label>
                    <Input
                      value={form.headline}
                      onChange={(e) => updateField('headline', e.target.value)}
                      placeholder="e.g., 3x Founder | Building AI SaaS | ex-Google"
                    />
                    <p className="text-xs text-muted-foreground">Appears directly below your name everywhere on the site.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">About / Bio</label>
                      <span className={cn("text-xs", form.bio.length > 400 ? "text-amber-500" : "text-muted-foreground")}>
                        {form.bio.length}/500
                      </span>
                    </div>
                    <Textarea
                      value={form.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      placeholder="Tell the community about your background, what you're working on, and what you're looking for..."
                      rows={5}
                      className="resize-y"
                    />
                  </div>

                  {/* AI Suggestions panel */}
                  {showAISuggestions && aiSuggestions && (
                    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/20 rounded-md">
                            <Sparkles className="icon-sm text-primary" aria-hidden="true" />
                          </div>
                          <span className="font-semibold text-foreground">AI Review</span>
                          <Badge variant={aiSuggestions.completionScore > 80 ? 'default' : 'secondary'} className="text-xs ml-2">
                            {aiSuggestions.completionScore}% Optimization Score
                          </Badge>
                        </div>
                        <Button aria-label="Close" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShowAISuggestions(false)}>
                          <X className="icon-sm" aria-hidden="true" />
                        </Button>
                      </div>

                      <div className="space-y-4 pt-2">
                        {aiSuggestions.headline && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Headline</p>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <p className="text-sm text-foreground flex-1 bg-background/80 rounded-lg px-4 py-2.5 border border-border shadow-sm italic">
                                "{aiSuggestions.headline}"
                              </p>
                              <Button size="sm" variant="secondary" className="shrink-0 gap-1.5 w-full sm:w-auto"
                                onClick={() => { updateField('headline', aiSuggestions.headline!); }}>
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Apply
                              </Button>
                            </div>
                          </div>
                        )}

                        {aiSuggestions.bio && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Bio</p>
                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-foreground bg-background/80 rounded-lg px-4 py-3 border border-border shadow-sm whitespace-pre-wrap">
                                {aiSuggestions.bio}
                              </p>
                              <Button size="sm" variant="secondary" className="gap-1.5 self-start"
                                onClick={() => { updateField('bio', aiSuggestions.bio!); }}>
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Apply Bio
                              </Button>
                            </div>
                          </div>
                        )}

                        {aiSuggestions.improvements.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actionable Feedback</p>
                            <ul className="space-y-2">
                              {aiSuggestions.improvements.map((imp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="icon-md text-primary" aria-hidden="true" />
                    Location & Timezone
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City, Country</label>
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
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="icon-md text-primary" aria-hidden="true" />
                    Skills & Expertise
                  </CardTitle>
                  <CardDescription>What are your core strengths and areas of focus?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <TagInput
                    label="Core Skills (Max 15)"
                    value={form.skills}
                    onChange={(v) => updateField('skills', v)}
                    suggestions={skillCatalog.length ? skillCatalog.map((s) => s.name) : expertiseOptions}
                    placeholder="Type a skill and press Enter..."
                    max={15}
                  />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <TagInput
                      label="Industries"
                      value={form.industries}
                      onChange={(v) => updateField('industries', v)}
                      suggestions={industryOptions}
                      placeholder="e.g. Fintech, AI..."
                      max={5}
                    />
                    <TagInput
                      label="Languages"
                      value={form.languages}
                      onChange={(v) => updateField('languages', v)}
                      suggestions={['English', 'Greek', 'Spanish', 'French', 'German', 'Chinese']}
                      placeholder="e.g. English, Greek..."
                      max={5}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role Details */}
            <TabsContent value="role" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              {/* Role Selector */}
              <Card className="shadow-sm border-primary/20 bg-primary/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="icon-md text-primary" aria-hidden="true" />
                    Your Primary Role
                  </CardTitle>
                  <CardDescription>Select how you primarily participate in the ecosystem</CardDescription>
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
                      <Rocket className="icon-sm" aria-hidden="true" />
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
                      <GraduationCap className="icon-sm" aria-hidden="true" />
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
                      <TrendingUp className="icon-sm" aria-hidden="true" />
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
                      <Building2 className="icon-sm" aria-hidden="true" />
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

            {/* Social Links */}
            <TabsContent value="links" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="icon-md text-primary" aria-hidden="true" />
                    Web & Social Links
                  </CardTitle>
                  <CardDescription>Connect your other profiles so people can learn more about you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="icon-sm text-muted-foreground" aria-hidden="true" /> Personal Website
                      </label>
                      <Input
                        value={form.websiteUrl}
                        onChange={(e) => updateField('websiteUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Linkedin className="icon-sm text-blue-600" aria-hidden="true" /> LinkedIn
                      </label>
                      <Input
                        value={form.linkedinUrl}
                        onChange={(e) => updateField('linkedinUrl', e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Github className="icon-sm" aria-hidden="true" /> GitHub
                      </label>
                      <Input
                        value={form.githubUrl}
                        onChange={(e) => updateField('githubUrl', e.target.value)}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.964H5.078z"/>
                        </svg>
                        X (Twitter)
                      </label>
                      <Input
                        value={form.twitterUrl}
                        onChange={(e) => updateField('twitterUrl', e.target.value)}
                        placeholder="https://x.com/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <Card className="shadow-sm border-border/50 text-center py-12">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                    <LayoutDashboard className="icon-xl" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold">Portfolio Builder Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Soon you'll be able to add detailed case studies, pitch decks, past startups, and comprehensive project showcases to your profile.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('basic')}>
                    Go back to Basic Info
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-sm border-border/50 sticky top-6">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                  <span className="text-sm text-muted-foreground pb-1">Complete</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      completionPercentage >= 80 ? "bg-emerald-500" :
                      completionPercentage >= 50 ? "bg-primary" : "bg-amber-500"
                    )}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2.5 pt-2">
                <p className="text-sm font-medium text-foreground">Missing items:</p>
                <ul className="space-y-2">
                  {missingCompletionFields.length === 0 ? (
                    <li className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 p-2 rounded-md">
                      <CheckCircle2 className="icon-sm" aria-hidden="true" /> Your profile is fully complete!
                    </li>
                  ) : (
                    missingCompletionFields.slice(0, 4).map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldAlert className="icon-sm text-amber-500" aria-hidden="true" />
                        <span className="capitalize">{item.label}</span>
                      </li>
                    ))
                  )}
                  {missingCompletionFields.length > 4 && (
                    <li className="text-xs text-muted-foreground text-center pt-1 italic">
                      + {missingCompletionFields.length - 4} more items
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <Button onClick={handleSave} disabled={saving} className="w-full gap-2 font-medium">
                  {saving ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Save className="icon-sm" aria-hidden="true" />}
                  Save Changes
                </Button>
                <div className="flex gap-2">
                  <Link href="/profile" className="flex-1">
                    <Button variant="outline" className="w-full text-xs h-9">
                      View Profile
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => setActiveTab('links')}>
                    Add Links
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
