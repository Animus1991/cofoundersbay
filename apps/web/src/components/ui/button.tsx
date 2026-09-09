import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
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
          'border border-border bg-transparent text-foreground hover:bg-secondary/50 hover:border-border/80 shadow-glow',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        link:
          'text-primary-emphasis underline-offset-4 hover:underline p-0 h-auto font-medium',
      },
      size: {
        xs:   'h-7 px-2.5 text-xs rounded',
        sm:   'h-8 px-3 text-xs',
        md:   'h-9 px-4',
        lg:   'h-10 px-6 text-base',
        xl:   'h-12 px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-xs': 'h-7 w-7',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Shows a spinner, blocks interaction and sets aria-busy.
     * Label text is kept in the DOM (hidden visually) so the button keeps its
     * width and assistive tech keeps its accessible name.
     */
    loading?: boolean;
    /** Announced while `loading` is true. */
    loadingText?: string;
  };

/**
 * Icon-only sizes have no text node, so they need an explicit accessible name.
 * The type system enforces it rather than leaving it to review: picking an
 * icon size without `aria-label` (or `aria-labelledby`) is a compile error.
 */
type IconOnlySize = 'icon' | 'icon-sm' | 'icon-xs';

type ButtonSize = NonNullable<ButtonBaseProps['size']>;

export type ButtonProps = ButtonBaseProps &
  (
    // Text buttons: any non-icon size, no extra requirement.
    | { size?: Exclude<ButtonSize, IconOnlySize> }
    // Icon sizes (including a size prop whose union merely *may* be an icon
    // size, as in wrapper components that forward `size`) must name themselves.
    | { size: ButtonSize; 'aria-label': string }
    | { size: ButtonSize; 'aria-labelledby': string }
  );

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    // `asChild` forwards to an arbitrary element (usually a Link), which can
    // only take a single child — so the spinner treatment is skipped there.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="icon-sm shrink-0 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText ?? 'Loading'}</span>
          </>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
