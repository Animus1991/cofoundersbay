import type { BilingualPair } from './types';

/**
 * Messages page — bilingual EN + EL.
 */
export const MESSAGES_STRINGS: Record<string, BilingualPair> = {
  // ── Page header ──
  page_title: { en: 'Messages', el: 'Μηνύματα' },
  page_description: {
    en: 'Direct conversations with your connections and collaborators.',
    el: 'Άμεσες συνομιλίες με τις συνδέσεις και τους συνεργάτες σας.',
  },

  // ── Tabs ──
  all: { en: 'All', el: 'Όλα' },
  unread: { en: 'Unread', el: 'Αδιάβαστα' },
  pinned: { en: 'Pinned', el: 'Καρφιτσωμένα' },
  archived: { en: 'Archived', el: 'Αρχειοθετημένα' },
  requests: { en: 'Requests', el: 'Αιτήματα' },

  // ── Actions ──
  new_message: { en: 'New message', el: 'Νέο μήνυμα' },
  type_message: { en: 'Type a message...', el: 'Πληκτρολογήστε μήνυμα...' },
  send: { en: 'Send', el: 'Αποστολή' },
  pin: { en: 'Pin', el: 'Καρφίτσωμα' },
  unpin: { en: 'Unpin', el: 'Ξεκαρφίτσωμα' },
  archive: { en: 'Archive', el: 'Αρχειοθέτηση' },
  unarchive: { en: 'Unarchive', el: 'Αναίρεση αρχειοθέτησης' },
  mark_read: { en: 'Mark as read', el: 'Σήμανση ως αναγνωσμένο' },
  delete_chat: { en: 'Delete chat', el: 'Διαγραφή συνομιλίας' },
  report_block: { en: 'Report / Block', el: 'Αναφορά / Αποκλεισμός' },
  view_profile: { en: 'View profile', el: 'Προβολή προφίλ' },

  // ── Empty states ──
  no_conversations: { en: 'No conversations yet', el: 'Δεν υπάρχουν συνομιλίες ακόμα' },
  no_conversations_desc: {
    en: 'Start chatting with your connections or send a message from a profile.',
    el: 'Ξεκινήστε να συνομιλείτε με τις συνδέσεις σας ή στείλτε μήνυμα από ένα προφίλ.',
  },
  no_unread: { en: 'No unread messages', el: 'Δεν υπάρχουν αδιάβαστα μηνύματα' },
  no_pinned: { en: 'No pinned conversations', el: 'Δεν υπάρχουν καρφιτσωμένες συνομιλίες' },
  no_archived: { en: 'No archived conversations', el: 'Δεν υπάρχουν αρχειοθετημένες συνομιλίες' },
  select_conversation: { en: 'Select a conversation to start messaging', el: 'Επιλέξτε συνομιλία για να ξεκινήσετε' },
  find_people: { en: 'Find people', el: 'Εύρεση ατόμων' },

  // ── Connection requests (in messages) ──
  accept: { en: 'Accept', el: 'Αποδοχή' },
  decline: { en: 'Decline', el: 'Απόρριψη' },
  pending_requests: { en: 'Pending Requests', el: 'Εκκρεμή αιτήματα' },
  no_pending: { en: 'No pending requests', el: 'Δεν υπάρχουν εκκρεμή αιτήματα' },
  wants_to_connect: { en: 'wants to connect', el: 'θέλει να συνδεθεί' },

  // ── Status ──
  online: { en: 'Online', el: 'Συνδεδεμένος/η' },
  offline: { en: 'Offline', el: 'Αποσυνδεδεμένος/η' },
  typing: { en: 'typing...', el: 'γράφει...' },

  // ── Toast ──
  message_sent: { en: 'Message sent', el: 'Το μήνυμα στάλθηκε' },
  connection_accepted: { en: 'Connection accepted', el: 'Η σύνδεση αποδέχτηκε' },
  request_declined: { en: 'Request declined', el: 'Το αίτημα απορρίφθηκε' },
  could_not_load: { en: 'Could not load messages', el: 'Αδυναμία φόρτωσης μηνυμάτων' },

  // ── Search ──
  search_conversations: { en: 'Search conversations...', el: 'Αναζήτηση συνομιλιών...' },
};

export function messagesEn(key: keyof typeof MESSAGES_STRINGS): string {
  return MESSAGES_STRINGS[key].en;
}

export function messagesEl(key: keyof typeof MESSAGES_STRINGS): string {
  return MESSAGES_STRINGS[key].el;
}
