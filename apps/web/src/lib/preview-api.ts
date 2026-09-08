/** Static payloads so Cloudflare preview never waits on localhost:3001. */

const NOW = '2026-09-04T10:00:00.000Z';
const ME_ID = 'preview-demo-user';

const PREVIEW_AI_CONVERSATIONS: Array<{
  id: string;
  userId: string;
  agentId: string;
  title: string;
  messages: unknown[];
  createdAt: string;
  updatedAt: string;
}> = [];

const PREVIEW_BUILDER_WS_ID = 'preview-ws-harbor';

type PreviewBuilderDoc = {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  description?: string;
  content: Record<string, unknown>;
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'archived';
  completionPercent: number;
  aiGenerated: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

let previewBuilderDocs: PreviewBuilderDoc[] = [
  {
    id: 'preview-doc-idea',
    workspaceId: PREVIEW_BUILDER_WS_ID,
    type: 'idea_core',
    title: 'Idea Core',
    description: 'Problem, audience, and unique value — sample for preview.',
    content: {
      problemStatement: 'Founders waste weeks stitching matching, messaging, and fundraising tools.',
      targetAudience: 'Early-stage founders looking for a complementary cofounder',
      solution: 'One workspace that matches people and turns the idea into artifacts.',
      uniqueValue: 'Graph + readiness + builder in the same product',
    },
    status: 'in_progress',
    completionPercent: 35,
    aiGenerated: false,
    version: 2,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'preview-doc-bmc',
    workspaceId: PREVIEW_BUILDER_WS_ID,
    type: 'business_model_canvas',
    title: 'Business Model Canvas',
    description: 'Draft canvas — sample for preview.',
    content: {
      valueProposition: 'Faster path from idea to a shareable plan',
    },
    status: 'draft',
    completionPercent: 12,
    aiGenerated: false,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const PREVIEW_BUILDER_COLLABORATORS = [
  {
    id: 'preview-collab-owner',
    userId: ME_ID,
    role: 'owner',
    isActive: true,
    invitedAt: NOW,
    acceptedAt: NOW,
    user: {
      id: ME_ID,
      displayName: 'Alex Demo',
      email: 'demo@cofounderbay.com',
    },
  },
];

const PREVIEW_BUILDER_READINESS = {
  workspaceId: PREVIEW_BUILDER_WS_ID,
  overallScore: 42,
  overallStatus: 'needs-work',
  readinessLevel: 'early',
  dimensions: [
    { dimension: 'team', score: 48, maxScore: 100, status: 'needs-work', criteria: [], recommendations: ['Complete cofounder search on Discover'] },
    { dimension: 'market', score: 36, maxScore: 100, status: 'critical', criteria: [], recommendations: ['Run 5 customer interviews'] },
    { dimension: 'product', score: 40, maxScore: 100, status: 'needs-work', criteria: [], recommendations: ['Scope an MVP in Planner'] },
    { dimension: 'business', score: 28, maxScore: 100, status: 'critical', criteria: [], recommendations: ['Fill the Business Model Canvas'] },
    { dimension: 'funding', score: 22, maxScore: 100, status: 'critical', criteria: [], recommendations: ['Start a 10-slide pitch deck'] },
    { dimension: 'execution', score: 50, maxScore: 100, status: 'needs-work', criteria: [], recommendations: ['Set the next 30-day milestone'] },
  ],
  blockers: [
    'No customer interviews logged yet',
    'Business model still a draft',
  ],
  nextMilestones: [
    'Finish Idea Core problem and unique value',
    'Draft BMC value proposition and channels',
    'Book 5 discovery interviews',
  ],
  assessedAt: NOW,
};

type PreviewMilestone = {
  id: string;
  ownerId: string;
  collaboratorId: string | null;
  collaborator: { id: string; displayName: string; avatarUrl: string | null } | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  dueDate: string | null;
  completedAt: string | null;
  progress: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};


let previewMilestones: PreviewMilestone[] = [];

function previewMilestoneSummary() {
  const counts = { todo: 0, in_progress: 0, blocked: 0, completed: 0, cancelled: 0 };
  let overdue = 0;
  let dueSoon = 0;
  const now = Date.now();
  const soon = now + 7 * 24 * 60 * 60 * 1000;
  for (const m of previewMilestones) {
    counts[m.status] = (counts[m.status] ?? 0) + 1;
    if (m.dueDate && m.status !== 'completed' && m.status !== 'cancelled') {
      const due = new Date(m.dueDate).getTime();
      if (due < now) overdue += 1;
      else if (due <= soon) dueSoon += 1;
    }
  }
  const total = previewMilestones.length;
  return {
    counts,
    total,
    overdue,
    dueSoon,
    completionRate: total > 0 ? Math.round((counts.completed / total) * 100) : 0,
  };
}

function previewBuilderWorkspace() {
  return {
    id: PREVIEW_BUILDER_WS_ID,
    name: 'Harbor',
    slug: 'harbor',
    description: 'Sample workspace — preview demo, not live founder data.',
    status: 'active',
    visibility: 'private',
    startupName: 'Harbor',
    industry: 'SaaS',
    stage: 'pre-seed',
    targetMarket: 'Early-stage founders',
    createdAt: NOW,
    updatedAt: NOW,
    owner: {
      id: ME_ID,
      displayName: 'Alex Demo',
    },
    documentCount: previewBuilderDocs.length,
    collaboratorCount: PREVIEW_BUILDER_COLLABORATORS.length,
    overallReadiness: PREVIEW_BUILDER_READINESS.overallScore,
    documents: previewBuilderDocs,
    collaborators: PREVIEW_BUILDER_COLLABORATORS,
  };
}

const PEOPLE = [
  {
    id: 'hit-elena',
    userId: 'user-elena',
    displayName: 'Elena Papadopoulos',
    headline: 'Founder & CEO at Harbor',
    bio: 'Building the operating system for early-stage founders.',
    avatarUrl: null,
    location: 'Athens, Greece',
    role: 'founder',
    skillNames: ['Product', 'Growth', 'Fundraising'],
    skills: ['Product', 'Growth'],
    industries: ['SaaS'],
    matchScore: 92,
    matchReasons: ['Complementary skills', 'Same stage'],
    lookingFor: 'technical cofounder',
    availability: 'full-time',
  },
  {
    id: 'hit-marcus',
    userId: 'user-marcus',
    displayName: 'Marcus Chen',
    headline: 'Technical cofounder · Full-stack',
    bio: 'Ships MVPs in weeks. Looking for a complementary founder.',
    avatarUrl: null,
    location: 'Berlin, Germany',
    role: 'cofounder',
    skillNames: ['TypeScript', 'Next.js', 'AI'],
    skills: ['TypeScript', 'AI'],
    industries: ['Developer tools'],
    matchScore: 88,
    matchReasons: ['Skills overlap', 'Active this week'],
    lookingFor: 'business cofounder',
    availability: 'full-time',
  },
  {
    id: 'hit-sarah',
    userId: 'user-sarah',
    displayName: 'Dr. Sarah Kim',
    headline: 'Startup mentor · Ex-Google · 3x founder',
    bio: 'Helping first-time founders reach product-market fit.',
    avatarUrl: null,
    location: 'London, UK',
    role: 'mentor',
    skillNames: ['Mentoring', 'Go-to-market', 'Leadership'],
    skills: ['Mentoring', 'GTM'],
    industries: ['Marketplace'],
    matchScore: 81,
    matchReasons: ['Mentor match'],
    lookingFor: 'mentees',
    availability: 'part-time',
  },
  {
    id: 'hit-nikos',
    userId: 'user-nikos',
    displayName: 'Nikos Andreou',
    headline: 'Angel investor · Seed',
    bio: 'Invests in Mediterranean B2B SaaS at pre-seed and seed.',
    avatarUrl: null,
    location: 'Limassol, Cyprus',
    role: 'investor',
    skillNames: ['Investing', 'Networks'],
    skills: ['Investing'],
    industries: ['Fintech', 'SaaS'],
    matchScore: 76,
    matchReasons: ['Stage fit'],
    lookingFor: 'deal flow',
    availability: 'flexible',
  },
];

const SHORTLIST_IDS = new Set<string>(['user-marcus']);

const CONVERSATIONS = [
  {
    id: 'conv-elena',
    type: 'direct' as const,
    recipient: {
      id: 'user-elena',
      displayName: 'Elena Papadopoulos',
      headline: 'Founder & CEO at Harbor',
      avatarUrl: null,
      role: 'founder',
      isOnline: true,
      lastSeenAt: NOW,
    },
    lastMessage: {
      id: 'msg-elena-2',
      body: 'Want to compare notes on the research canvas this week?',
      senderId: 'user-elena',
      createdAt: NOW,
    },
    unreadCount: 1,
    isPinned: true,
    isArchived: false,
    updatedAt: NOW,
  },
  {
    id: 'conv-marcus',
    type: 'direct' as const,
    recipient: {
      id: 'user-marcus',
      displayName: 'Marcus Chen',
      headline: 'Technical cofounder',
      avatarUrl: null,
      role: 'cofounder',
      isOnline: false,
      lastSeenAt: '2026-09-03T18:20:00.000Z',
    },
    lastMessage: {
      id: 'msg-marcus-1',
      body: 'I sketched a Next.js + Nest starter we can reuse.',
      senderId: ME_ID,
      createdAt: '2026-09-03T18:20:00.000Z',
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    updatedAt: '2026-09-03T18:20:00.000Z',
  },
];

const MESSAGES: Record<string, Array<Record<string, unknown>>> = {
  'conv-elena': [
    {
      id: 'msg-elena-1',
      conversationId: 'conv-elena',
      senderId: ME_ID,
      body: 'Loved your Harbor update — the founder OS angle is sharp.',
      createdAt: '2026-09-03T16:00:00.000Z',
      sender: { id: ME_ID, displayName: 'Alex Demo', avatarUrl: null, role: 'founder' },
      attachments: [],
    },
    {
      id: 'msg-elena-2',
      conversationId: 'conv-elena',
      senderId: 'user-elena',
      body: 'Want to compare notes on the research canvas this week?',
      createdAt: NOW,
      sender: { id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: null, role: 'founder' },
      attachments: [],
    },
  ],
  'conv-marcus': [
    {
      id: 'msg-marcus-1',
      conversationId: 'conv-marcus',
      senderId: ME_ID,
      body: 'I sketched a Next.js + Nest starter we can reuse.',
      createdAt: '2026-09-03T18:20:00.000Z',
      sender: { id: ME_ID, displayName: 'Alex Demo', avatarUrl: null, role: 'founder' },
      attachments: [],
    },
  ],
};

const CONNECTIONS = [
  {
    id: 'conn-elena',
    requesterId: 'user-elena',
    receiverId: ME_ID,
    status: 'pending',
    message: 'Would love to swap intros in the Athens founder circle.',
    createdAt: NOW,
    updatedAt: NOW,
    requester: {
      id: 'user-elena',
      displayName: 'Elena Papadopoulos',
      avatarUrl: null,
      role: 'founder',
      headline: 'Founder & CEO at Harbor',
    },
    receiver: {
      id: ME_ID,
      displayName: 'Alex Demo',
      avatarUrl: null,
      role: 'founder',
      headline: 'Founder exploring CoFounderBay',
    },
  },
  {
    id: 'conn-sarah',
    requesterId: ME_ID,
    receiverId: 'user-sarah',
    status: 'accepted',
    message: 'Could we book a mentoring intro?',
    createdAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-02T09:00:00.000Z',
    requester: {
      id: ME_ID,
      displayName: 'Alex Demo',
      avatarUrl: null,
      role: 'founder',
      headline: 'Founder exploring CoFounderBay',
    },
    receiver: {
      id: 'user-sarah',
      displayName: 'Dr. Sarah Kim',
      avatarUrl: null,
      role: 'mentor',
      headline: 'Startup mentor · Ex-Google',
    },
  },
];

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'connection',
    title: 'Elena Papadopoulos sent a connection request',
    body: 'Would love to swap intros in the Athens founder circle.',
    link: '/connections',
    meta: {},
    createdAt: NOW,
    readAt: null,
  },
  {
    id: 'notif-2',
    type: 'message',
    title: 'New message from Elena Papadopoulos',
    body: 'Want to compare notes on the research canvas this week?',
    link: '/messages',
    meta: {},
    createdAt: NOW,
    readAt: null,
  },
  {
    id: 'notif-3',
    type: 'match',
    title: '3 new cofounder matches',
    body: 'Marcus Chen is a 88% skill complement.',
    link: '/matches',
    meta: {},
    createdAt: '2026-09-03T08:00:00.000Z',
    readAt: '2026-09-03T09:00:00.000Z',
  },
];

const FEED_POSTS = [
  {
    id: 'post-1',
    author: {
      id: 'user-elena',
      displayName: 'Elena Papadopoulos',
      headline: 'Founder & CEO at Harbor',
      role: 'founder',
    },
    type: 'milestone',
    content: 'Closed a €250K pre-seed. Next: first 100 users on the founder OS.',
    likes: 47,
    comments: 12,
    shares: 5,
    isLiked: false,
    isBookmarked: false,
    createdAt: NOW,
    tags: ['fundraising', 'preseed'],
  },
  {
    id: 'post-2',
    author: {
      id: 'user-marcus',
      displayName: 'Marcus Chen',
      headline: 'Technical cofounder',
      role: 'cofounder',
    },
    type: 'question',
    content: 'What is your go-to stack for MVPs in 2026 — Next.js + Nest or something leaner?',
    likes: 23,
    comments: 31,
    shares: 2,
    isLiked: true,
    isBookmarked: true,
    createdAt: '2026-09-03T08:15:00.000Z',
    tags: ['tech', 'mvp'],
  },
];

const ME_PROFILE = {
  profile: {
    id: 'preview-demo-profile',
    userId: ME_ID,
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
    updatedAt: NOW,
  },
  hasCompletedOnboarding: true,
};

const PREVIEW_MILESTONES: PreviewMilestone[] = [
  { id: 'ms-1', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Launch beta to first 20 users', description: 'Invite waitlist, instrument onboarding, collect qualitative feedback.', status: 'todo', priority: 'high', category: 'product', dueDate: '2026-09-10T17:00:00.000Z', completedAt: null, progress: 15, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-2', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Hire first engineer', description: 'Scorecard, three finalists, offer out.', status: 'todo', priority: 'medium', category: 'hiring', dueDate: '2026-10-15T17:00:00.000Z', completedAt: null, progress: 0, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-3', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'File trademark', description: null, status: 'todo', priority: 'low', category: 'other', dueDate: null, completedAt: null, progress: 0, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-4', ownerId: ME_ID, collaboratorId: 'user-elena', collaborator: { id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: null }, title: 'Close seed round', description: 'Term sheet in, data room current, 8 meetings booked.', status: 'in_progress', priority: 'high', category: 'fundraising', dueDate: '2026-08-20T17:00:00.000Z', completedAt: null, progress: 55, notes: 'Two angels waiting on traction slide.', createdAt: NOW, updatedAt: NOW },
  { id: 'ms-5', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Ship onboarding checklist', description: 'Founder can finish setup without a call.', status: 'in_progress', priority: 'medium', category: 'product', dueDate: '2026-09-12T17:00:00.000Z', completedAt: null, progress: 40, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-6', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Sign university MoU', description: 'Pilot cohort of 12 teams.', status: 'blocked', priority: 'high', category: 'partnerships', dueDate: '2026-10-01T17:00:00.000Z', completedAt: null, progress: 20, notes: 'Legal review stalled.', createdAt: NOW, updatedAt: NOW },
  { id: 'ms-7', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Publish landing page', description: null, status: 'completed', priority: 'medium', category: 'growth', dueDate: '2026-07-01T17:00:00.000Z', completedAt: '2026-06-28T12:00:00.000Z', progress: 100, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-8', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'First mentor office hours', description: null, status: 'completed', priority: 'low', category: 'growth', dueDate: '2026-07-15T17:00:00.000Z', completedAt: '2026-07-14T12:00:00.000Z', progress: 100, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-9', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'BMC v1 in Builder', description: null, status: 'completed', priority: 'medium', category: 'product', dueDate: '2026-06-20T17:00:00.000Z', completedAt: '2026-06-18T12:00:00.000Z', progress: 100, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-10', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Pitch deck outline', description: null, status: 'completed', priority: 'high', category: 'fundraising', dueDate: '2026-08-01T17:00:00.000Z', completedAt: '2026-07-30T12:00:00.000Z', progress: 100, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-11', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Readiness score above 40', description: null, status: 'completed', priority: 'medium', category: 'other', dueDate: '2026-08-10T17:00:00.000Z', completedAt: '2026-08-08T12:00:00.000Z', progress: 100, notes: null, createdAt: NOW, updatedAt: NOW },
  { id: 'ms-12', ownerId: ME_ID, collaboratorId: null, collaborator: null, title: 'Intro call with first accelerator', description: null, status: 'completed', priority: 'low', category: 'partnerships', dueDate: '2026-08-25T17:00:00.000Z', completedAt: '2026-08-22T12:00:00.000Z', progress: 100, notes: null, createdAt: NOW, updatedAt: NOW },
];

previewMilestones = PREVIEW_MILESTONES;

function pathnameOf(path: string) {
  return path.split('?')[0] ?? path;
}

/* ── Analytics ──
   Shapes here mirror UserMetrics / AnalyticsProfileView / AnalyticsEngagement /
   AnalyticsTopContent / WeeklySummary in `lib/api.ts`. Before these existed the
   analytics endpoints fell through to `kitchenSink()`, which answers with a
   truthy grab-bag that has no `metrics` key — so `if (overview)` passed and the
   page then crashed on the first nested read. */
const PREVIEW_USER_METRICS = {
  profileViews: 248,
  profileViewsChange: 12,
  newConnections: 17,
  newConnectionsChange: 5,
  messagesSent: 63,
  messagesSentChange: -8,
  engagementRate: 34,
  engagementRateChange: 3,
  searchAppearances: 91,
  searchAppearancesChange: 0,
  activityScore: 72,
  activityScoreChange: 6,
};

function previewProfileViews() {
  const seed = [31, 27, 44, 38, 52, 29, 27];
  return seed.map((views, i) => {
    const d = new Date(Date.now() - (seed.length - 1 - i) * 86_400_000);
    return {
      date: d.toISOString().slice(0, 10),
      views,
      uniqueVisitors: Math.max(1, Math.round(views * 0.62)),
    };
  });
}

const PREVIEW_ANALYTICS_OVERVIEW = {
  metrics: PREVIEW_USER_METRICS,
  profileViews: previewProfileViews(),
  engagement: { connections: 17, messages: 63, likes: 128, comments: 41, shares: 12 },
  topContent: [
    { id: 'post-gtm', type: 'post' as const, title: 'How we picked our first 10 design partners', views: 412, engagement: 63, date: NOW },
    { id: 'post-hiring', type: 'post' as const, title: 'What I look for in a technical co-founder', views: 287, engagement: 48, date: NOW },
    { id: 'profile-me', type: 'profile' as const, title: 'Profile view spike after demo day', views: 154, engagement: 22, date: NOW },
  ],
  weeklySummary: {
    mostActiveDay: 'Tuesday',
    peakHour: '14:00–15:00',
    avgResponseTime: '3h 20m',
    totalInteractions: 261,
  },
};

function kitchenSink() {
  return {
    ok: true,
    success: true,
    items: [],
    data: [],
    results: [],
    hits: PEOPLE,
    suggestions: PEOPLE,
    posts: FEED_POSTS,
    notifications: NOTIFICATIONS,
    conversations: CONVERSATIONS,
    connections: CONNECTIONS,
    boards: [
      {
        id: 'board-gtm',
        ownerId: ME_ID,
        title: 'Go-to-market canvas',
        description: 'Sample research board for the preview.',
        visibility: 'private',
        canvasState: {},
        tags: ['gtm'],
        color: '#6366f1',
        icon: 'flask',
        isPinned: true,
        isArchived: false,
        nodeCount: 6,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    events: [],
    members: [],
    users: [],
    groups: [],
    jobs: [],
    opportunities: [],
    programs: [],
    milestones: [],
    subscription: null,
    profile: ME_PROFILE.profile,
    total: PEOPLE.length,
    hasMore: false,
    nextCursor: null,
    count: 2,
    enabled: false,
    accounts: [],
    ids: [],
    skills: [
      { id: 'product', name: 'Product', slug: 'product', category: 'business' },
      { id: 'growth', name: 'Growth', slug: 'growth', category: 'business' },
      { id: 'typescript', name: 'TypeScript', slug: 'typescript', category: 'engineering' },
    ],
    agents: [
      {
        id: 'general',
        name: 'General assistant',
        description: 'Preview AI helper',
        suggestedQuestions: ['How do I find a cofounder?', 'What should I do next?'],
      },
    ],
    models: [],
    available: false,
    default: 'general',
  };
}

function parseBody(init?: RequestInit): Record<string, unknown> {
  try {
    if (typeof init?.body === 'string') return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return {};
}

/** Returns a payload for preview, or null to fall through (never used — always resolve). */
export function resolvePreviewApi(path: string, init?: RequestInit): unknown {
  const pathname = pathnameOf(path);
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = parseBody(init);

  if (pathname === '/api/auth/me') {
    return {
      user: {
        id: ME_ID,
        email: 'demo@cofounderbay.com',
        role: 'founder',
        emailVerified: true,
      },
    };
  }
  if (pathname === '/api/me/profile') {
    return ME_PROFILE;
  }
  if (pathname === '/api/auth/refresh' || pathname === '/api/auth/logout') {
    return { ok: true };
  }

  if (pathname.startsWith('/api/search/profiles') || pathname.startsWith('/api/v1/search')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const q = params.get('q')?.toLowerCase() ?? '';
    const location = params.get('location')?.toLowerCase() ?? '';
    const hits = PEOPLE.filter((p) => {
      const blob = `${p.displayName} ${p.headline} ${p.bio} ${p.skillNames.join(' ')} ${p.lookingFor} ${p.role}`.toLowerCase();
      const qOk = !q || q.split(/\s+/).every((token) => blob.includes(token) || p.location.toLowerCase().includes(token));
      const locOk = !location || p.location.toLowerCase().includes(location) || blob.includes(location);
      return qOk && locOk;
    });
    return { hits, results: hits, total: hits.length };
  }
  if (pathname.startsWith('/api/recommendations') || pathname.startsWith('/api/matching/recommendations')) {
    return { suggestions: PEOPLE };
  }

  if (pathname === '/api/messages/conversations') {
    return { conversations: CONVERSATIONS };
  }
  if (pathname === '/api/messages/conversations/direct' && method === 'POST') {
    return { conversationId: 'conv-elena' };
  }
  const messagesMatch = pathname.match(/^\/api\/messages\/conversations\/([^/]+)\/messages$/);
  if (messagesMatch) {
    return { messages: MESSAGES[messagesMatch[1]] ?? [] };
  }
  const validationMatch = pathname.match(/^\/api\/messages\/conversations\/([^/]+)\/validation/);
  if (validationMatch) {
    return {
      success: true,
      validationState: {
        mode: 'casual',
        initiatedBy: null,
        initiatedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        lastValidatedAt: null,
        validationHash: null,
        transcriptAvailable: false,
      },
    };
  }

  if (pathname === '/api/notifications' || pathname.startsWith('/api/notifications?')) {
    return { notifications: NOTIFICATIONS, nextCursor: null };
  }
  if (pathname === '/api/notifications/unread-count') {
    return { count: 2 };
  }

  if (pathname.startsWith('/api/connections')) {
    if (pathname.includes('/status/')) {
      return { status: 'pending', connectionId: 'conn-elena', direction: 'received' };
    }
    if (method === 'GET') {
      const type = new URLSearchParams(path.split('?')[1] ?? '').get('type');
      const connections =
        type === 'sent'
          ? CONNECTIONS.filter((c) => c.requesterId === ME_ID)
          : type === 'accepted'
            ? CONNECTIONS.filter((c) => c.status === 'accepted')
            : type === 'received'
              ? CONNECTIONS.filter((c) => c.receiverId === ME_ID && c.status === 'pending')
              : CONNECTIONS;
      return { connections };
    }
    if (method === 'POST') {
      const receiverId = String(body.receiverId ?? 'user-marcus');
      const person = PEOPLE.find((p) => p.userId === receiverId) ?? PEOPLE[1];
      const created = {
        id: `conn-${Date.now()}`,
        requesterId: ME_ID,
        receiverId: person.userId,
        status: 'pending',
        message: String(body.message ?? ''),
        createdAt: NOW,
        updatedAt: NOW,
        requester: {
          id: ME_ID,
          displayName: 'Alex Demo',
          avatarUrl: null,
          role: 'founder',
          headline: 'Founder exploring CoFounderBay',
        },
        receiver: {
          id: person.userId,
          displayName: person.displayName,
          avatarUrl: null,
          role: person.role,
          headline: person.headline,
        },
      };
      CONNECTIONS.unshift(created);
      return { connection: created, ok: true };
    }
    return { connection: CONNECTIONS[0], ok: true };
  }

  if (pathname === '/api/dashboard/stats') {
    return {
      activeProfiles: 1840,
      matchesThisWeek: 12,
      trendPercent: 18,
      chartData: [
        { label: 'Mon', value: 4 },
        { label: 'Tue', value: 7 },
        { label: 'Wed', value: 6 },
        { label: 'Thu', value: 9 },
        { label: 'Fri', value: 12 },
      ],
    };
  }
  if (pathname === '/api/dashboard/me') {
    return {
      pendingReceived: 1,
      totalConnections: 8,
      newConnectionsThisWeek: 2,
      unreadMessages: 1,
      unreadNotifications: 2,
      upcomingEvents: 3,
      activeMilestones: 4,
    };
  }
  if (pathname.startsWith('/api/dashboard/activity')) {
    return {
      items: [
        {
          id: 'act-1',
          type: 'connection',
          title: 'Elena Papadopoulos wants to connect',
          author: 'Elena Papadopoulos',
          timeAgo: '2h',
          href: '/connections',
          createdAt: NOW,
        },
        {
          id: 'act-2',
          type: 'match',
          title: 'New match: Marcus Chen',
          author: 'Marcus Chen',
          timeAgo: '1d',
          href: '/matches',
          createdAt: '2026-09-03T08:00:00.000Z',
        },
      ],
      total: 2,
      hasMore: false,
    };
  }
  if (pathname === '/api/dashboard/venture-readiness') {
    return {
      overall: 42,
      dimensions: [
        { key: 'team', label: 'Team', score: 50, weight: 1, href: '/profile' },
        { key: 'product', label: 'Product', score: 35, weight: 1, href: '/builder' },
        { key: 'market', label: 'Market', score: 40, weight: 1, href: '/research' },
      ],
      lowestDimension: { key: 'product', label: 'Product', score: 35, weight: 1, href: '/builder' },
      signals: { boardCount: 1, totalNodes: 6, docCount: 2, connectionCount: 8, sessionCount: 1 },
    };
  }

  if (pathname.startsWith('/api/feed/personalized')) {
    return { posts: FEED_POSTS, hasMore: false };
  }
  if (pathname === '/api/feed/preferences') {
    return {
      topics: ['fundraising', 'product'],
      roles: ['founder', 'mentor'],
      contentTypes: ['update', 'milestone', 'question'],
      interactionWeights: { likes: 1, comments: 1, shares: 1, bookmarks: 1 },
      timeDecayHours: 72,
      diversityBoost: 0.2,
    };
  }
  if (pathname.startsWith('/api/feed/trending')) {
    return {
      topics: [
        { tag: 'fundraising', posts: 42, engagement: 210, growth: 18 },
        { tag: 'ai', posts: 31, engagement: 180, growth: 24 },
      ],
    };
  }

  if (pathname === '/api/research/boards') {
    return kitchenSink().boards ? { boards: kitchenSink().boards } : { boards: [] };
  }
  if (pathname.startsWith('/api/research/boards/')) {
    const board = kitchenSink().boards[0];
    return { board: { ...board, nodes: [], connectors: [] } };
  }

  if (pathname === '/api/skills' || pathname.startsWith('/api/skills?')) {
    return kitchenSink().skills;
  }

  if (pathname === '/api/billing/subscription' || pathname.startsWith('/api/billing/subscription')) {
    return { subscription: null };
  }
  if (pathname.startsWith('/api/auth/2fa') || pathname.includes('two-factor')) {
    return { enabled: false };
  }
  if (pathname.includes('linked-accounts')) {
    return { accounts: [] };
  }

  if (pathname === '/api/roles/dashboard-context') {
    return {
      primaryRole: 'existing_founder',
      allRoles: [
        {
          id: 'preview-founder',
          roleType: 'existing_founder',
          scope: 'global',
          isPrimary: true,
          isVerified: true,
        },
      ],
      permissions: ['*'],
      dashboard: {
        defaultRoute: '/dashboard/founder',
        dashboardWidgets: [],
        sidebarItems: [],
        features: [],
      },
      organizations: [],
      tenants: [],
    };
  }

  if (pathname === '/api/shortlist/ids') {
    return { ids: [...SHORTLIST_IDS] };
  }
  if (pathname === '/api/shortlist' || pathname.startsWith('/api/shortlist?')) {
    if (method === 'POST') {
      const userId = String(body.userId ?? '');
      if (userId) SHORTLIST_IDS.add(userId);
      return { ok: true, saved: true, id: `sl-${userId || 'new'}` };
    }
    const items = PEOPLE.filter((p) => SHORTLIST_IDS.has(p.userId)).map((p) => ({
      id: `sl-${p.userId}`,
      userId: p.userId,
      note: null,
      savedAt: NOW,
      profile: {
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        headline: p.headline,
        role: p.role,
        location: p.location,
        skills: p.skills,
      },
    }));
    return { items, nextCursor: null };
  }
  if (pathname.startsWith('/api/shortlist/')) {
    const rest = pathname.replace('/api/shortlist/', '');
    const userId = rest.replace(/\/note$/, '');
    if (method === 'DELETE') {
      SHORTLIST_IDS.delete(userId);
      return { ok: true, saved: false };
    }
    if (method === 'PATCH') {
      return { ok: true };
    }
  }

  if (pathname === '/api/graph/me') {
    return {
      me: {
        id: ME_ID,
        displayName: 'Alex Demo',
        headline: 'Founder exploring CoFounderBay',
        role: 'founder',
        location: 'Athens, Greece',
        avatarUrl: null,
      },
      unreadMessages: 1,
      pendingIntros: 1,
      unreadNotifications: 2,
      readiness: { overall: 42, lowestLabel: 'Product', lowestHref: '/builder' },
      nextAction: { id: 'review-intros', label: 'Review pending intros', href: '/connections' },
    };
  }

  if (pathname === '/api/ai/health') {
    return { available: false, models: [] };
  }
  if (pathname === '/api/ai/agents') {
    return {
      agents: [
        {
          id: 'general',
          name: 'CoFounderBay Assistant',
          description: 'Search, intro, message, and navigate from one chat',
          suggestedQuestions: [
            'What should I do next?',
            'Find a technical cofounder in Athens',
            'Show my best matches',
          ],
        },
        {
          id: 'matching',
          name: 'Matching',
          description: 'Explain and act on cofounder matches',
          suggestedQuestions: ['Show my best matches', 'Connect with Elena'],
        },
      ],
    };
  }
  if (pathname === '/api/ai/models') {
    return { models: [], default: 'copilot' };
  }
  if (pathname === '/api/ai/preferences' || pathname.startsWith('/api/ai/preferences')) {
    return {
      preferences: {
        preferredModel: 'copilot',
        preferredProvider: 'platform',
        temperature: 0.7,
        maxTokens: 2048,
        responseStyle: 'concise',
        responseLanguage: 'en',
        useEmoji: false,
        enableStreaming: true,
        enableSuggestions: true,
        enableContextMemory: true,
        enableAutoSave: true,
        saveConversations: true,
        shareForTraining: false,
        anonymizeData: true,
        defaultAgent: 'general',
      },
    };
  }
  if (pathname === '/api/ai/conversations' && method === 'POST') {
    const conv = {
      id: `ai-conv-${Date.now()}`,
      userId: ME_ID,
      agentId: String(body.agentId ?? 'general'),
      title: String(body.title ?? 'New Conversation'),
      messages: [] as unknown[],
      createdAt: NOW,
      updatedAt: NOW,
    };
    PREVIEW_AI_CONVERSATIONS.unshift(conv);
    return { conversation: conv };
  }
  if (pathname === '/api/ai/conversations') {
    return { conversations: PREVIEW_AI_CONVERSATIONS };
  }
  const aiConvMatch = pathname.match(/^\/api\/ai\/conversations\/([^/]+)$/);
  if (aiConvMatch) {
    const conv = PREVIEW_AI_CONVERSATIONS.find((c) => c.id === aiConvMatch[1]);
    return { conversation: conv ?? PREVIEW_AI_CONVERSATIONS[0] ?? null, deleted: method === 'DELETE' };
  }
  if (pathname === '/api/ai/chat' || pathname === '/api/ai/chat/stream') {
    const text = String(body.message ?? '');
    return {
      message: text
        ? `Preview copilot received: “${text}”. Use the in-app assistant tools for live graph actions.`
        : 'Preview copilot is ready.',
      agent: 'general',
      model: 'copilot',
      fallback: true,
    };
  }
  if (pathname.startsWith('/api/ai/')) {
    return { ok: true, available: false, agents: [], models: [], conversations: PREVIEW_AI_CONVERSATIONS, messages: [] };
  }

  if (pathname === '/api/gamification/users/me/xp' || pathname.endsWith('/xp')) {
    return {
      userId: ME_ID,
      totalXp: 420,
      level: 3,
      levelLabel: 'Builder',
      xpToNextLevel: 80,
      levelProgress: 0.68,
      recentEvents: [],
      streak: { currentStreak: 4, longestStreak: 7, lastActiveDate: NOW },
    };
  }
  if (pathname === '/api/gamification/users/me/badges' || pathname.endsWith('/badges')) {
    return [
      {
        id: 'badge-early',
        key: 'early-adopter',
        name: 'Early adopter',
        description: 'Joined the preview',
        category: 'special',
        rarity: 'common',
        awardedAt: NOW,
      },
    ];
  }
  if (pathname === '/api/analytics/achievements') {
    return null;
  }
  if (pathname === '/api/builder/workspaces') {
    if (method === 'POST') return previewBuilderWorkspace();
    const ws = previewBuilderWorkspace();
    return {
      data: [ws],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1, hasMore: false },
    };
  }
  const builderWsMatch = pathname.match(/^\/api\/builder\/workspaces\/([^/]+)$/);
  if (builderWsMatch) {
    return previewBuilderWorkspace();
  }
  const builderActivityMatch = pathname.match(/^\/api\/builder\/workspaces\/([^/]+)\/activity$/);
  if (builderActivityMatch) {
    return {
      activities: [
        {
          id: 'preview-act-1',
          workspaceId: PREVIEW_BUILDER_WS_ID,
          action: 'document.updated',
          entityType: 'document',
          entityId: 'preview-doc-idea',
          metadata: { title: 'Idea Core' },
          createdAt: NOW,
          user: { id: ME_ID, displayName: 'Alex Demo' },
        },
        {
          id: 'preview-act-2',
          workspaceId: PREVIEW_BUILDER_WS_ID,
          action: 'workspace.created',
          entityType: 'workspace',
          entityId: PREVIEW_BUILDER_WS_ID,
          createdAt: NOW,
          user: { id: ME_ID, displayName: 'Alex Demo' },
        },
      ],
    };
  }
  const builderCollabMatch = pathname.match(/^\/api\/builder\/workspaces\/([^/]+)\/collaborators$/);
  if (builderCollabMatch) {
    if (method === 'POST') {
      const role = typeof body.role === 'string' ? body.role : 'viewer';
      const userId = typeof body.userId === 'string' ? body.userId : 'preview-guest';
      return {
        id: `preview-collab-${Date.now()}`,
        userId,
        role,
        isActive: true,
        invitedAt: new Date().toISOString(),
        user: {
          id: userId,
          displayName: userId,
          email: `${userId}@example.com`,
        },
      };
    }
    return PREVIEW_BUILDER_COLLABORATORS;
  }
  if (pathname === '/api/builder/readiness/assess' && method === 'POST') {
    return PREVIEW_BUILDER_READINESS;
  }
  if (pathname === '/api/builder/documents' && method === 'POST') {
    const type = typeof body.type === 'string' ? body.type : 'custom';
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled';
    const doc: PreviewBuilderDoc = {
      id: `preview-doc-${Date.now()}`,
      workspaceId: PREVIEW_BUILDER_WS_ID,
      type,
      title,
      content: {},
      status: 'draft',
      completionPercent: 0,
      aiGenerated: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    previewBuilderDocs = [doc, ...previewBuilderDocs];
    return doc;
  }
  const builderDocMatch = pathname.match(/^\/api\/builder\/documents\/([^/]+)$/);
  if (builderDocMatch) {
    const found = previewBuilderDocs.find((d) => d.id === builderDocMatch[1]);
    if ((method === 'PUT' || method === 'PATCH') && found) {
      const next = { ...found, ...body, updatedAt: new Date().toISOString() } as PreviewBuilderDoc;
      previewBuilderDocs = previewBuilderDocs.map((d) => (d.id === found.id ? next : d));
      return next;
    }
    return found ?? previewBuilderDocs[0];
  }

  if (pathname === '/api/milestones/summary') {
    return previewMilestoneSummary();
  }
  if (pathname === '/api/milestones') {
    if (method === 'POST') {
      const created: PreviewMilestone = {
        id: `preview-ms-${Date.now()}`,
        ownerId: ME_ID,
        collaboratorId: typeof body.collaboratorId === 'string' ? body.collaboratorId : null,
        collaborator: null,
        title: typeof body.title === 'string' ? body.title : 'Untitled milestone',
        description: typeof body.description === 'string' ? body.description : null,
        status: (body.status as PreviewMilestone['status']) || 'todo',
        priority: (body.priority as PreviewMilestone['priority']) || 'medium',
        category: typeof body.category === 'string' ? body.category : null,
        dueDate: typeof body.dueDate === 'string' ? body.dueDate : null,
        completedAt: body.status === 'completed' ? new Date().toISOString() : null,
        progress: typeof body.progress === 'number' ? body.progress : 0,
        notes: typeof body.notes === 'string' ? body.notes : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      previewMilestones = [created, ...previewMilestones];
      return created;
    }
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const status = params.get('status');
    const priority = params.get('priority');
    const category = params.get('category');
    const filtered = previewMilestones.filter((m) => {
      if (status && m.status !== status) return false;
      if (priority && m.priority !== priority) return false;
      if (category && m.category !== category) return false;
      return true;
    });
    return { milestones: filtered, nextCursor: null, total: filtered.length };
  }
  const milestoneMatch = pathname.match(/^\/api\/milestones\/([^/]+)$/);
  if (milestoneMatch) {
    const found = previewMilestones.find((m) => m.id === milestoneMatch[1]);
    if (method === 'DELETE') {
      previewMilestones = previewMilestones.filter((m) => m.id !== milestoneMatch[1]);
      return { ok: true };
    }
    if ((method === 'PATCH' || method === 'PUT') && found) {
      const next: PreviewMilestone = {
        ...found,
        ...body,
        id: found.id,
        ownerId: found.ownerId,
        updatedAt: new Date().toISOString(),
        completedAt:
          body.status === 'completed'
            ? found.completedAt ?? new Date().toISOString()
            : body.status
              ? null
              : found.completedAt,
      };
      previewMilestones = previewMilestones.map((m) => (m.id === found.id ? next : m));
      return next;
    }
    return found ?? previewMilestones[0];
  }

  if (pathname === '/api/analytics/overview') {
    return PREVIEW_ANALYTICS_OVERVIEW;
  }
  if (pathname === '/api/analytics/metrics') {
    return PREVIEW_USER_METRICS;
  }
  if (pathname === '/api/analytics/profile-views') {
    return PREVIEW_ANALYTICS_OVERVIEW.profileViews;
  }
  if (pathname === '/api/analytics/engagement') {
    return PREVIEW_ANALYTICS_OVERVIEW.engagement;
  }
  if (pathname === '/api/analytics/top-content') {
    return PREVIEW_ANALYTICS_OVERVIEW.topContent;
  }
  if (pathname === '/api/analytics/weekly-summary') {
    return PREVIEW_ANALYTICS_OVERVIEW.weeklySummary;
  }

  if (method !== 'GET') {
    return { ok: true, success: true, ...body, id: 'preview-mutation' };
  }

  // No handler matched. `kitchenSink()` answers with a truthy grab-bag, which is
  // useful for list screens but silently wrong for any endpoint that returns a
  // specific object: `if (data)` passes and the page crashes on the first nested
  // read instead. Surfacing it in dev turns that mystery crash into a one-line
  // "this endpoint has no preview handler".
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[preview-api] No demo handler for ${method} ${pathname} — returning the generic fallback. `
      + 'If a page reads a specific field off this response, add a handler with the real shape.',
    );
  }
  return kitchenSink();
}
