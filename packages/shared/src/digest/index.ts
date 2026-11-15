/**
 * What an email digest may carry, one switch per topic.
 *
 * The digest job (`apps/api/src/digests/email-digest.service.ts`) includes a
 * topic unless the member turned it off, so every default is on. The API's
 * read (`GET /digests/preferences`) and the switches on
 * `/settings/notifications` answer from this same list: the read once said
 * "updates" was off while the job sent it, "matches" could be neither read
 * nor set, and no screen set any of them.
 */
export const DIGEST_TOPICS = ['connections', 'messages', 'opportunities', 'events', 'updates', 'matches'] as const;
export type DigestTopic = (typeof DIGEST_TOPICS)[number];

export const DIGEST_TOPIC_DEFAULTS: Readonly<Record<DigestTopic, boolean>> = {
  connections: true,
  messages: true,
  opportunities: true,
  events: true,
  updates: true,
  matches: true,
};

export function isDigestTopic(value: unknown): value is DigestTopic {
  return typeof value === 'string' && (DIGEST_TOPICS as readonly string[]).includes(value);
}

/** The topics as stored rows say them; a topic with no row keeps its default. */
export function readDigestTopics(rows: readonly { category: string; isEnabled: boolean }[]): Record<DigestTopic, boolean> {
  const out: Record<DigestTopic, boolean> = { ...DIGEST_TOPIC_DEFAULTS };
  for (const row of rows) if (isDigestTopic(row.category)) out[row.category] = row.isEnabled;
  return out;
}

/**
 * What each switch puts in the email, in both languages. Named for what the
 * email holds: "Connections" and "Messages" are also the channel table's
 * categories on the same page, which mean something else.
 */
export const DIGEST_TOPIC_COPY: Readonly<Record<DigestTopic, { en: string; el: string; detailEn: string; detailEl: string }>> = {
  connections: {
    en: 'New connections',
    el: 'Νέες συνδέσεις',
    detailEn: 'People you connected with since the last digest.',
    detailEl: 'Όσοι συνδεθήκατε από την προηγούμενη σύνοψη.',
  },
  messages: {
    en: 'Conversations with new messages',
    el: 'Συνομιλίες με νέα μηνύματα',
    detailEn: 'Muted conversations stay out.',
    detailEl: 'Όσες έχετε σε σίγαση μένουν έξω.',
  },
  opportunities: {
    en: 'Opportunities and saved searches',
    el: 'Ευκαιρίες και αποθηκευμένες αναζητήσεις',
    detailEn: 'New opportunities, and new results for the searches you saved.',
    detailEl: 'Νέες ευκαιρίες και νέα αποτελέσματα για τις αναζητήσεις που αποθηκεύσατε.',
  },
  events: {
    en: 'Events',
    el: 'Εκδηλώσεις',
    detailEn: 'Events coming up.',
    detailEl: 'Εκδηλώσεις που πλησιάζουν.',
  },
  updates: {
    en: 'Updates from people you follow',
    el: 'Ενημερώσεις από όσους ακολουθείτε',
    detailEn: 'Founder updates posted since the last digest.',
    detailEl: 'Ενημερώσεις ιδρυτών που δημοσιεύτηκαν από την προηγούμενη σύνοψη.',
  },
  matches: {
    en: 'Suggested matches',
    el: 'Προτεινόμενες αντιστοιχίσεις',
    detailEn: 'People who complement you, from the same suggestions as Matches.',
    detailEl: 'Άτομα που σας συμπληρώνουν, από τις ίδιες προτάσεις με τις Αντιστοιχίσεις.',
  },
};
