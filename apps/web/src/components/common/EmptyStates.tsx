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
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { BilingualText } from '@/components/common/BilingualText';

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
          <X className="icon-sm" />
          <BilingualText en="Clear filters" el="Καθαρισμός φίλτρων" compact />
        </Button>
      ) : undefined}
      size="compact"
      className={className}
    />
  );
}

/**
 * The primary way forward an empty state offers.
 *
 * An empty screen has nothing else to give, so a button here that does nothing
 * is the worst place in the product for one — and nine of these rendered
 * exactly that, across the eighteen pages importing this file. The page
 * supplies the real action: `actionHref` for a destination, `onAction` for a
 * handler. Supply neither and no primary is drawn at all; the Ask AI beside it
 * becomes the way forward, which is honest and still useful.
 */
export type EmptyActionProps = {
  /** Where the primary goes. Wins over `onAction` when both are given. */
  actionHref?: string;
  /** What the primary does. */
  onAction?: () => void;
};

function PrimaryAction({
  actionHref,
  onAction,
  size,
  className,
  children,
}: EmptyActionProps & {
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}) {
  if (actionHref) {
    return (
      <Button asChild size={size} className={className}>
        <Link href={actionHref}>{children}</Link>
      </Button>
    );
  }
  if (onAction) {
    return (
      <Button size={size} className={className} onClick={onAction}>
        {children}
      </Button>
    );
  }
  return null;
}

function AskAiLink({ prompt }: { prompt: string }) {
  return (
    <Button asChild variant="outline" className="gap-2">
      <Link href={`/ai?q=${encodeURIComponent(prompt)}`}>
        <Sparkles className="h-4 w-4 text-violet-500" />
        <BilingualText en="Ask AI" el="Ρωτήστε το AI" compact />
      </Link>
    </Button>
  );
}

export function EmptyConnections({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.accent.bg)}>
        <Users className={cn('icon-xl', STATUS.accent.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No connections yet" el="Δεν υπάρχουν συνδέσεις ακόμα" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="Start building your network by discovering founders, mentors, and investors who share your interests." el="Χτίστε το δίκτυό σας βρίσκοντας ιδρυτές, μέντορες και επενδυτές με κοινά ενδιαφέροντα." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2" asChild>
          <Link href="/discover">
            <Compass className="icon-sm" />
            <BilingualText en="Discover people" el="Ανακαλύψτε άτομα" compact />
          </Link>
        </Button>
        <AskAiLink prompt="I have no connections yet. Help me find a complementary cofounder and send a first intro." />
      </div>
    </div>
  );
}

export function EmptyMessages({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-info-bg">
        <MessageCircle className="icon-xl text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No conversations" el="Δεν υπάρχουν συνομιλίες" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="Connect with someone to start a conversation. Your messages will appear here." el="Συνδεθείτε με κάποιον για να ξεκινήσετε συνομιλία. Τα μηνύματά σας θα εμφανίζονται εδώ." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2" asChild>
          <Link href="/connections">
            <UserPlus className="icon-sm" />
            <BilingualText en="View connections" el="Προβολή συνδέσεων" compact />
          </Link>
        </Button>
        <AskAiLink prompt="My inbox is empty. Who should I message first from my matches or connections?" />
      </div>
    </div>
  );
}

export function EmptyEvents({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.info.bg)}>
        <Calendar className={cn('icon-xl', STATUS.info.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No upcoming events" el="Δεν υπάρχουν επερχόμενες εκδηλώσεις" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="There are no events scheduled right now. Check back later or create your own event." el="Δεν υπάρχουν προγραμματισμένες εκδηλώσεις. Ελέγξτε αργότερα ή δημιουργήστε τη δική σας." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2" asChild>
          <Link href="/events/create">
            <Calendar className="icon-sm" />
            <BilingualText en="Create event" el="Δημιουργία εκδήλωσης" compact />
          </Link>
        </Button>
        <AskAiLink prompt="There are no upcoming events. Suggest how I should use Events and Calendar to meet cofounders." />
      </div>
    </div>
  );
}

export function EmptyJobs({ className, actionHref, onAction }: EmptyStateProps & EmptyActionProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.warning.bg)}>
        <Briefcase className={cn('icon-xl', STATUS.warning.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No jobs posted" el="Δεν υπάρχουν αγγελίες" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="There are no job listings at the moment. Post a job to find your next team member." el="Δεν υπάρχουν αγγελίες αυτή τη στιγμή. Δημοσιεύστε μία για να βρείτε το επόμενο μέλος της ομάδας σας." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PrimaryAction actionHref={actionHref} onAction={onAction} className="gap-2">
          <Briefcase className="icon-sm" />
          <BilingualText en="Post a job" el="Δημοσίευση θέσης" compact />
        </PrimaryAction>
        <AskAiLink prompt="Help me write a cofounder or early-hire job post based on my profile gaps." />
      </div>
    </div>
  );
}

