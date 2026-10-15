'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BilingualText } from '@/components/common/BilingualText';

/**
 * The one thing a home screen names before its figures.
 *
 * A short label, the specific thing (a board, a person, a deal), and one
 * button that opens a page which already exists. The same card the founder
 * phone home used for "Continue"; the other role homes use it so the first
 * glance says what to do next without a second copy of the list below.
 */
export function HomeNextStep({
  kickerEn,
  kickerEl,
  title,
  titleEn,
  titleEl,
  href,
  actionEn,
  actionEl,
  reasonEn,
  reasonEl,
  external = false,
  actionVariant = 'default',
}: {
  kickerEn: string;
  kickerEl: string;
  /** A name or title that is the same in both languages. */
  title?: string;
  titleEn?: string;
  titleEl?: string;
  href: string;
  actionEn: string;
  actionEl: string;
  /** A fact about why this is the next step. Omitted when the page does not know one. */
  reasonEn?: string;
  reasonEl?: string;
  external?: boolean;
  actionVariant?: 'default' | 'outline';
}) {
  const label = (
    <BilingualText en={actionEn} el={actionEl} compact />
  );
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            <BilingualText en={kickerEn} el={kickerEl} compact />
          </p>
          <p className="text-sm font-medium text-foreground">
            {titleEn != null ? (
              <BilingualText en={titleEn} el={titleEl ?? titleEn} compact wrap />
            ) : (
              title
            )}
          </p>
          {reasonEn ? (
            <p className="text-xs text-muted-foreground">
              <BilingualText en={reasonEn} el={reasonEl ?? reasonEn} compact wrap />
            </p>
          ) : null}
        </div>
        <Button asChild size="sm" variant={actionVariant} className="shrink-0">
          {external ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <Link href={href}>{label}</Link>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
