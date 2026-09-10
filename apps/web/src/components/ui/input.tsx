import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Applies the destructive ring and sets aria-invalid for assistive tech. */
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => (
    <input
      type={type}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 input-clean disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 read-only:bg-muted/30',
        // Driven off aria-invalid so it also fires for consumers that set the
        // attribute directly rather than using the prop.
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
