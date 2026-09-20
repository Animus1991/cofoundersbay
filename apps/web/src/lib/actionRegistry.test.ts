import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessReadiness,
  getOrCreateDirectConversation,
  removeFromShortlist,
  saveToShortlist,
  sendConnectionRequest,
  updateReadinessCriterion,
} from '@/lib/api';
import { createWorkspace } from '@/lib/builder-api';
import { demoCriterionState } from '@/lib/readiness-demo';
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
  assessReadiness: vi.fn(),
  updateReadinessCriterion: vi.fn(),
}));
// Not a showcase unless a test says so: the executors take a different path
// in demo mode, and every case below states which one it is exercising.
const demo = { on: false };
vi.mock('@/lib/preview-demo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/preview-demo')>()),
  isPreviewDemo: () => demo.on,
}));
vi.mock('@/lib/builder-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/builder-api')>()),
  createWorkspace: vi.fn(),
}));

const sendConnection = vi.mocked(sendConnectionRequest);
const openThread = vi.mocked(getOrCreateDirectConversation);
const shortlist = vi.mocked(saveToShortlist);
const unshortlist = vi.mocked(removeFromShortlist);
const readReadiness = vi.mocked(assessReadiness);
const writeCriterion = vi.mocked(updateReadinessCriterion);
const makeWorkspace = vi.mocked(createWorkspace);

/** One dimension carrying a single criterion, in the state asked for. */
function assessment(completed: boolean) {
  return {
    assessment: {
      overallScore: 10,
      overallMax: 20,
      lastAssessedAt: null,
      acceleratorReadiness: 50,
      investorReadiness: 40,
      dimensions: [
        {
          id: 'd1',
          workspaceId: 'ws-1',
          dimension: 'team',
          score: 5,
          maxScore: 10,
          assessedAt: '2026-01-01T00:00:00.000Z',
          recommendations: [],
          criteria: [{ id: 'c1', name: 'Two founders committed', completed, weight: 1 }],
        },
      ],
    },
  } as Awaited<ReturnType<typeof assessReadiness>>;
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
  readReadiness.mockReset();
  writeCriterion.mockReset();
  makeWorkspace.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  demo.on = false;
});

