"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, max = 100, ...props }, ref) => {
  const maximum = Number.isFinite(max) && max > 0 ? max : 100
  const current = typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maximum ? value : null

  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={current}
      max={maximum}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary/50",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-out"
        style={{ transform: `translateX(-${100 - ((current ?? 0) / maximum) * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
