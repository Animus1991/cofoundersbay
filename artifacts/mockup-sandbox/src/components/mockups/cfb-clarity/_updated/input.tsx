import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** A search bar is named or typed as one. Other fields keep the shared focus ring. */
export function marksSearchField(type: string | undefined, label: unknown, placeholder: unknown): boolean {
  if (type === 'search') return true;
  const text = `${typeof label === 'string' ? label : ''} ${typeof placeholder === 'string' ? placeholder : ''}`;
  return /\bsearch\b|αναζήτ/i.test(text);
}

/** aria-invalid accepts true/false strings, 'grammar'/'spelling', or booleans; only 'false' and false mean valid. */
export function isAriaInvalid(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false && value !== 'false';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, placeholder, 'aria-invalid': ariaInvalid, 'aria-label': ariaLabel, ...props }, ref) => {
    const isInvalid = invalid ?? isAriaInvalid(ariaInvalid);
    const searchField = marksSearchField(type, ariaLabel, placeholder);
    return (
      <input
        type={type}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={isInvalid || undefined}
        data-search-field={searchField ? '' : undefined}
        className={cn(
          // Their 44px minimum height (tap target) plus our hover affordance.
          'flex h-11 min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm text-foreground transition-colors',
          'placeholder:text-muted-foreground placeholder:opacity-100 input-clean focus-visible:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted disabled:border-dashed disabled:text-muted-foreground read-only:bg-muted/30',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          isInvalid && 'border-destructive ring-1 ring-destructive/60',
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
