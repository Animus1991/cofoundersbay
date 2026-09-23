'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, PanelRight } from 'lucide-react';
import { CfbGlyph, type CfbGlyphName } from '@/components/icons/CfbGlyph';
import { BilingualText } from '@/components/common/BilingualText';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import {
  PAGE_RAIL_COLLAPSED_WIDTH,
  PAGE_RAIL_WIDTH,
  usePageRail,
} from './PageRailContext';

/**
 * One group of a page's supporting tools.
 *
 * A section is a *family*, not a pile: filters, or export, or settings - the
 * thing a reader is looking for when they look right. Splitting them means the
 * collapsed rail can show one icon per family, which is what makes a 52px
 * strip legible at all.
 */
export type PageRailSection = {
  id: string;
  glyph: CfbGlyphName;
  labelEn: string;
  labelEl: string;
  /** Rendered only while the rail is open, so a closed rail costs nothing. */
  content: ReactNode;
  /**
   * A number worth seeing without opening the rail - active filters, pending
   * items. Zero and null both mean "no badge"; a badge reading 0 is noise.
   */
  badge?: number | string | null;
};

/**
 * The page rail.
 *
 * Every page's supporting controls, moved out of the reading column and kept
 * one gesture away. Nothing is removed by moving here: each control keeps its
 * label, its tooltip and its keyboard path, and the rail is reachable at every
 * width - as a rail on the desktop, as a sheet below `lg`, where there is no
 * room for a second one.
 *
 * Opening works two ways, and they mean different things. Hovering *peeks*:
 * the panel floats over the page, nothing reflows, and it closes when the
 * pointer leaves. Clicking the pin *keeps* it: the preference persists and the
 * main column is laid out around it. Reflowing on hover would move the text
 * under the reader every time they crossed the right edge, which is why the
 * two are separate.
 */
export function PageRail({ sections }: { sections: PageRailSection[] }) {
  const { pinned, peeked, open, togglePinned, setPeeked, setHasRail } = usePageRail();
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tell the frame a rail exists, so the main column reserves the strip and the
  // floating chat button steps aside. Cleared on unmount, so navigating to a
  // page without a rail gives the width straight back.
  useEffect(() => {
    setHasRail(sections.length > 0);
    return () => setHasRail(false);
  }, [sections.length, setHasRail]);

  // The first section is the one a reader most likely wants; opening the rail
  // with everything collapsed would cost a second click to do anything.
  useEffect(() => {
    if (open && !activeId && sections.length > 0) setActiveId(sections[0].id);
  }, [open, activeId, sections]);

  // Escape closes a peek. It deliberately does not unpin: Escape dismisses what
  // is floating, it does not undo a preference.
  useEffect(() => {
    if (!peeked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPeeked(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [peeked, setPeeked]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  if (sections.length === 0) return null;

  const openPeek = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!pinned) setPeeked(true);
  };

  // A short grace period: crossing the seam between the strip and the panel, or
  // overshooting a target by a few pixels, should not slam the panel shut.
  const closePeek = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPeeked(false), 180);
  };

  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        aria-label={bilingualAria('Page tools', 'Εργαλεία σελίδας')}
        // Below `lg` this is a sheet opened from the header, not a rail: two
        // rails do not fit on a tablet.
        // Same layer as the left sidebar (SideNav is z-40): the two are the
        // same kind of chrome, and a peeked panel has to float over anything a
        // page puts in its own column. At z-30 the research canvas's toolbar
        // (z-50 inside a non-isolated column) sat on top of the panel's header
        // and its first rows, and clicks landed on the toolbar instead.
        className="fixed bottom-0 right-0 top-0 z-40 hidden lg:flex"
        style={{ paddingTop: 'var(--top-banner-stack, 0px)' }}
        onMouseEnter={openPeek}
        onMouseLeave={closePeek}
      >
        <div className="flex h-full">
          {/* The panel. Rendered to the left of the strip so the strip stays
              flush with the window edge whether or not the panel is out. */}
          <div
            className={cn(
              'h-full overflow-hidden border-l border-border/60 bg-card transition-[width,opacity] duration-200 ease-out',
              open ? 'opacity-100' : 'w-0 opacity-0',
              // A peek floats over the page; a pin is part of the layout, so it
              // casts no shadow and needs none.
              peeked && !pinned ? 'shadow-xl' : '',
            )}
            style={{ width: open ? PAGE_RAIL_WIDTH : 0 }}
            aria-hidden={!open}
          >
            {open && (
              <div className="flex h-full w-[17rem] flex-col">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
                  {/* Stacked, not inline-truncated: "PLATFORM TOTALS · ΣΥΝΟΛΑ
                      ΠΛΑΤΦΟΡΜΑΣ" is wider than the panel, and an ellipsis on
                      the one line that names what the reader is looking at is
                      the wrong thing to lose. Two short lines fit any label the
                      contract test lets through. */}
                  <div className="min-w-0 text-xs font-semibold uppercase leading-snug tracking-wider text-muted-foreground">
                    <BilingualText en={active.labelEn} el={active.labelEl} stacked wrap />
                  </div>
                  <button
                    type="button"
                    onClick={togglePinned}
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    aria-pressed={pinned}
                    aria-label={
                      pinned
                        ? bilingualAria('Unpin page tools', 'Ξεκαρφίτσωμα εργαλείων')
                        : bilingualAria('Keep page tools open', 'Διατήρηση εργαλείων ανοιχτών')
                    }
                  >
                    {pinned ? (
                      <ChevronRight className="icon-sm" aria-hidden="true" />
                    ) : (
                      <ChevronLeft className="icon-sm" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">{active.content}</div>
              </div>
            )}
          </div>

          {/* The strip. Always visible, one icon per family. */}
          <div
            className="flex h-full flex-col items-center gap-1 border-l border-border/60 bg-background py-3"
            style={{ width: PAGE_RAIL_COLLAPSED_WIDTH }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={togglePinned}
                  className={cn(
                    'mb-1 rounded-md p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
                    pinned
                      ? 'bg-primary/10 text-primary-accessible'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-pressed={pinned}
                  aria-label={
                    pinned
                      ? bilingualAria('Unpin page tools', 'Ξεκαρφίτσωμα εργαλείων')
                      : bilingualAria('Keep page tools open', 'Διατήρηση εργαλείων ανοιχτών')
                  }
                >
                  <PanelRight className="icon-md" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                <BilingualText en="Page tools" el="Εργαλεία σελίδας" />
              </TooltipContent>
            </Tooltip>

            <div className="h-px w-6 bg-border/60" />

            {sections.map((section) => {
              const isActive = open && section.id === active.id;
              const badge =
                section.badge === 0 || section.badge == null ? null : section.badge;
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(section.id);
                        // Clicking an icon is a commitment, not a glance.
                        if (!pinned) togglePinned();
                      }}
                      onFocus={openPeek}
                      onMouseEnter={() => setActiveId(section.id)}
                      className={cn(
                        'relative rounded-md p-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
                        isActive
                          ? 'bg-primary/10 text-primary-accessible'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                      aria-expanded={isActive}
                    >
                      <CfbGlyph name={section.glyph} className="icon-md" />
                      {badge != null && (
                        <span
                          className="absolute -right-0.5 -top-0.5 min-w-[1rem] rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-primary-foreground"
                          aria-hidden="true"
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    <BilingualText en={section.labelEn} el={section.labelEl} />
                    {badge != null && <span className="ml-1 opacity-70">({badge})</span>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