describe('action registry coverage', () => {
  it('carries an entry for every declared copilot tool', () => {
    const declared = [...listActionIds()];
    expect(declared.length).toBeGreaterThan(0);

    const missing = declared.filter((name) => !getActionSpec(name));
    expect(missing).toEqual([]);
  });

  it('marks every tool the app offers as a card a runnable mutation', () => {
    // `CopilotActionTool` is the subset the UI offers as a confirmable card,
    // and it is now `MutationActionId`. Each one has to be executable, or the
    // card confirms into nothing.
    const actionTools = listActions().filter((spec) => spec.kind === 'mutation').map((s) => s.id);
    expect(actionTools.length).toBeGreaterThan(0);

    const notRunnable = actionTools.filter((name) => !canExecute(name));
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

  it('derives its tool-name unions instead of restating them', () => {
    // These two unions were written out by hand and compared against the
    // declarations here, which caught drift only once a test ran. They are now
    // aliases of the derived ids, so a capability added to the shared package
    // is immediately representable and one removed stops compiling. This
    // asserts the derivation is still in place — re-hardcoding either union
    // would silently restore the drift this replaced.
    expect(TYPES_SOURCE).toMatch(/export type CopilotToolName = DeclaredActionId;/);
    expect(TYPES_SOURCE).toMatch(/export type CopilotActionTool = MutationActionId;/);

    const quotedNames = /export type Copilot(?:ToolName|ActionTool) =[^;]*'/;
    expect(TYPES_SOURCE).not.toMatch(quotedNames);
  });

  it('offers the three page capabilities the assistant needs to be more than a reader', () => {
    // Readiness could be read but not changed, Analytics could not be steered,
    // and a missing workspace was a dead end the assistant could only describe.
    for (const id of ['readiness_tick_criterion', 'analytics_set_period', 'workspace_create']) {
      const spec = getActionSpec(id);
      expect(spec, `${id} is not declared`).toBeDefined();
      expect(spec?.kind).toBe('mutation');
      expect(canExecute(id), `${id} has no executor`).toBe(true);
    }

    // Creating a workspace is honestly irreversible: `undoAction` is handed the
    // payload, never the outcome, so it has no id to archive.
    expect(isUndoable('workspace_create')).toBe(false);
    expect(isUndoable('canvas_command')).toBe(false);
    expect(isUndoable('readiness_tick_criterion')).toBe(true);
    expect(isUndoable('analytics_set_period')).toBe(true);
  });

  it('navigates only where the declaration says confirming should move the user', () => {
    // This used to be a pair of tool ids inside CopilotWorkspace.
    const navigates = listActions().filter((spec) => spec.navigatesOnSuccess).map((s) => s.id).sort();
    expect(navigates).toEqual(
      ['analytics_set_period', 'canvas_command', 'navigate', 'readiness_tick_criterion', 'start_or_send_message', 'workspace_create'],
    );

    // Saving to a shortlist reports where the result can be seen without
    // taking the user off the page they were reading.
    expect(getActionSpec('shortlist_add')?.navigatesOnSuccess).toBeFalsy();
    expect(getActionSpec('shortlist_remove')?.navigatesOnSuccess).toBeFalsy();
    expect(getActionSpec('send_connection')?.navigatesOnSuccess).toBeFalsy();
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

  it('parks a canvas command and opens Research when no board is listening', async () => {
    await expect(executeAction('canvas_command', { op: 'not-a-step' })).resolves.toEqual({
      ok: false,
      error: 'Unknown canvas command',
    });
    await expect(executeAction('canvas_command', { op: 'add_note', title: 'Pricing' })).resolves.toEqual({
      ok: true,
      href: '/research',
    });
    await expect(
      executeAction('canvas_command', { op: 'fit_view', boardId: 'board-gtm' }),
    ).resolves.toEqual({ ok: true, href: '/research/board-gtm' });
  });

  it('hands a canvas command to the open board instead of only navigating', async () => {
    const { registerCanvasCommandHandler } = await import('@/lib/canvas/canvas-command-bus');
    const unsub = registerCanvasCommandHandler(async (req) => ({
      ok: true,
      href: `/research/live?op=${req.op}`,
    }));
    try {
      await expect(executeAction('canvas_command', { op: 'align', align: 'left' })).resolves.toEqual({
        ok: true,
        href: '/research/live?op=align',
      });
    } finally {
      unsub();
    }
  });

  it('saves to the shortlist and reports where it landed', async () => {
    await expect(executeAction('shortlist_add', { userId: 'u1' })).resolves.toEqual({
      ok: true,
      href: '/shortlist',
    });
    expect(shortlist).toHaveBeenCalledExactlyOnceWith('u1');
  });

  it('takes a profile off the shortlist the same way it put it on', async () => {
    await expect(executeAction('shortlist_remove', { userId: 'u1' })).resolves.toEqual({
      ok: true,
      href: '/shortlist',
    });
    expect(unshortlist).toHaveBeenCalledExactlyOnceWith('u1');
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
    await expect(executeAction('shortlist_remove', {})).resolves.toEqual({
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
    expect(unshortlist).not.toHaveBeenCalled();
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

  it('ticks a readiness criterion on the workspace the page itself uses', async () => {
    localStorage.setItem('cfb_default_workspace', 'ws-1');
    readReadiness.mockResolvedValue(assessment(false));

    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'team', criterionId: 'c1', completed: true }),
    ).resolves.toEqual({ ok: true, href: '/readiness' });

    expect(readReadiness).toHaveBeenCalledExactlyOnceWith({ workspaceId: 'ws-1' });
    expect(writeCriterion).toHaveBeenCalledExactlyOnceWith('ws-1', {
      dimension: 'team',
      criterionId: 'c1',
      completed: true,
    });
  });

  it('refuses to tick a criterion that is already met, so the undo cannot clear it', async () => {
    // Without this the tool would be a silent no-op and its undo would clear a
    // box the user ticked themselves — the undo is handed the payload, not the
    // state that was there before.
    localStorage.setItem('cfb_default_workspace', 'ws-1');
    readReadiness.mockResolvedValue(assessment(true));

    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'team', criterionId: 'c1', completed: true }),
    ).resolves.toEqual({ ok: false, error: 'That criterion is already met' });
    expect(writeCriterion).not.toHaveBeenCalled();
  });

  it('refuses an unknown dimension or criterion without writing anything', async () => {
    localStorage.setItem('cfb_default_workspace', 'ws-1');
    readReadiness.mockResolvedValue(assessment(false));

    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'vibes', criterionId: 'c1', completed: true }),
    ).resolves.toEqual({ ok: false, error: 'Unknown readiness dimension' });
    expect(readReadiness).not.toHaveBeenCalled();

    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'team', criterionId: 'nope', completed: true }),
    ).resolves.toEqual({ ok: false, error: 'That criterion is not part of this dimension' });
    expect(writeCriterion).not.toHaveBeenCalled();
  });

  it('says a workspace is needed rather than guessing one', async () => {
    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'team', criterionId: 'c1', completed: true }),
    ).resolves.toEqual({
      ok: false,
      error: 'No workspace selected. Create one first, then tick criteria.',
    });
    expect(readReadiness).not.toHaveBeenCalled();
  });

  it('creates a workspace and selects it, which is what unblocks Readiness', async () => {
    makeWorkspace.mockResolvedValue({ id: 'ws-new', name: 'Helios' } as Awaited<ReturnType<typeof createWorkspace>>);

    await expect(
      executeAction('workspace_create', { name: '  Helios  ', description: 'Solar ops' }),
    ).resolves.toEqual({ ok: true, href: '/readiness' });

    expect(makeWorkspace).toHaveBeenCalledExactlyOnceWith({
      name: 'Helios',
      description: 'Solar ops',
      startupName: undefined,
    });
    // Creating one and leaving it unselected would leave the page showing the
    // same empty card it showed before.
    expect(localStorage.getItem('cfb_default_workspace')).toBe('ws-new');
  });

  it('refuses a nameless or over-long workspace before reaching the API', async () => {
    await expect(executeAction('workspace_create', { name: '   ' })).resolves.toEqual({
      ok: false,
      error: 'Missing workspace name',
    });
    await expect(executeAction('workspace_create', { name: 'x'.repeat(101) })).resolves.toEqual({
      ok: false,
      error: 'Workspace name is too long (100 characters)',
    });
    expect(makeWorkspace).not.toHaveBeenCalled();
  });

  it('turns an analytics window into a linkable address and rejects any other', async () => {
    await expect(executeAction('analytics_set_period', { period: '30d' })).resolves.toEqual({
      ok: true,
      href: '/analytics?period=30d',
    });
    await expect(executeAction('analytics_set_period', { period: 'all-time' })).resolves.toEqual({
      ok: false,
      error: 'Unknown period',
    });
  });

  it('ticks a showcase criterion in the session rather than refusing it', async () => {
    // The demo is the only readiness page a visitor without an account sees.
    // It has no workspace by design, so an executor that demanded one made the
    // assistant a narrator of a page it could not touch.
    demo.on = true;

    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'market', criterionId: 'm3', completed: true }),
    ).resolves.toEqual({ ok: true, href: '/readiness' });

    // Written to the session, and nothing was asked of the API.
    expect(demoCriterionState('market', 'm3')).toBe(true);
    expect(readReadiness).not.toHaveBeenCalled();
    expect(writeCriterion).not.toHaveBeenCalled();
  });

  it('applies the same no-op and unknown-criterion refusals to the showcase', async () => {
    demo.on = true;

    // 'm1' ships already met in the seed.
    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'market', criterionId: 'm1', completed: true }),
    ).resolves.toEqual({ ok: false, error: 'That criterion is already met' });

    await expect(
      executeAction('readiness_tick_criterion', { dimension: 'market', criterionId: 'zzz', completed: true }),
    ).resolves.toEqual({ ok: false, error: 'That criterion is not part of this dimension' });
  });

  it('undoes a showcase tick back to the seed', async () => {
    demo.on = true;
    await executeAction('readiness_tick_criterion', { dimension: 'market', criterionId: 'm3', completed: true });

    await expect(
      undoAction('readiness_tick_criterion', { dimension: 'market', criterionId: 'm3', completed: true }),
    ).resolves.toEqual({ ok: true, href: '/readiness' });
    expect(demoCriterionState('market', 'm3')).toBe(false);
  });

  it('says the showcase needs no workspace instead of calling an endpoint that will refuse', async () => {
    demo.on = true;
    await expect(executeAction('workspace_create', { name: 'Helios' })).resolves.toEqual({
      ok: false,
      error: 'The demo showcase already has a workspace. Sign in to create your own.',
    });
    expect(makeWorkspace).not.toHaveBeenCalled();
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

  it('puts a removed shortlist entry back on', async () => {
    await expect(undoAction('shortlist_remove', { userId: 'u1' })).resolves.toEqual({
      ok: true,
      href: '/shortlist',
    });
    expect(shortlist).toHaveBeenCalledExactlyOnceWith('u1');
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

  it('puts a readiness criterion back, and refuses if the user changed it first', async () => {
    localStorage.setItem('cfb_default_workspace', 'ws-1');
    readReadiness.mockResolvedValue(assessment(true));

    await expect(
      undoAction('readiness_tick_criterion', { dimension: 'team', criterionId: 'c1', completed: true }),
    ).resolves.toEqual({ ok: true, href: '/readiness' });
    expect(writeCriterion).toHaveBeenCalledExactlyOnceWith('ws-1', {
      dimension: 'team',
      criterionId: 'c1',
      completed: false,
    });

    // The user has since cleared it by hand: the undo has nothing to take back.
    writeCriterion.mockClear();
    readReadiness.mockResolvedValue(assessment(false));
    await expect(
      undoAction('readiness_tick_criterion', { dimension: 'team', criterionId: 'c1', completed: true }),
    ).resolves.toEqual({ ok: false, error: 'That criterion is already clear' });
    expect(writeCriterion).not.toHaveBeenCalled();
  });

  it('returns the analytics page to the window it opens on', async () => {
    await expect(undoAction('analytics_set_period', { period: '90d' })).resolves.toEqual({
      ok: true,
      href: '/analytics',
    });
  });

  it('refuses to undo a created workspace rather than archiving one by name', async () => {
    // The undo receives what was asked for, not what was made, so archiving by
    // name could archive a workspace the user already had.
    await expect(undoAction('workspace_create', { name: 'Helios' })).resolves.toEqual({
      ok: false,
      error: 'Not reversible',
    });
    expect(makeWorkspace).not.toHaveBeenCalled();
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
    expect(isUndoable('shortlist_remove')).toBe(true);
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
