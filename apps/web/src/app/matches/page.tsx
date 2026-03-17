'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, ArrowRight, UserPlus } from 'lucide-react';
import { getRecommendations, sendConnectionRequest, type SearchHit } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { AnimatedList } from '@/components/common/AnimatedList';
import { MatchCard } from '@/components/common/MatchCard';
import { ConnectionRequestDialog } from '@/components/common/ConnectionRequest';
import { useToast } from '@/components/ui/toast';
import { ProfileCardSkeleton } from '@/components/discover/ProfileCard';
import type { ProfileCardData } from '@/components/discover/ProfileCard';

type MatchReason = { type: 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values'; text: string; score: number };

function buildMatchReasonsFromScore(score: number): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (score >= 30) reasons.push({ type: 'skills', text: 'Complementary role & skills', score: 30 });
  if (score >= 45) reasons.push({ type: 'stage', text: 'Matching startup stage', score: Math.min(20, score - 30) });
  if (score >= 65) reasons.push({ type: 'industry', text: 'Similar industry focus', score: 15 });
  if (score >= 80) reasons.push({ type: 'location', text: 'Same location', score: 10 });
  if (reasons.length === 0) reasons.push({ type: 'skills', text: 'Potential match', score });
  return reasons;
}

function hitToProfile(hit: SearchHit): ProfileCardData {
  return {
    id: hit.id,
    userId: hit.userId,
    displayName: hit.displayName,
    headline: hit.headline,
    bio: hit.bio,
    avatarUrl: hit.avatarUrl,
    role: hit.role,
    location: hit.location,
    skills: hit.skillNames ?? [],
    matchScore: hit.matchScore,
    lookingFor: hit.lookingFor,
    availability: hit.availability,
  };
}

export default function MatchesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [connectionTarget, setConnectionTarget] = useState<ProfileCardData | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false;
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', 'matches', { limit: 20 }],
    queryFn: () => getRecommendations({ limit: 20 }),
    staleTime: 3 * 60_000,
    enabled: hasToken,
  });

  const suggestions: SearchHit[] = data?.suggestions ?? [];

  const handleConnect = (profile: ProfileCardData) => {
    setConnectionTarget(profile);
    setShowConnectionDialog(true);
  };

  const handleSendConnection = async (message: string) => {
    if (!connectionTarget) return;
    try {
      await sendConnectionRequest({ receiverId: connectionTarget.userId, message: message || undefined });
      success('Connection request sent!', `Your request to ${connectionTarget.displayName} has been sent.`);
      setShowConnectionDialog(false);
      setConnectionTarget(null);
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err) {
      showError('Could not send request', err instanceof Error ? err.message : 'Please try again');
    }
  };

  const handleMessage = (profile: ProfileCardData) => {
    router.push(`/messages?to=${profile.userId}`);
  };

  return (
    <AppShell
      title="My Matches"
      description="Cofounder and team matches based on your profile"
      actions={
        <Link href="/discover">
          <Button variant="secondary" className="gap-2">
            Discover
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Your top matches
          </h1>
          <p className="text-muted-foreground mt-1">
            People with the highest compatibility for cofounder or team fit. Connect to start a conversation.
          </p>
        </div>

        {!hasToken && (
          <EmptyState
            title="Sign in to see matches"
            description="Your matches are personalized based on your profile and preferences."
            illustration="connection"
            action={
              <Link href="/login">
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            }
          />
        )}

        {hasToken && isLoading && (
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <ProfileCardSkeleton key={i} variant="featured" />
            ))}
          </div>
        )}

        {hasToken && !isLoading && suggestions.length === 0 && (
          <EmptyState
            title="No matches yet"
            description="Complete your profile (stage, commitment, roles sought) to get better cofounder and team suggestions."
            illustration="rocket"
            action={
              <Link href="/profile/edit">
                <Button className="gap-2">
                  Complete profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            }
          />
        )}

        {hasToken && !isLoading && suggestions.length > 0 && (
          <AnimatedList
            animation="scale-in"
            staggerDelay={80}
            className="grid gap-6 md:grid-cols-2"
          >
            {suggestions.map((hit) => {
              const profile = hitToProfile(hit);
              const score = hit.matchScore ?? 50;
              const matchReasons: MatchReason[] = hit.matchReasons?.length
                ? hit.matchReasons.map((text) => ({ type: 'skills' as const, text, score: 0 }))
                : buildMatchReasonsFromScore(score);
              return (
                <MatchCard
                  key={hit.id}
                  id={hit.id}
                  userId={hit.userId}
                  displayName={hit.displayName}
                  headline={hit.headline}
                  avatarUrl={hit.avatarUrl}
                  role={hit.role}
                  location={hit.location}
                  skills={hit.skillNames ?? []}
                  compatibilityScore={score}
                  matchReasons={matchReasons}
                  onLike={() => handleConnect(profile)}
                  onPass={() => {}}
                  onMessage={() => handleMessage(profile)}
                  onBookmark={() => success('Saved', `${hit.displayName} added to bookmarks`)}
                />
              );
            })}
          </AnimatedList>
        )}
      </div>

      {connectionTarget && (
        <ConnectionRequestDialog
          open={showConnectionDialog}
          onOpenChange={(open) => {
            setShowConnectionDialog(open);
            if (!open) setConnectionTarget(null);
          }}
          recipient={{
            id: connectionTarget.userId,
            displayName: connectionTarget.displayName,
            avatarUrl: connectionTarget.avatarUrl,
            role: connectionTarget.role,
            headline: connectionTarget.headline,
          }}
          onSend={handleSendConnection}
        />
      )}
    </AppShell>
  );
}
