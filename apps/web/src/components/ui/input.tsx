import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = Boolean(invalid || ariaInvalid);
    return (
      <input
        type={type}
        aria-invalid={isInvalid || undefined}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground transition-colors',
          'placeholder:text-muted-foreground/70 input-clean hover:border-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 read-only:bg-muted/30',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          isInvalid && 'border-destructive focus-visible:ring-destructive/50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
