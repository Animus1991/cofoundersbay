'use client';

import { useEffect, useId, useRef, useSyncExternalStore } from 'react';

/**
 * The page's own controls, offered to the assistant.
 *
 * The assistant reached 15 of the 104 API reads and 14 of the 167 writes the
 * pages make (round 12 measurement), because every capability was declared
 * and executed one at a time. Most of what a reader does on a page is not a
 * new capability at all - it is pressing a control the page already has:
 * narrow a list, change a period, export what is on screen, suspend a user.
 *
 * So a page registers those controls here, with the same handler its button
 * calls. The assistant sees them in the page context and proposes one; the
 * reader confirms; the page's handler runs - including any confirmation the
 * page itself asks for. Nothing here reaches an endpoint the page does not.
 *
 * Two kinds, kept apart because the confirm card warns only about writes:
 * a *view* control (`writes: false`) changes what the page shows; a *command*
 * (`writes: true`) changes stored data. `use_page_control` runs only the
 * first, `run_page_command` only the second, so neither declaration's
 * `writes` can be wrong about what it ran.
 */
export type PageControlOption = {
  value: string;
  labelEn: string;
  labelEl: string;
};

export type PageControl = {
  /** Stable within the page, e.g. `status_filter`. */
  id: string;
  labelEn: string;
  labelEl: string;
  /** True when running it changes stored data, not just the view. */
  writes: boolean;
  /**
   * The choices the control takes, when it takes one - a filter's values, a
   * period's windows, the rows a command can act on. Absent for a plain
   * button.
   */
  options?: readonly PageControlOption[];
  /** The option in effect now, so "is it already on suspended?" has an answer. */
  current?: string;
  /** Why it cannot run right now (nothing to export, sample rows). */
  unavailableEn?: string;
  unavailableEl?: string;
  /** The page's own handler. Receives the chosen option's value. */
  run: (value?: string) => void | Promise<void>;
};

/** What leaves the page: everything but the handler. */
export type PageControlSummary = Omit<PageControl, 'run'>;

type Entry = { controls: PageControl[] };

const owners = new Map<string, Entry>();
const listeners = new Set<() => void>();
let snapshot: readonly PageControlSummary[] = [];
let snapshotKey = '[]';

function summarise(): PageControlSummary[] {
  const out: PageControlSummary[] = [];
  const seen = new Set<string>();
  for (const { controls } of owners.values()) {
    for (const { run: _run, ...rest } of controls) {
      // First registration wins: two components on one page offering the same
      // id would otherwise make the assistant's choice ambiguous.
      if (seen.has(rest.id)) continue;
      seen.add(rest.id);
      out.push(rest);
    }
  }
  return out;
}

