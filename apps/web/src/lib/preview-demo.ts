export const PREVIEW_DEMO_USER = {
  id: 'preview-demo-user',
  email: 'demo@cofounderbay.com',
  role: 'founder',
  displayName: 'Alex Demo',
  firstName: 'Alex',
  lastName: 'Demo',
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setCookie(name: string, value: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; path=/; SameSite=Lax; max-age=${COOKIE_MAX_AGE}${secure}`;
}

export function isPreviewDemo(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return (
      document.cookie.includes('cfb_preview_demo=1') ||
      document.cookie.includes('cfb_session=preview-demo') ||
      window.localStorage.getItem('cfb_demo_data') === '1' ||
      window.location.hostname.endsWith('.trycloudflare.com')
    );
  } catch {
    return false;
  }
}

export function applyPreviewDemoSession(
  user: typeof PREVIEW_DEMO_USER = PREVIEW_DEMO_USER,
) {
  if (typeof document === 'undefined') return;

  setCookie('cfb_session', 'preview-demo');
  setCookie('cfb_primary_role', 'existing_founder');
  setCookie('cfb_preview_demo', '1');

  try {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('cfb_demo_data', '1');
    localStorage.setItem('accessToken', 'preview-demo');
  } catch {
    // ignore quota / private mode
  }

  window.dispatchEvent(new CustomEvent('cfb:login'));
  window.dispatchEvent(new CustomEvent('cfb:user'));
}

/** Re-apply demo cookies if sample-data mode is on but the session cookie was cleared. */
export function restorePreviewDemoSessionIfNeeded() {
  if (typeof document === 'undefined') return false;
  try {
    const wantsDemo =
      window.localStorage.getItem('cfb_demo_data') === '1' ||
      document.cookie.includes('cfb_preview_demo=1') ||
      (typeof window !== 'undefined' && window.location.hostname.endsWith('.trycloudflare.com'));
    if (!wantsDemo) return false;
    if (!document.cookie.includes('cfb_session=preview-demo')) {
      applyPreviewDemoSession();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function clearPreviewDemoSession() {
  if (typeof document === 'undefined') return;
  document.cookie = 'cfb_session=; Max-Age=0; path=/; SameSite=Lax';
  document.cookie = 'cfb_preview_demo=; Max-Age=0; path=/; SameSite=Lax';
  document.cookie = 'cfb_primary_role=; Max-Age=0; path=/; SameSite=Lax';
  try {
    localStorage.removeItem('cfb_demo_data');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch {
    // ignore quota / private mode
  }
}
