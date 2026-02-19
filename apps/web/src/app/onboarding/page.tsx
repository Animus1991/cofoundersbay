'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMeProfile, createProfile, listSkills, type Skill } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SkillChip } from '@/components/common/SkillChip';

const ROLES = [
  { value: 'founder', label: 'Founder' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'investor', label: 'Investor' },
  { value: 'org', label: 'Organization' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string>('founder');
  const [skills, setSkills] = useState<Skill[]>([]);
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

  useEffect(() => {
    let mounted = true;
    getMeProfile()
      .then(({ profile, hasCompletedOnboarding }) => {
        if (!mounted) return;
        if (hasCompletedOnboarding && profile) router.replace('/profile');
        else if (profile) {
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
      })
      .catch(() => router.replace('/login'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    listSkills().then(setSkills).catch(() => {});
  }, []);

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
      };
      await createProfile(payload);
      router.replace('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-radial text-sm text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <AppShell
      title="Complete your profile"
      description="Tell the community who you are and what you’re building."
      actions={<span className="text-sm text-muted-foreground">Step {step} of 3</span>}
    >
      <Card className="max-w-2xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl">Profile setup</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={
              step < 3
                ? (e) => {
                    e.preventDefault();
                    setStep(step + 1);
                  }
                : handleSubmit
            }
            className="space-y-6"
          >
            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display name *</label>
                  <Input
                    required
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayName: e.target.value }))
                    }
                    placeholder="Your public name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Headline</label>
                  <Input
                    value={form.headline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, headline: e.target.value }))
                    }
                    placeholder="e.g. Technical co-founder"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    rows={4}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, location: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Input
                      value={form.timezone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, timezone: e.target.value }))
                      }
                      placeholder="e.g. Europe/Athens"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium">I am a</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ROLES.map((r) => {
                      const active = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                            active
                              ? 'border-primary/60 bg-primary/15 text-primary'
                              : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <p className="font-medium">{r.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.value === 'founder' && 'Build and lead startups'}
                            {r.value === 'mentor' && 'Coach and guide teams'}
                            {r.value === 'investor' && 'Back early-stage teams'}
                            {r.value === 'org' && 'Represent an organization'}
                          </p>
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
              <div className="space-y-3">
                <label className="text-sm font-medium">Skills</label>
                <div className="flex flex-wrap gap-2">
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
                                : [...f.skillIds, s.id],
                            }))
                          }
                          className="sr-only"
                        />
                        <SkillChip label={s.name} active={active} />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {step > 1 && (
                <Button variant="secondary" type="button" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {step < 3 ? 'Next' : saving ? 'Saving…' : 'Complete'}
              </Button>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Skip for now
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
