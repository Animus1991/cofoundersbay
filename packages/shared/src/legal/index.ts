/**
 * Legal Hub catalogue: the starter documents a founding team reaches for, by
 * the moment they need them. Static on purpose — a template's existence is not
 * member data — so the page, the assistant and any export read one list.
 */

type Bilingual = { en: string; el: string };

export type LegalCategoryId = 'incorporation' | 'ip' | 'hiring' | 'fundraising';

/**
 * How much a template matters at its moment. `critical` is the one a lawyer
 * would ask about first; `verified` is a core document most companies need
 * (the key is kept; no template here has been reviewed by a lawyer, and it
 * used to read "Verified"); `standard` is an industry norm; `optional` is
 * good hygiene.
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
  verified: { en: 'Core document', el: 'Βασικό έγγραφο' },
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
  { id: 'convertible-note', category: 'fundraising', status: 'standard', stages: ['validating', 'building', 'launched'],
    name: { en: 'Convertible note', el: 'Μετατρέψιμο ομόλογο' },
    description: { en: 'A loan that converts into shares at the next round — with interest and a maturity date, unlike a SAFE.', el: 'Δάνειο που μετατρέπεται σε μετοχές στον επόμενο γύρο — με τόκο και ημερομηνία λήξης, αντίθετα με το SAFE.' },
    decide: { en: 'Maturity date and what happens if no round closes before it.', el: 'Ημερομηνία λήξης και τι γίνεται αν δεν κλείσει γύρος πριν από αυτήν.' } },
  { id: 'term-sheet', category: 'fundraising', status: 'standard', stages: ['building', 'launched', 'scaling'],
    name: { en: 'Term sheet (seed)', el: 'Term sheet (seed)' },
    description: { en: 'The non-binding summary of a priced round: valuation, board seat, liquidation preference, pro-rata.', el: 'Η μη δεσμευτική σύνοψη αποτιμημένου γύρου: αποτίμηση, θέση ΔΣ, προτίμηση ρευστοποίησης, pro-rata.' },
    decide: { en: 'Liquidation preference 1× non-participating is the founder-friendly norm.', el: 'Προτίμηση ρευστοποίησης 1× non-participating είναι ο φιλικός προς ιδρυτές κανόνας.' } },
  { id: 'board-consent', category: 'fundraising', status: 'verified', stages: ['building', 'launched', 'scaling'],
    name: { en: 'Board consent for financing', el: 'Έγκριση ΔΣ για χρηματοδότηση' },
    description: { en: 'The formal approval that lets the company issue the new shares.', el: 'Η επίσημη έγκριση που επιτρέπει στην εταιρεία να εκδώσει τις νέες μετοχές.' },
    decide: { en: 'Signed before the money moves, not after.', el: 'Υπογράφεται πριν κινηθούν τα χρήματα, όχι μετά.' } },
];

/**
 * What a founding team in Greece usually has to sort out, in the order it
 * comes up (docs §111). General guidance to plan with, not legal or tax
 * advice: requirements change and depend on the company, so each step says
 * who to ask. It has not been reviewed by a lawyer; see
 * docs/LEGAL_REVIEW_CHECKLIST.md.
 */
export type LegalChecklistPhase = 'start' | 'before_users' | 'before_hiring' | 'before_raising';

export type LegalChecklistItem = {
  id: string;
  phase: LegalChecklistPhase;
  title: Bilingual;
  detail: Bilingual;
  /** The template in LEGAL_TEMPLATES that helps with this step. */
  template?: string;
};

export const LEGAL_CHECKLIST_PHASES: ReadonlyArray<{ id: LegalChecklistPhase; label: Bilingual }> = [
  { id: 'start', label: { en: 'Starting the company', el: 'Ξεκινώντας την εταιρεία' } },
  { id: 'before_users', label: { en: 'Before the first users', el: 'Πριν από τους πρώτους χρήστες' } },
  { id: 'before_hiring', label: { en: 'Before the first hire', el: 'Πριν από την πρώτη πρόσληψη' } },
  { id: 'before_raising', label: { en: 'Before raising money', el: 'Πριν από την άντληση κεφαλαίων' } },
];

