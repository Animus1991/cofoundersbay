'use client';

import { Database, DatabaseZap, Eye, EyeOff } from 'lucide-react';
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
 * 
 * When ON: Shows full sample data for all components on every page
 * When OFF: Shows empty/skeleton states for components
 */
export function DemoDataToggle({ className }: { className?: string }) {
  const { showDemoData, toggleDemoData } = useDemoData();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showDemoData ? 'ghost' : 'outline'}
            size="sm"
            onClick={toggleDemoData}
            className={cn(
              'h-7 gap-1 px-2 text-[11px] font-medium text-muted-foreground',
              showDemoData
                ? 'bg-transparent hover:bg-secondary/60'
                : 'border-dashed hover:text-foreground hover:border-solid',
              className
            )}
            aria-label={showDemoData ? 'Hide sample data' : 'Show sample data'}
          >
            {showDemoData ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Demo</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Demo</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-[200px]">
          <p className="text-xs font-medium mb-1">
            {showDemoData ? 'Sample Data: ON' : 'Sample Data: OFF'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {showDemoData
              ? 'Sample data is on. Changes are not saved. Click to hide sample data.'
              : 'Click to show sample data across all pages'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
