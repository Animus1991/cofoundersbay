import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESERVED_ORG_SLUGS, readNewOrganization } from '@cofounderbay/shared';
import { resolvePreviewApi } from './preview-api';

const ORG_DIR = join(__dirname, '..', 'app', 'org');

describe('organisation creation', () => {
  it('reserves every /org page folder, so no organisation can take a page of the product', () => {
    const folders = readdirSync(ORG_DIR).filter((f) => !f.startsWith('[') && statSync(join(ORG_DIR, f)).isDirectory());
    expect(folders.length).toBeGreaterThan(5);
    for (const folder of folders) expect(RESERVED_ORG_SLUGS as readonly string[]).toContain(folder);
  });

  it('the demo applies the same reader and says why it does not add a second organisation', () => {
    const invalid = () => resolvePreviewApi('/api/organizations', { method: 'POST', body: JSON.stringify({ name: 'Lab', slug: 'cohorts', type: 'incubator' }) });
    expect(invalid).toThrow();
    try { invalid(); } catch (e) {
      const err = e as { status?: number; details?: { field?: string; messageEl?: string } };
      expect(err.details?.field).toBe('slug');
      expect(err.details?.messageEl).toBeTruthy();
    }
    const valid = { name: 'Thessaloniki Founders Hub', slug: 'thess-hub', type: 'innovation_hub' };
    expect(readNewOrganization(valid).ok).toBe(true);
    try {
      resolvePreviewApi('/api/organizations', { method: 'POST', body: JSON.stringify(valid) });
      throw new Error('expected a refusal');
    } catch (e) {
      const err = e as { status?: number; details?: { reason?: string } };
      expect(err.status).toBe(409);
      expect(err.details?.reason).toBe('org_exists');
    }
  });
});
