'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, TrendingUp, Briefcase,
  Zap, ArrowUpDown, Users, Telescope,
  Layers, X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailOptions, RailStats } from '@/components/layout/RailParts';
import { usePageRail } from '@/components/layout/PageRailContext';
import { BilingualText } from '@/components/common/BilingualText';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  getShortlistIds, removeFromShortlist, saveToShortlist, searchProfiles, type SearchHit,
} from '@/lib/api';
import { bilingualInline } from '@/lib/i18n/format';
import { choiceControl, usePageControls, usePageList } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';
import { InvestorCard, type Investor } from '@/components/investors/InvestorCard';
import { STAGE_OPTIONS, TYPE_LABEL, TYPE_OPTIONS, formatCheckSize, type InvestorType } from '@/components/investors/investor-helpers';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { attachDemoPhotos } from '@/lib/demo/photos';
import { DEMO_INVESTORS } from '@/lib/demo/investors-world';
import { ASK } from '@/lib/page-questions';

// ── Types ─────────────────────────────────────────────────────────────────────

type TypeFilter = InvestorType | 'all';
type StageFilter = 'all' | 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth';
type ScoutFilter = 'any' | 'scouting';
type SortBy = 'portfolio' | 'views' | 'deals';

const SCOUT_OPTIONS = [
  { value: 'any', en: 'Anyone', el: 'Όλοι', icon: Users },
  { value: 'scouting', en: 'Actively scouting only', el: 'Μόνο όσοι αναζητούν ενεργά', icon: Zap },
] as const satisfies ReadonlyArray<{ value: ScoutFilter; en: string; el: string; icon: unknown }>;

const SORT_OPTIONS = [
  { value: 'portfolio', en: 'Most invested', el: 'Περισσότερες επενδύσεις' },
  { value: 'deals', en: 'Most active', el: 'Πιο ενεργοί' },
  { value: 'views', en: 'Most viewed', el: 'Περισσότερες προβολές' },
] as const satisfies ReadonlyArray<{ value: SortBy; en: string; el: string }>;


// ── Helpers ────────────────────────────────────────────────────────────────────

function hitToInvestor(hit: SearchHit): Investor {
  return {
    id: hit.id,
    userId: hit.userId,
    displayName: hit.displayName,
    avatarUrl: hit.avatarUrl ?? undefined,
    headline: hit.headline ?? undefined,
    location: hit.location ?? undefined,
    industries: hit.industries ?? [],
    stages: [],
    geographies: [],
    thesisSummary: hit.bio ?? undefined,
    sample: false,
  };
}

// ── Sample directory ───────────────────────────────────────────────────────────

/*
 * Shown only while sample data is on, beside whoever the real search returns.
 * The people and firms are invented; none names a real fund or company, and
 * none has a profile or an inbox, so their Profile and Intro buttons say so.
 */