function publish(): void {
  const next = summarise();
  const key = JSON.stringify(next);
  if (key === snapshotKey) return;
  snapshotKey = key;
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => snapshot;
const EMPTY: readonly PageControlSummary[] = [];
const getServerSnapshot = () => EMPTY;

/** The controls on screen now, for code outside React (executors). */
export function currentPageControls(): readonly PageControlSummary[] {
  return snapshot;
}

/** The controls on screen now, re-rendering when they change. */
export function usePageControlList(): readonly PageControlSummary[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Offer these controls for as long as the calling component is mounted.
 *
 * Pass the array inline: handlers are read from a ref at run time, so a
 * control always runs the page's current closure, and only a change to what
 * the assistant can see (labels, options, current value) republishes.
 */
export function usePageControls(controls: PageControl[]): void {
  const owner = useId();
  const latest = useRef(controls);
  latest.current = controls;

  const key = JSON.stringify(controls.map(({ run: _run, ...rest }) => rest));
  useEffect(() => {
    owners.set(owner, {
      // Each run reads the newest handler, never the one from registration.
      controls: latest.current.map((c) => ({
        ...c,
        run: (value?: string) => latest.current.find((x) => x.id === c.id)?.run(value),
      })),
    });
    publish();
  }, [owner, key]);

  useEffect(
    () => () => {
      owners.delete(owner);
      publish();
    },
    [owner],
  );
}

export type PageControlOutcome = { ok: true } | { ok: false; error: string };

/**
 * Run a control by id. The executors' single entry point.
 *
 * Refuses rather than guesses: an unknown id, a value that is not one of the
 * control's options, a control that says it cannot run, or the wrong kind for
 * the capability that asked (`expectWrites`) all return an error naming what
 * is available, so the reader sees why nothing happened.
 */
export async function runPageControl(
  id: string,
  value: string | undefined,
  expectWrites: boolean,
): Promise<PageControlOutcome> {
  let control: PageControl | undefined;
  for (const { controls } of owners.values()) {
    control = controls.find((c) => c.id === id);
    if (control) break;
  }
  const available = snapshot.filter((c) => c.writes === expectWrites).map((c) => c.labelEn);
  if (!control) {
    return {
      ok: false,
      error: available.length
        ? `This page has no "${id}" control. It offers: ${available.join(', ')}.`
        : expectWrites
          ? 'This page offers no commands to run.'
          : 'This page offers no controls to use.',
    };
  }
  if (control.writes !== expectWrites) {
    return {
      ok: false,
      error: control.writes
        ? `"${control.labelEn}" changes stored data, so it runs as a command, not a view control.`
        : `"${control.labelEn}" only changes the view, so it runs as a view control, not a command.`,
    };
  }
  if (control.unavailableEn) return { ok: false, error: control.unavailableEn };
  if (control.options?.length) {
    if (!value) return { ok: false, error: `"${control.labelEn}" needs a choice: ${control.options.map((o) => o.labelEn).join(', ')}.` };
    // A model may name the option rather than its value; both are accepted.
    const asked = value.toLowerCase();
    const match =
      control.options.find((o) => o.value === value) ??
      control.options.find((o) => o.labelEn.toLowerCase() === asked || o.labelEl.toLowerCase() === asked);
    if (!match) {
      return { ok: false, error: `"${value}" is not one of ${control.labelEn}'s choices: ${control.options.map((o) => o.labelEn).join(', ')}.` };
    }
    value = match.value;
  }
  await control.run(value);
  return { ok: true };
}

/** For tests: forget every registration. */
export function resetPageControlsForTests(): void {
  owners.clear();
  publish();
}

/**
 * The common case: a filter, period or sort the page already keeps as
 * `{ value, en, el }` options and a state setter. Returns a view control that
 * reports the choice in effect.
 */
type OptionShape =
  | { value: string; en: string; el: string }
  | { key: string; labelEn: string; labelEl: string };

export function choiceControl(
  id: string,
  labelEn: string,
  labelEl: string,
  // Both shapes the pages already keep their options in.
  options: readonly OptionShape[],
  current: string,
  set: (value: string) => void,
): PageControl {
  return {
    id,
    labelEn,
    labelEl,
    writes: false,
    options: options.map((o) =>
      'key' in o ? { value: o.key, labelEn: o.labelEn, labelEl: o.labelEl } : { value: o.value, labelEn: o.en, labelEl: o.el },
    ),
    current,
    run: (value) => {
      if (value !== undefined) set(value);
    },
  };
}

/**
 * A command's choices from the rows on screen, one per row.
 *
 * Labels are what a reader says ("like Elena Papadopoulos's post"), so they
 * are short - a name, not a sentence - and a repeated label gets a number
 * ("Elena Papadopoulos (2)") so every choice stays distinct.
 */
export function rowOptions<T>(
  rows: readonly T[],
  id: (row: T) => string,
  labelEn: (row: T) => string,
  labelEl: (row: T) => string = labelEn,
): PageControlOption[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const en = labelEn(row);
    const n = (seen.get(en) ?? 0) + 1;
    seen.set(en, n);
    const suffix = n > 1 ? ` (${n})` : '';
    return { value: id(row), labelEn: `${en}${suffix}`, labelEl: `${labelEl(row)}${suffix}` };
  });
}
