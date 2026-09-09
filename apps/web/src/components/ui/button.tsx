'use client';

// Required: the `asChild` branch below hands `onClickCapture` / `onKeyDownCapture`
// to Radix's Slot. Without this directive Button compiles as a Server Component
// wherever a server tree imports it (app/not-found.tsx and
// app/investor/dashboard/page.tsx both render <Button asChild>), and React
// rejects the render with "Event handlers cannot be passed to Client Component
// props" — which is what broke the /login response.

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/70 shadow-sm',
        ghost:
          'text-foreground/70 hover:text-foreground hover:bg-secondary/50',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary/50 hover:border-border/80 shadow-sm',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        link:
          'text-primary-accessible underline-offset-4 hover:underline p-0 h-auto font-medium',
      },
      size: {
        xs:   'h-7 min-h-7 px-2.5 text-xs rounded',
        sm:   'h-11 min-h-11 px-3 text-xs md:h-8 md:min-h-8',
        md:   'h-11 min-h-11 px-4 md:h-9 md:min-h-9',
        lg:   'h-11 min-h-11 px-6 text-base md:h-10 md:min-h-10',
        xl:   'h-12 px-8 text-base',
        icon: 'h-11 w-11 md:h-9 md:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      const inactive = disabled || loading;
      return (
        <Slot
          {...props}
          className={cn(buttonVariants({ variant, size, className }), inactive && 'pointer-events-none opacity-50')}
          ref={ref}
          aria-disabled={inactive || props['aria-disabled']}
          aria-busy={loading || props['aria-busy']}
          tabIndex={inactive ? -1 : props.tabIndex}
          onClickCapture={(event) => {
            if (inactive) { event.preventDefault(); event.stopPropagation(); }
            else props.onClickCapture?.(event as React.MouseEvent<HTMLButtonElement>);
          }}
          onKeyDownCapture={(event) => {
            if (inactive && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); }
            else props.onKeyDownCapture?.(event as React.KeyboardEvent<HTMLButtonElement>);
          }}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
