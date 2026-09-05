/** Greek navigation labels, section titles, sidebar modes, and link tooltips. */

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar mode labels
// ─────────────────────────────────────────────────────────────────────────────

export const SIDEBAR_MODE_EL: Record<'work' | 'explore' | 'account', string> = {
  work: 'Εργασία',
  explore: 'Εξερεύνηση',
  account: 'Λογαριασμός',
};

// ─────────────────────────────────────────────────────────────────────────────
// Section titles (keyed by English section name from nav-modes)
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_SECTION_EL: Record<string, string> = {
  Activity: 'Δραστηριότητα',
  Build: 'Ανάπτυξη',
  Communicate: 'Επικοινωνία',
  Community: 'Κοινότητα',
  Config: 'Διαμόρφωση',
  Dashboard: 'Πίνακας ελέγχου',
  'Deal Flow': 'Ροή συμφωνιών',
  Discover: 'Ανακάλυψη',
  Fundraise: 'Χρηματοδότηση',
  Grow: 'Ανάπτυξη δικτύου',
  Learn: 'Μάθηση',
  Manage: 'Διαχείριση',
  Network: 'Δίκτυο',
  Opportunities: 'Ευκαιρίες',
  Overview: 'Επισκόπηση',
  People: 'Άτομα',
  Platform: 'Πλατφόρμα',
  Portfolio: 'Χαρτοφυλάκιο',
  Profile: 'Προφίλ',
  Programs: 'Προγράμματα',
  Reputation: 'Φήμη',
  Services: 'Υπηρεσίες',
  Sessions: 'Συνεδρίες',
  Settings: 'Ρυθμίσεις',
  'Users & Content': 'Χρήστες και περιεχόμενο',
  Workspace: 'Χώρος εργασίας',
};

// ─────────────────────────────────────────────────────────────────────────────
// Link labels (keyed by href from nav-modes)
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_LABEL_EL: Record<string, string> = {
  '/achievements': 'Επιτεύγματα',
  '/activity': 'Δραστηριότητα',
  '/admin': 'Πίνακας ελέγχου διαχειριστή',
  '/admin/analytics': 'Παγκόσμια αναλυτικά',
  '/admin/audit-log': 'Αρχείο ελέγχου',
  '/admin/automations': 'Αυτοματισμοί',
  '/admin/billing': 'Τιμολόγηση',
  '/admin/communities': 'Κοινότητες',
  '/admin/domains': 'Domains',
  '/admin/feature-flags': 'Feature flags',
  '/admin/programs': 'Προγράμματα',
  '/admin/reports': 'Αναφορές',
  '/admin/sso': 'SSO',
  '/admin/taxonomy': 'Ταξινομία',
  '/admin/tenants': 'Tenants',
  '/admin/users': 'Χρήστες',
  '/analytics': 'Αναλυτικά',
  '/builder': 'Startup Builder',
  '/builder/applications': 'Αιτήσεις',
  '/builder/pitch-deck': 'Pitch deck',
  '/calendar': 'Ημερολόγιο',
  '/coaching': 'Coaching',
  '/compare': 'Σύγκριση προφίλ',
  '/connections': 'Συνδέσεις',
  '/dashboard': 'Επισκόπηση',
  '/dashboard/founder': 'Επισκόπηση',
  '/dashboard/investor': 'Επισκόπηση',
  '/dashboard/mentor': 'Επισκόπηση',
  '/dashboard/provider': 'Επισκόπηση',
  '/discover': 'Εξερεύνηση',
  '/endorsements': 'Συσστάσεις',
  '/events': 'Εκδηλώσεις',
  '/expert-reviews': 'Αξιολογήσεις ειδικών',
  '/feed': 'Ροή',
  '/fundraising': 'Fundraising',
  '/groups': 'Κοινότητες',
  '/help': 'Βοήθεια και υποστήριξη',
  '/investor/analytics': 'Αναλυτικά deals',
  '/investor/pipeline': 'Pipeline',
  '/investor/portfolio': 'Χαρτοφυλάκιο',
  '/investor/scouting': 'Αναζήτηση startups',
  '/investor/watchlist': 'Λίστα παρακολούθησης',
  '/investors': 'Επενδυτές',
  '/invite': 'Πρόσκληση φίλων',
  '/jobs': 'Θέσεις εργασίας',
  '/learning': 'Κέντρο μάθησης',
  '/marketplace': 'Υπηρεσίες',
  '/matches': 'Αντιστοιχίσεις',
  '/members': 'Μέλη',
  '/mentor/availability': 'Διαθεσιμότητα',
  '/mentor/earnings': 'Αποδοχές',
  '/mentor/mentees': 'Mentees',
  '/mentor/profile': 'Προφίλ mentor',
  '/mentor/requests': 'Αιτήματα',
  '/mentor/reviews': 'Αξιολογήσεις',
  '/mentor/sessions': 'Οι συνεδρίες μου',
  '/mentoring': 'Mentors',
  '/messages': 'Μηνύματα',
  '/milestones': 'Ορόσημα',
  '/notifications': 'Ειδοποιήσεις',
  '/opportunities': 'Ευκαιρίες',
  '/org/analytics': 'Αναλυτικά οργανισμού',
  '/org/applications': 'Αιτήσεις',
  '/org/cohorts': 'Cohorts',
  '/org/dashboard': 'Επισκόπηση',
  '/org/events': 'Εκδηλώσεις',
  '/org/members': 'Ομάδα',
  '/org/mentors': 'Δεξαμενή mentors',
  '/org/programs': 'Προγράμματα',
  '/org/settings': 'Ρυθμίσεις',
  '/org/startups': 'Startups',
  '/profile': 'Το προφίλ μου',
  '/profile/edit': 'Επεξεργασία προφίλ',
  '/programs': 'Προγράμματα',
  '/projects': 'Έργα',
  '/provider/analytics': 'Αναλυτικά παρόχου',
  '/provider/inquiries': 'Αιτήματα',
  '/provider/profile': 'Προφίλ παρόχου',
  '/provider/projects': 'Έργα πελατών',
  '/provider/reviews': 'Αξιολογήσεις',
  '/provider/services': 'Οι υπηρεσίες μου',
  '/readiness': 'Readiness Score',
  '/recommendations': 'Για εσάς',
  '/referrals': 'Παραπομπές',
  '/reputation': 'Φήμη',
  '/research': 'Πίνακες έρευνας',
  '/saved-searches': 'Αποθηκευμένες αναζητήσεις',
  '/search': 'Αναζήτηση',
  '/settings': 'Γενικές',
  '/settings/billing': 'Τιμολόγηση',
  '/settings/data-export': 'Εξαγωγή δεδομένων',
  '/settings/notifications': 'Προτιμήσεις ειδοποιήσεων',
  '/shortlist': 'Αποθηκευμένα προφίλ',
  '/tenant/analytics': 'Αναλυτικά tenant',
  '/tenant/api-keys': 'API keys',
  '/tenant/automation': 'Αυτοματισμοί',
  '/tenant/billing': 'Τιμολόγηση',
  '/tenant/branding': 'Branding',
  '/tenant/dashboard': 'Επισκόπηση',
  '/tenant/domains': 'Domains',
  '/tenant/members': 'Μέλη',
  '/tenant/programs': 'Προγράμματα',
  '/tenant/settings': 'Ρυθμίσεις',
  '/tenant/sso': 'SSO',
  '/tenant/webhooks': 'Webhooks',
};

