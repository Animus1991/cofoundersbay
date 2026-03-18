// Returns the API base URL evaluated at call time — not module load time.
// Always uses NEXT_PUBLIC_API_URL if set (set it to http://localhost:3001 in .env.local).
// Never derives host from window.location to avoid LAN IP (192.168.x.x) mismatches.
function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export type AuthUser = { id: string; email: string; role: string; emailVerified?: boolean };
export type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  
  constructor(status: number, message: string, code?: string, details?: Record<string, unknown>, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  static fromStandardError(error: any): ApiError {
    return new ApiError(
      error.status || 500,
      error.message || 'Unknown error',
      error.code,
      error.details,
      error.requestId,
    );
  }
}

// Legacy localStorage cleanup — remove tokens if left over from pre-cookie auth
function clearLegacyTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Note: 'user' key is kept as display data, not a security concern
}

// Run once at module load — purges any stale auth tokens from the legacy system
clearLegacyTokens();

/** Read the CSRF double-submit cookie value */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)cfb_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function safeReadErrorMessage(res: Response): Promise<{ message: string; code?: string; details?: Record<string, unknown>; requestId?: string }> {
  try {
    const data = await res.json();
    
    // Handle standardized error format
    if (data && typeof data === 'object' && 'success' in data && data.success === false && 'error' in data) {
      const error = data.error as { code: string; message: string; details?: Record<string, unknown>; requestId?: string };
      return {
        message: error.message,
        code: error.code,
        details: error.details,
        requestId: error.requestId,
      };
    }
    
    // Handle legacy error formats
    if (typeof data?.message === 'string' && data.message.trim()) {
      return { message: data.message };
    }
    if (typeof data?.error === 'string' && data.error.trim()) {
      return { message: data.error };
    }
  } catch {
    // ignore
  }
  return { message: res.statusText || 'Request failed' };
}

async function readJsonIfAny<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // @ts-expect-error allow void returns in callers
    return undefined;
  }
  const text = await res.text();
  if (!text) {
    // @ts-expect-error allow void returns in callers
    return undefined;
  }
  const parsed = JSON.parse(text);
  // Unwrap NestJS ResponseInterceptor envelope: {success:true, data:X, timestamp, requestId}
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'success' in parsed &&
    parsed.success === true &&
    'data' in parsed &&
    parsed.data !== undefined
  ) {
    return parsed.data as T;
  }
  return parsed as T;
}

let refreshInFlight: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const errorInfo = await safeReadErrorMessage(res);
    throw new ApiError(res.status, errorInfo.message || 'Session expired', errorInfo.code, errorInfo.details, errorInfo.requestId);
  }
}

const REQUEST_TIMEOUT_MS = 8_000;
const NETWORK_RETRY_ATTEMPTS = 2;
const NETWORK_RETRY_DELAY_MS = 800;

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = init.signal
    ? (() => {
        // Merge provided signal with timeout signal
        const merged = new AbortController();
        init.signal.addEventListener('abort', () => merged.abort());
        controller.signal.addEventListener('abort', () => merged.abort());
        return merged.signal;
      })()
    : controller.signal;
  return fetch(url, { ...init, signal }).finally(() => clearTimeout(timer));
}

async function fetchWithNetworkRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= NETWORK_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fetchWithTimeout(url, init);
    } catch (err) {
      lastError = err;
      const isNetworkErr = err instanceof TypeError || (err instanceof DOMException && err.name === 'AbortError');
      if (!isNetworkErr || attempt === NETWORK_RETRY_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, NETWORK_RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  opts?: { retryOn401?: boolean; skipNetworkRetry?: boolean },
): Promise<T> {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(init?.headers ?? {});
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (!headers.has('Content-Type') && !isForm) headers.set('Content-Type', 'application/json');

  // Attach CSRF token for state-changing methods
  const method = (init?.method ?? 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('x-csrf-token', csrf);
  }

  const doFetch = opts?.skipNetworkRetry
    ? (u: string, i: RequestInit) => fetchWithTimeout(u, i)
    : fetchWithNetworkRetry;

  const res = await doFetch(url, { ...init, headers, credentials: 'include' });
  if (res.status === 401 && (opts?.retryOn401 ?? true)) {
    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      await refreshInFlight;

      // Retry with new cookie (set by refresh response)
      const retryRes = await doFetch(url, { ...init, headers, credentials: 'include' });
      if (!retryRes.ok) {
        const errorInfo = await safeReadErrorMessage(retryRes);
        throw new ApiError(retryRes.status, errorInfo.message, errorInfo.code, errorInfo.details, errorInfo.requestId);
      }
      return (await readJsonIfAny<T>(retryRes)) as T;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearLegacyTokens();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cfb:logout'));
      }
      throw e;
    }
  }

  if (!res.ok) {
    const errorInfo = await safeReadErrorMessage(res);
    throw new ApiError(res.status, errorInfo.message, errorInfo.code, errorInfo.details, errorInfo.requestId);
  }
  return (await readJsonIfAny<T>(res)) as T;
}

export async function register(body: { email: string; password: string; role?: string }) {
  clearLegacyTokens();
  const result = await apiRequest<{ user: AuthUser; verificationRequired: boolean }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify(body) },
    { retryOn401: false },
  );
  // Only dispatch login event if not pending email verification
  if (!result.verificationRequired && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cfb:login'));
  }
  return result;
}

