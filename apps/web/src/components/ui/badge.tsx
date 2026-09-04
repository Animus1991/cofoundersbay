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
        success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
        warning: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
        destructive: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400',
        info: 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',
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
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
