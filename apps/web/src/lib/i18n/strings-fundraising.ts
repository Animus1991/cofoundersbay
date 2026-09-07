import type { BilingualPair } from './types';
import {
  resolveBilingualPair,
  useLanguagePreference,
} from './LanguagePreferenceContext';

export const FUNDRAISING_STRINGS: Record<string, BilingualPair> = {
  ask_ai: { en: 'Ask AI', el: 'Ρωτήστε το AI' },
  ask_ai_plan: {
    en: 'Ask AI who to contact next in this round',
    el: 'Ρωτήστε το AI ποιον να προσεγγίσετε μετά σε αυτόν τον γύρο',
  },
  ask_ai_hint: {
    en: 'Prioritise the pipeline from Builder, Pitch deck, and Data Room gaps.',
    el: 'Ιεραρχήστε το pipeline από Builder, pitch deck και κενά του Data Room.',
  },
  add_investor: { en: 'Add investor', el: 'Προσθήκη επενδυτή' },
  add_lead: { en: 'Add contact', el: 'Προσθήκη επαφής' },
  add_to_stage: { en: 'Add', el: 'Προσθήκη' },
  find_investors: { en: 'Find investors', el: 'Εύρεση επενδυτών' },
  tab_pipeline: { en: 'Pipeline', el: 'Αγωγός' },
  tab_kanban: { en: 'Kanban', el: 'Kanban' },
  tab_dataroom: { en: 'Data room', el: 'Data room' },

  round_active: { en: 'Active', el: 'Ενεργός' },
  round_planning: { en: 'Planning', el: 'Σχεδιασμός' },
  round_closing: { en: 'Closing', el: 'Κλείσιμο' },
  round_closed: { en: 'Closed', el: 'Κλειστός' },
  pre_money: { en: 'pre-money valuation', el: 'προ-χρηματικής αποτίμησης' },
  valuation_tbd: { en: 'Valuation TBD', el: 'Αποτίμηση εκκρεμεί' },
  raised: { en: 'raised', el: 'αντλήθηκαν' },
  target: { en: 'target', el: 'στόχος' },
  of_target: { en: 'of target', el: 'του στόχου' },
  remaining: { en: 'remaining', el: 'απομένουν' },
  stat_investors: { en: 'Investors', el: 'Επενδυτές' },
  stat_committed_amt: { en: 'Committed', el: 'Δεσμευμένα' },
  stat_closing: { en: 'Closing', el: 'Κλείσιμο' },
  days_left: { en: 'd left', el: 'ημ. απομένουν' },
  overdue: { en: 'Overdue', el: 'Εκπρόθεσμο' },
  closing_tbd: { en: 'TBD', el: 'Εκκρεμεί' },
  lead_investor: { en: 'Lead investor', el: 'Επικεφαλής επενδυτής' },
  none_yet: { en: 'None yet', el: 'Κανένας ακόμα' },

  stat_leads: { en: 'Total contacts', el: 'Συνολικές επαφές' },
  stat_active: { en: 'Active discussions', el: 'Ενεργές συζητήσεις' },
  stat_committed: { en: 'Committed', el: 'Δεσμευμένοι' },
  stat_conversion: { en: 'Conversion rate', el: 'Ποσοστό μετατροπής' },

  st_prospect: { en: 'Prospect', el: 'Υποψήφιος' },
  st_contacted: { en: 'Contacted', el: 'Επικοινωνία' },
  st_meeting: { en: 'Meeting', el: 'Συνάντηση' },
  st_dd: { en: 'Due diligence', el: 'Έλεγχος' },
  st_committed: { en: 'Committed', el: 'Δεσμευμένος' },
  st_passed: { en: 'Passed', el: 'Απορρίφθηκε' },

  last_contact: { en: 'Last contact', el: 'Τελευταία επαφή' },
  message: { en: 'Message', el: 'Μήνυμα' },
  view_details: { en: 'View details', el: 'Λεπτομέρειες' },
  move_to: { en: 'Move to', el: 'Μετακίνηση σε' },

  empty_pipeline_title: { en: 'No contacts in the pipeline', el: 'Δεν υπάρχουν επαφές στον αγωγό' },
  empty_pipeline_hint: {
    en: 'Add a contact or find investors. Ask AI who fits this round.',
    el: 'Προσθέστε επαφή ή βρείτε επενδυτές. Ρωτήστε το AI ποιος ταιριάζει σε αυτόν τον γύρο.',
  },
  empty_round_title: { en: 'No active round yet', el: 'Δεν υπάρχει ενεργός γύρος' },
  empty_round_hint: {
    en: 'Ask AI to draft target, instrument, and a first investor list from Builder artefacts.',
    el: 'Ρωτήστε το AI να συντάξει στόχο, εργαλείο και πρώτη λίστα επενδυτών από τον Builder.',
  },

  dr_health: { en: 'Data room health', el: 'Υγεία data room' },
  dr_required: { en: 'required docs ready', el: 'υποχρεωτικά έγγραφα έτοιμα' },
  dr_total: { en: 'total docs ready', el: 'σύνολο εγγράφων έτοιμα' },
  dr_complete: { en: 'complete', el: 'ολοκληρωμένο' },
  share_room: { en: 'Share room', el: 'Κοινοποίηση χώρου' },
  share_done: { en: 'Data room link copied', el: 'Ο σύνδεσμος του data room αντιγράφηκε' },
  share_hint: {
    en: 'Tokenised link — nothing is public unless you send it.',
    el: 'Σύνδεσμος με token — τίποτα δεν είναι δημόσιο αν δεν τον στείλετε.',
  },
  required: { en: 'Required', el: 'Υποχρεωτικό' },
  updated: { en: 'Updated', el: 'Ενημερώθηκε' },
  doc_draft: { en: 'Draft', el: 'Πρόχειρο' },
  doc_ready: { en: 'Ready', el: 'Έτοιμο' },
  doc_shared: { en: 'Shared', el: 'Κοινοποιημένο' },
  cat_all: { en: 'All', el: 'Όλα' },
  cat_pitch: { en: 'Pitch', el: 'Pitch' },
  cat_financials: { en: 'Financials', el: 'Οικονομικά' },
  cat_legal: { en: 'Legal', el: 'Νομικά' },
  cat_product: { en: 'Product', el: 'Προϊόν' },
  cat_market: { en: 'Market', el: 'Αγορά' },
  cat_team: { en: 'Team', el: 'Ομάδα' },
  cat_traction: { en: 'Traction', el: 'Traction' },
  upload: { en: 'Upload', el: 'Μεταφόρτωση' },
  download: { en: 'Download', el: 'Λήψη' },
  upload_done: { en: 'Upload queued', el: 'Η μεταφόρτωση μπήκε στην ουρά' },
  download_done: { en: 'Download started', el: 'Η λήψη ξεκίνησε' },
  empty_docs: { en: 'No documents in this category', el: 'Δεν υπάρχουν έγγραφα σε αυτή την κατηγορία' },

  resources: { en: 'Fundraising resources', el: 'Πόροι χρηματοδότησης' },
  res_playbook: { en: 'Seed fundraising playbook', el: 'Οδηγός seed χρηματοδότησης' },
  res_playbook_desc: { en: 'From first pitch to close', el: 'Από το πρώτο pitch μέχρι το κλείσιμο' },
  res_find: { en: 'Find investors', el: 'Εύρεση επενδυτών' },
  res_find_desc: { en: 'Browse active investors on CoFounderBay', el: 'Δείτε ενεργούς επενδυτές στο CoFounderBay' },
  res_ready: { en: 'Readiness score', el: 'Βαθμός ετοιμότητας' },
  res_ready_desc: { en: 'See how investor-ready the startup is', el: 'Δείτε πόσο έτοιμο είναι το startup για επενδυτές' },
  res_deck: { en: 'Pitch deck builder', el: 'Κατασκευή pitch deck' },
  res_deck_desc: { en: 'Draft slides from Builder artefacts', el: 'Συντάξτε διαφάνειες από τον Builder' },

  modal_new: { en: 'New investor contact', el: 'Νέα επαφή επενδυτή' },
  field_name: { en: 'Name', el: 'Όνομα' },
  name_ph: { en: 'e.g. Sarah Chen', el: 'π.χ. Sarah Chen' },
  field_firm: { en: 'Firm', el: 'Εταιρεία' },
  firm_ph: { en: 'Optional', el: 'Προαιρετικό' },
  field_type: { en: 'Type', el: 'Τύπος' },
  field_stage: { en: 'Stage focus', el: 'Εστίαση σταδίου' },
  field_check: { en: 'Check size', el: 'Μέγεθος επιταγής' },
  field_status: { en: 'Pipeline stage', el: 'Στάδιο αγωγού' },
  field_notes: { en: 'Notes', el: 'Σημειώσεις' },
  notes_ph: { en: 'Interest, intro path, next step…', el: 'Ενδιαφέρον, γνωριμία, επόμενο βήμα…' },
  cancel: { en: 'Cancel', el: 'Ακύρωση' },
  save: { en: 'Save contact', el: 'Αποθήκευση επαφής' },
  created: { en: 'Contact added', el: 'Η επαφή προστέθηκε' },
  created_hint: { en: 'It now appears in Pipeline and Kanban.', el: 'Εμφανίζεται στον Αγωγό και στο Kanban.' },
  moved: { en: 'Stage updated', el: 'Το στάδιο ενημερώθηκε' },
};

