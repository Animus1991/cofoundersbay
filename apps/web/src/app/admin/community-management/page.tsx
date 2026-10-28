'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { HelpCallout } from '@/components/common/HelpCallout';
import { BilingualText } from '@/components/common/BilingualText';
import { RelativeTime } from '@/components/common/RelativeTime';
import { PageFacts } from '@/components/common/PageFacts';
import { Button } from '@/components/ui/button';
import { EmptyLine, RowHead } from '@/components/dashboard/SectionCard';
import { FactLine } from '@/components/common/FactLine';
import { StatusText } from '@/components/common/StatusText';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { listGroups } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { formatRelativeTime } from '@/lib/utils';
import { bilingualInline } from '@/lib/i18n/format';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';

const PRIVACY_LABEL: Record<string, { en: string; el: string }> = {
  public: { en: 'Public', el: 'Δημόσια' },
  private: { en: 'Private', el: 'Ιδιωτική' },
  secret: { en: 'Secret', el: 'Μυστική' },
};

/*
 * Three communities written into this file ("Climate Founders EU", 842
 * members, "+12% growth") while /admin/communities listed seven different ones
 * from the groups API - two admin pages about the same thing that did not
 * share a single row, and a "pending review" status groups do not have. This
 * reads the list /admin/communities reads, under the same key, and counts
 * what the rows actually carry. Editing stays on /admin/communities.
 */