export async function forgotPassword(email: string): Promise<{ sent: boolean }> {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function login(body: { email: string; password: string }) {
  clearLegacyTokens();
  const result = await apiRequest<{ user: AuthUser }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify(body) },
    { retryOn401: false },
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cfb:login'));
  return result;
}

export async function logout() {
  await apiRequest<{ ok: true }>(
    '/api/auth/logout',
    { method: 'POST' },
    { retryOn401: false },
  ).catch(() => {});
  clearLegacyTokens();
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cfb:logout'));
}

/** Get current user from HttpOnly cookie session */
export async function getMe(): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>(
    '/api/auth/me',
    { method: 'GET' },
    { retryOn401: false },
  );
}

export async function verifyEmail(token: string): Promise<{ ok: boolean; email: string }> {
  return apiRequest('/api/auth/verify-email?token=' + encodeURIComponent(token), { method: 'GET' }, { retryOn401: false });
}

export async function resendVerification(email: string): Promise<{ ok: boolean }> {
  return apiRequest('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }, { retryOn401: false });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- Profile & skills ---

export type Skill = { id: string; name: string; slug: string; category: string | null };
export type ProfileSkill = { skillId: string; skillName: string; slug?: string; level: string | null };

export type OwnProfile = {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  languages: string[] | null;
  avatarUrl: string | null;
  rolePayload: Record<string, unknown> | null;
  visibilityRules: Record<string, string> | null;
  role: string;
  email?: string;
  skills: ProfileSkill[];
  createdAt: string;
  updatedAt: string;
};

export type PublicProfile = OwnProfile & { email?: string };

export async function getMeProfile(): Promise<{ profile: OwnProfile | null; hasCompletedOnboarding: boolean }> {
  return apiRequest('/api/me/profile');
}

export async function createProfile(body: Record<string, unknown>) {
  return apiRequest<OwnProfile>('/api/me/profile', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProfile(body: Record<string, unknown>) {
  return apiRequest<OwnProfile>('/api/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadAvatar(file: File): Promise<{ upload: { id: string; url: string } }> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/uploads/avatar', {
    method: 'POST',
    body: form,
  });
}

export async function uploadMessageAttachment(
  file: File,
): Promise<{ upload: { id: string; url: string; mimeType: string | null; originalName: string | null; sizeBytes: number | null } }> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/uploads/message-attachment', {
    method: 'POST',
    body: form,
  });
}

export async function getPublicProfile(userId: string, token?: string | null): Promise<PublicProfile> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return apiRequest<PublicProfile>(`/api/profiles/${userId}`, { headers }, { retryOn401: false });
}

export async function listSkills(category?: string): Promise<Skill[]> {
  const sp = new URLSearchParams();
  if (category) sp.set('category', category);
  const url = `/api/skills${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest<Skill[]>(url, undefined, { retryOn401: false });
}

// --- Search & recommendations ---

export type SearchHit = {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  location: string | null;
  role: string;
  skillNames: string[];
  skills?: string[];
  industries?: string[];
  matchScore?: number;
  /** Human-readable match reasons from matching engine (e.g. "Cofounder match", "Skills overlap"). */
  matchReasons?: string[];
  lookingFor?: string | null;
  availability?: string | null;
};

export async function searchProfiles(params: {
  q?: string;
  roles?: string[];
  location?: string;
  skills?: string[];
  industries?: string[];
  stage?: string[];
  languages?: string[];
  commitment?: string[];
  investmentStages?: string[];
  sortBy?: 'relevance' | 'recent' | 'active';
  limit?: number;
  offset?: number;
}): Promise<{ hits: SearchHit[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.roles?.length) sp.set('roles', params.roles.join(','));
  if (params.location) sp.set('location', params.location);
  if (params.skills?.length) sp.set('skills', params.skills.join(','));
  if (params.industries?.length) sp.set('industries', params.industries.join(','));
  if (params.stage?.length) sp.set('stage', params.stage.join(','));
  if (params.languages?.length) sp.set('languages', params.languages.join(','));
  if (params.commitment?.length) sp.set('commitment', params.commitment.join(','));
  if (params.investmentStages?.length) sp.set('investmentStages', params.investmentStages.join(','));
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  return apiRequest<{ hits: SearchHit[]; total: number }>(`/api/search/profiles?${sp}`);
}

export async function getRecommendations(params?: { role?: string; limit?: number }): Promise<{ suggestions: SearchHit[] }> {
  const sp = new URLSearchParams();
  if (params?.role) sp.set('role', params.role);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/recommendations${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest<{ suggestions: SearchHit[] }>(url);
}

// --- Messaging ---

export type ConversationSummary = {
  id: string;
  type: 'direct' | 'group';
  recipient: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    role: string;
    isOnline: boolean;
    lastSeenAt: string | null;
  } | null;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: string;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  attachments: {
    id: string;
    url: string;
    mimeType: string | null;
    fileName: string | null;
    sizeBytes: number | null;
  }[];
};

export async function listMessageConversations(): Promise<{ conversations: ConversationSummary[] }> {
  return apiRequest('/api/messages/conversations');
}

export async function getOrCreateDirectConversation(userId: string): Promise<{ conversationId: string }> {
  return apiRequest('/api/messages/conversations/direct', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function listConversationMessages(conversationId: string, limit?: number): Promise<{ messages: MessageItem[] }> {
  const sp = new URLSearchParams();
  if (limit != null) sp.set('limit', String(limit));
  return apiRequest(`/api/messages/conversations/${conversationId}/messages${sp.toString() ? `?${sp}` : ''}`);
}

export async function updateConversationFlags(
  conversationId: string,
  flags: { isPinned?: boolean; isArchived?: boolean },
): Promise<{ ok: true }> {
  return apiRequest(`/api/messages/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify(flags),
  });
}

