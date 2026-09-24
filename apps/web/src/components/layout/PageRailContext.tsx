'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * The right-hand page rail's open/closed state.
 *
 * Separate from `SidebarContext` on purpose. The left sidebar answers "where am
 * I in the product"; this rail answers "what else can I do on this page". They
 * are pinned independently because a reader who wants the navigation collapsed
 * is not thereby saying anything about page tools - and one preference
 * overwriting the other is how a layout starts feeling arbitrary.
 *
 * Two kinds of open, deliberately:
 *
 * - **Pinned** is a preference. It persists, and it reflows the main column, so
 *   the page is laid out around a rail that is going to stay.
 * - **Peeked** is a glance. It overlays, reflows nothing, and ends when the
 *   pointer leaves. Reflowing the page on hover would make the content jump
 *   under the reader's eyes every time they crossed the right edge.
 */
type PageRailCtx = {
  /** Kept open by choice; the main column is offset for it. */
  pinned: boolean;
  /** Open under the pointer or keyboard focus; overlays, offsets nothing. */
  peeked: boolean;
  /** Either kind of open. */
  open: boolean;
  /** False until localStorage has been read, so SSR and hydration agree. */
  mounted: boolean;
  setPinned: (value: boolean) => void;
  togglePinned: () => void;
  setPeeked: (value: boolean) => void;
  /** True while a page has actually registered a rail. */
  hasRail: boolean;
  setHasRail: (value: boolean) => void;
  /**
   * Open the rail on a named section: a peek on the desktop, the sheet below
   * `lg`. This is how a keyboard shortcut, a canvas command or an assistant
   * action can take the reader straight to a tool instead of leaving them to
   * find it. No-op while no rail is mounted.
   */
  openRailSection: (id: string) => void;
  /** The mounted rail registers its opener; internal to PageRail. */
  registerRailOpener: (open: (id: string) => void) => void;
};

const PageRailContext = createContext<PageRailCtx>({
  pinned: false,
  peeked: false,
  open: false,
  mounted: false,
  setPinned: () => {},
  togglePinned: () => {},
  setPeeked: () => {},
  hasRail: false,
  setHasRail: () => {},
  openRailSection: () => {},
  registerRailOpener: () => {},
});

const KEY = 'cfb:page-rail';

export function PageRailProvider({ children }: { children: ReactNode }) {
  /*
   * Collapsed on both the server and the first client render.
   *
   * The left sidebar defaults to expanded because navigation is the frame you
   * read the product through. Page tools are not: a reader arriving at a page
   * should meet the page, and reach for its tools second.
   */
  const [pinned, setPinnedState] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasRail, setHasRail] = useState(false);
  /* The opener belongs to whichever PageRail is mounted, so it lives in a ref
     rather than state: registering it must not re-render the provider's whole
     subtree. A no-op until a rail registers. */
  const railOpener = useRef<(id: string) => void>(() => {});
  const openRailSection = useCallback((id: string) => railOpener.current(id), []);
  const registerRailOpener = useCallback((open: (id: string) => void) => {
    railOpener.current = open;
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(KEY);
      if (stored !== null) setPinnedState(stored === '1');
    } catch {
      // Private mode, or storage blocked. Collapsed is a fine answer.
    }
  }, []);

  const persist = useCallback((value: boolean) => {
    try {
      localStorage.setItem(KEY, value ? '1' : '0');
    } catch {
      // As above: the preference is a convenience, not state the app needs.
    }
  }, []);

  const setPinned = useCallback(
    (value: boolean) => {
      setPinnedState(value);
      persist(value);
      // Pinning subsumes the peek; leaving the pointer should not now close it.
      if (value) setPeeked(false);
    },
    [persist],
  );

  const togglePinned = useCallback(() => {
    setPinnedState((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
    setPeeked(false);
  }, [persist]);

  return (
    <PageRailContext.Provider
      value={{
        pinned,
        peeked,
        open: pinned || peeked,
        mounted,
        setPinned,
        togglePinned,
        setPeeked,
        hasRail,
        setHasRail,
        openRailSection,
        registerRailOpener,
      }}
    >
      {children}
    </PageRailContext.Provider>
  );
}

export const usePageRail = () => useContext(PageRailContext);

/** Width of the pinned rail, in the one place both the rail and the main column read it. */
export const PAGE_RAIL_WIDTH = '17rem';
/** Width of the collapsed icon strip. */
export const PAGE_RAIL_COLLAPSED_WIDTH = '3.25rem';
