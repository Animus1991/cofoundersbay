import { describe, expect, it } from 'vitest';
import { listDeclarations } from '@cofounderbay/shared';
import { CAPABILITY_SAMPLES } from './capability-samples';

describe('one example request per capability (docs §54.7-1, §111)', () => {
  it('has an example in both languages for every declared capability, and none for a missing one', () => {
    const ids = listDeclarations().map((d) => d.id);
    const missing = ids.filter((id) => !CAPABILITY_SAMPLES[id]?.en?.trim() || !CAPABILITY_SAMPLES[id]?.el?.trim());
    expect(missing).toEqual([]);
    const stray = Object.keys(CAPABILITY_SAMPLES).filter((id) => !ids.includes(id));
    expect(stray).toEqual([]);
  });
});
