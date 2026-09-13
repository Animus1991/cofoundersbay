import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOrCreateDirectConversation,
  removeFromShortlist,
  saveToShortlist,
  sendConnectionRequest,
} from '@/lib/api';
import { ACTION_DECLARATIONS, listActionIds } from '@cofounderbay/shared';
import {
  canExecute,
  executeAction,
  getActionSpec,
  isUndoable,
  listActions,
  resolveRouteTarget,
  toToolCatalog,
  undoAction,
} from './action-registry';
import { detectNavigateHref } from './copilot-planner';
import { PAGE_REGISTRY } from './page-registry';

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  sendConnectionRequest: vi.fn(),
  getOrCreateDirectConversation: vi.fn(),
  saveToShortlist: vi.fn(),
  removeFromShortlist: vi.fn(),
}));

const sendConnection = vi.mocked(sendConnectionRequest);
const openThread = vi.mocked(getOrCreateDirectConversation);
const shortlist = vi.mocked(saveToShortlist);
const unshortlist = vi.mocked(removeFromShortlist);

/**
 * Reads the union members straight out of the type file, so adding a name to
 * `CopilotToolName` without a registry entry fails here rather than at runtime
 * when the model asks for it.
 */
function unionMembers(source: string, name: string): string[] {
  const declaration = new RegExp(`export type ${name} =([\\s\\S]*?);`).exec(source);
  if (!declaration) throw new Error(`Could not find "export type ${name}"`);
  return [...declaration[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

const TYPES_SOURCE = readFileSync('src/lib/copilot-types.ts', 'utf8');
const PLANNER_SOURCE = readFileSync('src/lib/copilot-planner.ts', 'utf8');

/** The alias table as it is actually written, so the test cannot drift from it. */
const ALIASES = [...PLANNER_SOURCE.matchAll(/\{\s*keys:\s*\[([^\]]*)\],\s*href:\s*'([^']+)'/g)].map(
  (match) => ({
    keys: [...match[1].matchAll(/'([^']+)'/g)].map((k) => k[1]),
    href: match[2],
  }),
);

beforeEach(() => {
  sendConnection.mockReset();
  openThread.mockReset();
  shortlist.mockReset();
  unshortlist.mockReset();
});

describe('action registry coverage', () => {
  it('carries an entry for every declared copilot tool', () => {
    const declared = unionMembers(TYPES_SOURCE, 'CopilotToolName');
    expect(declared.length).toBeGreaterThan(0);

    const missing = declared.filter((name) => !getActionSpec(name));
    expect(missing).toEqual([]);
  });

  it('marks every tool the union calls an action as a runnable mutation', () => {
    // `CopilotActionTool` is the subset the UI offers as a confirmable card.
    // Each one has to be executable, or the card confirms into nothing.
    const actionTools = unionMembers(TYPES_SOURCE, 'CopilotActionTool');
    expect(actionTools.length).toBeGreaterThan(0);

    const notRunnable = actionTools.filter((name) => {
      const spec = getActionSpec(name);
      return !spec || spec.kind !== 'mutation' || !canExecute(name);
    });
    expect(notRunnable).toEqual([]);
  });

  it('states a bilingual label, confirm label and reversal for every mutation', () => {
    const faults: string[] = [];

    for (const spec of listActions()) {
      for (const [field, pair] of [
        ['label', spec.label],
        ['description', spec.description],
      ] as const) {
        if (!pair.en.trim() || !pair.el.trim()) faults.push(`${spec.id}.${field} is not bilingual`);
        if (pair.en.trim() === pair.el.trim()) faults.push(`${spec.id}.${field} el duplicates en`);
      }

      if (spec.kind !== 'mutation') continue;

      // A mutation the user confirms has to say what the button does and what
      // taking it back involves. AGENTS.md is explicit that reversibility must
      // be stated from real API behaviour rather than assumed.
      if (!spec.confirmLabel?.en.trim() || !spec.confirmLabel?.el.trim()) {
        faults.push(`${spec.id} has no bilingual confirmLabel`);
      }
      if (!spec.reversal?.explanation.en.trim() || !spec.reversal?.explanation.el.trim()) {
        faults.push(`${spec.id} does not state how it is reversed`);
      }
    }

    expect(faults).toEqual([]);
  });

  it('declares in the shared package exactly the tools the app names', () => {
    // The declaration now lives in @cofounderbay/shared so the server can
    // enforce the same list it offers a model. `CopilotToolName` stays as the
    // app's own vocabulary; this is what stops the two from drifting.
    const declared = [...listActionIds()].sort();
    const named = unionMembers(TYPES_SOURCE, 'CopilotToolName').sort();

    expect(declared).toEqual(named);
  });

  it('binds an executor to every declared mutation', () => {
    // The Record<MutationActionId, …> in action-registry makes this a compile
    // error too. Asserted here as well so the failure names the capability.
    const unbound = listActions()
      .filter((spec) => spec.kind === 'mutation' && !canExecute(spec.id))
      .map((spec) => spec.id);

    expect(unbound).toEqual([]);
  });

  it('backs every claim of reversibility with a working undo', () => {
    // The first version of this registry claimed send_connection could be
    // "withdrawn in Connections". ConnectionsController has no withdraw route
    // for the sender at all, so the claim was simply false. The union type now
    // makes `full`/`partial` require an undo function, and this asserts the
    // same thing at runtime plus its converse: a `none` must not smuggle one in.
    const faults: string[] = [];

    for (const spec of listActions()) {
      const reversal = spec.reversal;
      if (!reversal) continue;

      // The declaration states the claim; the app holds the implementation.
      // Comparing the two across the package boundary is the check that the
      // discriminated union used to perform inside a single object.
      const claimsReversible = reversal.kind !== 'none';

      if (isUndoable(spec.id) !== claimsReversible) {
        faults.push(
          `${spec.id}: declares kind="${reversal.kind}" but the app ${
            isUndoable(spec.id) ? 'binds' : 'binds no'
          } undo`,
        );
      }
    }

    expect(faults).toEqual([]);
  });

  it('states a reversal for every mutation that writes', () => {
    const silent = listActions().filter((spec) => spec.writes && !spec.reversal).map((s) => s.id);
    expect(silent).toEqual([]);
  });

  it('never marks a read tool as writing', () => {
    const wrong = listActions().filter((spec) => spec.kind === 'read' && spec.writes).map((s) => s.id);
    expect(wrong).toEqual([]);
  });
});

describe('model tool catalogue', () => {
  it('derives one well-formed entry per registry action', () => {
    const catalog = toToolCatalog();
    expect(catalog).toHaveLength(ACTION_DECLARATIONS.length);

    const faults: string[] = [];
    for (const entry of catalog) {
      const spec = getActionSpec(entry.function.name);
      if (!spec) {
        faults.push(`${entry.function.name} is not in the registry`);
        continue;
      }
      if (entry.type !== 'function') faults.push(`${spec.id} is not declared as a function`);
      if (!entry.function.description.trim()) faults.push(`${spec.id} has an empty description`);

      const properties = Object.keys(entry.function.parameters.properties);
      expect(properties.sort()).toEqual(spec.params.map((p) => p.name).sort());

      // A required name the properties do not define would make the model emit
      // an argument the executor cannot read.
      const orphanRequired = entry.function.parameters.required.filter((n) => !properties.includes(n));
      if (orphanRequired.length) faults.push(`${spec.id} requires undefined args: ${orphanRequired.join(', ')}`);
    }

    expect(faults).toEqual([]);
  });

  it('exposes each tool name exactly once', () => {
    const names = toToolCatalog().map((entry) => entry.function.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('executing registry actions', () => {
  it('navigates to the requested href and falls back to the dashboard', async () => {
    await expect(executeAction('navigate', { href: '/matches' })).resolves.toEqual({
      ok: true,
      href: '/matches',
    });
    await expect(executeAction('navigate', {})).resolves.toEqual({ ok: true, href: '/dashboard' });
  });

  it('saves to the shortlist and reports where it landed', async () => {
    await expect(executeAction('shortlist_add', { userId: 'u1' })).resolves.toEqual({
      ok: true,
      href: '/shortlist',
    });
    expect(shortlist).toHaveBeenCalledExactlyOnceWith('u1');
  });

  it('sends a connection with the optional note preserved', async () => {
    await expect(
      executeAction('send_connection', { receiverId: 'u2', message: 'hello' }),
    ).resolves.toEqual({ ok: true });
    expect(sendConnection).toHaveBeenCalledExactlyOnceWith({ receiverId: 'u2', message: 'hello' });
  });

  it('drops a non-string note rather than sending it', async () => {
    await executeAction('send_connection', { receiverId: 'u2', message: 42 });
    expect(sendConnection).toHaveBeenCalledExactlyOnceWith({ receiverId: 'u2', message: undefined });
  });

  it('opens a thread and returns the conversation it resolved', async () => {
    openThread.mockResolvedValue({ conversationId: 'c9' } as Awaited<ReturnType<typeof getOrCreateDirectConversation>>);
    await expect(executeAction('start_or_send_message', { userId: 'u3' })).resolves.toEqual({
      ok: true,
      href: '/messages?c=c9',
    });
    expect(openThread).toHaveBeenCalledExactlyOnceWith('u3');
  });

  it('refuses a mutation with no subject, without calling the API', async () => {
    await expect(executeAction('shortlist_add', {})).resolves.toEqual({
      ok: false,
      error: 'Missing user',
    });
    await expect(executeAction('send_connection', {})).resolves.toEqual({
      ok: false,
      error: 'Missing receiver',
    });
    await expect(executeAction('start_or_send_message', {})).resolves.toEqual({
      ok: false,
      error: 'Missing user',
    });

    expect(shortlist).not.toHaveBeenCalled();
    expect(sendConnection).not.toHaveBeenCalled();
    expect(openThread).not.toHaveBeenCalled();
  });

  it('reports a read tool and an unknown id as unsupported', async () => {
    await expect(executeAction('get_graph', {})).resolves.toEqual({
      ok: false,
      error: 'Unsupported action',
    });
    await expect(executeAction('definitely_not_a_tool', {})).resolves.toEqual({
      ok: false,
      error: 'Unsupported action',
    });
  });

  it('surfaces a failing API call as an error instead of throwing', async () => {
    shortlist.mockRejectedValue(new Error('rate limited'));
    await expect(executeAction('shortlist_add', { userId: 'u1' })).resolves.toEqual({
      ok: false,
      error: 'rate limited',
    });
  });
});

describe('undoing registry actions', () => {
  it('takes a shortlist entry back off the list', async () => {
    await expect(undoAction('shortlist_add', { userId: 'u1' })).resolves.toEqual({
      ok: true,
      href: '/shortlist',
    });
    expect(unshortlist).toHaveBeenCalledExactlyOnceWith('u1');
  });

  it('refuses to undo an intro, and touches no API doing so', async () => {
    // There is no sender-side withdraw route. A "best effort" undo here would
    // either fail loudly or, worse, reach for the receiver's PATCH and be
    // rejected as Forbidden after the recipient was already notified.
    await expect(undoAction('send_connection', { receiverId: 'u2' })).resolves.toEqual({
      ok: false,
      error: 'Not reversible',
    });
    expect(sendConnection).not.toHaveBeenCalled();
  });

  it('refuses to undo opening a thread rather than archiving the user’s own', async () => {
    // getOrCreateDirectConversation returns the same shape whether it created
    // the thread or found one, so an undo cannot tell those apart.
    await expect(undoAction('start_or_send_message', { userId: 'u3' })).resolves.toEqual({
      ok: false,
      error: 'Not reversible',
    });
    expect(openThread).not.toHaveBeenCalled();
  });

  it('refuses an unknown id and a read tool', async () => {
    await expect(undoAction('get_graph', {})).resolves.toEqual({
      ok: false,
      error: 'Not reversible',
    });
    await expect(undoAction('nope', {})).resolves.toEqual({
      ok: false,
      error: 'Not reversible',
    });
  });

  it('requires a subject and reports a failing undo instead of throwing', async () => {
    await expect(undoAction('shortlist_add', {})).resolves.toEqual({
      ok: false,
      error: 'Missing user',
    });
    expect(unshortlist).not.toHaveBeenCalled();

    unshortlist.mockRejectedValue(new Error('offline'));
    await expect(undoAction('shortlist_add', { userId: 'u1' })).resolves.toEqual({
      ok: false,
      error: 'offline',
    });
  });

  it('reports exactly which tools can be taken back', () => {
    expect(isUndoable('shortlist_add')).toBe(true);
    expect(isUndoable('send_connection')).toBe(false);
    expect(isUndoable('start_or_send_message')).toBe(false);
    expect(isUndoable('navigate')).toBe(false);
    expect(isUndoable('get_graph')).toBe(false);
  });
});

describe('route resolution', () => {
  it('keeps every existing alias resolving to exactly the route it did before', () => {
    expect(ALIASES.length).toBeGreaterThanOrEqual(18);
    const regressions: string[] = [];

    for (const alias of ALIASES) {
      for (const key of alias.keys) {
        const message = `open ${key}`;
        // Replicates the planner's own first-match-wins semantics, so a key
        // that a earlier alias already claimed is judged against that alias.
        const expected = ALIASES.find((candidate) =>
          candidate.keys.some((k) => message.toLowerCase().includes(k)),
        );
        const resolved = detectNavigateHref(message);

        if (!resolved) regressions.push(`"${message}" no longer resolves`);
        else if (resolved.href !== expected?.href) {
          regressions.push(`"${message}" resolved to ${resolved.href}, expected ${expected?.href}`);
        }
      }
    }

    expect(regressions).toEqual([]);
  });

  it('reaches pages the alias table never covered', () => {
    // The aliases know 18 destinations; these are real routes carrying a
    // PAGE_REGISTRY title that no alias key matches.
    expect(resolveRouteTarget('open the pitch deck')?.href).toBe('/builder/pitch-deck');
    expect(resolveRouteTarget('take me to program applications')?.href).toBe('/builder/applications');

    // And the planner returns them too, not just the resolver.
    expect(detectNavigateHref('take me to program applications')?.href).toBe('/builder/applications');
  });

  it('still prefers an alias over a more specific registry title', () => {
    // 'pitch' is an alias key for /builder, so "pitch deck" keeps resolving to
    // /builder through the planner even though the resolver alone would reach
    // /builder/pitch-deck. Aliases are consulted first precisely so no phrase
    // changes destination, and this records that trade rather than hiding it.
    expect(detectNavigateHref('open the pitch deck')?.href).toBe('/builder');
  });

  it('resolves Greek titles as well as English ones', () => {
    const byGreek = resolveRouteTarget('άνοιξε τα ορόσημα');
    expect(byGreek?.href).toBe('/milestones');
  });

  it('never offers a route that needs an id', () => {
    const dynamic: string[] = [];
    for (const phrase of ['open profile', 'open match', 'open project', 'open conversation']) {
      const target = resolveRouteTarget(phrase);
      if (target?.href.includes('[')) dynamic.push(`${phrase} -> ${target.href}`);
    }
    expect(dynamic).toEqual([]);
  });

  it('reaches far more destinations by name than the alias table did', () => {
    // Asking for each registered page by its own title is the closest thing to
    // a coverage measure for "can the assistant get the user there by name".
    const reachable = new Set<string>();
    for (const page of PAGE_REGISTRY) {
      if (page.path.includes('[')) continue;
      const resolved = resolveRouteTarget(`open ${page.title}`);
      if (resolved) reachable.add(resolved.href);
    }

    const aliasRoutes = new Set(ALIASES.map((alias) => alias.href));
    expect(aliasRoutes.size).toBeLessThanOrEqual(18);
    expect(reachable.size).toBeGreaterThan(aliasRoutes.size * 3);
  });

  it('returns nothing rather than guessing', () => {
    expect(resolveRouteTarget('qqqq zzzz not a page at all')).toBeUndefined();
    expect(detectNavigateHref('what should I do next')).toBeUndefined();
  });
});
