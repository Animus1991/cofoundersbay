'use client';

import Link from 'next/link';
import { COMPAT_COPY, COMPAT_MIN_SHARED, type CompatComparison, type CompatVerdict } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const VERDICT_TONE: Record<CompatVerdict, string> = {
  agree: 'border-status-success-border bg-status-success-bg text-status-success',
  close: 'border-status-info-border bg-status-info-bg text-status-info',
  talk: 'border-status-warning-border bg-status-warning-bg text-status-warning',
};

/**
 * "Where you agree, and what to talk about first": per compatibility question
 * both people answered, a verdict and - where they differ - the conversation
 * to have. It never shows either person's answer.
 */
export function CompatibilityList({ comparison, answeredByYou }: { comparison: CompatComparison | null | undefined; answeredByYou?: number }) {
  const items = comparison?.items ?? [];
  if (!comparison || comparison.shared < COMPAT_MIN_SHARED) {
    return (
      <div className="space-y-3">
        <p className="card-body text-muted-foreground">
          <BilingualText en={COMPAT_COPY.fewShared.en} el={COMPAT_COPY.fewShared.el} wrap />
        </p>
        {typeof answeredByYou === 'number' && answeredByYou < (comparison?.total ?? 10) ? (
          <Button size="sm" variant="outline" asChild>
            <Link href="/settings#how-you-work">
              <BilingualText en={`Answer the questions (${answeredByYou} of ${comparison?.total ?? 10})`} el={`Απαντήστε στις ερωτήσεις (${answeredByYou} από ${comparison?.total ?? 10})`} compact />
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="card-body text-muted-foreground">
        <BilingualText
          en={`You both answered ${comparison.shared} of ${comparison.total}: ${comparison.agree} agree, ${comparison.close} close, ${comparison.talk} to talk about first.`}
          el={`Απαντήσατε και οι δύο ${comparison.shared} από ${comparison.total}: ${comparison.agree} συμφωνίες, ${comparison.close} κοντά, ${comparison.talk} για συζήτηση πρώτα.`}
          wrap
        />
      </p>
      <ul className="card-rows">
        {items.map((item) => (
          <li key={item.id} className="space-y-1 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium text-foreground">
                <BilingualText en={item.question.en} el={item.question.el} wrap />
              </p>
              <Badge variant="outline" className={`shrink-0 ${VERDICT_TONE[item.verdict]}`}>
                <BilingualText en={COMPAT_COPY.verdict[item.verdict].en} el={COMPAT_COPY.verdict[item.verdict].el} compact />
              </Badge>
            </div>
            {item.talk ? (
              <p className="card-body text-muted-foreground">
                <BilingualText en={item.talk.en} el={item.talk.el} wrap />
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
