'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BilingualText } from '@/components/common/BilingualText';
import { SectionSticker } from '@/components/dashboard/SectionSticker';
import { SectionLink } from '@/components/home/SectionLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { assessReadiness } from '@/lib/api';
import { isPreviewDemo } from '@/lib/preview-demo';
import { qk } from '@/lib/query-keys';
import { readReadinessOverlay } from '@/lib/readiness-demo';
import {
  STATUS_LABEL,
  buildDemoAssessment,
  buildDimensions,
  isAssessmentData,
  nextOpenCriterion,
  scoreColors,
  scoreToStatus,
  type AssessmentData,
} from '@/lib/readiness-assessment';
import { cn } from '@/lib/utils';

/**
 * The Readiness page in one card, for the Builder's Readiness tab (docs §158).
 *
 * The tab used to be a second readiness of its own, with six criteria per
 * dimension where the page has five, so the same team read «3/6» there and
 * «3/5» here. This reads exactly what the page reads: in the showcase the
 * same criteria and the ticks made on the page; otherwise the workspace's live
 * assessment, under the page's own query key, so the two share one answer.
 * Ticking, the radar, benchmarks and history stay on the page, one link away.
 */
export function ReadinessSummary({ workspaceId }: { workspaceId?: string | null }) {
  const [demo, setDemo] = useState<boolean | null>(null);
  const [demoData, setDemoData] = useState<AssessmentData | null>(null);
  useEffect(() => {
    if (!isPreviewDemo()) {
      setDemo(false);
      return undefined;
    }
    setDemo(true);
    const read = () => setDemoData(buildDemoAssessment(readReadinessOverlay()));
    read();
    // The page and the assistant announce a tick; the card follows it.
    window.addEventListener('cfb:readiness-updated', read);
    return () => window.removeEventListener('cfb:readiness-updated', read);
  }, []);

  const live = useQuery({
    queryKey: qk('readiness', workspaceId ?? null, 'canonical'),
    enabled: demo === false && !!workspaceId,
    queryFn: async () => {
      if (!workspaceId) throw new Error('A live workspace is required');
      const response = await assessReadiness({ workspaceId });
      if (!isAssessmentData(response?.assessment)) throw new Error('Readiness assessment is unavailable');
      return response.assessment;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const data = demo ? demoData : live.data ?? null;
  const loading = demo === null || (demo && !demoData) || (demo === false && !!workspaceId && live.isLoading);

  const head = (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="flex min-w-0 items-center gap-2">
          <SectionSticker glyph="gauge" tint="accent" />
          <BilingualText en="Investor readiness" el="Ετοιμότητα για επενδυτές" compact />
        </CardTitle>
        <SectionLink href="/readiness" en="Open Readiness" el="Άνοιγμα Ετοιμότητας" data-readiness-open="" />
      </div>
    </CardHeader>
  );

  if (loading) {
    return (
      <Card data-readiness-summary="loading">
        {head}
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-readiness-summary="empty">
        {head}
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <BilingualText
              en="Readiness is scored on its own page, against what investors and accelerators check."
              el="Η ετοιμότητα βαθμολογείται στη δική της σελίδα, με όσα ελέγχουν επενδυτές και επιταχυντές."
              wrap
            />
          </p>
        </CardContent>
      </Card>
    );
  }

  const dimensions = buildDimensions(data);
  const overall = Math.round((data.overallScore / data.overallMax) * 100);
  const level = scoreToStatus(overall);
  const colors = scoreColors(level);
  const done = dimensions.reduce((n, d) => n + d.criteria.filter((c) => c.completed).length, 0);
  const total = dimensions.reduce((n, d) => n + d.criteria.length, 0);
  const next = nextOpenCriterion(dimensions);

  return (
    <Card data-readiness-summary="ready">
      {head}
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {overall}
            <span className="text-base font-medium text-muted-foreground">/100</span>
          </p>
          <span className={cn('page-stat-label rounded-full px-2.5 py-0.5 font-semibold leading-none', colors.bg, colors.text)}>
            <BilingualText en={STATUS_LABEL[level].en} el={STATUS_LABEL[level].el} compact />
          </span>
          <p className="text-xs text-muted-foreground">
            <BilingualText
              en={`Based on ${dimensions.length} dimensions · ${done}/${total} criteria`}
              el={`Βάσει ${dimensions.length} διαστάσεων · ${done}/${total} κριτήρια`}
              compact
            />
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3" data-readiness-dimensions="">
          {dimensions.map((d) => {
            const pct = Math.round((d.score / d.maxScore) * 100);
            const doneHere = d.criteria.filter((c) => c.completed).length;
            return (
              <li key={d.key}>
                <Link href={`/readiness#dim-${d.key}`} className="group block rounded-sm focus-ring">
                  <span className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground transition-colors group-hover:text-foreground">
                      <BilingualText en={d.labelEn} el={d.labelEl} compact />
                      <span className="tabular-nums"> · {doneHere}/{d.criteria.length}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">{pct}%</span>
                  </span>
                  <Progress value={pct} label={d.labelEn} className="h-1.5" />
                </Link>
              </li>
            );
          })}
        </ul>

        {next ? (
          <p className="border-t border-border pt-3 text-sm">
            <span className="text-xs text-muted-foreground">
              <BilingualText en="Next to complete" el="Επόμενο προς ολοκλήρωση" compact />
            </span>
            <br />
            <Link href={`/readiness#dim-${next.dimKey}`} className="font-medium text-foreground hover:text-primary-accessible">
              <BilingualText en={next.name} el={next.nameEl ?? next.name} compact wrap />
            </Link>
            <span className="text-muted-foreground">
              {' · '}
              <BilingualText en={`${next.dimLabelEn} +${next.weight}%`} el={`${next.dimLabelEl} +${next.weight}%`} compact />
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
