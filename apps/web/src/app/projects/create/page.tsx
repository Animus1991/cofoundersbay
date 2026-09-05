'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, Plus, X, Rocket, Target,
  Users, Briefcase, Globe, MapPin, Zap, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type ProjectStatus = 'idea' | 'validating' | 'building' | 'launched' | 'scaling';

const STATUS_OPTIONS: { value: ProjectStatus; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'idea', label: 'Idea Stage', description: 'Just an idea, looking for validation', icon: Zap },
  { value: 'validating', label: 'Validating', description: 'Testing the market and building MVP', icon: Target },
  { value: 'building', label: 'Building', description: 'Actively developing the product', icon: Rocket },
  { value: 'launched', label: 'Launched', description: 'Product is live with users', icon: TrendingUp },
  { value: 'scaling', label: 'Scaling', description: 'Growing and expanding', icon: Briefcase },
];

const INDUSTRIES = [
  'AI/ML', 'B2B SaaS', 'CleanTech', 'Consumer', 'EdTech', 'FinTech',
  'HealthTech', 'Marketplace', 'Social', 'Developer Tools', 'E-commerce', 'Other',
];

const COMMON_ROLES = [
  'Technical Co-founder', 'Backend Engineer', 'Frontend Engineer', 'Full-stack Developer',
  'Mobile Developer', 'Designer', 'Product Manager', 'Growth Lead', 'Marketing',
  'Sales', 'Operations', 'Data Scientist', 'DevOps', 'Other',
];

const COMMON_TAGS = [
  'AI', 'B2B', 'B2C', 'SaaS', 'Marketplace', 'Mobile', 'Web', 'API',
  'Open Source', 'Remote', 'Sustainability', 'Health', 'Finance', 'Education',
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('idea');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState('5');
  const [rolesNeeded, setRolesNeeded] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const addRole = (role: string) => {
    if (role && !rolesNeeded.includes(role)) {
      setRolesNeeded([...rolesNeeded, role]);
    }
    setCustomRole('');
  };

  const removeRole = (role: string) => {
    setRolesNeeded(rolesNeeded.filter((r) => r !== role));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag]);
    }
    setCustomTag('');
  };

  const canProceed = () => {
    if (step === 1) return name.trim() && tagline.trim() && description.trim();
    if (step === 2) return status && industry;
    if (step === 3) return true;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      success('Project created!', 'Your project is now live and visible to potential co-founders.');
      router.push('/projects');
    } catch (err) {
      showError('Failed to create project', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="icon-md" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Project</h1>
            <p className="text-muted-foreground">Share your idea and find co-founders</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                s < step && 'bg-primary text-primary-foreground',
                s === step && 'bg-primary text-primary-foreground',
                s > step && 'bg-muted text-muted-foreground'
              )}>
                {s < step ? <Check className="icon-sm" /> : s}
              </div>
              {s < 4 && (
                <div className={cn(
                  'flex-1 h-1 rounded-full',
                  s < step ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about your project idea</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., EcoTrack"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline *</Label>
                <Input
                  id="tagline"
                  placeholder="e.g., AI-powered carbon footprint tracking"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">A short, catchy description (max 100 characters)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project, the problem you're solving, and your vision..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Stage & Industry */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Stage & Industry</CardTitle>
              <CardDescription>Help potential co-founders understand where you are</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Project Stage *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                          status === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          status === opt.value ? 'bg-primary/10 text-primary-accessible' : 'bg-muted text-muted-foreground'
                        )}>
                          <Icon className="icon-md" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{opt.label}</p>
                          <p className="text-sm text-muted-foreground">{opt.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Team & Roles */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Team & Roles</CardTitle>
              <CardDescription>What roles are you looking for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Target Team Size</Label>
                <Select value={maxTeamSize} onValueChange={setMaxTeamSize}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} members</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Roles Needed</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => rolesNeeded.includes(role) ? removeRole(role) : addRole(role)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                        rolesNeeded.includes(role)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom role..."
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole(customRole))}
                  />
                  <Button type="button" variant="outline" onClick={() => addRole(customRole)}>
                    <Plus className="icon-sm" />
                  </Button>
                </div>
                {rolesNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {rolesNeeded.map((role) => (
                      <Badge key={role} variant="secondary" className="gap-1">
                        {role}
                        <button type="button" onClick={() => removeRole(role)}>
                          <X className="icon-sm" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Tags & Review */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags & Review</CardTitle>
              <CardDescription>Add tags and review your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                        tags.includes(tag)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomTag}>
                    <Plus className="icon-sm" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-4">
                <h3 className="font-semibold text-foreground">Review</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage</span>
                    <span className="font-medium">{STATUS_OPTIONS.find((s) => s.value === status)?.label || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-medium">{industry || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team Size</span>
                    <span className="font-medium">{maxTeamSize} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roles Needed</span>
                    <span className="font-medium">{rolesNeeded.length || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="icon-sm mr-2" />
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="icon-sm ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
              <Rocket className="icon-sm ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
