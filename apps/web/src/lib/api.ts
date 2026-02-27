const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type AuthUser = { id: string; email: string; role: string };
export type Tokens = { accessToken: string; refreshToken: string; expiresIn: number };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

function setStoredTokens(tokens: Tokens) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeReadErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: unknown; error?: unknown };
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  } catch {
    // ignore
  }
  return res.statusText || 'Request failed';
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
  return JSON.parse(text) as T;
}

let refreshInFlight: Promise<Tokens> | null = null;

async function refreshAccessToken(): Promise<Tokens> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new ApiError(401, 'Session expired');

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const msg = await safeReadErrorMessage(res);
    throw new ApiError(res.status, msg || 'Session expired');
  }
  return (await readJsonIfAny<Tokens>(res)) as Tokens;
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  opts?: { retryOn401?: boolean },
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getStoredToken();

  const headers = new Headers(init?.headers ?? {});
  const isForm = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (!headers.has('Content-Type') && !isForm) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && (opts?.retryOn401 ?? true)) {
    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const tokens = await refreshInFlight;
      setStoredTokens(tokens);

      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${tokens.accessToken}`);
      const retryRes = await fetch(url, { ...init, headers: retryHeaders });
      if (!retryRes.ok) {
        const msg = await safeReadErrorMessage(retryRes);
        throw new ApiError(retryRes.status, msg);
      }
      return (await readJsonIfAny<T>(retryRes)) as T;
    } catch (e) {
      clearStoredTokens();
      throw e;
    }
  }

  if (!res.ok) {
    const msg = await safeReadErrorMessage(res);
    throw new ApiError(res.status, msg);
  }
  return (await readJsonIfAny<T>(res)) as T;
}

export async function register(body: { email: string; password: string; role?: string }) {
  return apiRequest<{ user: AuthUser; tokens: Tokens }>(
    '/api/v1/auth/register',
    { method: 'POST', body: JSON.stringify(body) },
    { retryOn401: false },
  );
}

export async function login(body: { email: string; password: string }) {
  return apiRequest<{ user: AuthUser; tokens: Tokens }>(
    '/api/v1/auth/login',
    { method: 'POST', body: JSON.stringify(body) },
    { retryOn401: false },
  );
}

export async function refresh(refreshToken: string) {
  return apiRequest<Tokens>(
    '/api/v1/auth/refresh',
    { method: 'POST', body: JSON.stringify({ refreshToken }) },
    { retryOn401: false },
  );
}

export async function logout(accessToken: string, refreshToken: string | null) {
  await apiRequest<{ ok: true }>(
    '/api/v1/auth/logout',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    },
    { retryOn401: false },
  ).catch(() => {});
  clearStoredTokens();
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
  return apiRequest('/api/v1/me/profile');
}

export async function createProfile(body: Record<string, unknown>) {
  return apiRequest<OwnProfile>('/api/v1/me/profile', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProfile(body: Record<string, unknown>) {
  return apiRequest<OwnProfile>('/api/v1/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadAvatar(file: File): Promise<{ upload: { id: string; url: string } }> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/v1/uploads/avatar', {
    method: 'POST',
    body: form,
  });
}

export async function uploadMessageAttachment(
  file: File,
): Promise<{ upload: { id: string; url: string; mimeType: string | null; originalName: string | null; sizeBytes: number | null } }> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest('/api/v1/uploads/message-attachment', {
    method: 'POST',
    body: form,
  });
}

export async function getPublicProfile(userId: string, token?: string | null): Promise<PublicProfile> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return apiRequest<PublicProfile>(`/api/v1/profiles/${userId}`, { headers }, { retryOn401: false });
}

export async function listSkills(category?: string): Promise<Skill[]> {
  const sp = new URLSearchParams();
  if (category) sp.set('category', category);
  const url = `/api/v1/skills${sp.toString() ? `?${sp}` : ''}`;
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
  return apiRequest<{ hits: SearchHit[]; total: number }>(`/api/v1/search/profiles?${sp}`);
}

export async function getRecommendations(params?: { role?: string; limit?: number }): Promise<{ suggestions: SearchHit[] }> {
  const sp = new URLSearchParams();
  if (params?.role) sp.set('role', params.role);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/v1/recommendations${sp.toString() ? `?${sp}` : ''}`;
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
  return apiRequest('/api/v1/messages/conversations');
}

