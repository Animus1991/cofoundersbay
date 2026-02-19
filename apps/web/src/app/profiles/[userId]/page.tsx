'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPublicProfile } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/common/RoleBadge';
import { SkillChip } from '@/components/common/SkillChip';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getPublicProfile>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    getPublicProfile(userId, token ?? undefined)
      .then(setProfile)
      .catch(() => router.replace('/discover'))
      .finally(() => setLoading(false));
  }, [userId, router]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-radial">
        <Skeleton className="h-24 w-80" />
      </div>
    );
  if (!profile) return null;

  return (
    <AppShell
      title={profile.displayName}
      description={profile.headline ?? 'Public profile'}
      actions={
        <Link href="/discover">
          <Button variant="secondary">Back to Discover</Button>
        </Link>
      }
    >
      <Card className="max-w-2xl animate-fade-in">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">{profile.displayName}</CardTitle>
            <RoleBadge role={profile.role} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              {profile.location && <p>Location: {profile.location}</p>}
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
        </CardContent>
      </Card>
    </AppShell>
  );
}