export const LEGAL_CHECKLIST: readonly LegalChecklistItem[] = [
  { id: 'legal-form', phase: 'start',
    title: { en: 'Choose the legal form', el: 'Επιλέξτε νομική μορφή' },
    detail: { en: 'In Greece most startups look at a private company (IKE) or a société anonyme (AE). Ask a lawyer and an accountant which fits your plans and your investors.', el: 'Στην Ελλάδα οι περισσότερες startups εξετάζουν ΙΚΕ ή ΑΕ. Ρωτήστε δικηγόρο και λογιστή ποια ταιριάζει στα σχέδιά σας και στους επενδυτές σας.' } },
  { id: 'register', phase: 'start',
    title: { en: 'Register the company', el: 'Εγγράψτε την εταιρεία' },
    detail: { en: 'Registration in the General Commercial Registry (GEMI), usually through the One-Stop Service, and a tax number (AFM).', el: 'Εγγραφή στο Γενικό Εμπορικό Μητρώο (ΓΕΜΗ), συνήθως μέσω της Υπηρεσίας Μιας Στάσης, και έκδοση ΑΦΜ.' } },
  { id: 'founders', phase: 'start', template: 'founder-stock',
    title: { en: 'Put the founders’ deal in writing', el: 'Βάλτε γραπτώς τη συμφωνία των ιδρυτών' },
    detail: { en: 'Who holds what, vesting, roles, and what happens if someone leaves. Do it before the split feels unfair.', el: 'Ποιος έχει τι, vesting, ρόλοι, και τι γίνεται αν κάποιος αποχωρήσει. Κάντε το πριν η μοιρασιά φανεί άδικη.' } },
  { id: 'ip', phase: 'start', template: 'piia',
    title: { en: 'Bring the intellectual property into the company', el: 'Φέρτε την πνευματική ιδιοκτησία στην εταιρεία' },
    detail: { en: 'Code, designs and the name should belong to the company, including what was made before it existed.', el: 'Ο κώδικας, τα σχέδια και το όνομα πρέπει να ανήκουν στην εταιρεία, ακόμη κι όσα φτιάχτηκαν πριν υπάρξει.' } },
  { id: 'bank-books', phase: 'start',
    title: { en: 'Open a business account and appoint an accountant', el: 'Ανοίξτε επαγγελματικό λογαριασμό και ορίστε λογιστή' },
    detail: { en: 'Keep the company’s money apart from yours from the first euro.', el: 'Κρατήστε τα χρήματα της εταιρείας χωριστά από τα δικά σας από το πρώτο ευρώ.' } },
  { id: 'privacy-terms', phase: 'before_users',
    title: { en: 'Publish terms and a privacy policy', el: 'Δημοσιεύστε όρους και πολιτική απορρήτου' },
    detail: { en: 'They must describe what your product really does with personal data. Have a lawyer read them.', el: 'Πρέπει να περιγράφουν τι κάνει πραγματικά το προϊόν σας με τα προσωπικά δεδομένα. Να τα διαβάσει δικηγόρος.' } },
  { id: 'gdpr', phase: 'before_users',
    title: { en: 'Prepare for the GDPR', el: 'Προετοιμαστείτε για τον GDPR' },
    detail: { en: 'A record of what you process and why, agreements with the vendors who process data for you, and a way to answer access and deletion requests.', el: 'Αρχείο με το τι επεξεργάζεστε και γιατί, συμφωνίες με τους παρόχους που επεξεργάζονται δεδομένα για εσάς, και τρόπος απάντησης σε αιτήματα πρόσβασης και διαγραφής.' } },
  { id: 'name', phase: 'before_users', template: 'trademark',
    title: { en: 'Check and protect the name', el: 'Ελέγξτε και προστατέψτε το όνομα' },
    detail: { en: 'Search the name first, then decide whether to register a trademark in Greece or across the EU (EUIPO).', el: 'Αναζητήστε πρώτα το όνομα και μετά αποφασίστε αν θα κατοχυρώσετε σήμα στην Ελλάδα ή σε όλη την ΕΕ (EUIPO).' } },
  { id: 'contracts', phase: 'before_hiring', template: 'contractor',
    title: { en: 'Use written contracts', el: 'Χρησιμοποιήστε γραπτές συμβάσεις' },
    detail: { en: 'For employees and freelancers alike, with confidentiality and an IP clause.', el: 'Τόσο για εργαζομένους όσο και για ελεύθερους επαγγελματίες, με εμπιστευτικότητα και ρήτρα πνευματικής ιδιοκτησίας.' } },
  { id: 'employer', phase: 'before_hiring',
    title: { en: 'Register as an employer', el: 'Εγγραφείτε ως εργοδότης' },
    detail: { en: 'Before the first hire: employer registration with EFKA and the ERGANI system. Your accountant handles it.', el: 'Πριν από την πρώτη πρόσληψη: εγγραφή εργοδότη στον ΕΦΚΑ και στο σύστημα ΕΡΓΑΝΗ. Το αναλαμβάνει ο λογιστής σας.' } },
  { id: 'cap-table', phase: 'before_raising',
    title: { en: 'Clean up the cap table and the data room', el: 'Τακτοποιήστε τον πίνακα μετόχων και το data room' },
    detail: { en: 'Signed documents, one current cap table, and nothing promised verbally. Investors ask for these first.', el: 'Υπογεγραμμένα έγγραφα, ένας ενημερωμένος πίνακας μετόχων και τίποτα υποσχεμένο προφορικά. Αυτά ζητούν πρώτα οι επενδυτές.' } },
  { id: 'elevate', phase: 'before_raising',
    title: { en: 'See whether Elevate Greece applies', el: 'Δείτε αν σας αφορά το Elevate Greece' },
    detail: { en: 'The national startup registry. Check its current criteria and what registering gives you.', el: 'Το εθνικό μητρώο startups. Ελέγξτε τα τρέχοντα κριτήριά του και τι προσφέρει η εγγραφή.' } },
  { id: 'financing-approval', phase: 'before_raising', template: 'board-consent',
    title: { en: 'Approve the financing formally', el: 'Εγκρίνετε τυπικά τη χρηματοδότηση' },
    detail: { en: 'The company’s decision comes before the money moves, not after.', el: 'Η απόφαση της εταιρείας προηγείται της μεταφοράς χρημάτων, δεν έπεται.' } },
];

export function legalTemplatesFor(category?: LegalCategoryId): readonly LegalTemplate[] {
  return category ? LEGAL_TEMPLATES.filter((t) => t.category === category) : LEGAL_TEMPLATES;
}

export function isLegalCategory(value: unknown): value is LegalCategoryId {
  return LEGAL_CATEGORIES.some((c) => c.id === value);
}
