import {
  getOrCreateDirectConversation,
  removeFromShortlist,
  saveToShortlist,
  sendConnectionRequest,
} from '@/lib/api';
import { PAGE_REGISTRY, getPageMeta } from '@/lib/page-registry';
import type { CopilotToolName } from '@/lib/copilot-types';
import type { BilingualPair } from '@/lib/i18n/types';

/**
 * One declaration per thing the assistant can do.
 *
 * Before this, a capability existed in four disconnected places: a name in
 * `CopilotToolName`, a keyword branch in `copilot-planner`, a proposal builder
 * inside `runCopilotTurn`, and an arm of the `if` chain in
 * `executeCopilotAction`. Nothing tied them together, so the tool catalogue the
 * model would need could not be derived, and the platform inventory
 * (155 routes, 499 endpoints, 3672 interactive surfaces) had no way to say
 * which of them the assistant could reach. It reached four.
 *
 * This module is the single place a capability is described: what it is called
 * in both languages, what arguments it takes, whether running it writes, and
 * how the user takes it back. The AI tool catalogue, the executor dispatch and
 * the coverage tests are all derived from it, so a capability cannot be added
 * to one and missing from another.
 *
 * Scope note: this wave moves the eight existing tools onto the registry
 * without changing what any of them do. It deliberately does not add new
 * mutations -- that needs the confirm/undo pipeline first.
 */

export type ActionParamType = 'string' | 'number' | 'boolean';

export type ActionParam = {
  name: string;
  type: ActionParamType;
  required: boolean;
  /** Shown to the user in help surfaces; the `en` half is what the model sees. */
  description: BilingualPair;
  /** Constrains the model's output when the argument is a closed set. */
  enumValues?: readonly string[];
};

/** `read` answers a question; `mutation` changes something the user owns. */
export type ActionKind = 'read' | 'mutation';

export type ActionOutcome = { ok: boolean; href?: string; error?: string };

/**
 * What taking an action back actually costs, verified against the API rather
 * than asserted in prose.
 *
 * This started as a single bilingual string, and the first thing that happened
 * was that it carried a false claim: `send_connection` said the request "can be
 * withdrawn" in Connections. It cannot. `ConnectionsController` exposes only
 * POST, GET, PATCH and block; the PATCH is `respondToRequest`, which throws
 * `ForbiddenException` unless the caller is the *receiver*, and the receiver is
 * notified the moment the request is created. There is no withdraw route for
 * the sender at all.
 *
 * So the shape is a discriminated union: claiming `full` or `partial` requires
 * handing over the function that performs the undo. A claim cannot compile
 * without its implementation, which is the only way this stays true as the
 * registry grows.
 */
export type ActionReversal =
  | {
      kind: 'none';
      explanation: BilingualPair;
      undo?: never;
    }
  | {
      kind: 'full' | 'partial';
      explanation: BilingualPair;
      undo: (payload: Record<string, unknown>) => Promise<ActionOutcome>;
    };

export type ActionSpec = {
  id: CopilotToolName;
  kind: ActionKind;
  label: BilingualPair;
  description: BilingualPair;
  params: readonly ActionParam[];
  /**
   * True when a confirmed run reaches a write endpoint. `navigate` is a
   * mutation of where the user is, not of their data, so it is false there --
   * the distinction is what lets the UI decide whether to warn.
   */
  writes: boolean;
  /** Every mutation states this, including when the answer is "it cannot be undone". */
  reversal?: ActionReversal;
  /** The label on the confirm control. Mutations only. */
  confirmLabel?: BilingualPair;
  /**
   * Present only where confirming performs the work. The read tools are
   * executed inside `runCopilotTurn`, which composes their prose answer, so
   * they have nothing to run here.
   */
  execute?: (payload: Record<string, unknown>) => Promise<ActionOutcome>;
};

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload?.[key];
  return typeof value === 'string' ? value : '';
}

