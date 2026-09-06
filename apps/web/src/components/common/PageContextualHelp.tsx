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
          The Builder turns scattered notes into investor-ready artefacts. Move through{' '}
          <strong>Idea → Market → Business Model → MVP → Financials → Pitch</strong> at your own pace —
          progress unlocks the Pitch Deck and Application Generator tabs automatically.
        </p>
        <p>
          Every change syncs across collaborators in real time. Use <strong>Version History</strong> to roll back
          without losing data.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Ο Builder μετατρέπει διάσπαρτες σημειώσεις σε υλικό έτοιμο για επενδυτές. Προχωρήστε στα βήματα{' '}
          <strong>Ιδέα → Αγορά → Επιχειρηματικό μοντέλο → MVP → Οικονομικά → Pitch</strong> με τον ρυθμό σας —
          η πρόοδος ξεκλειδώνει αυτόματα τις καρτέλες Pitch Deck και Application Generator.
        </p>
        <p>
          Κάθε αλλαγή συγχρονίζεται ζωντανά με τους συνεργάτες σας. Με το{' '}
          <strong>Ιστορικό εκδόσεων</strong> επιστρέφετε σε προηγούμενη μορφή χωρίς απώλεια δεδομένων.
        </p>
      </>
    ),
  },
  readiness: {
    en: (
      <>
        <p>
          Your score combines 6 dimensions: <strong>Idea, Market, Team, Product, Traction, Funding</strong>. Each is
          weighted by stage — pre-seed weighs Team and Idea more, Series A weighs Traction and Funding.
        </p>
        <p>
          Click any dimension card to see what is missing. Hit <em>Reassess</em> after major updates (new MVP, signed LOI,
          team change) to refresh the score.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Η βαθμολογία συνδυάζει 6 διαστάσεις: <strong>Ιδέα, Αγορά, Ομάδα, Προϊόν, Απήχηση, Χρηματοδότηση</strong>.
          Η βαρύτητα κάθε μιας εξαρτάται από το στάδιο — στο pre-seed μετρούν περισσότερο η Ομάδα και η Ιδέα, στο
          Series A η Απήχηση και η Χρηματοδότηση.
        </p>
        <p>
          Πατήστε σε οποιαδήποτε κάρτα διάστασης για να δείτε τι λείπει. Μετά από σημαντική εξέλιξη (νέο MVP,
          υπογεγραμμένο LOI, αλλαγή στην ομάδα) πατήστε <em>Επαναξιολόγηση</em> για ενημέρωση της βαθμολογίας.
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
          Kanban columns map to standard fundraising stages:{' '}
          <strong>Intro → Meeting → Diligence → Term Sheet → Closed/Passed</strong>. Drag cards as deals progress.
        </p>
        <p>
          The <strong>Data Room</strong> tab holds documents shared with investors via tokenised links — nothing is
          public unless you share it.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Οι στήλες Kanban αντιστοιχούν στα καθιερωμένα στάδια χρηματοδότησης:{' '}
          <strong>Γνωριμία → Συνάντηση → Έλεγχος → Term Sheet → Κλείσιμο/Απόρριψη</strong>. Σύρετε τις κάρτες καθώς
          εξελίσσεται κάθε συζήτηση.
        </p>
        <p>
          Η καρτέλα <strong>Data Room</strong> κρατά τα έγγραφα που μοιράζεστε με επενδυτές μέσω συνδέσμων με
          token — τίποτα δεν είναι δημόσιο αν δεν το μοιραστείτε εσείς.
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
          Milestones are atomic goals with owners and dates. Group them by quarter or theme. Completed milestones feed
          your readiness score and produce evidence for investor updates.
        </p>
      </>
    ),
    el: (
      <>
        <p>
          Τα ορόσημα είναι μεμονωμένοι στόχοι με υπεύθυνο και ημερομηνία. Ομαδοποιήστε τα ανά τρίμηνο ή θέμα. Τα
          ολοκληρωμένα ορόσημα τροφοδοτούν τη βαθμολογία ετοιμότητας και δίνουν τεκμήρια για τις ενημερώσεις προς
          επενδυτές.
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
};

/**
 * Renders contextual help from page-registry when helpId/helpTitle exist,
 * or explicit props when provided.
 */
export function PageContextualHelp({ id, title, titleEl, children }: PageContextualHelpProps) {
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
    <HelpCallout id={helpId} title={helpTitle} titleEl={helpTitleEl}>
      {body}
    </HelpCallout>
  );
}

export { HELP_CONTENT };
