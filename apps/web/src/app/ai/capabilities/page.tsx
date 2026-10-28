'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAskAssistant } from '@/hooks/useAskAssistant';
import { Search } from 'lucide-react';
import { listDeclarations, type ActionDeclaration } from '@cofounderbay/shared';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { CardHead } from '@/components/common/CardAnatomy';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { bilingualInline } from '@/lib/i18n/format';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { CfbGlyph } from '@/components/icons/CfbGlyph';
import { BUILDER_BTN } from '@/components/builder/BuilderStageChrome';

/**
 * Generated from the shared capability contract — the same list the model is
 * offered and the same list the confirmation cards run. A hand-written page
 * would drift the moment a declaration was added; this cannot.
 */
const SAMPLE_ASK: Record<string, { en: string; el: string }> = {
  get_graph: { en: 'What should I do next?', el: 'Τι να κάνω μετά;' },
  search_people: { en: 'Find a technical cofounder in Athens', el: 'Βρες τεχνικό συνιδρυτή στην Αθήνα' },
  get_recommendations: { en: 'Show my best matches', el: 'Δείξε τις καλύτερες αντιστοιχίσεις' },
  get_notifications: { en: 'Show my notifications', el: 'Δείξε τις ειδοποιήσεις μου' },
  get_events: { en: 'What events are coming up?', el: 'Ποιες εκδηλώσεις έρχονται;' },
  get_milestones: { en: 'Which of my milestones are overdue?', el: 'Ποια ορόσημά μου είναι εκπρόθεσμα;' },
  get_jobs: { en: 'Any open jobs?', el: 'Υπάρχουν ανοιχτές θέσεις;' },
  get_groups: { en: 'What communities am I in?', el: 'Σε ποιες κοινότητες είμαι;' },
  get_endorsements: { en: 'Do I have endorsements waiting?', el: 'Έχω συστάσεις σε αναμονή;' },
  get_opportunities: { en: 'Show me open opportunities', el: 'Δείξε μου ανοιχτές ευκαιρίες' },
  get_commitments: { en: 'Where do my commitments stand?', el: 'Πού βρίσκονται οι δεσμεύσεις μου;' },
  get_founder_updates: { en: 'Any new founder updates?', el: 'Υπάρχουν νέες ενημερώσεις ιδρυτών;' },
  get_intros: { en: 'Who could introduce me to Nikos?', el: 'Ποιος μπορεί να με συστήσει στον Νίκο;' },
  get_match_detail: { en: 'Why do I match with Elena?', el: 'Γιατί ταιριάζω με την Έλενα;' },
  get_team_gaps: { en: 'What skills is my team missing?', el: 'Τι δεξιότητες λείπουν από την ομάδα μου;' },
  get_skill_evidence: { en: 'What evidence backs my skills?', el: 'Ποια τεκμήρια στηρίζουν τις δεξιότητές μου;' },
  get_scout: { en: 'What did my co-founder scout find?', el: 'Τι βρήκε ο ανιχνευτής συνιδρυτών;' },
  get_perks: { en: 'Which perks fit my stage?', el: 'Ποιες προσφορές συνεργατών ταιριάζουν στο στάδιό μου;' },
  get_profile_viewers: { en: 'Who viewed my profile?', el: 'Ποιος είδε το προφίλ μου;' },
  get_mentorship_sessions: { en: 'When is my next mentoring session?', el: 'Πότε είναι η επόμενη συνεδρία καθοδήγησής μου;' },
  get_shortlist: { en: 'Who is on my shortlist?', el: 'Ποιος είναι στη λίστα μου;' },
  get_research_boards: { en: 'Show my research boards', el: 'Δείξε τους πίνακες έρευνας' },
  get_investor_board: { en: 'What is on my deal board?', el: 'Τι έχω στον πίνακα επενδύσεων;' },
  get_fundraising: { en: 'How is my fundraising going?', el: 'Πώς πάει η χρηματοδότησή μου;' },
  get_builder_state: { en: 'Show my Startup Builder workspaces', el: 'Δείξε τους χώρους Startup Builder' },
  get_profile: { en: 'Show my profile', el: 'Δείξε το προφίλ μου' },
  get_messages: { en: 'Any unread messages?', el: 'Έχω αδιάβαστα μηνύματα;' },
  search_messages: { en: 'Where did Elena and I talk about the research canvas?', el: 'Πού μιλήσαμε με την Έλενα για τον πίνακα έρευνας;' },
  get_connections: { en: 'Who is waiting on my connections?', el: 'Ποιος περιμένει στις συνδέσεις μου;' },
  get_programs: { en: 'Which programmes are taking applications?', el: 'Ποια προγράμματα δέχονται αιτήσεις;' },
  get_my_programs: { en: 'Where do my programme applications stand?', el: 'Πού βρίσκονται οι αιτήσεις μου σε προγράμματα;' },
  get_invites: { en: 'Who have I invited, and did they join?', el: 'Ποιους έχω προσκαλέσει και εγγράφηκαν;' },
  get_reputation: { en: 'What level am I, and which badges do I have?', el: 'Σε ποιο επίπεδο είμαι και ποια εμβλήματα έχω;' },
  get_readiness: { en: 'What is my readiness score?', el: 'Ποια είναι η ετοιμότητά μου;' },
  get_analytics: { en: 'How many profile views did I get?', el: 'Πόσες προβολές είχε το προφίλ μου;' },
  get_mentors: { en: 'Which mentors are available?', el: 'Ποιοι μέντορες είναι διαθέσιμοι;' },
  get_mentor_requests: { en: 'Any mentoring requests waiting?', el: 'Έχω αιτήματα καθοδήγησης σε αναμονή;' },
  get_bookings: { en: 'What bookings do I have coming up?', el: 'Ποιες κρατήσεις έχω;' },
  get_availability: { en: 'What are my weekly hours?', el: 'Ποιες είναι οι εβδομαδιαίες ώρες μου;' },
  get_services: { en: 'Show my service offers', el: 'Δείξε τις υπηρεσίες μου' },
  get_inquiries: { en: 'Any new inquiries?', el: 'Έχω νέα αιτήματα πελατών;' },
  get_learning: { en: 'Suggest a course to learn from', el: 'Πρότεινε ένα μάθημα' },
  get_expert_reviews: { en: 'Where are my expert reviews?', el: 'Πού βρίσκονται οι αξιολογήσεις ειδικών μου;' },
  get_org_cohorts: { en: 'Which cohorts are running?', el: 'Ποιοι κύκλοι τρέχουν;' },
  get_org_members: { en: 'Who are the newest organisation members?', el: 'Ποια είναι τα νεότερα μέλη του οργανισμού;' },
  get_platform_stats: { en: 'How many users does the platform have?', el: 'Πόσοι χρήστες έχει η πλατφόρμα;' },
  get_moderation_queue: { en: 'What is in the moderation queue?', el: 'Τι υπάρχει στην ουρά ελέγχου;' },
  get_usage_insights: { en: 'How can I work faster here?', el: 'Πώς μπορώ να δουλεύω πιο γρήγορα εδώ;' },
  navigate: { en: 'Open matches', el: 'Άνοιξε τις αντιστοιχίσεις' },
  open_rail_section: { en: 'Show me the filters on this page', el: 'Δείξε μου τα φίλτρα αυτής της σελίδας' },
  use_page_control: { en: 'Show only suspended users', el: 'Δείξε μόνο τους χρήστες σε αναστολή' },
  run_page_command: { en: 'Suspend Spyros Karras', el: 'Θέσε σε αναστολή τον Σπύρο Κάρρα' },
  shortlist_add: { en: 'Save Elena to my shortlist', el: 'Αποθήκευσε την Elena στη λίστα' },
  shortlist_remove: { en: 'Remove Elena from my shortlist', el: 'Βγάλε την Elena από τη λίστα' },
  send_connection: { en: 'Connect with Elena', el: 'Στείλε αίτημα σύνδεσης στην Elena' },
  start_or_send_message: { en: 'Message Elena', el: 'Στείλε μήνυμα στην Elena' },
  readiness_tick_criterion: { en: 'Tick the team readiness criterion', el: 'Σημείωσε το κριτήριο ομάδας' },
  analytics_set_period: { en: 'Show my analytics for the last 30 days', el: 'Δείξε τα αναλυτικά του τελευταίου μήνα' },
  workspace_create: { en: 'Create a workspace called Helios', el: 'Δημιούργησε χώρο εργασίας «Ήλιος»' },
  investor_track_startup: { en: 'Track NeuralFlow on my board', el: 'Παρακολούθησε τη NeuralFlow στον πίνακά μου' },
  investor_move_stage: { en: 'Move PayStream to due diligence', el: 'Μετέφερε το PayStream σε δέουσα επιμέλεια' },
  update_profile: { en: 'Change my headline to Founder & CEO', el: 'Άλλαξε τον τίτλο μου σε Founder & CEO' },
  respond_to_connection: { en: 'Accept Nikos’ connection request', el: 'Αποδέξου το αίτημα σύνδεσης του Νίκου' },
  create_milestone: { en: 'Add a milestone: close the pre-seed round by June', el: 'Πρόσθεσε ορόσημο: κλείσιμο pre-seed γύρου ως τον Ιούνιο' },
  update_milestone_status: { en: 'Mark the pitch deck milestone as done', el: 'Ολοκλήρωσε το ορόσημο του pitch deck' },
  rsvp_event: { en: 'RSVP me as going to the demo day', el: 'Δήλωσέ με συμμετέχοντα στο demo day' },
  create_event: { en: 'Create a networking event next month', el: 'Δημιούργησε εκδήλωση networking τον επόμενο μήνα' },
  canvas_command: { en: 'Add a note on the canvas titled Pricing', el: 'Πρόσθεσε σημείωση στον καμβά «Τιμή»' },
  pin_shortcut: { en: 'Pin Messages to my pages', el: 'Καρφίτσωσε τα Μηνύματα στις σελίδες μου' },
  unpin_shortcut: { en: 'Unpin Messages', el: 'Ξεκαρφίτσωσε τα Μηνύματα' },
  join_group: { en: 'Join the Athens Founders group', el: 'Γράψε με στην κοινότητα Athens Founders' },
  leave_group: { en: 'Leave the Climate Builders group', el: 'Βγάλε με από την κοινότητα Climate Builders' },
  apply_to_program: { en: 'Apply to the Pre-seed Bootcamp', el: 'Κάνε αίτηση στο πρόγραμμα Pre-seed Bootcamp' },
  send_invite: { en: 'Invite maria@example.com to CoFounderBay', el: 'Προσκάλεσε τη maria@example.com στο CoFounderBay' },
  write_endorsement: { en: 'Endorse Elena for product strategy', el: 'Γράψε σύσταση για την Elena στη στρατηγική προϊόντος' },
  respond_to_mentor_request: { en: 'Accept Sofia’s mentoring request', el: 'Αποδέξου το αίτημα καθοδήγησης της Σοφίας' },
  draft_milestone: { en: 'Draft a milestone “Close the pre-seed round”', el: 'Ετοίμασε ορόσημο «Κλείσιμο pre-seed γύρου»' },
  draft_event: { en: 'Draft an event “Founder breakfast”', el: 'Ετοίμασε εκδήλωση «Πρωινό ιδρυτών»' },
  draft_project: { en: 'Draft a project “Helios”', el: 'Ετοίμασε project «Ήλιος»' },
  draft_profile: { en: 'Draft my headline “Founder at Harbor”', el: 'Ετοίμασε τον τίτλο μου «Founder at Harbor»' },
  draft_need_card: { en: 'Write a need card “Technical co-founder for Harbor”', el: 'Φτιάξε κάρτα ανάγκης «Τεχνικός συνιδρυτής για το Harbor»' },
  express_interest: { en: 'Send interest in Christina’s head-of-growth card', el: 'Στείλε ενδιαφέρον στην κάρτα της Χριστίνας για head of growth' },
  follow_person: { en: 'Follow Elena’s updates', el: 'Ακολούθησε τις ενημερώσεις της Έλενας' },
  request_intro: { en: 'Ask Dr. Kim to introduce me to Nikos for my Athens card', el: 'Ζήτα από την Dr. Kim να με συστήσει στον Νίκο για την κάρτα μου' },
  run_scout: { en: 'Run my co-founder scout', el: 'Τρέξε τον ανιχνευτή συνιδρυτών' },
  draft_scout_brief: { en: 'Draft a scout brief for a technical co-founder in Athens', el: 'Ετοίμασε σημείωμα ανιχνευτή για τεχνικό συνιδρυτή στην Αθήνα' },
  draft_mentor_listing: { en: 'Draft my mentor listing “Go-to-market mentor for seed founders”', el: 'Συμπλήρωσε την καταχώριση μέντορα «Μέντορας go-to-market για ιδρυτές seed»' },
  draft_provider_listing: { en: 'Prepare my provider listing “Seed-stage legal for SaaS startups”', el: 'Ετοίμασε το προφίλ παρόχου «Νομική υποστήριξη για startups σε seed»' },
  link_skill_evidence: { en: 'Link my Market Analysis to my Growth skill', el: 'Σύνδεσε την Ανάλυση Αγοράς με τη δεξιότητα Growth' },
  set_open_to: { en: 'Mark me open to advising, visible to verified members', el: 'Δήλωσε ότι είμαι ανοιχτός σε συμβουλευτικό ρόλο, ορατό σε επαληθευμένους' },
  draft_founder_update: { en: 'Draft a founder update “September: twelve interviews”', el: 'Ετοίμασε ενημέρωση ιδρυτή «Σεπτέμβριος: δώδεκα συνεντεύξεις»' },
  close_need_card: { en: 'Close my Athens intros card as filled', el: 'Κλείσε την κάρτα για τις γνωριμίες στην Αθήνα ως καλυμμένη' },
};

