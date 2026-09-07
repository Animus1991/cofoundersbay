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

function pathnameOf(path: string) {
  return path.split('?')[0] ?? path;
}

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

  if (pathname === '/api/shortlist' || pathname.includes('shortlist')) {
    return { ids: ['user-marcus'] };
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

  if (method !== 'GET') {
    return { ok: true, success: true, ...body, id: 'preview-mutation' };
  }

  return kitchenSink();
}