export default function CommunityManagementPage() {
  const sayOne = useBilingualString();
  const [search, setSearch] = useState('');
  // "Private or secret" is a figure and a filter (docs §64.5, §111).
  const [closedOnly, setClosedOnly] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: qk('groups', 'admin'),
    queryFn: () => listGroups({ limit: 100, sort: 'popular' }),
    staleTime: 60_000,
    retry: 0,
  });

  const groups = data?.groups ?? [];
  const filtered = groups.filter((g) => `${g.name} ${g.category ?? ''}`.toLowerCase().includes(search.toLowerCase()) && (!closedOnly || g.privacy !== 'public'));
  const members = groups.reduce((sum, g) => sum + (g.memberCount ?? 0), 0);
  const posts = groups.reduce((sum, g) => sum + (g.postCount ?? 0), 0);
  const closed = groups.filter((g) => g.privacy !== 'public').length;
  // The groups on screen, for the assistant; editing lives on /admin/communities.
  usePageControls([
    choiceControl('communities_shown', 'Communities shown', 'Κοινότητες που εμφανίζονται', [
      { value: 'all', en: 'All communities', el: 'Όλες οι κοινότητες' },
      { value: 'closed', en: 'Private or secret only', el: 'Μόνο ιδιωτικές ή μυστικές' },
    ], closedOnly ? 'closed' : 'all', (v) => setClosedOnly(v === 'closed')),
  ]);
  usePageList([
    {
      id: 'communities',
      labelEn: 'Communities',
      labelEl: 'Κοινότητες',
      rows: isLoading ? undefined : filtered.map((g) => `${g.name}${g.category ? ` · ${g.category}` : ''} · ${g.privacy} · ${g.memberCount ?? 0} members · ${g.postCount ?? 0} posts`),
      total: groups.length,
    },
  ]);

  return (
    <AppShell
      title="Community management"
      titleEl="Διαχείριση κοινοτήτων"
      description="Every group's size and activity at a glance; create, edit or remove them from Communities."
      descriptionEl="Μέγεθος και δραστηριότητα κάθε ομάδας με μια ματιά· δημιουργία, επεξεργασία ή διαγραφή από τις Κοινότητες."
      showHelp
      actions={(
        // The way to editing; it was the first tile's link.
        <Button variant="outline" asChild>
          <Link href="/admin/communities">
            <BilingualText en="Manage communities" el="Διαχείριση κοινοτήτων" compact />
          </Link>
        </Button>
      )}
    >
      <HelpCallout id="admin-community-management" title="Managing communities" titleEl="Διαχείριση κοινοτήτων">
        <p>
          A high post-to-member ratio usually means a healthy group; a large group with few posts may need a moderator
          or a nudge. Private and secret groups are listed here but not in public discovery. Memberships count a
          person once per group, so someone in two groups counts twice.
        </p>
        <p lang="el" className="mt-2 text-muted-foreground">
          Πολλές αναρτήσεις ανά μέλος σημαίνουν συνήθως μια υγιή ομάδα· μια μεγάλη ομάδα με λίγες αναρτήσεις ίσως
          χρειάζεται συντονιστή ή μια υπενθύμιση. Οι ιδιωτικές και οι μυστικές ομάδες εμφανίζονται εδώ, όχι όμως στη
          δημόσια ανακάλυψη. Οι συμμετοχές μετρούν ένα πρόσωπο μία φορά ανά ομάδα, οπότε όποιος είναι σε δύο ομάδες
          μετρά δύο φορές.
        </p>
      </HelpCallout>

      {/* One line of figures before the list (docs §64.5, §111). "Private or
          secret" is a button that narrows the list; editing is the header's
          "Manage communities". */}
      <PageFacts
        labelEn="Communities in figures"
        labelEl="Οι κοινότητες σε αριθμούς"
        facts={[
          { id: 'communities', value: isLoading ? null : groups.length, en: groups.length === 1 ? 'community' : 'communities', el: groups.length === 1 ? 'κοινότητα' : 'κοινότητες' },
          { id: 'memberships', value: isLoading ? null : members.toLocaleString('en-GB'), en: 'memberships', el: 'συμμετοχές' },
          { id: 'posts', value: isLoading ? null : posts.toLocaleString('en-GB'), en: 'posts', el: 'αναρτήσεις' },
          {
            id: 'closed',
            value: isLoading ? null : closed,
            en: 'private or secret',
            el: 'ιδιωτικές ή μυστικές',
            onSelect: closed || closedOnly ? () => setClosedOnly((on) => !on) : undefined,
            selected: closedOnly,
          },
        ]}
      />

      <div className="relative mt-4 max-w-md">
        <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={sayOne("Search communities…", "Αναζήτηση κοινοτήτων…")}
          aria-label={bilingualInline("Search communities", "Αναζήτηση κοινοτήτων")}
          className="pl-9"
        />
      </div>

      <Card className="mt-4 overflow-hidden">
        {isLoading && (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        )}
        {!isLoading && isError && groups.length === 0 && (
          <EmptyLine en="The groups could not be loaded." el="Οι κοινότητες δεν φορτώθηκαν." />
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyLine
            en={search || closedOnly ? 'No community matches that search.' : 'No communities yet.'}
            el={search || closedOnly ? 'Καμία κοινότητα δεν ταιριάζει.' : 'Δεν υπάρχουν κοινότητες ακόμα.'}
          />
        )}
        {filtered.map((g) => {
          const privacy = PRIVACY_LABEL[g.privacy] ?? PRIVACY_LABEL.public;
          const ratio = g.memberCount ? g.postCount / g.memberCount : 0;
          return (
            // A row of the list, set like every row in a section card: the
            // name over its category and reach (a step under the page's
            // title), the privacy at the right, the activity on the caption.
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="group block border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30 focus-ring sm:px-6"
            >
              <RowHead
                title={g.name}
                subtitle={(
                  <FactLine
                    items={[
                      g.category ? <StatusText key="category" value={g.category} /> : null,
                      <BilingualText key="members" en={`${g.memberCount.toLocaleString('en-GB')} members`} el={`${g.memberCount.toLocaleString('el-GR')} μέλη`} compact />,
                      <BilingualText key="posts" en={`${g.postCount.toLocaleString('en-GB')} posts`} el={`${g.postCount.toLocaleString('el-GR')} αναρτήσεις`} compact />,
                      <span key="created"><BilingualText en="Created" el="Δημιουργήθηκε" compact /> <RelativeTime date={g.createdAt} format={formatRelativeTime} /></span>,
                    ]}
                  />
                )}
                meta={(
                  <span className="tabular-nums" title={bilingualInline('Posts per member', 'Αναρτήσεις ανά μέλος')}>
                    <BilingualText en={`${ratio.toFixed(2)} posts / member`} el={`${ratio.toFixed(2)} αναρτήσεις / μέλος`} compact />
                  </span>
                )}
                asideStays
                aside={(
                  <>
                    <Badge variant="outline" size="sm">
                      <BilingualText en={privacy.en} el={privacy.el} compact />
                    </Badge>
                    <ChevronRight className="icon-sm shrink-0 text-muted-foreground/60 group-hover:text-foreground" aria-hidden="true" />
                  </>
                )}
              />
            </Link>
          );
        })}
      </Card>
    </AppShell>
  );
}
