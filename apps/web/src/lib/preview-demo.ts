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
  document.cookie = `${name}=${value}; path=/; SameSite=Lax; max-age=${COOKIE_MAX_AGE}`;
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
  } catch {
    // ignore quota / private mode
  }

  window.dispatchEvent(new CustomEvent('cfb:login'));
  window.dispatchEvent(new CustomEvent('cfb:user'));
}
