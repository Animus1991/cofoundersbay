import type { BilingualPair } from './types';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from './LanguagePreferenceContext';

export const MILESTONE_STRINGS: Record<string, BilingualPair> = {
  ask_ai: { en: 'Ask AI', el: 'Ρωτήστε το AI' },
  ask_ai_plan: {
    en: 'Ask AI what to ship next',
    el: 'Ρωτήστε το AI τι να παραδώσετε μετά',
  },
  ask_ai_hint: {
    en: 'Propose the next three from Builder, the pitch deck, and anything overdue.',
    el: 'Προτείνετε τα επόμενα τρία από τον Builder, το pitch deck και ό,τι είναι εκπρόθεσμο.',
  },
  lead: {
    en: 'Each milestone is one goal with an owner and a date. Completing them feeds Readiness and investor updates. Ask AI to propose the next three from Builder artefacts.',
    el: 'Κάθε ορόσημο είναι ένας στόχος με υπεύθυνο και ημερομηνία. Η ολοκλήρωση τροφοδοτεί την Ετοιμότητα και τις ενημερώσεις επενδυτών. Ρωτήστε το AI να προτείνει τα επόμενα τρία από τον Builder.',
  },
  new_milestone: { en: 'New milestone', el: 'Νέο ορόσημο' },
  // Genitive plural of "ορόσημο" is "οροσήμων" (accent moves to the penult).
  search_ph: { en: 'Search milestones…', el: 'Αναζήτηση οροσήμων…' },
  all: { en: 'All', el: 'Όλα' },
  cat_product: { en: 'Product', el: 'Προϊόν' },
  cat_fundraising: { en: 'Fundraising', el: 'Χρηματοδότηση' },
  cat_hiring: { en: 'Hiring', el: 'Προσλήψεις' },
  cat_partnerships: { en: 'Partnerships', el: 'Συνεργασίες' },
  cat_growth: { en: 'Growth', el: 'Ανάπτυξη' },
  cat_other: { en: 'Other', el: 'Άλλο' },
  cat_none: { en: 'None', el: 'Κανένα' },
  // Plural forms: filter tabs describe a *set* ("Ολοκληρωμένα 6").
  status_todo: { en: 'To do', el: 'Προς εκτέλεση' },
  status_in_progress: { en: 'In progress', el: 'Σε εξέλιξη' },
  status_blocked: { en: 'Blocked', el: 'Αποκλεισμένα' },
  status_completed: { en: 'Completed', el: 'Ολοκληρωμένα' },
  status_cancelled: { en: 'Cancelled', el: 'Ακυρωμένα' },
  // Singular forms: the chip on one card and the status <select> describe a
  // *single* milestone — Greek adjectives agree in number, so "Ολοκληρωμένα"
  // on one row reads wrong. English is unchanged.
  status_todo_one: { en: 'To do', el: 'Προς εκτέλεση' },
  status_in_progress_one: { en: 'In progress', el: 'Σε εξέλιξη' },
  status_blocked_one: { en: 'Blocked', el: 'Αποκλεισμένο' },
  status_completed_one: { en: 'Completed', el: 'Ολοκληρωμένο' },
  status_cancelled_one: { en: 'Cancelled', el: 'Ακυρωμένο' },
  pri_low: { en: 'Low', el: 'Χαμηλή' },
  pri_medium: { en: 'Medium', el: 'Μεσαία' },
  pri_high: { en: 'High', el: 'Υψηλή' },
  pri_all: { en: 'All priorities', el: 'Όλες οι προτεραιότητες' },
  stat_total: { en: 'Total', el: 'Σύνολο' },
  stat_in_progress: { en: 'In progress', el: 'Σε εξέλιξη' },
  stat_completed: { en: 'Completed', el: 'Ολοκληρωμένα' },
  stat_overdue: { en: 'Overdue', el: 'Εκπρόθεσμα' },
  stat_rate: { en: 'Completion rate', el: 'Ποσοστό ολοκλήρωσης' },
  overdue: { en: 'Overdue', el: 'Εκπρόθεσμο' },
  due_soon: { en: 'Due soon', el: 'Λήγει σύντομα' },
  edit: { en: 'Edit', el: 'Επεξεργασία' },
  mark_complete: { en: 'Mark complete', el: 'Σήμανση ολοκλήρωσης' },
  reopen: { en: 'Reopen', el: 'Επανάνοιγμα' },
  delete: { en: 'Delete', el: 'Διαγραφή' },
  more: { en: 'Milestone actions', el: 'Ενέργειες ορόσημου' },
  view_list: { en: 'List view', el: 'Προβολή λίστας' },
  view_grid: { en: 'Grid view', el: 'Προβολή πλέγματος' },
  refresh: { en: 'Refresh', el: 'Ανανέωση' },
  empty_title: { en: 'No milestones yet', el: 'Δεν υπάρχουν ορόσημα' },
  empty_hint: {
    en: 'Add a goal with an owner and a date. Completed items raise Readiness and show up in investor updates.',
    el: 'Προσθέστε στόχο με υπεύθυνο και ημερομηνία. Τα ολοκληρωμένα ανεβάζουν την Ετοιμότητα και εμφανίζονται στις ενημερώσεις επενδυτών.',
  },
  empty_cta: { en: 'Add your first milestone', el: 'Προσθέστε το πρώτο σας ορόσημο' },
  empty_filter_title: { en: 'Nothing matches these filters', el: 'Τίποτα δεν ταιριάζει στα φίλτρα' },
  empty_filter_hint: {
    en: 'Clear search, category, or status to see the rest of the tracker.',
    el: 'Καθαρίστε αναζήτηση, κατηγορία ή κατάσταση για να δείτε τον υπόλοιπο πίνακα.',
  },
  clear_filters: { en: 'Clear filters', el: 'Καθαρισμός φίλτρων' },
  load_fail: { en: 'Failed to load milestones.', el: 'Αποτυχία φόρτωσης ορόσημων.' },
  retry: { en: 'Retry', el: 'Επανάληψη' },
  modal_new: { en: 'New milestone', el: 'Νέο ορόσημο' },
  modal_edit: { en: 'Edit milestone', el: 'Επεξεργασία ορόσημου' },
  field_title: { en: 'Title', el: 'Τίτλος' },
  title_ph: { en: 'e.g. Launch MVP to beta users', el: 'π.χ. Κυκλοφορία MVP σε beta χρήστες' },
  field_desc: { en: 'Description', el: 'Περιγραφή' },
  desc_ph: { en: 'What does this milestone represent?', el: 'Τι αντιπροσωπεύει αυτό το ορόσημο;' },
  field_status: { en: 'Status', el: 'Κατάσταση' },
  field_priority: { en: 'Priority', el: 'Προτεραιότητα' },
  field_category: { en: 'Category', el: 'Κατηγορία' },
  field_due: { en: 'Due date', el: 'Προθεσμία' },
  field_progress: { en: 'Progress', el: 'Πρόοδος' },
  field_collab: { en: 'Collaborator user ID', el: 'ID συνεργάτη' },
  collab_ph: { en: "Optional — paste a co-founder's user ID", el: 'Προαιρετικό — επικολλήστε το ID του συνιδρυτή' },
  collab_hint: {
    en: 'Both of you will be able to view and update this milestone.',
    el: 'Και οι δύο θα μπορείτε να βλέπετε και να ενημερώνετε αυτό το ορόσημο.',
  },
  field_notes: { en: 'Private notes', el: 'Ιδιωτικές σημειώσεις' },
  notes_ph: { en: 'Add context, blockers, or next actions…', el: 'Προσθέστε πλαίσιο, εμπόδια ή επόμενες ενέργειες…' },
  cancel: { en: 'Cancel', el: 'Ακύρωση' },
  saving: { en: 'Saving…', el: 'Αποθήκευση…' },
  save_changes: { en: 'Save changes', el: 'Αποθήκευση αλλαγών' },
  create: { en: 'Create milestone', el: 'Δημιουργία ορόσημου' },
  page_new_lead: {
    en: 'One goal, one owner, one date. Shared milestones also appear on your collaborator’s tracker.',
    el: 'Ένας στόχος, ένας υπεύθυνος, μία ημερομηνία. Τα κοινά ορόσημα εμφανίζονται και στον πίνακα του συνεργάτη.',
  },
  back: { en: 'Back to milestones', el: 'Πίσω στα ορόσημα' },
  create_title: { en: 'Create milestone', el: 'Δημιουργία ορόσημου' },
  create_shared: { en: 'Define a shared goal with your collaborator', el: 'Ορίστε κοινό στόχο με τον συνεργάτη σας' },
  create_solo: { en: 'Define a goal and start tracking progress', el: 'Ορίστε στόχο και παρακολουθήστε την πρόοδο' },
  created: { en: 'Milestone created', el: 'Το ορόσημο δημιουργήθηκε' },
  created_hint: { en: 'Added to your tracker.', el: 'Προστέθηκε στον πίνακα.' },
  fail_create: { en: 'Failed to create milestone', el: 'Αποτυχία δημιουργίας ορόσημου' },
  try_again: { en: 'Please try again', el: 'Δοκιμάστε ξανά' },
  creating: { en: 'Creating…', el: 'Δημιουργία…' },
  due_optional: { en: 'Due date (optional)', el: 'Προθεσμία (προαιρετικό)' },
};

