"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * What the bar measures, e.g. "Profile completeness". Combined with the
   * value into the accessible name.
   *
   * Radix renders role="progressbar", and a progressbar with no name is
   * announced as a bare number — the axe sweep found 8 of them across the
   * dashboards. When no label is passed the percentage is still announced,
   * which is strictly better than silence.
   */
  label?: string
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, label, max = 100, ...props }, ref) => {
  const pct = Math.round(((value ?? 0) / (max || 100)) * 100)
  const hasExternalLabel = Boolean(props['aria-label'] ?? props['aria-labelledby'])

  return (
    <ProgressPrimitive.Root
      ref={ref}
      max={max}
      aria-label={hasExternalLabel ? props['aria-label'] : (label ? `${label}: ${pct}%` : `${pct}%`)}
      aria-valuetext={props['aria-valuetext'] ?? `${pct}%`}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary/50",
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-out"
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