// ─────────────────────────────────────────────────────────────────────────────
// Link tooltips (keyed by href from NAV_LINK_DESCRIPTIONS)
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_DESCRIPTION_EL: Record<string, string> = {
  '/dashboard/founder':
    'Επισκόπηση startup, ετοιμότητα και επόμενες ενέργειες',
  '/dashboard/mentor':
    'Συνεδρίες, αιτήματα και δραστηριότητα mentees',
  '/dashboard/investor':
    'KPIs ροής deals και στιγμιότυπο χαρτοφυλακίου',
  '/dashboard/provider':
    'Υπηρεσίες, αιτήματα και εργασία με πελάτες',
  '/dashboard/incubator':
    'Προγράμματα tenant και αναλυτικά μελών',
  '/readiness':
    'Βαθμολογία ετοιμότητας επενδυτών και συμβουλές βελτίωσης',
  '/analytics':
    'Μετρικά engagement και ανάπτυξης',
  '/builder':
    'Δομή ιδέας, ομάδας, αγοράς και traction',
  '/builder/pitch-deck':
    'Περιεχόμενο slides συνδεδεμένο με τον builder',
  '/builder/applications':
    'Παρακολούθηση αιτήσεων σε accelerators και επιχορηγήσεις',
  '/research':
    'Οπτικοί πίνακες έρευνας και στρατηγικής',
  '/milestones':
    'Στόχοι, υπεύθυνοι και ημερομηνίες λήξης',
  '/projects':
    'Παράλληλα έργα και πρωτοβουλίες startup',
  '/fundraising':
    'Pipeline επενδυτών και data room',
  '/messages':
    'Άμεσα μηνύματα και αιτήματα εισαγωγής',
  '/calendar':
    'Κλήσεις, συνεδρίες και εκδηλώσεις',
  '/mentor/sessions':
    'Προσεχείς και προηγούμενες συνεδρίες mentoring',
  '/mentor/requests':
    'Αποδοχή ή απόρριψη αιτημάτων mentees',
  '/mentor/mentees':
    'Άτομα που mentoring παρέχετε αυτήν τη στιγμή',
  '/mentor/availability':
    'Χρονικά διαστήματα διαθεσιμότητας για κράτηση',
  '/mentor/profile':
    'Δημόσιο προφίλ mentor και ειδικότητες',
  '/mentor/earnings':
    'Πληρωμές συνεδριών και ιστορικό',
  '/mentor/reviews':
    'Ανατροφοδότηση από mentees',
  '/investor/scouting':
    'Αναζήτηση startups κατά στάδιο και κλάδο',
  '/investor/pipeline':
    'Deals από την εισαγωγή έως το κλείσιμο',
  '/investor/watchlist':
    'Startups που παρακολουθείτε',
  '/investor/portfolio':
    'Εταιρείες στις οποίες επενδύσατε',
  '/investor/analytics':
    'Μετρικά deals και χαρτοφυλακίου',
  '/provider/services':
    'Καταχωρήσεις που προσφέρετε στο marketplace',
  '/provider/inquiries':
    'Εισερχόμενα αιτήματα από founders',
  '/provider/projects':
    'Ενεργές συνεργασίες με πελάτες',
  '/provider/reviews':
    'Ανατροφοδότηση πελατών για την εργασία σας',
  '/provider/profile':
    'Δημόσιο προφίλ παρόχου',
  '/provider/analytics':
    'Στατιστικά απόδοσης και μετατροπών',
  '/org/dashboard':
    'Προγράμματα, cohorts και χαρτοφυλάκιο',
  '/org/programs':
    'Διαχείριση προγραμμάτων incubator ή accelerator',
  '/org/cohorts':
    'Εισαγωγή batch και πρόοδος',
  '/org/applications':
    'Αξιολόγηση αιτήσεων startups',
  '/org/startups':
    'Εταιρείες χαρτοφυλακίου στα προγράμματά σας',
  '/org/mentors':
    'Mentors συνδεδεμένοι με τον οργανισμό σας',
  '/org/events':
    'Εκδηλώσεις οργανισμού και RSVPs',
  '/org/members':
    'Λογαριασμοί ομάδας και προσωπικού',
  '/org/settings':
    'Διαμόρφωση οργανισμού',
  '/org/analytics':
    'Μετρικά προγραμμάτων και cohorts',
  '/discover':
    'Περιήγηση σε μέλη με φίλτρα',
  '/matches':
    'Προτάσεις κατάταξης συμβατότητας',
  '/recommendations':
    'Εξατομικευμένες προτάσεις για εσάς',
  '/members':
    'Πλήρης κατάλογος μελών',
  '/mentoring':
    'Εύρεση και κράτηση mentors',
  '/investors':
    'Κατάλογος angels και VCs',
  '/opportunities':
    'Θέσεις και ανοίγματα συνιδρυτών',
  '/groups':
    'Κοινότητες και χώροι συζήτησης',
  '/events':
    'Εκδηλώσεις πλατφόρμας και κοινότητας',
  '/programs':
    'Accelerators, επιχορηγήσεις και cohorts',
  '/connections':
    'Εκκρεμείς και ενεργές συνδέσεις',
  '/shortlist':
    'Προφίλ που αποθηκεύσατε',
  '/endorsements':
    'Δεξιότητες που επικυρώθηκαν από άλλους',
  '/matches/compare':
    'Σύγκριση δύο προφίλ παράλληλα',
  '/learning':
    'Μαθήματα και διαδρομές μάθησης',
  '/marketplace':
    'Νομικές, σχεδιαστικές και growth υπηρεσίες',
  '/jobs':
    'Ανοιχτές θέσεις σε startups',
  '/help':
    'Οδηγοί και υποστήριξη',
  '/feed':
    'Δραστηριότητα από το δίκτυό σας',
  '/activity':
    'Οι πρόσφατες ενέργειές σας',
  '/achievements':
    'Σήματα και πρόοδος XP',
  '/profile':
    'Πώς σας βλέπουν οι άλλοι',
  '/notifications':
    'Ειδοποιήσεις και ενημερώσεις',
  '/settings':
    'Λογαριασμός, απόρρητο και τιμολόγηση',
  '/invite':
    'Προσκαλέστε φίλους και αναπτύξτε το δίκτυο',
  '/admin':
    'Υγεία πλατφόρμας και εργαλεία διαχείρισης',
  '/admin/users':
    'Αναζήτηση και συντονισμός λογαριασμών',
  '/admin/user-management':
    'Μαζική διαχείριση χρηστών και επαλήθευση',
  '/admin/analytics':
    'Παγκόσμια μετρικά πλατφόρμας',
  '/admin/communities':
    'Εποπτεία κοινοτήτων',
  '/admin/reports':
    'Αναφορές χρηστών και σημαίες',
  '/tenant/dashboard':
    'Επισκόπηση white-label tenant',
  '/tenant/branding':
    'Λογότυπο, χρώματα και κείμενο landing',
  '/tenant/sso':
    'Ρύθμιση επιχειρησιακής σύνδεσης',
  '/tenant/domains':
    'Αντιστοίχιση custom domain',
  '/tenant/members':
    'Χρήστες στον tenant σας',
  '/tenant/programs':
    'Προγράμματα εντός του tenant',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getNavLabelEl(href: string): string | undefined {
  return NAV_LABEL_EL[href];
}

export function getNavSectionEl(section: string): string | undefined {
  return NAV_SECTION_EL[section];
}

export function getNavDescriptionEl(href: string): string | undefined {
  return NAV_DESCRIPTION_EL[href];
}
