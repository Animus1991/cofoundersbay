import { Rocket, GraduationCap, TrendingUp, Building2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type RoleType = 'founder' | 'mentor' | 'investor' | 'org';

const roleConfig: Record<RoleType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  founder: { label: 'Founder', icon: Rocket },
  mentor: { label: 'Mentor', icon: GraduationCap },
  investor: { label: 'Investor', icon: TrendingUp },
  org: { label: 'Organization', icon: Building2 },
};

type RoleBadgeProps = {
  role: string;
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
  const roleKey = role.toLowerCase() as RoleType;
  const config = roleConfig[roleKey];
  
  if (!config) {
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
      {showIcon && <Icon className={cn('h-3 w-3', animated && 'animate-bounce-subtle')} />}
      {config.label}
    </Badge>
  );
}
