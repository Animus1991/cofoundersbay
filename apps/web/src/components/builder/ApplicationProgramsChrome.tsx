'use client';

import { FileText, Loader, BadgeCheck, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { RailStats } from '@/components/layout/RailParts';
import { CardHead } from '@/components/common/CardAnatomy';
import { builderEn, builderEl } from '@/lib/i18n/strings-builder';
import { BUILDER_STAT, BUILDER_STAT_LABEL } from './BuilderStageChrome';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';
import { requiredCompletion, type ApplicationTemplate } from './application-model';

/**
 * The four program totals and the program switcher.
 *
 * On /builder/applications they live in the page rail, so the column is the
 * form. Inside the Builder workspace tab they stay as cards, because that
 * surface already has a rail of its own and a second one would overwrite it.
 * Same controls, two homes — never both on the same screen.
 */
export function ApplicationProgramsChrome({
  applications,
  activeApp,
  onSelect,
  layout,
  part = 'all',
}: {
  applications: ApplicationTemplate[];
  activeApp: string;
  onSelect: (id: string) => void;
  layout: 'cards' | 'rail';
  /** Rail splits totals and the switcher into two sections. */
  part?: 'all' | 'stats' | 'picker';
}) {
  const completions = applications.map((app) => requiredCompletion(app));
  const avg = completions.length
    ? Math.round(completions.reduce((sum, n) => sum + n, 0) / completions.length)
    : 0;
  const stats = {
    programs: applications.length,
    inProgress: applications.filter((app) => app.status === 'in-progress').length,
    ready: applications.filter((app) => app.status === 'completed').length,
    avg,
  };

  const statusBadge = (status: ApplicationTemplate['status']) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline">
            <BilingualText en={builderEn('app_draft')} el={builderEl('app_draft')} compact />
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className={cn('border', STATUS.warning.chip)}>
            <BilingualText en={builderEn('status_in_progress')} el={builderEl('status_in_progress')} compact />
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className={cn('border', STATUS.success.chip)}>
            <BilingualText en={builderEn('status_completed')} el={builderEl('status_completed')} compact />
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="outline" className={cn('border', STATUS.success.chip)}>
            <BilingualText en={builderEn('app_submitted')} el={builderEl('app_submitted')} compact />
          </Badge>
        );
    }
  };

  const picker = (
    <div className={layout === 'cards' ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'space-y-2'}>
      {applications.map((app) => {
        const completion = requiredCompletion(app);
        const on = activeApp === app.id;
        return (
          <Card
            key={app.id}
            role="button"
            tabIndex={0}
            aria-pressed={on}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/20',
              on && 'ring-2 ring-primary',
              layout === 'rail' && 'shadow-none',
            )}
            onClick={() => onSelect(app.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(app.id);
              }
            }}
          >
            <CardContent className={cn('space-y-3', layout === 'rail' && 'p-3')}>
              <CardHead
                mark={(
                  <div data-card-mark="" className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <CfbGlyph name={app.glyph} className="icon-md" aria-hidden="true" />
                  </div>
                )}
                title={app.name}
                meta={(app.deadlineKey || app.deadline) ? (
                  app.deadlineKey ? (
                    <BilingualText en={builderEn(app.deadlineKey)} el={builderEl(app.deadlineKey)} compact />
                  ) : (
                    app.deadline
                  )
                ) : undefined}
                aside={statusBadge(app.status)}
              />
              <p className="card-body line-clamp-2 text-muted-foreground">
                {app.descKey ? (
                  <BilingualText en={builderEn(app.descKey)} el={builderEl(app.descKey)} compact />
                ) : (
                  app.description
                )}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    <BilingualText en={builderEn('completion')} el={builderEl('completion')} compact />
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{completion}%</span>
                </div>
                <Progress value={completion} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const railStats = (
    <RailStats
      items={[
        {
          key: 'programs',
          label: builderEn('app_stat_programs'),
          labelEl: builderEl('app_stat_programs'),
          value: String(stats.programs),
          icon: FileText,
        },
        {
          key: 'progress',
          label: builderEn('app_stat_progress'),
          labelEl: builderEl('app_stat_progress'),
          value: String(stats.inProgress),
          icon: Loader,
        },
        {
          key: 'ready',
          label: builderEn('app_stat_ready'),
          labelEl: builderEl('app_stat_ready'),
          value: String(stats.ready),
          icon: BadgeCheck,
        },
        {
          key: 'avg',
          label: builderEn('app_stat_avg'),
          labelEl: builderEl('app_stat_avg'),
          value: `${stats.avg}%`,
          icon: Percent,
        },
      ]}
    />
  );

  if (layout === 'rail') {
    if (part === 'stats') return railStats;
    if (part === 'picker') return picker;
    return (
      <div className="space-y-4">
        {railStats}
        {picker}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { glyph: 'applications' as const, label: 'app_stat_programs' as const, value: String(stats.programs) },
            { glyph: 'flag' as const, label: 'app_stat_progress' as const, value: String(stats.inProgress) },
            { glyph: 'award' as const, label: 'app_stat_ready' as const, value: String(stats.ready) },
            { glyph: 'chart' as const, label: 'app_stat_avg' as const, value: `${stats.avg}%` },
          ] as const
        ).map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3">
              <CfbGlyph name={item.glyph} className="icon-sm shrink-0 text-muted-foreground/70" />
              <div className="min-w-0">
                <p className={cn(BUILDER_STAT_LABEL, 'text-muted-foreground')}>
                  <BilingualText en={builderEn(item.label)} el={builderEl(item.label)} compact />
                </p>
                <p className={BUILDER_STAT}>{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {picker}
    </>
  );
}
