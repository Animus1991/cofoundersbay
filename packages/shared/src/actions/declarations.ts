import { CANVAS_COMMAND_OPS } from '../canvas/commands';
import type { ActionDeclaration, ToolCatalogEntry } from './types';

/**
 * Every capability the assistant has, declared once.
 *
 * `as const satisfies` is load-bearing: `satisfies` type-checks each entry
 * against `ActionDeclaration`, while `as const` keeps the literal `id` and
 * `reversal.kind` values in the emitted types. That is what lets each app
 * derive an exhaustive map of executors and undos, so a capability declared
 * here cannot be left unimplemented without a compile error.
 *
 * Reversal wording is the outcome of reading the controllers, not of
 * paraphrasing intent — see `ActionReversalKind`.
 */
export const ACTION_DECLARATIONS = [
  {
    id: 'get_graph',
    kind: 'read',
    label: { en: 'Read your workspace state', el: 'Ανάγνωση της κατάστασης του χώρου σου' },
    description: {
      en: 'Read the signed-in user’s own summary: unread messages, pending intros, unread notifications, venture readiness and the single next action.',
      el: 'Διαβάζει τη σύνοψη του συνδεδεμένου χρήστη: αδιάβαστα μηνύματα, εκκρεμείς συστάσεις, αδιάβαστες ειδοποιήσεις, ετοιμότητα και το επόμενο βήμα.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'search_people',
    kind: 'read',
    label: { en: 'Search people', el: 'Αναζήτηση ανθρώπων' },
    description: {
      en: 'Search profiles across the network by free text and optionally by location. Returns up to six people with headline, role and match score.',
      el: 'Αναζητά προφίλ στο δίκτυο με ελεύθερο κείμενο και προαιρετικά τοποθεσία. Επιστρέφει έως έξι άτομα με τίτλο, ρόλο και σκορ ταιριάσματος.',
    },
    params: [
      {
        name: 'q',
        type: 'string',
        required: false,
        description: {
          en: 'Free-text query, e.g. a name, a skill, or "technical cofounder".',
          el: 'Ελεύθερο κείμενο, π.χ. όνομα, δεξιότητα ή «technical cofounder».',
        },
      },
      {
        name: 'location',
        type: 'string',
        required: false,
        description: {
          en: 'City or country to narrow the search, e.g. "Athens".',
          el: 'Πόλη ή χώρα για περιορισμό, π.χ. «Αθήνα».',
        },
      },
    ],
    writes: false,
  },
  {
    id: 'get_recommendations',
    kind: 'read',
    label: { en: 'Get your matches', el: 'Λήψη των ταιριασμάτων σου' },
    description: {
      en: 'Read the personalised co-founder and team recommendations already computed for the signed-in user.',
      el: 'Διαβάζει τις εξατομικευμένες προτάσεις συνιδρυτών και ομάδας που έχουν υπολογιστεί για τον χρήστη.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_notifications',
    kind: 'read',
    label: { en: 'Read notifications', el: 'Ανάγνωση ειδοποιήσεων' },
    description: {
      en: 'Read the most recent notifications for the signed-in user and which of them are unread.',
      el: 'Διαβάζει τις πιο πρόσφατες ειδοποιήσεις του χρήστη και ποιες είναι αδιάβαστες.',
    },
    params: [],
    writes: false,
  },
  // ── The areas the assistant could not see ──────────────────────────────
  //
  // Before these, it could read four things — the graph summary, people,
  // matches and notifications — while the product has some twenty areas. Asked
  // "what events are coming up" or "which milestones are overdue", it could
  // only offer to open the page. Each of these is a facade over a client
  // function the web app already calls for its own screen, so the assistant
  // reads exactly what the page shows and needs no new server surface.
  //
  // The descriptions say what comes back, not just what the tool is for: the
  // `en` half is the only thing a model sees when deciding whether a tool can
  // answer the question in front of it.
  {
    id: 'get_events',
    kind: 'read',
    label: { en: 'Read upcoming events', el: 'Ανάγνωση επερχόμενων εκδηλώσεων' },
    description: {
      en: 'Read upcoming events on the platform: title, date, whether online or in person, how many are attending, and whether the signed-in user has RSVPed. Returns up to five.',
      el: 'Διαβάζει τις επερχόμενες εκδηλώσεις της πλατφόρμας: τίτλο, ημερομηνία, αν γίνονται online ή δια ζώσης, πόσοι συμμετέχουν και αν ο χρήστης έχει δηλώσει συμμετοχή. Επιστρέφει έως πέντε.',
    },
    params: [
      {
        name: 'q',
        type: 'string',
        required: false,
        description: {
          en: 'Optional words to narrow the events, e.g. "demo day" or "fintech".',
          el: 'Προαιρετικές λέξεις για περιορισμό, π.χ. «demo day» ή «fintech».',
        },
      },
    ],
    writes: false,
  },
  {
    id: 'get_milestones',
    kind: 'read',
    label: { en: 'Read your milestones', el: 'Ανάγνωση των ορόσημών σου' },
    description: {
      en: 'Read the signed-in user’s milestones: how many are complete, overdue and due soon, the completion rate, and the next open milestones by due date.',
      el: 'Διαβάζει τα ορόσημα του χρήστη: πόσα έχουν ολοκληρωθεί, πόσα έχουν καθυστερήσει ή λήγουν σύντομα, το ποσοστό ολοκλήρωσης και τα επόμενα ανοιχτά κατά ημερομηνία λήξης.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_jobs',
    kind: 'read',
    label: { en: 'Read open roles', el: 'Ανάγνωση ανοιχτών θέσεων' },
    description: {
      en: 'Read open roles that startups have posted on the platform: title, who posted it, location and whether it is remote. Returns up to five.',
      el: 'Διαβάζει τις ανοιχτές θέσεις που έχουν δημοσιεύσει startups: τίτλο, ποιος τη δημοσίευσε, τοποθεσία και αν είναι εξ αποστάσεως. Επιστρέφει έως πέντε.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_groups',
    kind: 'read',
    label: { en: 'Read your communities', el: 'Ανάγνωση των κοινοτήτων σου' },
    description: {
      en: 'Read the communities the signed-in user belongs to, with member and post counts and the user’s role in each.',
      el: 'Διαβάζει τις κοινότητες στις οποίες ανήκει ο χρήστης, με πλήθος μελών και αναρτήσεων και τον ρόλο του σε καθεμία.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_endorsements',
    kind: 'read',
    label: { en: 'Read your endorsements', el: 'Ανάγνωση των προσυπογραφών σου' },
    description: {
      en: 'Read how many endorsements the signed-in user has received and given, and which received ones are still waiting for their approval before they show on the profile.',
      el: 'Διαβάζει πόσες προσυπογραφές έχει λάβει και δώσει ο χρήστης, και ποιες από όσες έλαβε περιμένουν ακόμη την έγκρισή του για να εμφανιστούν στο προφίλ.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_opportunities',
    kind: 'read',
    label: { en: 'Read open opportunities', el: 'Ανάγνωση ανοιχτών ευκαιριών' },
    description: {
      en: 'Read open opportunities — co-founder calls, paid gigs, equity roles and collaborations — with type, company, location and deadline. Returns up to five.',
      el: 'Διαβάζει ανοιχτές ευκαιρίες — αναζητήσεις συνιδρυτών, αμειβόμενα projects, θέσεις με equity και συνεργασίες — με είδος, εταιρεία, τοποθεσία και προθεσμία. Επιστρέφει έως πέντε.',
    },
    params: [
      {
        name: 'q',
        type: 'string',
        required: false,
        description: {
          en: 'Optional words to narrow the opportunities, e.g. "design" or "remote".',
          el: 'Προαιρετικές λέξεις για περιορισμό, π.χ. «design» ή «remote».',
        },
      },
    ],
    writes: false,
  },
  {
    id: 'get_mentorship_sessions',
    kind: 'read',
    label: { en: 'Read your mentoring sessions', el: 'Ανάγνωση των συνεδριών mentoring' },
    description: {
      en: 'Read the signed-in user’s upcoming mentoring sessions: title, date and time, length, and whether it is a video call, in person or a chat.',
      el: 'Διαβάζει τις επερχόμενες συνεδρίες mentoring του χρήστη: τίτλο, ημερομηνία και ώρα, διάρκεια, και αν είναι βιντεοκλήση, δια ζώσης ή συνομιλία.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_shortlist',
    kind: 'read',
    label: { en: 'Read your saved profiles', el: 'Ανάγνωση των αποθηκευμένων προφίλ' },
    description: {
      en: 'Read the profiles the signed-in user has saved to their shortlist, with any private note they added. Returns up to six.',
      el: 'Διαβάζει τα προφίλ που έχει αποθηκεύσει ο χρήστης στη λίστα του, μαζί με όποια ιδιωτική σημείωση έχει προσθέσει. Επιστρέφει έως έξι.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_research_boards',
    kind: 'read',
    label: { en: 'Read your research boards', el: 'Ανάγνωση των πινάκων έρευνας' },
    description: {
      en: 'Read the signed-in user’s research boards: title, how many notes are pinned, and whether it is archived. Returns up to five.',
      el: 'Διαβάζει τους πίνακες έρευνας του χρήστη: τίτλο, πόσα σημειώματα είναι καρφιτσωμένα, και αν είναι αρχειοθετημένος. Επιστρέφει έως πέντε.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_investor_board',
    kind: 'read',
    label: { en: 'Read your investor board', el: '\u0391\u03bd\u03ac\u03b3\u03bd\u03c9\u03c3\u03b7 \u03c4\u03bf\u03c5 \u03c0\u03af\u03bd\u03b1\u03ba\u03b1 \u03b5\u03c0\u03b5\u03bd\u03b4\u03cd\u03c3\u03b5\u03c9\u03bd' },
    description: {
      en: 'Answer questions about the startups you are tracking: what is at which stage, what you have invested, and what moved recently. The watchlist, the pipeline and the portfolio are the same board.',
      el: '\u0391\u03c0\u03b1\u03bd\u03c4\u03ac \u03b3\u03b9\u03b1 \u03c4\u03b1 startups \u03c0\u03bf\u03c5 \u03c0\u03b1\u03c1\u03b1\u03ba\u03bf\u03bb\u03bf\u03c5\u03b8\u03b5\u03af\u03c2: \u03c4\u03b9 \u03b2\u03c1\u03af\u03c3\u03ba\u03b5\u03c4\u03b1\u03b9 \u03c3\u03b5 \u03c0\u03bf\u03b9\u03bf \u03c3\u03c4\u03ac\u03b4\u03b9\u03bf, \u03c4\u03b9 \u03ad\u03c7\u03b5\u03b9\u03c2 \u03b5\u03c0\u03b5\u03bd\u03b4\u03cd\u03c3\u03b5\u03b9 \u03ba\u03b1\u03b9 \u03c4\u03b9 \u03ba\u03b9\u03bd\u03ae\u03b8\u03b7\u03ba\u03b5 \u03c0\u03c1\u03cc\u03c3\u03c6\u03b1\u03c4\u03b1. \u0397 \u03bb\u03af\u03c3\u03c4\u03b1 \u03c0\u03b1\u03c1\u03b1\u03ba\u03bf\u03bb\u03bf\u03cd\u03b8\u03b7\u03c3\u03b7\u03c2, \u03c4\u03bf pipeline \u03ba\u03b1\u03b9 \u03c4\u03bf \u03c7\u03b1\u03c1\u03c4\u03bf\u03c6\u03c5\u03bb\u03ac\u03ba\u03b9\u03bf \u03b5\u03af\u03bd\u03b1\u03b9 \u03bf \u03af\u03b4\u03b9\u03bf\u03c2 \u03c0\u03af\u03bd\u03b1\u03ba\u03b1\u03c2.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_builder_state',
    kind: 'read',
    label: { en: 'Read your Startup Builder workspaces', el: 'Ανάγνωση των χώρων Startup Builder' },
    description: {
      en: 'Read the signed-in user’s Startup Builder workspaces: name, status, document count and readiness score. Returns up to five.',
      el: 'Διαβάζει τους χώρους Startup Builder του χρήστη: όνομα, κατάσταση, πλήθος εγγράφων και βαθμό ετοιμότητας. Επιστρέφει έως πέντε.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_profile',
    kind: 'read',
    label: { en: 'Read your profile', el: 'Ανάγνωση του προφίλ σου' },
    description: {
      en: 'Read the signed-in user’s own profile: display name, headline, bio, location, languages, role and skills — the same record the Profile page shows.',
      el: 'Διαβάζει το ίδιο το προφίλ του χρήστη: όνομα, τίτλο, βιογραφικό, τοποθεσία, γλώσσες, ρόλο και δεξιότητες — την ίδια εγγραφή που δείχνει η σελίδα Προφίλ.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_messages',
    kind: 'read',
    label: { en: 'Read your conversations', el: 'Ανάγνωση των συνομιλιών σου' },
    description: {
      en: 'Read the signed-in user’s message conversations: who each thread is with, the last message, how many are unread and whether it is pinned. Returns up to five.',
      el: 'Διαβάζει τις συνομιλίες του χρήστη: με ποιον είναι κάθε νήμα, το τελευταίο μήνυμα, πόσα είναι αδιάβαστα και αν είναι καρφιτσωμένο. Επιστρέφει έως πέντε.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'get_connections',
    kind: 'read',
    label: { en: 'Read your connections', el: 'Ανάγνωση των συνδέσεών σου' },
    description: {
      en: 'Read the signed-in user’s network: how many accepted connections there are, and which requests are still waiting — incoming ones the user can answer and outgoing ones still pending.',
      el: 'Διαβάζει το δίκτυο του χρήστη: πόσες αποδεκτές συνδέσεις υπάρχουν και ποια αιτήματα περιμένουν ακόμη — εισερχόμενα που μπορεί να απαντήσει και εξερχόμενα σε εκκρεμότητα.',
    },
    params: [],
    writes: false,
  },
  {
    id: 'navigate',
    kind: 'mutation',
    label: { en: 'Open a page', el: 'Άνοιγμα σελίδας' },
    description: {
      en: 'Move the user to a route in the product. Proposes the destination; the user confirms before anything moves.',
      el: 'Μετακινεί τον χρήστη σε μια σελίδα του προϊόντος. Προτείνει τον προορισμό· ο χρήστης επιβεβαιώνει πριν γίνει οτιδήποτε.',
    },
    params: [
      {
        name: 'href',
        type: 'string',
        required: true,
        description: {
          en: 'Destination path inside the product, e.g. "/matches".',
          el: 'Διαδρομή προορισμού μέσα στο προϊόν, π.χ. «/matches».',
        },
      },
      {
        name: 'label',
        type: 'string',
        required: false,
        description: {
          en: 'Human-readable name of the destination, used in the proposal.',
          el: 'Αναγνώσιμο όνομα του προορισμού, για την πρόταση.',
        },
      },
    ],
    writes: false,
    invalidates: [],
    reversal: {
      kind: 'none',
      explanation: {
        en: 'Nothing is written, so there is nothing to undo. Use the browser’s back control to return.',
        el: 'Δεν γράφεται τίποτα, άρα δεν υπάρχει κάτι να αναιρεθεί. Χρησιμοποίησε το πίσω του browser για επιστροφή.',
      },
    },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Go', el: 'Μετάβαση' },
  },
  {
    id: 'shortlist_add',
    kind: 'mutation',
    label: { en: 'Save to shortlist', el: 'Αποθήκευση στη λίστα' },
    description: {
      en: 'Add a person to the signed-in user’s saved profiles. Writes only after confirmation.',
      el: 'Προσθέτει ένα άτομο στα αποθηκευμένα προφίλ του χρήστη. Γράφει μόνο μετά από επιβεβαίωση.',
    },
    params: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: {
          en: 'Id of the person to save. Must come from a prior search or recommendation result.',
          el: 'Το id του ατόμου. Πρέπει να προέρχεται από προηγούμενη αναζήτηση ή πρόταση.',
        },
      },
    ],
    writes: true,
    invalidates: ['shortlist'],
    reversal: {
      // `DELETE /api/shortlist/:userId` runs `savedProfile.deleteMany`, so the
      // row is really gone and nobody else was notified.
      kind: 'full',
      explanation: {
        en: 'Fully reversible. Removing them deletes the saved entry, and nobody is notified either way.',
        el: 'Πλήρως αναστρέψιμο. Η αφαίρεση διαγράφει την αποθηκευμένη εγγραφή και δεν ειδοποιείται κανείς σε καμία περίπτωση.',
      },
    },
    confirmLabel: { en: 'Save to shortlist', el: 'Αποθήκευση στη λίστα' },
  },
  {
    id: 'shortlist_remove',
    kind: 'mutation',
    label: { en: 'Remove from shortlist', el: 'Αφαίρεση από τη λίστα' },
    description: {
      en: 'Remove a person from the signed-in user’s saved profiles. Writes only after confirmation, and can be put back in one click.',
      el: 'Αφαιρεί ένα άτομο από τα αποθηκευμένα προφίλ του χρήστη. Γράφει μόνο μετά από επιβεβαίωση και επιστρέφει με ένα κλικ.',
    },
    params: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: {
          en: 'Id of the person to remove. Must come from a prior shortlist, search or recommendation result.',
          el: 'Το id του ατόμου. Πρέπει να προέρχεται από τη λίστα, προηγούμενη αναζήτηση ή πρόταση.',
        },
      },
    ],
    writes: true,
    invalidates: ['shortlist'],
    reversal: {
      kind: 'full',
      explanation: {
        en: 'Fully reversible. Putting them back recreates the saved entry, and nobody is notified either way.',
        el: 'Πλήρως αναστρέψιμο. Η επαναφορά δημιουργεί ξανά την αποθηκευμένη εγγραφή και δεν ειδοποιείται κανείς.',
      },
    },
    confirmLabel: { en: 'Remove from shortlist', el: 'Αφαίρεση από τη λίστα' },
  },
  {
    id: 'send_connection',
    kind: 'mutation',
    label: { en: 'Send an intro request', el: 'Αποστολή αιτήματος σύνδεσης' },
    description: {
      en: 'Send a connection request to a person through the same Connections API the rest of the product uses. Writes only after confirmation.',
      el: 'Στέλνει αίτημα σύνδεσης μέσω του ίδιου Connections API που χρησιμοποιεί το υπόλοιπο προϊόν. Γράφει μόνο μετά από επιβεβαίωση.',
    },
    params: [
      {
        name: 'receiverId',
        type: 'string',
        required: true,
        description: {
          en: 'Id of the person to invite. Must come from a prior search or recommendation result.',
          el: 'Το id του ατόμου. Πρέπει να προέρχεται από προηγούμενη αναζήτηση ή πρόταση.',
        },
      },
      {
        name: 'message',
        type: 'string',
        required: false,
        description: {
          en: 'Optional note sent with the request.',
          el: 'Προαιρετικό σημείωμα που στέλνεται με το αίτημα.',
        },
      },
    ],
    writes: true,
    invalidates: ['connections', 'graph'],
    reversal: {
      // `DELETE /connections/:id` withdraws a request the receiver has not
      // answered. Partial, not full: the notification fired when the request
      // was sent and nothing takes that back — only the pending request goes.
      kind: 'partial',
      explanation: {
        en: 'Withdraws the request, so it leaves their pending list. They were notified when it was sent, so they may already have seen it, and it can no longer be withdrawn once they have accepted or declined.',
        el: 'Ανακαλεί το αίτημα, ώστε να φύγει από τα εκκρεμή τους. Ειδοποιήθηκαν όταν στάλθηκε, οπότε μπορεί να το έχουν ήδη δει, και δεν ανακαλείται πια αν το έχουν αποδεχτεί ή απορρίψει.',
      },
    },
    confirmLabel: { en: 'Send intro', el: 'Αποστολή σύστασης' },
  },
  {
    id: 'start_or_send_message',
    kind: 'mutation',
    label: { en: 'Open a conversation', el: 'Άνοιγμα συνομιλίας' },
    description: {
      en: 'Open the direct thread with a person, creating it if there is none. Does not send any message text.',
      el: 'Ανοίγει το απευθείας νήμα με ένα άτομο, δημιουργώντας το αν δεν υπάρχει. Δεν στέλνει κείμενο μηνύματος.',
    },
    params: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: {
          en: 'Id of the person to open a thread with.',
          el: 'Το id του ατόμου για το νήμα συνομιλίας.',
        },
      },
    ],
    writes: true,
    invalidates: ['messages'],
    reversal: {
      // MessagingController has no delete for a conversation, and
      // getOrCreateDirectConversation returns the same `{ id }` shape whether
      // it found an existing thread or created one. An undo could not tell
      // "we made this" from "this was already the user's thread", and
      // archiving the latter would destroy something never created here.
      kind: 'none',
      explanation: {
        en: 'No message is sent, so there is nothing for the other person to read. The thread itself cannot be removed, and the API does not report whether it was created now or already existed.',
        el: 'Δεν στέλνεται μήνυμα, άρα ο άλλος δεν έχει κάτι να διαβάσει. Το νήμα δεν μπορεί να αφαιρεθεί και το API δεν αναφέρει αν δημιουργήθηκε τώρα ή υπήρχε ήδη.',
      },
    },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Open thread', el: 'Άνοιγμα νήματος' },
  },
  {
    id: 'readiness_tick_criterion',
    kind: 'mutation',
    label: { en: 'Tick a readiness criterion', el: 'Σήμανση κριτηρίου ετοιμότητας' },
    description: {
      en: 'Mark one readiness criterion as met or not met on the user’s Startup Builder workspace, which recalculates that dimension’s score.',
      el: 'Σημειώνει ένα κριτήριο ετοιμότητας ως καλυμμένο ή μη στον χώρο Startup Builder του χρήστη, κάτι που επανυπολογίζει τη βαθμολογία της διάστασης.',
    },
    params: [
      {
        name: 'dimension',
        type: 'string',
        required: true,
        enumValues: ['team', 'market', 'product', 'business', 'funding', 'execution'],
        description: {
          en: 'Which of the six readiness dimensions the criterion belongs to.',
          el: 'Σε ποια από τις έξι διαστάσεις ετοιμότητας ανήκει το κριτήριο.',
        },
      },
      {
        name: 'criterionId',
        type: 'string',
        required: true,
        description: {
          en: 'The criterion’s id, as listed on the Readiness page for that dimension.',
          el: 'Το id του κριτηρίου, όπως εμφανίζεται στη σελίδα Ετοιμότητας για τη διάσταση.',
        },
      },
      {
        name: 'completed',
        type: 'boolean',
        required: true,
        description: {
          en: 'True to mark it met, false to clear it.',
          el: 'True για να σημανθεί ως καλυμμένο, false για να καθαριστεί.',
        },
      },
    ],
    writes: true,
    invalidates: ['readiness'],
    reversal: {
      // The identifier the undo needs is in the *input*, not the output, which
      // is what makes this genuinely reversible where `workspace_create` is
      // not. The executor also refuses a no-op: ticking something already
      // ticked would otherwise leave an undo that clears a box the user set
      // themselves.
      kind: 'full',
      explanation: {
        en: 'Setting the criterion back restores the previous score exactly. Nothing is sent to anyone, and the action is refused outright if the criterion is already in the state being asked for.',
        el: 'Η επαναφορά του κριτηρίου αποκαθιστά ακριβώς την προηγούμενη βαθμολογία. Δεν στέλνεται τίποτα σε κανέναν, και η ενέργεια απορρίπτεται αν το κριτήριο είναι ήδη στην κατάσταση που ζητείται.',
      },
    },
    auditSubject: { param: 'criterionId', entityType: 'readiness_criterion' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Update criterion', el: 'Ενημέρωση κριτηρίου' },
  },
  {
    id: 'analytics_set_period',
    kind: 'mutation',
    label: { en: 'Change the analytics window', el: 'Αλλαγή περιόδου αναλυτικών' },
    description: {
      en: 'Switch the Analytics page between the 7, 14, 30 and 90 day windows.',
      el: 'Εναλλάσσει τη σελίδα Αναλυτικών μεταξύ των περιόδων 7, 14, 30 και 90 ημερών.',
    },
    params: [
      {
        name: 'period',
        type: 'string',
        required: true,
        enumValues: ['7d', '14d', '30d', '90d'],
        description: {
          en: 'The window to show.',
          el: 'Η περίοδος που θα εμφανιστεί.',
        },
      },
    ],
    // Like `navigate`, this moves the user's view rather than their data, and
    // that distinction is what the UI reads to decide whether to warn. Nothing
    // goes stale either: the page keys its query by the period in the address.
    writes: false,
    invalidates: [],
    reversal: {
      kind: 'partial',
      explanation: {
        en: 'Nothing is stored — the window lives in the page’s address. Taking it back returns to the default 7-day view, which is where the page starts, not necessarily the window you had open before; switching costs a click either way.',
        el: 'Δεν αποθηκεύεται τίποτα — η περίοδος ζει στη διεύθυνση της σελίδας. Η αναίρεση επιστρέφει στην προεπιλογή των 7 ημερών, δηλαδή εκεί που ξεκινά η σελίδα, όχι απαραίτητα στην περίοδο που είχατε ανοιχτή πριν· η εναλλαγή κοστίζει ένα κλικ έτσι κι αλλιώς.',
      },
    },
    auditSubject: { param: 'period', entityType: 'analytics_window' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Show that window', el: 'Εμφάνιση περιόδου' },
  },
  {
    id: 'workspace_create',
    kind: 'mutation',
    label: { en: 'Create a Startup Builder workspace', el: 'Δημιουργία χώρου Startup Builder' },
    description: {
      en: 'Create the workspace the Readiness page needs before criteria can be ticked or a score saved.',
      el: 'Δημιουργεί τον χώρο εργασίας που χρειάζεται η σελίδα Ετοιμότητας πριν μπορέσουν να σημανθούν κριτήρια ή να αποθηκευτεί βαθμολογία.',
    },
    params: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: {
          en: 'What to call the workspace, e.g. the venture’s name.',
          el: 'Πώς θα ονομαστεί ο χώρος, π.χ. το όνομα του εγχειρήματος.',
        },
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: {
          en: 'One line on what the venture is.',
          el: 'Μία γραμμή για το τι είναι το εγχείρημα.',
        },
      },
      {
        name: 'startupName',
        type: 'string',
        required: false,
        description: {
          en: 'The startup’s name, when it differs from the workspace name.',
          el: 'Το όνομα του startup, όταν διαφέρει από το όνομα του χώρου.',
        },
      },
    ],
    writes: true,
    invalidates: ['workspaces', 'readiness'],
    reversal: {
      // The executor hands back the id it created (`ActionOutcome.undo`), so
      // the undo archives that exact workspace rather than guessing by name.
      // Archive, not delete: it is the product's own word for putting a
      // workspace away, and it leaves the row recoverable from Builder.
      kind: 'full',
      explanation: {
        en: 'Archives the workspace that was just created, and clears it as your selected workspace. Nothing inside it is deleted — you can restore it from Startup Builder.',
        el: 'Αρχειοθετεί τον χώρο που μόλις δημιουργήθηκε και τον αφαιρεί από επιλεγμένο. Τίποτα μέσα του δεν διαγράφεται — μπορείς να τον επαναφέρεις από το Startup Builder.',
      },
    },
    auditSubject: { param: 'name', entityType: 'workspace' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Create workspace', el: 'Δημιουργία χώρου' },
  },
  {
    id: 'investor_track_startup',
    kind: 'mutation',
    label: { en: 'Track a startup', el: 'Παρακολούθηση startup' },
    description: {
      en: 'Put a startup on your investor board at the watching stage. The same row the pipeline groups and the portfolio totals once you invest.',
      el: 'Βάζει ένα startup στον πίνακα επενδύσεων, στο στάδιο παρακολούθησης. Είναι η ίδια εγγραφή που ομαδοποιεί το pipeline και αθροίζει το χαρτοφυλάκιο μόλις επενδύσεις.',
    },
    params: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: {
          en: 'The startup to track, as it should appear on the board.',
          el: 'Το startup προς παρακολούθηση, όπως θα εμφανίζεται στον πίνακα.',
        },
      },
      {
        name: 'industry',
        type: 'string',
        required: false,
        description: { en: 'Its industry, when known.', el: 'Ο κλάδος του, αν είναι γνωστός.' },
      },
      {
        name: 'notes',
        type: 'string',
        required: false,
        description: {
          en: 'A private note on why it is worth watching.',
          el: 'Ιδιωτική σημείωση για το γιατί αξίζει να παρακολουθείται.',
        },
      },
    ],
    writes: true,
    invalidates: ['investor'],
    reversal: {
      // The executor hands back the id it created, so the undo removes that
      // exact row rather than one that happens to share a name.
      kind: 'full',
      explanation: {
        en: 'Removes the startup from your board again. Nothing is shared with the startup either way — a board is private to you.',
        el: 'Αφαιρεί ξανά το startup από τον πίνακά σου. Τίποτα δεν κοινοποιείται στο startup — ο πίνακας είναι ιδιωτικός.',
      },
    },
    auditSubject: { param: 'name', entityType: 'investor_deal' },
    confirmLabel: { en: 'Track it', el: 'Παρακολούθηση' },
  },
  {
    id: 'investor_move_stage',
    kind: 'mutation',
    label: { en: 'Move a deal to another stage', el: 'Μετακίνηση deal σε άλλο στάδιο' },
    description: {
      en: 'Move a startup along your pipeline — to reviewing, a meeting, due diligence, negotiating, invested or passed.',
      el: 'Μετακινεί ένα startup στο pipeline — σε εξέταση, συνάντηση, δέουσα επιμέλεια, διαπραγμάτευση, επένδυση ή απόρριψη.',
    },
    params: [
      {
        name: 'dealId',
        type: 'string',
        required: true,
        description: {
          en: 'Id of the deal to move. Must come from a prior read of the board.',
          el: 'Το id του deal. Πρέπει να προέρχεται από προηγούμενη ανάγνωση του πίνακα.',
        },
      },
      {
        name: 'pipelineStage',
        type: 'string',
        required: true,
        enumValues: [
          'discovered',
          'reviewing',
          'meeting',
          'due_diligence',
          'negotiating',
          'invested',
          'passed',
        ],
        description: { en: 'The stage to move it to.', el: 'Το στάδιο προορισμού.' },
      },
    ],
    writes: true,
    invalidates: ['investor'],
    reversal: {
      // The executor reads the stage it moved away from and hands it back, so
      // the undo returns the deal to where it actually was.
      kind: 'full',
      explanation: {
        en: 'Puts the deal back in the stage it came from. Reaching "invested" also stamps the date; that stamp is kept, so moving back and forth cannot rewrite when you invested.',
        el: 'Επαναφέρει το deal στο στάδιο από το οποίο ήρθε. Η άφιξη στο «επένδυση» σφραγίζει και την ημερομηνία· η σφραγίδα διατηρείται, ώστε οι μετακινήσεις να μην ξαναγράφουν πότε επένδυσες.',
      },
    },
    auditSubject: { param: 'dealId', entityType: 'investor_deal' },
    confirmLabel: { en: 'Move it', el: 'Μετακίνηση' },
  },
  {
    id: 'update_profile',
    kind: 'mutation',
    label: { en: 'Update your profile', el: 'Ενημέρωση του προφίλ σου' },
    description: {
      en: 'Change fields on the signed-in user’s own profile — headline, bio, location or timezone — through the same endpoint the profile editor saves with. Writes only after confirmation.',
      el: 'Αλλάζει πεδία του ίδιου του προφίλ του χρήστη — τίτλο, βιογραφικό, τοποθεσία ή ζώνη ώρας — μέσα από το ίδιο endpoint που αποθηκεύει η σελίδα επεξεργασίας. Γράφει μόνο μετά από επιβεβαίωση.',
    },
    params: [
      {
        name: 'headline',
        type: 'string',
        required: false,
        description: {
          en: 'New headline, up to 300 characters.',
          el: 'Νέος τίτλος, έως 300 χαρακτήρες.',
        },
      },
      {
        name: 'bio',
        type: 'string',
        required: false,
        description: {
          en: 'New bio, up to 5000 characters.',
          el: 'Νέο βιογραφικό, έως 5000 χαρακτήρες.',
        },
      },
      {
        name: 'location',
        type: 'string',
        required: false,
        description: {
          en: 'New location, e.g. "Athens, Greece".',
          el: 'Νέα τοποθεσία, π.χ. «Αθήνα, Ελλάδα».',
        },
      },
      {
        name: 'timezone',
        type: 'string',
        required: false,
        description: {
          en: 'New IANA timezone, e.g. "Europe/Athens".',
          el: 'Νέα ζώνη ώρας IANA, π.χ. «Europe/Athens».',
        },
      },
    ],
    writes: true,
    invalidates: ['profile'],
    reversal: {
      // The executor reads the profile before writing and hands the previous
      // values back as `undo.prior`, so the undo restores exactly what was
      // there — including empty fields, written back as empty strings.
      kind: 'full',
      explanation: {
        en: 'Fully reversible. The values being replaced are read first and the undo writes exactly those back.',
        el: 'Πλήρως αναστρέψιμο. Οι τιμές που αντικαθίστανται διαβάζονται πρώτα και η αναίρεση γράφει ακριβώς αυτές πίσω.',
      },
    },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Update profile', el: 'Ενημέρωση προφίλ' },
  },
  {
    id: 'respond_to_connection',
    kind: 'mutation',
    label: { en: 'Answer a connection request', el: 'Απάντηση αιτήματος σύνδεσης' },
    description: {
      en: 'Accept or decline a connection request sent to the signed-in user. The request id comes from a prior read of your connections. Writes only after confirmation.',
      el: 'Αποδέχεται ή απορρίπτει αίτημα σύνδεσης που εστάλη στον χρήστη. Το id προέρχεται από προηγούμενη ανάγνωση των συνδέσεων. Γράφει μόνο μετά από επιβεβαίωση.',
    },
    params: [
      {
        name: 'connectionId',
        type: 'string',
        required: true,
        description: {
          en: 'Id of the pending request. Must come from a prior read of your connections.',
          el: 'Το id του εκκρεμούς αιτήματος. Πρέπει να προέρχεται από προηγούμενη ανάγνωση των συνδέσεων.',
        },
      },
      {
        name: 'decision',
        type: 'string',
        required: true,
        enumValues: ['accepted', 'declined'],
        description: {
          en: 'Whether to accept or decline the request.',
          el: 'Αποδοχή ή απόρριψη του αιτήματος.',
        },
      },
    ],
    writes: true,
    invalidates: ['connections', 'graph'],
    reversal: {
      // `PATCH /connections/:id` answers the request and notifies the
      // requester. The only delete route is the sender's withdraw, which the
      // receiver cannot call — an answered request has no route that
      // un-answers it.
      kind: 'none',
      explanation: {
        en: 'Not reversible. Answering notifies the other person immediately, and there is no action that turns an accepted or declined request back into a pending one.',
        el: 'Δεν αναιρείται. Η απάντηση ειδοποιεί τον άλλον αμέσως και δεν υπάρχει ενέργεια που να ξανακάνει εκκρεμές ένα αποδεκτό ή απορριφθέν αίτημα.',
      },
    },
    auditSubject: { param: 'connectionId', entityType: 'connection' },
    confirmLabel: { en: 'Answer request', el: 'Απάντηση αιτήματος' },
  },
  {
    id: 'create_milestone',
    kind: 'mutation',
    label: { en: 'Create a milestone', el: 'Δημιουργία ορόσημου' },
    description: {
      en: 'Add a milestone to the signed-in user’s list — the same rows the Milestones page tracks and the summary counts. Writes only after confirmation.',
      el: 'Προσθέτει ορόσημο στη λίστα του χρήστη — τις ίδιες εγγραφές που παρακολουθεί η σελίδα Ορόσημα και μετρά η σύνοψη. Γράφει μόνο μετά από επιβεβαίωση.',
    },
    params: [
      {
        name: 'title',
        type: 'string',
        required: true,
        description: {
          en: 'What the milestone is, e.g. "Close pre-seed round".',
          el: 'Τι είναι το ορόσημο, π.χ. «Κλείσιμο pre-seed γύρου».',
        },
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: {
          en: 'More detail on what done looks like.',
          el: 'Περισσότερες λεπτομέρειες για το τι σημαίνει ολοκληρωμένο.',
        },
      },
      {
        name: 'dueDate',
        type: 'string',
        required: false,
        description: {
          en: 'Deadline as an ISO date, e.g. "2026-06-01".',
          el: 'Προθεσμία σε ISO μορφή, π.χ. «2026-06-01».',
        },
      },
      {
        name: 'priority',
        type: 'string',
        required: false,
        enumValues: ['low', 'medium', 'high'],
        description: {
          en: 'How urgent it is. Defaults to the product’s normal priority.',
          el: 'Πόσο επείγον είναι. Αν παραλειφθεί ισχύει η κανονική προτεραιότητα.',
        },
      },
    ],
    writes: true,
    invalidates: ['milestones'],
    reversal: {
      // `DELETE /milestones/:id` removes the row, and the executor hands back
      // the id it created — the undo deletes that exact milestone, not one
      // that happens to share a title.
      kind: 'full',
      explanation: {
        en: 'Fully reversible. Deleting the milestone that was just created removes the row entirely; nobody else is notified either way.',
        el: 'Πλήρως αναστρέψιμο. Η διαγραφή του ορόσημου που μόλις δημιουργήθηκε αφαιρεί εντελώς την εγγραφή· δεν ειδοποιείται κανείς.',
      },
    },
    auditSubject: { param: 'title', entityType: 'milestone' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Create milestone', el: 'Δημιουργία ορόσημου' },
  },
  {
    id: 'update_milestone_status',
    kind: 'mutation',
    label: { en: 'Update a milestone’s status', el: 'Ενημέρωση κατάστασης ορόσημου' },
    description: {
      en: 'Move one of the signed-in user’s milestones to a new status — start it, block it, complete it or cancel it. The milestone can be named by id from a prior read, or by exact title.',
      el: 'Μετακινεί ένα ορόσημο του χρήστη σε νέα κατάσταση — έναρξη, εμπόδιο, ολοκλήρωση ή ακύρωση. Το ορόσημο δίνεται με id από προηγούμενη ανάγνωση ή με ακριβή τίτλο.',
    },
    params: [
      {
        name: 'status',
        type: 'string',
        required: true,
        enumValues: ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'],
        description: {
          en: 'The status to move it to.',
          el: 'Η κατάσταση προορισμού.',
        },
      },
      {
        name: 'milestoneId',
        type: 'string',
        required: false,
        description: {
          en: 'Id of the milestone, from a prior read of your milestones.',
          el: 'Το id του ορόσημου, από προηγούμενη ανάγνωση των ορόσημων.',
        },
      },
      {
        name: 'title',
        type: 'string',
        required: false,
        description: {
          en: 'Exact milestone title, used when the id is not known.',
          el: 'Ακριβής τίτλος ορόσημου, όταν δεν είναι γνωστό το id.',
        },
      },
    ],
    writes: true,
    invalidates: ['milestones'],
    reversal: {
      // The executor reads the milestone first and hands the status it moved
      // away from back as `undo.fromStatus`, so the undo restores where it
      // actually was rather than guessing a default.
      kind: 'full',
      explanation: {
        en: 'Fully reversible. The status it had is read before the move and the undo sets exactly that back.',
        el: 'Πλήρως αναστρέψιμο. Η προηγούμενη κατάσταση διαβάζεται πριν τη μετακίνηση και η αναίρεση την επαναφέρει ακριβώς.',
      },
    },
    auditSubject: { param: 'milestoneId', entityType: 'milestone' },
    confirmLabel: { en: 'Update status', el: 'Ενημέρωση κατάστασης' },
  },
  {
    id: 'rsvp_event',
    kind: 'mutation',
    label: { en: 'RSVP to an event', el: 'Δήλωση συμμετοχής σε εκδήλωση' },
    description: {
      en: 'Set the signed-in user’s RSVP on an event — going, interested or not going. The event can be named by id from a prior read, or by exact title.',
      el: 'Ορίζει τη συμμετοχή του χρήστη σε εκδήλωση — θα πάω, ενδιαφέρομαι ή δεν θα πάω. Η εκδήλωση δίνεται με id από προηγούμενη ανάγνωση ή με ακριβή τίτλο.',
    },
    params: [
      {
        name: 'status',
        type: 'string',
        required: true,
        enumValues: ['going', 'interested', 'not_going'],
        description: {
          en: 'The RSVP to set.',
          el: 'Η συμμετοχή που θα οριστεί.',
        },
      },
      {
        name: 'eventId',
        type: 'string',
        required: false,
        description: {
          en: 'Id of the event, from a prior read of events.',
          el: 'Το id της εκδήλωσης, από προηγούμενη ανάγνωση εκδηλώσεων.',
        },
      },
      {
        name: 'eventTitle',
        type: 'string',
        required: false,
        description: {
          en: 'Exact event title, used when the id is not known.',
          el: 'Ακριβής τίτλος εκδήλωσης, όταν δεν είναι γνωστό το id.',
        },
      },
    ],
    writes: true,
    invalidates: ['events'],
    reversal: {
      // The RSVP route upserts — it cannot remove a row. The undo writes back
      // the status read before the change, and `not_going` where there was no
      // RSVP at all: the row remains, which is why this is partial.
      kind: 'partial',
      explanation: {
        en: 'Restores the RSVP you had before, or marks you as not going when there was none — the RSVP record itself cannot be deleted, only set back.',
        el: 'Επαναφέρει τη συμμετοχή που είχες πριν, ή σε δηλώνει ως μη συμμετέχοντα αν δεν υπήρχε — η εγγραφή συμμετοχής δεν διαγράφεται, μόνο επαναφέρεται.',
      },
    },
    auditSubject: { param: 'eventId', entityType: 'event' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Set RSVP', el: 'Ορισμός συμμετοχής' },
  },
  {
    id: 'create_event',
    kind: 'mutation',
    label: { en: 'Create an event', el: 'Δημιουργία εκδήλωσης' },
    description: {
      en: 'Publish an event on the platform — meetup, webinar, workshop, demo day or networking — visible to members the moment it is created. Writes only after confirmation.',
      el: 'Δημοσιεύει εκδήλωση στην πλατφόρμα — meetup, webinar, workshop, demo day ή networking — ορατή στα μέλη μόλις δημιουργηθεί. Γράφει μόνο μετά από επιβεβαίωση.',
    },
    params: [
      {
        name: 'title',
        type: 'string',
        required: true,
        description: {
          en: 'Event title, 2–120 characters.',
          el: 'Τίτλος εκδήλωσης, 2–120 χαρακτήρες.',
        },
      },
      {
        name: 'startAt',
        type: 'string',
        required: true,
        description: {
          en: 'Start date and time in ISO 8601, e.g. "2026-06-10T18:00:00+03:00".',
          el: 'Ημερομηνία και ώρα έναρξης σε ISO 8601, π.χ. «2026-06-10T18:00:00+03:00».',
        },
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        enumValues: ['meetup', 'webinar', 'workshop', 'demo_day', 'networking', 'other'],
        description: {
          en: 'What kind of event it is. Defaults to networking.',
          el: 'Είδος εκδήλωσης. Αν παραλειφθεί, θεωρείται networking.',
        },
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        description: {
          en: 'What the event is about, up to 5000 characters.',
          el: 'Περί τίνος πρόκειται, έως 5000 χαρακτήρες.',
        },
      },
      {
        name: 'location',
        type: 'string',
        required: false,
        description: {
          en: 'Where it happens, e.g. a venue or city. Leave out for online events.',
          el: 'Πού γίνεται, π.χ. χώρος ή πόλη. Παραλείπεται για online.',
        },
      },
      {
        name: 'isOnline',
        type: 'boolean',
        required: false,
        description: {
          en: 'True when the event is held online.',
          el: 'True όταν η εκδήλωση γίνεται online.',
        },
      },
      {
        name: 'endAt',
        type: 'string',
        required: false,
        description: {
          en: 'End date and time in ISO 8601.',
          el: 'Ημερομηνία και ώρα λήξης σε ISO 8601.',
        },
      },
    ],
    writes: true,
    invalidates: ['events'],
    reversal: {
      // EventsController has create, list, get and rsvp — no update and no
      // delete. Once published the event is visible to members and nothing
      // the client can call takes it down.
      kind: 'none',
      explanation: {
        en: 'Not reversible. There is no endpoint that updates or removes an event — once created it is listed for members, so check the details before confirming.',
        el: 'Δεν αναιρείται. Δεν υπάρχει endpoint που να ενημερώνει ή να αφαιρεί εκδήλωση — μόλις δημιουργηθεί εμφανίζεται στα μέλη, οπότε έλεγξε τα στοιχεία πριν επιβεβαιώσεις.',
      },
    },
    auditSubject: { param: 'title', entityType: 'event' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Publish event', el: 'Δημοσίευση εκδήλωσης' },
  },
  {
    id: 'canvas_command',
    kind: 'mutation',
    label: { en: 'Run a research canvas command', el: 'Εντολή στον καμβά έρευνας' },
    description: {
      en: 'Perform one canvas step the founder could also click: add a note, capture a question or hypothesis, connect, align, group, style, format note text (bold, lists, find/replace, citation, word count), merge or split notes, export, or link a node to Builder, Readiness or milestones. The open canvas runs it live; otherwise the user is taken to Research so the same step can land.',
      el: 'Εκτελεί ένα βήμα του καμβά που ο ιδρυτής θα μπορούσε και να πατήσει: σημείωση, ερώτηση ή υπόθεση, σύνδεση, στοίχιση, ομάδα, στυλ, μορφοποίηση κειμένου σημείωσης (έντονα, λίστες, εύρεση/αντικατάσταση, παραπομπή, πλήθος λέξεων), ένωση ή διαίρεση σημειώσεων, εξαγωγή, ή σύνδεση κόμβου με Builder, Ετοιμότητα ή ορόσημα. Ο ανοιχτός καμβάς το τρέχει ζωντανά· αλλιώς ο χρήστης πηγαίνει στην Έρευνα ώστε το ίδιο βήμα να εφαρμοστεί.',
    },
    params: [
      {
        name: 'op',
        type: 'string',
        required: true,
        enumValues: CANVAS_COMMAND_OPS,
        description: {
          en: 'Which canvas step to run. Same ids the toolbar uses.',
          el: 'Ποιο βήμα καμβά θα τρέξει. Τα ίδια id με την εργαλειοθήκη.',
        },
      },
      {
        name: 'boardId',
        type: 'string',
        required: false,
        description: {
          en: 'Research board to act on, when the user is not already on one.',
          el: 'Πίνακας έρευνας, όταν ο χρήστης δεν είναι ήδη σε έναν.',
        },
      },
      {
        name: 'title',
        type: 'string',
        required: false,
        description: {
          en: 'Title for a new note, or the note to select / connect from.',
          el: 'Τίτλος νέας σημείωσης, ή της σημείωσης προς επιλογή / σύνδεση.',
        },
      },
      {
        name: 'content',
        type: 'string',
        required: false,
        description: {
          en: 'Body text for a new note.',
          el: 'Κείμενο σώματος για νέα σημείωση.',
        },
      },
      {
        name: 'nodeType',
        type: 'string',
        required: false,
        description: {
          en: 'For capture: question, hypothesis, evidence or insight. For convert_type, the target type.',
          el: 'Για καταγραφή: question, hypothesis, evidence ή insight. Για convert_type, ο τύπος-στόχος.',
        },
      },
      {
        name: 'fromTitle',
        type: 'string',
        required: false,
        description: {
          en: 'Title of the node to connect from.',
          el: 'Τίτλος του κόμβου από τον οποίο ξεκινά η σύνδεση.',
        },
      },
      {
        name: 'toTitle',
        type: 'string',
        required: false,
        description: {
          en: 'Title of the node to connect to.',
          el: 'Τίτλος του κόμβου προς τον οποίο καταλήγει η σύνδεση.',
        },
      },
      {
        name: 'align',
        type: 'string',
        required: false,
        description: {
          en: 'Alignment: left, right, top, bottom, h (distribute horizontally) or v (vertically).',
          el: 'Στοίχιση: left, right, top, bottom, h (οριζόντια κατανομή) ή v (κάθετα).',
        },
      },
      {
        name: 'fill',
        type: 'string',
        required: false,
        description: {
          en: 'Fill colour for set_style, e.g. #FDE68A.',
          el: 'Χρώμα γεμίσματος για set_style, π.χ. #FDE68A.',
        },
      },
      {
        name: 'query',
        type: 'string',
        required: false,
        description: {
          en: 'Find query, replace text, note format (bold/italic/heading/…), layer name, zoom mode (in/out/reset), export format (json/outline/png), or layout algorithm.',
          el: 'Αναζήτηση, κείμενο αντικατάστασης, μορφή σημείωσης (bold/italic/heading/…), όνομα επιπέδου, zoom (in/out/reset), μορφή εξαγωγής (json/outline/png) ή αλγόριθμος διάταξης.',
        },
      },
      {
        name: 'href',
        type: 'string',
        required: false,
        description: {
          en: 'URL for insert_link, or a product path to link a node to (e.g. /builder or /readiness).',
          el: 'URL για insert_link, ή διαδρομή προϊόντος για σύνδεση κόμβου (π.χ. /builder ή /readiness).',
        },
      },
    ],
    writes: true,
    invalidates: ['research'],
    reversal: {
      // The live canvas has its own undo stack. Chat undo is handed the
      // original payload and never a snapshot, so it cannot restore nodes it
      // did not identify. Canvas undo (Ctrl+Z) is the honest reverse.
      kind: 'none',
      explanation: {
        en: 'The canvas keeps its own undo history. Chat cannot reverse a step it did not snapshot; use Undo on the board (Ctrl+Z) for the last move, alignment or style change.',
        el: 'Ο καμβάς κρατά τη δική του ιστορία αναίρεσης. Το chat δεν μπορεί να αντιστρέψει βήμα χωρίς στιγμιότυπο· χρησιμοποίησε Αναίρεση στον πίνακα (Ctrl+Z) για την τελευταία μετακίνηση, στοίχιση ή αλλαγή στυλ.',
      },
    },
    auditSubject: { param: 'op', entityType: 'research_canvas' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Run on canvas', el: 'Εκτέλεση στον καμβά' },
  },
] as const satisfies readonly ActionDeclaration[];

export type DeclaredAction = (typeof ACTION_DECLARATIONS)[number];

/** Every capability id, as a literal union rather than `string`. */
export type DeclaredActionId = DeclaredAction['id'];

/** The subset that changes something; the only ids that need an executor. */
export type MutationActionId = Extract<DeclaredAction, { kind: 'mutation' }>['id'];

/**
 * The subset that answers a question.
 *
 * Derived for the same reason `MutationActionId` is: the web app keys its
 * readers by it, so a read declared here and left unimplemented there stops
 * compiling rather than reaching a model that can ask for it and get nothing.
 */
export type ReadActionId = Extract<DeclaredAction, { kind: 'read' }>['id'];

/**
 * The subset that claims it can be taken back. An app that binds undos to
 * this type cannot claim reversibility without shipping the implementation,
 * which is the guarantee that survived moving the declaration out of the app.
 */
export type UndoableActionId = Extract<
  DeclaredAction,
  { reversal: { kind: 'full' | 'partial' } }
>['id'];

export function listActionIds(): readonly DeclaredActionId[] {
  return ACTION_DECLARATIONS.map((action) => action.id);
}

/**
 * Returns the widened shape, not the literal union member.
 *
 * `as const` gives the read actions no `reversal` key at all, so a consumer
 * that reads `spec.reversal?.kind` cannot dot into the union. The literal
 * types exist for deriving `MutationActionId` and `UndoableActionId`; every
 * other caller wants `ActionDeclaration`, where the optional fields are
 * optional rather than absent.
 */
export function listDeclarations(): readonly ActionDeclaration[] {
  return ACTION_DECLARATIONS;
}

export function getActionDeclaration(id: string): ActionDeclaration | undefined {
  return listDeclarations().find((action) => action.id === id);
}

/**
 * The server uses this to reject a tool name a model invented, rather than
 * trusting whatever arrived on the request.
 */
export function isDeclaredAction(id: string): id is DeclaredActionId {
  return ACTION_DECLARATIONS.some((action) => action.id === id);
}

/**
 * Derives the model-facing catalogue from the declarations.
 *
 * Both apps call this, so the tools a model is offered and the tools the
 * server will accept are the same list by construction rather than by review.
 */
export function toToolCatalog(): ToolCatalogEntry[] {
  // Widened on purpose. `as const` is there so ids and reversal kinds stay
  // literal for the apps, but it also narrows `params` to exactly the fields
  // the current entries happen to use — and none of them use `enumValues`
  // yet, so reading it off the literal type does not compile.
  const declarations: readonly ActionDeclaration[] = ACTION_DECLARATIONS;

  return declarations.map((action) => ({
    type: 'function' as const,
    function: {
      name: action.id,
      description: action.description.en,
      parameters: {
        type: 'object' as const,
        properties: Object.fromEntries(
          action.params.map((param) => [
            param.name,
            {
              type: param.type,
              description: param.description.en,
              ...(param.enumValues ? { enum: param.enumValues } : {}),
            },
          ]),
        ),
        required: action.params.filter((param) => param.required).map((param) => param.name),
      },
    },
  }));
}
