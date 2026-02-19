'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMeProfile } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/common/RoleBadge';
import { SkillChip } from '@/components/common/SkillChip';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ profile: Awaited<ReturnType<typeof getMeProfile>>['profile']; hasCompletedOnboarding: boolean } | null>(null);

  useEffect(() => {
    getMeProfile()
      .then((res) => {
        setData({ profile: res.profile, hasCompletedOnboarding: res.hasCompletedOnboarding });
        if (!res.hasCompletedOnboarding) router.replace('/onboarding');
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-radial">
        <Skeleton className="h-24 w-80" />
      </div>
    );
  const profile = data.profile;
  if (!profile) return null;

  return (
    <AppShell
      title="My profile"
      description="Keep your profile fresh to get better matches."
      actions={
        <Link href="/profile/edit">
          <Button>Edit profile</Button>
        </Link>
      }
    >
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">{profile.displayName}</CardTitle>
            <RoleBadge role={profile.role} />
          </div>
          {profile.headline && (
            <p className="text-sm text-muted-foreground">{profile.headline}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Details
              </p>
              <p>Role: {profile.role}</p>
              {profile.location && <p>Location: {profile.location}</p>}
              {profile.timezone && <p>Timezone: {profile.timezone}</p>}
              {profile.languages?.length ? (
                <p>Languages: {profile.languages.join(', ')}</p>
              ) : null}
            </div>
            {profile.skills?.length ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <SkillChip key={s.skillId} label={s.skillName} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {profile.rolePayload && Object.keys(profile.rolePayload).length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Role-specific
              </p>
              <pre className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-xs text-muted-foreground">
                {JSON.stringify(profile.rolePayload, null, 2)}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
