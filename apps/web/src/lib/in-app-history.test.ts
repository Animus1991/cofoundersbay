import { beforeEach, describe, expect, it } from 'vitest';
import { hasInAppPrevious, recordInAppView } from './in-app-history';

beforeEach(() => window.sessionStorage.clear());

describe('in-app history (docs §75)', () => {
  it('has nothing to go back to on the first page of the tab', () => {
    recordInAppView();
    expect(hasInAppPrevious()).toBe(false);
  });

  it('goes back once a second page has been viewed', () => {
    recordInAppView();
    recordInAppView();
    expect(hasInAppPrevious()).toBe(true);
  });
});
