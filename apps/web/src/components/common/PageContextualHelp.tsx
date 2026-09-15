'use client';

import type { ReactNode } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { HelpCallout } from '@/components/common/HelpCallout';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';

type PageContextualHelpProps = {
  /** Override registry help id */
  id?: string;
  title?: string;
  titleEl?: string;
  children?: ReactNode;
  defaultOpen?: boolean;
  compact?: boolean;
};

type HelpCopy = { en: ReactNode; el: ReactNode };

/**
 * Curated copy per page — concrete, actionable, no marketing fluff.
 * Falls back to the page description when no curated copy exists.
 *
 * Each entry carries both languages and the reader gets whichever is their
 * primary. Unlike a label, prose cannot be shown as `English · Ελληνικά` on one
 * line — two paragraphs paired inline read as a single run-on, so the choice is
 * made here rather than by `BilingualText`.
 */
const HELP_CONTENT: Record<string, HelpCopy> = {
  builder: {
    en: (
      <>
        <p>
          The Builder turns scattered notes into investor-ready artefacts. Move through the stage tabs:{' '}
          <strong>Idea Core → Market → Business Model → MVP → Financials → Pitch</strong>. Progress unlocks Pitch Deck
          and Applications. Invite collaborators and keep Version History for rollbacks.
        </p>
        <p>
          Use <em>New Document</em> for artefacts, or <em>Ask AI</em> to draft a section and suggest what to complete next.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Ο Builder μετατρέπει διάσπαρτες σημειώσεις σε υλικό για επενδυτές. Προχωρήστε στις καρτέλες:{' '}
          <strong>Πυρήνας ιδέας → Αγορά → Επιχειρηματικό μοντέλο → MVP → Οικονομικά → Pitch</strong>. Η πρόοδος
          ξεκλειδώνει Pitch Deck και Αιτήσεις. Προσκαλέστε συνεργάτες και κρατήστε Ιστορικό εκδόσεων για επαναφορά.
        </p>
        <p>
          Με το <em>Νέο έγγραφο</em> προσθέτετε παραδοτέα, ή <em>Ρωτήστε το AI</em> για προσχέδιο ενότητας και τι να
          ολοκληρώσετε μετά.
        </p>
      </>
    ),
  },
  'pitch-deck': {
    en: (
      <>
        <p>
          This page edits the same <strong>pitch_deck</strong> artefact as the Pitch tab in Startup Builder. Completion is
          the share of slides that have body text — adding empty templates does not raise the bar.
        </p>
        <p>
          Use <em>AI Generate</em> for a full outline, or <em>Ask AI</em> to draft the current slide from Idea Core, Market,
          and Financials. <em>Export</em> downloads Markdown. Save writes back to the workspace.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Αυτή η σελίδα επεξεργάζεται το ίδιο παραδοτέο <strong>pitch_deck</strong> με την καρτέλα Pitch στον Startup Builder.
          Η ολοκλήρωση είναι το μερίδιο διαφανειών με κείμενο — τα κενά πρότυπα δεν ανεβάζουν τη μπάρα.
        </p>
        <p>
          Με <em>Δημιουργία AI</em> παίρνετε πλήρες περίγραμμα, ή <em>Ρωτήστε το AI</em> για προσχέδιο της τρέχουσας
          διαφάνειας από Ιδέα, Αγορά και Οικονομικά. Η <em>Εξαγωγή</em> κατεβάζει Markdown. Η αποθήκευση γράφει στον χώρο εργασίας.
        </p>
      </>
    ),
  },
  applications: {
    en: (
      <>
        <p>
          This page edits the same <strong>application</strong> artefact as the Applications tab in Startup Builder. Four
          templates stay on the page — Y Combinator, Techstars, university incubator, and grants. Completion is the share
          of <em>required</em> answers filled; optional questions do not hold the bar.
        </p>
        <p>
          Use <em>AI Generate</em> to fill the open program with a draft, or <em>Ask AI</em> to write from Idea Core,
          Market, and Pitch. Save writes the workspace. <em>Mark submitted</em> appears when every required field is
          filled. View Program opens the real application page.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Αυτή η σελίδα επεξεργάζεται το ίδιο παραδοτέο <strong>application</strong> με την καρτέλα Αιτήσεις στον Startup
          Builder. Τα τέσσερα πρότυπα μένουν στη σελίδα — Y Combinator, Techstars, πανεπιστημιακό incubator και
          επιχορηγήσεις. Η ολοκλήρωση είναι το μερίδιο <em>υποχρεωτικών</em> απαντήσεων· οι προαιρετικές δεν κρατούν τη μπάρα.
        </p>
        <p>
          Με <em>Δημιουργία AI</em> γεμίζετε το ανοιχτό πρόγραμμα, ή με <em>Ρωτήστε το AI</em> συντάσσετε από Ιδέα, Αγορά
          και Pitch. Η αποθήκευση γράφει στον χώρο εργασίας. Η <em>Σήμανση υποβολής</em> εμφανίζεται όταν όλα τα υποχρεωτικά
          πεδία έχουν απάντηση. Το «Προβολή προγράμματος» ανοίγει την πραγματική αίτηση.
        </p>
      </>
    ),
  },
  research: {
    en: (
      <>
        <p>
          Each board is a canvas of notes, files, and links. <em>Use template</em> seeds a common workflow
          (validation, market, pitch). <em>New board</em> starts blank. Pin keeps a board at the top.
        </p>
        <p>
          Open a board to add nodes, upload files, and connect ideas. Use <em>Ask AI</em> to propose a board
          structure from Builder artefacts, or to summarise what is already on the canvas.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Κάθε πίνακας είναι καμβάς σημειώσεων, αρχείων και συνδέσμων. Το <em>Χρήση προτύπου</em> γεμίζει μια
          συνηθισμένη ροή (επικύρωση, αγορά, pitch). Το <em>Νέος πίνακας</em> ξεκινά κενός. Το καρφίτσωμα κρατά
          τον πίνακα στην κορυφή.
        </p>
        <p>
          Ανοίξτε έναν πίνακα για κόμβους, αρχεία και συνδέσεις. Με το <em>Ρωτήστε το AI</em> προτείνετε δομή από
          τα παραδοτέα του Builder, ή σύνοψη όσων υπάρχουν ήδη στον καμβά.
        </p>
      </>
    ),
  },
  readiness: {
    en: (
      <>
        <p>
          Your score combines 6 dimensions: <strong>Team, Market, Product, Business Model, Funding, Execution</strong>.
          Accelerator and investor views weight those dimensions differently — team and market count more for investors.
        </p>
        <p>
          Tick criteria on a dimension card to update the saved score. Use <em>Reassess</em> after a major change, or{' '}
          <em>Ask AI</em> for a plan on the weakest area.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Η βαθμολογία συνδυάζει 6 διαστάσεις: <strong>Ομάδα, Αγορά, Προϊόν, Επιχειρηματικό μοντέλο, Χρηματοδότηση, Εκτέλεση</strong>.
          Οι όψεις επιταχυντή και επενδυτή τις ζυγίζουν διαφορετικά — ομάδα και αγορά μετράνε περισσότερο για επενδυτές.
        </p>
        <p>
          Τσεκάρετε κριτήρια σε μια κάρτα διάστασης για ενημέρωση της αποθηκευμένης βαθμολογίας. Μετά από σημαντική αλλαγή
          πατήστε <em>Επαναξιολόγηση</em>, ή <em>Ρωτήστε το AI</em> για πλάνο στο ασθενέστερο σημείο.
        </p>
      </>
    ),
  },
  analytics: {
    en: (
      <>
        <p>
          Numbers here are <strong>recorded counts</strong> for the selected period. A dash means the metric was not
          measured — it is not zero. Trends compare this period with the previous one of the same length.
        </p>
        <p>
          Use <em>Overview</em> for the funnel, <em>Engagement</em> for type breakdown, and <em>Growth</em> for view
          trends. <em>Ask AI</em> can explain a drop or suggest the next action.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι αριθμοί είναι <strong>καταγεγραμμένα πλήθη</strong> για την επιλεγμένη περίοδο. Η παύλα σημαίνει ότι η
          μέτρηση δεν έγινε — όχι μηδέν. Οι τάσεις συγκρίνουν αυτή την περίοδο με την προηγούμενη ίδιου μήκους.
        </p>
        <p>
          Η <em>Επισκόπηση</em> δείχνει το χωνί, η <em>Αφοσίωση</em> την ανάλυση ανά τύπο και η <em>Ανάπτυξη</em> την
          τάση προβολών. Το <em>Ρωτήστε το AI</em> εξηγεί μια πτώση ή προτείνει το επόμενο βήμα.
        </p>
      </>
    ),
  },
  discover: {
    en: (
      <>
        <p>
          Use Discover to <strong>browse</strong> with filters; use <a href="/matches">Matches</a> to see{' '}
          <strong>ranked</strong> suggestions. Combine role + skills + location to find specific profiles.
        </p>
        <p>
          Bookmark interesting people to <a href="/shortlist">Saved</a> and send a Connect request when ready.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Η Εξερεύνηση είναι για <strong>περιήγηση</strong> με φίλτρα· οι <a href="/matches">Αντιστοιχίσεις</a>{' '}
          δίνουν <strong>καταταγμένες</strong> προτάσεις. Συνδυάστε ρόλο, δεξιότητες και τοποθεσία για πιο
          στοχευμένα προφίλ.
        </p>
        <p>
          Αποθηκεύστε όσους σας ενδιαφέρουν στα <a href="/shortlist">Αποθηκευμένα</a> και στείλτε αίτημα σύνδεσης
          όταν είστε έτοιμοι.
        </p>
      </>
    ),
  },
  fundraising: {
    en: (
      <>
        <p>
          The summary counts the <strong>full pipeline</strong>. Committed contacts are the investor count on the round
          card — they cannot disagree. Move a card in Kanban or the pipeline list; both tabs share the same contacts.
        </p>
        <p>
          Use <em>Ask AI</em> for who to contact next from Builder, Pitch deck, and Data Room gaps. The{' '}
          <strong>Data Room</strong> tab holds documents shared via tokenised links — nothing is public unless you share it.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι στήλες Kanban είναι τα στάδια:{' '}
          <strong>Υποψήφιος → Επικοινωνία → Συνάντηση → Έλεγχος → Δεσμευμένος → Απόρριψη</strong>. Η σύνοψη μετρά ολόκληρο
          τον αγωγό· οι δεσμευμένοι είναι ο αριθμός επενδυτών στην κάρτα γύρου — δεν μπορεί να διαφωνούν.
        </p>
        <p>
          Με <em>Ρωτήστε το AI</em> δείτε ποιον να προσεγγίσετε μετά από Builder, pitch deck και κενά του Data Room. Η
          καρτέλα <strong>Data Room</strong> κρατά έγγραφα με συνδέσμους token — τίποτα δεν είναι δημόσιο αν δεν το
          μοιραστείτε.
        </p>
      </>
    ),
  },
  matches: {
    en: (
      <>
        <p>
          Match score is computed from{' '}
          <strong>role complementarity, skill overlap, stage alignment, commitment, and location</strong>. Higher scores
          are stronger fits, but always read the &ldquo;Why you match&rdquo; reasons before reaching out.
        </p>
        <p>
          Click the chart icon on a card to see the compatibility breakdown, or open Compare to put two profiles side by side.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Η βαθμολογία αντιστοίχισης προκύπτει από{' '}
          <strong>συμπληρωματικότητα ρόλων, επικάλυψη δεξιοτήτων, ευθυγράμμιση σταδίου, διαθεσιμότητα και
          τοποθεσία</strong>. Η υψηλότερη βαθμολογία σημαίνει ισχυρότερο ταίριασμα, αλλά διαβάζετε πάντα τους λόγους
          στο «Γιατί ταιριάζετε» πριν επικοινωνήσετε.
        </p>
        <p>
          Πατήστε το εικονίδιο γραφήματος σε μια κάρτα για την ανάλυση συμβατότητας, ή ανοίξτε τη Σύγκριση για να
          δείτε δύο προφίλ δίπλα-δίπλα.
        </p>
      </>
    ),
  },
  connections: {
    en: (
      <>
        <p>
          <strong>Pending</strong> shows requests waiting for your response. <strong>Active</strong> is your network —
          message, schedule a call, or remove from the menu.
        </p>
        <p>
          Saved profiles you have not yet contacted live in <a href="/shortlist">Saved profiles</a>.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Στα <strong>Εκκρεμή</strong> βρίσκονται τα αιτήματα που περιμένουν απάντησή σας. Τα <strong>Ενεργά</strong>{' '}
          είναι το δίκτυό σας — στείλτε μήνυμα, κλείστε κλήση ή αφαιρέστε τα από το μενού.
        </p>
        <p>
          Τα προφίλ που αποθηκεύσατε χωρίς να επικοινωνήσετε ακόμη βρίσκονται στα{' '}
          <a href="/shortlist">Αποθηκευμένα προφίλ</a>.
        </p>
      </>
    ),
  },
  messages: {
    en: (
      <>
        <p>
          <strong>Chats</strong> are open conversations with people you are already connected to.{' '}
          <strong>Intro requests</strong> are first messages from someone outside your network — accepting one
          starts a chat, declining it does not notify them.
        </p>
        <p>
          Nobody can message you directly until you connect or accept their intro, so an empty Chats tab usually
          means there are requests waiting next door.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι <strong>Συνομιλίες</strong> είναι ανοιχτές συζητήσεις με άτομα με τα οποία είστε ήδη συνδεδεμένοι. Τα{' '}
          <strong>Αιτήματα γνωριμίας</strong> είναι πρώτα μηνύματα από άτομα εκτός του δικτύου σας — αν δεχτείτε
          ένα, ξεκινά συνομιλία· αν το απορρίψετε, δεν ειδοποιείται ο αποστολέας.
        </p>
        <p>
          Κανείς δεν μπορεί να σας γράψει απευθείας πριν συνδεθείτε ή δεχτείτε τη γνωριμία, οπότε μια άδεια καρτέλα
          Συνομιλιών συνήθως σημαίνει ότι σας περιμένουν αιτήματα στη διπλανή καρτέλα.
        </p>
      </>
    ),
  },
  settings: {
    en: (
      <>
        <p>
          Update notification frequency, manage billing and integrations, and control profile visibility. Changes save
          instantly.
        </p>
        <p>
          For privacy-sensitive actions (export data, delete account), see{' '}
          <a href="/settings/data-export">Data export</a>.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Ρυθμίστε τη συχνότητα ειδοποιήσεων, διαχειριστείτε χρεώσεις και ενσωματώσεις, και ελέγξτε την ορατότητα του
          προφίλ σας. Οι αλλαγές αποθηκεύονται άμεσα.
        </p>
        <p>
          Για ενέργειες που αφορούν προσωπικά δεδομένα (εξαγωγή δεδομένων, διαγραφή λογαριασμού) δείτε την{' '}
          <a href="/settings/data-export">Εξαγωγή δεδομένων</a>.
        </p>
      </>
    ),
  },
  'dashboard-founder': {
    en: (
      <>
        <p>
          Your dashboard surfaces the <strong>single next action</strong> most likely to move your startup forward right
          now — backed by your readiness score, recent activity, and platform signals.
        </p>
        <p>The widgets below it are reference cards: matches, recent messages, milestones, and gamified progress.</p>
      </>
    ),
    el: (
      <>
        <p>
          Ο πίνακάς σας αναδεικνύει τη <strong>μία επόμενη ενέργεια</strong> που έχει τις περισσότερες πιθανότητες να
          προωθήσει το startup σας αυτή τη στιγμή — με βάση τη βαθμολογία ετοιμότητας, την πρόσφατη δραστηριότητα και
          τα σήματα της πλατφόρμας.
        </p>
        <p>
          Τα widgets από κάτω είναι κάρτες αναφοράς: αντιστοιχίσεις, πρόσφατα μηνύματα, ορόσημα και πρόοδος.
        </p>
      </>
    ),
  },
  milestones: {
    en: (
      <>
        <p>
          Each row is one goal with an owner and a date. The summary counts the <strong>full tracker</strong>;
          search, category, and status only filter the list below. Completed items feed Readiness and investor updates.
        </p>
        <p>
          Use <em>New milestone</em> or <em>Ask AI</em> to propose the next three from Builder artefacts. Mark complete
          from the card menu — you can reopen if the work is not actually done.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Κάθε γραμμή είναι ένας στόχος με υπεύθυνο και ημερομηνία. Η σύνοψη μετρά τον <strong>ολόκληρο πίνακα</strong>·
          αναζήτηση, κατηγορία και κατάσταση φιλτράρουν μόνο τη λίστα. Τα ολοκληρωμένα τροφοδοτούν Ετοιμότητα και
          ενημερώσεις επενδυτών.
        </p>
        <p>
          Με <em>Νέο ορόσημο</em> ή <em>Ρωτήστε το AI</em> προτείνετε τα επόμενα τρία από τον Builder. Η ολοκλήρωση γίνεται
          από το μενού της κάρτας — μπορείτε να το ξανανοίξετε αν η δουλειά δεν τελείωσε.
        </p>
      </>
    ),
  },
  projects: {
    en: (
      <>
        <p>
          <strong>Discover</strong> is the full catalogue. <em>My projects</em>, <em>Joined</em>, and <em>Starred</em> are
          slices of the same list — the summary counts every project, filters only change what is on screen.
        </p>
        <p>
          Open a card for roles, team, milestones, and updates. Use <em>Ask AI</em> to match open roles to your skills or
          to draft a new project from Builder artefacts. Create still publishes a listing with every field from the
          four-step form.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Η <strong>Ανακάλυψη</strong> είναι ο πλήρης κατάλογος. <em>Τα έργα μου</em>, <em>Συμμετοχές</em> και{' '}
          <em>Αγαπημένα</em> είναι φέτες της ίδιας λίστας — η σύνοψη μετρά όλα τα έργα, τα φίλτρα αλλάζουν μόνο ό,τι φαίνεται.
        </p>
        <p>
          Ανοίξτε κάρτα για ρόλους, ομάδα, ορόσημα και ενημερώσεις. Με <em>Ρωτήστε το AI</em> αντιστοιχίστε ανοιχτούς ρόλους
          στις δεξιότητές σας ή συντάξτε νέο έργο από τον Builder. Η δημιουργία δημοσιεύει καταχώριση με όλα τα πεδία της
          φόρμας τεσσάρων βημάτων.
        </p>
      </>
    ),
  },
  'tenant-branding': {
    en: (
      <>
        <p>
          Branding changes preview live in the right panel and apply to your tenant&rsquo;s public landing and emails.
          Nothing goes live until you click <strong>Publish</strong> — work in draft as long as you need.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι αλλαγές επωνυμίας εμφανίζονται ζωντανά στο δεξί πάνελ και ισχύουν για τη δημόσια σελίδα και τα email του
          tenant σας. Τίποτα δεν δημοσιεύεται μέχρι να πατήσετε <strong>Δημοσίευση</strong> — δουλέψτε σε πρόχειρο όσο
          χρειάζεστε.
        </p>
      </>
    ),
  },
  'admin-overview': {
    en: (
      <>
        <p>
          This is the platform-wide console: pending <strong>reports</strong>, user and cohort management, events
          and job postings, and the role distribution chart. Counts here cover every tenant, not one community.
        </p>
        <p>
          Each card links to the specialised screen — <a href="/admin/user-management">User management</a> for bulk
          actions and filters, <a href="/admin/content-moderation">Content moderation</a> for the report queue, and{' '}
          <a href="/admin/security-monitoring">Security monitoring</a> for auth anomalies.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Αυτή είναι η κονσόλα για όλη την πλατφόρμα: εκκρεμείς <strong>αναφορές</strong>, διαχείριση χρηστών και
          cohorts, εκδηλώσεις και αγγελίες, και το γράφημα κατανομής ρόλων. Οι μετρήσεις αφορούν όλους τους tenants,
          όχι μία κοινότητα.
        </p>
        <p>
          Κάθε κάρτα οδηγεί στην εξειδικευμένη οθόνη — <a href="/admin/user-management">Διαχείριση χρηστών</a> για
          μαζικές ενέργειες και φίλτρα, <a href="/admin/content-moderation">Εποπτεία περιεχομένου</a> για την ουρά
          αναφορών, και <a href="/admin/security-monitoring">Παρακολούθηση ασφάλειας</a> για ανωμαλίες ταυτοποίησης.
        </p>
      </>
    ),
  },
  'admin-user-management': {
    en: (
      <>
        <p>
          Use the <strong>filters</strong> on the left to narrow by role or status. Select rows with checkboxes for{' '}
          <strong>bulk activate, suspend, or delete</strong>. Open a user with the eye icon or row menu — full detail
          lives on the user detail page.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Χρησιμοποιήστε τα <strong>φίλτρα</strong> αριστερά για περιορισμό ανά ρόλο ή κατάσταση. Επιλέξτε γραμμές με
          τα πλαίσια ελέγχου για <strong>μαζική ενεργοποίηση, αναστολή ή διαγραφή</strong>. Ανοίξτε έναν χρήστη με το
          εικονίδιο ματιού ή το μενού της γραμμής — η πλήρης εικόνα βρίσκεται στη σελίδα λεπτομερειών χρήστη.
        </p>
      </>
    ),
  },
  onboarding: {
    en: (
      <>
        <p>
          Each step shapes one part of your match score: <strong>role</strong> decides who appears as a candidate,{' '}
          <strong>skills</strong> drive overlap, <strong>stage</strong> filters out misalignment,{' '}
          <strong>commitment</strong> filters timing, and <strong>location</strong> is a small tie-breaker.
        </p>
        <p>
          You can edit any answer later in <a href="/profile/edit">Edit profile</a>.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Κάθε βήμα διαμορφώνει ένα κομμάτι της βαθμολογίας αντιστοίχισης: ο <strong>ρόλος</strong> καθορίζει ποιοι
          εμφανίζονται ως υποψήφιοι, οι <strong>δεξιότητες</strong> την επικάλυψη, το <strong>στάδιο</strong>{' '}
          αποκλείει ασύμβατες συνεργασίες, η <strong>διαθεσιμότητα</strong> φιλτράρει τον χρόνο, και η{' '}
          <strong>τοποθεσία</strong> λειτουργεί ως μικρό κριτήριο ισοβαθμίας.
        </p>
        <p>
          Μπορείτε να αλλάξετε οποιαδήποτε απάντηση αργότερα στην{' '}
          <a href="/profile/edit">Επεξεργασία προφίλ</a>.
        </p>
      </>
    ),
  },
  'admin-analytics': {
    en: (
      <>
        <p>
          <strong>Active</strong> users logged in during the selected range. Role charts show signup mix — use this to
          balance supply (mentors/investors) vs demand (founders). Tenant count reflects white-label communities.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          <strong>Ενεργοί</strong> είναι όσοι συνδέθηκαν στο επιλεγμένο διάστημα. Τα γραφήματα ρόλων δείχνουν τη
          σύνθεση των εγγραφών — χρησιμεύουν για να ισορροπήσετε την προσφορά (mentors/επενδυτές) με τη ζήτηση
          (ιδρυτές). Ο αριθμός tenants αφορά τις white-label κοινότητες.
        </p>
      </>
    ),
  },
  'admin-content-moderation': {
    en: (
      <>
        <p>
          Open items need a decision: <strong>Resolve</strong> if action was taken (warn/suspend content),{' '}
          <strong>Dismiss</strong> if the report was invalid. Resolved items stay in history for audit.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Τα ανοιχτά στοιχεία χρειάζονται απόφαση: <strong>Επίλυση</strong> αν ελήφθη μέτρο (προειδοποίηση ή αναστολή
          περιεχομένου), <strong>Απόρριψη</strong> αν η αναφορά ήταν αβάσιμη. Τα επιλυμένα παραμένουν στο ιστορικό
          για έλεγχο.
        </p>
      </>
    ),
  },
  'admin-security': {
    en: (
      <>
        <p>
          <strong>Critical</strong> events need immediate review. Failed-login clusters may indicate credential stuffing;
          export spikes may indicate data exfiltration attempts. Cross-check with the audit log for context.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Τα <strong>κρίσιμα</strong> συμβάντα απαιτούν άμεσο έλεγχο. Συστάδες αποτυχημένων συνδέσεων μπορεί να
          υποδεικνύουν credential stuffing· απότομες αυξήσεις εξαγωγών μπορεί να υποδεικνύουν απόπειρα διαρροής
          δεδομένων. Διασταυρώστε με το αρχείο ελέγχου για το πλαίσιο.
        </p>
      </>
    ),
  },
  'admin-mentorship': {
    en: (
      <>
        <p>
          <strong>Pending</strong> mentors need profile and credential review before appearing in{' '}
          <a href="/mentoring">Mentoring</a>. Session count and rating help identify top contributors vs. inactive
          listings.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι <strong>εκκρεμείς</strong> mentors χρειάζονται έλεγχο προφίλ και πιστοποιήσεων πριν εμφανιστούν στο{' '}
          <a href="/mentoring">Mentoring</a>. Το πλήθος συνεδριών και η βαθμολογία δείχνουν ποιοι συνεισφέρουν
          ουσιαστικά και ποιες καταχωρίσεις είναι ανενεργές.
        </p>
      </>
    ),
  },
  'admin-community-management': {
    en: (
      <>
        <p>
          Communities with status <strong>review</strong> were flagged or auto-held for first-time creators. High
          post-to-member ratio indicates healthy engagement; low activity may need admin outreach.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι κοινότητες σε κατάσταση <strong>έλεγχος</strong> έχουν επισημανθεί ή κρατήθηκαν αυτόματα επειδή ο
          δημιουργός τους είναι πρωτοεμφανιζόμενος. Υψηλή αναλογία δημοσιεύσεων ανά μέλος δείχνει υγιή συμμετοχή·
          η χαμηλή δραστηριότητα ίσως χρειάζεται παρέμβαση διαχειριστή.
        </p>
      </>
    ),
  },
  'admin-system-settings': {
    en: (
      <>
        <p>
          <strong>Maintenance mode</strong> shows a banner and blocks new sessions for non-admins.{' '}
          <strong>Registration</strong> toggle pauses new signups without affecting existing users.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Η <strong>λειτουργία συντήρησης</strong> εμφανίζει banner και μπλοκάρει νέες συνεδρίες για μη
          διαχειριστές. Ο διακόπτης <strong>εγγραφών</strong> παύει τις νέες εγγραφές χωρίς να επηρεάζει τους
          υπάρχοντες χρήστες.
        </p>
      </>
    ),
  },
  opportunities: {
    en: (
      <>
        <p>
          Four tabs, one purpose: find work to do with someone. <strong>Co-founder & freelance</strong> is listings from
          the opportunities API. <strong>Jobs</strong> is the same feed as{' '}
          <a href="/jobs">Jobs & roles</a>. <strong>My applications</strong> tracks what you sent;{' '}
          <strong>Proposals</strong> is what others sent you.
        </p>
        <p>
          When a listing has no apply URL, <em>Draft an approach</em> opens the assistant with that listing pre-loaded —
          there is no silent apply endpoint. Sample proposals are labelled as sample.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Τέσσερις καρτέλες, ένας σκοπός: να βρείτε δουλειά μαζί με κάποιον. Το <strong>Συνιδρυτής & freelance</strong>{' '}
          είναι καταχωρίσεις από το API ευκαιριών. Οι <strong>Θέσεις</strong> είναι το ίδιο feed με τις{' '}
          <a href="/jobs">Θέσεις εργασίας</a>. Οι <strong>αιτήσεις μου</strong> είναι όσα στείλατε· οι{' '}
          <strong>Προτάσεις</strong> είναι όσα σας έστειλαν.
        </p>
        <p>
          Όταν μια καταχώριση δεν έχει URL αίτησης, η <em>Σύνταξη προσέγγισης</em> ανοίγει τον βοηθό με την καταχώριση
          προφορτωμένη — δεν υπάρχει σιωπηλό endpoint αίτησης. Οι δείγμα-προτάσεις φέρουν ετικέτα δείγματος.
        </p>
      </>
    ),
  },
  jobs: {
    en: (
      <>
        <p>
          Roles posted by startups on this platform — not a general job board. Filter by function and employment type.
          <em>Post a role</em> writes to the jobs API. Cards only show facts the posting actually has (no invented
          skills or “posted today”).
        </p>
        <p>
          Empty results can <em>Ask AI</em> to draft a cofounder or early-hire post from your profile gaps, or to
          suggest people instead of a job.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Θέσεις που δημοσιεύουν startups σε αυτή την πλατφόρμα — όχι γενικός πίνακας αγγελιών. Φιλτράρετε κατά
          λειτουργία και τύπο απασχόλησης. Η <em>Δημοσίευση θέσης</em> γράφει στο API. Οι κάρτες δείχνουν μόνο όσα έχει
          όντως η αγγελία (χωρίς εφευρεμένες δεξιότητες ή «δημοσιεύτηκε σήμερα»).
        </p>
        <p>
          Τα κενά αποτελέσματα μπορούν να <em>Ρωτήσουν το AI</em> να συντάξει αγγελία συνιδρυτή ή πρώτης πρόσληψης από
          τα κενά του προφίλ σας, ή να προτείνει ανθρώπους αντί για θέση.
        </p>
      </>
    ),
  },
  learning: {
    en: (
      <>
        <p>
          Resources and sequenced <strong>paths</strong> aligned with readiness gaps. Tapping a path filters this page
          to that topic — it does not invent a separate course player. Saved and Completed are local to the cards on
          this screen.
        </p>
        <p>
          Prefer a guided next step? <em>Ask AI</em> which gap in Readiness to study first.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Πόροι και διαδοχικά <strong>μονοπάτια</strong> ευθυγραμμισμένα με τα κενά ετοιμότητας. Το πάτημα ενός
          μονοπατιού φιλτράρει αυτή τη σελίδα στο θέμα του — δεν ανοίγει ξεχωριστό player. Τα Αποθηκευμένα και
          Ολοκληρωμένα είναι τοπικά στις κάρτες εδώ.
        </p>
        <p>
          Θέλετε καθοδηγούμενο επόμενο βήμα; <em>Ρωτήστε το AI</em> ποιο κενό στο Readiness να μελετήσετε πρώτα.
        </p>
      </>
    ),
  },
  feed: {
    en: (
      <>
        <p>
          Network updates from people you follow. When the live feed module has nothing, sample posts appear behind a
          notice — they are for layout, not activity you missed.
        </p>
        <p>
          <em>Ask AI</em> what to do next on Discover, Matches, or Messages instead of waiting on a sample timeline.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Ενημερώσεις δικτύου από όσους ακολουθείτε. Όταν το live module δεν έχει τίποτα, εμφανίζονται δείγματα πίσω
          από ειδοποίηση — είναι για τη διάταξη, όχι δραστηριότητα που χάσατε.
        </p>
        <p>
          <em>Ρωτήστε το AI</em> τι να κάνετε μετά στο Discover, τα Matches ή τα Μηνύματα αντί να περιμένετε σε δείγμα
          χρονολογίου.
        </p>
      </>
    ),
  },
  marketplace: {
    en: (
      <>
        <p>
          Legal, design, growth, and ops providers. When live listings are empty, sample experts appear behind a
          notice so you can learn the layout. <em>List your service</em> goes to the real provider workspace.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Πάροχοι νομικών, σχεδιασμού, growth και operations. Όταν οι live καταχωρίσεις είναι κενές, εμφανίζονται
          δείγματα πίσω από ειδοποίηση ώστε να δείτε τη διάταξη. Η <em>Καταχώριση υπηρεσίας</em> πηγαίνει στον
          πραγματικό χώρο του παρόχου.
        </p>
      </>
    ),
  },
  calendar: {
    en: (
      <>
        <p>
          Sessions, events, and milestone due dates are not one API yet. The grid is a labelled sample so you can
          learn month/list views. <em>Add event</em> opens the real event composer; live dates live on Events and
          Milestones.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Συνεδρίες, εκδηλώσεις και προθεσμίες οροσήμων δεν είναι ακόμη ένα API. Το πλέγμα είναι επισημασμένο δείγμα
          για τις προβολές μήνα/λίστας. Η <em>Προσθήκη εκδήλωσης</em> ανοίγει τον πραγματικό συνθέτη· οι ζωντανές
          ημερομηνίες είναι στις Εκδηλώσεις και τα Ορόσημα.
        </p>
      </>
    ),
  },
  programs: {
    en: (
      <>
        <p>
          Accelerators, incubators, bootcamps, and competitions. <strong>Open</strong> means you can still apply.{' '}
          <strong>My applications</strong> is what you already sent — the same artefact the Builder Applications tab
          writes. Deadlines of 7 days or less are highlighted.
        </p>
        <p>
          Readiness sends you here when the accelerator dimension is high enough to apply. <em>Ask AI</em> which open
          program fits your stage.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Επιταχυντές, θερμοκοιτίδες, bootcamps και διαγωνισμοί. <strong>Ανοιχτά</strong> σημαίνει ότι μπορείτε ακόμη να
          κάνετε αίτηση. Οι <strong>αιτήσεις μου</strong> είναι όσα έχετε ήδη στείλει — το ίδιο παραδοτέο με την καρτέλα
          Αιτήσεις στον Builder. Προθεσμίες έως 7 ημερών επισημαίνονται.
        </p>
        <p>
          Το Readiness σας φέρνει εδώ όταν η διάσταση επιταχυντή είναι αρκετά υψηλή. <em>Ρωτήστε το AI</em> ποιο ανοιχτό
          πρόγραμμα ταιριάζει στο στάδιό σας.
        </p>
      </>
    ),
  },
  groups: {
    en: (
      <>
        <p>
          Industry and stage communities. Join to post; create your own anytime. Public groups are listed here;
          private and secret groups stay off the directory unless you are a member.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Κοινότητες βάσει κλάδου και σταδίου. Συμμετέχετε για να δημοσιεύετε· δημιουργήστε τη δική σας οποτεδήποτε.
          Οι δημόσιες ομάδες εμφανίζονται εδώ· οι ιδιωτικές και μυστικές μένουν εκτός καταλόγου εκτός αν είστε μέλος.
        </p>
      </>
    ),
  },
  'public-pitch': {
    en: (
      <>
        <p>
          This is the investor-facing deck, not the Builder editor. Views are counted. Contact goes to the founder who
          published it — there is no public inbox.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Αυτό είναι το deck προς επενδυτές, όχι ο επεξεργαστής του Builder. Οι προβολές μετρώνται. Η επαφή πηγαίνει
          στον ιδρυτή που το δημοσίευσε — δεν υπάρχει δημόσιο inbox.
        </p>
      </>
    ),
  },
  'data-room': {
    en: (
      <>
        <p>
          Private diligence documents. Share access per investor; nothing here is public. Upload and share stay on
          this room — they do not publish to the feed or to Discover.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Ιδιωτικά έγγραφα diligence. Η πρόσβαση μοιράζεται ανά επενδυτή· τίποτα εδώ δεν είναι δημόσιο. Η μεταφόρτωση
          και ο διαμοιρασμός μένουν σε αυτό το room — δεν δημοσιεύονται στο feed ούτε στο Discover.
        </p>
      </>
    ),
  },
};

