'use client';

import { Database, DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDemoData } from '@/contexts/DemoDataContext';
import { cn } from '@/lib/utils';

/**
 * Global toggle button for showing/hiding sample demo data across all pages.
 * Positioned in the TopBar for consistent access.
 */
export function DemoDataToggle({ className }: { className?: string }) {
  const { showDemoData, toggleDemoData } = useDemoData();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDemoData}
            className={cn(
              'h-8 w-8 p-0 relative',
              showDemoData && 'text-primary',
              className
            )}
            aria-label={showDemoData ? 'Hide sample data' : 'Show sample data'}
          >
            {showDemoData ? (
              <DatabaseZap className="h-4 w-4" />
            ) : (
              <Database className="h-4 w-4 text-muted-foreground" />
            )}
            {showDemoData && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          <p className="text-xs">
            {showDemoData ? 'Sample data ON — click to hide' : 'Sample data OFF — click to show'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
