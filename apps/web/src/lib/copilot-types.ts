import type { DeclaredActionId, MutationActionId } from '@cofounderbay/shared';

/**
 * Every capability the assistant can name, derived from the declarations
 * rather than restated here.
 *
 * These two unions used to be written out by hand, which made them a second
 * registry: a capability declared in `@cofounderbay/shared` and offered to the
 * model was not representable in the type the planner and engine speak, so the
 * model could ask for something this app could not carry. Deriving them means
 * a declaration is the only place a capability is added.
 */
export type CopilotToolName = DeclaredActionId;

export type PlannedTool = {
  name: CopilotToolName;
  args: Record<string, string>;
};

/** The subset that is proposed for confirmation: exactly the mutations. */
export type CopilotActionTool = MutationActionId;

/**
 * `undone` is distinct from `dismissed`: dismissed means the user declined
 * before anything ran, undone means it ran and was then taken back. Collapsing
 * them would lose the fact that a write reached the backend.
 */
export type CopilotActionStatus = 'pending' | 'done' | 'dismissed' | 'error' | 'undone';

export type CopilotAction = {
  id: string;
  tool: CopilotActionTool;
  title: string;
  description: string;
  confirmLabel: string;
  payload: Record<string, unknown>;
  status: CopilotActionStatus;
  href?: string;
};

export type CopilotCitation = {
  type:
    | 'person'
    | 'match'
    | 'conversation'
    | 'notification'
    | 'graph'
    | 'route'
    // The areas `copilot-reads.ts` reads. The type is part of the dedup key, so
    // an event and a milestone that happen to share an id stay two citations.
    | 'event'
    | 'milestone'
    | 'job'
    | 'group'
    | 'endorsement'
    | 'opportunity'
    | 'session'
    | 'research'
    | 'workspace';
  id: string;
  label: string;
  href?: string;
};

export type CopilotGraph = {
  me: {
    id: string;
    displayName: string;
    headline: string | null;
    role: string;
    location: string | null;
    avatarUrl: string | null;
  };
  unreadMessages: number;
  pendingIntros: number;
  unreadNotifications: number;
  readiness: { overall: number; lowestLabel?: string; lowestHref?: string } | null;
  nextAction: { id: string; label: string; href: string } | null;
};

export type CopilotTurnResult = {
  message: string;
  actions: CopilotAction[];
  citations: CopilotCitation[];
  usedTools: CopilotToolName[];
};
