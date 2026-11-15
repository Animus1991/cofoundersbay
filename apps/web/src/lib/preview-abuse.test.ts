import { beforeEach, describe, expect, it } from 'vitest';
import { resolvePreviewApi } from './preview-api';

type Flags = { flags?: Array<{ id: string; status: string; actionTaken?: string | null }>; total?: number };

describe('preview abuse console', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('keeps a closed flag closed on the next read, with the action recorded', () => {
    const before = resolvePreviewApi('/api/admin/abuse?status=pending') as Flags;
    expect(before.flags?.some((f) => f.id === 'flag-1')).toBe(true);
    resolvePreviewApi('/api/admin/abuse/flag-1/resolve', { method: 'POST', body: JSON.stringify({ action: 'warning', status: 'actioned' }) });
    const all = resolvePreviewApi('/api/admin/abuse') as Flags;
    const flag = all.flags?.find((f) => f.id === 'flag-1');
    expect(flag?.status).toBe('actioned');
    expect(flag?.actionTaken).toBe('warning');
    const pending = resolvePreviewApi('/api/admin/abuse?status=pending') as Flags;
    expect(pending.flags?.some((f) => f.id === 'flag-1')).toBe(false);
  });

  it('refuses a resolve without both fields, as the API does', () => {
    expect(() => resolvePreviewApi('/api/admin/abuse/flag-2/resolve', { method: 'POST', body: JSON.stringify({ action: 'safe' }) })).toThrow();
  });

  it('runs the ring scan and finds nothing new in the demo', () => {
    expect(resolvePreviewApi('/api/admin/abuse/run-ring-detection', { method: 'POST' })).toEqual({ flagsCreated: 0, detections: [] });
  });
});
