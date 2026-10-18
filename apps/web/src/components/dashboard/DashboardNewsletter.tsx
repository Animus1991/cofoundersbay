'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { bilingualAria } from '@/lib/i18n/format';
import { BilingualText } from '@/components/common/BilingualText';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';

export type NewsletterItem = {
  id: string;
  title: string;
  excerpt?: string;
  date?: string;
  href?: string;
};

const defaultAnnouncements: NewsletterItem[] = [
  { id: '1', title: 'Community update: Q1 priorities', excerpt: 'Roadmap and upcoming features.', date: 'Feb 12', href: '#' },
  { id: '2', title: 'New matching algorithm', excerpt: 'Improved relevance for co-founder suggestions.', date: 'Feb 8', href: '#' },
];

type DashboardNewsletterProps = {
  items?: NewsletterItem[] | null;
  className?: string;
};

export function DashboardNewsletter({
  items = defaultAnnouncements,
  className,
}: DashboardNewsletterProps) {
  const sayOne = useBilingualString();
  const list = items ?? defaultAnnouncements;
  const reasonId = useId();
  const reasonEn = 'The newsletter has no subscription service yet';
  const reasonEl = 'Το ενημερωτικό δελτίο δεν έχει ακόμη υπηρεσία εγγραφής';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Mail className="icon-sm text-muted-foreground" />
          Announcements & newsletter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {list.slice(0, 3).map((item) => (
            <li key={item.id}>
              <Link
                href={item.href ?? '#'}
                className="block rounded-lg border border-border bg-card/60 p-3 text-sm transition-colors hover:bg-secondary/60"
              >
                <p className="font-medium text-foreground">{item.title}</p>
                {item.excerpt && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.excerpt}
                  </p>
                )}
                {item.date && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="inline-flex max-w-full flex-col items-start">
          <div className="flex gap-2">
            <Input
              placeholder={sayOne("Your email", "Το email σας")}
              className="flex-1 text-sm"
              type="email"
              aria-label="Newsletter email"
              disabled
              title={bilingualAria(reasonEn, reasonEl)}
              aria-describedby={reasonId}
            />
            <Button
              aria-label={bilingualAria('Subscribe', 'Εγγραφή')}
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled
              title={bilingualAria(reasonEn, reasonEl)}
              aria-describedby={reasonId}
            >
              <ArrowRight className="icon-sm" />
            </Button>
          </div>
          <span id={reasonId} className="max-w-[16rem] text-2xs leading-snug text-muted-foreground sm:sr-only">
            <BilingualText en={reasonEn} el={reasonEl} compact wrap />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
