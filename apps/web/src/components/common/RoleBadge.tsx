'use client';

import { Rocket, GraduationCap, TrendingUp, Building2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { BilingualText } from '@/components/common/BilingualText';
import { cn } from '@/lib/utils';
import { ROLE_FAMILY_LABEL, roleFamily, type RoleFamily } from '@/lib/role-family';

type RoleType = RoleFamily;

const roleConfig: Record<RoleType, { label: string; labelEl: string; icon: React.ComponentType<{ className?: string }> }> = {
  founder: { label: ROLE_FAMILY_LABEL.founder.en, labelEl: ROLE_FAMILY_LABEL.founder.el, icon: Rocket },
  mentor: { label: ROLE_FAMILY_LABEL.mentor.en, labelEl: ROLE_FAMILY_LABEL.mentor.el, icon: GraduationCap },
  investor: { label: ROLE_FAMILY_LABEL.investor.en, labelEl: ROLE_FAMILY_LABEL.investor.el, icon: TrendingUp },
  org: { label: ROLE_FAMILY_LABEL.org.en, labelEl: ROLE_FAMILY_LABEL.org.el, icon: Building2 },
};

type RoleBadgeProps = {
  role?: string | null;
  showIcon?: boolean;
  size?: BadgeProps['size'];
  className?: string;
  animated?: boolean;
};

export function RoleBadge({ 
  role, 
  showIcon = true, 
  size = 'md',
  className,
  animated = false,
}: RoleBadgeProps) {
  if (typeof role !== 'string' || !role.trim()) {
    return null;
  }

  const roleKey = roleFamily(role);
  const config = roleKey ? roleConfig[roleKey] : undefined;
  
  if (!config || !roleKey) {
    return <Badge variant="secondary" size={size} className={className}>{role}</Badge>;
  }

  const Icon = config.icon;
  const variant = roleKey as BadgeProps['variant'];

  return (
    <Badge 
      variant={variant} 
      size={size}
      className={cn(
        animated && 'animate-scale-in',
        className
      )}
    >
      {showIcon && <Icon className={cn('icon-sm', animated && 'animate-bounce-subtle')} />}
      <BilingualText en={config.label} el={config.labelEl} compact />
    </Badge>
  );
}
