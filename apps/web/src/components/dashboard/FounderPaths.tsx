import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { Card, CardContent } from '@/components/ui/card';

/**
 * The three doors a cofounder community is usually read through (start, grow,
 * fund), each opening a tool this product already has. Nothing here is new
 * data and nothing promises funding.
 */
export const FOUNDER_PATHS = [
  {
    href: '/commitments/new',
    titleEn: 'Start',
    titleEl: 'Ξεκινήστε',
    bodyEn: 'Say who the startup needs, then look for that person.',
    bodyEl: 'Πείτε ποιον χρειάζεται το startup και μετά αναζητήστε τον.',
  },
  {
    href: '/learning',
    titleEn: 'Grow',
    titleEl: 'Αναπτυχθείτε',
    bodyEn: 'A short path in the learning hub, then a mentor or an event.',
    bodyEl: 'Μια σύντομη διαδρομή στο κέντρο μάθησης, μετά ένας μέντορας ή μια εκδήλωση.',
  },
  {
    href: '/fundraising',
    titleEn: 'Fund',
    titleEl: 'Χρηματοδότηση',
    bodyEn: 'Prepare the pitch, then meet investors. Nothing here promises funding.',
    bodyEl: 'Ετοιμάστε την παρουσίαση και μετά γνωρίστε επενδυτές. Τίποτα εδώ δεν υπόσχεται χρηματοδότηση.',
  },
] as const;

export function FounderPaths() {
  return (
    <section className="space-y-3" aria-label="Start, grow, fund">
      <p className="text-sm text-muted-foreground">
        <BilingualText en="Three doors. Each one opens a tool you already have." el="Τρεις πόρτες. Η καθεμία ανοίγει ένα εργαλείο που ήδη έχετε." wrap />
      </p>
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
        {FOUNDER_PATHS.map((path) => (
          <Link key={path.href} href={path.href} className="flex h-full min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="flex h-full w-full flex-col transition-colors hover:border-primary/30">
              <CardContent className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  <BilingualText en={path.titleEn} el={path.titleEl} compact />
                </p>
                <p className="text-sm text-muted-foreground">
                  <BilingualText en={path.bodyEn} el={path.bodyEl} wrap />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
