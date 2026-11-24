'use client';

import { BilingualText } from '@/components/common/BilingualText';
import { STATUS, type StatusTone } from '@/lib/semantic-colors';
import { cn } from '@/lib/utils';

/**
 * Greek for the status and role words that API rows carry as plain enum values
 * ("active", "in_progress", "owner"). Keys are lower-case with spaces; the
 * English shown is the value as the page already displayed it.
 */
const STATUS_EL: Record<string, string> = {
  // Skill levels a person declares on their profile.
  beginner: 'αρχάριο επίπεδο',
  intermediate: 'μέσο επίπεδο',
  advanced: 'προχωρημένο επίπεδο',
  expert: 'επίπεδο ειδικού',
  active: 'ενεργό',
  // Subscription states (Settings › Billing, docs §89).
  free: 'δωρεάν',
  trialing: 'σε δοκιμή',
  'past due': 'ληξιπρόθεσμη πληρωμή',
  inactive: 'ανενεργό',
  pending: 'σε αναμονή',
  applied: 'υποβλήθηκε',
  accepted: 'εγκρίθηκε',
  approved: 'εγκρίθηκε',
  rejected: 'απορρίφθηκε',
  declined: 'απορρίφθηκε',
  completed: 'ολοκληρώθηκε',
  complete: 'ολοκληρώθηκε',
  upcoming: 'προσεχές',
  running: 'σε εξέλιξη',
  'in progress': 'σε εξέλιξη',
  recruiting: 'δέχεται αιτήσεις',
  graduated: 'αποφοίτησε',
  withdrawn: 'αποσύρθηκε',
  invited: 'προσκλήθηκε',
  paused: 'σε παύση',
  draft: 'πρόχειρο',
  published: 'δημοσιευμένο',
  archived: 'αρχειοθετημένο',
  cancelled: 'ακυρώθηκε',
  canceled: 'ακυρώθηκε',
  scheduled: 'προγραμματισμένο',
  requested: 'ζητήθηκε',
  confirmed: 'επιβεβαιώθηκε',
  'no show': 'απουσία',
  suspended: 'σε αναστολή',
  banned: 'αποκλεισμένο',
  verified: 'επαληθευμένο',
  unverified: 'μη επαληθευμένο',
  new: 'νέο',
  replied: 'απαντήθηκε',
  converted: 'έγινε πελάτης',
  closed: 'κλειστό',
  open: 'ανοιχτό',
  resolved: 'επιλύθηκε',
  dismissed: 'απορρίφθηκε',
  reviewed: 'ελέγχθηκε',
  public: 'δημόσια',
  private: 'ιδιωτική',
  hidden: 'κρυφή',
  enabled: 'ενεργή',
  disabled: 'ανενεργή',
  owner: 'ιδιοκτήτης',
  admin: 'διαχειριστής',
  moderator: 'συντονιστής',
  member: 'μέλος',
  mentor: 'μέντορας',
  investor: 'επενδυτής',
  founder: 'ιδρυτής',
  'co-founder': 'συνιδρυτής',
  organisation: 'οργανισμός',
  organization: 'οργανισμός',
  org: 'οργανισμός',
  service_provider: 'πάροχος υπηρεσιών',
  'service provider': 'πάροχος υπηρεσιών',
  accelerator: 'επιταχυντής',
  incubator: 'θερμοκοιτίδα',
  bootcamp: 'bootcamp',
  online: 'διαδικτυακά',
  'in-person': 'δια ζώσης',
  hybrid: 'υβριδικά',
  high: 'υψηλή',
  medium: 'μέτρια',
  low: 'χαμηλή',
  urgent: 'επείγον',
  // Service categories
  legal: 'νομικά',
  finance: 'οικονομικά',
  marketing: 'μάρκετινγκ',
  development: 'ανάπτυξη λογισμικού',
  design: 'σχεδιασμός',
  consulting: 'συμβουλευτική',
  coaching: 'coaching',
  other: 'άλλο',
  // Community categories
  founders: 'ιδρυτές',
  tech: 'τεχνολογία',
  technology: 'τεχνολογία',
  product: 'προϊόν',
  operations: 'λειτουργίες',
  industry: 'κλάδος',
  local: 'τοπική',
  fundraising: 'χρηματοδότηση',
  sales: 'πωλήσεις',
  community: 'κοινότητα',
  investing: 'επενδύσεις',
  general: 'γενικά',
  flagged: 'με σήμανση',
  // Feature-flag areas
  ui: 'διεπαφή',
  infra: 'υποδομή',
  billing: 'χρεώσεις',
  // Opportunity types
  job: 'θέση εργασίας',
  mentorship: 'καθοδήγηση',
  cofounder: 'συνιδρυτής',
  investment: 'επένδυση',
  partnership: 'συνεργασία',
  internship: 'πρακτική άσκηση',
  freelance: 'ελεύθερος επαγγελματίας',
  advisor: 'σύμβουλος',
  collaboration: 'συνεργασία',
  webinar: 'διαδικτυακό σεμινάριο',
  workshop: 'εργαστήριο',
  meetup: 'συνάντηση',
  'demo day': 'ημέρα παρουσίασης',
  networking: 'δικτύωση',
  deadline: 'προθεσμία',
  pitch: 'παρουσίαση',
  event: 'εκδήλωση',
  // Startup stages (the projects catalogue's words)
  idea: 'ιδέα',
  validating: 'επικύρωση',
  validation: 'επικύρωση',
  mvp: 'MVP',
  building: 'κατασκευή',
  launched: 'κυκλοφορία',
  scaling: 'κλιμάκωση',
  growth: 'ανάπτυξη',
  'pre seed': 'προ-seed',
  seed: 'seed',
  'series a': 'σειρά A',
  // Commitment and engagement
  'full time': 'πλήρης απασχόληση',
  'part time': 'μερική απασχόληση',
  advisory: 'συμβουλευτική',
  contract: 'σύμβαση',
  flexible: 'ευέλικτη',
  // Commitments: card kinds, outcomes, ladder steps and close reasons
  'equity role': 'ρόλος με equity',
  'investor intro': 'γνωριμία με επενδυτή',
  'in discussion': 'σε συζήτηση',
  agreed: 'συμφωνήθηκε',
  interest: 'ενδιαφέρον',
  conversation: 'συζήτηση',
  terms: 'όροι',
  filled: 'καλύφθηκε',
  expired: 'έληξε',
  // Job categories and employment types (the jobs board's words)
  engineering: 'μηχανική λογισμικού',
  data: 'δεδομένα',
  research: 'έρευνα',
  support: 'υποστήριξη',
  temporary: 'προσωρινή',
  remote: 'εξ αποστάσεως',
  'on site': 'στον χώρο εργασίας',
};

