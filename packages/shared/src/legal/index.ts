/**
 * Legal Hub catalogue: the starter documents a founding team reaches for, by
 * the moment they need them. Static on purpose — a template's existence is not
 * member data — so the page, the assistant and any export read one list.
 */

type Bilingual = { en: string; el: string };

export type LegalCategoryId = 'incorporation' | 'ip' | 'hiring' | 'fundraising';

/**
 * How much a template matters at its moment. `critical` is the one a lawyer
 * would ask about first; `verified` is a standard form reviewed for this
 * market; `standard` is an industry norm; `optional` is good hygiene.
 */
export type LegalTemplateStatus = 'critical' | 'verified' | 'standard' | 'optional';

export type LegalTemplate = {
  id: string;
  category: LegalCategoryId;
  name: Bilingual;
  description: Bilingual;
  status: LegalTemplateStatus;
  /** The one question to settle before signing — what the assistant drafts around. */
  decide: Bilingual;
  /** Startup stages where this is usually needed. */
  stages: Array<'idea' | 'validating' | 'building' | 'launched' | 'scaling'>;
};

export const LEGAL_CATEGORIES: ReadonlyArray<{ id: LegalCategoryId; label: Bilingual; when: Bilingual }> = [
  { id: 'incorporation', label: { en: 'Incorporation', el: 'Σύσταση' }, when: { en: 'Before the first external money or the first hire.', el: 'Πριν τα πρώτα εξωτερικά χρήματα ή την πρώτη πρόσληψη.' } },
  { id: 'ip', label: { en: 'Intellectual property', el: 'Πνευματική ιδιοκτησία' }, when: { en: 'The day someone outside the founders writes code or designs for you.', el: 'Τη μέρα που κάποιος εκτός ιδρυτών γράφει κώδικα ή σχεδιάζει για εσάς.' } },
  { id: 'hiring', label: { en: 'Hiring', el: 'Προσλήψεις' }, when: { en: 'First employee, contractor or adviser.', el: 'Πρώτος εργαζόμενος, συνεργάτης ή σύμβουλος.' } },
  { id: 'fundraising', label: { en: 'Fundraising', el: 'Χρηματοδότηση' }, when: { en: 'An investor says yes in principle.', el: 'Όταν ένας επενδυτής λέει καταρχήν ναι.' } },
];

export const LEGAL_STATUS_COPY: Record<LegalTemplateStatus, Bilingual> = {
  critical: { en: 'Critical', el: 'Κρίσιμο' },
  verified: { en: 'Verified', el: 'Επαληθευμένο' },
  standard: { en: 'Industry standard', el: 'Πρότυπο αγοράς' },
  optional: { en: 'Optional', el: 'Προαιρετικό' },
};

