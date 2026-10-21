import { describe, expect, it, vi } from 'vitest';
import { createPassLedger } from './match-pass';

describe('passing on a match, and taking it back', () => {
  it('sends back exactly what the pass replaced', async () => {
    const restore = vi.fn().mockResolvedValue({ ok: true });
    const ledger = createPassLedger({
      record: vi.fn().mockResolvedValue({ ok: true, previous: { feedback: 'not_now', connectionStarted: false, conversationStarted: false }, signalId: 'sig-9' }),
      restore,
    });
    ledger.pass('card-1', 'user-elena');
    await ledger.takeBack('card-1');
    expect(restore).toHaveBeenCalledWith({
      userId: 'user-elena',
      previous: { feedback: 'not_now', connectionStarted: false, conversationStarted: false },
      signalId: 'sig-9',
    });
    expect(ledger.has('card-1')).toBe(false);
  });

  it('waits for a pass that has not answered yet', async () => {
    let answer: (v: unknown) => void = () => {};
    const restore = vi.fn().mockResolvedValue({ ok: true });
    const ledger = createPassLedger({ record: () => new Promise((r) => { answer = r as (v: unknown) => void; }) as never, restore });
    ledger.pass('card-2', 'user-marcus');
    const back = ledger.takeBack('card-2');
    expect(restore).not.toHaveBeenCalled();
    answer({ ok: true, previous: null, signalId: 'sig-1' });
    await back;
    expect(restore).toHaveBeenCalledWith({ userId: 'user-marcus', previous: null, signalId: 'sig-1' });
  });

  it('restores nothing when the pass itself failed, or was never made', async () => {
    const restore = vi.fn();
    const ledger = createPassLedger({ record: vi.fn().mockRejectedValue(new Error('offline')), restore });
    ledger.pass('card-3', 'user-sofia');
    await ledger.takeBack('card-3');
    await ledger.takeBack('never-passed');
    expect(restore).not.toHaveBeenCalled();
  });
});