export const ACTION_REGISTRY: readonly ActionSpec[] = [
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
    execute: async (payload) => ({
      ok: true,
      href: requireString(payload, 'href') || '/dashboard',
    }),
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
      // row is really gone and nobody else was notified. Fully reversible.
      kind: 'full',
      explanation: {
        en: 'Fully reversible. Removing them deletes the saved entry, and nobody is notified either way.',
        el: 'Πλήρως αναστρέψιμο. Η αφαίρεση διαγράφει την αποθηκευμένη εγγραφή και δεν ειδοποιείται κανείς σε καμία περίπτωση.',
      },
      undo: async (payload) => {
        const userId = requireString(payload, 'userId');
        if (!userId) return { ok: false, error: 'Missing user' };
        await removeFromShortlist(userId);
        return { ok: true, href: '/shortlist' };
      },
    },
    confirmLabel: { en: 'Save to shortlist', el: 'Αποθήκευση στη λίστα' },
    execute: async (payload) => {
      const userId = requireString(payload, 'userId');
      if (!userId) return { ok: false, error: 'Missing user' };
      await saveToShortlist(userId);
      return { ok: true, href: '/shortlist' };
    },
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
      // Verified against ConnectionsController: POST, GET, PATCH, block and
      // status. The PATCH is respondToRequest and throws ForbiddenException
      // unless the caller is the receiver, and sendRequest notifies the
      // receiver before it returns. The sender has no route to take it back.
      kind: 'none',
      explanation: {
        en: 'Cannot be undone. The recipient is notified as soon as it is sent, and only they can accept or decline it — there is no withdraw action for the sender.',
        el: 'Δεν αναιρείται. Ο παραλήπτης ειδοποιείται μόλις σταλεί και μόνο αυτός μπορεί να το αποδεχτεί ή να το απορρίψει — δεν υπάρχει ανάκληση για τον αποστολέα.',
      },
    },
    confirmLabel: { en: 'Send intro', el: 'Αποστολή σύστασης' },
    execute: async (payload) => {
      const receiverId = requireString(payload, 'receiverId');
      if (!receiverId) return { ok: false, error: 'Missing receiver' };
      const message = typeof payload?.message === 'string' ? payload.message : undefined;
      await sendConnectionRequest({ receiverId, message });
      return { ok: true };
    },
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
      // it found an existing thread or created one. So an undo could not tell
      // "we made this" from "this was already the user's thread", and
      // archiving the latter would destroy something the assistant never
      // created. Nothing is claimed until the API reports which happened.
      kind: 'none',
      explanation: {
        en: 'No message is sent, so there is nothing for the other person to read. The thread itself cannot be removed, and the API does not report whether it was created now or already existed.',
        el: 'Δεν στέλνεται μήνυμα, άρα ο άλλος δεν έχει κάτι να διαβάσει. Το νήμα δεν μπορεί να αφαιρεθεί και το API δεν αναφέρει αν δημιουργήθηκε τώρα ή υπήρχε ήδη.',
      },
    },
    confirmLabel: { en: 'Open thread', el: 'Άνοιγμα νήματος' },
    execute: async (payload) => {
      const userId = requireString(payload, 'userId');
      if (!userId) return { ok: false, error: 'Missing user' };
      const { conversationId } = await getOrCreateDirectConversation(userId);
      return { ok: true, href: `/messages?c=${conversationId}` };
    },
  },
] as const;

export function listActions(): readonly ActionSpec[] {
  return ACTION_REGISTRY;
}

export function getActionSpec(id: string): ActionSpec | undefined {
  return ACTION_REGISTRY.find((action) => action.id === id);
}

/**
 * Runs a registry action. Mirrors what `executeCopilotAction` did by hand,
 * including returning `Unsupported action` for an id that carries no executor,
 * so the read tools keep answering the way callers already expect.
 */
