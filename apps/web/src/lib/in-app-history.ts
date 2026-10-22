/**
 * Whether "Back" has an in-app page to go back to (docs §75).
 *
 * A Back button that always went to one place (/profiles/[id] went to
 * Explore) was wrong for a reader who came from Messages; `router.back()`
 * alone is wrong for one who arrived from a link outside the product, where
 * it leaves the site. `document.referrer` cannot tell: client navigation
 * never changes it. So the app frame counts the pages viewed in this tab,
 * and Back goes back only when there is one before this.
 */
const KEY = 'cfb:in-app-views';

export function recordInAppView(): void {
  try {
    const seen = Number(window.sessionStorage.getItem(KEY) ?? '0');
    window.sessionStorage.setItem(KEY, String((Number.isFinite(seen) ? seen : 0) + 1));
  } catch {
    // Storage blocked: Back falls back to its default page.
  }
}

export function hasInAppPrevious(): boolean {
  try {
    return Number(window.sessionStorage.getItem(KEY) ?? '0') > 1;
  } catch {
    return false;
  }
}
