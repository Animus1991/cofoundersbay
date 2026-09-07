'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Plus, X,
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
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph, CfbGlyphWell, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useToast } from '@/components/ui/toast';
import { bilingualAria } from '@/lib/i18n/format';
import {
  projectEn,
  projectEl,
  useProjectPrimaryText,
  PROJECT_STAGE_FULL_KEYS,
} from '@/lib/i18n/strings-projects';
import { cn } from '@/lib/utils';
import {
  createDemoProject,
  PROJECT_STATUS_GLYPH,
  type ProjectStatus,
} from '@/lib/projects-demo';

const STATUS_OPTIONS: { value: ProjectStatus; hintKey: 'stage_idea_hint' | 'stage_validating_hint' | 'stage_building_hint' | 'stage_launched_hint' | 'stage_scaling_hint' }[] = [
  { value: 'idea', hintKey: 'stage_idea_hint' },
  { value: 'validating', hintKey: 'stage_validating_hint' },
  { value: 'building', hintKey: 'stage_building_hint' },
  { value: 'launched', hintKey: 'stage_launched_hint' },
  { value: 'scaling', hintKey: 'stage_scaling_hint' },
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

const STEPS: { n: number; key: 'step_basics' | 'step_stage' | 'step_team' | 'step_review'; glyph: CfbGlyphName }[] = [
  { n: 1, key: 'step_basics', glyph: 'briefcase' },
  { n: 2, key: 'step_stage', glyph: 'target' },
  { n: 3, key: 'step_team', glyph: 'people' },
  { n: 4, key: 'step_review', glyph: 'flag' },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const t = useProjectPrimaryText();
  const { open: openAskAi } = usePopupChat();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setTags(tags.filter((item) => item !== tag));
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
    if (step === 2) return Boolean(status && industry);
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = createDemoProject({
        name,
        tagline,
        description,
        status,
        industry,
        location,
        website,
        maxTeamSize: Number(maxTeamSize) || 5,
        rolesNeeded,
        tags,
      });
      success(t(projectEn('created'), projectEl('created')), t(projectEn('created_hint'), projectEl('created_hint')));
      router.push(`/projects/${created.id}`);
    } catch {
      showError(t(projectEn('fail_create'), projectEl('fail_create')), t(projectEn('try_again'), projectEl('try_again')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageKey = PROJECT_STAGE_FULL_KEYS[status];

  return (
    <AppShell
      showHelp
      actions={
        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => openAskAi()}>
          <CfbGlyph name="spark" className="icon-sm" />
          <BilingualText en={projectEn('ask_ai_create')} el={projectEl('ask_ai_create')} compact />
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => router.push('/projects')}
            aria-label={bilingualAria(projectEn('back_projects'), projectEl('back_projects'))}
          >
            <ArrowLeft className="icon-md" />
          </Button>
          <CfbGlyphWell name="briefcase" size="sm" />
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-medium transition-colors',
                  s.n <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
                title={t(projectEn(s.key), projectEl(s.key))}
              >
                {s.n < step ? <Check className="icon-sm" /> : <CfbGlyph name={s.glyph} className="icon-sm" />}
              </div>
              {s.n < 4 && (
                <div className={cn('h-1 flex-1 rounded-full', s.n < step ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>
        <p className="text-2xs text-muted-foreground">
          <BilingualText en={projectEn(STEPS[step - 1].key)} el={projectEl(STEPS[step - 1].key)} compact />
        </p>

        {step === 1 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle><BilingualText en={projectEn('basics_title')} el={projectEl('basics_title')} /></CardTitle>
              <CardDescription><BilingualText en={projectEn('basics_desc')} el={projectEl('basics_desc')} /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <BilingualText en={projectEn('field_name')} el={projectEl('field_name')} compact /> *
                </Label>
                <Input id="name" className="rounded-xl" placeholder={t(projectEn('name_ph'), projectEl('name_ph'))} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">
                  <BilingualText en={projectEn('field_tagline')} el={projectEl('field_tagline')} compact /> *
                </Label>
                <Input id="tagline" className="rounded-xl" placeholder={t(projectEn('tagline_ph'), projectEl('tagline_ph'))} value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={100} />
                <p className="text-2xs text-muted-foreground">
                  <BilingualText en={projectEn('tagline_hint')} el={projectEl('tagline_hint')} />
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  <BilingualText en={projectEn('field_desc')} el={projectEl('field_desc')} compact /> *
                </Label>
                <Textarea id="description" className="rounded-xl" placeholder={t(projectEn('desc_ph'), projectEl('desc_ph'))} value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle><BilingualText en={projectEn('stage_title')} el={projectEl('stage_title')} /></CardTitle>
              <CardDescription><BilingualText en={projectEn('stage_desc')} el={projectEl('stage_desc')} /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label><BilingualText en={projectEn('field_stage')} el={projectEl('field_stage')} compact /> *</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const fullKey = PROJECT_STAGE_FULL_KEYS[opt.value];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                          status === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                        )}
                      >
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          status === opt.value ? 'bg-primary/10 text-primary-accessible' : 'bg-muted text-muted-foreground',
                        )}>
                          <CfbGlyph name={PROJECT_STATUS_GLYPH[opt.value]} className="icon-md" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {fullKey ? <BilingualText en={projectEn(fullKey)} el={projectEl(fullKey)} compact /> : opt.value}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <BilingualText en={projectEn(opt.hintKey)} el={projectEl(opt.hintKey)} compact />
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  <BilingualText en={projectEn('field_industry')} el={projectEl('field_industry')} compact /> *
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="industry" className="rounded-xl">
                    <SelectValue placeholder={t(projectEn('industry_ph'), projectEl('industry_ph'))} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location"><BilingualText en={projectEn('field_location')} el={projectEl('field_location')} compact /></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <CfbGlyph name="building" className="icon-sm" />
                    </span>
                    <Input id="location" className="rounded-xl pl-9" placeholder={t(projectEn('location_ph'), projectEl('location_ph'))} value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website"><BilingualText en={projectEn('field_website')} el={projectEl('field_website')} compact /></Label>
                  <Input id="website" className="rounded-xl" placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle><BilingualText en={projectEn('team_title')} el={projectEl('team_title')} /></CardTitle>
              <CardDescription><BilingualText en={projectEn('team_desc')} el={projectEl('team_desc')} /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamSize"><BilingualText en={projectEn('field_team_size')} el={projectEl('field_team_size')} compact /></Label>
                <Select value={maxTeamSize} onValueChange={setMaxTeamSize}>
                  <SelectTrigger id="teamSize" className="w-[180px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {t(projectEn('n_members'), projectEl('n_members'))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label><BilingualText en={projectEn('field_roles')} el={projectEl('field_roles')} compact /></Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => (rolesNeeded.includes(role) ? removeRole(role) : addRole(role))}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm transition-colors',
                        rolesNeeded.includes(role)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    className="rounded-xl"
                    placeholder={t(projectEn('custom_role_ph'), projectEl('custom_role_ph'))}
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole(customRole))}
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => addRole(customRole)}>
                    <Plus className="icon-sm" />
                  </Button>
                </div>
                {rolesNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {rolesNeeded.map((role) => (
                      <Badge key={role} variant="secondary" className="gap-1 rounded-full">
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

        {step === 4 && (
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle><BilingualText en={projectEn('review_title')} el={projectEl('review_title')} /></CardTitle>
              <CardDescription><BilingualText en={projectEn('review_desc')} el={projectEl('review_desc')} /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label><BilingualText en={projectEn('field_tags')} el={projectEl('field_tags')} compact /></Label>
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
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    className="rounded-xl"
                    placeholder={t(projectEn('custom_tag_ph'), projectEl('custom_tag_ph'))}
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addCustomTag}>
                    <Plus className="icon-sm" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground">
                  <BilingualText en={projectEn('review')} el={projectEl('review')} compact />
                </h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground"><BilingualText en={projectEn('review_name')} el={projectEl('review_name')} compact /></span>
                    <span className="font-medium">{name || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground"><BilingualText en={projectEn('review_stage')} el={projectEl('review_stage')} compact /></span>
                    <span className="font-medium">{stageKey ? t(projectEn(stageKey), projectEl(stageKey)) : '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground"><BilingualText en={projectEn('review_industry')} el={projectEl('review_industry')} compact /></span>
                    <span className="font-medium">{industry || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground"><BilingualText en={projectEn('review_team')} el={projectEl('review_team')} compact /></span>
                    <span className="font-medium">{maxTeamSize} {t(projectEn('n_members'), projectEl('n_members'))}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground"><BilingualText en={projectEn('review_roles')} el={projectEl('review_roles')} compact /></span>
                    <span className="font-medium">{rolesNeeded.length || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" className="rounded-xl" onClick={() => setStep(step - 1)} disabled={step === 1}>
            <ArrowLeft className="icon-sm mr-2" />
            <BilingualText en={projectEn('back')} el={projectEl('back')} compact />
          </Button>
          {step < 4 ? (
            <Button className="rounded-xl" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              <BilingualText en={projectEn('next')} el={projectEl('next')} compact />
              <ArrowRight className="icon-sm ml-2" />
            </Button>
          ) : (
            <Button className="rounded-xl" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting
                ? <BilingualText en={projectEn('creating')} el={projectEl('creating')} compact />
                : <BilingualText en={projectEn('create')} el={projectEl('create')} compact />}
              <CfbGlyph name="briefcase" className="icon-sm ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
