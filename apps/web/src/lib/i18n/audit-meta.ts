import { statusEl } from '@/components/common/StatusText';

/** The details' field names, as words. The row printed the raw keys ("OldRole: founder · NewRole: org · BanUser: false"). */
const META_LABEL: Record<string, { en: string; el: string }> = {
  name: { en: 'Name', el: 'Όνομα' },
  title: { en: 'Title', el: 'Τίτλος' },
  note: { en: 'Note', el: 'Σημείωση' },
  reason: { en: 'Reason', el: 'Αιτία' },
  status: { en: 'Status', el: 'Κατάσταση' },
  role: { en: 'Role', el: 'Ρόλος' },
  oldRole: { en: 'Previous role', el: 'Προηγούμενος ρόλος' },
  newRole: { en: 'New role', el: 'Νέος ρόλος' },
  banUser: { en: 'Account banned', el: 'Αποκλεισμός λογαριασμού' },
  email: { en: 'Email', el: 'Email' },
  count: { en: 'Count', el: 'Πλήθος' },
};

function metaLabel(key: string): { en: string; el: string } {
  const known = META_LABEL[key];
  if (known) return known;
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase();
  const en = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  return { en, el: en };
}

function metaValue(value: unknown): { en: string; el: string } {
  if (value === true) return { en: 'yes', el: 'ναι' };
  if (value === false) return { en: 'no', el: 'όχι' };
  const text = String(value);
  return { en: text, el: statusEl(text)?.toLowerCase() ?? text };
}

/** One line of details in both languages, or null when there are none. */
export function auditMeta(meta: Record<string, unknown> | null | undefined): { en: string; el: string } | null {
  const parts = Object.entries(meta ?? {})
    .filter(([key, value]) => key !== 'actorId' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const label = metaLabel(key);
      const shown = metaValue(value);
      return { en: `${label.en}: ${shown.en}`, el: `${label.el}: ${shown.el}` };
    });
  if (!parts.length) return null;
  return { en: parts.map((p) => p.en).join(' · '), el: parts.map((p) => p.el).join(' · ') };
}
