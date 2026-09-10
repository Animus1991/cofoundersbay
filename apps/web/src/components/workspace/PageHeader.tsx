'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
      className
    )}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
