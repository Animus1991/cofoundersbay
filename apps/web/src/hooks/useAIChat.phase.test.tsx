import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { executeCopilotAction, runCopilotTurn } from '@/lib/copilot-engine';
import { haptic } from '@/lib/haptics';
import type { CopilotAction } from '@/lib/copilot-types';
import { useAIChat } from './useAIChat';

/**
 * The wait is named stage by stage (docs §122): the hook says what the turn
 * is doing, in order, and says nothing once the answer has landed. A phone
 * ticks when a card's write lands, is taken back, or fails - and only then.
 */

vi.mock('@/hooks/useSession', () => ({ useSession: () => ({ hasSession: true, mounted: true }) }));
vi.mock('@/hooks/useApiAvailability', () => ({ useApiAvailability: () => true }));
vi.mock('@/lib/ai-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/ai-api')>()),
  getAIHealth: vi.fn().mockResolvedValue({ available: false, models: [] }),
  getAIAgents: vi.fn().mockResolvedValue({ agents: [] }),
  recordAIAction: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('@/lib/copilot-engine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/copilot-engine')>()),
  runCopilotTurn: vi.fn(),
  executeCopilotAction: vi.fn(),
}));
vi.mock('@/lib/action-registry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/action-registry')>()),
  undoAction: vi.fn().mockResolvedValue({ ok: true }),
  undoAvailable: () => true,
}));
vi.mock('@/lib/haptics', () => ({ haptic: vi.fn(() => true) }));

const turn = vi.mocked(runCopilotTurn);
const execute = vi.mocked(executeCopilotAction);
const tick = vi.mocked(haptic);

const CARD: CopilotAction = {
  id: 'card-1',
  tool: 'shortlist_add',
  title: 'Save Elena to your shortlist',
  description: '',
  confirmLabel: 'Save',
  payload: { userId: 'user-elena' },
  status: 'pending',
};

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient();
  turn.mockReset();
  execute.mockReset();
  tick.mockClear();
});

afterEach(cleanup);

describe('the phases of a turn', () => {
  it('names each read as the engine reaches it, then clears once the answer lands', async () => {
    // The engine pauses at each gate, so every stage is on screen long enough
    // to be read; a mock that reported all its reads in one tick would let
    // React batch them into the final render and prove nothing.
    let open: () => void = () => {};
    const gate = () => new Promise<void>((resolve) => { open = resolve; });
    turn.mockImplementation(async (_message, _context, options) => {
      await gate();
      options?.onRead?.({ tool: 'get_milestones', index: 1, total: 2 });
      await gate();
      options?.onRead?.({ tool: 'get_events', index: 2, total: 2 });
      await gate();
      return { message: 'Three milestones, two events.', actions: [], citations: [], usedTools: ['get_milestones', 'get_events'] };
    });
    const hook = renderHook(() => useAIChat({ enableCopilot: true }), { wrapper });
    await act(async () => {});
    expect(hook.result.current.phase).toBeNull();

    let sent: Promise<void> = Promise.resolve();
    act(() => { sent = hook.result.current.sendMessage('what is due this week?'); });
    await waitFor(() => expect(hook.result.current.phase).toEqual({ kind: 'planning' }));
    await act(async () => { open(); });
    await waitFor(() => expect(hook.result.current.phase).toEqual({ kind: 'reading', tool: 'get_milestones', index: 1, total: 2 }));
    await act(async () => { open(); });
    await waitFor(() => expect(hook.result.current.phase).toEqual({ kind: 'reading', tool: 'get_events', index: 2, total: 2 }));
    await act(async () => { open(); await sent; });

    expect(hook.result.current.phase).toBeNull();
    expect(hook.result.current.messages.at(-1)?.content).toBe('Three milestones, two events.');
  });

  it('clears the phase when the turn fails, so the next wait starts clean', async () => {
    turn.mockRejectedValue(new Error('offline'));
    const hook = renderHook(() => useAIChat({ enableCopilot: true }), { wrapper });
    await act(async () => {});
    await act(() => hook.result.current.sendMessage('anything'));
    expect(hook.result.current.phase).toBeNull();
  });
});

describe('the tick on a phone', () => {
  async function chatWithCard() {
    turn.mockResolvedValue({ message: 'I can save her.', actions: [{ ...CARD }], citations: [], usedTools: [] });
    const hook = renderHook(() => useAIChat({ enableCopilot: true }), { wrapper });
    await act(async () => {});
    await act(() => hook.result.current.sendMessage('save Elena'));
    const card = () => hook.result.current.messages.at(-1)?.actions?.[0];
    expect(card()?.id).toBe(CARD.id);
    return { ...hook, card };
  }

  it('ticks once when the write lands, and again when it is taken back', async () => {
    execute.mockResolvedValue({ ok: true, undo: { savedUserId: 'user-elena' } });
    const { result, card } = await chatWithCard();
    expect(tick).not.toHaveBeenCalled();
    await act(() => result.current.confirmAction(card()!));
    expect(tick).toHaveBeenCalledTimes(1);
    expect(tick).toHaveBeenLastCalledWith('done');
    await act(() => result.current.undoAction(card()!));
    expect(tick).toHaveBeenCalledTimes(2);
    expect(tick).toHaveBeenLastCalledWith('undone');
  });

  it('ticks the error pattern when the write fails, and not at all when the reader declines', async () => {
    execute.mockResolvedValueOnce({ ok: false, error: 'nope' });
    const { result, card } = await chatWithCard();
    await act(() => result.current.confirmAction(card()!));
    expect(tick).toHaveBeenLastCalledWith('error');
    tick.mockClear();
    execute.mockResolvedValueOnce({ ok: false, cancelled: true });
    await act(() => result.current.confirmAction({ ...card()!, status: 'pending' }));
    expect(tick).not.toHaveBeenCalled();
  });
});
