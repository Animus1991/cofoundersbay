import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground border-border',
        outline: 'border-border text-foreground',
        success: 'bg-status-success-bg text-status-success border-status-success-border/40',
        warning: 'bg-status-warning-bg text-status-warning border-status-warning-border/40',
        destructive: 'bg-status-danger-bg text-status-danger border-status-danger-border/40',
        info: 'bg-status-info-bg text-status-info border-status-info-border/40',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
