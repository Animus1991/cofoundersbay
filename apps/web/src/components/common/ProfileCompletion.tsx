'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';

type ProfileField = {
  id: string;
  label: string;
  labelEl?: string;
  completed: boolean;
  weight: number; // contribution to overall score
  href?: string;
  /** What the item changes, said where it is missing. */
  reason?: { en: string; el: string };
};

type ProfileCompletionProps = {
  fields: ProfileField[];
  className?: string;
  compact?: boolean;
};

export function ProfileCompletionRing({ 
  percentage, 
  size = 'md',
  showLabel = true,
}: { 
  percentage: number; 
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const sizeConfig = {
    sm: { container: 'h-16 w-16', radius: 28, stroke: 2, text: 'text-sm' },
    md: { container: 'h-24 w-24', radius: 42, stroke: 6, text: 'text-lg' },
    lg: { container: 'h-32 w-32', radius: 56, stroke: 8, text: 'text-2xl' },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const textColorClass =
    percentage >= 80 ? STATUS.success.text :
    percentage >= 50 ? STATUS.warning.text :
    STATUS.danger.text;

  return (
    <div className={cn('relative flex items-center justify-center', config.container)}>
      <svg className="absolute transform -rotate-90" width="100%" height="100%" viewBox="0 0 128 128">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r={config.radius}
          fill="none"
          strokeWidth={config.stroke}
          stroke="hsl(var(--ring-gold-track))"
        />
        {/* Progress circle */}
        <circle
          cx="64"
          cy="64"
          r={config.radius}
          fill="none"
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke="hsl(var(--ring-gold))"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="relative text-center">
          <span className={cn('font-bold', config.text, textColorClass)}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}

export function ProfileCompletionCard({ fields, className, compact = false }: ProfileCompletionProps) {
  const { completedCount, totalWeight, completedWeight, percentage, incompleteFields } = useMemo(() => {
    const completed = fields.filter((f) => f.completed);
    const totalW = fields.reduce((sum, f) => sum + f.weight, 0);
    const completedW = completed.reduce((sum, f) => sum + f.weight, 0);
    const pct = Math.round((completedW / totalW) * 100);
    const incomplete = fields.filter((f) => !f.completed);
    return {
      completedCount: completed.length,
      totalWeight: totalW,
      completedWeight: completedW,
      percentage: pct,
      incompleteFields: incomplete,
    };
  }, [fields]);

  const nextStep = incompleteFields[0];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <ProfileCompletionRing percentage={percentage} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Profile {percentage}% complete</p>
          {nextStep && (
            <p className="text-xs text-muted-foreground">
              Next: {nextStep.label}
            </p>
          )}
        </div>
        {nextStep?.href && (
          <Button size="sm" variant="secondary" asChild>
            <Link href={nextStep.href}>
              Complete
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="icon-sm text-muted-foreground" />
            Profile Strength
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{fields.length} completed
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress ring */}
        <div className="flex justify-center">
          <ProfileCompletionRing percentage={percentage} size="lg" />
        </div>

        {/* Status message */}
        <div className="text-center">
          {percentage >= 80 ? (
            <p className={cn('text-sm font-medium', STATUS.success.text)}>
              Great job! Your profile is looking strong.
            </p>
          ) : percentage >= 50 ? (
            <p className={cn('text-sm font-medium', STATUS.warning.text)}>
              Good progress! Complete a few more fields to stand out.
            </p>
          ) : (
            <p className={cn('text-sm font-medium', STATUS.danger.text)}>
              Complete your profile to get better matches.
            </p>
          )}
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                field.completed ? STATUS.success.bg : 'bg-secondary/40'
              )}
            >
              {field.completed ? (
                <CheckCircle2 className={cn('icon-md flex-shrink-0', STATUS.success.icon)} />
              ) : (
                <Circle className="icon-md text-muted-foreground flex-shrink-0" />
              )}
              <span
                className={cn(
                  'flex-1 text-sm',
                  field.completed ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {field.label}
              </span>
              {!field.completed && field.href && (
                <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
                  <Link href={field.href}>
                    <ArrowRight className="icon-sm" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* CTA for next step */}
        {nextStep?.href && (
          <Button className="w-full gap-2" asChild>
            <Link href={nextStep.href} className="block">
              Complete "{nextStep.label}"
              <ArrowRight className="icon-sm" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const EDIT = '/profile/edit';

/** What each item changes for the member, said beside what is missing. */
export const COMPLETION_REASONS: Record<string, { en: string; el: string }> = {
  basic: { en: 'People connect with a name, not a handle.', el: 'Οι άνθρωποι συνδέονται με όνομα, όχι με ψευδώνυμο.' },
  skills: { en: 'Skills are part of how matches are scored.', el: 'Οι δεξιότητες μετρούν στη βαθμολογία αντιστοίχισης.' },
  bio: { en: 'Gives your matches and the assistant the context of what you build.', el: 'Δίνει στις αντιστοιχίσεις και στον βοηθό το πλαίσιο του τι φτιάχνετε.' },
  headline: { en: 'The one line others read first in Discover and Matches.', el: 'Η μία γραμμή που διαβάζουν πρώτη οι άλλοι στην Εξερεύνηση και τις Αντιστοιχίσεις.' },
  location: { en: 'A small tie-breaker in matching and a filter in Discover.', el: 'Μικρό κριτήριο στην αντιστοίχιση και φίλτρο στην Εξερεύνηση.' },
  avatar: { en: 'A face builds trust before the first message.', el: 'Ένα πρόσωπο χτίζει εμπιστοσύνη πριν από το πρώτο μήνυμα.' },
  links: { en: 'A LinkedIn or website lets people check who you are.', el: 'Ένα LinkedIn ή ιστότοπος επιτρέπει να δουν ποιος είστε.' },
  commitment: { en: 'A different commitment shows as potential friction on both match pages.', el: 'Διαφορετική δέσμευση εμφανίζεται ως πιθανή τριβή και στις δύο σελίδες αντιστοίχισης.' },
  lookingFor: { en: 'Matching reads it to put the people you want first.', el: 'Η αντιστοίχιση το διαβάζει για να φέρει πρώτους όσους θέλετε.' },
};

/**
 * The weighted completeness list, read from a profile (`/profile`) or the
 * edit form (flattened fields). Founders also count commitment and "Looking
 * for", the two answers matching reads; each item links to its own field.
 */
export function calculateProfileCompletion(profile: Record<string, unknown> | null): ProfileField[] {
  const p = profile ?? {};
  const payload = (p.rolePayload && typeof p.rolePayload === 'object' ? p.rolePayload : {}) as Record<string, unknown>;
  const lookingFor = p.lookingFor ?? payload.rolesSought;
  const commitment = p.commitment ?? payload.commitment;
  const links = (payload.links && typeof payload.links === 'object' ? payload.links : {}) as Record<string, unknown>;
  const fields: ProfileField[] = [
    { id: 'basic', label: 'Basic info', completed: !!p.displayName, weight: 20, href: profile ? `${EDIT}#profile-display-name` : '/onboarding' },
    { id: 'skills', label: 'Skills', completed: Array.isArray(p.skills) && (p.skills as unknown[]).length > 0, weight: 20, href: `${EDIT}#skills` },
    { id: 'bio', label: 'Bio', completed: !!p.bio, weight: 15, href: `${EDIT}#pe-f1` },
    { id: 'headline', label: 'Headline', completed: !!p.headline, weight: 15, href: `${EDIT}#profile-headline` },
    { id: 'location', label: 'Location', completed: !!p.location, weight: 10, href: `${EDIT}#profile-location` },
    { id: 'avatar', label: 'Profile photo', completed: !!p.avatarUrl, weight: 10, href: `${EDIT}#photo` },
    { id: 'links', label: 'Social links', completed: !!(p.linkedinUrl || p.websiteUrl || links.linkedinUrl || links.websiteUrl), weight: 10, href: `${EDIT}#links` },
  ];
  if (p.role === 'founder') {
    fields.push(
      { id: 'commitment', label: 'Commitment', completed: typeof commitment === 'string' && commitment.trim() !== '', weight: 10, href: `${EDIT}#founder-details` },
      { id: 'lookingFor', label: 'Looking for', completed: Array.isArray(lookingFor) && lookingFor.length > 0, weight: 10, href: `${EDIT}#founder-details` },
    );
  }
  const el: Record<string, string> = {
    basic: 'Βασικά στοιχεία', skills: 'Δεξιότητες', bio: 'Βιογραφικό', headline: 'Τίτλος', location: 'Τοποθεσία',
    avatar: 'Φωτογραφία προφίλ', links: 'Σύνδεσμοι', commitment: 'Δέσμευση', lookingFor: 'Αναζητάτε',
  };
  return fields.map((f) => ({ ...f, labelEl: el[f.id], reason: COMPLETION_REASONS[f.id] }));
}
