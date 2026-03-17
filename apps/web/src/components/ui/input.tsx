import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 read-only:bg-muted/30',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
