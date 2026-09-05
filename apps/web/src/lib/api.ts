import { resolvePreviewApi } from '@/lib/preview-api';

// Returns the API base URL evaluated at call time — not module load time.
// Dev proxy: browser uses same-origin `/api/*` (see next.config rewrites + api-origin.ts).
import { getApiOrigin } from './api-origin';

function getApiBase(): string {
  return getApiOrigin();
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
export class ApiNetworkError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ApiNetworkError';
    this.cause = cause;
  }
}

function clearLegacyTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Note: 'user' key is kept as display data, not a security concern
}

function isPreviewDemoSession() {
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

function clearSessionIndicators() {
  if (typeof document === 'undefined') return;
  if (isPreviewDemoSession()) return;
  document.cookie = 'cfb_session=; Max-Age=0; path=/; SameSite=Lax';
  document.cookie = 'cfb_csrf=; Max-Age=0; path=/; SameSite=Lax';
}

function broadcastLogout() {
  if (typeof window !== 'undefined' && !isPreviewDemoSession()) {
    window.dispatchEvent(new CustomEvent('cfb:logout'));
  }
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

const REQUEST_TIMEOUT_MS = 6_000;        // 6 s — faster failure surfacing
const NETWORK_RETRY_ATTEMPTS = 0;        // No retry inside fetchWithNetworkRetry;
                                         // React Query / callers own their own retry.
const API_CIRCUIT_BREAKER_LEVELS = [5_000, 15_000, 60_000, 300_000]; // 5s→15s→60s→5min
let circuitBreakerLevel = 0;
let apiUnavailableUntil = 0;
let apiReachable = true;

function broadcastApiReachability(reachable: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(reachable ? 'cfb:api-online' : 'cfb:api-offline'));
}

function markApiUnavailable() {
  const delay = API_CIRCUIT_BREAKER_LEVELS[circuitBreakerLevel];
  apiUnavailableUntil = Date.now() + delay;
  circuitBreakerLevel = Math.min(circuitBreakerLevel + 1, API_CIRCUIT_BREAKER_LEVELS.length - 1);
  if (apiReachable) {
    apiReachable = false;
    broadcastApiReachability(false);
  }
}

function markApiReachable() {
  apiUnavailableUntil = 0;
  circuitBreakerLevel = 0; // Reset backoff level on success
  if (!apiReachable) {
    apiReachable = true;
    broadcastApiReachability(true);
  }
}

/** True while the client-side circuit breaker is suppressing API calls. */
export function isApiCircuitOpen(): boolean {
  if (typeof window === 'undefined') return false;
  return Date.now() < apiUnavailableUntil;
}

/**
 * True when the API is believed reachable. Unlike `isApiCircuitOpen`, this does
 * NOT flip back to "reachable" merely because a backoff window elapsed — only a
 * successful request/probe (markApiReachable) can do that. This prevents the
 * re-enable→burst→fail oscillation that floods the console with connection-refused
 * errors while the backend is down.
 */
export function isApiReachable(): boolean {
  if (typeof window === 'undefined') return true;
  return apiReachable;
}

/** Lightweight liveness probe — used to recover after API restarts. */
export async function probeApiHealth(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const res = await fetchWithTimeout(`${getApiBase()}/api/health/liveness`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      markApiReachable();
      return true;
    }
  } catch {
    // fall through to re-arm backoff below
  }
  // Probe failed: re-arm/extend the circuit breaker so callers keep gating
  // their requests instead of bursting and re-flooding the network.
  markApiUnavailable();
  return false;
}

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
  if (typeof window !== 'undefined' && Date.now() < apiUnavailableUntil) {
    throw new ApiNetworkError('The API is restarting or temporarily unavailable. Please try again in a moment.');
  }

  // NETWORK_RETRY_ATTEMPTS = 0: single attempt — React Query / callers own retry logic.
  // This prevents the 2.4 s wasted retry-delay cascade on connection-refused failures.
  for (let attempt = 0; attempt <= NETWORK_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetchWithTimeout(url, init);
      markApiReachable();
      return response;
    } catch (err) {
      // TypeError = network error (connection refused, DNS failure, offline)
      // AbortError = request timed out via our AbortController
      const isNetworkErr = err instanceof TypeError || (err instanceof DOMException && err.name === 'AbortError');
      if (!isNetworkErr) throw err;
      markApiUnavailable();
      throw new ApiNetworkError('Unable to reach the API server.', err);
    }
  }
  markApiUnavailable();
  throw new ApiNetworkError('Unable to reach the API server.');
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  opts?: { retryOn401?: boolean; skipNetworkRetry?: boolean },
): Promise<T> {
  if (isPreviewDemoSession()) {
    return resolvePreviewApi(path.startsWith('/') ? path : `/${path}`, init) as T;
  }

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
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
        clearLegacyTokens();
        clearSessionIndicators();
        broadcastLogout();
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
  const result = await apiRequest<{ user: AuthUser; tokens: Tokens }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify(body) },
    { retryOn401: false },
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cfb:login'));
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
  const result = await apiRequest<{ user: AuthUser; tokens: Tokens }>(
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
  clearSessionIndicators();
  broadcastLogout();
}

