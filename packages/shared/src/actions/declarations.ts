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
    reversal: {
      // ConnectionsController exposes POST, GET, PATCH, block and status. The
      // PATCH is respondToRequest and throws ForbiddenException unless the
      // caller is the receiver, and sendRequest notifies the receiver before
      // it returns. The sender has no route to take it back.
      kind: 'none',
      explanation: {
        en: 'Cannot be undone. The recipient is notified as soon as it is sent, and only they can accept or decline it — there is no withdraw action for the sender.',
        el: 'Δεν αναιρείται. Ο παραλήπτης ειδοποιείται μόλις σταλεί και μόνο αυτός μπορεί να το αποδεχτεί ή να το απορρίψει — δεν υπάρχει ανάκληση για τον αποστολέα.',
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
    // that distinction is what the UI reads to decide whether to warn.
    writes: false,
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
    reversal: {
      // `undoAction` receives the original payload, never the outcome, so an
      // undo here has no handle on the workspace that was just made. Archiving
      // by name would be a guess, and the user may already own a workspace
      // with that name — the same reasoning that makes `start_or_send_message`
      // irreversible. Archiving stays a deliberate act in Builder.
      kind: 'none',
      explanation: {
        en: 'A new workspace is yours and empty, so nothing is lost by leaving it. It cannot be taken back automatically because the undo is given what was asked for, not what was created, and archiving by name could archive a workspace you already had. Archive it from Startup Builder when you want it gone.',
        el: 'Ο νέος χώρος είναι δικός σου και κενός, οπότε δεν χάνεται τίποτα αν μείνει. Δεν αναιρείται αυτόματα επειδή η αναίρεση λαμβάνει ό,τι ζητήθηκε, όχι ό,τι δημιουργήθηκε, και η αρχειοθέτηση βάσει ονόματος θα μπορούσε να αρχειοθετήσει χώρο που είχες ήδη. Αρχειοθέτησέ τον από το Startup Builder όποτε θέλεις.',
      },
    },
    auditSubject: { param: 'name', entityType: 'workspace' },
    navigatesOnSuccess: true,
    confirmLabel: { en: 'Create workspace', el: 'Δημιουργία χώρου' },
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
