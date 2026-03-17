'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rocket, User, Briefcase, Zap, ArrowRight, ArrowLeft, Check, Camera, Loader2 } from 'lucide-react';
import { getMeProfile, createProfile, listSkills, uploadAvatar, type Skill } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { SkillChip } from '@/components/common/SkillChip';
import { cn } from '@/lib/utils';

const ONBOARDING_STORAGE_KEY = 'cfb_onboarding_state';

const ROLES = [
  { value: 'founder', label: 'Founder', desc: 'Building and leading a startup', icon: Rocket },
  { value: 'mentor', label: 'Mentor', desc: 'Coaching and guiding teams', icon: User },
  { value: 'investor', label: 'Investor', desc: 'Backing early-stage teams', icon: Zap },
  { value: 'org', label: 'Organization', desc: 'Representing a company or institution', icon: Briefcase },
] as const;

const STEPS = [
  { label: 'About You', icon: User },
  { label: 'Your Role', icon: Briefcase },
  { label: 'Skills', icon: Zap },
];

interface OnboardingState {
  step: number;
  role: string;
  form: {
    displayName: string;
    headline: string;
    bio: string;
    location: string;
    timezone: string;
    languages: string[];
    rolePayload: Record<string, unknown>;
    skillIds: string[];
  };
  avatarUrl: string | null;
}

function loadSavedState(): Partial<OnboardingState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