/** Get current user from HttpOnly cookie session */
export async function getMe(): Promise<{ user: AuthUser }> {
  if (isPreviewDemoSession()) {
    return {
      user: {
        id: 'preview-demo-user',
        email: 'demo@cofounderbay.com',
        role: 'founder',
        emailVerified: true,
      },
    };
  }
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
  if (isPreviewDemoSession()) {
    return {
      hasCompletedOnboarding: true,
      profile: {
        id: 'preview-demo-profile',
        userId: 'preview-demo-user',
        displayName: 'Alex Demo',
        headline: 'Founder exploring CoFounderBay',
        bio: 'This is a preview profile with sample data so you can walk the product without a backend.',
        location: 'Athens, Greece',
        timezone: 'Europe/Athens',
        languages: ['English', 'Greek'],
        avatarUrl: null,
        rolePayload: { stage: 'idea', lookingFor: ['cofounder', 'mentor'] },
        visibilityRules: null,
        role: 'founder',
        email: 'demo@cofounderbay.com',
        skills: [
          { skillId: 'product', skillName: 'Product', slug: 'product', level: 'advanced' },
          { skillId: 'growth', skillName: 'Growth', slug: 'growth', level: 'intermediate' },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };
  }
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

export type AdminSkillItem = { id: string; name: string; slug: string; category: string | null; count: number };

export async function adminListSkills(params?: { q?: string; category?: string; limit?: number; offset?: number }): Promise<{ items: AdminSkillItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set('q', params.q);
  if (params?.category) sp.set('category', params.category);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/admin/skills${sp.toString() ? `?${sp}` : ''}`);
}

export async function adminCreateSkill(body: { name: string; slug: string; category?: string }): Promise<AdminSkillItem> {
  return apiRequest('/api/admin/skills', { method: 'POST', body: JSON.stringify(body) });
}

export async function adminUpdateSkill(skillId: string, body: { name?: string; slug?: string; category?: string | null }): Promise<AdminSkillItem> {
  return apiRequest(`/api/admin/skills/${skillId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function adminDeleteSkill(skillId: string): Promise<void> {
  return apiRequest(`/api/admin/skills/${skillId}`, { method: 'DELETE' });
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

// --- Feed Personalization ---

export type FeedPost = {
  id: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    headline?: string;
    role?: string;
  };
  type: 'update' | 'milestone' | 'question' | 'announcement' | 'achievement';
  content: string;
  images?: string[];
  link?: { url: string; title: string; thumbnail?: string };
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  tags?: string[];
  personalizationScore?: number;
  relevanceReasons?: string[];
};

export type FeedPreferences = {
  topics: string[];
  roles: string[];
  contentTypes: string[];
  interactionWeights: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
  timeDecayHours: number;
  diversityBoost: number;
};

export async function getPersonalizedFeed(params?: {
  limit?: number;
  offset?: number;
  contentTypes?: string[];
  topics?: string[];
  refresh?: boolean;
}): Promise<{ posts: FeedPost[]; hasMore: boolean; nextCursor?: string }> {
  const sp = new URLSearchParams();
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.offset) sp.set('offset', String(params.offset));
  if (params?.contentTypes?.length) sp.set('contentTypes', params.contentTypes.join(','));
  if (params?.topics?.length) sp.set('topics', params.topics.join(','));
  if (params?.refresh) sp.set('refresh', 'true');
  
  return apiRequest(`/api/feed/personalized?${sp}`);
}

export async function getFeedPreferences(): Promise<FeedPreferences> {
  return apiRequest('/api/feed/preferences');
}

export async function updateFeedPreferences(preferences: Partial<FeedPreferences>): Promise<FeedPreferences> {
  return apiRequest('/api/feed/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

export async function recordFeedInteraction(params: {
  postId: string;
  interaction: 'view' | 'like' | 'comment' | 'share' | 'bookmark' | 'hide';
  duration?: number; // seconds viewed
}): Promise<{ ok: boolean }> {
  return apiRequest('/api/feed/interaction', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getTrendingTopics(limit?: number): Promise<{
  topics: Array<{
    tag: string;
    posts: number;
    engagement: number;
    growth: number;
  }>;
}> {
  const q = limit ? `?limit=${limit}` : '';
  return apiRequest(`/api/feed/trending${q}`);
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

// --- Conversation Validation ---

export type ConversationValidationMode = 'casual' | 'one_party' | 'two_party';

export type ConversationValidationStateApi = {
  mode: ConversationValidationMode;
  initiatedBy: string | null;
  initiatedAt: string | null;
  acceptedBy: string | null;
  acceptedAt: string | null;
  lastValidatedAt: string | null;
  validationHash: string | null;
  transcriptAvailable: boolean;
};

export async function getConversationValidation(
  conversationId: string,
): Promise<{ validationState: ConversationValidationStateApi }> {
  return apiRequest(`/api/messages/conversations/${conversationId}/validation`);
}

export async function updateConversationValidationMode(
  conversationId: string,
  mode: ConversationValidationMode,
): Promise<{ success: boolean; validationState: ConversationValidationStateApi }> {
  return apiRequest(`/api/messages/conversations/${conversationId}/validation`, {
    method: 'PUT',
    body: JSON.stringify({ mode }),
  });
}

export async function acceptConversationValidation(
  conversationId: string,
): Promise<{ success: boolean; validationState: ConversationValidationStateApi }> {
  return apiRequest(`/api/messages/conversations/${conversationId}/validation/accept`, {
    method: 'POST',
  });
}

export async function declineConversationValidation(
  conversationId: string,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/messages/conversations/${conversationId}/validation/decline`, {
    method: 'POST',
  });
}

export async function exportConversationTranscript(
  conversationId: string,
  format: 'json' | 'txt',
): Promise<Blob> {
  const base = getApiBase();
  const res = await fetch(
    `${base}/api/messages/conversations/${conversationId}/transcript?format=${format}`,
    { method: 'GET', credentials: 'include' },
  );
  if (!res.ok) throw new Error(`Transcript export failed: ${res.status}`);
  return res.blob();
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

export async function listNotifications(params?: {
  limit?: number;
  cursor?: string | null;
  unread?: boolean;
  type?: string;
}): Promise<{
  notifications: NotificationItem[];
  nextCursor: string | null;
}> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.cursor) sp.set('cursor', params.cursor);
  if (params?.unread) sp.set('unread', 'true');
  if (params?.type && params.type !== 'all') sp.set('type', params.type);
  const url = `/api/notifications${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function getNotificationUnreadCount(): Promise<{ count: number }> {
  return apiRequest('/api/notifications/unread-count');
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  return apiRequest('/api/notifications/mark-all-read', { method: 'POST' });
}

export async function deleteNotification(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
}

export type NotificationPreferences = {
  digestFrequency: 'daily' | 'weekly' | 'never';
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest('/api/notifications/preferences');
}

export async function updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<{ ok: true }> {
  return apiRequest('/api/notifications/preferences', { method: 'PATCH', body: JSON.stringify(data) });
}

// ── Billing ────────────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused';
export type PlanType = 'free' | 'individual_premium' | 'team' | 'organization' | 'enterprise';

export type BillingPlanItem = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  planType: PlanType;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  seatLimit: number | null;
  storageGb: number;
  features: Record<string, unknown>;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  stripeProductId: string | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BillingSubscription = {
  id: string;
  userId: string | null;
  tenantId: string | null;
  planId: string;
  plan: BillingPlanItem;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  seatLimit: number | null;
  activeSeatCount: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  featureOverrides: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  periodStart: string | null;
  periodEnd: string | null;
};

export type BillingInvoice = {
  id: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  paidAt: string | null;
  billingName: string | null;
  billingEmail: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  lines: InvoiceLine[];
  createdAt: string;
};

export type BillingContact = {
  id: string;
  subscriptionId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  vatId: string | null;
  taxId: string | null;
  legalName: string | null;
};

export type SeatAllocation = {
  id: string;
  subscriptionId: string;
  userId: string;
  user: { id: string; email: string };
  isActive: boolean;
  allocatedAt: string;
  deactivatedAt: string | null;
  allocatedBy: string | null;
};

export type PromotionCodeItem = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  currency: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  validFrom: string;
  validUntil: string | null;
  applicablePlans: string[];
  firstTimeOnly: boolean;
  isActive: boolean;
  createdAt: string;
};

export type AdminBillingStats = {
  totalSubs: number;
  activeSubs: number;
  trialingSubs: number;
  pastDueSubs: number;
  totalRevenueCents: number;
  mrrCents: number;
  plans: BillingPlanItem[];
};

// ── Public plan listing ────────────────────────────────────────────────────

export async function listBillingPlans(): Promise<{ plans: BillingPlanItem[] }> {
  return apiRequest('/api/billing/plans');
}

// ── User subscription & billing ────────────────────────────────────────────

export async function getBillingSubscription(): Promise<{ subscription: BillingSubscription | null }> {
  return apiRequest('/api/billing/subscription');
}

export async function getUserInvoices(): Promise<{ invoices: BillingInvoice[] }> {
  return apiRequest('/api/billing/invoices');
}

export async function checkFeatureAccess(feature: string): Promise<{ allowed: boolean; reason?: string }> {
  return apiRequest(`/api/billing/feature/${encodeURIComponent(feature)}`);
}

export async function getBillingContact(): Promise<{ billingContact: BillingContact | null }> {
  return apiRequest('/api/billing/subscription/billing-contact');
}

export async function upsertBillingContact(data: Partial<BillingContact>): Promise<BillingContact> {
  return apiRequest('/api/billing/subscription/billing-contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

// ── Tenant billing ─────────────────────────────────────────────────────────

export async function getTenantBillingSubscription(tenantId: string): Promise<{ subscription: BillingSubscription | null }> {
  return apiRequest(`/api/billing/tenant/${tenantId}`);
}

export async function listTenantSeats(tenantId: string): Promise<{ seats: SeatAllocation[] }> {
  return apiRequest(`/api/billing/tenant/${tenantId}/seats`);
}

export async function allocateTenantSeat(tenantId: string, userId: string): Promise<SeatAllocation> {
  return apiRequest(`/api/billing/tenant/${tenantId}/seats`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function revokeTenantSeat(tenantId: string, userId: string): Promise<void> {
  return apiRequest(`/api/billing/tenant/${tenantId}/seats/${userId}`, { method: 'DELETE' });
}

export async function upsertTenantBillingContact(tenantId: string, data: Partial<BillingContact>): Promise<BillingContact> {
  return apiRequest(`/api/billing/tenant/${tenantId}/billing-contact`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Admin billing ──────────────────────────────────────────────────────────

export async function getAdminBillingStats(): Promise<AdminBillingStats> {
  return apiRequest('/api/billing/admin/stats');
}

export async function listAdminSubscriptions(params?: { status?: string; planId?: string; search?: string }): Promise<BillingSubscription[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.planId) q.set('planId', params.planId);
  if (params?.search) q.set('search', params.search);
  return apiRequest(`/api/billing/admin/subscriptions?${q.toString()}`);
}

export async function listAdminInvoices(params?: { status?: string; search?: string }): Promise<BillingInvoice[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  return apiRequest(`/api/billing/admin/invoices?${q.toString()}`);
}

export async function adminCreatePlan(data: Partial<BillingPlanItem>): Promise<BillingPlanItem> {
  return apiRequest('/api/billing/admin/plans', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminUpdatePlan(id: string, data: Partial<BillingPlanItem>): Promise<BillingPlanItem> {
  return apiRequest(`/api/billing/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function adminDeletePlan(id: string): Promise<void> {
  return apiRequest(`/api/billing/admin/plans/${id}`, { method: 'DELETE' });
}

export async function adminOverrideSubscription(id: string, data: { planId?: string; featureOverrides?: Record<string, unknown>; reason?: string }): Promise<BillingSubscription> {
  return apiRequest(`/api/billing/admin/subscriptions/${id}/override`, { method: 'POST', body: JSON.stringify(data) });
}

export async function adminExtendTrial(id: string, days: number): Promise<BillingSubscription> {
  return apiRequest(`/api/billing/admin/subscriptions/${id}/extend-trial`, { method: 'POST', body: JSON.stringify({ days }) });
}

export async function adminCancelSubscription(id: string, immediate = false): Promise<BillingSubscription> {
  return apiRequest(`/api/billing/admin/subscriptions/${id}/cancel`, { method: 'POST', body: JSON.stringify({ immediate }) });
}

export async function listCoupons(): Promise<PromotionCodeItem[]> {
  return apiRequest('/api/billing/admin/coupons');
}

export async function createCoupon(data: Partial<PromotionCodeItem>): Promise<PromotionCodeItem> {
  return apiRequest('/api/billing/admin/coupons', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteCoupon(id: string): Promise<void> {
  return apiRequest(`/api/billing/admin/coupons/${id}`, { method: 'DELETE' });
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
  type: 'connection' | 'event' | 'match' | 'message' | 'milestone' | 'achievement' | 'endorsement' | 'job' | 'system' | 'invite';
  title: string;
  author?: string;
  timeAgo: string;
  href: string;
  createdAt: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest('/api/dashboard/stats');
}

export interface UserDashboardSummary {
  pendingReceived: number;
  totalConnections: number;
  newConnectionsThisWeek: number;
  unreadMessages: number;
  unreadNotifications: number;
  upcomingEvents: number;
  activeMilestones: number;
}

export async function getDashboardMe(): Promise<UserDashboardSummary> {
  return apiRequest('/api/dashboard/me');
}

export type DashboardActivityPage = {
  items: DashboardActivityItem[];
  total: number;
  hasMore: boolean;
};

export async function getDashboardActivity(params?: { limit?: number; offset?: number }): Promise<DashboardActivityPage> {
  const sp = new URLSearchParams();
  if (params?.limit  != null) sp.set('limit',  String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  const url = `/api/dashboard/activity${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

// --- Venture Readiness Score ---

export interface VRSDimension {
  key: string;
  label: string;
  score: number;
  weight: number;
  href: string;
}

export interface VentureReadiness {
  overall: number;
  dimensions: VRSDimension[];
  lowestDimension: VRSDimension;
  signals: {
    boardCount: number;
    totalNodes: number;
    docCount: number;
    connectionCount: number;
    sessionCount: number;
  };
}

export async function getVentureReadiness(): Promise<VentureReadiness> {
  return apiRequest('/api/dashboard/venture-readiness');
}

export interface GraphMeResponse {
  me: {
    id: string;
    displayName: string | null;
    headline: string | null;
    avatarUrl: string | null;
    primaryRole: string | null;
    organizations: Array<{ id: string; name: string; type: string; role: string }>;
    tenants: Array<{ id: string; name: string; slug: string; role: string }>;
  };
  unreadMessages: number;
  pendingConnections: number;
  unreadNotifications: number;
  readiness: VentureReadiness | null;
}

/** Single-call summary used by the get_graph AI tool and available for any
 * surface that needs "what does this user see right now" without stitching
 * together profile + connections + messages + readiness itself. */
export async function getGraphMe(): Promise<GraphMeResponse> {
  return apiRequest('/api/graph/me');
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

export interface AnalyticsOverview {
  metrics: UserMetrics;
  profileViews: AnalyticsProfileView[];
  engagement: AnalyticsEngagement;
  topContent: AnalyticsTopContent[];
  weeklySummary: WeeklySummary;
}

export async function getAnalyticsOverview(
  period = '7d',
  topContentLimit = 5,
): Promise<AnalyticsOverview> {
  const params = new URLSearchParams({
    period,
    topContentLimit: String(topContentLimit),
  });

  return apiRequest(`/api/analytics/overview?${params.toString()}`);
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

// --- Mentorship System (comprehensive) ---

export type MentorProfileItem = {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  industries: string[];
  skills: string[];
  startupStages: string[];
  yearsExperience: number | null;
  availabilityStatus: 'available' | 'limited' | 'unavailable';
  isFree: boolean;
  hourlyRate: number | null;
  currency: string | null;
  sessionCount: number;
  rating: number | null;
  reviewCount: number;
};

export type MentorRequestItem = {
  id: string;
  requesterId: string;
  mentorId: string;
  message: string;
  goals: string | null;
  focusAreas: string[];
  preferredFormat: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    role: string;
  };
  mentor: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
  };
};

export type MentorshipRelationshipItem = {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  goals: Record<string, unknown> | null;
  focusAreas: string[];
  startedAt: string;
  completedAt: string | null;
  nextSessionAt: string | null;
  totalSessions: number;
  mentor: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
  };
  mentee: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    role: string;
  };
};

export type MentorshipSessionItem = {
  id: string;
  relationshipId: string;
  title: string | null;
  description: string | null;
  scheduledAt: string;
  duration: number;
  timezone: string | null;
  meetingType: 'video' | 'in_person' | 'chat' | null;
  meetingUrl: string | null;
  meetingLocation: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  agenda: string | null;
  mentorNotes: string | null;
  menteeNotes: string | null;
  actionItems: Record<string, unknown>[] | null;
  mentorRating: number | null;
  menteeRating: number | null;
  createdAt: string;
};

export type MentorDashboardStats = {
  activeMentees: number;
  pendingRequests: number;
  completedMentorships: number;
  upcomingSessions: number;
  totalSessions: number;
  averageRating: number | null;
  recentActivity: Array<{
    type: 'request' | 'session' | 'message';
    description: string;
    timestamp: string;
  }>;
};

export async function discoverMentors(params?: {
  industries?: string[];
  skills?: string[];
  startupStages?: string[];
  availabilityStatus?: string;
  isFree?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ mentors: MentorProfileItem[]; total: number; page: number; totalPages: number }> {
  const sp = new URLSearchParams();
  if (params?.industries?.length) sp.set('industries', params.industries.join(','));
  if (params?.skills?.length) sp.set('skills', params.skills.join(','));
  if (params?.startupStages?.length) sp.set('startupStages', params.startupStages.join(','));
  if (params?.availabilityStatus) sp.set('availabilityStatus', params.availabilityStatus);
  if (params?.isFree !== undefined) sp.set('isFree', String(params.isFree));
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  return apiRequest(`/api/mentorship/mentors${sp.toString() ? `?${sp}` : ''}`);
}

export async function getMentorProfile(userId: string): Promise<{ mentor: MentorProfileItem }> {
  return apiRequest(`/api/mentorship/mentors/${userId}`);
}

export async function sendMentorRequest(body: {
  mentorId: string;
  message: string;
  goals?: string;
  focusAreas?: string[];
  preferredFormat?: string;
  workspaceId?: string;
  programId?: string;
}): Promise<{ request: MentorRequestItem }> {
  return apiRequest('/api/mentorship/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMySentMentorRequests(): Promise<{ requests: MentorRequestItem[] }> {
  return apiRequest('/api/mentorship/requests/sent');
}

export async function getMyReceivedMentorRequests(): Promise<{ requests: MentorRequestItem[] }> {
  return apiRequest('/api/mentorship/requests/received');
}

export async function respondToMentorRequest(
  requestId: string,
  body: { accept: boolean; responseMessage?: string },
): Promise<{ request: MentorRequestItem; relationship?: MentorshipRelationshipItem }> {
  return apiRequest(`/api/mentorship/requests/${requestId}/respond`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMyMentorships(
  role: 'mentor' | 'mentee' = 'mentee',
): Promise<{ relationships: MentorshipRelationshipItem[] }> {
  return apiRequest(`/api/mentorship/relationships?role=${role}`);
}

export async function getMentorshipById(id: string): Promise<{ relationship: MentorshipRelationshipItem }> {
  return apiRequest(`/api/mentorship/relationships/${id}`);
}

export async function updateMentorship(
  id: string,
  body: {
    status?: string;
    goals?: Record<string, unknown>;
    focusAreas?: string[];
    mentorNotes?: string;
    menteeNotes?: string;
    nextSessionAt?: string;
  },
): Promise<{ relationship: MentorshipRelationshipItem }> {
  return apiRequest(`/api/mentorship/relationships/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function scheduleMentorshipSession(
  relationshipId: string,
  body: {
    title?: string;
    description?: string;
    scheduledAt: string;
    duration?: number;
    timezone?: string;
    meetingType?: 'video' | 'in_person' | 'chat';
    meetingUrl?: string;
    meetingLocation?: string;
    agenda?: string;
  },
): Promise<{ session: MentorshipSessionItem }> {
  return apiRequest(`/api/mentorship/relationships/${relationshipId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMentorshipSessions(
  relationshipId: string,
): Promise<{ sessions: MentorshipSessionItem[] }> {
  return apiRequest(`/api/mentorship/relationships/${relationshipId}/sessions`);
}

export async function updateMentorshipSession(
  sessionId: string,
  body: {
    title?: string;
    description?: string;
    scheduledAt?: string;
    duration?: number;
    meetingType?: string;
    meetingUrl?: string;
    status?: string;
    agenda?: string;
    mentorNotes?: string;
    menteeNotes?: string;
    actionItems?: Record<string, unknown>[];
    mentorRating?: number;
    menteeRating?: number;
    mentorFeedback?: string;
    menteeFeedback?: string;
  },
): Promise<{ session: MentorshipSessionItem }> {
  return apiRequest(`/api/mentorship/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function getUpcomingMentorshipSessions(): Promise<{ sessions: MentorshipSessionItem[] }> {
  return apiRequest('/api/mentorship/sessions/upcoming');
}

export async function getMentorDashboardStats(): Promise<MentorDashboardStats> {
  return apiRequest('/api/mentorship/dashboard/mentor');
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

export async function blockUser(userId: string): Promise<{ connection: ConnectionRequestItem }> {
  return apiRequest(`/api/connections/block/${userId}`, {
    method: 'POST',
  });
}

export async function getConnectionStatus(userId: string): Promise<{
  status: ConnectionStatus | null;
  connectionId: string | null;
  direction: 'sent' | 'received' | null;
}> {
  return apiRequest(`/api/connections/status/${userId}`);
}

// --- Invites / Referrals ---

export type InviteItem = {
  id: string;
  email: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
};

export type InviteStats = {
  total: number;
  pending: number;
  accepted: number;
  remaining: number;
};

export async function listInvites(params?: {
  limit?: number;
  status?: string;
}): Promise<{ invites: InviteItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.status) sp.set('status', params.status);
  return apiRequest(`/api/invites${sp.toString() ? `?${sp}` : ''}`);
}

export async function getInviteStats(): Promise<{ stats: InviteStats }> {
  return apiRequest('/api/invites/stats');
}

export async function createInvite(body: {
  email: string;
  message?: string;
}): Promise<{ invite: InviteItem }> {
  return apiRequest('/api/invites', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cancelInvite(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/invites/${id}`, { method: 'DELETE' });
}

// --- Endorsements ---

export type EndorsementItem = {
  id: string;
  fromUserId: string;
  fromUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    headline: string | null;
  };
  toUserId: string;
  skill: string | null;
  content: string;
  relationship: string | null;
  isPublic: boolean;
  isApproved: boolean;
  createdAt: string;
};

export type EndorsementStats = {
  total: number;
  pending: number;
  given: number;
};

export async function getEndorsementsForUser(
  userId: string,
  options?: { includeUnapproved?: boolean },
): Promise<{ endorsements: EndorsementItem[] }> {
  const sp = new URLSearchParams();
  if (options?.includeUnapproved) sp.set('includeUnapproved', 'true');
  return apiRequest(`/api/endorsements/user/${userId}${sp.toString() ? `?${sp}` : ''}`);
}

export async function getPendingEndorsements(): Promise<{ endorsements: EndorsementItem[] }> {
  return apiRequest('/api/endorsements/pending');
}

export async function getEndorsementStats(): Promise<{ stats: EndorsementStats }> {
  return apiRequest('/api/endorsements/stats');
}

export async function createEndorsement(body: {
  toUserId: string;
  content: string;
  skill?: string;
  relationship?: string;
}): Promise<{ endorsement: EndorsementItem }> {
  return apiRequest('/api/endorsements', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function approveEndorsement(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/endorsements/${id}/approve`, { method: 'POST' });
}

export async function declineEndorsement(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/endorsements/${id}/decline`, { method: 'POST' });
}

export async function deleteEndorsement(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/endorsements/${id}`, { method: 'DELETE' });
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
export interface OrgMembershipItem {
  id: string;
  organizationId: string;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
  };
}

export async function getUserOrganizations(): Promise<{ memberships: OrgMembershipItem[] }> {
  return apiRequest('/api/org/my-memberships');
}

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

export type OrgMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  location: string | null;
  role: string;
  cohortName: string;
  joinedAt: string;
};

export async function getOrgMembers(slug: string, params?: {
  limit?: number;
  offset?: number;
}): Promise<{ members: OrgMember[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/org/${slug}/members?${sp}`);
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
  // Colors
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundStyle?: string | null;
  // Typography
  headingFont?: string | null;
  bodyFont?: string | null;
  // Media
  logoUrl?: string | null;
  faviconUrl?: string | null;
  heroImageUrl?: string | null;
  websiteUrl?: string | null;
  // Content
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  aboutText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  onboardingIntroText?: string | null;
  dashboardWelcomeText?: string | null;
  // Custom labels
  communityNaming?: string | null;
  roleLabels?: Record<string, string> | null;
  // Contact & legal
  supportEmail?: string | null;
  privacyPolicyUrl?: string | null;
  termsUrl?: string | null;
  cookiePolicyUrl?: string | null;
  // Social
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  websiteFooterUrl?: string | null;
  // Email
  emailSignature?: string | null;
  emailLogoUrl?: string | null;
  emailFooterText?: string | null;
  emailFromName?: string | null;
  isBrandingActive: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};

export type TenantItem = {
  id: string;
  slug: string;
  name: string;
  displayName?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  aboutText?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  status: 'draft' | 'active' | 'suspended';
  branding?: TenantBranding | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantMemberItem = {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  provisionedViaSSO: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    profile?: { displayName: string; avatarUrl?: string | null; headline?: string | null } | null;
  };
};

export async function getTenantBySlug(slug: string): Promise<TenantItem> {
  return apiRequest(`/api/tenants/by-slug/${slug}`);
}

export async function getTenantById(id: string): Promise<TenantItem> {
  return apiRequest(`/api/tenants/${id}`);
}

export async function listTenants(params?: { status?: string; limit?: number }): Promise<TenantItem[]> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  return apiRequest(`/api/tenants${sp.toString() ? `?${sp}` : ''}`);
}

export async function createTenant(data: {
  slug: string;
  name: string;
  displayName?: string;
  shortDescription?: string;
  description?: string;
  aboutText?: string;
  website?: string;
  logoUrl?: string;
  faviconUrl?: string;
}): Promise<TenantItem> {
  return apiRequest('/api/tenants', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTenant(id: string, data: Partial<{
  name: string;
  slug: string;
  displayName: string;
  shortDescription: string;
  description: string;
  aboutText: string;
  website: string;
  logoUrl: string;
  faviconUrl: string;
  status: 'draft' | 'active' | 'suspended';
}>): Promise<TenantItem> {
  return apiRequest(`/api/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteTenant(id: string): Promise<void> {
  return apiRequest(`/api/tenants/${id}`, { method: 'DELETE' });
}

export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  return apiRequest(`/api/tenants/${tenantId}/branding`);
}

export async function updateTenantBranding(tenantId: string, data: Partial<Omit<TenantBranding, 'id' | 'tenantId' | 'publishedAt' | 'updatedAt'>>): Promise<TenantBranding> {
  return apiRequest(`/api/tenants/${tenantId}/branding`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function publishTenantBranding(tenantId: string): Promise<TenantBranding> {
  return apiRequest(`/api/tenants/${tenantId}/branding/publish`, { method: 'POST' });
}

export async function unpublishTenantBranding(tenantId: string): Promise<TenantBranding> {
  return apiRequest(`/api/tenants/${tenantId}/branding/unpublish`, { method: 'POST' });
}

export async function getTenantMembers(tenantId: string, params?: { limit?: number; offset?: number }): Promise<TenantMemberItem[]> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/tenants/${tenantId}/members${sp.toString() ? `?${sp}` : ''}`);
}

export async function addTenantMember(tenantId: string, userId: string, role?: string): Promise<TenantMemberItem> {
  return apiRequest(`/api/tenants/${tenantId}/members`, { method: 'POST', body: JSON.stringify({ userId, role }) });
}

export async function updateTenantMember(tenantId: string, userId: string, data: { role?: string; isActive?: boolean }): Promise<TenantMemberItem> {
  return apiRequest(`/api/tenants/${tenantId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function removeTenantMember(tenantId: string, userId: string): Promise<void> {
  return apiRequest(`/api/tenants/${tenantId}/members/${userId}`, { method: 'DELETE' });
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

export type IdentityProviderItem = {
  id: string;
  tenantId: string;
  providerType: SSOProviderType;
  providerName: string;
  isActive: boolean;
  oidcIssuerUrl?: string | null;
  oidcClientId?: string | null;
  oidcScopes?: string | null;
  samlEntryPoint?: string | null;
  samlIssuer?: string | null;
  samlMetadataUrl?: string | null;
  loginButtonText?: string | null;
  loginButtonColor?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantSSOConfig = {
  id: string;
  tenantId: string;
  identityProviderId?: string | null;
  ssoMode: SSOMode;
  allowedDomains: string[];
  enforceEmailDomain: boolean;
  autoProvisionEnabled: boolean;
  defaultRole: string;
  autoAssignToTenant: boolean;
  roleMappingRules?: Array<{ claim: string; value: string; role: string }> | null;
  postLoginRedirect?: string | null;
  requireProfileCompletion: boolean;
  sessionDurationHours: number;
  allowPasswordFallback: boolean;
  identityProvider?: IdentityProviderItem | null;
};

export type SSOAuthEvent = {
  id: string;
  identityProviderId: string;
  userId?: string | null;
  eventType: string;
  email?: string | null;
  externalId?: string | null;
  ipAddress?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  identityProvider: { id: string; providerName: string; tenantId: string; tenant: { name: string; slug: string } };
  user?: { id: string; email: string; profile?: { displayName: string } | null } | null;
};

export type SSODiscoveryResult = {
  ssoAvailable: boolean;
  ssoRequired?: boolean;
  allowPasswordLogin: boolean;
  tenant?: { id: string; slug: string; name: string };
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

/** Discover SSO by email domain */
export async function discoverSSOByEmail(email: string): Promise<SSODiscoveryResult> {
  return apiRequest(`/api/sso/discover?email=${encodeURIComponent(email)}`);
}

/** Discover SSO by tenant slug */
export async function discoverSSOByTenant(slug: string): Promise<SSODiscoveryResult> {
  return apiRequest(`/api/sso/discover/tenant/${slug}`);
}

/** Check if password login is allowed for an email */
export async function canUsePasswordLogin(email: string): Promise<{ allowed: boolean }> {
  return apiRequest(`/api/sso/can-use-password?email=${encodeURIComponent(email)}`);
}

/** Get current user's tenant memberships */
export async function getUserTenantMemberships(): Promise<{ memberships: TenantMembershipItem[] }> {
  return apiRequest('/api/sso/memberships');
}

/** Initiate SSO login — returns redirect URL */
export function getSSOLoginUrl(providerId: string, returnUrl?: string): string {
  const params = new URLSearchParams();
  if (returnUrl) params.set('returnUrl', returnUrl);
  return `${getApiBase()}/api/sso/login/${providerId}${params.toString() ? `?${params}` : ''}`;
}

/** Get SSO platform stats (admin) */
export async function getSSOStats(): Promise<{ totalProviders: number; activeProviders: number; recentEvents: number; successEvents: number }> {
  return apiRequest('/api/sso/admin/stats');
}

/** Get SSO auth events (admin audit) */
export async function getSSOAuthEvents(params?: { tenantId?: string; eventType?: string; limit?: number; offset?: number }): Promise<SSOAuthEvent[]> {
  const sp = new URLSearchParams();
  if (params?.tenantId) sp.set('tenantId', params.tenantId);
  if (params?.eventType) sp.set('eventType', params.eventType);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  return apiRequest(`/api/sso/admin/events${sp.toString() ? `?${sp}` : ''}`);
}

/** List identity providers for a tenant (admin) */
export async function listSSOProviders(tenantId: string): Promise<IdentityProviderItem[]> {
  return apiRequest(`/api/sso/tenants/${tenantId}/providers`);
}

/** Create identity provider for a tenant (admin) */
export async function createSSOProvider(tenantId: string, data: {
  providerType: SSOProviderType;
  providerName: string;
  isActive?: boolean;
  oidcIssuerUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcScopes?: string;
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  samlMetadataUrl?: string;
  loginButtonText?: string;
  loginButtonColor?: string;
  logoUrl?: string;
}): Promise<IdentityProviderItem> {
  return apiRequest(`/api/sso/tenants/${tenantId}/providers`, { method: 'POST', body: JSON.stringify(data) });
}

/** Update identity provider (admin) */
export async function updateSSOProvider(providerId: string, data: Partial<Omit<IdentityProviderItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<IdentityProviderItem> {
  return apiRequest(`/api/sso/providers/${providerId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/** Delete identity provider (admin) */
export async function deleteSSOProvider(providerId: string): Promise<void> {
  return apiRequest(`/api/sso/providers/${providerId}`, { method: 'DELETE' });
}

/** Get SSO config for a tenant (admin) */
export async function getTenantSSOConfig(tenantId: string): Promise<TenantSSOConfig | null> {
  return apiRequest(`/api/sso/tenants/${tenantId}/config`);
}

/** Upsert SSO config for a tenant (admin) */
export async function upsertTenantSSOConfig(tenantId: string, data: {
  ssoMode: SSOMode;
  providerId?: string;
  allowedDomains?: string[];
  enforceEmailDomain?: boolean;
  autoProvisionEnabled?: boolean;
  defaultRole?: string;
  allowPasswordFallback?: boolean;
  postLoginRedirect?: string;
  sessionDurationHours?: number;
}): Promise<TenantSSOConfig> {
  return apiRequest(`/api/sso/tenants/${tenantId}/config`, { method: 'POST', body: JSON.stringify(data) });
}

// ── SSO Email Domain Mappings (email → SSO discovery) ─────────────────────────

export type SSODomainMapping = {
  id: string;
  domain: string;
  tenantId: string;
  isVerified: boolean;
  autoRedirectToSSO: boolean;
  verifiedAt?: string | null;
  createdAt: string;
};

export async function listSSODomainMappings(tenantId: string): Promise<SSODomainMapping[]> {
  return apiRequest(`/api/sso/tenants/${tenantId}/domains`);
}

export async function createSSODomainMapping(tenantId: string, domain: string, autoRedirectToSSO = false): Promise<SSODomainMapping> {
  return apiRequest(`/api/sso/tenants/${tenantId}/domains`, { method: 'POST', body: JSON.stringify({ domain, autoRedirectToSSO }) });
}

export async function deleteSSODomainMapping(id: string): Promise<void> {
  return apiRequest(`/api/sso/domains/${id}`, { method: 'DELETE' });
}

export async function verifySSODomainMapping(id: string): Promise<SSODomainMapping> {
  return apiRequest(`/api/sso/domains/${id}/verify`, { method: 'POST' });
}

// ─── Domain Mapping ───────────────────────────────────────────────────────────

export type TenantDomainType = 'subdomain' | 'custom';
export type DomainVerificationStatus = 'pending' | 'verified' | 'failed' | 'expired';

export type TenantDomainItem = {
  id: string;
  tenantId: string;
  domainType: TenantDomainType;
  domainName: string;
  isPrimary: boolean;
  isActive: boolean;
  sslStatus?: string | null;
  sslExpiresAt?: string | null;
  verificationStatus: DomainVerificationStatus;
  verificationToken?: string | null;
  verificationMethod?: string | null;
  dnsInstructions?: string | null;
  verifiedAt?: string | null;
  lastVerificationCheck?: string | null;
  redirectBehavior?: string | null;
  customLandingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DomainResolutionResult = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    displayName?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    status: string;
  } | null;
  branding?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    isBrandingActive: boolean;
  } | null;
  domain?: { id: string; domainType: TenantDomainType; isPrimary: boolean } | null;
};

export type DnsInstructions = {
  verification: { type: string; name: string; value: string | null; ttl: number };
  cname: { type: string; name: string; value: string; ttl: number };
  instructions: string[];
};

/** Public: resolve tenant from a hostname */
export async function resolveTenantFromDomain(domain: string): Promise<DomainResolutionResult> {
  return apiRequest(`/api/tenants/resolve-domain?domain=${encodeURIComponent(domain)}`);
}

/** Admin: list domains for a tenant */
export async function listTenantDomains(tenantId: string): Promise<{ domains: TenantDomainItem[] }> {
  return apiRequest(`/api/tenants/${tenantId}/domains`);
}

/** Admin: add subdomain */
export async function addTenantSubdomain(tenantId: string, subdomain: string): Promise<{ domain: TenantDomainItem }> {
  return apiRequest(`/api/tenants/${tenantId}/domains/subdomain`, { method: 'POST', body: JSON.stringify({ subdomain }) });
}

/** Admin: add custom domain */
export async function addTenantCustomDomain(tenantId: string, domainName: string): Promise<{ domain: TenantDomainItem }> {
  return apiRequest(`/api/tenants/${tenantId}/domains/custom`, { method: 'POST', body: JSON.stringify({ domainName }) });
}

/** Admin: get DNS setup instructions */
export async function getDomainDnsInstructions(tenantId: string, domainId: string): Promise<DnsInstructions> {
  return apiRequest(`/api/tenants/${tenantId}/domains/${domainId}/dns-instructions`);
}

/** Admin: trigger DNS verification check */
export async function verifyTenantDomain(tenantId: string, domainId: string): Promise<{ verified: boolean; message: string }> {
  return apiRequest(`/api/tenants/${tenantId}/domains/${domainId}/verify`, { method: 'POST' });
}

/** Admin: set primary domain */
export async function setTenantPrimaryDomain(tenantId: string, domainId: string): Promise<{ domain: TenantDomainItem }> {
  return apiRequest(`/api/tenants/${tenantId}/domains/${domainId}/set-primary`, { method: 'POST' });
}

/** Admin: activate or deactivate domain */
export async function toggleTenantDomainActive(tenantId: string, domainId: string, isActive: boolean): Promise<{ domain: TenantDomainItem }> {
  return apiRequest(`/api/tenants/${tenantId}/domains/${domainId}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
}

/** Admin: delete domain */
export async function deleteTenantDomain(tenantId: string, domainId: string): Promise<void> {
  return apiRequest(`/api/tenants/${tenantId}/domains/${domainId}`, { method: 'DELETE' });
}

// ── Automation Framework ───────────────────────────────────────────────────

export type AutomationStatus = 'draft' | 'active' | 'paused' | 'archived';
export type AutomationExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

export type AutomationRuleItem = {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  triggerType: string;
  conditionDef: unknown | null;
  actionDef: unknown;
  delaySeconds: number;
  scheduleExpression: string | null;
  status: AutomationStatus;
  priority: number;
  executionCount: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { executions: number };
};

export type AutomationExecutionItem = {
  id: string;
  ruleId: string;
  targetUserId: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
  status: AutomationExecutionStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  result: unknown | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  _count?: { logs: number };
};

export type AutomationLogItem = {
  id: string;
  executionId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context: unknown | null;
  createdAt: string;
};

export type TenantAutomationConfigItem = {
  id: string;
  tenantId: string;
  automationsEnabled: boolean;
  maxEmailsPerUserPerDay: number;
  maxNotificationsPerDay: number;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string;
  onboardingAutomation: boolean;
  matchingAutomation: boolean;
  mentorshipAutomation: boolean;
  communityAutomation: boolean;
  billingAutomation: boolean;
  reEngagementAutomation: boolean;
};

export type NotificationTemplateItem = {
  id: string;
  tenantId: string | null;
  key: string;
  name: string;
  type: string;
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  variables: unknown | null;
  isActive: boolean;
};

/** Admin: list automation rules */
export async function listAutomationRules(params?: { tenantId?: string; status?: string; limit?: number }): Promise<{ rules: AutomationRuleItem[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.tenantId) q.set('tenantId', params.tenantId);
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  return apiRequest(`/api/automation/rules${q.toString() ? `?${q}` : ''}`);
}

/** Admin: get automation rule */
export async function getAutomationRule(id: string): Promise<AutomationRuleItem> {
  return apiRequest(`/api/automation/rules/${id}`);
}

/** Admin: create automation rule */
export async function createAutomationRule(data: Partial<AutomationRuleItem>): Promise<AutomationRuleItem> {
  return apiRequest('/api/automation/rules', { method: 'POST', body: JSON.stringify(data) });
}

/** Admin: update automation rule */
export async function updateAutomationRule(id: string, data: Partial<AutomationRuleItem>): Promise<AutomationRuleItem> {
  return apiRequest(`/api/automation/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/** Admin: set rule status (active/paused/archived) */
export async function setAutomationRuleStatus(id: string, status: AutomationStatus): Promise<AutomationRuleItem> {
  return apiRequest(`/api/automation/rules/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

/** Admin: delete automation rule */
export async function deleteAutomationRule(id: string): Promise<void> {
  return apiRequest(`/api/automation/rules/${id}`, { method: 'DELETE' });
}

/** Admin: manually trigger an automation rule */
export async function triggerAutomationRule(id: string): Promise<{ queued: boolean }> {
  return apiRequest(`/api/automation/rules/${id}/trigger`, { method: 'POST' });
}

/** Admin: list automation executions */
export async function listAutomationExecutions(params?: { ruleId?: string; status?: string; limit?: number }): Promise<AutomationExecutionItem[]> {
  const q = new URLSearchParams();
  if (params?.ruleId) q.set('ruleId', params.ruleId);
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  return apiRequest(`/api/automation/executions${q.toString() ? `?${q}` : ''}`);
}

/** Admin: get execution logs */
export async function getAutomationExecutionLogs(executionId: string): Promise<AutomationLogItem[]> {
  return apiRequest(`/api/automation/executions/${executionId}/logs`);
}

/** Admin: get tenant automation config */
export async function getTenantAutomationConfig(tenantId: string): Promise<TenantAutomationConfigItem | null> {
  return apiRequest(`/api/automation/config/${tenantId}`);
}

/** Admin: upsert tenant automation config */
export async function upsertTenantAutomationConfig(tenantId: string, data: Partial<TenantAutomationConfigItem>): Promise<TenantAutomationConfigItem> {
  return apiRequest(`/api/automation/config/${tenantId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/** Admin: list notification templates */
export async function listNotificationTemplates(tenantId?: string): Promise<NotificationTemplateItem[]> {
  const q = tenantId ? `?tenantId=${tenantId}` : '';
  return apiRequest(`/api/automation/templates${q}`);
}

// ── AI Matching ────────────────────────────────────────────────────────────

export type MatchExplanationItem = {
  dimension: string;
  label: string;
  weight: number;
  score: number;
};

export type MatchSuggestion = {
  userId: string;
  score: number;
  confidence: number;
  reasons: string[];
  explanation: MatchExplanationItem[];
  profile: {
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    location: string | null;
    skills: { skillId: string; skill?: { name: string } }[];
  } | null;
};

export type MatchFeedbackType = 'accepted' | 'declined' | 'ignored' | 'not_relevant' | 'not_now' | 'better_fit_wanted';

/** Get AI-powered match recommendations */
export async function getAIRecommendations(limit?: number): Promise<{ suggestions: MatchSuggestion[] }> {
  const q = limit ? `?limit=${limit}` : '';
  return apiRequest(`/api/recommendations${q}`);
}

/** Record rich match feedback (not relevant, not now, etc.) */
export async function recordMatchFeedback(params: {
  targetUserId: string;
  feedback: MatchFeedbackType;
  connectionStarted?: boolean;
  conversationStarted?: boolean;
}): Promise<{ ok: boolean }> {
  return apiRequest('/api/recommendations/feedback', { method: 'POST', body: JSON.stringify(params) });
}

/** Record a behavioral signal (e.g. profile_view, match_click) */
export async function recordBehavioralSignal(params: {
  signalType: string;
  targetId?: string;
  targetType?: string;
  value?: number;
}): Promise<{ ok: boolean }> {
  return apiRequest('/api/recommendations/signal', { method: 'POST', body: JSON.stringify(params) });
}

export interface MatchVsBreakdownItem {
  key: string;
  label: string;
  score: number;
  color: string;
}

export interface MatchVsStrength {
  icon: string;
  label: string;
}

export interface MatchVsFrictionPoint {
  icon: string;
  title: string;
  description: string;
}

export interface MatchVsWorkStyle {
  axes: string[];
  source: number[];
  target: number[];
}

export interface MatchVsProfile {
  id: string;
  role: string;
  displayName: string;
  headline?: string;
  avatarUrl?: string;
  location?: string;
}

export interface MatchVsResult {
  overall: { score: number; confidence: number };
  breakdown: MatchVsBreakdownItem[];
  badges: string[];
  sharedStrengths: MatchVsStrength[];
  frictionPoints: MatchVsFrictionPoint[];
  workStyle: MatchVsWorkStyle;
  reasons: string[];
  sourceProfile: MatchVsProfile;
  targetProfile: MatchVsProfile;
}

/** Get detailed two-user compatibility breakdown for the match detail page */
export async function getMatchVs(targetUserId: string): Promise<MatchVsResult> {
  return apiRequest(`/api/recommendations/vs/${targetUserId}`);
}

/** Get AI matching admin stats */
export async function getMatchingAdminStats(): Promise<{
  totalMatches: number;
  activeModel: { version: string; weights: Record<string, number> } | null;
  runningExperiments: number;
  outcomes: { feedback: string; _count: number }[];
}> {
  return apiRequest('/api/recommendations/admin/stats');
}

// --- Password Reset ---

export async function resetPassword(token: string, password: string): Promise<{ ok: boolean; message: string }> {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  }, { retryOn401: false });
}

// --- Milestones ---

export type MilestoneStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type MilestonePriority = 'low' | 'medium' | 'high';

export interface MilestoneCollaborator {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Milestone {
  id: string;
  ownerId: string;
  collaboratorId: string | null;
  collaborator: MilestoneCollaborator | null;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  priority: MilestonePriority;
  category: string | null;
  dueDate: string | null;
  completedAt: string | null;
  progress: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneSummary {
  counts: Record<MilestoneStatus, number>;
  total: number;
  overdue: number;
  dueSoon: number;
  completionRate: number;
}

export async function listMilestones(params?: {
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  category?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<{ milestones: Milestone[]; nextCursor: string | null; total: number }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.priority) sp.set('priority', params.priority);
  if (params?.category) sp.set('category', params.category);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.cursor) sp.set('cursor', params.cursor);
  return apiRequest(`/api/milestones${sp.toString() ? `?${sp}` : ''}`);
}

export async function getMilestoneSummary(): Promise<MilestoneSummary> {
  return apiRequest('/api/milestones/summary');
}

export async function getMilestone(id: string): Promise<Milestone> {
  return apiRequest(`/api/milestones/${id}`);
}

export async function createMilestone(data: {
  title: string;
  description?: string;
  status?: MilestoneStatus;
  priority?: MilestonePriority;
  category?: string;
  dueDate?: string;
  progress?: number;
  notes?: string;
  collaboratorId?: string;
}): Promise<Milestone> {
  return apiRequest('/api/milestones', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMilestone(id: string, data: Partial<{
  title: string;
  description: string;
  status: MilestoneStatus;
  priority: MilestonePriority;
  category: string;
  dueDate: string | null;
  progress: number;
  notes: string;
  collaboratorId: string | null;
}>): Promise<Milestone> {
  return apiRequest(`/api/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteMilestone(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/milestones/${id}`, { method: 'DELETE' });
}

// --- Shortlist / Saved Profiles ---

export interface ShortlistProfile {
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  role: string | null;
  location: string | null;
  skills: string[];
}

export interface ShortlistItem {
  id: string;
  userId: string;
  note: string | null;
  savedAt: string;
  profile: ShortlistProfile | null;
}

export async function listShortlist(params?: {
  limit?: number;
  cursor?: string | null;
}): Promise<{ items: ShortlistItem[]; nextCursor: string | null }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.cursor) sp.set('cursor', params.cursor);
  return apiRequest(`/api/shortlist${sp.toString() ? `?${sp}` : ''}`);
}

export async function getShortlistIds(): Promise<{ ids: string[] }> {
  return apiRequest('/api/shortlist/ids');
}

export async function saveToShortlist(userId: string, note?: string): Promise<{ ok: boolean; saved: boolean; id: string }> {
  return apiRequest('/api/shortlist', { method: 'POST', body: JSON.stringify({ userId, note }) });
}

export async function removeFromShortlist(userId: string): Promise<{ ok: boolean; saved: boolean }> {
  return apiRequest(`/api/shortlist/${userId}`, { method: 'DELETE' });
}

export async function updateShortlistNote(userId: string, note: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/shortlist/${userId}/note`, { method: 'PATCH', body: JSON.stringify({ note }) });
}

// ─────────────────────────────────────────────────────────────────────────────
// Research Workspace — FigJam-like research canvas
// ─────────────────────────────────────────────────────────────────────────────

export type ResearchNodeType =
  // Core
  | 'note' | 'document' | 'image' | 'pdf' | 'link' | 'reference'
  // Research & Analysis
  | 'insight' | 'hypothesis' | 'question' | 'evidence' | 'citation'
  // Strategy & Planning
  | 'pitch_deck' | 'business_plan' | 'business_model' | 'lean_canvas' | 'swot'
  | 'roadmap' | 'okr' | 'vision'
  // Financial
  | 'financial_model' | 'budget' | 'cap_table' | 'invoice' | 'term_sheet' | 'revenue_model'
  // Legal
  | 'contract' | 'nda' | 'legal' | 'incorporation' | 'ip_filing' | 'compliance'
  // Product & Tech
  | 'wireframe' | 'spec' | 'user_story' | 'api_doc' | 'architecture' | 'bug_report' | 'feature_request'
  // Marketing & Sales
  | 'competitor' | 'market_research' | 'persona' | 'branding' | 'go_to_market' | 'funnel'
  // Team & Operations
  | 'org_chart' | 'meeting_notes' | 'checklist' | 'timeline' | 'kpi' | 'hiring_plan' | 'onboarding'
  // Communication & Content
  | 'email_draft' | 'press_release' | 'presentation' | 'proposal' | 'newsletter'
  // Data & Metrics
  | 'whitepaper' | 'case_study' | 'survey' | 'data' | 'report'
  // Investor Relations
  | 'due_diligence' | 'investor_update' | 'data_room' | 'valuation'
  // Task Management
  | 'task' | 'milestone' | 'sprint' | 'retrospective'
  // Draw / Diagram shapes (Phase 1)
  | 'shape_rect' | 'shape_circle' | 'shape_diamond' | 'shape_triangle'
  | 'shape_line' | 'shape_arrow' | 'shape_text'
  // Mermaid diagram (Phase 1)
  | 'mermaid_diagram'
  // Visual structured templates (Phase 2)
  | 'visual_bmc' | 'visual_lean' | 'visual_swot'
  // Embedded interactive nodes (Phase 2)
  | 'flow_diagram' | 'whiteboard';
export type ResearchBoardVisibility = 'private' | 'team' | 'organization' | 'public';

export interface ResearchBoardUpload {
  id: string;
  url: string;
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
}

export interface ResearchNode {
  id: string;
  boardId: string;
  type: ResearchNodeType;
  title: string | null;
  content: string | null;
  url: string | null;
  uploadId: string | null;
  upload: ResearchBoardUpload | null;
  posX: number;
  posY: number;
  width: number;
  height: number;
  zIndex: number;
  color: string | null;
  collapsed: boolean;
  locked: boolean;
  refEntityType: string | null;
  refEntityId: string | null;
  builderDocumentId: string | null;
  metadata: unknown;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchConnector {
  id: string;
  boardId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  color: string | null;
  style: string | null;
  createdAt: string;
}

export interface ResearchBoard {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  visibility: ResearchBoardVisibility;
  canvasState: unknown;
  tags: string[];
  color: string | null;
  icon: string | null;
  isPinned: boolean;
  isArchived: boolean;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchBoardFull extends ResearchBoard {
  nodes: ResearchNode[];
  connectors: ResearchConnector[];
}

// Board operations
export async function listResearchBoards(): Promise<{ boards: ResearchBoard[] }> {
  return apiRequest('/api/research/boards');
}

export async function getResearchBoard(boardId: string): Promise<{ board: ResearchBoardFull }> {
  return apiRequest(`/api/research/boards/${boardId}`);
}

export async function createResearchBoard(data: {
  title: string;
  description?: string;
  visibility?: ResearchBoardVisibility;
  tags?: string[];
  color?: string;
  icon?: string;
}): Promise<{ board: ResearchBoard }> {
  return apiRequest('/api/research/boards', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateResearchBoard(
  boardId: string,
  data: {
    title?: string;
    description?: string;
    visibility?: ResearchBoardVisibility;
    canvasState?: unknown;
    tags?: string[];
    color?: string;
    icon?: string;
    isPinned?: boolean;
    isArchived?: boolean;
  },
): Promise<{ board: ResearchBoard }> {
  return apiRequest(`/api/research/boards/${boardId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteResearchBoard(boardId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/research/boards/${boardId}`, { method: 'DELETE' });
}

// Node operations
export async function createResearchNode(
  boardId: string,
  data: {
    type: ResearchNodeType;
    title?: string;
    content?: string;
    url?: string;
    uploadId?: string;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    color?: string;
    refEntityType?: string;
    refEntityId?: string;
    metadata?: unknown;
    tags?: string[];
  },
): Promise<{ node: ResearchNode }> {
  return apiRequest(`/api/research/boards/${boardId}/nodes`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateResearchNode(
  nodeId: string,
  data: {
    title?: string;
    content?: string;
    url?: string;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    zIndex?: number;
    color?: string;
    collapsed?: boolean;
    locked?: boolean;
    metadata?: unknown;
    tags?: string[];
    builderDocumentId?: string | null;
  },
): Promise<{ node: ResearchNode }> {
  return apiRequest(`/api/research/nodes/${nodeId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function batchUpdateResearchNodes(
  boardId: string,
  updates: Array<{ id: string; posX?: number; posY?: number; width?: number; height?: number; zIndex?: number }>,
): Promise<{ ok: true }> {
  return apiRequest(`/api/research/boards/${boardId}/nodes/batch`, { method: 'PATCH', body: JSON.stringify({ updates }) });
}

export async function deleteResearchNode(nodeId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/research/nodes/${nodeId}`, { method: 'DELETE' });
}

// Connector operations
export async function createResearchConnector(
  boardId: string,
  data: { fromNodeId: string; toNodeId: string; label?: string; color?: string; style?: 'solid' | 'dashed' | 'dotted' },
): Promise<{ connector: ResearchConnector }> {
  return apiRequest(`/api/research/boards/${boardId}/connectors`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateResearchConnector(
  connectorId: string,
  data: { label?: string; color?: string; style?: 'solid' | 'dashed' | 'dotted' },
): Promise<{ connector: ResearchConnector }> {
  return apiRequest(`/api/research/connectors/${connectorId}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteResearchConnector(connectorId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/research/connectors/${connectorId}`, { method: 'DELETE' });
}

// Research asset upload
export async function uploadResearchAsset(
  file: File,
): Promise<{ upload: { id: string; url: string; mimeType: string | null; originalName: string | null; sizeBytes: number | null } }> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/uploads/research-asset', { method: 'POST', body: form });
}

// ─── Research Collaborators ───────────────────────────────────────────────

export interface ResearchCollaborator {
  id?: string;
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  addedAt: string | null;
}

export async function listResearchCollaborators(
  boardId: string,
): Promise<{ owner: ResearchCollaborator; collaborators: ResearchCollaborator[] }> {
  return apiRequest(`/api/research/boards/${boardId}/collaborators`);
}

export async function addResearchCollaborator(
  boardId: string,
  data: { userId: string; role: 'viewer' | 'editor' | 'admin' },
): Promise<{ collaborator: ResearchCollaborator }> {
  return apiRequest(`/api/research/boards/${boardId}/collaborators`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateResearchCollaborator(
  boardId: string,
  targetUserId: string,
  role: 'viewer' | 'editor' | 'admin',
): Promise<{ ok: true }> {
  return apiRequest(`/api/research/boards/${boardId}/collaborators/${targetUserId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeResearchCollaborator(boardId: string, targetUserId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/research/boards/${boardId}/collaborators/${targetUserId}`, { method: 'DELETE' });
}

// ─── Research Comments ───────────────────────────────────────────────────

export interface ResearchComment {
  id: string;
  nodeId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  commentType: 'general' | 'suggestion' | 'question' | 'resolved' | 'pin';
  resolved: boolean;
  posX: number | null;
  posY: number | null;
  parentId: string | null;
  replies?: ResearchComment[];
  author?: { id: string; displayName: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
}

export async function listNodeComments(nodeId: string): Promise<{ comments: ResearchComment[] }> {
  return apiRequest(`/api/research/nodes/${nodeId}/comments`);
}

export async function createNodeComment(
  nodeId: string,
  data: { body: string; posX?: number; posY?: number },
): Promise<{ comment: ResearchComment }> {
  return apiRequest(`/api/research/nodes/${nodeId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNodeComment(
  commentId: string,
  data: { body?: string; resolved?: boolean },
): Promise<{ comment: ResearchComment }> {
  return apiRequest(`/api/research/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNodeComment(commentId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/research/comments/${commentId}`, { method: 'DELETE' });
}

// ─── Research AI Analysis ────────────────────────────────────────────────

export interface ResearchBoardAnalysis {
  summary: string;
  themes: string[];
  insights: string[];
  suggestedTags: string[];
  connections: Array<{ from: string; to: string; reason: string }>;
  gaps: string[];
}

export async function analyzeResearchBoard(boardId: string): Promise<{ analysis: ResearchBoardAnalysis }> {
  return apiRequest(`/api/research/boards/${boardId}/analyze`, { method: 'POST' });
}

// AI: Extract nodes from text
export interface AINodeSuggestion {
  id: string;
  type: string;
  title: string;
  content: string;
  colorKey: string;
  rationale: string;
  confidence: number;
  sourceText?: string;
  accepted?: boolean;
}

export async function extractResearchNodes(
  boardId: string,
  text: string,
): Promise<{ nodes: AINodeSuggestion[] }> {
  return apiRequest(`/api/research/boards/${boardId}/ai/extract`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// AI: Suggest connections between nodes
export interface AIConnectionSuggestion {
  id: string;
  fromId: string;
  toId: string;
  connType: string;
  label: string;
  rationale: string;
  confidence: number;
  accepted?: boolean;
}

export async function suggestResearchConnections(
  boardId: string,
  nodeIds: string[],
): Promise<{ connections: AIConnectionSuggestion[] }> {
  return apiRequest(`/api/research/boards/${boardId}/ai/connections`, {
    method: 'POST',
    body: JSON.stringify({ nodeIds }),
  });
}

// AI: Synthesize cluster of nodes into insight
export interface AISynthesisResult {
  title: string;
  content: string;
  rationale: string;
}

export async function synthesizeResearchCluster(
  boardId: string,
  nodeIds: string[],
): Promise<{ synthesis: AISynthesisResult }> {
  return apiRequest(`/api/research/boards/${boardId}/ai/synthesize`, {
    method: 'POST',
    body: JSON.stringify({ nodeIds }),
  });
}

// AI: Generate research questions
export interface AIResearchQuestion {
  id: string;
  title: string;
  rationale: string;
  confidence: number;
}

export async function generateResearchQuestions(
  boardId: string,
  focus?: string,
): Promise<{ questions: AIResearchQuestion[] }> {
  return apiRequest(`/api/research/boards/${boardId}/ai/questions`, {
    method: 'POST',
    body: JSON.stringify({ focus }),
  });
}

// AI: Chat with board context
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithResearchBoard(
  boardId: string,
  message: string,
  history: AIChatMessage[],
): Promise<{ reply: string }> {
  return apiRequest(`/api/research/boards/${boardId}/ai/chat`, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
}

// ─── Builder Document Versions (Phase 3) ─────────────────────────────────────

export interface BuilderDocumentVersion {
  id: string;
  version: number;
  versionLabel: string | null;
  changesSummary: string | null;
  createdAt: string;
  changedById: string | null;
  changedBy: { id: string; displayName: string; avatarUrl?: string | null } | null;
}

export async function listDocumentVersions(documentId: string): Promise<BuilderDocumentVersion[]> {
  return apiRequest(`/api/collab/documents/${documentId}/versions`);
}

// ─── Research Board Snapshots (Phase 4a) ─────────────────────────────────────

export interface ResearchBoardSnapshot {
  id: string;
  boardId: string;
  label: string | null;
  triggerType: string;
  nodeCount: number;
  nodeData?: unknown[];
  connectors?: unknown[];
  canvasState?: unknown;
  createdAt: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string } | null;
}

export async function createResearchSnapshot(
  boardId: string,
  data: { label?: string; triggerType?: string },
): Promise<{ snapshot: ResearchBoardSnapshot }> {
  return apiRequest(`/api/research/boards/${boardId}/snapshots`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listResearchSnapshots(boardId: string): Promise<{ snapshots: ResearchBoardSnapshot[] }> {
  return apiRequest(`/api/research/boards/${boardId}/snapshots`);
}

export async function getResearchSnapshot(
  boardId: string,
  snapshotId: string,
): Promise<{ snapshot: ResearchBoardSnapshot }> {
  return apiRequest(`/api/research/boards/${boardId}/snapshots/${snapshotId}`);
}

// ─── Programs ────────────────────────────────────────────────────────────────

export interface ProgramItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  programType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  capacity: number | null;
  isRemote: boolean;
  location: string | null;
  industries: string[];
  benefits: string[];
  requirements: Record<string, unknown> | null;
  curriculum: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  applicationCount: number;
  participantCount: number;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    organizationType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProgramParticipantItem {
  id: string;
  userId: string;
  status: string;
  role: string | null;
  appliedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  user: { id: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
}

export async function listPrograms(params?: {
  programType?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ programs: ProgramItem[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.programType) q.set('programType', params.programType);
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  return apiRequest(`/api/programs?${q}`);
}

export async function getProgram(id: string): Promise<{ program: ProgramItem }> {
  return apiRequest(`/api/programs/${id}`);
}

export async function getMyPrograms(): Promise<{ programs: ProgramItem[] }> {
  return apiRequest(`/api/programs/my-programs`);
}

export async function applyToProgram(
  id: string,
  application?: Record<string, unknown>,
): Promise<{ participant: ProgramParticipantItem }> {
  return apiRequest(`/api/programs/${id}/apply`, {
    method: 'POST',
    body: JSON.stringify({ application }),
  });
}

export async function getProgramParticipants(
  id: string,
  params?: { status?: string; role?: string },
): Promise<{ participants: ProgramParticipantItem[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.role) q.set('role', params.role);
  return apiRequest(`/api/programs/${id}/participants?${q}`);
}

// ─── Builder Readiness ───────────────────────────────────────────────────────

export interface ReadinessScore {
  id: string;
  workspaceId: string;
  dimension: string;
  score: number;
  maxScore: number;
  criteria: Array<{ id: string; name: string; completed: boolean; weight: number; notes?: string }>;
  recommendations: string[];
  assessedAt: string;
}

export interface ReadinessOverall {
  overallScore: number;
  overallMax: number;
  dimensions: ReadinessScore[];
  lastAssessedAt: string | null;
  acceleratorReadiness: number;
  investorReadiness: number;
}

export async function assessReadiness(dto: {
  workspaceId: string;
  dimensions?: string[];
}): Promise<{ assessment: ReadinessOverall }> {
  return apiRequest(`/api/builder/readiness/assess`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateReadinessCriterion(
  workspaceId: string,
  dto: { dimension: string; criterionId: string; completed: boolean; notes?: string },
): Promise<{ score: ReadinessScore }> {
  return apiRequest(`/api/builder/workspaces/${workspaceId}/readiness/criterion`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// ─── Builder Applications ────────────────────────────────────────────────────

export interface BuilderApplicationItem {
  id: string;
  workspaceId: string;
  targetProgram: string;
  targetOrganization: string | null;
  status: string;
  content: Record<string, unknown>;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listBuilderApplications(
  workspaceId: string,
): Promise<{ applications: BuilderApplicationItem[] }> {
  return apiRequest(`/api/builder/workspaces/${workspaceId}/applications`);
}

export async function createBuilderApplication(
  workspaceId: string,
  data: { targetProgram: string; targetOrganization?: string; content?: Record<string, unknown> },
): Promise<{ application: BuilderApplicationItem }> {
  return apiRequest(`/api/builder/workspaces/${workspaceId}/applications`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBuilderApplication(
  applicationId: string,
  data: Partial<BuilderApplicationItem>,
): Promise<{ application: BuilderApplicationItem }> {
  return apiRequest(`/api/builder/applications/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Saved Searches ───────────────────────────────────────────────────────────

export interface SavedSearchFilters {
  roles?: string[];
  skills?: string[];
  industries?: string[];
  locations?: string[];
  stage?: string[];
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SavedSearchFilters;
  alertsEnabled: boolean;
  alertFrequency: 'instant' | 'daily' | 'weekly';
  lastRun?: string;
  resultCount?: number;
  newResults?: number;
  createdAt: string;
  updatedAt: string;
}

export async function listSavedSearches(): Promise<{ searches: SavedSearch[] }> {
  return apiRequest('/api/saved-searches');
}

export async function createSavedSearch(
  data: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt' | 'lastRun' | 'resultCount' | 'newResults'>,
): Promise<{ search: SavedSearch }> {
  return apiRequest('/api/saved-searches', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSavedSearch(
  id: string,
  data: Partial<Pick<SavedSearch, 'name' | 'alertsEnabled' | 'alertFrequency'>>,
): Promise<{ search: SavedSearch }> {
  return apiRequest(`/api/saved-searches/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function deleteSavedSearch(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/saved-searches/${id}`, { method: 'DELETE' });
}

export async function runSavedSearch(id: string): Promise<{ results: unknown[]; count: number }> {
  return apiRequest(`/api/saved-searches/${id}/run`, { method: 'POST' });
}

// ─── Public Pitch Deck ────────────────────────────────────────────────────────

export interface PitchSlide {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  order: number;
}

export interface PublicPitchDeck {
  id: string;
  title: string;
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  slides: PitchSlide[];
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    headline?: string;
  };
  stats: {
    views: number;
    shares: number;
    contactRequests: number;
  };
  isPublic: boolean;
  allowContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getPublicPitchDeck(id: string): Promise<{ deck: PublicPitchDeck }> {
  return apiRequest(`/api/pitch/${id}/public`);
}

export async function recordPitchView(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/pitch/${id}/view`, { method: 'POST' });
}

export async function submitPitchContactRequest(
  id: string,
  data: { name: string; email: string; message?: string },
): Promise<{ ok: boolean }> {
  return apiRequest(`/api/pitch/${id}/contact`, { method: 'POST', body: JSON.stringify(data) });
}

// ─────────────────────────────────────────────────────────────────────────────
// Collaboration Architecture — Phase 1+2
// Branches, Change Proposals, Review Requests, Share Links, Version Restore
// Architecture report: COLLABORATION_ARCHITECTURE.md
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

export type ArtifactBranchStatus = 'open' | 'review' | 'merged' | 'closed' | 'abandoned';
export type ChangeProposalStatus = 'open' | 'approved' | 'changes_requested' | 'merged' | 'closed';
export type ShareLinkPermission = 'view' | 'comment' | 'suggest';

export interface ArtifactBranch {
  id: string;
  documentId: string;
  name: string;
  description?: string;
  status: ArtifactBranchStatus;
  baseVersionNum: number;
  baseVersionId: string;
  mergedAt?: string;
  mergedById?: string;
  mergeVersionId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string };
  proposalCount: number;
}

export interface ChangeProposal {
  id: string;
  branchId: string;
  documentId: string;
  title: string;
  description?: string;
  status: ChangeProposalStatus;
  changedSections: string[];
  diffSummary?: Record<string, unknown>;
  reviewerIds: string[];
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string };
  branch?: { id: string; name: string; status: string };
}

export interface ArtifactShareLink {
  id: string;
  documentId?: string;
  workspaceId?: string;
  versionId?: string;
  token: string;
  permissions: ShareLinkPermission;
  label?: string;
  recipientEmail?: string;
  expiresAt?: string;
  maxViews?: number;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
  lastAccessedAt?: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string };
}

export interface VersionRestoreResult {
  documentId: string;
  previousVersion: number;
  restoredFromVersion: number;
  newVersion: number;
}

// ─── Branch API ──────────────────────────────────────────────────────────────

export async function createBranch(data: {
  documentId: string;
  name: string;
  description?: string;
}): Promise<ArtifactBranch> {
  return apiRequest('/api/collab/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getBranch(branchId: string): Promise<ArtifactBranch> {
  return apiRequest(`/api/collab/branches/${branchId}`);
}

export async function listBranches(
  documentId: string,
  params?: { status?: ArtifactBranchStatus },
): Promise<ArtifactBranch[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  return apiRequest(`/api/collab/documents/${documentId}/branches?${q}`);
}

export async function updateBranch(
  branchId: string,
  data: { name?: string; description?: string; status?: ArtifactBranchStatus },
): Promise<ArtifactBranch> {
  return apiRequest(`/api/collab/branches/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function closeBranch(branchId: string): Promise<ArtifactBranch> {
  return apiRequest(`/api/collab/branches/${branchId}/close`, { method: 'POST' });
}

// ─── Change Proposal API ─────────────────────────────────────────────────────

export async function createProposal(data: {
  branchId: string;
  title: string;
  description?: string;
  reviewerIds?: string[];
}): Promise<ChangeProposal> {
  return apiRequest('/api/collab/proposals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getProposal(proposalId: string): Promise<ChangeProposal> {
  return apiRequest(`/api/collab/proposals/${proposalId}`);
}

export async function listProposals(
  documentId: string,
  params?: { status?: ChangeProposalStatus },
): Promise<ChangeProposal[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  return apiRequest(`/api/collab/documents/${documentId}/proposals?${q}`);
}

export async function updateProposal(
  proposalId: string,
  data: { title?: string; description?: string; status?: ChangeProposalStatus; reviewerIds?: string[] },
): Promise<ChangeProposal> {
  return apiRequest(`/api/collab/proposals/${proposalId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─── Review Request / Decision API ───────────────────────────────────────────

export async function requestProposalReview(data: {
  proposalId: string;
  reviewerIds: string[];
  message?: string;
}): Promise<ChangeProposal> {
  return apiRequest('/api/collab/reviews/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitProposalReview(
  proposalId: string,
  data: { decision: ChangeProposalStatus; feedback?: string; rating?: number },
): Promise<ChangeProposal> {
  return apiRequest(`/api/collab/proposals/${proposalId}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Share Link API ──────────────────────────────────────────────────────────

export async function createShareLink(data: {
  documentId?: string;
  workspaceId?: string;
  versionId?: string;
  permissions?: ShareLinkPermission;
  label?: string;
  recipientEmail?: string;
  password?: string;
  expiresAt?: string;
  maxViews?: number;
}): Promise<ArtifactShareLink> {
  return apiRequest('/api/collab/share-links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getShareLink(shareLinkId: string): Promise<ArtifactShareLink> {
  return apiRequest(`/api/collab/share-links/${shareLinkId}`);
}

export async function listDocumentShareLinks(documentId: string): Promise<ArtifactShareLink[]> {
  return apiRequest(`/api/collab/documents/${documentId}/share-links`);
}

export async function listWorkspaceShareLinks(workspaceId: string): Promise<ArtifactShareLink[]> {
  return apiRequest(`/api/collab/workspaces/${workspaceId}/share-links`);
}

export async function updateShareLink(
  shareLinkId: string,
  data: { isActive?: boolean; expiresAt?: string; maxViews?: number; label?: string },
): Promise<ArtifactShareLink> {
  return apiRequest(`/api/collab/share-links/${shareLinkId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function revokeShareLink(shareLinkId: string): Promise<ArtifactShareLink> {
  return apiRequest(`/api/collab/share-links/${shareLinkId}/revoke`, { method: 'POST' });
}

// ─── Version Restore API ─────────────────────────────────────────────────────

export async function restoreDocumentVersion(data: {
  documentId: string;
  targetVersion: number;
}): Promise<VersionRestoreResult> {
  return apiRequest('/api/collab/versions/restore', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Canvas Versioning API ────────────────────────────────────────────────────

export interface CanvasNodeDiff {
  id: string;
  title: string | null;
  type: string;
}

export interface CanvasModifiedNodeDiff {
  id: string;
  title: string | null;
  type: string;
  changes: Array<{ field: string; before: unknown; after: unknown }>;
}

export interface CanvasMovedNodeDiff {
  id: string;
  title: string | null;
  before: { posX: number; posY: number };
  after: { posX: number; posY: number };
}

export interface CanvasConnectorSnapshot {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  color: string | null;
  style: string | null;
}

export interface CanvasDiff {
  added: CanvasNodeDiff[];
  removed: CanvasNodeDiff[];
  modified: CanvasModifiedNodeDiff[];
  moved: CanvasMovedNodeDiff[];
  edgeDiff: { added: CanvasConnectorSnapshot[]; removed: CanvasConnectorSnapshot[] };
  isEmpty: boolean;
}

export interface CanvasVersion {
  id: string;
  boardId: string;
  branchId: string | null;
  branchName: string | null;
  parentVersionId: string | null;
  label: string | null;
  changeSummary: string | null;
  triggerType: string;
  nodeCount: number;
  createdAt: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string } | null;
  diffData: CanvasDiff | null;
}

export interface CanvasVersionFull extends CanvasVersion {
  nodeData: unknown[];
  connectors: CanvasConnectorSnapshot[];
  canvasState: unknown;
}

export interface CanvasBranch {
  id: string;
  boardId: string;
  name: string;
  description: string | null;
  status: 'active' | 'merged' | 'archived';
  isDefault: boolean;
  headVersionId: string | null;
  baseVersionId: string | null;
  nodeCount: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; displayName: string; avatarUrl?: string } | null;
}

export interface MergeConflict {
  kind: string;
  nodeId?: string;
  edgeId?: string;
  description: string;
  sourceValue?: unknown;
  targetValue?: unknown;
}

export interface ConflictResolution {
  nodeId?: string;
  edgeId?: string;
  resolution: 'keep_source' | 'keep_target' | 'keep_both';
}

// — Versions

export async function createCanvasVersion(
  boardId: string,
  dto: { label?: string; changeSummary?: string; triggerType?: string; branchId?: string },
): Promise<CanvasVersion> {
  const res = await apiRequest<{ version: CanvasVersion }>(
    `/api/research/boards/${boardId}/versions`,
    { method: 'POST', body: JSON.stringify(dto) },
  );
  return res.version;
}

export async function listCanvasVersions(boardId: string, branchId?: string): Promise<CanvasVersion[]> {
  const qs = branchId ? `?branchId=${branchId}` : '';
  const res = await apiRequest<{ versions: CanvasVersion[] }>(
    `/api/research/boards/${boardId}/versions${qs}`,
  );
  return res.versions;
}

export async function getCanvasVersion(boardId: string, versionId: string): Promise<CanvasVersionFull> {
  const res = await apiRequest<{ version: CanvasVersionFull }>(
    `/api/research/boards/${boardId}/versions/${versionId}`,
  );
  return res.version;
}

export async function restoreCanvasVersion(
  boardId: string,
  versionId: string,
): Promise<{ ok: boolean; newVersionId: string }> {
  return apiRequest(`/api/research/boards/${boardId}/versions/${versionId}/restore`, {
    method: 'POST',
  });
}

export async function diffCanvasVersions(
  boardId: string,
  from: string,
  to: string,
): Promise<CanvasDiff> {
  const res = await apiRequest<{ diff: CanvasDiff }>(
    `/api/research/boards/${boardId}/diff?from=${from}&to=${to}`,
  );
  return res.diff;
}

// Snapshot restore (backward compat with BoardHistoryDrawer)
export async function restoreBoardSnapshot(boardId: string, snapshotId: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/research/boards/${boardId}/snapshots/${snapshotId}/restore`, {
    method: 'POST',
  });
}

// — Branches

export async function createCanvasBranch(
  boardId: string,
  dto: { name: string; description?: string; baseVersionId?: string },
): Promise<CanvasBranch> {
  const res = await apiRequest<{ branch: CanvasBranch }>(
    `/api/research/boards/${boardId}/branches`,
    { method: 'POST', body: JSON.stringify(dto) },
  );
  return res.branch;
}

export async function listCanvasBranches(boardId: string): Promise<CanvasBranch[]> {
  const res = await apiRequest<{ branches: CanvasBranch[] }>(
    `/api/research/boards/${boardId}/branches`,
  );
  return res.branches;
}

export async function archiveCanvasBranch(boardId: string, branchId: string): Promise<CanvasBranch> {
  const res = await apiRequest<{ branch: CanvasBranch }>(
    `/api/research/boards/${boardId}/branches/${branchId}/archive`,
    { method: 'PATCH' },
  );
  return res.branch;
}

export async function deleteCanvasBranch(boardId: string, branchId: string): Promise<void> {
  await apiRequest(`/api/research/boards/${boardId}/branches/${branchId}`, { method: 'DELETE' });
}

// — Merge

export async function previewCanvasMerge(
  boardId: string,
  sourceBranchId: string,
  targetBranchId: string,
): Promise<{ conflicts: MergeConflict[]; diff: CanvasDiff }> {
  return apiRequest(`/api/research/boards/${boardId}/merge/preview`, {
    method: 'POST',
    body: JSON.stringify({ sourceBranchId, targetBranchId }),
  });
}

export async function mergeCanvasBranch(
  boardId: string,
  dto: {
    sourceBranchId: string;
    targetBranchId: string;
    strategy: 'fast_forward' | 'manual' | 'conflict_resolved';
    resolutions?: ConflictResolution[];
  },
): Promise<{ mergeId: string; resultVersionId: string; conflicts: MergeConflict[] }> {
  return apiRequest(`/api/research/boards/${boardId}/merge`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas Copilot (multi-agent AI)
// ─────────────────────────────────────────────────────────────────────────────

export interface CanvasCopilotAgentConfig {
  id: string;
  name: string;
  description: string;
  suggestedQuestions: string[];
  temperature?: number;
  maxTokens?: number;
}

export interface CanvasCopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CanvasCopilotResult {
  message: string;
  agentId: string;
  model: string;
  fallback?: boolean;
  boardContext: { nodeCount: number; usedNodeIds: string[] };
}

export async function listCanvasCopilotAgents(
  boardId: string,
): Promise<{ agents: CanvasCopilotAgentConfig[] }> {
  return apiRequest(`/api/research/boards/${boardId}/copilot/agents`);
}

export async function chatWithCanvasCopilot(
  boardId: string,
  dto: {
    agentId: string;
    message: string;
    selectedNodeIds?: string[];
    includeAllNodes?: boolean;
    history?: CanvasCopilotMessage[];
  },
): Promise<CanvasCopilotResult> {
  return apiRequest(`/api/research/boards/${boardId}/copilot/chat`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas ↔ Builder Synthesis
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportToBuilderResult {
  documentId: string;
  documentTitle: string;
  documentType: string;
  workspaceId: string;
  sourceNodeIds: string[];
  linkedNodeIds: string[];
}

export interface ImportToCanvasResult {
  nodeId: string;
  nodeType: string;
  title: string;
  builderDocumentId: string;
}

export interface ImportableDocument {
  id: string;
  type: string;
  title: string;
  workspaceName: string;
  alreadyLinked: boolean;
}

export async function exportCanvasToBuilder(
  boardId: string,
  dto: {
    workspaceId: string;
    selectedNodeIds?: string[];
    documentType?: string;
    documentTitle?: string;
    linkNodes?: boolean;
  },
): Promise<ExportToBuilderResult> {
  return apiRequest(`/api/research/boards/${boardId}/export-to-builder`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function importBuilderToCanvas(
  boardId: string,
  dto: {
    documentId: string;
    posX?: number;
    posY?: number;
  },
): Promise<ImportToCanvasResult> {
  return apiRequest(`/api/research/boards/${boardId}/import-from-builder`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function generateDocumentFromCanvas(
  boardId: string,
  dto: {
    workspaceId: string;
    documentType: string;
    documentTitle?: string;
    selectedNodeIds?: string[];
    agentId?: string;
  },
): Promise<ExportToBuilderResult & { aiGenerated: boolean; generationPrompt: string }> {
  return apiRequest(`/api/research/boards/${boardId}/generate-document`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function listImportableDocuments(
  boardId: string,
): Promise<{ documents: ImportableDocument[] }> {
  return apiRequest(`/api/research/boards/${boardId}/importable-documents`);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAMIFICATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums (mirrored from Prisma) ─────────────────────────────────────────────

export type XPEventType =
  | 'CREATE_ARTIFACT'
  | 'COMPLETE_ARTIFACT'
  | 'IMPROVE_ARTIFACT'
  | 'CREATE_BOARD'
  | 'SYNTHESIZE_BOARD'
  | 'LINK_ARTIFACTS'
  | 'INVITE_COLLABORATOR'
  | 'TEAM_CONTRIBUTION'
  | 'HIGH_QUALITY_CONTRIBUTION'
  | 'RECEIVE_MENTOR_FEEDBACK'
  | 'APPLY_FEEDBACK'
  | 'COMPLETE_REVIEW'
  | 'PROVIDE_FEEDBACK'
  | 'COMPLETE_MILESTONE'
  | 'VALIDATED_PROGRESS';

export type GamificationBadgeCategory =
  | 'progress'
  | 'consistency'
  | 'collaboration'
  | 'quality'
  | 'learning'
  | 'execution';

export type GamificationBadgeRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

// ── XP ───────────────────────────────────────────────────────────────────────

export interface GamificationRecentXPEvent {
  id: string;
  eventType: XPEventType;
  xpAmount: number;
  entityType: string | null;
  metadata: unknown;
  createdAt: string;
}

export type GamificationRecentEvent = GamificationRecentXPEvent;

export interface GamificationStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export type GamificationStreakSummary = GamificationStreak;

export interface GamificationXPSummary {
  userId: string;
  totalXp: number;
  level: number;
  levelLabel: string;
  xpToNextLevel: number;
  levelProgress: number;
  recentEvents: GamificationRecentXPEvent[];
  streak: GamificationStreak;
}

export async function getMyXP(): Promise<GamificationXPSummary> {
  return apiRequest('/api/gamification/users/me/xp');
}

export async function getUserXP(userId: string): Promise<GamificationXPSummary> {
  return apiRequest(`/api/gamification/users/${userId}/xp`);
}

// ── Badges ───────────────────────────────────────────────────────────────────

export interface GamificationBadge {
  id: string;
  key: string;
  name: string;
  description: string;
  category: GamificationBadgeCategory;
  rarity: GamificationBadgeRarity;
  iconName: string | null;
  xpReward: number;
  awardedAt: string;
}

export type GamificationBadgeSummary = GamificationBadge;

export async function getMyBadges(): Promise<GamificationBadge[]> {
  return apiRequest('/api/gamification/users/me/badges');
}

export async function getUserBadges(userId: string): Promise<GamificationBadge[]> {
  return apiRequest(`/api/gamification/users/${userId}/badges`);
}

export async function markBadgesSeen(): Promise<void> {
  return apiRequest('/api/gamification/users/me/badges/seen', { method: 'POST' });
}

// ── Streak ───────────────────────────────────────────────────────────────────

export async function getMyStreak(): Promise<GamificationStreak> {
  return apiRequest('/api/gamification/users/me/streak');
}

// ── Record XP Event ──────────────────────────────────────────────────────────

export interface RecordXPEventDto {
  eventType: XPEventType;
  workspaceId?: string;
  entityType?: string;
  entityId?: string;
  weightMultiplier?: number;
  metadata?: Record<string, unknown>;
}

export interface RecordXPEventResult {
  xpAwarded: number;
  isDiminished: boolean;
  blocked: boolean;
}

export async function recordXPEvent(
  dto: RecordXPEventDto,
): Promise<RecordXPEventResult> {
  return apiRequest('/api/gamification/events', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// ── Readiness ────────────────────────────────────────────────────────────────

export interface GamificationReadinessDimensions {
  problemClarity: number;
  solutionClarity: number;
  marketUnderstanding: number;
  productDefinition: number;
  teamCompleteness: number;
  executionReadiness: number;
  validationScore: number;
  artifactCompleteness: number;
}

export interface GamificationDimensionDetail {
  score: number;
  weight: number;
  weightedContribution: number;
  detail: string;
  signals: Record<string, string | number | boolean>;
}

export interface GamificationReadinessSummary {
  workspaceId: string;
  score: number;
  bottleneckFactor: number;
  dimensions: GamificationReadinessDimensions;
  dimensionBreakdown: Record<string, GamificationDimensionDetail>;
  updatedAt: string;
}

export async function getWorkspaceReadiness(
  workspaceId: string,
): Promise<GamificationReadinessSummary> {
  return apiRequest(`/api/gamification/workspaces/${workspaceId}/readiness`);
}

export async function refreshWorkspaceReadiness(
  workspaceId: string,
): Promise<GamificationReadinessSummary> {
  return apiRequest(
    `/api/gamification/workspaces/${workspaceId}/readiness/refresh`,
    { method: 'POST' },
  );
}

// ── Team Momentum ────────────────────────────────────────────────────────────

export interface GamificationMomentumBreakdown {
  activeContributors: number;
  recentMeaningfulActions: number;
  meaningful7d: number;
  meaningful14d: number;
  velocityScore: number;
  recentActivityScore: number;
  collaborationDensityScore: number;
  feedbackLoopScore: number;
  milestoneRateScore: number;
  artifactProgressEvents: number;
  feedbackLoopsCompleted: number;
  milestoneCompletionRate: number;
  momentumLevel: string;
}

export interface GamificationMomentumSummary {
  workspaceId: string;
  score: number;
  velocity: number;
  recentActivityScore: number;
  collaborationDensity: number;
  breakdown: GamificationMomentumBreakdown;
  updatedAt: string;
}

export async function getWorkspaceMomentum(
  workspaceId: string,
): Promise<GamificationMomentumSummary> {
  return apiRequest(`/api/gamification/workspaces/${workspaceId}/momentum`);
}

// ── Contribution ─────────────────────────────────────────────────────────────

export interface GamificationContributionBreakdown {
  artifactsCreated: number;
  artifactsImproved: number;
  feedbackGiven: number;
  feedbackApplied: number;
  collaborationActions: number;
  usageByTeam: number;
  recentArtifactsCreated: number;
  recentArtifactsImproved: number;
  recentFeedbackApplied: number;
}

export interface GamificationContributionSummary {
  userId: string;
  workspaceId: string;
  score: number;
  rawScore: number;
  breakdown: GamificationContributionBreakdown;
  explain: string;
  updatedAt: string;
}

export async function getWorkspaceContributions(
  workspaceId: string,
): Promise<GamificationContributionSummary[]> {
  return apiRequest(`/api/gamification/workspaces/${workspaceId}/contributions`);
}

export async function getMyWorkspaceContribution(
  workspaceId: string,
): Promise<GamificationContributionSummary> {
  return apiRequest(
    `/api/gamification/workspaces/${workspaceId}/contributions/me`,
  );
}

// ── Mentor Metrics ───────────────────────────────────────────────────────────

export interface GamificationMentorMetrics {
  workspaceId: string;
  feedbackCount: number;
  appliedFeedbackCount: number;
  unresolvedFeedback: number;
  appliedFeedbackRate: number;
  avgResponseTimeHrs: number;
  speedScore: number;
  depthScore: number;
  burdenScore: number;
  improvementScore: number;
  lastFeedbackAt: string | null;
  updatedAt: string;
}

export async function getWorkspaceMentorMetrics(
  workspaceId: string,
): Promise<GamificationMentorMetrics> {
  return apiRequest(
    `/api/gamification/workspaces/${workspaceId}/mentor-metrics`,
  );
}

// ── Full refresh ─────────────────────────────────────────────────────────────

export interface WorkspaceMetricsRefreshResult {
  readiness: GamificationReadinessSummary;
  momentum: GamificationMomentumSummary;
  mentorMetrics: GamificationMentorMetrics;
}

export async function refreshAllWorkspaceMetrics(
  workspaceId: string,
): Promise<WorkspaceMetricsRefreshResult> {
  return apiRequest(
    `/api/gamification/workspaces/${workspaceId}/refresh`,
    { method: 'POST' },
  );
}

// ── PART 10: Explainability DTOs ──────────────────────────────────────────────

export interface GamificationXPEventExplain {
  id: string;
  eventType: string;
  baseXp: number;
  effectiveXp: number;
  qualityMultiplier: number;
  collaborationMultiplier: number;
  diminished: boolean;
  blocked: boolean;
  cooldownKey: string | null;
  explain: string;
  createdAt: string;
}

export interface GamificationStreakExplain {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  graceUsedAt: string | null;
  inRecovery: boolean;
  nextMilestone: number | null;
  xpToNextMilestone: number | null;
}

export interface GamificationScoreExplain {
  userId: string;
  workspaceId?: string;
  generatedAt: string;
  xp: {
    total: number;
    level: number;
    levelLabel: string;
    xpToNextLevel: number;
    levelProgress: number;
    recentEvents: GamificationXPEventExplain[];
  };
  streak: GamificationStreakExplain;
  readiness: GamificationReadinessSummary | null;
  contribution: GamificationContributionSummary | null;
  momentum: GamificationMomentumSummary | null;
  mentorMetrics: GamificationMentorMetrics | null;
  humanSummary: string;
}

export interface GamificationContributionPercentile {
  percentile: number;
  cohortSize: number;
  roleGroup: string;
}

export async function getMyScoreExplain(): Promise<GamificationScoreExplain> {
  return apiRequest(`/api/gamification/users/me/explain`);
}

export async function getWorkspaceScoreExplain(
  workspaceId: string,
): Promise<GamificationScoreExplain> {
  return apiRequest(`/api/gamification/workspaces/${workspaceId}/explain/me`);
}

export async function getMyContributionPercentile(
  workspaceId: string,
): Promise<GamificationContributionPercentile> {
  return apiRequest(
    `/api/gamification/workspaces/${workspaceId}/contributions/me/percentile`,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE G4 — ADMIN INTELLIGENCE LAYER
// ══════════════════════════════════════════════════════════════════════════════

// ── Score Inspection ──────────────────────────────────────────────────────────

export interface AdminXPBreakdownItem {
  id: string;
  eventType: string;
  baseXp: number;
  finalXp: number;
  weightMultiplier: number;
  isDiminished: boolean;
  cooldownKey: string | null;
  explain: string;
  createdAt: string;
}

export interface AdminBadgeInspectItem {
  badgeId: string;
  name: string;
  category: string;
  rarity: string;
  awardedAt: string;
  seen: boolean;
}

export interface AdminStreakInspect {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  graceUsedAt: string | null;
}

export interface AdminContributionInspect {
  workspaceId: string;
  score: number;
  breakdown: Record<string, unknown>;
  updatedAt: string;
}

export interface AdminAnomalySignal {
  flagId: string;
  type: string;
  severity: number;
  description: string | null;
  status: string;
  createdAt: string;
}

export interface AdminScoreInspectReport {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  totalXp: number;
  level: number;
  levelLabel: string;
  xpByEventType: Record<string, { count: number; totalXp: number; avgXp: number }>;
  recentEvents: AdminXPBreakdownItem[];
  badges: AdminBadgeInspectItem[];
  streak: AdminStreakInspect | null;
  contributions: AdminContributionInspect[];
  anomalies: AdminAnomalySignal[];
  suppressedUntil: string | null;
  humanSummary: string;
}

export interface XPDistributionBucket {
  bucket: string;
  count: number;
}

export interface BadgeUnlockRate {
  badgeId: string;
  name: string;
  category: string;
  rarity: string;
  unlockCount: number;
  unlockRate: number;
}

export async function adminInspectUserScore(userId: string): Promise<AdminScoreInspectReport> {
  return apiRequest(`/api/admin/score/${userId}`);
}

export async function adminGetXPDistribution(): Promise<XPDistributionBucket[]> {
  return apiRequest(`/api/admin/score/platform/xp-distribution`);
}

export async function adminGetBadgeUnlockRates(): Promise<BadgeUnlockRate[]> {
  return apiRequest(`/api/admin/score/platform/badge-rates`);
}

// ── Abuse Monitoring ──────────────────────────────────────────────────────────

export interface AbuseFlagRecord {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  type: string;
  severity: number;
  description: string | null;
  metadata: Record<string, unknown>;
  status: string;
  resolvedAt: string | null;
  resolvedById: string | null;
  actionTaken: string | null;
  createdAt: string;
}

export interface AbuseStats {
  totalFlags: number;
  pendingFlags: number;
  actionedFlags: number;
  dismissedFlags: number;
  byType: Record<string, number>;
  topOffenders: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    flagCount: number;
    maxSeverity: number;
  }>;
}

export interface AbuseFlagListResult {
  flags: AbuseFlagRecord[];
  total: number;
}

export async function adminListAbuseFlags(params?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<AbuseFlagListResult> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.type) qs.set('type', params.type);
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.offset != null) qs.set('offset', String(params.offset));
  return apiRequest(`/api/admin/abuse?${qs}`);
}

export async function adminGetAbuseStats(): Promise<AbuseStats> {
  return apiRequest(`/api/admin/abuse/stats`);
}

export async function adminResolveAbuseFlag(
  flagId: string,
  action: string,
  status: 'actioned' | 'dismissed',
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/abuse/${flagId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action, status }),
  });
}

export async function adminRunAbuseDetection(userId: string): Promise<unknown> {
  return apiRequest(`/api/admin/abuse/run-detection/${userId}`, { method: 'POST' });
}

// ── Experiments ───────────────────────────────────────────────────────────────

export interface ExperimentRecord {
  id: string;
  name: string;
  description: string | null;
  key: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  splitRatio: number;
  active: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdById: string | null;
  createdAt: string;
  assignmentCount: number;
  variantACounts: number;
  variantBCounts: number;
}

export interface ExperimentMetrics {
  experimentId: string;
  name: string;
  variantACounts: number;
  variantBCounts: number;
  variantAXpAvg: number;
  variantBXpAvg: number;
  variantABadgeRate: number;
  variantBBadgeRate: number;
  variantARetention7d: number;
  variantBRetention7d: number;
}

export async function adminListExperiments(): Promise<ExperimentRecord[]> {
  return apiRequest(`/api/admin/experiments`);
}

export async function adminCreateExperiment(body: {
  name: string;
  description?: string;
  key: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  splitRatio?: number;
}): Promise<ExperimentRecord> {
  return apiRequest(`/api/admin/experiments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function adminUpdateExperiment(
  id: string,
  body: Partial<{
    name: string;
    description: string;
    variantA: Record<string, unknown>;
    variantB: Record<string, unknown>;
    splitRatio: number;
  }>,
): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/experiments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function adminActivateExperiment(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/experiments/${id}/activate`, { method: 'POST' });
}

export async function adminDeactivateExperiment(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/admin/experiments/${id}/deactivate`, { method: 'POST' });
}

export async function adminGetExperimentMetrics(id: string): Promise<ExperimentMetrics> {
  return apiRequest(`/api/admin/experiments/${id}/metrics`);
}

export async function adminDeleteExperiment(id: string): Promise<void> {
  return apiRequest(`/api/admin/experiments/${id}`, { method: 'DELETE' });
}

// ── System Config ─────────────────────────────────────────────────────────────

export interface SystemConfigRecord {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  category: string | null;
  updatedById: string | null;
  updatedAt: string;
}

export async function adminListConfigs(category?: string): Promise<SystemConfigRecord[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiRequest(`/api/admin/config${qs}`);
}

export async function adminUpsertConfig(
  key: string,
  body: { value: unknown; description?: string; category?: string },
): Promise<SystemConfigRecord> {
  return apiRequest(`/api/admin/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function adminDeleteConfig(key: string): Promise<void> {
  return apiRequest(`/api/admin/config/${encodeURIComponent(key)}`, { method: 'DELETE' });
}

export async function adminSeedDefaultConfigs(): Promise<{ seeded: number }> {
  return apiRequest(`/api/admin/config/seed`, { method: 'POST' });
}

// ════════════════════════════════════════════════════════════════════════════
// BEHAVIORAL AI OPTIMIZER — Types & Fetch Functions
// ════════════════════════════════════════════════════════════════════════════

export type BehavioralStateKey =
  | 'newly_onboarded'
  | 'profile_incomplete'
  | 'exploring'
  | 'matching_focused'
  | 'artifact_building'
  | 'stuck'
  | 'feedback_processing'
  | 'high_momentum'
  | 'review_ready'
  | 'readiness_plateaued';

export interface NextAction {
  key: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  surface: string;
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
}

export interface NextActionResponse {
  action: NextAction | null;
  state: BehavioralStateKey;
  confidence?: number;
  reason?: string;
  cooldownEndsAt?: string;
}

export interface BehavioralStateResponse {
  state: BehavioralStateKey;
  confidence: number;
  signals: {
    userId: string;
    profileCompletionPct: number;
    connectionCount: number;
    boardCount: number;
    docCount: number;
    totalXp: number;
    currentStreak: number;
    daysSinceLastActivity: number;
    readinessScore: number;
    pendingReviewCount: number;
    workspaceCount: number;
  };
  reason: string;
}

export interface BehaviorNudgeStatsKey {
  key: string;
  shown: number;
  converted: number;
  dismissed: number;
}

export interface BehaviorPlatformStats {
  totalShown: number;
  totalDismissed: number;
  totalConverted: number;
  conversionRate: number;
  dismissalRate: number;
  byKey: BehaviorNudgeStatsKey[];
}

export interface BehaviorNudgeLog {
  id: string;
  nudgeKey: string;
  surface: string;
  shown: boolean;
  dismissed: boolean;
  converted: boolean;
  convertedAt: string | null;
  dismissedAt: string | null;
  policyVersion: string | null;
  createdAt: string;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

export async function getNextAction(surface = 'dashboard'): Promise<NextActionResponse> {
  return apiRequest(`/api/behavior/next-action?surface=${surface}`);
}

export async function getBehaviorActions(n = 3): Promise<{ actions: NextAction[]; state: BehavioralStateKey }> {
  return apiRequest(`/api/behavior/actions?n=${n}`);
}

export async function getBehavioralState(): Promise<BehavioralStateResponse> {
  return apiRequest('/api/behavior/state');
}

export async function recordNudgeSeen(nudgeKey: string, surface: string): Promise<void> {
  return apiRequest('/api/behavior/nudge/seen', {
    method: 'POST',
    body: JSON.stringify({ nudgeKey, surface }),
  });
}

export async function recordNudgeDismissed(logId: string): Promise<void> {
  return apiRequest(`/api/behavior/nudge/${logId}/dismiss`, { method: 'POST' });
}

export async function recordNudgeConverted(logId: string): Promise<void> {
  return apiRequest(`/api/behavior/nudge/${logId}/convert`, { method: 'POST' });
}

export async function adminGetBehaviorStats(): Promise<BehaviorPlatformStats> {
  return apiRequest('/api/behavior/admin/stats');
}

export async function adminGetBehaviorNudgeLogs(userId: string, limit = 20): Promise<BehaviorNudgeLog[]> {
  return apiRequest(`/api/behavior/admin/nudge-logs?userId=${userId}&limit=${limit}`);
}

export async function adminClassifyUser(userId: string): Promise<BehavioralStateResponse> {
  return apiRequest(`/api/behavior/admin/classify/${userId}`);
}