/**
 * Renders contextual help from page-registry when helpId/helpTitle exist,
 * or explicit props when provided.
 */
export function PageContextualHelp({ id, title, titleEl, children, defaultOpen, compact }: PageContextualHelpProps) {
  const meta = usePageMeta();
  const { primary } = useLanguagePreference();
  const helpId = id ?? meta?.helpId;
  const helpTitle = title ?? meta?.helpTitle ?? meta?.title;
  const helpTitleEl = titleEl ?? meta?.helpTitleEl ?? meta?.titleEl;

  if (!helpId || !helpTitle) return null;

  const copy = HELP_CONTENT[helpId];
  // Greek falls back to English rather than to the page description: a curated
  // explanation in the wrong language still explains more than a one-line subtitle.
  const curated = copy ? (primary === 'el' ? copy.el ?? copy.en : copy.en) : null;
  const fallbackDescription = primary === 'el' && meta?.descriptionEl ? meta.descriptionEl : meta?.description;
  const body = children ?? curated ?? (fallbackDescription ? <p>{fallbackDescription}</p> : null);

  if (!body) return null;

  return (
    <HelpCallout
      id={helpId}
      title={helpTitle}
      titleEl={helpTitleEl}
      defaultOpen={defaultOpen ?? false}
      compact={compact}
    >
      {body}
    </HelpCallout>
  );
}

export { HELP_CONTENT };
