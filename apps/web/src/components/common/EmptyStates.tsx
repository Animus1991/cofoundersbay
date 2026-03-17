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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  className?: string;
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
      <Link href="/discover">
        <Button className="gap-2">
          <Compass className="h-4 w-4" />
          Discover people
        </Button>
      </Link>
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
      <Link href="/connections">
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          View connections
        </Button>
      </Link>
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
      <Link href="/events/create">
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          Create event
        </Button>
      </Link>
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
      <Button className="gap-2">
        <Briefcase className="h-4 w-4" />
        Post a job
      </Button>
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
      <Link href="/groups">
        <Button className="gap-2">
          <Search className="h-4 w-4" />
          Browse groups
        </Button>
      </Link>
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
      <p className="text-sm text-muted-foreground max-w-sm">
        You have no new notifications. We&apos;ll let you know when something happens.
      </p>
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
      <Button variant="secondary" onClick={() => window.history.back()}>
        Go back
      </Button>
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
      <Button className="gap-2">
        <ShoppingBag className="h-4 w-4" />
        List a service
      </Button>
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
      <Link href="/mentoring">
        <Button className="gap-2">
          <Search className="h-4 w-4" />
          Find mentors
        </Button>
      </Link>
    </div>
  );
}
