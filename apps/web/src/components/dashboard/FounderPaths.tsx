import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle>
          <BilingualText en="Start, grow, fund" el="Ξεκινήστε, αναπτυχθείτε, χρηματοδότηση" compact />
        </CardTitle>
        <CardDescription>
          <BilingualText en="Three doors. Each one opens a tool you already have." el="Τρεις πόρτες. Η καθεμία ανοίγει ένα εργαλείο που ήδη έχετε." wrap />
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="card-rows">
          {FOUNDER_PATHS.map((path) => (
            <Link key={path.href} href={path.href} className="axis-row block px-4 py-3 sm:px-6">
              <p className="text-sm font-medium text-foreground">
                <BilingualText en={path.titleEn} el={path.titleEl} compact />
              </p>
              <p className="text-sm text-muted-foreground">
                <BilingualText en={path.bodyEn} el={path.bodyEl} wrap />
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
