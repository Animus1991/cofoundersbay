import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    const isInvalid = Boolean(invalid || ariaInvalid);
    return (
      <textarea
        aria-invalid={isInvalid || undefined}
        className={cn(
          'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors',
          'placeholder:text-muted-foreground/70 hover:border-ring/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40 resize-y',
          isInvalid && 'border-destructive focus-visible:ring-destructive/50',
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