// --- Notifications ---

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  meta: unknown;
  createdAt: string;
  readAt: string | null;
};

export async function listNotifications(params?: { limit?: number; cursor?: string | null }): Promise<{
  notifications: NotificationItem[];
  nextCursor: string | null;
}> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.cursor) sp.set('cursor', params.cursor);
  const url = `/api/notifications${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  return apiRequest('/api/notifications/read-all', { method: 'POST' });
}

// --- Billing (Stripe) ---

export type BillingSubscription = {
  id: string;
  status: string;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export async function getBillingSubscription(): Promise<{ subscription: BillingSubscription | null }> {
  return apiRequest('/api/billing/subscription');
}

export async function createBillingCheckout(priceId?: string): Promise<{ url: string | null; id: string }> {
  return apiRequest('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
}

export async function createBillingPortal(): Promise<{ url: string }> {
  return apiRequest('/api/billing/portal', { method: 'POST' });
}

// --- Dashboard ---

export type DashboardStats = {
  activeProfiles: number;
  matchesThisWeek: number;
  trendPercent: number;
  chartData: { label: string; value: number }[];
};

export type DashboardActivityItem = {
  id: string;
  type: 'connection' | 'event';
  title: string;
  author?: string;
  timeAgo: string;
  href: string;
  createdAt: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest('/api/dashboard/stats');
}

export async function getDashboardActivity(params?: { limit?: number }): Promise<DashboardActivityItem[]> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/dashboard/activity${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

// --- Analytics ---

export interface UserMetrics {
  profileViews: number;
  profileViewsChange: number;
  newConnections: number;
  newConnectionsChange: number;
  messagesSent: number;
  messagesSentChange: number;
  engagementRate: number;
  engagementRateChange: number;
  searchAppearances: number;
  searchAppearancesChange: number;
  activityScore: number;
  activityScoreChange: number;
}

export interface AnalyticsProfileView {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface AnalyticsEngagement {
  connections: number;
  messages: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface AnalyticsTopContent {
  id: string;
  type: 'post' | 'comment' | 'profile';
  title: string;
  views: number;
  engagement: number;
  date: string;
}

export interface AnalyticsAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface WeeklySummary {
  mostActiveDay: string;
  peakHour: string;
  avgResponseTime: string;
  totalInteractions: number;
}

export async function getAnalyticsMetrics(period = '7d'): Promise<UserMetrics> {
  return apiRequest(`/api/analytics/metrics?period=${period}`);
}

export async function getAnalyticsProfileViews(period = '7d'): Promise<AnalyticsProfileView[]> {
  return apiRequest(`/api/analytics/profile-views?period=${period}`);
}

export async function getAnalyticsEngagement(period = '7d'): Promise<AnalyticsEngagement> {
  return apiRequest(`/api/analytics/engagement?period=${period}`);
}

export async function getAnalyticsTopContent(limit = 10): Promise<AnalyticsTopContent[]> {
  return apiRequest(`/api/analytics/top-content?limit=${limit}`);
}

export async function getAnalyticsAchievements(): Promise<AnalyticsAchievement[]> {
  return apiRequest('/api/analytics/achievements');
}

export async function getWeeklySummary(): Promise<WeeklySummary> {
  return apiRequest('/api/analytics/weekly-summary');
}

export async function getGrowthTrends(period = '30d'): Promise<{ data: { date: string; connections: number; views: number }[] }> {
  return apiRequest(`/api/analytics/growth-trends?period=${period}`);
}

// --- Polls ---

export type PollOptionView = { id: string; label: string; votes: number };
export type PollView = {
  id: string;
  question: string;
  options: PollOptionView[];
  totalVotes: number;
  userVoted: string | null;
  isActive: boolean;
};

export async function getActivePoll(): Promise<{ poll: PollView | null }> {
  return apiRequest('/api/polls/active', undefined, { retryOn401: false });
}

export async function votePoll(pollId: string, optionId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId }),
  });
}

// --- Jobs ---

export type JobPostingView = {
  id: string;
  title: string;
  role: string | null;
  location: string | null;
  isRemote: boolean;
  type?: string;
  isFeatured?: boolean;
  creator: { displayName: string; avatarUrl: string | null };
  href?: string;
};

export async function listJobs(params?: { limit?: number }): Promise<{ jobs: JobPostingView[] }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/jobs${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url, undefined, { retryOn401: false });
}

// --- Events ---

export type EventItem = {
  id: string;
  title: string;
  description: string;
  eventType: 'meetup' | 'webinar' | 'workshop' | 'demo_day' | 'networking' | 'other';
  mode: 'online' | 'in-person' | 'hybrid';
  startAt: string;
  endAt: string;
  timezone: string | null;
  location: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  capacity: number | null;
  coverImageUrl: string | null;
  attendeesCount: number;
  host: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  viewerRsvp: 'going' | 'interested' | 'not_going' | null;
  isFeatured?: boolean;
};

export async function listEvents(params?: {
  scope?: 'upcoming' | 'mine' | 'past';
  q?: string;
  mode?: 'online' | 'in-person' | 'hybrid';
  limit?: number;
}): Promise<{ events: EventItem[] }> {
  const sp = new URLSearchParams();
  if (params?.scope) sp.set('scope', params.scope);
  if (params?.q) sp.set('q', params.q);
  if (params?.mode) sp.set('mode', params.mode);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/events${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url, undefined, { retryOn401: false });
}

export async function createEvent(body: {
  title: string;
  description?: string;
  type?: 'meetup' | 'webinar' | 'workshop' | 'demo_day' | 'networking' | 'other';
  startAt: string;
  endAt?: string;
  timezone?: string;
  location?: string;
  isOnline?: boolean;
  meetingUrl?: string;
  capacity?: number;
  coverImageUrl?: string;
}): Promise<{ event: EventItem }> {
  return apiRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function rsvpEvent(
  eventId: string,
  status: 'going' | 'interested' | 'not_going',
): Promise<{ ok: true; status: 'going' | 'interested' | 'not_going' }> {
  return apiRequest(`/api/events/${eventId}/rsvp`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

// --- Mentoring ---

export type MentorAvailabilitySlot = {
  id: string;
  mentorId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string | null;
};

export type MentorBookingItem = {
  id: string;
  mentorId: string;
  menteeId: string;
  startAt: string;
  endAt: string;
  timezone: string | null;
  meetingType: 'video' | 'in_person' | 'chat';
  meetingUrl: string | null;
  notes: string | null;
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
  priceCents: number | null;
  currency: string | null;
  mentor: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  mentee: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export async function listMentorAvailability(mentorId?: string): Promise<{ slots: MentorAvailabilitySlot[] }> {
  const sp = new URLSearchParams();
  if (mentorId) sp.set('mentorId', mentorId);
  const url = `/api/mentor/availability${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function replaceMentorAvailability(
  slots: Array<{ weekday: number; startTime: string; endTime: string; timezone?: string }>,
): Promise<{ slots: MentorAvailabilitySlot[] }> {
  return apiRequest('/api/mentor/availability', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  });
}

