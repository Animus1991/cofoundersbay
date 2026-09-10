import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Applies the destructive ring and sets aria-invalid for assistive tech. */
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => (
    <textarea
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(
        'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 resize-y',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
