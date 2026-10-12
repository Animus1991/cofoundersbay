import type { ProfileViewSource, ProfileViewersView } from '@cofounderbay/shared';
import { apiRequest } from '@/lib/api';

/**
 * Reports that the reader opened someone's profile. Fire and forget: a failed
 * count never stops the profile from showing, so errors are swallowed here.
 */
export async function recordProfileView(userId: string, source: ProfileViewSource = 'direct'): Promise<void> {
  if (!userId) return;
  try {
    await apiRequest(`/api/profile-viewers/${encodeURIComponent(userId)}/view`, {
      method: 'POST',
      body: JSON.stringify({ source }),
    }, { retryOn401: false });
  } catch {
    // Counting is best effort.
  }
}

/** Who viewed the reader's profile in the last 90 days, shaped even from a partial payload. */
export async function getProfileViewers(): Promise<ProfileViewersView> {
  const res = await apiRequest<Partial<ProfileViewersView> | null>('/api/profile-viewers/me');
  return {
    windowDays: typeof res?.windowDays === 'number' ? res.windowDays : 90,
    totalViews: typeof res?.totalViews === 'number' ? res.totalViews : 0,
    members: typeof res?.members === 'number' ? res.members : 0,
    named: Array.isArray(res?.named) ? res.named : [],
    privateCount: typeof res?.privateCount === 'number' ? res.privateCount : 0,
    privateByRole: Array.isArray(res?.privateByRole) ? res.privateByRole : [],
    signedOutViews: typeof res?.signedOutViews === 'number' ? res.signedOutViews : 0,
    readerSharesName: res?.readerSharesName === true,
  };
}

export async function getViewerSetting(): Promise<{ shareName: boolean }> {
  const res = await apiRequest<{ shareName?: unknown } | null>('/api/profile-viewers/settings');
  return { shareName: res?.shareName === true };
}

export async function setViewerSetting(shareName: boolean): Promise<{ shareName: boolean }> {
  const res = await apiRequest<{ shareName?: unknown } | null>('/api/profile-viewers/settings', {
    method: 'PUT',
    body: JSON.stringify({ shareName }),
  });
  return { shareName: res?.shareName === true };
}