/** "in_progress" → "In progress": an enum value read as a word, not a token. */
function sentenceCase(value: string): string {
  const spaced = value.replace(/_/g, ' ').trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : spaced;
}

/** The English side of a status value, in sentence case ("demo_day" → "Demo day"). */
export function statusEn(value: string | null | undefined): string {
  return value ? sentenceCase(value) : '';
}

/**
 * The status word's tone (B1.3): the same six washes everything else draws
 * from. Values not listed — categories, roles, types — sit on neutral, the
 * quiet tint a word that is not a state should carry.
 */
const STATUS_TONE: Record<string, StatusTone> = {
  // Going well / done.
  active: 'success', accepted: 'success', approved: 'success', agreed: 'success',
  completed: 'success', complete: 'success', confirmed: 'success', verified: 'success',
  published: 'success', resolved: 'success', filled: 'success', graduated: 'success',
  converted: 'success', recruiting: 'success', online: 'success', enabled: 'success',
  live: 'success', launched: 'success', won: 'success', paid: 'success', success: 'success',
  'full time': 'success', advanced: 'success', expert: 'success',
  // Waiting, in motion, asking for attention.
  pending: 'warning', upcoming: 'warning', scheduled: 'warning', requested: 'warning',
  'in progress': 'warning', running: 'warning', 'in discussion': 'warning',
  interest: 'warning', conversation: 'warning', terms: 'warning', trialing: 'warning',
  paused: 'warning', flagged: 'warning', unverified: 'warning', reviewing: 'warning',
  review: 'warning', high: 'warning', 'needs work': 'warning', intermediate: 'warning',
  // Stopped badly / destructive.
  rejected: 'danger', declined: 'danger', banned: 'danger', suspended: 'danger',
  cancelled: 'danger', canceled: 'danger', expired: 'danger', 'past due': 'danger',
  'no show': 'danger', overdue: 'danger', blocked: 'danger', urgent: 'danger',
  critical: 'danger', failed: 'danger', uncollectible: 'danger',
  // Fresh, incoming, informational.
  new: 'info', invited: 'info', replied: 'info', open: 'info', medium: 'info',
  reviewed: 'info', public: 'info', 'part time': 'info', beginner: 'info', sent: 'info',
};

/** The tone a status/role/category value paints on its pill. */
export function statusTone(value: string | null | undefined): StatusTone {
  if (!value) return 'neutral';
  const key = value.toLowerCase().replace(/[_-]/g, ' ').trim();
  return STATUS_TONE[key] ?? 'neutral';
}

export function statusEl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  // "full-time" is the same word as "full_time": the jobs board writes the
  // hyphen and found no Greek. Hyphenated keys ("in-person") are tried as written first.
  const el = STATUS_EL[lower.replace(/_/g, ' ').trim()] ?? STATUS_EL[lower] ?? STATUS_EL[lower.replace(/[_-]/g, ' ').trim()];
  return el ? sentenceCase(el) : undefined;
}

/**
 * A status or role value with its Greek beside it, in sentence case
 * ("Accepted · Εγκρίθηκε", not "accepted · εγκρίθηκε") — a raw lower-case
 * token on a chip read as a leaked enum. Unknown values render as given, so
 * a new enum member shows in English rather than disappearing.
 */
export function StatusText({
  value,
  className,
  tone,
}: {
  value: string | null | undefined;
  className?: string;
  /** Overrides the derived tone when the caller knows better. */
  tone?: StatusTone;
}) {
  if (!value) return null;
  const t = tone ?? statusTone(value);
  return (
    // The tinted pill with its 6px dot (B1.3) — same word, now a mark.
    <span data-status-pill={t} className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS[t].chip, className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      <BilingualText en={sentenceCase(value)} el={statusEl(value)} compact />
    </span>
  );
}
