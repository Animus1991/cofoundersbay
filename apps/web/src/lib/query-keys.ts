/**
 * Canonical React Query key factory.
 *
 * docs/AI_PLATFORM_UPGRADE_PLAN.md §1.2 identified duplicate keys for the same
 * resource (e.g. ['me','profile'] vs ['me-profile'], ['connections'] vs
 * ['connection-requests']) — since invalidateQueries() only reaches keys that
 * share the array prefix, a write on one variant silently leaves the other
 * stale (concretely: saving /profile/edit never refreshed any dashboard,
 * because every dashboard read profile under a different key entirely).
 *
 * New code should build keys from here rather than writing array literals,
 * so a resource has exactly one key shape and invalidating it always reaches
 * every consumer. This is additive — it does not attempt to migrate every
 * existing key in one pass, only to give new and touched call sites a single
 * source of truth to converge on.
 */
export const queryKeys = {
  me: {
    profile: () => ['me', 'profile'] as const,
  },
  connections: {
    /** Pending connection requests received by the current user. */
    pendingReceived: () => ['connections', 'pending-received'] as const,
    /** All connections, optionally scoped to a tab (e.g. 'received' | 'sent'). */
    list: (tab?: string) => (tab ? (['connections', tab] as const) : (['connections'] as const)),
  },
};