export async function listMentorBookings(
  scope?: 'all' | 'mentor' | 'mentee',
): Promise<{ bookings: MentorBookingItem[] }> {
  const sp = new URLSearchParams();
  if (scope) sp.set('scope', scope);
  const url = `/api/mentor/bookings${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function createMentorBooking(body: {
  mentorId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
  meetingType?: 'video' | 'in_person' | 'chat';
  notes?: string;
}): Promise<{ booking: MentorBookingItem }> {
  return apiRequest('/api/mentor/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMentorBooking(
  bookingId: string,
  body: {
    status?: 'requested' | 'confirmed' | 'cancelled' | 'completed';
    meetingUrl?: string | null;
    notes?: string | null;
  },
): Promise<{ booking: MentorBookingItem }> {
  return apiRequest(`/api/mentor/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// --- Moderation / Admin ---

export type AdminReportItem = {
  id: string;
  type: 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reason: string;
  context: unknown;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  reported: {
    id: string;
    email: string;
    name: string;
    role: string;
    moderationStatus: 'active' | 'suspended' | 'banned';
  };
};

export type AdminUserItem = {
  id: string;
  email: string;
  role: string;
  moderationStatus: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastSeenAt: string | null;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  reportsCount: number;
};

export async function createUserReport(body: {
  reportedId: string;
  type: 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'other';
  reason: string;
  context?: unknown;
}): Promise<{ report: AdminReportItem }> {
  return apiRequest('/api/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listAdminReports(params?: {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  q?: string;
  limit?: number;
}): Promise<{ reports: AdminReportItem[] }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.q) sp.set('q', params.q);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/admin/reports${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function updateAdminReport(
  reportId: string,
  body: {
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    moderationStatus?: 'active' | 'suspended' | 'banned';
  },
): Promise<{ report: AdminReportItem }> {
  return apiRequest(`/api/admin/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function listAdminUsers(params?: {
  q?: string;
  limit?: number;
}): Promise<{ users: AdminUserItem[] }> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/admin/users${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function updateAdminUserModeration(
  userId: string,
  moderationStatus: 'active' | 'suspended' | 'banned',
): Promise<{ ok: true }> {
  return apiRequest(`/api/admin/users/${userId}/moderation-status`, {
    method: 'PATCH',
    body: JSON.stringify({ moderationStatus }),
  });
}

// --- Connections ---

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export type ConnectionRequestItem = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    headline: string | null;
  };
  receiver: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    headline: string | null;
  };
};

export async function sendConnectionRequest(body: {
  receiverId: string;
  message?: string;
}): Promise<{ connection: ConnectionRequestItem }> {
  return apiRequest('/api/connections', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listConnectionRequests(params?: {
  type?: 'sent' | 'received' | 'accepted';
  limit?: number;
}): Promise<{ connections: ConnectionRequestItem[] }> {
  const sp = new URLSearchParams();
  if (params?.type) sp.set('type', params.type);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/connections${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function respondToConnectionRequest(
  connectionId: string,
  status: 'accepted' | 'declined',
): Promise<{ connection: ConnectionRequestItem }> {
  return apiRequest(`/api/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getConnectionStatus(userId: string): Promise<{
  status: ConnectionStatus | null;
  connectionId: string | null;
  direction: 'sent' | 'received' | null;
}> {
  return apiRequest(`/api/connections/status/${userId}`);
}

// --- Jobs (full CRUD) ---

export async function createJobPosting(body: {
  title: string;
  description?: string;
  role?: string;
  location?: string;
  isRemote?: boolean;
}): Promise<{ job: JobPostingView }> {
  return apiRequest('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getJobPosting(jobId: string): Promise<{ job: JobPostingView & { description: string | null; createdAt: string } }> {
  return apiRequest(`/api/jobs/${jobId}`, undefined, { retryOn401: false });
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  await apiRequest(`/api/jobs/${jobId}`, { method: 'DELETE' });
}

// --- Groups ---

export type GroupPrivacy = 'public' | 'private' | 'secret';
export type GroupMemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface GroupMemberUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  role: string;
}

export interface GroupMember {
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user?: GroupMemberUser;
}

export interface GroupView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: GroupPrivacy;
  category: string | null;
  tags: string[];
  coverImageUrl: string | null;
  avatarUrl: string | null;
  rules: { title: string; description: string }[];
  memberCount: number;
  postCount: number;
  eventCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: GroupMemberUser | null;
  isMember: boolean;
  memberRole: GroupMemberRole | null;
}

export interface GroupPost {
  id: string;
  groupId: string;
  content: string;
  mediaUrls: string[];
  isPinned: boolean;
  createdAt: string;
  editedAt: string | null;
  commentCount: number;
  reactionCount: number;
  myReaction: string | null;
  author: GroupMemberUser;
}

export interface GroupComment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  author: GroupMemberUser;
}

export async function listGroups(params?: {
  category?: string;
  privacy?: GroupPrivacy;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'popular' | 'trending';
  myGroups?: boolean;
}): Promise<{ groups: GroupView[]; total: number; hasMore: boolean }> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.privacy) q.set('privacy', params.privacy);
  if (params?.search) q.set('search', params.search);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  if (params?.sort) q.set('sort', params.sort);
  if (params?.myGroups) q.set('myGroups', 'true');
  const qs = q.toString();
  return apiRequest(`/api/groups${qs ? `?${qs}` : ''}`, undefined, { retryOn401: false });
}

