import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { forgotPassword, login, register } from './api';
import { applyPreviewDemoSession, isPreviewDemo, leavePreviewDemoForRealAccount, restorePreviewDemoSessionIfNeeded } from './preview-demo';
import { DemoDataProvider, useDemoData } from '@/contexts/DemoDataContext';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function clearCookies() {
  for (const name of ['cfb_session', 'cfb_preview_demo', 'cfb_primary_role', 'cfb_csrf']) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
}

beforeEach(() => {
  localStorage.clear();
  clearCookies();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  clearCookies();
});

describe('restoring a demo session', () => {
  it('does not overwrite a real session when sample data was left on', () => {
    document.cookie = 'cfb_session=real-session; path=/';
    localStorage.setItem('cfb_demo_data', '1');
    expect(restorePreviewDemoSessionIfNeeded()).toBe(false);
    expect(document.cookie).toContain('cfb_session=real-session');
    expect(document.cookie).not.toContain('preview-demo');
  });
});

describe('leaving the demo before a real account', () => {
  it('sends sign-up to the server after the visitor tried the demo (the shim used to answer it with a fake success)', async () => {
    applyPreviewDemoSession();
    expect(isPreviewDemo()).toBe(true);
    const fetch = vi.fn().mockResolvedValue(json({ user: { id: 'u1', email: 'a@b.co', role: 'founder', emailVerified: false }, tokens: {} }));
    vi.stubGlobal('fetch', fetch);

    await register({ email: 'a@b.co', password: 'a-long-password' });

    expect(fetch).toHaveBeenCalled();
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/api\/auth\/register$/);
    expect(isPreviewDemo()).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('sends sign-in and password reset to the server too', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(json({ user: { id: 'u1' }, tokens: {}, sent: true })));
    vi.stubGlobal('fetch', fetch);

    applyPreviewDemoSession();
    await login({ email: 'a@b.co', password: 'a-long-password' });
    expect(String(fetch.mock.calls[0][0])).toMatch(/\/api\/auth\/login$/);

    applyPreviewDemoSession();
    await forgotPassword('a@b.co');
    expect(String(fetch.mock.calls[1][0])).toMatch(/\/api\/auth\/forgot-password$/);
  });

  it('leaves a real session alone', () => {
    document.cookie = 'cfb_session=1; path=/';
    localStorage.setItem('user', JSON.stringify({ id: 'real-user' }));
    leavePreviewDemoForRealAccount();
    expect(document.cookie).toContain('cfb_session=1');
    expect(localStorage.getItem('user')).toContain('real-user');
  });
});

function Probe() {
  const { showDemoData, setShowDemoData } = useDemoData();
  return (
    <>
      <span data-testid="samples">{showDemoData ? 'on' : 'off'}</span>
      <button type="button" onClick={() => setShowDemoData(!showDemoData)}>toggle</button>
    </>
  );
}

describe('the "Show sample data" switch', () => {
  it('is off for a real account, so a new member sees their own pages', async () => {
    document.cookie = 'cfb_session=1; path=/';
    render(<DemoDataProvider><Probe /></DemoDataProvider>);
    expect(screen.getByTestId('samples').textContent).toBe('off');
  });

  it('is on in the demo, unless the visitor hid the samples', () => {
    applyPreviewDemoSession();
    const { unmount } = render(<DemoDataProvider><Probe /></DemoDataProvider>);
    expect(screen.getByTestId('samples').textContent).toBe('on');
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('samples').textContent).toBe('off');
    unmount();
    cleanup();
    render(<DemoDataProvider><Probe /></DemoDataProvider>);
    expect(screen.getByTestId('samples').textContent).toBe('off');
  });

  it('turning samples on does not turn the browser into a demo session', () => {
    document.cookie = 'cfb_session=1; path=/';
    render(<DemoDataProvider><Probe /></DemoDataProvider>);
    act(() => screen.getByText('toggle').click());
    expect(screen.getByTestId('samples').textContent).toBe('on');
    expect(isPreviewDemo()).toBe(false);
    expect(localStorage.getItem('cfb_demo_data')).toBeNull();
  });
});
