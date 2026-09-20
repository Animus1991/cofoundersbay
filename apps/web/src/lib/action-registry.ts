import {
  getActionDeclaration,
  listDeclarations,
  toToolCatalog,
  isCanvasCommandOp,
  type ActionDeclaration,
  type ActionOutcome,
  type MutationActionId,
  type UndoableActionId,
} from '@cofounderbay/shared';
import {
  assessReadiness,
  getOrCreateDirectConversation,
  removeFromShortlist,
  saveToShortlist,
  sendConnectionRequest,
  updateReadinessCriterion,
} from '@/lib/api';
import { createWorkspace } from '@/lib/builder-api';
import { isPreviewDemo } from '@/lib/preview-demo';
import { demoCriterionState, toggleDemoCriterion } from '@/lib/readiness-demo';
import { PAGE_REGISTRY, getPageMeta } from '@/lib/page-registry';
import { runCanvasCommand } from '@/lib/canvas/canvas-command-bus';

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

/**
 * The workspace the Readiness page itself works on.
 *
 * `/readiness` resolves its workspace from this one key and nothing else, so
 * reading the same key is what keeps a tool the assistant runs and a box the
 * user clicks pointed at the same scores. When it is empty the page shows its
 * "create or select a workspace" card — which is why `workspace_create` writes
 * the key back below, instead of leaving the user to select by hand what the
 * assistant just made for them.
 */
const WORKSPACE_KEY = 'cfb_default_workspace';

function currentWorkspaceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(WORKSPACE_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

const READINESS_DIMENSIONS = ['team', 'market', 'product', 'business', 'funding', 'execution'];

/**
 * Writes one readiness criterion after checking it is not already there.
 *
 * The check is the reason `undo` is safe to offer. `undoAction` is handed the
 * original payload and never the outcome, so an undo can only set the
 * criterion to the opposite of what was asked. If the box had already been
 * ticked by the user, running the tool would be a no-op and *undoing* it would
 * clear something the assistant never set. Refusing the no-op closes that gap,
 * and costs one request the page makes on load anyway.
 */
async function writeCriterion(
  payload: Record<string, unknown>,
  completed: boolean,
): Promise<ActionOutcome> {
  const dimension = requireString(payload, 'dimension');
  if (!READINESS_DIMENSIONS.includes(dimension)) return { ok: false, error: 'Unknown readiness dimension' };

  const criterionId = requireString(payload, 'criterionId');
  if (!criterionId) return { ok: false, error: 'Missing criterion' };

  // The showcase keeps its own criteria and its own session overlay, and it is
  // the whole page a visitor without an account ever sees. Refusing here would
  // have made the assistant a narrator of a page it could not touch — and it
  // has no workspace to reach for, by design.
  if (isPreviewDemo()) {
    const current = demoCriterionState(dimension, criterionId);
    if (current === undefined) return { ok: false, error: 'That criterion is not part of this dimension' };
    if (current === completed) {
      return {
        ok: false,
        error: completed ? 'That criterion is already met' : 'That criterion is already clear',
      };
    }
    toggleDemoCriterion(dimension, criterionId, completed);
    notifyReadinessChanged();
    return { ok: true, href: '/readiness' };
  }

  const workspaceId = currentWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: 'No workspace selected. Create one first, then tick criteria.' };
  }

  const { assessment } = await assessReadiness({ workspaceId });
  const score = assessment.dimensions.find((entry) => entry.dimension === dimension);
  const criterion = score?.criteria?.find((entry) => entry.id === criterionId);
  if (!criterion) return { ok: false, error: 'That criterion is not part of this dimension' };
  if (criterion.completed === completed) {
    return {
      ok: false,
      error: completed ? 'That criterion is already met' : 'That criterion is already clear',
    };
  }

  await updateReadinessCriterion(workspaceId, { dimension, criterionId, completed });
  notifyReadinessChanged();
  return { ok: true, href: '/readiness' };
}