export const LEGAL_TEMPLATES: readonly LegalTemplate[] = [
  { id: 'articles', category: 'incorporation', status: 'verified', stages: ['idea', 'validating', 'building'],
    name: { en: 'Articles of incorporation', el: 'Καταστατικό σύστασης' },
    description: { en: 'The founding document: name, purpose, share classes, registered office.', el: 'Το ιδρυτικό έγγραφο: επωνυμία, σκοπός, κατηγορίες μετοχών, έδρα.' },
    decide: { en: 'Which jurisdiction, and how many authorised shares.', el: 'Ποια δικαιοδοσία και πόσες εγκεκριμένες μετοχές.' } },
  { id: 'bylaws', category: 'incorporation', status: 'verified', stages: ['idea', 'validating', 'building'],
    name: { en: 'Bylaws', el: 'Εσωτερικός κανονισμός' },
    description: { en: 'How the company decides: board, meetings, officers, voting.', el: 'Πώς αποφασίζει η εταιρεία: ΔΣ, συνεδριάσεις, στελέχη, ψηφοφορία.' },
    decide: { en: 'Board size and what needs a board vote.', el: 'Μέγεθος ΔΣ και τι απαιτεί ψήφο ΔΣ.' } },
  { id: 'founder-stock', category: 'incorporation', status: 'critical', stages: ['idea', 'validating', 'building'],
    name: { en: 'Founder stock purchase agreement', el: 'Συμφωνία αγοράς μετοχών ιδρυτών' },
    description: { en: 'Each founder\u2019s shares, vesting schedule and what happens if someone leaves.', el: 'Μετοχές κάθε ιδρυτή, χρονοδιάγραμμα vesting και τι γίνεται αν κάποιος φύγει.' },
    decide: { en: 'Vesting: usually 4 years with a 1-year cliff. Agree it before the split feels unfair.', el: 'Vesting: συνήθως 4 χρόνια με cliff 1 έτους. Συμφωνήστε το πριν η μοιρασιά φανεί άδικη.' } },
  { id: 'piia', category: 'ip', status: 'critical', stages: ['idea', 'validating', 'building', 'launched'],
    name: { en: 'Proprietary information & inventions agreement', el: 'Συμφωνία εμπιστευτικών πληροφοριών και εφευρέσεων' },
    description: { en: 'Everything built for the company belongs to the company — founders included.', el: 'Ό,τι φτιάχνεται για την εταιρεία ανήκει στην εταιρεία — και από τους ιδρυτές.' },
    decide: { en: 'List prior inventions each founder keeps outside the company.', el: 'Καταγράψτε τις προηγούμενες εφευρέσεις που κάθε ιδρυτής κρατά εκτός εταιρείας.' } },
  { id: 'nda', category: 'ip', status: 'verified', stages: ['idea', 'validating', 'building', 'launched', 'scaling'],
    name: { en: 'Mutual NDA', el: 'Αμοιβαίο NDA' },
    description: { en: 'For partners and pilots. Most investors will not sign one — ask the assistant why.', el: 'Για συνεργάτες και πιλότους. Οι περισσότεροι επενδυτές δεν υπογράφουν — ρωτήστε τον βοηθό γιατί.' },
    decide: { en: 'Term (2–3 years) and what counts as confidential.', el: 'Διάρκεια (2–3 έτη) και τι θεωρείται εμπιστευτικό.' } },
  { id: 'trademark', category: 'ip', status: 'standard', stages: ['building', 'launched', 'scaling'],
    name: { en: 'Trademark assignment', el: 'Εκχώρηση εμπορικού σήματος' },
    description: { en: 'Moves a name or logo a founder registered personally into the company.', el: 'Μεταφέρει όνομα ή λογότυπο που κατοχύρωσε προσωπικά ένας ιδρυτής στην εταιρεία.' },
    decide: { en: 'Which marks, which classes, which countries.', el: 'Ποια σήματα, ποιες κλάσεις, ποιες χώρες.' } },
  { id: 'offer-letter', category: 'hiring', status: 'verified', stages: ['building', 'launched', 'scaling'],
    name: { en: 'Offer letter', el: 'Επιστολή προσφοράς εργασίας' },
    description: { en: 'Role, pay, equity grant, start date, at-will or notice terms.', el: 'Ρόλος, αμοιβή, μετοχές, ημερομηνία έναρξης, όροι λύσης.' },
    decide: { en: 'Equity as a number of options, not a percentage — the percentage changes.', el: 'Μετοχές ως αριθμός options, όχι ποσοστό — το ποσοστό αλλάζει.' } },
  { id: 'contractor', category: 'hiring', status: 'verified', stages: ['validating', 'building', 'launched', 'scaling'],
    name: { en: 'Independent contractor agreement', el: 'Συμφωνία ανεξάρτητου συνεργάτη' },
    description: { en: 'Scope, fees, IP assignment and confidentiality for freelancers and agencies.', el: 'Αντικείμενο, αμοιβή, εκχώρηση IP και εμπιστευτικότητα για freelancers και agencies.' },
    decide: { en: 'IP assignment must be in — otherwise the contractor owns the code.', el: 'Η εκχώρηση IP πρέπει να υπάρχει — αλλιώς ο συνεργάτης κατέχει τον κώδικα.' } },
  { id: 'adviser', category: 'hiring', status: 'standard', stages: ['validating', 'building', 'launched'],
    name: { en: 'Adviser agreement', el: 'Συμφωνία συμβούλου' },
    description: { en: 'Hours a month, equity (typically 0.1–1%), vesting and what the adviser actually does.', el: 'Ώρες τον μήνα, μετοχές (συνήθως 0,1–1%), vesting και τι ακριβώς κάνει ο σύμβουλος.' },
    decide: { en: 'Tie the grant to a defined contribution, not to the title.', el: 'Δέστε τη χορήγηση με συγκεκριμένη συνεισφορά, όχι με τον τίτλο.' } },
  { id: 'handbook', category: 'hiring', status: 'optional', stages: ['launched', 'scaling'],
    name: { en: 'Employee handbook', el: 'Εγχειρίδιο εργαζομένων' },
    description: { en: 'Leave, expenses, conduct, remote work. Needed from roughly ten people.', el: 'Άδειες, έξοδα, συμπεριφορά, απομακρυσμένη εργασία. Χρειάζεται από περίπου δέκα άτομα.' },
    decide: { en: 'Keep it short enough to be read.', el: 'Κρατήστε το αρκετά σύντομο για να διαβάζεται.' } },
  { id: 'safe', category: 'fundraising', status: 'standard', stages: ['validating', 'building', 'launched'],
    name: { en: 'SAFE (post-money)', el: 'SAFE (post-money)' },
    description: { en: 'Simple agreement for future equity: money now, shares at the next priced round.', el: 'Απλή συμφωνία για μελλοντικές μετοχές: χρήματα τώρα, μετοχές στον επόμενο αποτιμημένο γύρο.' },
    decide: { en: 'Valuation cap and whether there is a discount. Model the dilution first.', el: 'Ανώτατη αποτίμηση και αν υπάρχει έκπτωση. Υπολογίστε πρώτα την αραίωση.' } },
  { id: 'term-sheet', category: 'fundraising', status: 'standard', stages: ['building', 'launched', 'scaling'],
    name: { en: 'Term sheet (seed)', el: 'Term sheet (seed)' },
    description: { en: 'The non-binding summary of a priced round: valuation, board seat, liquidation preference, pro-rata.', el: 'Η μη δεσμευτική σύνοψη αποτιμημένου γύρου: αποτίμηση, θέση ΔΣ, προτίμηση ρευστοποίησης, pro-rata.' },
    decide: { en: 'Liquidation preference 1× non-participating is the founder-friendly norm.', el: 'Προτίμηση ρευστοποίησης 1× non-participating είναι ο φιλικός προς ιδρυτές κανόνας.' } },
  { id: 'board-consent', category: 'fundraising', status: 'verified', stages: ['building', 'launched', 'scaling'],
    name: { en: 'Board consent for financing', el: 'Έγκριση ΔΣ για χρηματοδότηση' },
    description: { en: 'The formal approval that lets the company issue the new shares.', el: 'Η επίσημη έγκριση που επιτρέπει στην εταιρεία να εκδώσει τις νέες μετοχές.' },
    decide: { en: 'Signed before the money moves, not after.', el: 'Υπογράφεται πριν κινηθούν τα χρήματα, όχι μετά.' } },
];

export function legalTemplatesFor(category?: LegalCategoryId): readonly LegalTemplate[] {
  return category ? LEGAL_TEMPLATES.filter((t) => t.category === category) : LEGAL_TEMPLATES;
}

export function isLegalCategory(value: unknown): value is LegalCategoryId {
  return LEGAL_CATEGORIES.some((c) => c.id === value);
}
