'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ContributionLevel = 0 | 1 | 2 | 3 | 4;

interface DayData {
  date: string;
  count: number;
  level: ContributionLevel;
}

interface ContributionGraphProps {
  /** Activity data - array of { date: 'YYYY-MM-DD', count: number } */
  data?: { date: string; count: number }[];
  /** Number of weeks to show (default: 52) */
  weeks?: number;
  /** Custom color scheme */
  colorScheme?: 'green' | 'blue' | 'purple' | 'primary';
  /** Show month labels */
  showMonths?: boolean;
  /** Show day labels */
  showDays?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LEVEL_COLORS = {
  green: [
    'bg-muted/50',
    'bg-emerald-200 dark:bg-emerald-900',
    'bg-emerald-400 dark:bg-emerald-700',
    'bg-emerald-500 dark:bg-emerald-500',
    'bg-emerald-600 dark:bg-emerald-400',
  ],
  blue: [
    'bg-muted/50',
    'bg-blue-200 dark:bg-blue-900',
    'bg-blue-400 dark:bg-blue-700',
    'bg-blue-500 dark:bg-blue-500',
    'bg-blue-600 dark:bg-blue-400',
  ],
  purple: [
    'bg-muted/50',
    'bg-violet-200 dark:bg-violet-900',
    'bg-violet-400 dark:bg-violet-700',
    'bg-violet-500 dark:bg-violet-500',
    'bg-violet-600 dark:bg-violet-400',
  ],
  primary: [
    'bg-muted/50',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/60',
    'bg-primary/80',
  ],
};

const SIZE_CONFIG = {
  sm: { cell: 'w-2 h-2', gap: 'gap-[2px]', text: 'text-[9px]' },
  md: { cell: 'w-2.5 h-2.5', gap: 'gap-[3px]', text: 'text-[10px]' },
  lg: { cell: 'w-3 h-3', gap: 'gap-1', text: 'text-xs' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLevel(count: number, max: number): ContributionLevel {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function generateDemoData(weeks: number): { date: string; count: number }[] {
  const data: { date: string; count: number }[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7);

  for (let i = 0; i < weeks * 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate realistic-looking activity pattern
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseChance = isWeekend ? 0.3 : 0.7;
    
    let count = 0;
    if (Math.random() < baseChance) {
      count = Math.floor(Math.random() * 8) + 1;
      // Occasionally have high activity days
      if (Math.random() < 0.1) count += Math.floor(Math.random() * 10);
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      count,
    });
  }
  
  return data;
}

export function ContributionGraph({
  data,
  weeks = 52,
  colorScheme = 'green',
  showMonths = true,
  showDays = true,
  size = 'md',
  className,
}: ContributionGraphProps) {
  const activityData = data ?? generateDemoData(weeks);
  
  const { grid, monthLabels, maxCount, totalCount } = useMemo(() => {
    const dataMap = new Map(activityData.map((d) => [d.date, d.count]));
    const max = Math.max(...activityData.map((d) => d.count), 1);
    const total = activityData.reduce((sum, d) => sum + d.count, 0);
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - weeks * 7 + 1);
    
    // Align to start of week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const weekColumns: DayData[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let currentMonth = -1;
    
    for (let w = 0; w < weeks; w++) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split('T')[0];
        const count = dataMap.get(dateStr) ?? 0;
        
        week.push({
          date: dateStr,
          count,
          level: getLevel(count, max),
        });
        
        // Track month changes
        if (d === 0 && date.getMonth() !== currentMonth) {
          currentMonth = date.getMonth();
          months.push({ label: MONTHS[currentMonth], weekIndex: w });
        }
      }
      weekColumns.push(week);
    }
    
    return { grid: weekColumns, monthLabels: months, maxCount: max, totalCount: total };
  }, [activityData, weeks]);

  const colors = LEVEL_COLORS[colorScheme];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn('inline-block', className)}>
      {/* Month labels */}
      {showMonths && (
        <div className={cn('flex mb-1', showDays && 'ml-6')}>
          {monthLabels.map((m, i) => {
            const nextMonth = monthLabels[i + 1];
            const span = nextMonth ? nextMonth.weekIndex - m.weekIndex : weeks - m.weekIndex;
            return (
              <span
                key={`${m.label}-${m.weekIndex}`}
                className={cn('text-muted-foreground', sizeConfig.text)}
                style={{ width: `${span * (size === 'sm' ? 10 : size === 'md' ? 13 : 16)}px` }}
              >
                {span >= 3 ? m.label : ''}
              </span>
            );
          })}
        </div>
      )}
      
      <div className="flex">
        {/* Day labels */}
        {showDays && (
          <div className={cn('flex flex-col justify-around pr-1', sizeConfig.gap)}>
            {[1, 3, 5].map((d) => (
              <span key={d} className={cn('text-muted-foreground leading-none', sizeConfig.text)}>
                {DAYS[d].slice(0, 3)}
              </span>
            ))}
          </div>
        )}
        
        {/* Grid */}
        <TooltipProvider delayDuration={100}>
          <div className={cn('flex', sizeConfig.gap)}>
            {grid.map((week, wi) => (
              <div key={wi} className={cn('flex flex-col', sizeConfig.gap)}>
                {week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          sizeConfig.cell,
                          'rounded-[2px] transition-colors cursor-default',
                          colors[day.level],
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">
                        {day.count} contribution{day.count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
      
      {/* Legend */}
      <div className={cn('flex items-center justify-end mt-2', sizeConfig.gap)}>
        <span className={cn('text-muted-foreground mr-1', sizeConfig.text)}>Less</span>
        {colors.map((color, i) => (
          <div
            key={i}
            className={cn(sizeConfig.cell, 'rounded-[2px]', color)}
          />
        ))}
        <span className={cn('text-muted-foreground ml-1', sizeConfig.text)}>More</span>
      </div>
      
      {/* Stats */}
      <div className={cn('flex items-center justify-between mt-2 text-muted-foreground', sizeConfig.text)}>
        <span>{totalCount} contributions in the last {weeks} weeks</span>
      </div>
    </div>
  );
}
