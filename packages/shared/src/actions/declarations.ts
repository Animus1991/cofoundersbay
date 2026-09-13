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
    confirmLabel: { en: 'Open thread', el: 'Άνοιγμα νήματος' },
  },
] as const satisfies readonly ActionDeclaration[];

export type DeclaredAction = (typeof ACTION_DECLARATIONS)[number];

/** Every capability id, as a literal union rather than `string`. */
export type DeclaredActionId = DeclaredAction['id'];

/** The subset that changes something; the only ids that need an executor. */
export type MutationActionId = Extract<DeclaredAction, { kind: 'mutation' }>['id'];

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
