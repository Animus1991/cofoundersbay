'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSectionOpenByDefault, type UnifiedSection } from './nav-modes';

/**
 * Which sections of the single sidebar list are open (docs §64).
 *
 * The reader's own choices are kept per section (localStorage), shared by the
 * sidebar and the phone drawer through a window event, and a section with no
 * choice follows `isSectionOpenByDefault`. Arriving at a page whose section
 * the reader had closed opens it, so the current page is never hidden.
 */
const KEY = 'cfb:nav-sections:v1';
const EVENT = 'cfb:nav-sections';

function readChoices(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeChoices(next: Record<string, boolean>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice holds until the next page load.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useNavSections(sections: UnifiedSection[], activeHref: string | undefined) {
  const [choices, setChoices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => setChoices(readChoices());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const activeId = useMemo(
    () => sections.find((section) => section.links.some((link) => link.href === activeHref))?.id,
    [sections, activeHref],
  );

  useEffect(() => {
    if (!activeId) return;
    const current = readChoices();
    if (current[activeId] === false) writeChoices({ ...current, [activeId]: true });
  }, [activeId]);

  const openFor = useCallback(
    (section: UnifiedSection, from: Record<string, boolean>) =>
      from[section.id] ?? (section.id === activeId || isSectionOpenByDefault(section)),
    [activeId],
  );

  const isOpen = useCallback((section: UnifiedSection) => openFor(section, choices), [openFor, choices]);

  const toggle = useCallback(
    (section: UnifiedSection) => {
      const current = readChoices();
      writeChoices({ ...current, [section.id]: !openFor(section, current) });
    },
    [openFor],
  );

  return { isOpen, toggle, activeId };
}
