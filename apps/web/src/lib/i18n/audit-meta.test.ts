import { describe, expect, it } from 'vitest';
import { auditMeta } from './audit-meta';

describe('audit log details', () => {
  it('names the fields in words and the values in the reader’s language', () => {
    expect(auditMeta({ oldRole: 'founder', newRole: 'org', banUser: false, actorId: 'u1' })).toEqual({
      en: 'Previous role: founder · New role: org · Account banned: no',
      el: 'Προηγούμενος ρόλος: ιδρυτής · Νέος ρόλος: οργανισμός · Αποκλεισμός λογαριασμού: όχι',
    });
  });

  it('keeps free text as written and has nothing to say for no details', () => {
    expect(auditMeta({ reason: 'Two spam reports in two days' })?.el).toBe('Αιτία: Two spam reports in two days');
    expect(auditMeta({ actorId: 'u1' })).toBeNull();
    expect(auditMeta(null)).toBeNull();
  });
});
