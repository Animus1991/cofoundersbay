/**
 * What the comparison bar moves between (docs §117). The first page is the
 * people with the feed under them; the owner is still looking at where the
 * dashboard and the first visit belong. It goes once that is settled.
 */
export type HomeVariant = 'home' | 'dashboard';

export const HOME_VARIANTS: ReadonlyArray<{ value: HomeVariant; href: string; en: string; el: string }> = [
  { value: 'home', href: '/home', en: 'Home', el: 'Αρχική' },
  { value: 'dashboard', href: '/dashboard/founder', en: 'Dashboard', el: 'Πίνακας' },
];
