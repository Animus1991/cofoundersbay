'use client';

import { createContext } from 'react';

/**
 * The page header's meta row, for things that describe the page rather than
 * belong to its content - today the collapsed "Sample data" note.
 *
 * That note rendered as a lone pill on its own row between the header and the
 * first card on nineteen pages, pushing the content down and reading like a
 * debug label. Pages still place it where they always did; inside a page
 * header it portals into this row, beside the page's own header actions, and
 * only its expanded form opens in the flow. `inHeader` false means there is
 * no header to join (a page without a title), so it stays where it was put.
 */
export const PageHeaderSlot = createContext<{ inHeader: boolean; slot: HTMLElement | null }>({ inHeader: false, slot: null });

/**
 * Where the page header's tools (the pin star, the help "?") land when the
 * header itself is visually off — a hero card whose greeting is the page's
 * one visible heading (`titleSrOnly`, docs §133). Without it those tools
 * floated alone in an otherwise empty header band. The AppShell owns the
 * buttons and portals them into the div a hero registers through this
 * setter; a page with no hero registers nothing and keeps the band off.
 */
export const HeroActionsSlot = createContext<(slot: HTMLElement | null) => void>(() => {});
