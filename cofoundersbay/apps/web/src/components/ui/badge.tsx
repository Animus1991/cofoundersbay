import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        glow: 'bg-primary/20 text-primary border border-primary/30',
        founder: 'bg-indigo-500/15 text-indigo-700 border border-indigo-500/30 hover:bg-indigo-500/25 dark:text-indigo-400',
        mentor: 'bg-cyan-500/15 text-cyan-700 border border-cyan-500/30 hover:bg-cyan-500/25 dark:text-cyan-400',
        investor: 'bg-orange-500/15 text-orange-700 border border-orange-500/30 hover:bg-orange-500/25 dark:text-orange-400',
        org: 'bg-violet-500/15 text-violet-700 border border-violet-500/30 hover:bg-violet-500/25 dark:text-violet-400',
        success: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:text-emerald-400',
        warning: 'bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:text-amber-400',
        destructive: 'bg-red-500/15 text-red-700 border border-red-500/30 dark:text-red-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
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
