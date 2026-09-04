import * as React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('shimmer rounded-md bg-secondary/50', className)}
      {...props}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

export { Skeleton };