export async function getGroup(groupId: string): Promise<{
  group: GroupView & { members: GroupMember[] };
  isMember: boolean;
  memberRole: GroupMemberRole | null;
}> {
  return apiRequest(`/api/groups/${groupId}`, undefined, { retryOn401: false });
}

export async function getMyGroups(): Promise<{
  groups: (GroupView & { memberRole: GroupMemberRole; joinedAt: string })[];
}> {
  return apiRequest('/api/groups/my');
}

export async function createGroup(body: {
  name: string;
  slug: string;
  description?: string;
  privacy?: GroupPrivacy;
  category?: string;
  tags?: string[];
  coverImageUrl?: string;
  avatarUrl?: string;
}): Promise<{ group: GroupView & { members: GroupMember[] }; isMember: boolean; memberRole: GroupMemberRole | null }> {
  return apiRequest('/api/groups', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateGroup(groupId: string, body: Partial<{
  name: string;
  description: string;
  privacy: GroupPrivacy;
  category: string;
  tags: string[];
  coverImageUrl: string | null;
  avatarUrl: string | null;
}>): Promise<{ group: GroupView }> {
  return apiRequest(`/api/groups/${groupId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteGroup(groupId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/groups/${groupId}`, { method: 'DELETE' });
}

export async function joinGroup(groupId: string): Promise<{ member: GroupMember }> {
  return apiRequest(`/api/groups/${groupId}/join`, { method: 'POST', body: '{}' });
}

export async function leaveGroup(groupId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/groups/${groupId}/leave`, { method: 'POST', body: '{}' });
}

export async function listGroupMembers(groupId: string, params?: { limit?: number; offset?: number }): Promise<{
  members: GroupMember[];
  total: number;
}> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiRequest(`/api/groups/${groupId}/members${qs ? `?${qs}` : ''}`, undefined, { retryOn401: false });
}

export async function listGroupPosts(groupId: string, params?: { limit?: number; offset?: number }): Promise<{
  posts: GroupPost[];
  total: number;
  hasMore: boolean;
}> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiRequest(`/api/groups/${groupId}/posts${qs ? `?${qs}` : ''}`, undefined, { retryOn401: false });
}

export async function createGroupPost(groupId: string, body: {
  content: string;
  mediaUrls?: string[];
  isPinned?: boolean;
}): Promise<{ post: GroupPost }> {
  return apiRequest(`/api/groups/${groupId}/posts`, { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteGroupPost(groupId: string, postId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/groups/${groupId}/posts/${postId}`, { method: 'DELETE' });
}

export async function reactToGroupPost(groupId: string, postId: string, emoji: string): Promise<{
  action: 'added' | 'removed' | 'updated';
  emoji: string;
}> {
  return apiRequest(`/api/groups/${groupId}/posts/${postId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

export async function listGroupComments(groupId: string, postId: string, params?: { limit?: number; offset?: number }): Promise<{
  comments: GroupComment[];
  total: number;
}> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  const qs = q.toString();
  return apiRequest(`/api/groups/${groupId}/posts/${postId}/comments${qs ? `?${qs}` : ''}`, undefined, { retryOn401: false });
}

export async function createGroupComment(groupId: string, postId: string, content: string): Promise<{ comment: GroupComment }> {
  return apiRequest(`/api/groups/${groupId}/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// --- Opportunities ---

export type OpportunityType = 'job' | 'cofounder' | 'investment' | 'partnership' | 'mentorship' | 'other';

export interface OpportunityItem {
  id: string;
  title: string;
  description: string | null;
  type: OpportunityType;
  company: string | null;
  location: string | null;
  isRemote: boolean;
  url: string | null;
  tags: string[];
  deadline: string | null;
  isActive: boolean;
  createdBy: {
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export async function listOpportunities(params?: {
  type?: OpportunityType;
  isRemote?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ opportunities: OpportunityItem[]; total: number; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params?.type) sp.set('type', params.type);
  if (params?.isRemote !== undefined) sp.set('isRemote', String(params.isRemote));
  if (params?.search) sp.set('search', params.search);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  const url = `/api/opportunities${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url, undefined, { retryOn401: false });
}

export async function getOpportunity(id: string): Promise<OpportunityItem> {
  return apiRequest(`/api/opportunities/${id}`, undefined, { retryOn401: false });
}

export async function createOpportunity(body: {
  title: string;
  description?: string;
  type?: OpportunityType;
  company?: string;
  location?: string;
  isRemote?: boolean;
  url?: string;
  tags?: string[];
  deadline?: string;
}): Promise<{ opportunity: OpportunityItem }> {
  return apiRequest('/api/opportunities', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateOpportunity(id: string, body: Partial<{
  title: string;
  description: string;
  type: OpportunityType;
  company: string;
  location: string;
  isRemote: boolean;
  url: string;
  tags: string[];
  deadline: string;
  isActive: boolean;
}>): Promise<{ opportunity: OpportunityItem }> {
  return apiRequest(`/api/opportunities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteOpportunity(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/opportunities/${id}`, { method: 'DELETE' });
}

// --- Learning Resources ---

export type LearningResourceType = 'article' | 'video' | 'course' | 'podcast' | 'book' | 'tool' | 'template';
export type LearningDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearningResourceItem {
  id: string;
  title: string;
  description: string | null;
  type: LearningResourceType;
  category: string | null;
  url: string;
  author: string | null;
  duration: number | null;
  difficulty: LearningDifficulty;
  tags: string[];
  imageUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
}

export async function listLearningResources(params?: {
  type?: LearningResourceType;
  category?: string;
  difficulty?: LearningDifficulty;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ resources: LearningResourceItem[]; total: number; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params?.type) sp.set('type', params.type);
  if (params?.category) sp.set('category', params.category);
  if (params?.difficulty) sp.set('difficulty', params.difficulty);
  if (params?.search) sp.set('search', params.search);
  if (params?.featured !== undefined) sp.set('featured', String(params.featured));
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  const url = `/api/learning${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url, undefined, { retryOn401: false });
}

export async function getLearningResource(id: string): Promise<LearningResourceItem> {
  return apiRequest(`/api/learning/${id}`, undefined, { retryOn401: false });
}

export async function getLearningCategories(): Promise<{ categories: string[] }> {
  return apiRequest('/api/learning/categories', undefined, { retryOn401: false });
}

export async function createLearningResource(body: {
  title: string;
  description?: string;
  type?: LearningResourceType;
  category?: string;
  url: string;
  author?: string;
  duration?: number;
  difficulty?: LearningDifficulty;
  tags?: string[];
  imageUrl?: string;
  isFeatured?: boolean;
}): Promise<{ resource: LearningResourceItem }> {
  return apiRequest('/api/learning', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// --- Marketplace Services ---

export type MarketplaceCategory = 'legal' | 'finance' | 'marketing' | 'development' | 'design' | 'consulting' | 'coaching' | 'other';

export interface MarketplaceServiceItem {
  id: string;
  title: string;
  description: string | null;
  category: MarketplaceCategory;
  providerName: string;
  providerLogo: string | null;
  pricing: string | null;
  contactUrl: string | null;
  websiteUrl: string | null;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
}

export async function listMarketplaceServices(params?: {
  category?: MarketplaceCategory;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ services: MarketplaceServiceItem[]; total: number; hasMore: boolean }> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set('category', params.category);
  if (params?.search) sp.set('search', params.search);
  if (params?.featured !== undefined) sp.set('featured', String(params.featured));
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  const url = `/api/marketplace${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url, undefined, { retryOn401: false });
}

export async function getMarketplaceService(id: string): Promise<MarketplaceServiceItem> {
  return apiRequest(`/api/marketplace/${id}`, undefined, { retryOn401: false });
}

export async function getMarketplaceCategories(): Promise<{ categories: string[] }> {
  return apiRequest('/api/marketplace/categories', undefined, { retryOn401: false });
}

export async function createMarketplaceService(body: {
  title: string;
  description?: string;
  category?: MarketplaceCategory;
  providerName: string;
  providerLogo?: string;
  pricing?: string;
  contactUrl?: string;
  websiteUrl?: string;
  tags?: string[];
  isFeatured?: boolean;
}): Promise<{ service: MarketplaceServiceItem }> {
  return apiRequest('/api/marketplace', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────
// Admin API (Extended)
// ─────────────────────────────────────────────────────────────────

export interface AdminPlatformStats {
  totalUsers: number;
  usersByRole: Record<string, number>;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  totalConnections: number;
  totalMessages: number;
  totalEvents: number;
  totalGroups: number;
  totalJobs: number;
  pendingReports: number;
}

export interface AdminAuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export async function getAdminStats(): Promise<{ stats: AdminPlatformStats }> {
  return apiRequest('/api/admin/stats');
}

export async function changeUserRole(userId: string, role: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function banUser(userId: string, reason: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function unbanUser(userId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/users/${userId}/unban`, {
    method: 'POST',
  });
}

export async function featureContent(
  type: 'event' | 'group' | 'job',
  id: string,
  featured: boolean,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/content/${type}/${id}/feature`, {
    method: 'PATCH',
    body: JSON.stringify({ featured }),
  });
}

export async function removeContent(
  type: 'event' | 'group' | 'job',
  id: string,
  reason: string,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/content/${type}/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function resolveAdminReport(
  reportId: string,
  resolution: 'resolved' | 'dismissed',
  note?: string,
  shouldBanUser?: boolean,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/reports/${reportId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution, note, banUser: shouldBanUser }),
  });
}

export async function listAdminAuditLogs(params?: {
  actorId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AdminAuditLogItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.actorId) sp.set('actorId', params.actorId);
  if (params?.action) sp.set('action', params.action);
  if (params?.entityType) sp.set('entityType', params.entityType);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/admin/audit-logs${sp.toString() ? `?${sp}` : ''}`);
}

// --- OAuth & Linked Accounts ---

export type LinkedAccountsResponse = {
  google: boolean;
  linkedin: boolean;
  hasPassword: boolean;
};

export async function getLinkedAccounts(): Promise<LinkedAccountsResponse> {
  return apiRequest('/api/auth/linked-accounts');
}

export async function unlinkGoogleAccount(): Promise<{ message: string }> {
  return apiRequest('/api/auth/google/unlink', { method: 'DELETE' });
}

export async function unlinkLinkedInAccount(): Promise<{ message: string }> {
  return apiRequest('/api/auth/linkedin/unlink', { method: 'DELETE' });
}

// --- Two-Factor Authentication ---

export type TwoFactorStatus = {
  enabled: boolean;
};

export type TwoFactorSetupResponse = {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
};

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  return apiRequest('/api/auth/2fa/status');
}

export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  return apiRequest('/api/auth/2fa/setup', { method: 'POST' });
}

export async function verifyTwoFactor(code: string): Promise<{ success: boolean }> {
  return apiRequest('/api/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function disableTwoFactor(code: string): Promise<{ success: boolean }> {
  return apiRequest('/api/auth/2fa/disable', {
    method: 'DELETE',
    body: JSON.stringify({ code }),
  });
}

export async function regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
  return apiRequest('/api/auth/2fa/backup-codes/regenerate', { method: 'POST' });
}

// --- Admin: Cohort Management ---

export type AdminCohortItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
  organizer: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    members: number;
  };
};

export type OrgProfile = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  mission: string | null;
  avatarUrl: string | null;
  website: string | null;
  email: string | null;
  location: string | null;
  industry: string | null;
  focus: string | null;
  size: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    opportunities: number;
    cohorts: number;
    members: number;
    events: number;
  };
};

