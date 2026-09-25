'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { listDeclarations, type ActionDeclaration } from '@cofounderbay/shared';
import { AppShell } from '@/components/layout/AppShell';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  get_endorsements: { en: 'Do I have endorsements waiting?', el: 'Έχω προσυπογραφές σε αναμονή;' },
  get_opportunities: { en: 'Show me open opportunities', el: 'Δείξε μου ανοιχτές ευκαιρίες' },
  get_mentorship_sessions: { en: 'When is my next mentoring session?', el: 'Πότε είναι η επόμενη συνεδρία mentoring;' },
  get_shortlist: { en: 'Who is on my shortlist?', el: 'Ποιος είναι στη λίστα μου;' },
  get_research_boards: { en: 'Show my research boards', el: 'Δείξε τους πίνακες έρευνας' },
  get_investor_board: { en: 'What is on my deal board?', el: 'Τι έχω στον πίνακα επενδύσεων;' },
  get_builder_state: { en: 'Show my Startup Builder workspaces', el: 'Δείξε τους χώρους Startup Builder' },
  get_profile: { en: 'Show my profile', el: 'Δείξε το προφίλ μου' },
  get_messages: { en: 'Any unread messages?', el: 'Έχω αδιάβαστα μηνύματα;' },
  get_connections: { en: 'Who is waiting on my connections?', el: 'Ποιος περιμένει στις συνδέσεις μου;' },
  navigate: { en: 'Open matches', el: 'Άνοιξε τις αντιστοιχίσεις' },
  open_rail_section: { en: 'Show me the filters on this page', el: 'Δείξε μου τα φίλτρα αυτής της σελίδας' },
  use_page_control: { en: 'Show only suspended users', el: 'Δείξε μόνο τους χρήστες σε αναστολή' },
  run_page_command: { en: 'Suspend Spyros Karras', el: 'Θέσε σε αναστολή τον Σπύρο Κάρρα' },
  shortlist_add: { en: 'Save Elena to my shortlist', el: 'Αποθήκευσε την Elena στη λίστα' },
  shortlist_remove: { en: 'Remove Elena from my shortlist', el: 'Βγάλε την Elena από τη λίστα' },
  send_connection: { en: 'Connect with Elena', el: 'Σύνδεση με την Elena' },
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
  const reversal = reversalLabel(spec);
  const writes = spec.writes;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">
          <BilingualText en={spec.label.en} el={spec.label.el} compact wrap />
        </h3>
        <div className="flex flex-wrap gap-1">
          {writes ? (
            <Badge variant="outline" className="border-status-warning-border/60 bg-status-warning-bg text-status-warning">
              <BilingualText en="Writes" el="Γράφει" compact />
            </Badge>
          ) : (
            <Badge variant="secondary">
              <BilingualText en="Looks up" el="Αναζητά" compact />
            </Badge>
          )}
          {reversal && (
            <Badge variant="outline">
              <BilingualText en={reversal.en} el={reversal.el} compact />
            </Badge>
          )}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        <BilingualText en={spec.description.en} el={spec.description.el} wrap />
      </p>
      {spec.reversal && spec.kind === 'mutation' && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <BilingualText en={spec.reversal.explanation.en} el={spec.reversal.explanation.el} wrap />
        </p>
      )}
      {sample && (
        <Button asChild variant="ghost" size="sm" className="h-auto min-h-11 w-fit justify-start px-2 py-1.5 text-xs">
          <Link href={`/ai?q=${encodeURIComponent(sample.en)}`}>
            <BilingualText en={`Try: “${sample.en}”`} el={`Δοκίμασε: «${sample.el}»`} compact wrap />
          </Link>
        </Button>
      )}
    </article>
  );
}

export default function AICapabilitiesPage() {
  const capabilities = listDeclarations();
  const reads = capabilities.filter((spec) => spec.kind === 'read');
  const mutations = capabilities.filter((spec) => spec.kind === 'mutation');

  return (
    <AppShell>
      <div className="max-w-[84rem]">
        <Link
          href="/ai"
          className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="icon-sm" />
          <BilingualText en="Back to the assistant" el="Πίσω στον βοηθό" compact />
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            <BilingualText
              en="Every capability below is declared once, offered to the model, and confirmed by you before anything is written. This page is generated from that contract, so it cannot fall behind."
              el="Κάθε δυνατότητα δηλώνεται μία φορά, προσφέρεται στο μοντέλο και επιβεβαιώνεται από εσάς πριν γραφτεί οτιδήποτε. Η σελίδα παράγεται από αυτό το συμβόλαιο, οπότε δεν μπορεί να μείνει πίσω."
              wrap
            />
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/ai">
                <Sparkles className="h-4 w-4" />
                <BilingualText en="Open assistant" el="Άνοιγμα βοηθού" compact />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/settings/ai">
                <BilingualText en="AI preferences" el="Προτιμήσεις AI" compact />
              </Link>
            </Button>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-1 text-base font-semibold">
            <BilingualText en="Looks something up" el="Αναζητά κάτι" compact />
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            <BilingualText
              en={`${reads.length} reads — answers a question from the same APIs the pages use.`}
              el={`${reads.length} αναγνώσεις — απαντούν με τα ίδια API που χρησιμοποιούν οι σελίδες.`}
              wrap
            />
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reads.map((spec) => (
              <CapabilityCard key={spec.id} spec={spec} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-base font-semibold">
            <BilingualText en="Changes something you own" el="Αλλάζει κάτι δικό σας" compact />
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            <BilingualText
              en={`${mutations.length} actions — each waits for your confirm. Reversible ones offer Undo after they run.`}
              el={`${mutations.length} ενέργειες — η καθεμία περιμένει επιβεβαίωση. Οι αναστρέψιμες προσφέρουν Αναίρεση αφού εκτελεστούν.`}
              wrap
            />
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mutations.map((spec) => (
              <CapabilityCard key={spec.id} spec={spec} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
