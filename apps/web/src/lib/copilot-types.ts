export type CopilotToolName =
  | 'get_graph'
  | 'search_people'
  | 'get_recommendations'
  | 'get_notifications'
  | 'shortlist_add'
  | 'send_connection'
  | 'start_or_send_message'
  | 'navigate';

export type PlannedTool = {
  name: CopilotToolName;
  args: Record<string, string>;
};

export type CopilotActionTool =
  | 'send_connection'
  | 'start_or_send_message'
  | 'navigate'
  | 'shortlist_add';

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
  type: 'person' | 'match' | 'conversation' | 'notification' | 'graph' | 'route';
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
