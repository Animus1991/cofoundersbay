import type { BilingualPair } from './types';

/**
 * Discover / Explore page — bilingual EN + EL.
 */
export const DISCOVER_STRINGS: Record<string, BilingualPair> = {
  page_title: { en: 'Explore', el: 'Εξερεύνηση' },
  page_description: {
    en: 'Discover founders, mentors, investors, and team members',
    el: 'Ανακαλύψτε ιδρυτές, μέντορες, επενδυτές και μέλη ομάδας',
  },
  view_matches: { en: 'View Matches', el: 'Προβολή αντιστοιχίσεων' },

  // tabs
  search: { en: 'Search', el: 'Αναζήτηση' },
  for_you: { en: 'For You', el: 'Για εσάς' },
  top_matches: { en: 'Top Matches', el: 'Κορυφαίες αντιστοιχίσεις' },

  // role filters
  all: { en: 'All', el: 'Όλοι' },
  founders: { en: 'Founders', el: 'Ιδρυτές' },
  cofounders: { en: 'Co-founders', el: 'Συνιδρυτές' },
  mentors: { en: 'Mentors', el: 'Μέντορες' },
  investors: { en: 'Investors', el: 'Επενδυτές' },
  service_providers: { en: 'Service Providers', el: 'Πάροχοι υπηρεσιών' },
  clear: { en: 'Clear', el: 'Εκκαθάριση' },

  // platform stats
  active_founders: { en: 'Active Founders', el: 'Ενεργοί ιδρυτές' },
  expert_mentors: { en: 'Expert Mentors', el: 'Ειδικοί μέντορες' },
  successful_matches: { en: 'Successful Matches', el: 'Επιτυχείς αντιστοιχίσεις' },
  communities: { en: 'Communities', el: 'Κοινότητες' },

  // empty / action
  no_results: { en: 'No results found', el: 'Δεν βρέθηκαν αποτελέσματα' },
  try_broader: { en: 'Try broadening your filters or search term.', el: 'Δοκιμάστε ευρύτερα φίλτρα ή αναζήτηση.' },
  no_suggestions: { en: 'No suggestions yet', el: 'Δεν υπάρχουν προτάσεις ακόμα' },
  no_suggestions_desc: {
    en: 'Complete your profile to receive personalized recommendations.',
    el: 'Ολοκληρώστε το προφίλ σας για εξατομικευμένες προτάσεις.',
  },
  sign_in_for_suggestions: { en: 'Sign in to see suggestions', el: 'Συνδεθείτε για προτάσεις' },
  find_people: { en: 'Find people', el: 'Εύρεση ατόμων' },
  view_all: { en: 'View all', el: 'Προβολή όλων' },
  explore_more: { en: 'Explore more', el: 'Εξερεύνηση περισσότερων' },

  // toast
  connection_sent: { en: 'Connection request sent!', el: 'Το αίτημα σύνδεσης στάλθηκε!' },
  profile_saved: { en: 'Profile saved', el: 'Προφίλ αποθηκεύτηκε' },
  added_bookmarks: { en: 'added to your bookmarks', el: 'προστέθηκε στους σελιδοδείκτες' },
  could_not_send: { en: 'Could not send request', el: 'Αδυναμία αποστολής αιτήματος' },
  search_failed: { en: 'Search failed', el: 'Η αναζήτηση απέτυχε' },
};

export function discoverEn(key: keyof typeof DISCOVER_STRINGS): string {
  return DISCOVER_STRINGS[key].en;
}

export function discoverEl(key: keyof typeof DISCOVER_STRINGS): string {
  return DISCOVER_STRINGS[key].el;
}
