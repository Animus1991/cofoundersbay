/**
 * The three first pages under trial (docs §116). The owner compares them in
 * full and chooses which one people meet first; `/dashboard` stays where it
 * points until then. Afterwards this list is the one place to change it.
 */
export type HomeVariant = 'people' | 'feed' | 'dashboard';

export const HOME_VARIANTS: ReadonlyArray<{ value: HomeVariant; href: string; en: string; el: string }> = [
  { value: 'people', href: '/home/people', en: 'People first', el: 'Άνθρωποι πρώτα' },
  { value: 'feed', href: '/home/feed', en: 'Feed', el: 'Ροή' },
  { value: 'dashboard', href: '/dashboard', en: 'Dashboard', el: 'Πίνακας' },
];
