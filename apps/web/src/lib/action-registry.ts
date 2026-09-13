import {
  getActionDeclaration,
  listDeclarations,
  toToolCatalog,
  type ActionDeclaration,
  type ActionOutcome,
  type MutationActionId,
  type UndoableActionId,
} from '@cofounderbay/shared';
import {
  getOrCreateDirectConversation,
  removeFromShortlist,
  saveToShortlist,
  sendConnectionRequest,
} from '@/lib/api';
import { PAGE_REGISTRY, getPageMeta } from '@/lib/page-registry';

/**
 * The web app's half of the capability contract.
 *
 * What each capability *is* — its bilingual copy, arguments, whether it writes
 * and whether it can be taken back — now lives in `@cofounderbay/shared`, so
 * the server can enforce the same list it offers a model instead of trusting
 * one assembled in the browser. What each capability *does* stays here,
 * because an executor closes over this app's API client and cannot cross a
 * package boundary as data.
 *
 * The binding is what keeps the two halves honest. `EXECUTORS` is keyed by
 * `MutationActionId` and `UNDOS` by `UndoableActionId`, both derived from the
 * declarations: declare a mutation and omit its executor, or claim `full`
 * reversibility and omit the undo, and this file stops compiling. That is the
 * same guarantee the discriminated union gave before the move, expressed
 * across the boundary rather than inside one object.
 */

export type { ActionOutcome };
export { toToolCatalog };

type Executor = (payload: Record<string, unknown>) => Promise<ActionOutcome>;

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload?.[key];
  return typeof value === 'string' ? value : '';
}

/** Exhaustive over every declared mutation. Adding one without an arm fails to compile. */
const EXECUTORS: Record<MutationActionId, Executor> = {
  navigate: async (payload) => ({
    ok: true,
    href: requireString(payload, 'href') || '/dashboard',
  }),

  shortlist_add: async (payload) => {
    const userId = requireString(payload, 'userId');
    if (!userId) return { ok: false, error: 'Missing user' };
    await saveToShortlist(userId);
    return { ok: true, href: '/shortlist' };
  },

  send_connection: async (payload) => {
    const receiverId = requireString(payload, 'receiverId');
    if (!receiverId) return { ok: false, error: 'Missing receiver' };
    const message = typeof payload?.message === 'string' ? payload.message : undefined;
    await sendConnectionRequest({ receiverId, message });
    return { ok: true };
  },

  start_or_send_message: async (payload) => {
    const userId = requireString(payload, 'userId');
    if (!userId) return { ok: false, error: 'Missing user' };
    const { conversationId } = await getOrCreateDirectConversation(userId);
    return { ok: true, href: `/messages?c=${conversationId}` };
  },
};

/**
 * Exhaustive over every declaration that claims `full` or `partial`
 * reversibility — which today is `shortlist_add` alone, because a connection
 * request has no sender-side withdraw route and a direct conversation cannot
 * be deleted.
 */
const UNDOS: Record<UndoableActionId, Executor> = {
  shortlist_add: async (payload) => {
    const userId = requireString(payload, 'userId');
    if (!userId) return { ok: false, error: 'Missing user' };
    await removeFromShortlist(userId);
    return { ok: true, href: '/shortlist' };
  },
};

export function listActions(): readonly ActionDeclaration[] {
  return listDeclarations();
}

export function getActionSpec(id: string): ActionDeclaration | undefined {
  return getActionDeclaration(id);
}

/** True when confirming this action performs work in this app. */
export function canExecute(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(EXECUTORS, id);
}

/** True when the action declares an undo the UI can actually offer. */
export function isUndoable(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(UNDOS, id);
}

/**
 * Runs a declared action. Returns `Unsupported action` for a read tool or an
 * unknown id, the way the hand-written chain this replaced did — the read
 * tools are executed inside `runCopilotTurn`, which composes their prose
 * answer, so they have nothing to run here.
 */
export async function executeAction(
  id: string,
  payload: Record<string, unknown>,
): Promise<ActionOutcome> {
  const execute = (EXECUTORS as Record<string, Executor | undefined>)[id];
  if (!execute) return { ok: false, error: 'Unsupported action' };

  try {
    return await execute(payload);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Action failed' };
  }
}

/**
 * Takes back an action that declared it could be taken back.
 *
 * Refuses anything else rather than attempting a best-effort guess, because
 * the cases that declare `none` are exactly the ones where a guess would do
 * damage: withdrawing an intro is not the sender's to perform, and archiving a
 * conversation the assistant may not have created would remove something the
 * user already had.
 */
export async function undoAction(
  id: string,
  payload: Record<string, unknown>,
): Promise<ActionOutcome> {
  const undo = (UNDOS as Record<string, Executor | undefined>)[id];
  if (!undo) return { ok: false, error: 'Not reversible' };

  try {
    return await undo(payload);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Undo failed' };
  }
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
