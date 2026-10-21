import type { MatchOutcomeSnapshot } from './api';

/** What one pass replaced on the server, as the feedback call answered it. */
export type PassReceipt = { userId: string; previous: MatchOutcomeSnapshot | null; signalId: string | null };

/**
 * The passes made on this screen, each with what it replaced on the server,
 * so that taking one back sends exactly that back.
 *
 * /matches used to bring a passed card back on screen while the server kept
 * the pass (a lower prior and a negative signal) for good. A receipt is kept
 * as the promise of the feedback call, so an Undo pressed before the pass has
 * answered still restores the right thing; a pass whose write failed changed
 * nothing, so there is nothing to restore.
 */
export function createPassLedger(api: {
  record: (userId: string) => Promise<{ previous?: MatchOutcomeSnapshot | null; signalId?: string | null } | undefined | null>;
  restore: (receipt: PassReceipt) => Promise<unknown>;
}) {
  const receipts = new Map<string, Promise<PassReceipt | null>>();
  return {
    /** Records the pass on `id` (the card) for `userId` (the person). */
    pass(id: string, userId: string): void {
      receipts.set(
        id,
        api
          .record(userId)
          .then((res) => ({ userId, previous: res?.previous ?? null, signalId: res?.signalId ?? null }))
          .catch(() => null),
      );
    },
    /** Takes the pass on `id` back on the server; resolves once that is done (or there was nothing to do). */
    async takeBack(id: string): Promise<void> {
      const receipt = receipts.get(id);
      receipts.delete(id);
      const done = receipt ? await receipt : null;
      if (done) await api.restore(done).catch(() => undefined);
    },
    has(id: string): boolean {
      return receipts.has(id);
    },
  };
}
