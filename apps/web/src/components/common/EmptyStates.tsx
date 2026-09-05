'use client';

import type { ComponentType, ReactNode } from 'react';
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
  Layers,
  Award,
  Rocket,
  GraduationCap,
  FileText,
  Webhook,
  KeyRound,
  Globe,
  Workflow,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';

interface EmptyStateProps {
  className?: string;
}

/* ────────────────────────────────────────────────────────────
 *  ListEmptyState — canonical empty/filtered state for lists.
 *  Replaces all hand-rolled "No X found" cards across the app.
 * ──────────────────────────────────────────────────────────── */

type ListEmptyStateVariant = 'card' | 'inline' | 'dashed';
type ListEmptyStateTone = 'neutral' | 'primary' | 'success' | 'warning' | 'info';

const TONE_CLASSES: Record<ListEmptyStateTone, string> = {
  neutral: 'bg-secondary text-muted-foreground',
  primary: 'bg-primary/10 text-primary-accessible',
  success: STATUS.success.chip,
  warning: STATUS.warning.chip,
  info: STATUS.info.chip,
};

export interface ListEmptyStateProps {
  /** Lucide icon to display in the circle */
  icon: LucideIcon | ComponentType<{ className?: string }>;
  /** Primary headline */
  title: ReactNode;
  /** Supportive description */
  description?: ReactNode;
  /** Primary CTA (usually create/add) */
  action?: ReactNode;
  /** Secondary CTA (usually clear filters or browse) */
  secondary?: ReactNode;
  /** Visual container variant */
  variant?: ListEmptyStateVariant;
  /** Icon tint */
  tone?: ListEmptyStateTone;
  /** Sizing — `compact` for inline-in-card; `comfortable` for full-page */
  size?: 'compact' | 'comfortable';
  className?: string;
}

/**
 * Canonical list empty state.
 *
 * Use this for any list/grid/table that has zero items — both "no data ever"
 * and "no results after filtering" cases. Wrap in `<Card>` or use inline.
 */
export function ListEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  variant = 'card',
  tone = 'neutral',
  size = 'comfortable',
  className,
}: ListEmptyStateProps) {
  const padding = size === 'compact' ? 'py-8 px-4' : 'py-14 px-6';
  const iconWrap = size === 'compact' ? 'h-12 w-12' : 'h-16 w-16';
  const iconSize = size === 'compact' ? 'h-6 w-6' : 'h-7 w-7';

  const content = (
    <div className={cn('flex flex-col items-center justify-center text-center', padding)}>
      <div className={cn('mb-4 flex items-center justify-center rounded-full', iconWrap, TONE_CLASSES[tone])}>
        <Icon className={iconSize} />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <div className="text-sm text-muted-foreground max-w-md mt-1.5">{description}</div>
      ) : null}
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return <div className={className}>{content}</div>;
  }

  if (variant === 'dashed') {
    return (
      <div className={cn('rounded-xl border border-dashed border-border/60 bg-card/30', className)}>
        {content}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}

/**
 * Helper: produces a "No results match your filters" empty state with a
 * Clear Filters secondary action. Use when filters are active.
 */
export function NoFilterResults({
  entity,
  onClear,
  className,
  description,
}: {
  entity: string;
  onClear?: () => void;
  className?: string;
  description?: ReactNode;
}) {
  return (
    <ListEmptyState
      icon={Search}
      title={`No ${entity} match your filters`}
      description={description ?? 'Try a different search term, broaden your filters, or clear them to start over.'}
      action={onClear ? (
        <Button variant="secondary" size="sm" onClick={onClear} className="gap-1.5">
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      ) : undefined}
      size="compact"
      className={className}
    />
  );
}

export function EmptyConnections({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.accent.bg)}>
        <Users className={cn('h-8 w-8', STATUS.accent.icon)} />
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
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-info-bg">
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
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.info.bg)}>
        <Calendar className={cn('h-8 w-8', STATUS.info.icon)} />
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
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.warning.bg)}>
        <Briefcase className={cn('h-8 w-8', STATUS.warning.icon)} />
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
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.success.bg)}>
        <Users className={cn('h-8 w-8', STATUS.success.icon)} />
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
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.warning.bg)}>
        <Bell className={cn('h-8 w-8', STATUS.warning.icon)} />
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
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.info.bg)}>
        <BookOpen className={cn('h-8 w-8', STATUS.info.icon)} />
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
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-accent-bg">
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
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-info-bg">
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