function reversalLabel(spec: ActionDeclaration): { en: string; el: string } | null {
  const kind = spec.reversal?.kind;
  if (!kind || spec.kind === 'read') return null;
  if (kind === 'full') return { en: 'Fully reversible', el: 'Πλήρως αναστρέψιμο' };
  if (kind === 'partial') return { en: 'Partly reversible', el: 'Μερικώς αναστρέψιμο' };
  return { en: 'Cannot be undone', el: 'Δεν αναιρείται' };
}

function CapabilityCard({ spec }: { spec: ActionDeclaration }) {
  const sample = SAMPLE_ASK[spec.id];
  // The example opens the assistant in the reader's language; it always
  // sent the English sentence, under a Greek "Δοκίμασε: «…»".
  const { hrefFor } = useAskAssistant();
  const reversal = reversalLabel(spec);
  const writes = spec.writes;

  // One state at the head's right (whether it writes); how far it can be
  // taken back is the caption under the title, and the explanation of it
  // sits with the description on the card's left edge.
  return (
    <Card>
      <CardContent className="space-y-3">
        <CardHead
          title={<BilingualText en={spec.label.en} el={spec.label.el} compact wrap />}
          meta={reversal ? <BilingualText en={reversal.en} el={reversal.el} compact wrap /> : undefined}
          aside={writes ? (
            <Badge variant="outline" className="border-status-warning-border/60 bg-status-warning-bg text-status-warning">
              <BilingualText en="Writes" el="Γράφει" compact />
            </Badge>
          ) : (
            <Badge variant="secondary">
              <BilingualText en="Looks up" el="Αναζητά" compact />
            </Badge>
          )}
        />
        <p className="card-body text-muted-foreground">
          <BilingualText en={spec.description.en} el={spec.description.el} wrap />
        </p>
        {spec.reversal && spec.kind === 'mutation' && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            <BilingualText en={spec.reversal.explanation.en} el={spec.reversal.explanation.el} wrap />
          </p>
        )}
        {sample && (
          <Button asChild variant="ghost" size="sm" className={`h-auto min-h-11 w-fit justify-start px-0 py-1.5 text-xs lg:px-0 hover:bg-transparent hover:underline ${BUILDER_BTN}`}>
            <Link href={hrefFor(sample)}>
              <BilingualText en={`Try: “${sample.en}”`} el={`Δοκίμασε: «${sample.el}»`} compact wrap />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Everything a reader might type to find a capability, in both languages. */
function haystack(spec: ActionDeclaration): string {
  const sample = SAMPLE_ASK[spec.id];
  return [spec.label.en, spec.label.el, spec.description.en, spec.description.el, sample?.en, sample?.el]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
}

export default function AICapabilitiesPage() {
  const sayOne = useBilingualString();
  const capabilities = useMemo(() => listDeclarations(), []);
  /*
   * Close to a hundred cards on one page (9.093px) with no way to find one:
   * the field narrows both lists by name, description or sample ask
   * (docs §91).
   */
  const [query, setQuery] = useState('');
  const q = query.trim().toLocaleLowerCase();
  const shown = q ? capabilities.filter((spec) => haystack(spec).includes(q)) : capabilities;
  const reads = shown.filter((spec) => spec.kind === 'read');
  const mutations = shown.filter((spec) => spec.kind === 'mutation');

  return (
    <AppShell>
      <div className="max-w-[84rem]">
        {/* "Back to the assistant" went to /ai, as "Open assistant" beside
            the intro does (docs §91). */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            <BilingualText
              en="Every capability below is declared once, offered to the model, and confirmed by you before anything is written. This page is generated from that contract, so it cannot fall behind."
              el="Κάθε δυνατότητα δηλώνεται μία φορά, προσφέρεται στο μοντέλο και επιβεβαιώνεται από εσάς πριν γραφτεί οτιδήποτε. Η σελίδα παράγεται από αυτό το συμβόλαιο, οπότε δεν μπορεί να μείνει πίσω."
              wrap
            />
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className={`gap-2 ${BUILDER_BTN}`}>
              <Link href="/ai">
                <CfbGlyph name="spark" className="icon-sm" />
                <BilingualText en="Open assistant" el="Άνοιγμα βοηθού" compact />
              </Link>
            </Button>
            <Button asChild variant="ghost" className={BUILDER_BTN}>
              <Link href="/settings/ai">
                <BilingualText en="AI preferences" el="Προτιμήσεις AI" compact />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-3 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={bilingualInline('Search what the assistant can do', 'Αναζήτηση στις δυνατότητες του βοηθού')}
            placeholder={sayOne('Search what the assistant can do…', 'Αναζήτηση στις δυνατότητες του βοηθού…')}
            className="pl-9"
          />
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {q ? <BilingualText en={`${shown.length} capabilities match`} el={`${shown.length} δυνατότητες ταιριάζουν`} compact /> : null}
        </p>

        {q && shown.length === 0 ? (
          <div className="mb-10 space-y-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            <p>
              <BilingualText
                en={`Nothing matches “${query.trim()}”. Ask the assistant in your own words: it may still do it through the page you are on.`}
                el={`Τίποτα δεν ταιριάζει με «${query.trim()}». Ρωτήστε τον βοηθό με δικά σας λόγια: μπορεί να το κάνει μέσα από τη σελίδα όπου βρίσκεστε.`}
                wrap
              />
            </p>
            <Button size="sm" variant="outline" onClick={() => setQuery('')}>
              <BilingualText en="Clear the search" el="Καθαρισμός αναζήτησης" compact />
            </Button>
          </div>
        ) : null}

        {reads.length > 0 ? (
        <section className="mb-10">
          <h2 className="page-section mb-1 font-semibold">
            <BilingualText en="Looks something up" el="Αναζητά κάτι" compact />
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            <BilingualText
              en={`${reads.length} reads — answers a question from the same APIs the pages use.`}
              el={`${reads.length} αναγνώσεις — απαντούν με τα ίδια API που χρησιμοποιούν οι σελίδες.`}
              wrap
            />
          </p>
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reads.map((spec) => (
              <CapabilityCard key={spec.id} spec={spec} />
            ))}
          </div>
        </section>
        ) : null}

        {mutations.length > 0 ? (
        <section>
          <h2 className="page-section mb-1 font-semibold">
            <BilingualText en="Changes something you own" el="Αλλάζει κάτι δικό σας" compact />
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            <BilingualText
              en={`${mutations.length} actions — each waits for your confirm. Reversible ones offer Undo after they run.`}
              el={`${mutations.length} ενέργειες — η καθεμία περιμένει επιβεβαίωση. Οι αναστρέψιμες προσφέρουν Αναίρεση αφού εκτελεστούν.`}
              wrap
            />
          </p>
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mutations.map((spec) => (
              <CapabilityCard key={spec.id} spec={spec} />
            ))}
          </div>
        </section>
        ) : null}
      </div>
    </AppShell>
  );
}