export async function executeAction(
  id: string,
  payload: Record<string, unknown>,
): Promise<ActionOutcome> {
  const spec = getActionSpec(id);
  if (!spec?.execute) return { ok: false, error: 'Unsupported action' };

  try {
    return await spec.execute(payload);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Action failed' };
  }
}

/** True when the action declares an undo the UI can actually offer. */
export function isUndoable(id: string): boolean {
  const reversal = getActionSpec(id)?.reversal;
  return reversal?.kind === 'full' || reversal?.kind === 'partial';
}

/**
 * Takes back an action that declared it could be taken back.
 *
 * Refuses anything whose reversal is `none` rather than attempting a
 * best-effort guess, because the two `none` cases here are exactly the ones
 * where a guess would do damage: withdrawing an intro is not the sender's to
 * perform, and archiving a conversation the assistant may not have created
 * would remove something the user already had.
 */
export async function undoAction(
  id: string,
  payload: Record<string, unknown>,
): Promise<ActionOutcome> {
  const reversal = getActionSpec(id)?.reversal;
  if (!reversal || reversal.kind === 'none' || !reversal.undo) {
    return { ok: false, error: 'Not reversible' };
  }

  try {
    return await reversal.undo(payload);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Undo failed' };
  }
}

/** An entry in the catalogue handed to a model that supports function calling. */
export type ToolCatalogEntry = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: ActionParamType; description: string; enum?: readonly string[] }>;
      required: string[];
    };
  };
};

/**
 * Derives the model-facing catalogue from the registry.
 *
 * `ollama.service.ts` currently sends only `model`, `messages` and `options`,
 * so no model in this product has ever been offered a tool. This is the payload
 * that changes that, and deriving it here means the catalogue cannot drift from
 * what the executor will actually accept.
 */
export function toToolCatalog(): ToolCatalogEntry[] {
  return ACTION_REGISTRY.map((action) => ({
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

export type RouteTarget = { href: string; label: string; labelEl?: string };

/**
 * Resolves a destination for `navigate` against the whole page registry.
 *
 * `copilot-planner` matches 18 hand-written aliases, so 137 of the product's
 * 155 routes were unreachable by name even though `PAGE_REGISTRY` already
 * carries a bilingual title and description for every one of them. This reads
 * that registry instead of a second list, and the planner consults it only
 * after its own aliases miss, so every phrase that resolved before still
 * resolves to the same route.
 *
 * Longest title first, so "founder dashboard" is not captured by "dashboard".
 *
 * Resolution goes through `getPageMeta` rather than reading `PAGE_REGISTRY`
 * entries directly: only 2 of the ~100 entries spell `titleEl` inline, and the
 * other Greek titles live in `strings-pages.ts` and are merged in by that
 * function. Reading the raw array made every Greek phrase unresolvable.
 */
export function resolveRouteTarget(message: string): RouteTarget | undefined {
  const haystack = message.toLowerCase();

  const candidates = PAGE_REGISTRY.map((page) => getPageMeta(page.path) ?? page)
    .filter((page) => page.status !== 'scaffold')
    .flatMap((page) => {
      const names: Array<{ name: string; label: string; labelEl?: string }> = [
        { name: page.title.toLowerCase(), label: page.title, labelEl: page.titleEl },
      ];
      if (page.titleEl) {
        names.push({ name: page.titleEl.toLowerCase(), label: page.title, labelEl: page.titleEl });
      }
      return names.map((entry) => ({ ...entry, href: page.path }));
    })
    // A dynamic segment cannot be navigated to without an id, so it is not a
    // destination the assistant can offer from a phrase alone.
    .filter((entry) => !entry.href.includes('[') && entry.name.length >= 4)
    .sort((a, b) => b.name.length - a.name.length);

  const hit = candidates.find((entry) => haystack.includes(entry.name));
  return hit ? { href: hit.href, label: hit.label, labelEl: hit.labelEl } : undefined;
}
