'use client';

import Link from 'next/link';
import {
  Users,
  MessageCircle,
  Calendar,
  Briefcase,
  UserPlus,
  Search,
  Bell,
  BookOpen,
  ShoppingBag,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  className?: string;
}

function AskAiLink({ prompt }: { prompt: string }) {
  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={`/ai?q=${encodeURIComponent(prompt)}`}>
        <Sparkles className="h-4 w-4 text-violet-500" />
        Ask AI
      </Link>
    </Button>
  );
}

export function EmptyConnections({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
        <Users className="h-8 w-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No connections yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Start building your network by discovering founders, mentors, and investors who share your interests.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/discover">
          <Button className="gap-2">
            <Compass className="h-4 w-4" />
            Discover people
          </Button>
        </Link>
        <AskAiLink prompt="I have no connections yet. Help me find a complementary cofounder and send a first intro." />
      </div>
    </div>
  );
}

export function EmptyMessages({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
        <MessageCircle className="h-8 w-8 text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No conversations</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Connect with someone to start a conversation. Your messages will appear here.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/connections">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            View connections
          </Button>
        </Link>
        <AskAiLink prompt="My inbox is empty. Who should I message first from my matches or connections?" />
      </div>
    </div>
  );
}

export function EmptyEvents({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
        <Calendar className="h-8 w-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming events</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        There are no events scheduled right now. Check back later or create your own event.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/events/create">
          <Button className="gap-2">
            <Calendar className="h-4 w-4" />
            Create event
          </Button>
        </Link>
        <AskAiLink prompt="There are no upcoming events. Suggest how I should use Events and Calendar to meet cofounders." />
      </div>
    </div>
  );
}

export function EmptyJobs({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
        <Briefcase className="h-8 w-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No jobs posted</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        There are no job listings at the moment. Post a job to find your next team member.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2">
          <Briefcase className="h-4 w-4" />
          Post a job
        </Button>
        <AskAiLink prompt="Help me write a cofounder or early-hire job post based on my profile gaps." />
      </div>
    </div>
  );
}

export function EmptyGroups({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No groups joined</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Join groups to connect with like-minded founders and participate in discussions.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/groups">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            Browse groups
          </Button>
        </Link>
        <AskAiLink prompt="I have not joined any groups. Which communities fit a founder looking for a technical cofounder?" />
      </div>
    </div>
  );
}

export function EmptyNotifications({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
        <Bell className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">All caught up!</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        You have no new notifications. We&apos;ll let you know when something happens.
      </p>
      <AskAiLink prompt="I am all caught up on notifications. What should I do next on CoFounderBay?" />
    </div>
  );
}

export function EmptySearchResults({ query, className }: EmptyStateProps & { query?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {query 
          ? `We couldn't find anything matching "${query}". Try different keywords.`
          : 'Try adjusting your search or filters to find what you\'re looking for.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go back
        </Button>
        <AskAiLink
          prompt={
            query
              ? `No search results for "${query}". Suggest better keywords or people I should look for instead.`
              : 'Help me search the network for a complementary cofounder.'
          }
        />
      </div>
    </div>
  );
}

export function EmptyLearning({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
        <BookOpen className="h-8 w-8 text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No resources yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Learning resources will appear here. Check back soon for new content.
      </p>
      <AskAiLink prompt="There are no learning resources yet. What should I study next given my venture readiness?" />
    </div>
  );
}

export function EmptyMarketplace({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/10">
        <ShoppingBag className="h-8 w-8 text-pink-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No services listed</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        The marketplace is empty. Be the first to offer your services to the community.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2">
          <ShoppingBag className="h-4 w-4" />
          List a service
        </Button>
        <AskAiLink prompt="The marketplace is empty. Help me decide whether to list a service or find an expert instead." />
      </div>
    </div>
  );
}

export function EmptyMentoringSessions({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
        <Users className="h-8 w-8 text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No sessions booked</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Book a session with a mentor to get personalized guidance for your startup journey.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/mentoring">
          <Button className="gap-2">
            <Search className="h-4 w-4" />
            Find mentors
          </Button>
        </Link>
        <AskAiLink prompt="I have no mentoring sessions. Recommend a mentor type for a first-time founder and how to book." />
      </div>
    </div>
  );
}
