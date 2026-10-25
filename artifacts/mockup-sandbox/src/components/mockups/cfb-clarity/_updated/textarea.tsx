import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** aria-invalid accepts true/false strings, 'grammar'/'spelling', or booleans; only 'false' and false mean valid. */
export function isAriaInvalid(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false && value !== 'false';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = invalid ?? isAriaInvalid(ariaInvalid);
    return (
      <textarea
        aria-invalid={isInvalid || undefined}
        className={cn(
          'flex min-h-[calc(96px*var(--chrome-y))] w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground transition-colors',
          'placeholder:text-muted-foreground placeholder:opacity-100 hover:border-foreground/15 focus-visible:border-ring',
                    'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted disabled:border-dashed disabled:text-muted-foreground resize-y',
          isInvalid && 'border-destructive ring-1 ring-destructive/60',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
