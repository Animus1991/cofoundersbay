/**
 * The open pitch deck, for the assistant (docs §113).
 *
 * The deck's state lives in `PitchDeckBuilder`, so a capability that rewrites a
 * slide has to reach that component and not the API: writing past it would leave
 * the screen showing the old text, and the next Save would put it back. The
 * builder registers itself while it is mounted; with no deck on screen there is
 * no editor, and the executor says so instead of reporting a change.
 */

export type PitchSlideChange = { id: string; before: string };

export type PitchDeckEditor = {
  /** Rewrites the slide a person named, by number or by title, and saves the deck. */
  setSlide: (ref: string, content: string) => Promise<PitchSlideChange | null>;
  /** Puts a slide's earlier text back and saves the deck. */
  restoreSlide: (id: string, content: string) => Promise<boolean>;
};

let editor: PitchDeckEditor | null = null;

export function registerPitchDeckEditor(next: PitchDeckEditor): () => void {
  editor = next;
  return () => {
    if (editor === next) editor = null;
  };
}

export function pitchDeckEditor(): PitchDeckEditor | null {
  return editor;
}

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Which slide a person means: "2", «Πρόβλημα», "the problem". */
export function findSlideIndex(ref: string, slides: ReadonlyArray<{ names: readonly string[] }>): number {
  const wanted = plain(ref).replace(/^(the|το|τη|την)\s+/, '');
  if (/^\d+$/.test(wanted)) {
    const index = Number(wanted) - 1;
    return index >= 0 && index < slides.length ? index : -1;
  }
  const exact = slides.findIndex((slide) => slide.names.some((name) => plain(name) === wanted));
  if (exact >= 0) return exact;
  return wanted ? slides.findIndex((slide) => slide.names.some((name) => plain(name).includes(wanted))) : -1;
}
