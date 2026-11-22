/**
 * How many capability cards a closed section shows before "Show all": two
 * rows on a phone, three on wider screens. The rest stay in the DOM order and
 * open with one press; a search shows every match (docs §91, §124).
 */
export const PHONE_FIRST = 6;
export const DESKTOP_FIRST = 9;

/** Classes that fold a card away while its section is closed and nothing is searched. */
export function foldedCardClass(index: number, open: boolean, searching: boolean): string | undefined {
  if (open || searching) return undefined;
  if (index >= DESKTOP_FIRST) return 'hidden';
  if (index >= PHONE_FIRST) return 'max-sm:hidden';
  return undefined;
}

/** Whether a closed section of `count` cards needs the "Show all" button, and where. */
export function showAllClass(count: number, open: boolean, searching: boolean): string | null {
  if (open || searching || count <= PHONE_FIRST) return null;
  return count <= DESKTOP_FIRST ? 'mt-3 w-full sm:hidden' : 'mt-3 w-full sm:w-auto';
}