function clearSavedState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string>('founder');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stateRestored, setStateRestored] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    headline: '',
    bio: '',
    location: '',
    timezone: '',
    languages: [] as string[],
    rolePayload: {} as Record<string, unknown>,
    skillIds: [] as string[],
  });

  // Save state to localStorage whenever it changes
  const persistState = useCallback(() => {
    if (!stateRestored) return;
    saveState({ step, role, form, avatarUrl });
  }, [step, role, form, avatarUrl, stateRestored]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  useEffect(() => {
    let mounted = true;
    getMeProfile()
      .then(({ profile, hasCompletedOnboarding }) => {
        if (!mounted) return;
        if (hasCompletedOnboarding && profile) {
          clearSavedState();
          router.replace('/profile');
          return;
        }
        
        // Try to restore saved state first
        const savedState = loadSavedState();
        if (savedState && savedState.form?.displayName) {
          setStep(savedState.step || 1);
          setRole(savedState.role || 'founder');
          setForm(savedState.form);
          if (savedState.avatarUrl) {
            setAvatarUrl(savedState.avatarUrl);
            setAvatarPreview(savedState.avatarUrl);
          }
        } else if (profile) {
          // Fall back to profile data
          setForm((f) => ({
            ...f,
            displayName: profile.displayName ?? '',
            headline: profile.headline ?? '',
            bio: profile.bio ?? '',
            location: profile.location ?? '',
            timezone: profile.timezone ?? '',
            languages: profile.languages ?? [],
            rolePayload: profile.rolePayload ?? {},
            skillIds: profile.skills?.map((s) => s.skillId) ?? [],
          }));
          setRole(profile.role ?? 'founder');
        }
        setStateRestored(true);
      })
      .catch(() => router.replace('/login'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    listSkills().then(setSkills).catch(() => {});
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarUploading(true);
    try {
      const { upload } = await uploadAvatar(file);
      setAvatarUrl(upload.url);
    } catch {
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: form.displayName.trim(),
        headline: form.headline || undefined,
        bio: form.bio || undefined,
        location: form.location || undefined,
        timezone: form.timezone || undefined,
        languages: form.languages.length ? form.languages : undefined,
        rolePayload: Object.keys(form.rolePayload).length ? form.rolePayload : undefined,
        skillIds: form.skillIds,
        ...(avatarUrl ? { avatarUrl } : {}),
      };
      await createProfile(payload);
      clearSavedState(); // Clear localStorage after successful submission
      router.replace('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  const progressValue = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col bg-hero-gradient border-r border-border/40 p-8">
        <Link href="/" className="flex items-center gap-2.5 mb-12">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">CoFounderBay</span>
        </Link>

        <div className="space-y-8 flex-1">
          <div>
            <h2 className="text-2xl font-bold mb-2">Set up your profile</h2>
            <p className="text-muted-foreground text-sm">Complete your profile to get matched with the right co-founders, mentors, and investors.</p>
          </div>

          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isCompleted = step > i + 1;
              const isCurrent = step === i + 1;
              return (
                <div key={s.label} className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  isCurrent ? 'bg-primary/10 border border-primary/20' : 'opacity-60'
                )}>
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  )}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className={cn('text-sm font-medium', isCurrent && 'text-primary')}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">Step {i + 1} of {STEPS.length}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          You can update all details later in Settings.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border/40">
          <Link href="/" className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">CoFounderBay</span>
          </Link>
          <span className="text-sm text-muted-foreground">Step {step}/{STEPS.length}</span>
        </div>

        <div className="flex-1 flex items-start justify-center p-6 lg:p-12">
          <div className="w-full max-w-xl">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold">{STEPS[step - 1].label}</h1>
                <span className="text-sm text-muted-foreground">{step}/{STEPS.length}</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

          <form
            onSubmit={
              step < 3
                ? (e) => { e.preventDefault(); setStep(step + 1); }
                : handleSubmit
            }
            className="space-y-6"
          >
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                      <AvatarImage src={avatarPreview ?? undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                        {form.displayName?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                    >
                      {avatarUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 5MB.</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-primary hover:underline mt-1">
                      {avatarPreview ? 'Change photo' : 'Upload photo'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Display name *</label>
                  <Input
                    required
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Your public name"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Headline</label>
                  <Input
                    value={form.headline}
                    onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                    placeholder="e.g. Technical co-founder building in AI"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell others what you're building and who you're looking for..."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Athens, Greece"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Input
                      value={form.timezone}
                      onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                      placeholder="e.g. Europe/Athens"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium">I am a...</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const active = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={cn(
                            'rounded-xl border p-4 text-left transition-all duration-200',
                            active
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border/60 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60'
                          )}
                        >
                          <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg', active ? 'bg-primary/20' : 'bg-secondary')}>
                            <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
                          </div>
                          <p className={cn('font-semibold text-sm', active && 'text-primary')}>{r.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {role === 'founder' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry</label>
                      <Input
                        value={(form.rolePayload?.industry as string) ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            rolePayload: {
                              ...f.rolePayload,
                              industry: e.target.value || undefined,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stage</label>
                      <select
                        value={(form.rolePayload?.stage as string) ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            rolePayload: {
                              ...f.rolePayload,
                              stage: e.target.value || undefined,
                            },
                          }))
                        }
                        className="h-10 w-full rounded-md border border-input bg-background/60 px-3 text-sm text-foreground shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select</option>
                        <option value="idea">Idea</option>
                        <option value="mvp">MVP</option>
                        <option value="traction">Traction</option>
                        <option value="scaling">Scaling</option>
                      </select>
                    </div>
                  </div>
                )}
                {role === 'mentor' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Expertise areas (comma-separated)
                    </label>
                    <Input
                      value={
                        Array.isArray(form.rolePayload?.expertiseAreas)
                          ? (form.rolePayload.expertiseAreas as string[]).join(', ')
                          : ''
                      }
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          rolePayload: {
                            ...f.rolePayload,
                            expertiseAreas: e.target.value
                              ? e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : undefined,
                          },
                        }))
                      }
                      placeholder="e.g. Product, Go-to-market"
                    />
                  </div>
                )}
                {role === 'investor' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Investment focus (comma-separated)
                      </label>
                      <Input
                        value={
                          Array.isArray(form.rolePayload?.investmentFocus)
                            ? (form.rolePayload.investmentFocus as string[]).join(', ')
                            : ''
                        }
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            rolePayload: {
                              ...f.rolePayload,
                              investmentFocus: e.target.value
                                ? e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                : undefined,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Typical check size
                      </label>
                      <Input
                        value={(form.rolePayload?.typicalCheckSize as string) ?? ''}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            rolePayload: {
                              ...f.rolePayload,
                              typicalCheckSize: e.target.value || undefined,
                            },
                          }))
                        }
                        placeholder="e.g. 50k - 200k EUR"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Select your skills</p>
                  <p className="text-xs text-muted-foreground mb-3">Pick up to 15 skills that best describe your expertise.</p>
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-1">
                    {skills.map((s) => {
                      const active = form.skillIds.includes(s.id);
                      return (
                        <label key={s.id} className="cursor-pointer">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                skillIds: active
                                  ? f.skillIds.filter((id) => id !== s.id)
                                  : f.skillIds.length < 15 ? [...f.skillIds, s.id] : f.skillIds,
                              }))
                            }
                            className="sr-only"
                          />
                          <SkillChip label={s.name} active={active} />
                        </label>
                      );
                    })}
                  </div>
                  {form.skillIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">{form.skillIds.length} skill{form.skillIds.length !== 1 ? 's' : ''} selected</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step > 1 && (
                <Button variant="outline" type="button" onClick={() => setStep(step - 1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button type="submit" disabled={saving || avatarUploading} className="gap-2">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : step < 3 ? (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>Complete setup <Check className="h-4 w-4" /></>
                )}
              </Button>
              {step === 1 && (
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground ml-auto">
                  Skip for now
                </Link>
              )}
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