/**
 * Tells an open Readiness page that its scores are stale.
 *
 * The page owns its React Query cache and an executor cannot reach it, so
 * without this a criterion ticked from the assistant would be saved on the
 * server and invisible on screen until a manual refresh. The `cfb:` window
 * event is the convention the rest of the app already uses for this
 * (`cfb:login`, `cfb:api-online`, `cfb:sidebar-mode`).
 */
function notifyReadinessChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('cfb:readiness-updated'));
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

  shortlist_remove: async (payload) => {
    const userId = requireString(payload, 'userId');
    if (!userId) return { ok: false, error: 'Missing user' };
    await removeFromShortlist(userId);
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

  readiness_tick_criterion: async (payload) =>
    writeCriterion(payload, payload?.completed !== false),

  analytics_set_period: async (payload) => {
    const period = requireString(payload, 'period');
    if (!ANALYTICS_PERIODS.includes(period)) return { ok: false, error: 'Unknown period' };
    return { ok: true, href: `/analytics?period=${period}` };
  },

  workspace_create: async (payload) => {
    // The showcase has readiness without a workspace, and no account to hang
    // one on. Saying so is truer than reaching for an endpoint that will
    // refuse the request, or than reporting success for nothing.
    if (isPreviewDemo()) {
      return { ok: false, error: 'The demo showcase already has a workspace. Sign in to create your own.' };
    }

    const name = requireString(payload, 'name').trim();
    if (!name) return { ok: false, error: 'Missing workspace name' };
    // The API caps the name at 100 characters and rejects the whole request
    // over it, which would read to the user as the assistant failing rather
    // than as a name being too long.
    if (name.length > 100) return { ok: false, error: 'Workspace name is too long (100 characters)' };

    const description = requireString(payload, 'description').trim() || undefined;
    const startupName = requireString(payload, 'startupName').trim() || undefined;
    const workspace = await createWorkspace({ name, description, startupName });
    if (!workspace?.id) return { ok: false, error: 'Workspace was not created' };

    // Selecting it is the half that makes this useful: `/readiness` reads this
    // key alone, so a workspace created and left unselected would leave the
    // page showing the same empty card it showed before.
    try {
      window.localStorage.setItem(WORKSPACE_KEY, workspace.id);
    } catch {
      // A blocked storage write is not a failed creation — the workspace
      // exists, and Builder can select it. Saying `ok` here and sending the
      // user to Builder is truer than reporting the write as failed.
      return { ok: true, href: '/builder' };
    }
    notifyReadinessChanged();
    return { ok: true, href: '/readiness' };
  },

  canvas_command: async (payload) => {
    const op = requireString(payload, 'op');
    if (!isCanvasCommandOp(op)) return { ok: false, error: 'Unknown canvas command' };
    return runCanvasCommand(op, payload);
  },
};

const ANALYTICS_PERIODS = ['7d', '14d', '30d', '90d'];

/**
 * Exhaustive over every declaration that claims `full` or `partial`
 * reversibility — shortlist add/remove are the fully reversible pair, because
 * a connection request has no sender-side withdraw route and a direct
 * conversation cannot be deleted.
 */
const UNDOS: Record<UndoableActionId, Executor> = {
  shortlist_add: async (payload) => {
    const userId = requireString(payload, 'userId');
    if (!userId) return { ok: false, error: 'Missing user' };
    await removeFromShortlist(userId);
    return { ok: true, href: '/shortlist' };
  },

  shortlist_remove: async (payload) => {
    const userId = requireString(payload, 'userId');
    if (!userId) return { ok: false, error: 'Missing user' };
    await saveToShortlist(userId);
    return { ok: true, href: '/shortlist' };
  },

  // Sets the criterion back to where it was. `writeCriterion` refuses a no-op
  // on the way in, so the box this clears is always one the assistant ticked,
  // and it refuses again here if the user has since changed it by hand.
  readiness_tick_criterion: async (payload) =>
    writeCriterion(payload, payload?.completed === false),

  // Returns the page to the window it opens on. Declared `partial` for exactly
  // this reason: the payload says which window was asked for, never which one
  // was open before.
  analytics_set_period: async () => ({ ok: true, href: '/analytics' }),
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