export function EmptyGroups({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.success.bg)}>
        <Users className={cn('icon-xl', STATUS.success.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No groups joined" el="Δεν έχετε ενταχθεί σε ομάδες" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="Join groups to connect with like-minded founders and participate in discussions." el="Ενταχθείτε σε ομάδες για να γνωρίσετε ιδρυτές με κοινά ενδιαφέροντα και να συμμετέχετε σε συζητήσεις." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2" asChild>
          <Link href="/groups">
            <Search className="icon-sm" />
            <BilingualText en="Browse groups" el="Περιήγηση ομάδων" compact />
          </Link>
        </Button>
        <AskAiLink prompt="I have not joined any groups. Which communities fit a founder looking for a technical cofounder?" />
      </div>
    </div>
  );
}

export function EmptyNotifications({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.warning.bg)}>
        <Bell className={cn('icon-xl', STATUS.warning.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="All caught up!" el="Είστε ενημερωμένοι!" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="You have no new notifications. We&apos;ll let you know when something happens." el="Δεν έχετε νέες ειδοποιήσεις. Θα σας ενημερώσουμε όταν συμβεί κάτι." wrap />
      </p>
      <AskAiLink prompt="I am all caught up on notifications. What should I do next on CoFounderBay?" />
    </div>
  );
}

export function EmptySearchResults({ query, className }: EmptyStateProps & { query?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/60">
        <Search className="icon-xl text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No results found" el="Δεν βρέθηκαν αποτελέσματα" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {query 
          ? `We couldn't find anything matching "${query}". Try different keywords.`
          : 'Try adjusting your search or filters to find what you\'re looking for.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={() => window.history.back()}>
          <BilingualText en="Go back" el="Επιστροφή" compact />
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
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full', STATUS.info.bg)}>
        <BookOpen className={cn('icon-xl', STATUS.info.icon)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No resources yet" el="Δεν υπάρχουν πόροι ακόμα" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="Learning resources will appear here. Check back soon for new content." el="Οι πόροι μάθησης θα εμφανίζονται εδώ. Ελέγξτε σύντομα για νέο περιεχόμενο." wrap />
      </p>
      <AskAiLink prompt="There are no learning resources yet. What should I study next given my venture readiness?" />
    </div>
  );
}

export function EmptyMarketplace({ className, actionHref, onAction }: EmptyStateProps & EmptyActionProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-accent-bg">
        <ShoppingBag className="icon-xl text-pink-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No services listed" el="Δεν υπάρχουν υπηρεσίες" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="The marketplace is empty. Be the first to offer your services to the community." el="Η αγορά είναι άδεια. Γίνετε οι πρώτοι που προσφέρουν υπηρεσίες στην κοινότητα." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PrimaryAction actionHref={actionHref} onAction={onAction} className="gap-2">
          <ShoppingBag className="icon-sm" />
          <BilingualText en="List a service" el="Καταχώριση υπηρεσίας" compact />
        </PrimaryAction>
        <AskAiLink prompt="The marketplace is empty. Help me decide whether to list a service or find an expert instead." />
      </div>
    </div>
  );
}

export function EmptyMentoringSessions({ className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-info-bg">
        <Users className="icon-xl text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2"><BilingualText en="No sessions booked" el="Δεν υπάρχουν κρατήσεις" compact /></h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        <BilingualText en="Book a session with a mentor to get personalized guidance for your startup journey." el="Κλείστε συνεδρία με μέντορα για εξατομικευμένη καθοδήγηση." wrap />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button className="gap-2" asChild>
          <Link href="/mentoring">
            <Search className="icon-sm" />
            <BilingualText en="Find mentors" el="Βρείτε μέντορες" compact />
          </Link>
        </Button>
        <AskAiLink prompt="I have no mentoring sessions. Recommend a mentor type for a first-time founder and how to book." />
      </div>
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
          <Link href="/tenant/programs">
            <Plus className="mr-1.5 icon-sm" /> <BilingualText en="Create program" el="Δημιουργία προγράμματος" compact />
          </Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgCohorts({ filtersActive, onClearFilters, className, actionHref, onAction }: FilterAwareEmptyProps & EmptyActionProps) {
  if (filtersActive) return <NoFilterResults entity="cohorts" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Users}
      tone="info"
      title="No cohorts yet"
      description="A cohort groups startups going through a program together. Create one to assign mentors, track milestones, and run demo days."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction}>
          <Plus className="mr-1.5 icon-sm" /> <BilingualText en="Create cohort" el="Δημιουργία κοορτής" compact />
        </PrimaryAction>
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
          <Link href="/org/programs"><BilingualText en="View programs" el="Προβολή προγραμμάτων" compact /></Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgMembers({ filtersActive, onClearFilters, className, actionHref = '/invite', onAction }: FilterAwareEmptyProps & EmptyActionProps) {
  if (filtersActive) return <NoFilterResults entity="members" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Users}
      tone="primary"
      title="No team members yet"
      description="Invite colleagues to help run programs, review applications, and manage cohorts. Roles control who can do what."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction}>
          <UserPlus className="mr-1.5 icon-sm" /> <BilingualText en="Invite member" el="Πρόσκληση μέλους" compact />
        </PrimaryAction>
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
      description="Mentors are vetted advisors you can assign to startups in your cohorts. Find them in the platform's mentor directory."
      action={(
        <Button asChild>
          <Link href="/mentoring">
            <Plus className="mr-1.5 icon-sm" aria-hidden="true" /> <BilingualText en="Find a mentor" el="Βρείτε μέντορα" compact />
          </Link>
        </Button>
      )}
      secondary={(
        <Button asChild variant="outline">
          <Link href="/org/startups"><BilingualText en="See your startups" el="Δείτε τις startups σας" compact /></Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyOrgStartups({ filtersActive, onClearFilters, className, actionHref, onAction }: FilterAwareEmptyProps & EmptyActionProps) {
  if (filtersActive) return <NoFilterResults entity="startups" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Rocket}
      tone="info"
      title="No startups in portfolio yet"
      description="Startups accepted into a program appear here. You can also import existing portfolio companies."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction}>
          <Plus className="mr-1.5 icon-sm" /> <BilingualText en="Add startup" el="Προσθήκη startup" compact />
        </PrimaryAction>
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
            <Plus className="mr-1.5 icon-sm" /> <BilingualText en="Create event" el="Δημιουργία εκδήλωσης" compact />
          </Link>
        </Button>
      )}
      className={className}
    />
  );
}