export async function getOrCreateDirectConversation(userId: string): Promise<{ conversationId: string }> {
  return apiRequest('/api/v1/messages/conversations/direct', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function listConversationMessages(conversationId: string, limit?: number): Promise<{ messages: MessageItem[] }> {
  const sp = new URLSearchParams();
  if (limit != null) sp.set('limit', String(limit));
  return apiRequest(`/api/v1/messages/conversations/${conversationId}/messages${sp.toString() ? `?${sp}` : ''}`);
}

export async function updateConversationFlags(
  conversationId: string,
  flags: { isPinned?: boolean; isArchived?: boolean },
): Promise<{ ok: true }> {
  return apiRequest(`/api/v1/messages/conversations/${conversationId}`, {
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
  const url = `/api/v1/notifications${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  return apiRequest(`/api/v1/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  return apiRequest('/api/v1/notifications/read-all', { method: 'POST' });
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
  return apiRequest('/api/v1/billing/subscription');
}

export async function createBillingCheckout(priceId?: string): Promise<{ url: string | null; id: string }> {
  return apiRequest('/api/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
}

export async function createBillingPortal(): Promise<{ url: string }> {
  return apiRequest('/api/v1/billing/portal', { method: 'POST' });
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
  return apiRequest('/api/v1/dashboard/stats');
}

export async function getDashboardActivity(params?: { limit?: number }): Promise<DashboardActivityItem[]> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/v1/dashboard/activity${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
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
  return apiRequest('/api/v1/polls/active', undefined, { retryOn401: false });
}

export async function votePoll(pollId: string, optionId: string): Promise<{ ok: true }> {
  return apiRequest(`/api/v1/polls/${pollId}/vote`, {
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
  creator: { displayName: string; avatarUrl: string | null };
  href?: string;
};

export async function listJobs(params?: { limit?: number }): Promise<{ jobs: JobPostingView[] }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const url = `/api/v1/jobs${sp.toString() ? `?${sp}` : ''}`;
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
  const url = `/api/v1/events${sp.toString() ? `?${sp}` : ''}`;
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
  return apiRequest('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function rsvpEvent(
  eventId: string,
  status: 'going' | 'interested' | 'not_going',
): Promise<{ ok: true; status: 'going' | 'interested' | 'not_going' }> {
  return apiRequest(`/api/v1/events/${eventId}/rsvp`, {
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
  const url = `/api/v1/mentor/availability${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function replaceMentorAvailability(
  slots: Array<{ weekday: number; startTime: string; endTime: string; timezone?: string }>,
): Promise<{ slots: MentorAvailabilitySlot[] }> {
  return apiRequest('/api/v1/mentor/availability', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  });
}

export async function listMentorBookings(
  scope?: 'all' | 'mentor' | 'mentee',
): Promise<{ bookings: MentorBookingItem[] }> {
  const sp = new URLSearchParams();
  if (scope) sp.set('scope', scope);
  const url = `/api/v1/mentor/bookings${sp.toString() ? `?${sp}` : ''}`;
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
  return apiRequest('/api/v1/mentor/bookings', {
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
  return apiRequest(`/api/v1/mentor/bookings/${bookingId}`, {
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
  return apiRequest('/api/v1/reports', {
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
  const url = `/api/v1/admin/reports${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function updateAdminReport(
  reportId: string,
  body: {
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    moderationStatus?: 'active' | 'suspended' | 'banned';
  },
): Promise<{ report: AdminReportItem }> {
  return apiRequest(`/api/v1/admin/reports/${reportId}`, {
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
  const url = `/api/v1/admin/users${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function updateAdminUserModeration(
  userId: string,
  moderationStatus: 'active' | 'suspended' | 'banned',
): Promise<{ ok: true }> {
  return apiRequest(`/api/v1/admin/users/${userId}/moderation-status`, {
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
  return apiRequest('/api/v1/connections', {
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
  const url = `/api/v1/connections${sp.toString() ? `?${sp}` : ''}`;
  return apiRequest(url);
}

export async function respondToConnectionRequest(
  connectionId: string,
  status: 'accepted' | 'declined',
): Promise<{ connection: ConnectionRequestItem }> {
  return apiRequest(`/api/v1/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getConnectionStatus(userId: string): Promise<{
  status: ConnectionStatus | null;
  connectionId: string | null;
  direction: 'sent' | 'received' | null;
}> {
  return apiRequest(`/api/v1/connections/status/${userId}`);
}

// --- Jobs (full CRUD) ---

export async function createJobPosting(body: {
  title: string;
  description?: string;
  role?: string;
  location?: string;
  isRemote?: boolean;
}): Promise<{ job: JobPostingView }> {
  return apiRequest('/api/v1/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getJobPosting(jobId: string): Promise<{ job: JobPostingView & { description: string | null; createdAt: string } }> {
  return apiRequest(`/api/v1/jobs/${jobId}`, undefined, { retryOn401: false });
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  await apiRequest(`/api/v1/jobs/${jobId}`, { method: 'DELETE' });
}