// The demo's investors (demo/investors-world): the demo has their profiles and
// opens conversations with them, so in the demo their buttons work.
const SAMPLE_INVESTORS: Investor[] = attachDemoPhotos(DEMO_INVESTORS.map((inv) => ({ ...inv, sample: true })));

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InvestorsPage() {
  const sayOne = useBilingualString();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { showDemoData } = useDemoData();
  const { openRailSection } = usePageRail();
  const [search, setSearch] = useState('');
  const [investorType, setInvestorType] = useState<TypeFilter>('all');
  const [stage, setStage] = useState<StageFilter>('all');
  const [scout, setScout] = useState<ScoutFilter>('any');
  const [sortBy, setSortBy] = useState<SortBy>('portfolio');
  const [sampleSaved, setSampleSaved] = useState<Set<string>>(() => new Set());

  const query = search.trim();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk('members', 'investors', query, stage),
    queryFn: () => searchProfiles({
      q: query || undefined,
      roles: ['investor'],
      investmentStages: stage !== 'all' ? [stage] : undefined,
      limit: 50,
    }),
    staleTime: 60_000,
    retry: 1,
  });
  const { data: shortlistData } = useQuery({
    queryKey: qk('shortlist', 'ids'),
    queryFn: getShortlistIds,
    staleTime: 60_000,
  });
  const shortlisted = useMemo(() => new Set(shortlistData?.ids ?? []), [shortlistData]);

  const realInvestors = useMemo(
    () => (Array.isArray(data?.hits) ? data.hits : []).map(hitToInvestor),
    [data],
  );
  const directory = useMemo(
    () => (showDemoData ? [...realInvestors, ...SAMPLE_INVESTORS] : realInvestors),
    [realInvestors, showDemoData],
  );

  /*
   * The search and the stage reach the API for real rows. Type and scouting
   * are investor-profile fields the directory search does not return, so a
   * row that does not carry them drops out when one is chosen, rather than
   * being claimed to match.
   */
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return directory
      .filter((inv) => {
        if (!inv.sample) return (investorType === 'all' || inv.investorType === investorType) && (scout === 'any' || inv.isActivelyScouting === true);
        const matchSearch = !q
          || inv.displayName.toLowerCase().includes(q)
          || (inv.firmName?.toLowerCase().includes(q) ?? false)
          || inv.industries.some((i) => i.toLowerCase().includes(q));
        const matchType = investorType === 'all' || inv.investorType === investorType;
        const matchStage = stage === 'all' || inv.stages.includes(stage);
        const matchScout = scout === 'any' || inv.isActivelyScouting === true;
        return matchSearch && matchType && matchStage && matchScout;
      })
      .sort((a, b) => {
        // People who are really here come before the samples, in the
        // search's own order; the sort ranks the samples by their figures.
        if (a.sample !== b.sample) return a.sample ? 1 : -1;
        const pick = (i: Investor) => (sortBy === 'portfolio' ? i.portfolioCount : sortBy === 'views' ? i.viewCount : i.dealsThisYear);
        return (pick(b) ?? -1) - (pick(a) ?? -1);
      });
  }, [directory, query, investorType, stage, scout, sortBy]);

  const scoutingCount = directory.filter((i) => i.isActivelyScouting).length;
  const knownPortfolio = directory.filter((i) => i.portfolioCount != null);
  const totalPortfolio = knownPortfolio.reduce((s, i) => s + (i.portfolioCount ?? 0), 0);
  const industriesCovered = new Set(directory.flatMap((i) => i.industries)).size;
  const activeFilters = (investorType !== 'all' ? 1 : 0) + (stage !== 'all' ? 1 : 0) + (scout !== 'any' ? 1 : 0);
  const clearFilters = () => { setInvestorType('all'); setStage('all'); setScout('any'); };

  const isSaved = (inv: Investor) => (inv.sample ? sampleSaved.has(inv.userId) : shortlisted.has(inv.userId));
  const toggleSave = async (inv: Investor) => {
    const next = !isSaved(inv);
    if (inv.sample) {
      // A sample has no account to shortlist; the mark lasts for this visit.
      setSampleSaved((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(inv.userId); else copy.delete(inv.userId);
        return copy;
      });
      return;
    }
    try {
      if (next) await saveToShortlist(inv.userId);
      else await removeFromShortlist(inv.userId);
      await queryClient.invalidateQueries({ queryKey: qk('shortlist') });
      success(next
        ? bilingualInline('Saved to your shortlist', 'Αποθηκεύτηκε στη λίστα σας')
        : bilingualInline('Removed from your shortlist', 'Αφαιρέθηκε από τη λίστα σας'));
    } catch {
      toastError(bilingualInline('Could not update your shortlist', 'Δεν ήταν δυνατή η ενημέρωση της λίστας σας'));
    }
  };

  // Offered to the assistant: the rail's filters and the sort, through the
  // same setters. Saving a person is a shortlist write of its own.
  usePageControls([
    choiceControl('investor_type', 'Investor type', 'Τύπος επενδυτή', [...TYPE_OPTIONS], investorType, (v) => setInvestorType(v as TypeFilter)),
    choiceControl('investor_stage', 'Investment stage', 'Στάδιο επένδυσης', [...STAGE_OPTIONS], stage, (v) => setStage(v as StageFilter)),
    choiceControl('investor_scouting', 'Scouting', 'Αναζήτηση', SCOUT_OPTIONS.map(({ value, en, el }) => ({ value, en, el })), scout, (v) => setScout(v as ScoutFilter)),
    choiceControl('investor_sort', 'Sort investors', 'Ταξινόμηση επενδυτών', [...SORT_OPTIONS], sortBy, (v) => setSortBy(v as SortBy)),
  ]);
  usePageList([
    {
      id: 'investors',
      labelEn: 'Investors',
      labelEl: 'Επενδυτές',
      rows: isLoading ? undefined : filtered.filter((i) => !i.sample).map((i) =>
        `${i.displayName}${i.headline ? ` · ${i.headline}` : ''}${i.location ? ` · ${i.location}` : ''}${i.industries.length ? ` · ${i.industries.join(', ')}` : ''}${shortlisted.has(i.userId) ? ' · on your shortlist' : ''}`,
      ),
      rowsEl: isLoading ? undefined : filtered.filter((i) => !i.sample).map((i) =>
        `${i.displayName}${i.headline ? ` · ${i.headline}` : ''}${i.location ? ` · ${i.location}` : ''}${i.industries.length ? ` · ${i.industries.join(', ')}` : ''}${shortlisted.has(i.userId) ? ' · στη λίστα σας' : ''}`,
      ),
    },
    {
      id: 'sample-investors',
      labelEn: 'Sample investors',
      labelEl: 'Δείγματα επενδυτών',
      rows: showDemoData ? filtered.filter((i) => i.sample).map((i) =>
        `${i.displayName}${i.firmName ? ` · ${i.firmName}` : ''} · ${i.investorType ? TYPE_LABEL[i.investorType].en : 'investor'} · ${i.stages.join('/')} · ${formatCheckSize(i.checkSizeMin, i.checkSizeMax) ?? 'check size undisclosed'}`,
      ) : [],
      rowsEl: showDemoData ? filtered.filter((i) => i.sample).map((i) =>
        `${i.displayName}${i.firmName ? ` · ${i.firmName}` : ''} · ${i.investorType ? TYPE_LABEL[i.investorType].el : 'επενδυτής'} · ${i.stages.join('/')} · ${formatCheckSize(i.checkSizeMin, i.checkSizeMax) ?? 'το ύψος επένδυσης δεν δηλώνεται'}`,
      ) : [],
      sample: true,
    },
  ]);

  /*
   * The column leads with the search and the people. The four directory
   * figures and the type, stage and scouting filters are auxiliary, so they
   * live in the rail; the sort stays beside the count it orders.
   */
  const rail: PageRailSection[] = [
    {
      id: 'summary',
      glyph: 'discover',
      labelEn: 'Directory at a glance',
      labelEl: 'Ο κατάλογος με μια ματιά',
      content: (
        <RailStats
          items={[
            { key: 'investors', label: 'Investors', labelEl: 'Επενδυτές', value: isLoading ? '—' : directory.length, icon: Users, tone: 'bg-status-accent-bg text-status-accent' },
            { key: 'scouting', label: 'Actively scouting', labelEl: 'Αναζητούν ενεργά', value: scoutingCount, icon: Zap, tone: 'bg-status-success-bg text-status-success' },
            ...(knownPortfolio.length ? [{ key: 'portfolio', label: 'Investments on record', labelEl: 'Καταγεγραμμένες επενδύσεις', value: totalPortfolio, icon: Briefcase, tone: 'bg-status-info-bg text-status-info' }] : []),
            { key: 'industries', label: 'Industries covered', labelEl: 'Κλάδοι που καλύπτονται', value: industriesCovered, icon: Telescope, tone: 'bg-status-warning-bg text-status-warning' },
          ]}
        />
      ),
    },
    {
      id: 'filters',
      glyph: 'sliders',
      labelEn: 'Filters',
      labelEl: 'Φίλτρα',
      badge: activeFilters || null,
      content: (
        <div className="space-y-4">
          <RailOptions title="Investor type" titleEl="Τύπος επενδυτή" options={TYPE_OPTIONS} value={investorType} onChange={setInvestorType} />
          <RailOptions title="Stage" titleEl="Στάδιο" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
          <RailOptions title="Availability" titleEl="Διαθεσιμότητα" options={SCOUT_OPTIONS} value={scout} onChange={setScout} />
          {activeFilters > 0 && (
            <RailAction icon={X} en="Clear filters" el="Καθαρισμός φίλτρων" onClick={clearFilters} />
          )}
        </div>
      ),
    },
    {
      id: 'related',
      glyph: 'flag',
      labelEn: 'Linked pages',
      labelEl: 'Συνδεδεμένες σελίδες',
      content: (
        <div className="space-y-1">
          <RailAction icon={TrendingUp} en="Open fundraising" el="Άνοιγμα χρηματοδότησης" onClick={() => router.push('/fundraising')} />
          <RailAction icon={Zap} en="Open matches" el="Άνοιγμα αντιστοιχίσεων" onClick={() => router.push('/matches')} />
          <RailAction icon={Telescope} en="Open discover" el="Άνοιγμα ανακάλυψης" onClick={() => router.push('/discover')} />
        </div>
      ),
    },
  ];

  return (
    <AppShell showHelp rail={rail} titleSticker={{ glyph: 'scout', tint: 'success' }}>
      <div className="space-y-6 pb-10">
        {showDemoData && (
          <SampleDataNotice
            surface="Investors"
            detail="The directory lists people whose role is investor. The six cards with a firm, check size and track record are samples that show what a complete investor profile looks like."
            askAiPrompt={ASK.investorsSample}
          />
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={sayOne('Search by name, firm or focus area…', 'Αναζήτηση με όνομα, εταιρεία ή πεδίο…')}
            aria-label={bilingualInline('Search investors', 'Αναζήτηση επενδυτών')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {isError && directory.length === 0 ? null : isLoading ? (
              <BilingualText en="Loading investors…" el="Φόρτωση επενδυτών…" compact />
            ) : (
              <BilingualText
                en={`${filtered.length} of ${directory.length} investors`}
                el={`${filtered.length} από ${directory.length} επενδυτές`}
                compact
              />
            )}
          </p>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger aria-label={bilingualInline('Sort investors', 'Ταξινόμηση επενδυτών')} className="h-9 w-full sm:w-auto sm:min-w-[17rem]">
              <ArrowUpDown className="mr-2 icon-sm text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  <BilingualText en={o.en} el={o.el} compact />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {isError && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <p role="alert" className="text-sm text-muted-foreground">
                  <BilingualText en="The investor directory could not be read just now." el="Ο κατάλογος επενδυτών δεν διαβάστηκε αυτή τη στιγμή." wrap />
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
                </Button>
              </CardContent>
            </Card>
          )}
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden lg:flex">
                  <Skeleton className="h-28 w-full lg:h-auto lg:w-56 lg:self-stretch" />
                  <CardContent className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))
            : (
              // One card a row at every width, like Matches (docs §115/§125).
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((inv) => (
                  <InvestorCard key={inv.id} investor={inv} saved={isSaved(inv)} onToggleSave={() => void toggleSave(inv)} />
                ))}
              </div>
            )}
          {/* Not under a failed read: "No investors have joined yet" stood
              under "could not be loaded" (docs §86). */}
          {!isLoading && !isError && filtered.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
                <p className="card-title text-foreground">
                  {directory.length === 0 && !query
                    ? <BilingualText en="No investors have joined yet" el="Δεν έχουν εγγραφεί ακόμα επενδυτές" />
                    : <BilingualText en="No investors match" el="Κανένας επενδυτής δεν ταιριάζει" />}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeFilters > 0
                    ? <BilingualText en="The filters in the side panel may be hiding people. Type and scouting are known only for complete investor profiles." el="Τα φίλτρα του πλευρικού πάνελ ίσως κρύβουν άτομα. Ο τύπος και η αναζήτηση είναι γνωστά μόνο για πλήρη προφίλ επενδυτών." wrap />
                    : query
                      ? <BilingualText en="Try a different name, firm or industry." el="Δοκιμάστε άλλο όνομα, εταιρεία ή κλάδο." wrap />
                      : <BilingualText en="Investors appear here once they join with the investor role." el="Οι επενδυτές εμφανίζονται εδώ όταν εγγραφούν με τον ρόλο του επενδυτή." wrap />}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {activeFilters > 0 && (
                    <Button variant="secondary" size="sm" onClick={() => openRailSection('filters')}>
                      <BilingualText en="Show filters" el="Εμφάνιση φίλτρων" compact />
                    </Button>
                  )}
                  {query && (
                    <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
                      <BilingualText en="Clear search" el="Καθαρισμός αναζήτησης" compact />
                    </Button>
                  )}
                  {!query && activeFilters === 0 && (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href="/fundraising">
                        <Layers className="mr-1.5 icon-sm" aria-hidden="true" />
                        <BilingualText en="Plan your round" el="Σχεδιάστε τον γύρο σας" compact />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