export function EmptyTenantMembers({ filtersActive, onClearFilters, className, actionHref = '/invite', onAction }: FilterAwareEmptyProps & EmptyActionProps) {
  if (filtersActive) return <NoFilterResults entity="members" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Users}
      tone="primary"
      title="No members in this workspace yet"
      description="Invite people via email or share your invitation link. Roles determine access to billing, branding, and admin tools."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction}>
          <UserPlus className="mr-1.5 icon-sm" /> <BilingualText en="Invite member" el="Πρόσκληση μέλους" compact />
        </PrimaryAction>
      )}
      className={className}
    />
  );
}

export function EmptyTenantPrograms({ filtersActive, onClearFilters, className, actionHref, onAction }: FilterAwareEmptyProps & EmptyActionProps) {
  if (filtersActive) return <NoFilterResults entity="programs" onClear={onClearFilters} className={className} />;
  return (
    <ListEmptyState
      icon={Award}
      tone="primary"
      title="No programs published"
      description="Workspaces with programs unlock applications, cohorts, and structured mentoring. Publish one to invite startups."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction}>
          <Plus className="mr-1.5 icon-sm" /> <BilingualText en="New program" el="Νέο πρόγραμμα" compact />
        </PrimaryAction>
      )}
      className={className}
    />
  );
}

export function EmptyTenantWebhooks({ className, actionHref, onAction }: { className?: string } & EmptyActionProps) {
  return (
    <ListEmptyState
      icon={Webhook}
      tone="info"
      variant="dashed"
      title="No webhooks configured"
      description="Webhooks push real-time events (signups, payments, applications) to Zapier, Slack, or any HTTPS endpoint. Add one to start receiving events."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction} size="sm">
          <Plus className="mr-1.5 icon-sm" /> <BilingualText en="Add webhook" el="Προσθήκη webhook" compact />
        </PrimaryAction>
      )}
      className={className}
    />
  );
}

export function EmptyTenantApiKeys({ className, actionHref, onAction }: { className?: string } & EmptyActionProps) {
  return (
    <ListEmptyState
      icon={KeyRound}
      tone="warning"
      variant="dashed"
      title="No API keys yet"
      description="API keys grant programmatic access to your workspace. Scope each key to specific permissions and rotate regularly."
      action={(
        <PrimaryAction actionHref={actionHref} onAction={onAction} size="sm">
          <Plus className="mr-1.5 icon-sm" /> <BilingualText en="Create API key" el="Δημιουργία κλειδιού API" compact />
        </PrimaryAction>
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
