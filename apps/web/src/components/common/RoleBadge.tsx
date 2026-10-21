'use client';

import { Rocket, GraduationCap, TrendingUp, Building2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { BilingualText } from '@/components/common/BilingualText';
import { cn } from '@/lib/utils';
import { roleFamily, type RoleFamily } from '@/lib/role-family';

type RoleType = RoleFamily;

const roleConfig: Record<RoleType, { label: string; labelEl: string; icon: React.ComponentType<{ className?: string }> }> = {
  founder: { label: 'Founder', labelEl: 'Ιδρυτής', icon: Rocket },
  mentor: { label: 'Mentor', labelEl: 'Μέντορας', icon: GraduationCap },
  investor: { label: 'Investor', labelEl: 'Επενδυτής', icon: TrendingUp },
  org: { label: 'Organization', labelEl: 'Οργανισμός', icon: Building2 },
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
