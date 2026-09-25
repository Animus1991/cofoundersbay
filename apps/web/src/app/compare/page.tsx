'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  X, Plus, UserPlus, MessageCircle, Sparkles, MapPin, Briefcase, GraduationCap, Clock, Target, Users, CheckCircle, XCircle, Minus, ChevronDown, ChevronUp, BarChart3, Zap, Heart, Share2, Download,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { getPublicProfile, getMatchBreakdown, sendConnectionRequest } from '@/lib/api';
import { qk } from '@/lib/query-keys';

const ComparisonChart = dynamic(
  () => import('./ComparisonChart').then((m) => ({ default: m.ComparisonChart })),
  { ssr: false, loading: () => <Skeleton className="h-[330px] w-full rounded-xl" /> }
);

type CompareProfile = {
  id: string;
  displayName: string;
  headline?: string;
  avatarUrl?: string;
  location?: string;
  role?: string;
  skills?: { name: string; level?: number }[];
  industries?: string[];
  stage?: string;
  availability?: string;
  languages?: string[];
  matchScore?: number;
  connectionStatus?: 'none' | 'pending' | 'connected';
};

const MAX_PROFILES = 4;

function ProfileColumn({
  profile,
  onRemove,
  onConnect,
  isConnecting,
}: {
  profile: CompareProfile;
  onRemove: () => void;
  onConnect: () => void;
  isConnecting: boolean;
}) {
  const initials = profile.displayName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  return (
    <div className="flex flex-col">
      {/* Header with remove button */}
      <div className="relative mb-4">
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 z-10 rounded-full bg-destructive p-1 text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
          aria-label="Remove from comparison"
        >
          <X className="icon-sm" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center text-center">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback className="text-base font-bold bg-primary/10 text-primary-accessible">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 font-semibold text-foreground line-clamp-1">
            {profile.displayName}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {profile.headline || profile.role || 'No headline'}
          </p>
          {profile.location && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="icon-sm" aria-hidden="true" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Score */}
      {profile.matchScore !== undefined && (
        <div className="mb-4 rounded-lg bg-primary/5 p-3 text-center">
          <p className="text-2xl font-bold text-primary-accessible">{profile.matchScore}%</p>
          <p className="text-xs text-muted-foreground">Match Score</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        {profile.connectionStatus === 'connected' ? (
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`/messages?user=${profile.id}`}>
              <MessageCircle className="icon-sm mr-1" aria-hidden="true" />
              Message
            </a>
          </Button>
        ) : profile.connectionStatus === 'pending' ? (
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Clock className="icon-sm mr-1" aria-hidden="true" />
            Pending
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onConnect}
            disabled={isConnecting}
          >
            <UserPlus className="icon-sm mr-1" aria-hidden="true" />
            Connect
          </Button>
        )}
      </div>

      {/* Skills */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
        <div className="flex flex-wrap gap-1">
          {profile.skills?.slice(0, 5).map((skill) => (
            <Badge key={skill.name} variant="secondary" className="text-xs">
              {skill.name}
            </Badge>
          )) || <span className="text-xs text-muted-foreground">No skills listed</span>}
        </div>
      </div>

      {/* Industries */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Industries</p>
        <div className="flex flex-wrap gap-1">
          {profile.industries?.slice(0, 3).map((ind) => (
            <Badge key={ind} variant="outline" className="text-xs">
              {ind}
            </Badge>
          )) || <span className="text-xs text-muted-foreground">Not specified</span>}
        </div>
      </div>

      {/* Stage & Availability */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stage</span>
          <span className="font-medium">{profile.stage || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Availability</span>
          <span className="font-medium">{profile.availability || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Languages</span>
          <span className="font-medium">{profile.languages?.join(', ') || '—'}</span>
        </div>
      </div>
    </div>
  );
}

function AddProfileSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-secondary/20 p-8 transition-colors hover:border-primary/40 hover:bg-secondary/40 min-h-[400px]"
    >
      <div className="rounded-full bg-primary/10 p-4 mb-3">
        <Plus className="icon-xl text-primary-accessible" />
      </div>
      <p className="font-medium text-foreground">Add Profile</p>
      <p className="text-sm text-muted-foreground mt-1">Select from matches or search</p>
    </button>
  );
}

function SkillsComparison({ profiles }: { profiles: CompareProfile[] }) {
  // Collect all unique skills
  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    profiles.forEach((p) => p.skills?.forEach((s) => skillSet.add(s.name)));
    return Array.from(skillSet).slice(0, 10);
  }, [profiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="icon-md text-primary-accessible" />
          Skills Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allSkills.map((skill) => (
            <div key={skill} className="flex items-center gap-4">
              <span className="w-32 text-sm font-medium truncate">{skill}</span>
              <div className="flex-1 flex gap-2">
                {profiles.map((p) => {
                  const hasSkill = p.skills?.some((s) => s.name === skill);
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex-1 h-6 rounded flex items-center justify-center text-xs font-medium',
                        hasSkill
                          ? 'bg-primary/20 text-primary-accessible'
                          : 'bg-secondary/50 text-muted-foreground'
                      )}
                    >
                      {hasSkill ? <CheckCircle className="icon-sm" aria-hidden="true" /> : <Minus className="icon-sm" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Parse profile IDs from URL
  useEffect(() => {
    const ids = searchParams?.get('ids')?.split(',').filter(Boolean) || [];
    setProfileIds(ids.slice(0, MAX_PROFILES));
  }, [searchParams]);

  // Fetch profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: qk('matching', 'compare', profileIds),
    queryFn: async () => {
      if (profileIds.length === 0) return [];
      const results = await Promise.all(
        profileIds.map(async (id) => {
          try {
            /*
             * The engine's own score for this pairing. It used to be
             * `Math.random() * 40 + 60`, which meant the comparison table —
             * the one screen whose entire job is putting people side by side
             * on the same measure — ranked them by dice. A profile the engine
             * cannot score keeps `matchScore` undefined and the column shows
             * a dash.
             */
            const [profile, breakdown] = await Promise.all([
              getPublicProfile(id),
              getMatchBreakdown(id).catch(() => null),
            ]);
            const rolePayload = (profile.rolePayload ?? {}) as Record<string, unknown>;
            return {
              id,
              displayName: profile.displayName || 'Unknown',
              headline: profile.headline ?? undefined,
              avatarUrl: profile.avatarUrl ?? undefined,
              location: profile.location ?? undefined,
              role: profile.role,
              skills: profile.skills?.map((s) => ({ name: s.skillName, level: s.level ? parseInt(s.level, 10) : undefined })),
              industries: Array.isArray(rolePayload.industries) ? rolePayload.industries as string[] : undefined,
              stage: typeof rolePayload.stage === 'string' ? rolePayload.stage : undefined,
              availability: typeof rolePayload.availability === 'string' ? rolePayload.availability : undefined,
              languages: profile.languages ?? undefined,
              matchScore: breakdown?.overall.score,
              connectionStatus: 'none' as const,
            } as CompareProfile;
          } catch {
            return null;
          }
        })
      );
      return results.filter(Boolean) as CompareProfile[];
    },
    enabled: profileIds.length > 0,
  });

  const updateUrl = (ids: string[]) => {
    const params = new URLSearchParams();
    if (ids.length > 0) params.set('ids', ids.join(','));
    router.replace(`/compare?${params.toString()}`);
  };

  const handleRemove = (id: string) => {
    const newIds = profileIds.filter((pid) => pid !== id);
    setProfileIds(newIds);
    updateUrl(newIds);
  };

  const handleAdd = () => {
    // Navigate to discover with compare mode
    router.push('/discover?mode=compare&returnTo=/compare');
  };

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    try {
      await sendConnectionRequest({ receiverId: id, message: 'I found you through profile comparison and would love to connect!' });
      success('Connection request sent!');
    } catch (err) {
      showError('Failed to send connection request');
    } finally {
      setConnectingId(null);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    success('Comparison link copied to clipboard!');
  };

  return (
    <AppShell
      actions={
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="icon-sm mr-1" aria-hidden="true" />
              Share
            </Button>
            {profileIds.length < MAX_PROFILES && (
              <Button size="sm" onClick={handleAdd}>
                <Plus className="icon-sm mr-1" aria-hidden="true" />
                Add Profile
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-6 pb-10">
        {/* Empty State */}
        {profileIds.length === 0 && (
          <EmptyState
            illustration="search"
            title="No profiles to compare"
            description="Add profiles from your matches or search to compare them side by side"
            askAiPrompt="Help me pick two or three people from my matches to compare as potential cofounders."
            action={
              <Button onClick={handleAdd}>
                <Plus className="icon-sm mr-2" aria-hidden="true" />
                Add Profiles
              </Button>
            }
          />
        )}

        {/* Profile Columns */}
        {profileIds.length > 0 && (
          <div className={cn(
            'grid grid-cols-1 gap-6',
            profileIds.length === 1 && 'grid-cols-1 max-w-md',
            profileIds.length === 2 && 'grid-cols-2',
            profileIds.length === 3 && 'grid-cols-3',
            profileIds.length === 4 && 'grid-cols-4',
          )}>
            {isLoading ? (
              Array.from({ length: profileIds.length }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-5 w-32 mt-3" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </div>
                </Card>
              ))
            ) : (
              <>
                {profiles?.map((profile) => (
                  <Card key={profile.id} className="p-4">
                    <ProfileColumn
                      profile={profile}
                      onRemove={() => handleRemove(profile.id)}
                      onConnect={() => handleConnect(profile.id)}
                      isConnecting={connectingId === profile.id}
                    />
                  </Card>
                ))}
                {profileIds.length < MAX_PROFILES && (
                  <AddProfileSlot onClick={handleAdd} />
                )}
              </>
            )}
          </div>
        )}

        {/* Comparison Charts */}
        {profiles && profiles.length >= 2 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ComparisonChart profiles={profiles} />
            <SkillsComparison profiles={profiles} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
