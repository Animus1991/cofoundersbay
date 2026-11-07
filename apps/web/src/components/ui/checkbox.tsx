"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // 16px box, 24px target: `tap-extend` adds the band around it (WCAG 2.5.8, docs §107).
      // `min-h-0`: the base rule gives every role=checkbox 24px, which stretched the box;
      // the band is `tap-extend`'s job. The border carries the control, so it has to show.
      "peer tap-extend h-4 min-h-0 w-4 shrink-0 rounded-sm border border-muted-foreground/60",
      "focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-keep-icon=""
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="icon-xs" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