/* ────────────────────────────────────────────────────────────
 *  Organization & Tenant — entity-specific empty states.
 *  Each accepts `filtersActive` to render the filtered variant.
 * ──────────────────────────────────────────────────────────── */

type FilterAwareEmptyProps = {
  filtersActive?: boolean;
  onClearFilters?: () => void;
  className?: string;
};

export function EmptyOrgPrograms({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="programs" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Layers}
      tone="primary"
      title="No programs yet"
      description="Launch your first accelerator, bootcamp, or incubator program. Track applications, cohorts, and outcomes in one place."
      action={(
        <Button asChild>
          <Link href="/org/programs/new">
            <Plus className="mr-1.5 h-4 w-4" /> Create program
          </Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgCohorts({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="cohorts" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Users}
      tone="info"
      title="No cohorts yet"
      description="A cohort groups startups going through a program together. Create one to assign mentors, track milestones, and run demo days."
      action={(
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Create cohort
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgApplications({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="applications" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={FileText}
      tone="info"
      title="No applications yet"
      description="Once you publish a program with open applications, submissions will appear here for review and scoring."
      secondary={(
        <Button asChild variant="outline">
          <Link href="/org/programs">View programs</Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgMembers({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="members" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Users}
      tone="primary"
      title="No team members yet"
      description="Invite colleagues to help run programs, review applications, and manage cohorts. Roles control who can do what."
      action={(
        <Button>
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite member
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgMentors({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="mentors" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={GraduationCap}
      tone="success"
      title="No mentors invited yet"
      description="Mentors are vetted advisors you can assign to startups in your cohorts. Invite them by email or pick from the platform directory."
      action={(
        <Button asChild>
          <Link href="/org/mentors/invite">
            <Plus className="mr-1.5 h-4 w-4" /> Invite mentor
          </Link>
        </Button>
      )}
      secondary={(
        <Button asChild variant="outline">
          <Link href="/mentoring">Browse directory</Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgStartups({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="startups" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Rocket}
      tone="info"
      title="No startups in portfolio yet"
      description="Startups accepted into a program appear here. You can also import existing portfolio companies."
      action={(
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Add startup
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgEvents({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="events" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Calendar}
      tone="primary"
      title="No events scheduled"
      description="Demo days, office hours, workshops, and pitch nights live here. Members of your programs get RSVPs automatically."
      action={(
        <Button asChild>
          <Link href="/events/create">
            <Plus className="mr-1.5 h-4 w-4" /> Create event
          </Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyTenantMembers({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="members" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Users}
      tone="primary"
      title="No members in this workspace yet"
      description="Invite people via email or share your invitation link. Roles determine access to billing, branding, and admin tools."
      action={(
        <Button>
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite member
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyTenantPrograms({ filtersActive, onClearFilters, className }: FilterAwareEmptyProps) {
  if (filtersActive) return <NoFilterResults entity="programs" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Award}
      tone="primary"
      title="No programs published"
      description="Workspaces with programs unlock applications, cohorts, and structured mentoring. Publish one to invite startups."
      action={(
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> New program
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyTenantWebhooks({ className }: { className?: string }) {
  return (
    <ListEmptyState
      icon={Webhook}
      tone="info"
      variant="dashed"
      title="No webhooks configured"
      description="Webhooks push real-time events (signups, payments, applications) to Zapier, Slack, or any HTTPS endpoint. Add one to start receiving events."
      action={(
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add webhook
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyTenantApiKeys({ className }: { className?: string }) {
  return (
    <ListEmptyState
      icon={KeyRound}
      tone="warning"
      variant="dashed"
      title="No API keys yet"
      description="API keys grant programmatic access to your workspace. Scope each key to specific permissions and rotate regularly."
      action={(
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Create API key
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyTenantDomains({ className }: { className?: string }) {
  return (
    <ListEmptyState
      icon={Globe}
      tone="info"
      variant="dashed"
      title="No domains configured yet"
      description="Add a subdomain (your-org.cofounderbay.app) or connect a custom domain. SSL is provisioned automatically once DNS verifies."
      size="compact"
      className={className}
    />
  );
}

export function EmptyTenantAutomations({ className }: { className?: string }) {
  return (
    <ListEmptyState
      icon={Workflow}
      tone="info"
      variant="dashed"
      title="No automation rules yet"
      description="Rules trigger actions when events happen — send Slack pings on signups, auto-assign mentors on acceptance, or notify admins on flags."
      className={className}
    />
  );
}
