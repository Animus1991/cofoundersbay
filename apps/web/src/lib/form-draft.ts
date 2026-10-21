'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Forms as proposals.
 *
 * The assistant can write some things outright (a milestone, an event) and it
 * says so on a confirm card. For a form the person should read before it
 * exists - a new project, their own profile, a long event description - the
 * better shape is a draft: the assistant fills the fields, the page opens with
 * them filled, and nothing is saved until the person presses the form's own
 * submit button.
 *
 * The draft travels in sessionStorage because it only has to survive one
 * navigation, inside one tab, for one person. It is read after mount (never
 * during render, so the server and first client render agree), taken once,
 * and ignored when stale. A page that is already open hears the same draft
 * through a window event and fills itself in place.
 */

export type FormDraftId =
  | 'milestone'
  | 'event'
  | 'project'
  | 'profile'
  | 'need_card'
  | 'founder_update'
  | 'scout_brief'
  | 'mentor_listing'
  | 'provider_listing';
export type FormDraftFields = Record<string, string | boolean>;

/** Where each draft is filled in. */
export const FORM_DRAFT_ROUTES: Record<FormDraftId, string> = {
  milestone: '/milestones/new',
  event: '/events/create',
  project: '/projects/create',
  profile: '/profile/edit',
  need_card: '/commitments/new',
  founder_update: '/updates',
  scout_brief: '/scout',
  mentor_listing: '/mentor/profile',
  provider_listing: '/provider/profile',
};

const KEY = (id: FormDraftId) => `cfb_form_draft:${id}`;
const EVENT = 'cfb:form-draft';
/** A draft older than this was abandoned; opening the form later starts clean. */
const MAX_AGE_MS = 10 * 60_000;

export function stashFormDraft(id: FormDraftId, fields: FormDraftFields, prompt?: string): void {
  const clean = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => (typeof v === 'string' ? v.trim() !== '' : typeof v === 'boolean')),
  );
  const note = prompt?.trim() || undefined;
  try {
    window.sessionStorage.setItem(KEY(id), JSON.stringify({ fields: clean, at: Date.now(), ...(note ? { prompt: note } : {}) }));
  } catch {
    // Private mode or storage blocked: the open-page event below still works.
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { id, fields: clean, prompt: note } }));
  } catch {
    // No window (tests without jsdom).
  }
}

function takeBundle(id: FormDraftId, now: number): { fields: FormDraftFields; prompt?: string } | null {
  try {
    const raw = window.sessionStorage.getItem(KEY(id));
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY(id));
    const parsed = JSON.parse(raw) as { fields?: FormDraftFields; at?: number; prompt?: string };
    if (!parsed?.fields || typeof parsed.at !== 'number' || now - parsed.at > MAX_AGE_MS) return null;
    const prompt = typeof parsed.prompt === 'string' && parsed.prompt.trim() ? parsed.prompt.trim() : undefined;
    return { fields: parsed.fields, ...(prompt ? { prompt } : {}) };
  } catch {
    return null;
  }
}

export function takeFormDraft(id: FormDraftId, now = Date.now()): FormDraftFields | null {
  return takeBundle(id, now)?.fields ?? null;
}

/**
 * Applies a waiting draft to a form, once the form is ready for it.
 *
 * `ready` exists for forms that load their own values first (the profile
 * reads the saved profile): a draft applied before that load would be
 * overwritten by it. Returns the names of the fields the assistant filled,
 * for the notice, and a way to dismiss that notice.
 */
export function useFormDraft(
  id: FormDraftId,
  apply: (fields: FormDraftFields) => void,
  ready = true,
): { filled: string[]; prompt: string; dismiss: () => void } {
  const [filled, setFilled] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const applyBundle = useCallback((bundle: { fields: FormDraftFields; prompt?: string } | null) => {
    if (!bundle || Object.keys(bundle.fields).length === 0) return;
    applyRef.current(bundle.fields);
    setFilled(Object.keys(bundle.fields));
    setPrompt(bundle.prompt ?? '');
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyBundle(takeBundle(id, Date.now()));
    const onDraft = (event: Event) => {
      const detail = (event as CustomEvent<{ id: FormDraftId }>).detail;
      if (detail?.id === id) applyBundle(takeBundle(id, Date.now()));
    };
    window.addEventListener(EVENT, onDraft);
    return () => window.removeEventListener(EVENT, onDraft);
  }, [id, ready, applyBundle]);

  return { filled, prompt, dismiss: () => { setFilled([]); setPrompt(''); } };
}
