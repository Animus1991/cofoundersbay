'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  User, Briefcase, MapPin, FileText, Link as LinkIcon,
  CheckCircle2, Circle, ArrowRight, Sparkles, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type ProfileData = {
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  lookingFor?: string | null;
  experience?: string | null;
  education?: string | null;
  availability?: string | null;
  timezone?: string | null;
};

type ProfileField = {
  key: keyof ProfileData;
  label: string;
  icon: React.ElementType;
  weight: number;
  description: string;
  isArray?: boolean;
  minItems?: number;
};

const PROFILE_FIELDS: ProfileField[] = [
  { key: 'firstName', label: 'First Name', icon: User, weight: 10, description: 'Your first name' },
  { key: 'lastName', label: 'Last Name', icon: User, weight: 10, description: 'Your last name' },
  { key: 'headline', label: 'Professional Headline', icon: Briefcase, weight: 15, description: 'A brief professional title' },
  { key: 'bio', label: 'Bio', icon: FileText, weight: 15, description: 'Tell others about yourself' },
  { key: 'avatarUrl', label: 'Profile Photo', icon: User, weight: 10, description: 'Upload a profile picture' },
  { key: 'location', label: 'Location', icon: MapPin, weight: 5, description: 'Your city or region' },
  { key: 'skills', label: 'Skills', icon: Sparkles, weight: 15, description: 'Add at least 3 skills', isArray: true, minItems: 3 },
  { key: 'interests', label: 'Interests', icon: Sparkles, weight: 5, description: 'What are you interested in?', isArray: true, minItems: 1 },
  { key: 'lookingFor', label: 'Looking For', icon: User, weight: 10, description: 'What type of connections you seek' },
  { key: 'linkedinUrl', label: 'LinkedIn', icon: LinkIcon, weight: 5, description: 'Link your LinkedIn profile' },
];

function isFieldComplete(profile: ProfileData, field: ProfileField): boolean {
  const value = profile[field.key];
  
  if (field.isArray) {
    return Array.isArray(value) && value.length >= (field.minItems || 1);
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return value != null;
}

export function calculateProfileCompleteness(profile: ProfileData): {
  percentage: number;
  completedFields: string[];
  missingFields: ProfileField[];
  totalWeight: number;
  completedWeight: number;
} {
  let totalWeight = 0;
  let completedWeight = 0;
  const completedFields: string[] = [];
  const missingFields: ProfileField[] = [];

  for (const field of PROFILE_FIELDS) {
    totalWeight += field.weight;
    
    if (isFieldComplete(profile, field)) {
      completedWeight += field.weight;
      completedFields.push(field.key);
    } else {
      missingFields.push(field);
    }
  }

  const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  return {
    percentage,
    completedFields,
    missingFields,
    totalWeight,
    completedWeight,
  };
}

type ProfileCompletenessProps = {
  profile: ProfileData;
  compact?: boolean;
  showMissingOnly?: boolean;
  className?: string;
};

export function ProfileCompleteness({
  profile,
  compact = false,
  showMissingOnly = false,
  className,
}: ProfileCompletenessProps) {
  const { percentage, missingFields } = useMemo(
    () => calculateProfileCompleteness(profile),
    [profile]
  );

  const getStatusColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-500';
    if (pct >= 50) return 'text-amber-500';
    return 'text-destructive';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-destructive';
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Profile</span>
            <span className={cn('text-xs font-semibold', getStatusColor(percentage))}>
              {percentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', getProgressColor(percentage))}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        {percentage < 100 && (
          <Link href="/profile/edit">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('border-border/60', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Profile Completeness</CardTitle>
          <span className={cn('text-2xl font-bold', getStatusColor(percentage))}>
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />

        {percentage >= 100 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Profile Complete!
              </p>
              <p className="text-xs text-muted-foreground">
                Your profile is fully optimized for discovery.
              </p>
            </div>
          </div>
        ) : (
          <>
            {percentage < 50 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Complete your profile
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Profiles with 80%+ completion get 3x more matches.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {showMissingOnly ? 'Missing Fields' : 'Complete these to improve visibility'}
              </p>
              <div className="space-y-1.5">
                {missingFields.slice(0, 5).map((field) => {
                  const Icon = field.icon;
                  return (
                    <Link
                      key={field.key}
                      href="/profile/edit"
                      className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{field.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
              {missingFields.length > 5 && (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    +{missingFields.length - 5} more fields
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}

        {percentage < 100 && (
          <Link href="/profile/edit" className="block">
            <Button className="w-full gap-2">
              Complete Your Profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function ProfileCompletenessIndicator({ profile }: { profile: ProfileData }) {
  const { percentage } = useMemo(() => calculateProfileCompleteness(profile), [profile]);

  const getColor = (pct: number) => {
    if (pct >= 80) return 'stroke-emerald-500';
    if (pct >= 50) return 'stroke-amber-500';
    return 'stroke-destructive';
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-12 w-12">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-500', getColor(percentage))}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{percentage}%</span>
      </div>
    </div>
  );
}