export function fundraisingEn(key: keyof typeof FUNDRAISING_STRINGS): string {
  return FUNDRAISING_STRINGS[key].en;
}

export function fundraisingEl(key: keyof typeof FUNDRAISING_STRINGS): string {
  return FUNDRAISING_STRINGS[key].el;
}

export function useFundraisingPrimaryText() {
  const { primary, showSecondary } = useLanguagePreference();
  return (en: string, el: string) => resolveBilingualPair(en, el, primary, showSecondary).primaryText;
}

export const INVESTOR_STATUS_KEYS: Record<string, keyof typeof FUNDRAISING_STRINGS> = {
  prospect: 'st_prospect',
  contacted: 'st_contacted',
  meeting: 'st_meeting',
  dd: 'st_dd',
  committed: 'st_committed',
  passed: 'st_passed',
};

export const ROUND_STATUS_KEYS: Record<string, keyof typeof FUNDRAISING_STRINGS> = {
  planning: 'round_planning',
  active: 'round_active',
  closing: 'round_closing',
  closed: 'round_closed',
};

export const DOC_STATUS_KEYS: Record<string, keyof typeof FUNDRAISING_STRINGS> = {
  draft: 'doc_draft',
  ready: 'doc_ready',
  shared: 'doc_shared',
};

export const DOC_CATEGORY_KEYS: Record<string, keyof typeof FUNDRAISING_STRINGS> = {
  All: 'cat_all',
  Pitch: 'cat_pitch',
  Financials: 'cat_financials',
  Legal: 'cat_legal',
  Product: 'cat_product',
  Market: 'cat_market',
  Team: 'cat_team',
  Traction: 'cat_traction',
};
