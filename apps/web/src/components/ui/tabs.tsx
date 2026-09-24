import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex min-h-11 max-w-full items-center gap-0.5 overflow-x-auto scrollbar-hide rounded-xl border border-border bg-muted/40 p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Keep `aria-controls` pointing at something that exists.
 *
 * Radix gives every trigger `aria-controls="<base>-content-<value>"`, which is
 * right when a `<TabsContent>` for that value is on the page. About twenty
 * screens here use tabs as a *filter* instead - /feed's All / Following /
 * Trending, /shortlist's roles, the admin queues - and render one list below
 * them rather than a panel per value. On those, the selected tab referenced an
 * id that was never in the document, which axe reports as
 * aria-valid-attr-value and which leaves a screen reader's "go to controlled
 * element" pointing at nothing.
 *
 * After each commit (so a panel mounted in the same render is already there)
 * the attribute is kept only while its target exists; the id is remembered in
 * `data-controls` so it comes back the moment a panel for it appears. React
 * does not rewrite an attribute whose prop has not changed, so it does not
 * fight this.
 */
function useControlledTargetExists(ref: React.RefObject<HTMLButtonElement | null>) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = el.getAttribute('data-controls') ?? el.getAttribute('aria-controls');
    if (!id) return;
    el.setAttribute('data-controls', id);
    if (document.getElementById(id)) el.setAttribute('aria-controls', id);
    else el.removeAttribute('aria-controls');
  });
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLButtonElement | null>(null);
  useControlledTargetExists(innerRef);
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );
  return (
    <TabsPrimitive.Trigger
      ref={setRef}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        'text-muted-foreground hover:text-foreground',
        'focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-0',
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
