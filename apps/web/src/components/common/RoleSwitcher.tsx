'use client';

import React, { useState } from 'react';
import { useRole, UserRoleType } from '@/contexts/RoleContext';
import {
  Briefcase,
  GraduationCap,
  Users,
  Building2,
  Lightbulb,
  TrendingUp,
  Shield,
  Wrench,
  Scale,
  Calculator,
  UserSearch,
  ChevronDown,
  Check,
  Loader2,
  Star,
} from 'lucide-react';

// Role display configuration
const ROLE_DISPLAY: Record<UserRoleType, { label: string; icon: React.ElementType; color: string }> = {
  aspiring_founder: { label: 'Aspiring Founder', icon: Lightbulb, color: 'text-yellow-500' },
  existing_founder: { label: 'Founder', icon: Briefcase, color: 'text-blue-500' },
  cofounder_candidate: { label: 'Co-Founder Candidate', icon: Users, color: 'text-green-500' },
  technical_talent: { label: 'Technical Talent', icon: Wrench, color: 'text-purple-500' },
  business_operator: { label: 'Business Operator', icon: TrendingUp, color: 'text-orange-500' },
  mentor: { label: 'Mentor', icon: GraduationCap, color: 'text-cyan-500' },
  advisor: { label: 'Advisor', icon: Star, color: 'text-amber-500' },
  coach: { label: 'Coach', icon: GraduationCap, color: 'text-teal-500' },
  course_creator: { label: 'Course Creator', icon: GraduationCap, color: 'text-indigo-500' },
  incubator_admin: { label: 'Incubator Admin', icon: Building2, color: 'text-rose-500' },
  accelerator_admin: { label: 'Accelerator Admin', icon: Building2, color: 'text-pink-500' },
  university_admin: { label: 'University Admin', icon: Building2, color: 'text-violet-500' },
  venture_studio_admin: { label: 'Venture Studio Admin', icon: Building2, color: 'text-fuchsia-500' },
  angel_investor: { label: 'Angel Investor', icon: TrendingUp, color: 'text-emerald-500' },
  vc_scout: { label: 'VC Scout', icon: UserSearch, color: 'text-lime-500' },
  vc_analyst: { label: 'VC Analyst', icon: TrendingUp, color: 'text-sky-500' },
  syndicate_manager: { label: 'Syndicate Manager', icon: Users, color: 'text-blue-600' },
  service_provider: { label: 'Service Provider', icon: Wrench, color: 'text-slate-500' },
  legal_partner: { label: 'Legal Partner', icon: Scale, color: 'text-gray-600' },
  finance_advisor: { label: 'Finance Advisor', icon: Calculator, color: 'text-green-600' },
  recruiter: { label: 'Recruiter', icon: UserSearch, color: 'text-orange-600' },
  platform_admin: { label: 'Platform Admin', icon: Shield, color: 'text-red-500' },
};

interface RoleSwitcherProps {
  variant?: 'dropdown' | 'pills' | 'compact';
  showAllRoles?: boolean;
  className?: string;
}

export function RoleSwitcher({ variant = 'dropdown', showAllRoles = false, className = '' }: RoleSwitcherProps) {
  const { primaryRole, allRoles, switchPrimaryRole, isLoading, navigateToDashboard } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitch = async (roleId: string) => {
    try {
      setSwitching(roleId);
      await switchPrimaryRole(roleId);
      setIsOpen(false);
      navigateToDashboard();
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setSwitching(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Loading roles...</span>
      </div>
    );
  }

  if (!primaryRole || allRoles.length === 0) {
    return null;
  }

  const currentRoleConfig = ROLE_DISPLAY[primaryRole];
  const CurrentIcon = currentRoleConfig?.icon || Briefcase;

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
        >
          <CurrentIcon className={`h-4 w-4 ${currentRoleConfig?.color || 'text-foreground'}`} />
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {isOpen && allRoles.length > 1 && (
          <>
            <div aria-hidden="true" className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg py-1">
              {allRoles.map((role) => {
                const roleConfig = ROLE_DISPLAY[role.roleType];
                const Icon = roleConfig?.icon || Briefcase;
                const isActive = role.isPrimary;

                return (
                  <button
                    key={role.id}
                    onClick={() => !isActive && handleSwitch(role.id)}
                    disabled={isActive || switching === role.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                      isActive ? 'bg-accent/50' : ''
                    }`}
                  >
                    {switching === role.id ? (
                      <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                    ) : (
                      <Icon className={`h-4 w-4 ${roleConfig?.color || 'text-foreground'}`} />
                    )}
                    <span className="flex-1 text-sm">{roleConfig?.label || role.roleType}</span>
                    {isActive && <Check className="icon-sm text-primary" aria-hidden="true" />}
                    {role.isVerified && (
                      <span className="text-xs bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">Verified</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {allRoles.map((role) => {
          const roleConfig = ROLE_DISPLAY[role.roleType];
          const Icon = roleConfig?.icon || Briefcase;
          const isActive = role.isPrimary;

          return (
            <button
              key={role.id}
              onClick={() => !isActive && handleSwitch(role.id)}
              disabled={switching === role.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-accent'
              }`}
            >
              {switching === role.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Icon className={`h-3.5 w-3.5 ${isActive ? '' : roleConfig?.color || ''}`} />
              )}
              <span>{roleConfig?.label || role.roleType}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: dropdown
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors w-full"
      >
        <CurrentIcon className={`h-5 w-5 ${currentRoleConfig?.color || 'text-foreground'}`} />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{currentRoleConfig?.label || primaryRole}</div>
          {allRoles.length > 1 && (
            <div className="text-xs text-muted-foreground">
              {allRoles.length} roles available
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && allRoles.length > 1 && (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-[300px] overflow-y-auto">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Switch Role
            </div>
            {allRoles.map((role) => {
              const roleConfig = ROLE_DISPLAY[role.roleType];
              const Icon = roleConfig?.icon || Briefcase;
              const isActive = role.isPrimary;

              return (
                <button
                  key={role.id}
                  onClick={() => !isActive && handleSwitch(role.id)}
                  disabled={isActive || switching === role.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors ${
                    isActive ? 'bg-accent/50' : ''
                  }`}
                >
                  {switching === role.id ? (
                    <Loader2 className="icon-md animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className={`h-5 w-5 ${roleConfig?.color || 'text-foreground'}`} />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{roleConfig?.label || role.roleType}</div>
                    {role.scope !== 'global' && (
                      <div className="text-xs text-muted-foreground capitalize">{role.scope} scope</div>
                    )}
                  </div>
                  {isActive && <Check className="icon-sm text-primary" aria-hidden="true" />}
                  {role.isVerified && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">Verified</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Simple role badge component
export function RoleBadge({ roleType, size = 'sm' }: { roleType: UserRoleType; size?: 'sm' | 'md' | 'lg' }) {
  const roleConfig = ROLE_DISPLAY[roleType];
  const Icon = roleConfig?.icon || Briefcase;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-card border border-border ${sizeClasses[size]}`}
    >
      <Icon className={`${iconSizes[size]} ${roleConfig?.color || 'text-foreground'}`} />
      <span>{roleConfig?.label || roleType}</span>
    </span>
  );
}

export default RoleSwitcher;
