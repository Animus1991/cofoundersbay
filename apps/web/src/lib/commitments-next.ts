import type { CommitmentThreadSummary } from '@/lib/commitments-api';
import { CMT, kindCopy } from '@/lib/i18n/strings-commitments';

/**
 * What the reader has to do next on a thread, or null when it is the other
 * side's turn. One rule for the list, the founder dashboard and the
 * assistant's reading, so "waits on you" means the same thing everywhere.
 */
export function nextAction(thread: CommitmentThreadSummary): { en: string; el: string } | null {
  const name = thread.counterpart.displayName;
  if (thread.step === 'interest' && thread.role === 'owner') return { en: `${CMT.next_accept.en} ${name}`, el: `${CMT.next_accept.el} ${name}` };
  if (thread.step === 'conversation' && !thread.myConfirmed) return { en: `${CMT.next_confirm.en} ${name}`, el: `${CMT.next_confirm.el} ${name}` };
  if (thread.step === 'terms' && thread.latestTermsVersion === 0) return { en: `${CMT.next_propose.en} ${name}`, el: `${CMT.next_propose.el} ${name}` };
  if (thread.step === 'terms' && !thread.myAcceptedLatest) return { en: `${CMT.next_accept_terms.en} ${name}`, el: `${CMT.next_accept_terms.el} ${name}` };
  return null;
}

export function waitsOnMe(thread: CommitmentThreadSummary): boolean {
  return nextAction(thread) !== null;
}

/**
 * Where a commitment with someone stands, as one line beside their name on a
 * match: the card's kind, then the state in the reader's words. Matches
 * printed the bare step («Όροι»), which said neither whose turn it was nor
 * what the terms were for.
 */
export function threadLine(
  thread: Pick<CommitmentThreadSummary, 'step' | 'role' | 'cardKind' | 'myConfirmed' | 'latestTermsVersion' | 'myAcceptedLatest'>,
): { en: string; el: string; yourTurn: boolean } {
  const kind = kindCopy(thread.cardKind);
  const state = (en: string, el: string, yourTurn = false) => ({ en: `${kind.en}: ${en}`, el: `${kind.el}: ${el}`, yourTurn });
  switch (thread.step) {
    case 'interest':
      return thread.role === 'owner'
        ? state('interested in your card; your turn to answer', 'ενδιαφέρον για την κάρτα σας· σειρά σας να απαντήσετε', true)
        : state('your interest is waiting for an answer', 'το ενδιαφέρον σας περιμένει απάντηση');
    case 'conversation':
      return thread.myConfirmed
        ? state('talking; waiting for them to confirm', 'σε συζήτηση· αναμονή επιβεβαίωσης από την άλλη πλευρά')
        : state('talking; your turn to confirm', 'σε συζήτηση· σειρά σας να επιβεβαιώσετε', true);
    case 'terms':
      if (thread.latestTermsVersion === 0) return state('no terms yet; you can propose the first', 'χωρίς όρους ακόμη· μπορείτε να προτείνετε τους πρώτους', true);
      return thread.myAcceptedLatest
        ? state('you accepted the terms; waiting for them', 'αποδεχτήκατε τους όρους· αναμονή της άλλης πλευράς')
        : state('new terms for you to read', 'νέοι όροι για να τους διαβάσετε', true);
    case 'agreed':
      return state('agreed', 'συμφωνήθηκε');
    default:
      return state('closed', 'έκλεισε');
  }
}