export type CohortItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
  _count: {
    members: number;
  };
};

export async function listAdminCohorts(params?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ cohorts: AdminCohortItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/admin/cohorts${sp.toString() ? `?${sp}` : ''}`);
}

export async function createAdminCohort(data: {
  name: string;
  slug: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  isPublic?: boolean;
}): Promise<{ cohort: AdminCohortItem }> {
  return apiRequest('/api/admin/cohorts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminCohort(
  cohortId: string,
  data: Partial<Omit<AdminCohortItem, 'id' | 'createdAt' | 'organizer' | '_count'>>,
): Promise<{ cohort: AdminCohortItem }> {
  return apiRequest(`/api/admin/cohorts/${cohortId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminCohort(cohortId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/cohorts/${cohortId}`, { method: 'DELETE' });
}

export async function addAdminCohortMember(
  cohortId: string,
  userId: string,
  role?: string,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/cohorts/${cohortId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, role }),
  });
}

export async function removeAdminCohortMember(
  cohortId: string,
  userId: string,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/cohorts/${cohortId}/members/${userId}`, { method: 'DELETE' });
}

// ─── Admin Email Templates ────────────────────────────────────────────────────

export type AdminEmailTemplate = {
  id: string;
  name: string;
  description: string;
};

export type AdminEmailTemplatePreview = {
  subject: string;
  html: string;
};

export async function listAdminEmailTemplates(): Promise<{ templates: AdminEmailTemplate[] }> {
  return apiRequest('/api/admin/email-templates');
}

export async function getAdminEmailTemplatePreview(templateId: string): Promise<AdminEmailTemplatePreview> {
  return apiRequest(`/api/admin/email-templates/${templateId}/preview`);
}

export async function testSendAdminEmail(templateId: string, to: string): Promise<{ sent: boolean; reason?: string }> {
  return apiRequest(`/api/admin/email-templates/${templateId}/test-send`, {
    method: 'POST',
    body: JSON.stringify({ to }),
  });
}

// Organization Profile API
export async function getOrgProfile(slug: string): Promise<{ org: OrgProfile }> {
  return apiRequest(`/api/org/${slug}`);
}

export async function getOrgOpportunities(slug: string, params?: {
  limit?: number;
  offset?: number;
}): Promise<{ opportunities: OpportunityItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/org/${slug}/opportunities?${sp}`);
}

export async function getOrgCohorts(slug: string, params?: {
  limit?: number;
  offset?: number;
}): Promise<{ cohorts: CohortItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/org/${slug}/cohorts?${sp}`);
}

