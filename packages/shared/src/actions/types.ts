/**
 * The declarative half of the assistant's capability contract.
 *
 * It lives here, rather than in the web app where it started, because the
 * server has to enforce the same contract it offers a model. A tool catalogue
 * built in the browser and trusted by the API would let a caller name any
 * function it liked; a second registry written on the server would drift from
 * the first. So the declaration is shared and the *execution* is not: only the
 * side that owns a write can perform it.
 *
 * Nothing in this file may import from an app. Executors and undo functions
 * are deliberately absent — they close over each app's own API client, and a
 * function cannot cross this boundary as data anyway.
 */

/** English is canonical; Greek is additive. Matches the apps' BilingualPair. */
export type BilingualCopy = {
  en: string;
  el: string;
};

export type ActionParamType = 'string' | 'number' | 'boolean';

export type ActionParam = {
  name: string;
  type: ActionParamType;
  required: boolean;
  /** The `en` half is what a model sees; both halves are shown to the user. */
  description: BilingualCopy;
  /** Constrains a model's output when the argument is a closed set. */
  enumValues?: readonly string[];
};

/** `read` answers a question; `mutation` changes something the user owns. */
export type ActionKind = 'read' | 'mutation';

/**
 * Verified against the API, never assumed.
 *
 * `none` is the honest answer more often than it looks: a connection request
 * notifies its recipient before the call returns and has no sender-side
 * withdraw route, and a direct conversation cannot be deleted at all.
 */
export type ActionReversalKind = 'none' | 'full' | 'partial';

export type ActionReversalDeclaration = {
  kind: ActionReversalKind;
  explanation: BilingualCopy;
};

export type ActionOutcome = {
  ok: boolean;
  href?: string;
  error?: string;
};

export type ActionDeclaration = {
  id: string;
  kind: ActionKind;
  label: BilingualCopy;
  description: BilingualCopy;
  params: readonly ActionParam[];
  /**
   * True when a confirmed run reaches a write endpoint. Navigation moves the
   * user rather than their data, so it is false there — that distinction is
   * what lets the UI decide whether a warning is warranted.
   */
  writes: boolean;
  reversal?: ActionReversalDeclaration;
  confirmLabel?: BilingualCopy;
};

/** An entry in the catalogue handed to a model that supports function calling. */
export type ToolCatalogEntry = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<
        string,
        { type: ActionParamType; description: string; enum?: readonly string[] }
      >;
      required: string[];
    };
  };
};
