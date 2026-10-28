import type { BilingualPair } from './types';

/**
 * /learning — courses, guides, and paths aligned with readiness gaps.
 *
 * «Μάθηση» is the hub. A «μονοπάτι» is a sequenced curriculum (learning path);
 * a «πόρος» is one article, video, or course. A course is «μάθημα»: the
 * page wrote «Courses» while the assistant and the catalogue wrote «μάθημα»,
 * one thing with two names; the Greek word won (owner, 2026-10-28; docs
 * §90.5, §111). The hub title «Κέντρο μάθησης» is in the page registry.
 */
export const LEARNING_STRINGS: Record<string, BilingualPair> = {
  stat_resources: { en: 'Resources', el: 'Πόροι' },
  stat_courses: { en: 'Courses', el: 'Μαθήματα' },
  stat_hours: { en: 'Total hours', el: 'Συνολικές ώρες' },
  stat_progress: { en: 'In progress', el: 'Σε εξέλιξη' },

  paths: { en: 'Learning paths', el: 'Μονοπάτια μάθησης' },
  paths_count: { en: 'paths', el: 'μονοπάτια' },
  recommended: { en: 'Recommended for you', el: 'Προτεινόμενα για εσάς' },
  // «Προτεινόμενα» is "Recommended for you"; "Featured" is the library's own
  // pick, so it takes another word (docs §90).
  featured: { en: 'Featured resources', el: 'Επιλεγμένοι πόροι' },
  all_resources: { en: 'All resources', el: 'Όλοι οι πόροι' },
  tab_all: { en: 'All resources', el: 'Όλοι οι πόροι' },
  tab_saved: { en: 'Saved', el: 'Αποθηκευμένα' },
  tab_completed: { en: 'Completed', el: 'Ολοκληρωμένα' },

  search: { en: 'Search courses, guides, topics…', el: 'Αναζήτηση μαθημάτων, οδηγών, θεμάτων…' },
  type_all: { en: 'All types', el: 'Όλοι οι τύποι' },
  type_course: { en: 'Courses', el: 'Μαθήματα' },
  type_guide: { en: 'Guides', el: 'Οδηγοί' },
  type_video: { en: 'Videos', el: 'Βίντεο' },
  type_article: { en: 'Articles', el: 'Άρθρα' },
  type_podcast: { en: 'Podcasts', el: 'Podcasts' },
  type_book: { en: 'Books', el: 'Βιβλία' },
  type_tool: { en: 'Tools', el: 'Εργαλεία' },
  type_template: { en: 'Templates', el: 'Πρότυπα' },
  cat_all: { en: 'All', el: 'Όλα' },

  difficulty_beginner: { en: 'Beginner', el: 'Αρχάριοι' },
  difficulty_intermediate: { en: 'Intermediate', el: 'Μεσαίο' },
  difficulty_advanced: { en: 'Advanced', el: 'Προχωρημένο' },
  featured_badge: { en: 'Featured', el: 'Επιλεγμένο' },
  start: { en: 'Start', el: 'Έναρξη' },
  open: { en: 'Open', el: 'Άνοιγμα' },
  modules: { en: '{n} modules', el: '{n} ενότητες' },
  percent_done: { en: '{n}% done', el: '{n}% ολοκληρωμένο' },
  continue_path: { en: 'Continue path', el: 'Συνέχεια μονοπατιού' },
  start_path: { en: 'Start path', el: 'Έναρξη μονοπατιού' },

  path_fast_title: { en: 'Founder fast track', el: 'Γρήγορη πορεία ιδρυτή' },
  path_fast_desc: {
    en: 'Go from idea to funded startup in structured steps',
    el: 'Από την ιδέα στο χρηματοδοτημένο startup με δομημένα βήματα',
  },
  path_fund_title: { en: 'Fundraising mastery', el: 'Χρηματοδότηση' },
  path_fund_desc: {
    en: 'Seed to Series A — pitching, term sheets, VC psychology',
    el: 'Από seed σε Series A — pitch, term sheets, ψυχολογία VC',
  },
  path_growth_title: { en: 'Growth playbook', el: 'Playbook ανάπτυξης' },
  path_growth_desc: {
    en: 'Proven frameworks for user acquisition and retention',
    el: 'Δοκιμασμένα πλαίσια για απόκτηση και διατήρηση χρηστών',
  },
  path_team_title: { en: 'Team & culture builder', el: 'Ομάδα και κουλτούρα' },
  path_team_desc: {
    en: 'Hire, retain, and lead high-performance startup teams',
    el: 'Πρόσληψη, διατήρηση και ηγεσία ομάδων υψηλής απόδοσης',
  },

  empty: { en: 'No resources found', el: 'Δεν βρέθηκαν πόροι' },
  empty_hint: { en: 'Try adjusting your search or filters', el: 'Αλλάξτε την αναζήτηση ή τα φίλτρα' },
};

export function learningEn(key: keyof typeof LEARNING_STRINGS): string {
  return LEARNING_STRINGS[key].en;
}

export function learningEl(key: keyof typeof LEARNING_STRINGS): string {
  return LEARNING_STRINGS[key].el;
}

/**
 * The topics a library usually holds, in Greek. The category chips take their
 * names from the library, which writes them in English, and the page-wide
 * translation pass knew four of the six samples' topics: «Sales» and «Tech» were
 * the two English chips in a row of Greek ones. A topic the library invents
 * stays as written.
 */
const CATEGORY_EL: Record<string, string> = {
  Fundraising: 'Χρηματοδότηση',
  Product: 'Προϊόν',
  Marketing: 'Μάρκετινγκ',
  Sales: 'Πωλήσεις',
  Leadership: 'Ηγεσία',
  Tech: 'Τεχνολογία',
};

export function learningCategoryEl(category: string): string {
  return CATEGORY_EL[category] ?? category;
}