// ─── AI Features ─────────────────────────────────────────────────────────────

export type ProfileSuggestions = {
  headline: string | null;
  bio: string | null;
  missingElements: string[];
  improvements: string[];
  completionScore: number;
};

export type MeetingNotesSummary = {
  summary: string;
  actionItems: string[];
  keyTakeaways: string[];
  followUps: string[];
};

export async function getAIProfileSuggestions(): Promise<{ suggestions: ProfileSuggestions }> {
  return apiRequest('/api/ai/profile-suggestions', { method: 'POST' });
}

export async function summarizeMeetingNotes(notes: string): Promise<{ summary: MeetingNotesSummary }> {
  return apiRequest('/api/ai/meeting-notes/summarize', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

// ─── Matching / Recommendations ──────────────────────────────────────────────

export type MatchScore = {
  userId: string;
  score: number;
  reasons: string[];
  profile: {
    displayName: string | null;
    headline: string | null;
    avatarUrl: string | null;
    location: string | null;
  } | null;
};

export async function getWeeklyDigest(): Promise<{
  recommendations: MatchScore[];
  stats: { totalConnections: number; acceptanceRate: number; responseRate: number };
  generatedAt: string;
}> {
  return apiRequest('/api/recommendations/weekly-digest');
}

export async function getMatchScore(targetUserId: string): Promise<{
  userId: string;
  score: number;
  reasons: string[];
}> {
  return apiRequest(`/api/recommendations/score/${targetUserId}`);
}

export async function submitMatchFeedback(
  targetUserId: string,
  feedback: 'positive' | 'negative',
): Promise<{ ok: boolean }> {
  return apiRequest('/api/recommendations/feedback', {
    method: 'POST',
    body: JSON.stringify({ targetUserId, feedback }),
  });
}

export async function getMatchingStats(): Promise<{
  sentRequests: number;
  receivedRequests: number;
  totalConnections: number;
  acceptanceRate: number;
  responseRate: number;
}> {
  return apiRequest('/api/recommendations/stats');
}

// ─── Tenants / White-label ───────────────────────────────────────────────────

export type TenantBranding = {
  id: string;
  tenantId: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  ctaLabel?: string | null;
  onboardingIntroText?: string | null;
  dashboardWelcomeText?: string | null;
  supportEmail?: string | null;
  privacyPolicyUrl?: string | null;
  termsUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  isBrandingActive: boolean;
  publishedAt?: string | null;
};

export type TenantItem = {
  id: string;
  slug: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  status: 'draft' | 'active' | 'suspended';
  branding?: TenantBranding | null;
  createdAt: string;
};

export async function getTenantBySlug(slug: string): Promise<TenantItem> {
  return apiRequest(`/api/tenants/${slug}`);
}

export async function listTenants(params?: { status?: string; limit?: number }): Promise<TenantItem[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  return apiRequest(`/api/tenants${sp.toString() ? `?${sp}` : ''}`);
}

// ── SSO / Enterprise Authentication ────────────────────────────────────────

export type SSOProviderType = 'saml' | 'oidc' | 'oauth2';
export type SSOMode = 'disabled' | 'optional' | 'required';

export type SSOProviderInfo = {
  id: string;
  name: string;
  type: SSOProviderType;
  loginButtonText: string;
  loginButtonColor?: string | null;
  logoUrl?: string | null;
};

export type SSODiscoveryResult = {
  ssoAvailable: boolean;
  ssoRequired?: boolean;
  allowPasswordLogin: boolean;
  tenant?: {
    id: string;
    slug: string;
    name: string;
  };
  provider?: SSOProviderInfo | null;
};

export type TenantMembershipItem = {
  id: string;
  tenantId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    displayName?: string | null;
    logoUrl?: string | null;
  };
};

/**
 * Discover SSO configuration by email domain
 */
export async function discoverSSOByEmail(email: string): Promise<SSODiscoveryResult> {
  return apiRequest(`/api/sso/discover?email=${encodeURIComponent(email)}`);
}

/**
 * Discover SSO configuration by tenant slug
 */
export async function discoverSSOByTenant(slug: string): Promise<SSODiscoveryResult> {
  return apiRequest(`/api/sso/discover/tenant/${slug}`);
}

/**
 * Check if password login is allowed for an email
 */
export async function canUsePasswordLogin(email: string): Promise<{ allowed: boolean }> {
  return apiRequest(`/api/sso/can-use-password?email=${encodeURIComponent(email)}`);
}

/**
 * Get current user's tenant memberships
 */
export async function getUserTenantMemberships(): Promise<{ memberships: TenantMembershipItem[] }> {
  return apiRequest('/api/sso/memberships');
}

/**
 * Initiate SSO login - returns redirect URL
 */
export function getSSOLoginUrl(providerId: string, returnUrl?: string): string {
  const params = new URLSearchParams();
  if (returnUrl) params.set('returnUrl', returnUrl);
  return `${getApiBase()}/sso/login/${providerId}${params.toString() ? `?${params}` : ''}`;
}