export function milestoneEn(key: keyof typeof MILESTONE_STRINGS): string {
  return MILESTONE_STRINGS[key].en;
}

export function milestoneEl(key: keyof typeof MILESTONE_STRINGS): string {
  return MILESTONE_STRINGS[key].el;
}

export function useMilestonePrimaryText() {
  const { primary, showSecondary } = useLanguagePreference();
  return (en: string, el: string) => resolveBilingualPair(en, el, primary, showSecondary).primaryText;
}

export const MILESTONE_CATEGORY_KEYS: Record<string, keyof typeof MILESTONE_STRINGS> = {
  product: 'cat_product',
  fundraising: 'cat_fundraising',
  hiring: 'cat_hiring',
  partnerships: 'cat_partnerships',
  growth: 'cat_growth',
  other: 'cat_other',
};

export const MILESTONE_STATUS_KEYS: Record<string, keyof typeof MILESTONE_STRINGS> = {
  todo: 'status_todo',
  in_progress: 'status_in_progress',
  blocked: 'status_blocked',
  completed: 'status_completed',
  cancelled: 'status_cancelled',
};

/** Singular variants — for the chip on a single card and the status select. */
export const MILESTONE_STATUS_ONE_KEYS: Record<string, keyof typeof MILESTONE_STRINGS> = {
  todo: 'status_todo_one',
  in_progress: 'status_in_progress_one',
  blocked: 'status_blocked_one',
  completed: 'status_completed_one',
  cancelled: 'status_cancelled_one',
};

export const MILESTONE_PRIORITY_KEYS: Record<string, keyof typeof MILESTONE_STRINGS> = {
  low: 'pri_low',
  medium: 'pri_medium',
  high: 'pri_high',
};
