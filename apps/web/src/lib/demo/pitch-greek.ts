import { LOCALE_STORAGE_KEY } from '@/lib/locale';
import { isPreviewDemo } from '@/lib/preview-demo';

/**
 * The demo deck in Greek (docs §112). A slide's words live in a text area,
 * where the page's translation pass cannot reach, so the whole sample deck
 * stayed English for a Greek reader. Matching on the seed's exact text means
 * anything the visitor typed is left alone, and saving keeps what they read.
 */
export const DEMO_DECK_EL: Record<string, string> = {
  'Harbor\n\nThe operating system for early-stage founders.': 'Harbor\n\nΤο λειτουργικό σύστημα για ιδρυτές πρώιμου σταδίου.',
  'Founders waste weeks stitching matching, messaging, and fundraising tools.': 'Οι ιδρυτές χάνουν εβδομάδες ενώνοντας εργαλεία αντιστοίχισης, μηνυμάτων και χρηματοδότησης.',
  'Name, line, why now. Five seconds.': 'Όνομα, μία πρόταση, γιατί τώρα. Πέντε δευτερόλεπτα.',
  'Stay with the Idea Core problem.': 'Μείνετε στο πρόβλημα του Πυρήνα ιδέας.',
  'One workspace that matches people and turns the idea into artifacts.': 'Ένας χώρος εργασίας που φέρνει κοντά ανθρώπους και κάνει την ιδέα έγγραφα.',
  'Same sentence as Idea Core. Show the workspace, do not add a second product.': 'Ίδια πρόταση με τον Πυρήνα ιδέας. Δείξτε τον χώρο εργασίας, μην προσθέτετε δεύτερο προϊόν.',
  'TAM: $4B — founder tooling; matching, messaging, and fundraising in one category.\nSAM: $400M — early-stage matching and workspace tools.\nSOM: $12M — first three years among complementary-cofounder searches.':
    'TAM: $4B · εργαλεία ιδρυτών: αντιστοίχιση, μηνύματα και χρηματοδότηση σε μία κατηγορία.\nSAM: $400M · εργαλεία αντιστοίχισης και χώρου εργασίας πρώιμου σταδίου.\nSOM: $12M · τα τρία πρώτα χρόνια, στις αναζητήσεις συμπληρωματικού συνιδρυτή.',
  'Same TAM/SAM/SOM as Market Analysis. Investors will check the round page.': 'Ίδια TAM/SAM/SOM με την Ανάλυση αγοράς. Οι επενδυτές θα ελέγξουν τη σελίδα του γύρου.',
  '• Matching on the founder graph\n• Builder artefacts in the same workspace\n• Readiness scoring attached to the drafts\n• Expert review on those drafts, not a separate stack':
    '• Αντιστοίχιση πάνω στον γράφο ιδρυτών\n• Έγγραφα του Builder στον ίδιο χώρο εργασίας\n• Βαθμολογία ετοιμότητας δεμένη με τα προσχέδια\n• Αξιολόγηση ειδικών στα ίδια προσχέδια, όχι σε ξεχωριστό εργαλείο',
  'Walk the workspace. Cover, problem, and ask are already on the page.': 'Περιηγηθείτε στον χώρο εργασίας. Εξώφυλλο, πρόβλημα και αίτημα είναι ήδη στη σελίδα.',
  'Seed in progress: €375K committed of a €750K target.\nLead: Athens Tech Angels.': 'Seed σε εξέλιξη: €375K δεσμευμένα από στόχο €750K.\nΕπικεφαλής: Athens Tech Angels.',
  'Same raised and target as Fundraising.': 'Ίδια ποσά συγκέντρωσης και στόχου με τη Χρηματοδότηση.',
  'Subscriptions and paid expert reviews on drafts — a faster path from idea to a shareable plan.': 'Συνδρομές και επί πληρωμή αξιολογήσεις ειδικών σε προσχέδια: πιο γρήγορη διαδρομή από την ιδέα σε σχέδιο που μοιράζεστε.',
  'BMC value proposition plus revenue streams. Keep it to what the canvas already says.': 'Πρόταση αξίας και ροές εσόδων του BMC. Μείνετε σε ό,τι λέει ήδη ο καμβάς.',
  'Direct: standalone matching directories that stop at the intro.\nIndirect: spreadsheets and chat threads that stitch matching, messaging, and fundraising by hand.\nHarbor keeps the graph, the artefacts, and readiness in one product.':
    'Άμεσοι: αυτόνομοι κατάλογοι αντιστοίχισης που σταματούν στη γνωριμία.\nΈμμεσοι: υπολογιστικά φύλλα και νήματα συνομιλίας που ενώνουν με το χέρι αντιστοίχιση, μηνύματα και χρηματοδότηση.\nΤο Harbor κρατά τον γράφο, τα έγγραφα και την ετοιμότητα σε ένα προϊόν.',
  'Same competitors as Market Analysis.': 'Ίδιοι ανταγωνιστές με την Ανάλυση αγοράς.',
  'Elena Papadopoulos — Founder & CEO at Harbor.': 'Elena Papadopoulos: ιδρύτρια και CEO στο Harbor.',
  'Only people who already exist in this workspace.': 'Μόνο άτομα που υπάρχουν ήδη σε αυτόν τον χώρο εργασίας.',
  'Seed: €750,000 SAFE.\nCommitted: €375K.\nRunway target: 18–24 months from this round.': 'Seed: €750.000 SAFE.\nΔεσμευμένα: €375K.\nΣτόχος runway: 18–24 μήνες από αυτόν τον γύρο.',
  'Same target and raised amount as the Harbor seed round.': 'Ίδιος στόχος και ίδιο ποσό με τον γύρο seed του Harbor.',
  'Raising: €750,000 seed (SAFE).\nUse of funds:\n• Product (40%)\n• Go-to-market (30%)\n• Team (20%)\n• Operations (10%)':
    'Άντληση: €750.000 seed (SAFE).\nΧρήση κεφαλαίων:\n• Προϊόν (40%)\n• Go-to-market (30%)\n• Ομάδα (20%)\n• Λειτουργία (10%)',
  'The ask field on this deck is €750,000 — the same figure as Fundraising.': 'Το πεδίο αιτήματος σε αυτό το deck είναι €750.000, το ίδιο ποσό με τη Χρηματοδότηση.',
  'Harbor\n\nGraph + readiness + builder in the same product.\n\nLet’s build the next artefact together.': 'Harbor\n\nΓράφος, ετοιμότητα και builder στο ίδιο προϊόν.\n\nΑς χτίσουμε μαζί το επόμενο έγγραφο.',
  'Repeat the name and the unique value. Leave a next step, not a new claim.': 'Επαναλάβετε το όνομα και τη μοναδική αξία. Αφήστε ένα επόμενο βήμα, όχι νέο ισχυρισμό.',
  'The operating system for early-stage founders.': 'Το λειτουργικό σύστημα για ιδρυτές πρώιμου σταδίου.',
  'Graph + readiness + builder in the same product': 'Γράφος, ετοιμότητα και builder στο ίδιο προϊόν',
  'Product (40%) — matching, artefacts, and readiness in one workspace': 'Προϊόν (40%): αντιστοίχιση, έγγραφα και ετοιμότητα σε έναν χώρο εργασίας',
  'Go-to-market (30%) — founders who already sit in the graph': 'Go-to-market (30%): ιδρυτές που βρίσκονται ήδη στον γράφο',
  'Team (20%) — complementary hires around the founder OS': 'Ομάδα (20%): συμπληρωματικές προσλήψεις γύρω από το λειτουργικό του ιδρυτή',
  'Operations (10%) — infrastructure and legal for the seed': 'Λειτουργία (10%): υποδομή και νομικά για το seed',
};

/** The Greek of a demo deck's seed text, for a Greek reader; anything else unchanged. */
export function demoDeckText(text: string): string {
  if (!text || typeof window === 'undefined' || !isPreviewDemo()) return text;
  try {
    if (window.localStorage.getItem(LOCALE_STORAGE_KEY) !== 'el') return text;
  } catch {
    return text;
  }
  return DEMO_DECK_EL[text] ?? text;
}
