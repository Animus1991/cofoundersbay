/** Static payloads so Cloudflare preview never waits on localhost:3001. */

import { mergeNodeMetadata } from './canvas/canvas-geometry';
import { DEMO_CRITERIA } from './readiness-demo';

const NOW = '2026-09-04T10:00:00.000Z';

function seedPreviewGtmNodes() {
  const base = {
    boardId: 'board-gtm',
    url: null as string | null,
    uploadId: null as string | null,
    upload: null as unknown,
    zIndex: 1,
    collapsed: false,
    locked: false,
    refEntityType: null as string | null,
    refEntityId: null as string | null,
    builderDocumentId: null as string | null,
    metadata: null as unknown,
    tags: [] as string[],
    createdAt: NOW,
    updatedAt: NOW,
  };
  return [
    { ...base, id: 'n-gtm-problem', type: 'note', title: 'Problem', content: '<p>Who experiences this, how painful is it, and how do they cope today?</p><p>Ποιος το βιώνει, πόσο πονάει, και πώς το λύνει σήμερα;</p>', posX: 80, posY: 80, width: 280, height: 200, color: '#FEF3C7' },
    { ...base, id: 'n-gtm-customer', type: 'note', title: 'Customer', content: '<p>Segment, jobs to be done, budget, and buying path.</p><p>Τμήμα, εργασίες, προϋπολογισμός και διαδρομή αγοράς.</p>', posX: 400, posY: 80, width: 280, height: 200, color: '#DBEAFE' },
    { ...base, id: 'n-gtm-channel', type: 'note', title: 'Channels', content: '<p>Where will the first 100 customers find you?</p><p>Πού θα σας βρουν οι πρώτοι 100 πελάτες;</p>', posX: 720, posY: 80, width: 280, height: 200, color: '#D1FAE5' },
    { ...base, id: 'n-gtm-offer', type: 'note', title: 'Offer', content: '<p>Pricing, packaging, and the first conversion moment.</p><p>Τιμή, συσκευασία και η πρώτη στιγμή μετατροπής.</p>', posX: 80, posY: 320, width: 280, height: 200, color: '#FCE7F3' },
    { ...base, id: 'n-gtm-comp', type: 'note', title: 'Competition', content: '<p>Direct, indirect, and the wedge you own.</p><p>Άμεσος, έμμεσος ανταγωνισμός και η δική σας διαφορά.</p>', posX: 400, posY: 320, width: 280, height: 200, color: '#FEE2E2' },
    { ...base, id: 'n-gtm-metrics', type: 'note', title: 'Metrics', content: '<p>Activation, retention, and the weekly number that proves GTM.</p><p>Ενεργοποίηση, διατήρηση και ο εβδομαδιαίος αριθμός που αποδεικνύει το GTM.</p>', posX: 720, posY: 320, width: 280, height: 200, color: '#EDE9FE' },
  ];
}

type PreviewGtmNode = ReturnType<typeof seedPreviewGtmNodes>[number];
type PreviewGtmConnector = {
  id: string;
  boardId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  color: string | null;
  style: string;
};

let previewGtmBoardNodes: PreviewGtmNode[] = seedPreviewGtmNodes();
let previewGtmConnectors: PreviewGtmConnector[] = [];
let previewGtmCanvasState: Record<string, unknown> = {};

function previewGtmBoardResponse() {
  const board = kitchenSink().boards[0];
  return {
    board: {
      ...board,
      canvasState: Object.keys(previewGtmCanvasState).length ? previewGtmCanvasState : board.canvasState,
      nodeCount: previewGtmBoardNodes.length,
      nodes: previewGtmBoardNodes,
      connectors: previewGtmConnectors,
    },
  };
}
const ME_ID = 'preview-demo-user';

type PreviewResearchComment = {
  id: string;
  nodeId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  commentType: string;
  resolved: boolean;
  posX: number | null;
  posY: number | null;
  parentId: string | null;
  author: { id: string; displayName: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
};

let previewResearchComments: PreviewResearchComment[] = [];

function makePreviewResearchComment(nodeId: string, body: Record<string, unknown>): PreviewResearchComment {
  const now = new Date().toISOString();
  return {
    id: `preview-cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nodeId,
    authorId: ME_ID,
    authorName: 'Alex Demo',
    authorAvatar: null,
    body: typeof body.body === 'string' ? body.body : '',
    commentType: typeof body.commentType === 'string' ? body.commentType : 'general',
    resolved: false,
    posX: typeof body.posX === 'number' ? body.posX : null,
    posY: typeof body.posY === 'number' ? body.posY : null,
    parentId: typeof body.parentId === 'string' ? body.parentId : null,
    author: { id: ME_ID, displayName: 'Alex Demo' },
    createdAt: now,
    updatedAt: now,
  };
}

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

/**
 * The recommendation each dimension carries when it is not yet done. These are
 * the Builder's own advice, keyed by dimension so they survive the scores being
 * derived rather than written out.
 */
const BUILDER_READINESS_ADVICE: Record<string, string> = {
  team: 'Complete cofounder search on Discover',
  market: 'Run 5 customer interviews',
  product: 'Scope an MVP in Planner',
  business: 'Fill the Business Model Canvas',
  funding: 'Start a 10-slide pitch deck',
  execution: 'Set the next 30-day milestone',
};

/** The same bands /readiness colours its dimension chips with. */
function readinessStatus(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'needs-work';
  return 'critical';
}

/**
 * Scored from DEMO_CRITERIA rather than written out again.
 *
 * This payload used to carry its own six numbers, which disagreed with the six
 * /readiness computes from the criteria - two answers to one question, a click
 * apart, under a link labelled "full readiness report". A dimension's score is
 * the weight of its completed criteria, which is exactly how the real endpoint
 * scores it, so the Builder and the report now move together.
 */
const PREVIEW_BUILDER_DIMENSIONS = Object.entries(DEMO_CRITERIA).map(([dimension, criteria]) => {
  const score = criteria.reduce((sum, c) => sum + (c.completed ? c.weight : 0), 0);
  return {
    dimension,
    score,
    maxScore: 100,
    status: readinessStatus(score),
    criteria: criteria.map((c) => ({ id: c.id, name: c.name, completed: c.completed, weight: c.weight })),
    recommendations: score >= 100 ? [] : [BUILDER_READINESS_ADVICE[dimension]].filter(Boolean),
  };
});

const PREVIEW_BUILDER_OVERALL = Math.round(
  PREVIEW_BUILDER_DIMENSIONS.reduce((sum, d) => sum + d.score, 0) /
    (PREVIEW_BUILDER_DIMENSIONS.length || 1),
);

const PREVIEW_BUILDER_READINESS = {
  workspaceId: PREVIEW_BUILDER_WS_ID,
  overallScore: PREVIEW_BUILDER_OVERALL,
  overallStatus: readinessStatus(PREVIEW_BUILDER_OVERALL),
  readinessLevel:
    PREVIEW_BUILDER_OVERALL >= 80 ? 'ready' : PREVIEW_BUILDER_OVERALL >= 55 ? 'developing' : 'early',
  dimensions: PREVIEW_BUILDER_DIMENSIONS,
  // Named from criteria that are actually still open, so the blockers cannot
  // outlive the work they describe.
  blockers: [
    ...(DEMO_CRITERIA.market ?? [])
      .filter((c) => !c.completed && /interview/i.test(c.name))
      .map(() => 'No customer interviews logged yet'),
    ...(DEMO_CRITERIA.business ?? [])
      .filter((c) => !c.completed && /pricing|unit economics/i.test(c.name))
      .slice(0, 1)
      .map(() => 'Business model still a draft'),
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
    lastSeenSecondsAgo: 120,
    joinedAt: '2026-02-11T09:00:00.000Z',
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
    lastSeenSecondsAgo: 240,
    joinedAt: '2026-06-03T09:00:00.000Z',
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
    lastSeenSecondsAgo: 9000,
    joinedAt: '2025-11-22T09:00:00.000Z',
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
    lastSeenSecondsAgo: null,
    joinedAt: '2026-09-01T09:00:00.000Z',
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

/*
 * Showcase areas. /events, /jobs, /groups and /opportunities used to fall
 * through to `kitchenSink()`, which answers with a truthy grab-bag: the pages
 * rendered empty, and their stat tiles fell back to invented copy ("40+").
 * These fixtures give each area a real, internally consistent world — the same
 * cast as the rest of the demo — so every count on screen is counted from the
 * rows below it.
 */
const PREVIEW_EVENT_HOSTS = {
  elena: { id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: null, role: 'founder' },
  marcus: { id: 'user-marcus', displayName: 'Marcus Chen', avatarUrl: null, role: 'investor' },
  sarah: { id: 'user-sarah', displayName: 'Dr. Sarah Kim', avatarUrl: null, role: 'mentor' },
  nikos: { id: 'user-nikos', displayName: 'Nikos Andreou', avatarUrl: null, role: 'founder' },
} as const;

type PreviewEvent = {
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
  host: { id: string; displayName: string; avatarUrl: string | null; role: string };
  viewerRsvp: 'going' | 'interested' | 'not_going' | null;
  isFeatured?: boolean;
};

const PREVIEW_EVENTS: PreviewEvent[] = [
  {
    id: 'ev-demo-day',
    title: 'Athens Demo Day — Seed Cohort 12',
    description: 'Twelve teams pitch to a room of pre-seed and seed investors, eight minutes each, followed by open networking.',
    eventType: 'demo_day', mode: 'in-person',
    startAt: '2026-09-11T16:00:00.000Z', endAt: '2026-09-11T18:30:00.000Z',
    timezone: 'Europe/Athens', location: 'Stegi, Athens', isOnline: false, meetingUrl: null,
    capacity: 120, coverImageUrl: null, attendeesCount: 84,
    host: PREVIEW_EVENT_HOSTS.elena, viewerRsvp: 'going', isFeatured: true,
  },
  {
    id: 'ev-office-hours',
    title: 'Fundraising Office Hours',
    description: 'Bring one slide and one question. Marcus reviews narrative, traction framing and the ask, live.',
    eventType: 'webinar', mode: 'online',
    startAt: '2026-09-09T15:00:00.000Z', endAt: '2026-09-09T16:00:00.000Z',
    timezone: 'Europe/Athens', location: null, isOnline: true, meetingUrl: 'https://meet.cofounderbay.com/office-hours',
    capacity: 100, coverImageUrl: null, attendeesCount: 47,
    host: PREVIEW_EVENT_HOSTS.marcus, viewerRsvp: 'interested',
  },
  {
    id: 'ev-discovery',
    title: 'Product Discovery Workshop',
    description: 'A working session on interview design, signal vs. noise in early feedback, and deciding what not to build.',
    eventType: 'workshop', mode: 'hybrid',
    startAt: '2026-09-17T09:00:00.000Z', endAt: '2026-09-17T12:00:00.000Z',
    timezone: 'Europe/Athens', location: 'Impact Hub, Athens', isOnline: true, meetingUrl: 'https://meet.cofounderbay.com/discovery',
    capacity: 40, coverImageUrl: null, attendeesCount: 32,
    host: PREVIEW_EVENT_HOSTS.sarah, viewerRsvp: null,
  },
  {
    id: 'ev-coffee',
    title: 'Founder Coffee — Thessaloniki',
    description: 'An informal morning meetup. No pitches, no agenda: whoever shows up sets the table.',
    eventType: 'networking', mode: 'in-person',
    startAt: '2026-09-24T07:30:00.000Z', endAt: '2026-09-24T09:00:00.000Z',
    timezone: 'Europe/Athens', location: 'Aristotelous Square, Thessaloniki', isOnline: false, meetingUrl: null,
    capacity: 25, coverImageUrl: null, attendeesCount: 18,
    host: PREVIEW_EVENT_HOSTS.nikos, viewerRsvp: null,
  },
  {
    id: 'ev-ai-features',
    title: 'Shipping AI Features Without a Data Team',
    description: 'What a two-person team can actually put in production: evaluation, cost control and the failure modes users forgive.',
    eventType: 'webinar', mode: 'online',
    startAt: '2026-10-01T17:00:00.000Z', endAt: '2026-10-01T18:00:00.000Z',
    timezone: 'Europe/Athens', location: null, isOnline: true, meetingUrl: 'https://meet.cofounderbay.com/ai-features',
    capacity: null, coverImageUrl: null, attendeesCount: 156,
    host: PREVIEW_EVENT_HOSTS.marcus, viewerRsvp: 'going',
  },
  {
    id: 'ev-saas-metrics',
    title: 'SaaS Metrics Meetup #14',
    description: 'Three founders open their dashboards and explain the number that changed their roadmap this quarter.',
    eventType: 'meetup', mode: 'in-person',
    startAt: '2026-10-08T17:30:00.000Z', endAt: '2026-10-08T20:00:00.000Z',
    timezone: 'Europe/Athens', location: 'Found.ation, Athens', isOnline: false, meetingUrl: null,
    capacity: 80, coverImageUrl: null, attendeesCount: 63,
    host: PREVIEW_EVENT_HOSTS.elena, viewerRsvp: null,
  },
  {
    id: 'ev-pitch-clinic',
    title: 'Pitch Clinic — Seed Narrative',
    description: 'Recorded session: rebuilding a deck around one claim, with two teams workshopped end to end.',
    eventType: 'workshop', mode: 'online',
    startAt: '2026-08-21T16:00:00.000Z', endAt: '2026-08-21T17:30:00.000Z',
    timezone: 'Europe/Athens', location: null, isOnline: true, meetingUrl: 'https://meet.cofounderbay.com/pitch-clinic',
    capacity: 60, coverImageUrl: null, attendeesCount: 54,
    host: PREVIEW_EVENT_HOSTS.sarah, viewerRsvp: 'going',
  },
  {
    id: 'ev-summer-mixer',
    title: 'Summer Founders Mixer',
    description: 'The July rooftop mixer — 91 founders, operators and angels from the Athens ecosystem.',
    eventType: 'networking', mode: 'in-person',
    startAt: '2026-07-10T18:00:00.000Z', endAt: '2026-07-10T21:00:00.000Z',
    timezone: 'Europe/Athens', location: 'Six d.o.g.s, Athens', isOnline: false, meetingUrl: null,
    capacity: 120, coverImageUrl: null, attendeesCount: 91,
    host: PREVIEW_EVENT_HOSTS.nikos, viewerRsvp: null,
  },
];

const PREVIEW_JOBS = [
  { id: 'job-founding-eng', title: 'Founding Engineer', role: 'engineering', location: 'Athens, Greece', isRemote: false, type: 'full-time', isFeatured: true, creator: { displayName: 'Elena Papadopoulos', avatarUrl: null } },
  { id: 'job-growth-lead', title: 'Growth Lead', role: 'marketing', location: 'Remote — EU time zones', isRemote: true, type: 'full-time', creator: { displayName: 'Marcus Chen', avatarUrl: null } },
  { id: 'job-product-designer', title: 'Product Designer (Founding)', role: 'design', location: 'Athens, Greece', isRemote: false, type: 'full-time', creator: { displayName: 'Elena Papadopoulos', avatarUrl: null } },
  { id: 'job-data-contract', title: 'Data Scientist — 3-month contract', role: 'data', location: 'Remote', isRemote: true, type: 'contract', creator: { displayName: 'Dr. Sarah Kim', avatarUrl: null } },
  { id: 'job-bizdev-see', title: 'Business Development, Southeast Europe', role: 'sales', location: 'Thessaloniki, Greece', isRemote: false, type: 'full-time', creator: { displayName: 'Nikos Andreou', avatarUrl: null } },
  { id: 'job-backend-intern', title: 'Backend Engineering Intern', role: 'engineering', location: 'Remote', isRemote: true, type: 'internship', creator: { displayName: 'Marcus Chen', avatarUrl: null } },
];

type PreviewGroup = {
  id: string; name: string; slug: string; description: string | null;
  privacy: 'public' | 'private' | 'secret'; category: string | null; tags: string[];
  coverImageUrl: string | null; avatarUrl: string | null;
  rules: { title: string; description: string }[];
  memberCount: number; postCount: number; eventCount: number;
  createdAt: string; updatedAt: string;
  createdBy: { id: string; displayName: string; avatarUrl: string | null; headline: string | null; role: string } | null;
  isMember: boolean; memberRole: 'owner' | 'admin' | 'moderator' | 'member' | null;
};

const PREVIEW_GROUP_RULES = [
  { title: 'Keep it specific', description: 'Ask about a real decision you are facing, not a hypothetical.' },
  { title: 'No cold pitching', description: 'Introductions are welcome in the monthly thread, not in every post.' },
];

const PREVIEW_GROUP_FOUNDERS = {
  elena: { id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: null, headline: 'Founder & CEO at Harbor', role: 'founder' },
  marcus: { id: 'user-marcus', displayName: 'Marcus Chen', avatarUrl: null, headline: 'Partner at Northbound', role: 'investor' },
  sarah: { id: 'user-sarah', displayName: 'Dr. Sarah Kim', avatarUrl: null, headline: 'ML lead and advisor', role: 'mentor' },
  nikos: { id: 'user-nikos', displayName: 'Nikos Andreou', avatarUrl: null, headline: 'Founder at Meltemi', role: 'founder' },
};

const PREVIEW_GROUPS: PreviewGroup[] = [
  { id: 'grp-athens-founders', name: 'Athens Founders', slug: 'athens-founders', description: 'The local room: hiring, landlords, accountants, and who is actually raising.', privacy: 'public', category: 'Local', tags: ['athens', 'community'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 428, postCount: 76, eventCount: 6, createdAt: '2025-03-14T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.elena, isMember: true, memberRole: 'member' },
  { id: 'grp-saas-metrics', name: 'SaaS Metrics Circle', slug: 'saas-metrics-circle', description: 'Monthly benchmark swaps. Bring your numbers, leave with context.', privacy: 'public', category: 'Industry', tags: ['saas', 'metrics'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 312, postCount: 54, eventCount: 3, createdAt: '2025-06-02T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.marcus, isMember: true, memberRole: 'moderator' },
  { id: 'grp-ai-builders', name: 'AI Builders EU', slug: 'ai-builders-eu', description: 'Practitioners shipping AI features in European products — evaluation, cost, and regulation.', privacy: 'public', category: 'Technology', tags: ['ai', 'engineering'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 1204, postCount: 180, eventCount: 9, createdAt: '2024-11-20T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.sarah, isMember: false, memberRole: null },
  { id: 'grp-preseed-fundraising', name: 'Pre-Seed Fundraising', slug: 'pre-seed-fundraising', description: 'Term sheets, SAFEs and cap tables, read by people who have signed them.', privacy: 'private', category: 'Fundraising', tags: ['fundraising', 'legal'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 186, postCount: 41, eventCount: 2, createdAt: '2025-01-09T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.marcus, isMember: false, memberRole: null },
  { id: 'grp-product-craft', name: 'Product & Design Craft', slug: 'product-design-craft', description: 'Critique threads for real screens, with the constraint that made them that way.', privacy: 'public', category: 'Product', tags: ['product', 'design'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 254, postCount: 33, eventCount: 1, createdAt: '2025-04-18T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.elena, isMember: false, memberRole: null },
  { id: 'grp-women-founders-gr', name: 'Women Founders Greece', slug: 'women-founders-greece', description: 'Peer support and introductions for women building companies in Greece.', privacy: 'public', category: 'Community', tags: ['community', 'greece'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 97, postCount: 12, eventCount: 4, createdAt: '2025-08-01T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.elena, isMember: false, memberRole: null },
  { id: 'grp-b2b-sales', name: 'B2B Sales for Technical Founders', slug: 'b2b-sales-technical-founders', description: 'Just opened. The first discussion thread goes up after the kickoff call.', privacy: 'public', category: 'Sales', tags: ['sales', 'b2b'], coverImageUrl: null, avatarUrl: null, rules: PREVIEW_GROUP_RULES, memberCount: 143, postCount: 0, eventCount: 0, createdAt: '2026-08-30T09:00:00.000Z', updatedAt: NOW, createdBy: PREVIEW_GROUP_FOUNDERS.nikos, isMember: false, memberRole: null },
];

const PREVIEW_OPPORTUNITIES = [
  { id: 'opp-technical-cofounder', title: 'Technical co-founder — vertical SaaS for logistics', description: 'Design partner signed, 14 interviews done, no engineer. Equity, not salary, until the pre-seed closes.', type: 'cofounder', company: 'Meltemi', location: 'Athens, Greece', isRemote: false, url: null, tags: ['cofounder', 'logistics', 'saas'], deadline: '2026-10-15T00:00:00.000Z', isActive: true, createdBy: { displayName: 'Nikos Andreou', avatarUrl: null }, createdAt: '2026-08-26T09:00:00.000Z' },
  { id: 'opp-fractional-cto', title: 'Fractional CTO — two days a week', description: 'Six-month engagement to take an existing prototype to production and hire the first two engineers.', type: 'job', company: 'Harbor', location: 'Remote — EU time zones', isRemote: true, url: null, tags: ['engineering', 'leadership'], deadline: '2026-09-30T00:00:00.000Z', isActive: true, createdBy: { displayName: 'Elena Papadopoulos', avatarUrl: null }, createdAt: '2026-08-29T09:00:00.000Z' },
  { id: 'opp-angel-syndicate', title: 'Angel syndicate — pre-seed allocation', description: 'Open allocation alongside a lead. Greek and Cypriot SaaS teams with a paying design partner.', type: 'investment', company: 'Northbound', location: 'Remote', isRemote: true, url: null, tags: ['fundraising', 'pre-seed'], deadline: '2026-11-01T00:00:00.000Z', isActive: true, createdBy: { displayName: 'Marcus Chen', avatarUrl: null }, createdAt: '2026-09-01T09:00:00.000Z' },
  { id: 'opp-design-partner', title: 'Design partner wanted — ops teams of 20 to 200', description: 'Free for six months in exchange for weekly feedback sessions and a public case study.', type: 'partnership', company: 'Harbor', location: 'Remote', isRemote: true, url: null, tags: ['partnership', 'b2b'], deadline: null, isActive: true, createdBy: { displayName: 'Elena Papadopoulos', avatarUrl: null }, createdAt: '2026-08-18T09:00:00.000Z' },
  { id: 'opp-mentor-ml', title: 'Mentorship — ML evaluation and cost control', description: 'Four sessions with a practitioner, for teams putting their first model in front of customers.', type: 'mentorship', company: null, location: 'Remote', isRemote: true, url: null, tags: ['ai', 'mentorship'], deadline: '2026-10-05T00:00:00.000Z', isActive: true, createdBy: { displayName: 'Dr. Sarah Kim', avatarUrl: null }, createdAt: '2026-09-02T09:00:00.000Z' },
  { id: 'opp-gtm-advisor', title: 'GTM advisor — Southeast Europe expansion', description: 'Advisory shares for someone who has sold B2B software into Greece, Romania and Bulgaria.', type: 'other', company: 'Meltemi', location: 'Thessaloniki, Greece', isRemote: false, url: null, tags: ['gtm', 'advisory'], deadline: null, isActive: true, createdBy: { displayName: 'Nikos Andreou', avatarUrl: null }, createdAt: '2026-07-22T09:00:00.000Z' },
];

/*
 * The investor's board. One row per startup, at whatever stage — the watchlist,
 * the pipeline and the portfolio read the same rows through different filters,
 * so the demo cannot show a company as invested on one screen and missing on
 * another.
 */
type PreviewDeal = {
  id: string;
  name: string;
  tagline: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
  logoUrl: string | null;
  companyStage: string | null;
  teamSize: number | null;
  pipelineStage: string;
  starred: boolean;
  alertsEnabled: boolean;
  notes: string | null;
  tags: string[];
  currency: string;
  askAmountCents: number | null;
  investedCents: number | null;
  currentValueCents: number | null;
  investedAt: string | null;
  status: string;
  lastActivityAt: string;
  createdAt: string;
  founder: { id: string; displayName: string; avatarUrl: string | null; headline: string | null } | null;
  recentEvents: Array<{ id: string; type: string; title: string; body: string | null; createdAt: string }>;
};

const PREVIEW_DEALS: PreviewDeal[] = [
  {
    id: 'deal-harbor', name: 'Harbor', tagline: 'The operating system for early-stage founders.',
    industry: 'SaaS', location: 'Athens, Greece', website: null, logoUrl: null,
    companyStage: 'seed', teamSize: 4, pipelineStage: 'negotiating', starred: true, alertsEnabled: true,
    notes: 'Term sheet out. Waiting on the traction slide.', tags: ['saas', 'b2b'],
    currency: 'EUR', askAmountCents: 75_000_000, investedCents: null, currentValueCents: null,
    investedAt: null, status: 'active',
    lastActivityAt: '2026-09-03T14:00:00.000Z', createdAt: '2026-05-02T09:00:00.000Z',
    founder: { id: 'user-elena', displayName: 'Elena Papadopoulos', avatarUrl: null, headline: 'Founder & CEO at Harbor' },
    recentEvents: [
      { id: 'ev-h1', type: 'stage_change', title: 'Moved to negotiating', body: null, createdAt: '2026-09-03T14:00:00.000Z' },
      { id: 'ev-h2', type: 'deck', title: 'Sent an updated deck', body: null, createdAt: '2026-08-27T10:00:00.000Z' },
    ],
  },
  {
    id: 'deal-meltemi', name: 'Meltemi', tagline: 'Vertical SaaS for logistics operators.',
    industry: 'Logistics', location: 'Thessaloniki, Greece', website: null, logoUrl: null,
    companyStage: 'pre_seed', teamSize: 2, pipelineStage: 'due_diligence', starred: true, alertsEnabled: true,
    notes: 'Design partner signed. No engineer yet.', tags: ['logistics', 'saas'],
    currency: 'EUR', askAmountCents: 25_000_000, investedCents: null, currentValueCents: null,
    investedAt: null, status: 'active',
    lastActivityAt: '2026-09-01T09:00:00.000Z', createdAt: '2026-06-14T09:00:00.000Z',
    founder: { id: 'user-nikos', displayName: 'Nikos Andreou', avatarUrl: null, headline: 'Founder at Meltemi' },
    recentEvents: [
      { id: 'ev-m1', type: 'milestone', title: 'First paying design partner', body: null, createdAt: '2026-09-01T09:00:00.000Z' },
    ],
  },
  {
    id: 'deal-aegis', name: 'Aegis Health', tagline: 'Triage support for community clinics.',
    industry: 'HealthTech', location: 'Patras, Greece', website: null, logoUrl: null,
    companyStage: 'seed', teamSize: 6, pipelineStage: 'invested', starred: false, alertsEnabled: true,
    notes: null, tags: ['health', 'ai'],
    currency: 'EUR', askAmountCents: 60_000_000, investedCents: 10_000_000, currentValueCents: 14_500_000,
    investedAt: '2026-02-11T09:00:00.000Z', status: 'active',
    lastActivityAt: '2026-08-20T09:00:00.000Z', createdAt: '2025-11-03T09:00:00.000Z',
    founder: null,
    recentEvents: [
      { id: 'ev-a1', type: 'update', title: 'Q2 update: 3 clinics live', body: null, createdAt: '2026-08-20T09:00:00.000Z' },
    ],
  },
  {
    id: 'deal-orion', name: 'Orion Grid', tagline: 'Demand response for small utilities.',
    industry: 'CleanTech', location: 'Remote', website: null, logoUrl: null,
    companyStage: 'series_a', teamSize: 14, pipelineStage: 'invested', starred: true, alertsEnabled: false,
    notes: null, tags: ['energy'],
    currency: 'EUR', askAmountCents: null, investedCents: 25_000_000, currentValueCents: 41_000_000,
    investedAt: '2025-09-30T09:00:00.000Z', status: 'active',
    lastActivityAt: '2026-07-18T09:00:00.000Z', createdAt: '2025-04-08T09:00:00.000Z',
    founder: null,
    recentEvents: [
      { id: 'ev-o1', type: 'fundraise', title: 'Closed a Series A extension', body: null, createdAt: '2026-07-18T09:00:00.000Z' },
    ],
  },
  {
    id: 'deal-kolo', name: 'Kolo Labs', tagline: 'Developer tooling for embedded teams.',
    industry: 'DevTools', location: 'Remote', website: null, logoUrl: null,
    companyStage: 'pre_seed', teamSize: 3, pipelineStage: 'discovered', starred: false, alertsEnabled: true,
    notes: 'Saw the demo day pitch. Worth a first call.', tags: ['devtools'],
    currency: 'EUR', askAmountCents: 20_000_000, investedCents: null, currentValueCents: null,
    investedAt: null, status: 'active',
    lastActivityAt: '2026-09-04T07:00:00.000Z', createdAt: '2026-09-02T09:00:00.000Z',
    founder: null,
    recentEvents: [
      { id: 'ev-k1', type: 'update', title: 'Added to the board', body: null, createdAt: '2026-09-02T09:00:00.000Z' },
    ],
  },
  {
    id: 'deal-thalia', name: 'Thalia', tagline: 'Booking and payments for independent studios.',
    industry: 'FinTech', location: 'Athens, Greece', website: null, logoUrl: null,
    companyStage: 'seed', teamSize: 5, pipelineStage: 'reviewing', starred: false, alertsEnabled: true,
    notes: null, tags: ['fintech', 'smb'],
    currency: 'EUR', askAmountCents: 45_000_000, investedCents: null, currentValueCents: null,
    investedAt: null, status: 'active',
    lastActivityAt: '2026-08-29T09:00:00.000Z', createdAt: '2026-07-21T09:00:00.000Z',
    founder: null,
    recentEvents: [
      { id: 'ev-t1', type: 'team', title: 'Hired a second engineer', body: null, createdAt: '2026-08-29T09:00:00.000Z' },
    ],
  },
  {
    id: 'deal-vela', name: 'Vela', tagline: 'Marketplace for refurbished lab equipment.',
    industry: 'Marketplace', location: 'Heraklion, Greece', website: null, logoUrl: null,
    companyStage: 'pre_seed', teamSize: 2, pipelineStage: 'passed', starred: false, alertsEnabled: false,
    notes: 'Passed — market too thin for the model as pitched.', tags: ['marketplace'],
    currency: 'EUR', askAmountCents: 15_000_000, investedCents: null, currentValueCents: null,
    investedAt: null, status: 'active',
    lastActivityAt: '2026-06-12T09:00:00.000Z', createdAt: '2026-04-30T09:00:00.000Z',
    founder: null,
    recentEvents: [
      { id: 'ev-v1', type: 'stage_change', title: 'Moved to passed', body: null, createdAt: '2026-06-12T09:00:00.000Z' },
    ],
  },
];

const PREVIEW_PIPELINE_STAGES = [
  'discovered', 'reviewing', 'meeting', 'due_diligence', 'negotiating', 'invested', 'passed',
] as const;

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
    const category = params.get('category') ?? 'all';
    const people = PEOPLE.filter((p) => {
      const blob = `${p.displayName} ${p.headline} ${p.bio} ${p.skillNames.join(' ')} ${p.lookingFor} ${p.role}`.toLowerCase();
      const qOk = !q || q.split(/\s+/).every((token) => blob.includes(token) || p.location.toLowerCase().includes(token));
      const locOk = !location || p.location.toLowerCase().includes(location) || blob.includes(location);
      return qOk && locOk;
    });
    const peopleHits = people.map((p) => ({
      id: p.userId,
      type: 'user' as const,
      title: p.displayName,
      subtitle: p.headline,
      description: p.bio,
      href: `/profiles/${p.userId}`,
      meta: { location: p.location },
      tags: p.skillNames,
    }));
    const mentors = peopleHits.filter((_, i) => people[i]?.role === 'mentor');
    const jobs = [
      {
        id: 'job-fullstack',
        type: 'job' as const,
        title: 'Technical cofounder',
        subtitle: 'Harbor · Full-time',
        description: 'Ship the founder OS. TypeScript, Next.js, Nest.',
        href: '/jobs',
        meta: { location: 'Athens / Remote' },
        tags: ['TypeScript', 'Next.js'],
      },
    ].filter((j) => !q || `${j.title} ${j.description} ${j.subtitle}`.toLowerCase().includes(q));
    const events = [
      {
        id: 'event-mixer',
        type: 'event' as const,
        title: 'Startup Networking Mixer',
        subtitle: 'Athens',
        description: 'Founders, mentors, and angels — one evening.',
        href: '/events',
        meta: { location: 'Athens' },
      },
    ].filter((e) => !q || `${e.title} ${e.description}`.toLowerCase().includes(q));
    const groups = [
      {
        id: 'group-founders',
        type: 'group' as const,
        title: 'Mediterranean Founders',
        subtitle: 'Community',
        description: 'Early-stage founders across GR / CY / the Med.',
        href: '/groups',
      },
    ].filter((g) => !q || `${g.title} ${g.description}`.toLowerCase().includes(q));
    const opportunities = [
      {
        id: 'opp-seed',
        type: 'opportunity' as const,
        title: 'Pre-seed office hours',
        subtitle: 'Harbor Angels',
        description: '15-minute intro slots for Mediterranean B2B SaaS.',
        href: '/opportunities',
      },
    ].filter((o) => !q || `${o.title} ${o.description}`.toLowerCase().includes(q));

    const results = category === 'all'
      ? [...peopleHits, ...jobs, ...events, ...groups, ...opportunities]
      : category === 'mentors'
        ? mentors
        : category === 'people'
          ? peopleHits
          : category === 'jobs'
            ? jobs
            : category === 'events'
              ? events
              : category === 'groups'
                ? groups
                : category === 'opportunities'
                  ? opportunities
                  : peopleHits;

    /*
     * Presence is a five-minute window on `lastSeenAt`, the same rule the API
     * and the directory header use. The fixtures carry an age rather than a
     * timestamp so the demo has someone online whenever it is opened, and the
     * header counts are derived from the very rows below them — the directory
     * cannot show "2 online" over a list where nobody has a dot.
     */
    const nowSeconds = Math.floor(Date.now() / 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const directoryHits = people.map((p) => ({
      ...p,
      createdAt: Math.floor(new Date(p.joinedAt).getTime() / 1000),
      lastSeenAt: p.lastSeenSecondsAgo == null ? null : nowSeconds - p.lastSeenSecondsAgo,
    }));

    return {
      hits: directoryHits,
      results,
      total: results.length,
      stats: {
        onlineNow: directoryHits.filter((p) => p.lastSeenAt != null && nowSeconds - p.lastSeenAt <= 300).length,
        newThisWeek: people.filter((p) => p.joinedAt >= weekAgo).length,
        mentors: people.filter((p) => p.role === 'mentor').length,
      },
      categories: {
        people: peopleHits.length,
        jobs: jobs.length,
        events: events.length,
        groups: groups.length,
        mentors: mentors.length,
        opportunities: opportunities.length,
      },
    };
  }
  // The match detail page (/matches/[userId]) reads this one, and it has to come
  // before the generic /api/recommendations branch below or it never matches.
  // Without it the page fell through to the generic fallback, whose object has no
  // `overall`, and every match rendered "Could not load compatibility data."
  // Shape must match MatchVsResult in lib/api.ts.
  if (/^\/api\/recommendations\/vs\//.test(pathname)) {
    const targetId = pathname.split('/').pop() ?? '';
    const target = PEOPLE.find((p) => p.userId === targetId) ?? PEOPLE[0];
    const score = target.matchScore ?? 80;
    return {
      overall: { score, confidence: Math.min(99, score + 4) },
      breakdown: [
        { key: 'skills', label: 'Skills', score: Math.min(100, score + 5), color: 'hsl(var(--status-success-fg))' },
        { key: 'stage', label: 'Stage', score: Math.max(0, score - 7), color: 'hsl(var(--status-info-fg))' },
        { key: 'industry', label: 'Industry', score: Math.min(100, score + 2), color: 'hsl(var(--status-accent-fg))' },
        { key: 'location', label: 'Location', score: Math.max(0, score - 18), color: 'hsl(var(--status-warning-fg))' },
        { key: 'values', label: 'Values', score: Math.max(0, score - 3), color: 'hsl(var(--status-success-fg))' },
      ],
      badges: ['Complementary skills', 'Same stage'],
      sharedStrengths: [
        { icon: 'target', label: 'Both focused on early-stage traction' },
        { icon: 'spark', label: 'Overlapping product instincts' },
      ],
      frictionPoints: [
        {
          icon: 'clock',
          title: 'Different time zones',
          description: 'Plan a fixed weekly overlap so decisions do not wait a day.',
        },
      ],
      workStyle: {
        axes: ['Pace', 'Structure', 'Risk', 'Detail', 'Autonomy'],
        source: [78, 62, 70, 55, 80],
        target: [70, 74, 58, 72, 66],
      },
      reasons: target.matchReasons ?? ['Complementary skills'],
      sourceProfile: {
        id: ME_ID,
        role: 'founder',
        displayName: 'Alex Demo',
        headline: 'Founder — building CoFounderBay',
        avatarUrl: undefined,
        location: 'Athens, Greece',
      },
      targetProfile: {
        id: target.userId,
        role: target.role,
        displayName: target.displayName,
        headline: target.headline,
        avatarUrl: target.avatarUrl ?? undefined,
        location: target.location,
      },
    };
  }
  /*
   * The compatibility modal reads the engine's per-dimension breakdown. In the
   * demo there is no engine, so the axes are computed here from the very
   * fields the two profiles show — skills held in common, industry, city — and
   * never from the overall score. A breakdown derived from its own summary is
   * the thing this endpoint exists to replace.
   */
  const vsMatch = pathname.match(/^\/api\/recommendations\/vs\/([^/]+)$/);
  if (vsMatch) {
    const target = PEOPLE.find((p) => p.userId === vsMatch[1] || p.id === vsMatch[1]);
    if (!target) return { error: 'Not found' };
    const mySkills = ME_PROFILE.profile.skills.map((sk) => sk.skillName.toLowerCase());
    const theirSkills = target.skillNames.map((n) => n.toLowerCase());
    const shared = theirSkills.filter((n) => mySkills.includes(n));
    const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
    const sameCity = target.location.split(',')[0]?.trim() === ME_PROFILE.profile.location.split(',')[0]?.trim();
    const sameCountry = target.location.split(',').pop()?.trim() === ME_PROFILE.profile.location.split(',').pop()?.trim();
    // A co-founder search rewards complement, not similarity: the skills axis
    // reads what they bring that the viewer does not.
    const complement = pct(theirSkills.length - shared.length, Math.max(theirSkills.length, 1));
    const axes = [
      { key: 'role', label: 'Role Complementarity', score: target.role === ME_PROFILE.profile.role ? 45 : 88, color: '#4ADE80' },
      { key: 'skills', label: 'Skills & Expertise', score: complement, color: '#22D3EE' },
      { key: 'semantic', label: 'Vision & Goals', score: target.matchScore ?? 50, color: '#F472B6' },
      { key: 'industry', label: 'Industry Alignment', score: target.industries.includes('SaaS') ? 82 : 40, color: '#FB923C' },
      { key: 'location', label: 'Location Fit', score: sameCity ? 100 : sameCountry ? 70 : 35, color: '#A78BFA' },
      { key: 'behavioral', label: 'Platform Activity', score: target.lastSeenSecondsAgo == null ? 30 : 85, color: '#34D399' },
    ];
    return {
      overall: {
        score: Math.round(axes.reduce((sum, ax) => sum + ax.score, 0) / axes.length),
        confidence: Math.min(95, 40 + theirSkills.length * 10),
      },
      breakdown: axes,
      badges: axes.filter((ax) => ax.score >= 80).map((ax) => ax.label).slice(0, 3),
      sharedStrengths: shared.length
        ? [`Both of you work on ${shared.join(' and ')}.`]
        : [],
      frictionPoints: sameCity ? [] : [`Different cities — ${target.location} and ${ME_PROFILE.profile.location}.`],
      reasons: target.matchReasons,
    };
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
    // Withdrawing a request the demo user sent. The showcase keeps no server
    // state, so it answers the shape the caller reads and nothing more.
    if (method === 'DELETE') {
      return { ok: true, connectionId: pathname.split('/')[3] ?? '' };
    }
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
      // Counted from the demo world rather than stated, so the /discover
      // header agrees with the directory and the groups list below it.
      founders: PEOPLE.filter((p) => p.role === 'founder').length,
      mentors: PEOPLE.filter((p) => p.role === 'mentor').length,
      successfulMatches: CONNECTIONS.length,
      communities: PREVIEW_GROUPS.length,
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
    /*
     * Platform engagement, not startup readiness - two different questions that
     * used to wear the same name here.
     *
     * This endpoint asks how much of the platform the founder has actually
     * used; /readiness asks how close the venture is to raising. This payload
     * once answered with three dimensions called Team, Product and Market -
     * three of the six names /readiness uses for the other question - so the
     * two screens looked like they disagreed about one number when they were
     * never measuring the same thing. The six below are the dimensions
     * `computeVentureReadiness` really returns, with its real weights.
     *
     * Every score is derived from `signals` with that method's own thresholds,
     * so the demo agrees with what the other demo screens show: one research
     * board holding six items (/research), two documents in one workspace
     * (/builder), eight connections and one mentoring session.
     */
    const signals = {
      boardCount: 1,
      totalNodes: 6,
      docCount: 2,
      connectionCount: 8,
      sessionCount: 1,
      recentConnectionCount: 2,
      eventRsvpCount: 2,
      groupCount: 2,
    };

    // 9 of the 10 profile checks - everything but "7+ skills", which is why the
    // profile-strength card says "Skills (5+)".
    const profileScore = 90;
    // 20 for having a board + 20 for five or more nodes.
    const researchScore = 40;
    // 20 for having a workspace + 20 for at least one document.
    const artifactScore = 40;
    // 15 + 15 for eight connections, + 20 for one session.
    const collaborationScore = 50;
    // 50 for at least one connection accepted in the last 14 days.
    const momentumScore = 50;
    // 25 for an event RSVP + 25 for a group membership.
    const ecosystemScore = 50;

    const dimensions = [
      { key: 'profile', label: 'Profile Depth', score: profileScore, weight: 15, href: '/profile' },
      { key: 'research', label: 'Research Depth', score: researchScore, weight: 20, href: '/research' },
      { key: 'artifacts', label: 'Artifact Quality', score: artifactScore, weight: 25, href: '/builder' },
      { key: 'collaboration', label: 'Collaboration', score: collaborationScore, weight: 20, href: '/connections' },
      { key: 'momentum', label: 'Momentum (14d)', score: momentumScore, weight: 10, href: '/activity' },
      { key: 'ecosystem', label: 'Ecosystem Engagement', score: ecosystemScore, weight: 10, href: '/events' },
    ];

    return {
      overall: Math.round(
        profileScore * 0.15 +
          researchScore * 0.2 +
          artifactScore * 0.25 +
          collaborationScore * 0.2 +
          momentumScore * 0.1 +
          ecosystemScore * 0.1,
      ),
      dimensions,
      lowestDimension: [...dimensions].sort((a, b) => a.score - b.score)[0],
      signals,
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
    if (path.includes('archived=1') || path.includes('archived=true')) {
      return { boards: [] };
    }
    return kitchenSink().boards ? { boards: kitchenSink().boards } : { boards: [] };
  }
  if (pathname.startsWith('/api/research/boards/')) {
    const rest = pathname.replace(/^\/api\/research\/boards\//, '');
    const segments = rest.split('/').filter(Boolean);
    if (segments[1] === 'nodes' && segments[2] === 'batch' && method === 'PATCH') {
      const updates = Array.isArray(body.updates) ? body.updates : [];
      previewGtmBoardNodes = previewGtmBoardNodes.map((node) => {
        const patch = updates.find((row) => row && typeof row === 'object' && (row as { id?: string }).id === node.id) as Record<string, unknown> | undefined;
        if (!patch) return node;
        return {
          ...node,
          posX: typeof patch.posX === 'number' ? patch.posX : node.posX,
          posY: typeof patch.posY === 'number' ? patch.posY : node.posY,
          width: typeof patch.width === 'number' ? patch.width : node.width,
          height: typeof patch.height === 'number' ? patch.height : node.height,
          zIndex: typeof patch.zIndex === 'number' ? patch.zIndex : node.zIndex,
          updatedAt: new Date().toISOString(),
        };
      });
      return { ok: true };
    }
    if (segments[1] === 'nodes' && method === 'POST') {
      const node: PreviewGtmNode = {
        ...seedPreviewGtmNodes()[0],
        id: `n-preview-${Date.now()}`,
        type: typeof body.type === 'string' ? body.type : 'note',
        title: typeof body.title === 'string' ? body.title : 'Note',
        content: typeof body.content === 'string' ? body.content : '',
        posX: typeof body.posX === 'number' ? body.posX : 80,
        posY: typeof body.posY === 'number' ? body.posY : 80,
        width: typeof body.width === 'number' ? body.width : 280,
        height: typeof body.height === 'number' ? body.height : 200,
        color: typeof body.color === 'string' ? body.color : null as unknown as string,
        metadata: body.metadata ?? null,
        locked: body.locked === true,
        collapsed: body.collapsed === true,
        zIndex: typeof body.zIndex === 'number' ? body.zIndex : 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      previewGtmBoardNodes = [...previewGtmBoardNodes, node];
      return { node };
    }
    if (segments[1] === 'connectors' && method === 'POST') {
      const connector: PreviewGtmConnector = {
        id: `c-preview-${Date.now()}`,
        boardId: 'board-gtm',
        fromNodeId: typeof body.fromNodeId === 'string' ? body.fromNodeId : '',
        toNodeId: typeof body.toNodeId === 'string' ? body.toNodeId : '',
        label: typeof body.label === 'string' ? body.label : null,
        color: typeof body.color === 'string' ? body.color : null,
        style: typeof body.style === 'string' ? body.style : 'solid',
      };
      previewGtmConnectors = [...previewGtmConnectors, connector];
      return { connector };
    }
    if (method === 'PATCH' || method === 'PUT') {
      if (body.canvasState && typeof body.canvasState === 'object') {
        previewGtmCanvasState = { ...previewGtmCanvasState, ...(body.canvasState as Record<string, unknown>) };
      }
      return previewGtmBoardResponse();
    }
    return previewGtmBoardResponse();
  }

  const nodeItemMatch = pathname.match(/^\/api\/research\/nodes\/([^/]+)$/);
  if (nodeItemMatch) {
    const nodeId = nodeItemMatch[1];
    if (method === 'DELETE') {
      previewGtmBoardNodes = previewGtmBoardNodes.filter((n) => n.id !== nodeId);
      previewGtmConnectors = previewGtmConnectors.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId);
      return { ok: true };
    }
    if (method === 'PATCH' || method === 'PUT') {
      let updated = previewGtmBoardNodes.find((n) => n.id === nodeId);
      previewGtmBoardNodes = previewGtmBoardNodes.map((node) => {
        if (node.id !== nodeId) return node;
        updated = {
          ...node,
          ...(typeof body.title === 'string' ? { title: body.title } : {}),
          ...(typeof body.content === 'string' ? { content: body.content } : {}),
          ...(typeof body.url === 'string' || body.url === null ? { url: body.url as string | null } : {}),
          ...(typeof body.posX === 'number' ? { posX: body.posX } : {}),
          ...(typeof body.posY === 'number' ? { posY: body.posY } : {}),
          ...(typeof body.width === 'number' ? { width: body.width } : {}),
          ...(typeof body.height === 'number' ? { height: body.height } : {}),
          ...(typeof body.zIndex === 'number' ? { zIndex: body.zIndex } : {}),
          ...(typeof body.color === 'string' || body.color === null ? { color: body.color as string } : {}),
          ...(typeof body.collapsed === 'boolean' ? { collapsed: body.collapsed } : {}),
          ...(typeof body.locked === 'boolean' ? { locked: body.locked } : {}),
          ...(body.metadata !== undefined ? { metadata: mergeNodeMetadata(node.metadata, body.metadata) } : {}),
          ...(Array.isArray(body.tags) ? { tags: body.tags as string[] } : {}),
          ...(typeof body.builderDocumentId === 'string' || body.builderDocumentId === null
            ? { builderDocumentId: body.builderDocumentId as string | null }
            : {}),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      });
      return { node: updated ?? previewGtmBoardNodes[0] };
    }
  }

  const connectorItemMatch = pathname.match(/^\/api\/research\/connectors\/([^/]+)$/);
  if (connectorItemMatch) {
    const connectorId = connectorItemMatch[1];
    if (method === 'DELETE') {
      previewGtmConnectors = previewGtmConnectors.filter((c) => c.id !== connectorId);
      return { ok: true };
    }
    if (method === 'PATCH') {
      previewGtmConnectors = previewGtmConnectors.map((c) =>
        c.id === connectorId
          ? {
              ...c,
              label: typeof body.label === 'string' ? body.label : c.label,
              color: typeof body.color === 'string' ? body.color : c.color,
              style: typeof body.style === 'string' ? body.style : c.style,
            }
          : c,
      );
      return { connector: previewGtmConnectors.find((c) => c.id === connectorId) };
    }
  }

  const nodeCommentsMatch = pathname.match(/^\/api\/research\/nodes\/([^/]+)\/comments$/);
  if (nodeCommentsMatch) {
    const nodeId = nodeCommentsMatch[1];
    if (method === 'GET') {
      const comments = previewResearchComments.filter((c) => c.nodeId === nodeId && !c.parentId);
      return {
        comments: comments.map((c) => ({
          ...c,
          replies: previewResearchComments.filter((r) => r.parentId === c.id),
        })),
      };
    }
    if (method === 'POST') {
      const comment = makePreviewResearchComment(nodeId, body);
      previewResearchComments = [...previewResearchComments, comment];
      return { comment };
    }
  }

  const commentItemMatch = pathname.match(/^\/api\/research\/comments\/([^/]+)$/);
  if (commentItemMatch) {
    const commentId = commentItemMatch[1];
    if (method === 'PATCH') {
      previewResearchComments = previewResearchComments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              body: typeof body.body === 'string' ? body.body : c.body,
              resolved: typeof body.resolved === 'boolean' ? body.resolved : c.resolved,
              updatedAt: new Date().toISOString(),
            }
          : c,
      );
      const comment = previewResearchComments.find((c) => c.id === commentId);
      return { comment: comment ?? makePreviewResearchComment('preview-node', body) };
    }
    if (method === 'DELETE') {
      previewResearchComments = previewResearchComments.filter((c) => c.id !== commentId && c.parentId !== commentId);
      return { ok: true };
    }
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
    // The server does two things with a `conversationId` that this layer
    // ignored: it appends both turns to the thread, and — if the thread is
    // still called "New Conversation" — it renames it after the first user
    // message (ai-conversation.service.ts:151, 50 chars + ellipsis). Without
    // either, every demo thread stayed "Νέα συνομιλία" forever and reopened
    // empty; the visitor's /ai sidebar was four identical rows. Same rule,
    // same truncation, so the two modes read alike.
    const convId = typeof body.conversationId === 'string' ? body.conversationId : null;
    const conv = convId ? PREVIEW_AI_CONVERSATIONS.find((c) => c.id === convId) : undefined;
    if (conv && text) {
      const reply = `Preview copilot received: “${text}”. Use the in-app assistant tools for live graph actions.`;
      const at = new Date().toISOString();
      conv.messages.push(
        { id: `ai-msg-${Date.now()}-u`, role: 'user', content: text, createdAt: at },
        { id: `ai-msg-${Date.now()}-a`, role: 'assistant', content: reply, model: 'copilot', createdAt: at },
      );
      conv.updatedAt = at;
      if (conv.title === 'New Conversation' || conv.title === 'New conversation' || !conv.title) {
        conv.title = text.slice(0, 50) + (text.length > 50 ? '...' : '');
      }
    }
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

  // /profiles/[userId] had no demo handler at all, so it fell through to the
  // generic fallback and every field came back undefined: a "?" avatar, no name,
  // "undefined on CoFounderBay" under the title, and three empty skill chips
  // whose missing skillId also tripped React's duplicate-key warning. Resolved
  // from PEOPLE so a card opened from Discover shows the person that was clicked.
  if (/^\/api\/profiles\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop() ?? '';
    const person =
      PEOPLE.find((p) => p.userId === id || p.id === id) ?? PEOPLE[0];
    const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      id: person.id,
      userId: person.userId,
      displayName: person.displayName,
      headline: person.headline,
      bio: person.bio,
      location: person.location,
      timezone: 'Europe/Athens',
      languages: ['English'],
      avatarUrl: person.avatarUrl,
      rolePayload: {
        lookingFor: person.lookingFor ? [person.lookingFor] : [],
        availability: person.availability,
        industries: person.industries,
      },
      visibilityRules: null,
      role: person.role,
      skills: person.skillNames.map((name) => ({
        skillId: slug(name),
        skillName: name,
        slug: slug(name),
        level: 'advanced',
      })),
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: NOW,
    };
  }

  // The workspace panels on /builder had no demo handlers at all, so every one
  // of them fell through to the generic fallback -- an object with none of the
  // fields they read. WorkspaceReadinessPanel then crashed the page on
  // `data.dimensions[key]`, because its only guard was `if (!data)`.
  if (/^\/api\/gamification\/workspaces\/[^/]+\/readiness$/.test(pathname)) {
    const dimensions = {
      problemClarity: 72,
      solutionClarity: 64,
      marketUnderstanding: 48,
      productDefinition: 55,
      teamCompleteness: 40,
      executionReadiness: 58,
      validationScore: 35,
      artifactCompleteness: 61,
    };
    const detail: Record<string, string> = {
      problemClarity: 'Problem statement written and reviewed',
      solutionClarity: 'Solution outline drafted',
      marketUnderstanding: 'TAM sized, competitors not yet mapped',
      productDefinition: 'PRD started, MVP scope open',
      teamCompleteness: 'Founder only — no technical cofounder yet',
      executionReadiness: '2 of 4 milestones on track',
      validationScore: 'No expert review requested yet',
      artifactCompleteness: 'Documents averaging 61% complete',
    };
    const weight = 1 / Object.keys(dimensions).length;
    return {
      workspaceId: pathname.split('/')[4] ?? 'preview-ws-harbor',
      score: 54,
      bottleneckFactor: 0.92,
      dimensions,
      dimensionBreakdown: Object.fromEntries(
        Object.entries(dimensions).map(([k, score]) => [
          k,
          {
            score,
            weight,
            weightedContribution: Math.round(score * weight * 100) / 100,
            detail: detail[k] ?? '',
            signals: {},
          },
        ]),
      ),
      updatedAt: NOW,
    };
  }

  if (/^\/api\/gamification\/workspaces\/[^/]+\/momentum$/.test(pathname)) {
    return {
      workspaceId: pathname.split('/')[4] ?? 'preview-ws-harbor',
      score: 61,
      velocity: 1.84,
      recentActivityScore: 66,
      collaborationDensity: 48,
      breakdown: {
        activeContributors: 3,
        recentMeaningfulActions: 14,
        meaningful7d: 9,
        meaningful14d: 14,
        velocityScore: 62,
        recentActivityScore: 66,
        collaborationDensityScore: 48,
        feedbackLoopScore: 54,
        milestoneRateScore: 58,
        artifactProgressEvents: 7,
        momentumLevel: 'Strong',
      },
      updatedAt: NOW,
    };
  }

  if (/^\/api\/gamification\/workspaces\/[^/]+\/contributions$/.test(pathname)) {
    // An array, not an object with a `contributors` field -- the panel maps over
    // the response directly.
    const wsId = pathname.split('/')[4] ?? 'preview-ws-harbor';
    const contributor = (
      userId: string,
      score: number,
      explain: string,
      b: Partial<Record<string, number>>,
    ) => ({
      userId,
      workspaceId: wsId,
      score,
      rawScore: score,
      breakdown: {
        artifactsCreated: 0,
        artifactsImproved: 0,
        feedbackGiven: 0,
        feedbackApplied: 0,
        collaborationActions: 0,
        usageByTeam: 0,
        recentArtifactsCreated: 0,
        recentArtifactsImproved: 0,
        recentFeedbackApplied: 0,
        ...b,
      },
      explain,
      updatedAt: NOW,
    });
    return [
      contributor(ME_ID, 58, 'Created most of the workspace artefacts', {
        artifactsCreated: 6, artifactsImproved: 9, collaborationActions: 12, recentArtifactsImproved: 3,
      }),
      contributor('user-marcus', 29, 'Improved the product and MVP documents', {
        artifactsImproved: 7, feedbackGiven: 3, collaborationActions: 5, recentArtifactsImproved: 2,
      }),
      contributor('user-sarah', 13, 'Reviewed the pitch and market sections', {
        feedbackGiven: 5, feedbackApplied: 4, recentFeedbackApplied: 2,
      }),
    ];
  }

  if (/^\/api\/gamification\/workspaces\/[^/]+\/mentor/.test(pathname)) {
    return {
      workspaceId: pathname.split('/')[4] ?? 'preview-ws-harbor',
      feedbackCount: 8,
      appliedFeedbackCount: 5,
      unresolvedFeedback: 3,
      appliedFeedbackRate: 0.63,
      avgResponseTimeHrs: 14.5,
      speedScore: 62,
      depthScore: 54,
      burdenScore: 38,
      improvementScore: 46,
      lastFeedbackAt: NOW,
      updatedAt: NOW,
    };
  }

  if (pathname === '/api/gamification/users/me/xp' || pathname.endsWith('/xp')) {
    return {
      // Consistent with the real ladder in apps/api gamification.types.ts, which
      // is what the widget renders against: level 3 "Builder" spans 500-1000 XP,
      // and `levelProgress` is a **percentage**, not a fraction. It used to read
      // `level: 3, totalXp: 420, levelProgress: 0.68` — 420 XP is level 2 on that
      // ladder, and 0.68 rendered as an all-but-empty bar labelled "1%" beside a
      // badge promising only 80 XP to go. 920 keeps both the level and the "80 to
      // next" and makes the bar agree with them: (920-500)/(1000-500) = 84%.
      userId: ME_ID,
      totalXp: 920,
      level: 3,
      levelLabel: 'Builder',
      xpToNextLevel: 80,
      levelProgress: 84,
      // The showcase's last week, in the event vocabulary EVENT_CONFIG uses on
      // the server (apps/api gamification.types.ts). Used to be `[]`, which left
      // /reputation's Overview and History empty for the one account every
      // visitor sees. These are the actions the rest of the demo already
      // implies: two Builder artifacts, a closed milestone, a mentor review
      // acted on, a collaborator invited. Amounts are the config's base XP
      // (25/40/50/60/80/100), so a reader cross-checking against the ladder
      // finds them exact. No STREAK_BONUS row: its base is 0 and the server
      // computes it, so a literal here would be an invented number.
      recentEvents: [
        { id: 'xp-1', eventType: 'IMPROVE_ARTIFACT', xpAmount: 40, entityType: 'artifact', metadata: null, createdAt: NOW },
        { id: 'xp-2', eventType: 'APPLY_FEEDBACK', xpAmount: 80, entityType: 'review', metadata: null, createdAt: '2026-09-03T09:05:00.000Z' },
        { id: 'xp-3', eventType: 'RECEIVE_MENTOR_FEEDBACK', xpAmount: 60, entityType: 'review', metadata: null, createdAt: '2026-09-02T18:40:00.000Z' },
        { id: 'xp-4', eventType: 'COMPLETE_MILESTONE', xpAmount: 100, entityType: 'milestone', metadata: null, createdAt: '2026-09-01T11:00:00.000Z' },
        { id: 'xp-5', eventType: 'CREATE_ARTIFACT', xpAmount: 25, entityType: 'artifact', metadata: null, createdAt: '2026-08-30T14:30:00.000Z' },
        { id: 'xp-6', eventType: 'INVITE_COLLABORATOR', xpAmount: 50, entityType: 'workspace', metadata: null, createdAt: '2026-08-29T10:10:00.000Z' },
      ],
      streak: { currentStreak: 4, longestStreak: 7, lastActiveDate: NOW },
    };
  }
  // useMyStreak() fetches the streak on its own endpoint, not from the XP payload
  // above. Without this branch it fell through to the generic fallback, whose
  // object has no currentStreak/longestStreak — which is why the dashboard read
  // "undefined day streak · Best: undefined days" in demo mode.
  if (pathname === '/api/gamification/users/me/streak' || pathname.endsWith('/streak')) {
    return { currentStreak: 4, longestStreak: 7, lastActiveDate: NOW };
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

  /*
   * Showcase areas. Each of these filters the fixtures the way the real
   * endpoint filters rows, so the tabs, search boxes and chips on those pages
   * do something — a control that always returns the same list reads as broken
   * long before anyone checks whether a backend is attached.
   */
  if (pathname === '/api/events' || pathname.startsWith('/api/events?')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const scope = params.get('scope') ?? 'upcoming';
    const q = params.get('q')?.toLowerCase() ?? '';
    const mode = params.get('mode');
    const limit = Number(params.get('limit') ?? 48);
    const startsAfterNow = (e: PreviewEvent) => e.startAt >= NOW;
    const events = PREVIEW_EVENTS
      .filter((e) => (
        scope === 'past' ? !startsAfterNow(e)
          : scope === 'mine' ? e.viewerRsvp != null
            : startsAfterNow(e)
      ))
      .filter((e) => !mode || e.mode === mode)
      .filter((e) => !q || `${e.title} ${e.description} ${e.location ?? ''} ${e.host.displayName}`.toLowerCase().includes(q))
      // Upcoming reads forwards; past reads backwards, most recent first.
      .sort((a, b) => (scope === 'past' ? b.startAt.localeCompare(a.startAt) : a.startAt.localeCompare(b.startAt)))
      .slice(0, limit);
    return { events };
  }
  if (pathname.startsWith('/api/events/') && pathname.endsWith('/rsvp')) {
    const id = pathname.split('/')[3];
    const status = typeof body.status === 'string' ? body.status : 'going';
    return { ok: true, eventId: id, viewerRsvp: status === 'not_going' ? null : status };
  }
  if (pathname.startsWith('/api/events/')) {
    const id = pathname.split('/')[3];
    const event = PREVIEW_EVENTS.find((e) => e.id === id);
    return event ? { event } : { event: PREVIEW_EVENTS[0] };
  }

  if (pathname === '/api/jobs' || pathname.startsWith('/api/jobs?')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const limit = Number(params.get('limit') ?? 50);
    return { jobs: PREVIEW_JOBS.slice(0, limit) };
  }

  if (pathname === '/api/groups/my') {
    return {
      groups: PREVIEW_GROUPS
        .filter((g) => g.isMember)
        .map((g) => ({ ...g, memberRole: g.memberRole ?? 'member', joinedAt: '2026-05-12T09:00:00.000Z' })),
    };
  }
  if (pathname === '/api/groups' || pathname.startsWith('/api/groups?')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const category = params.get('category');
    const privacy = params.get('privacy');
    const search = params.get('search')?.toLowerCase() ?? '';
    const sort = params.get('sort') ?? 'popular';
    const onlyMine = params.get('myGroups') === 'true';
    const limit = Number(params.get('limit') ?? 30);
    const offset = Number(params.get('offset') ?? 0);
    const matched = PREVIEW_GROUPS
      .filter((g) => !onlyMine || g.isMember)
      .filter((g) => !category || g.category === category)
      .filter((g) => !privacy || g.privacy === privacy)
      .filter((g) => !search || `${g.name} ${g.description ?? ''} ${g.tags.join(' ')} ${g.category ?? ''}`.toLowerCase().includes(search))
      .sort((a, b) => (
        sort === 'recent' ? b.createdAt.localeCompare(a.createdAt)
          // "Trending" is conversation per member, so a small, busy room can
          // outrank a large quiet one — which is the whole point of the sort.
          : sort === 'trending' ? (b.postCount / b.memberCount) - (a.postCount / a.memberCount)
            : b.memberCount - a.memberCount
      ));
    const groups = matched.slice(offset, offset + limit);
    return { groups, total: matched.length, hasMore: offset + groups.length < matched.length };
  }
  if (pathname.startsWith('/api/groups/') && (pathname.endsWith('/join') || pathname.endsWith('/leave'))) {
    return { ok: true, groupId: pathname.split('/')[3], isMember: pathname.endsWith('/join') };
  }
  if (pathname.startsWith('/api/groups/')) {
    const id = pathname.split('/')[3];
    const group = PREVIEW_GROUPS.find((g) => g.id === id || g.slug === id) ?? PREVIEW_GROUPS[0];
    return { group: { ...group, members: [] } };
  }

  if (pathname === '/api/opportunities' || pathname.startsWith('/api/opportunities?')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const type = params.get('type');
    const isRemote = params.get('isRemote');
    const search = params.get('search')?.toLowerCase() ?? '';
    const limit = Number(params.get('limit') ?? 20);
    const offset = Number(params.get('offset') ?? 0);
    const matched = PREVIEW_OPPORTUNITIES
      .filter((o) => !type || o.type === type)
      .filter((o) => isRemote == null || o.isRemote === (isRemote === 'true'))
      .filter((o) => !search || `${o.title} ${o.description ?? ''} ${o.company ?? ''} ${o.tags.join(' ')}`.toLowerCase().includes(search));
    const opportunities = matched.slice(offset, offset + limit);
    return { opportunities, total: matched.length, hasMore: offset + opportunities.length < matched.length };
  }

  /*
   * The demo founder belongs to no organisation, so the tenant switcher should
   * be absent rather than populated with an invented company. An empty list is
   * the honest answer and the one the page already renders correctly; the
   * generic fallback answered with a truthy object instead.
   */
  if (pathname === '/api/sso/memberships') {
    return { memberships: [] };
  }

  if (pathname === '/api/investor/summary') {
    const invested = PREVIEW_DEALS.filter((d) => d.pipelineStage === 'invested');
    const deployedCents = invested.reduce((sum, d) => sum + (d.investedCents ?? 0), 0);
    const currentValueCents = invested.reduce((sum, d) => sum + (d.currentValueCents ?? d.investedCents ?? 0), 0);
    return {
      stageCounts: Object.fromEntries(
        PREVIEW_PIPELINE_STAGES.map((stage) => [
          stage,
          PREVIEW_DEALS.filter((d) => d.pipelineStage === stage).length,
        ]),
      ),
      totalDeals: PREVIEW_DEALS.length,
      investments: invested.length,
      deployedCents,
      currentValueCents,
      returnPct:
        deployedCents > 0
          ? Math.round(((currentValueCents - deployedCents) / deployedCents) * 100)
          : null,
    };
  }
  if (pathname === '/api/investor/activity' || pathname.startsWith('/api/investor/activity?')) {
    const limit = Number(new URLSearchParams(path.split('?')[1] ?? '').get('limit') ?? 20);
    const activity = PREVIEW_DEALS
      .flatMap((deal) =>
        deal.recentEvents.map((event) => ({
          id: event.id,
          dealId: deal.id,
          dealName: deal.name,
          logoUrl: deal.logoUrl,
          type: event.type,
          title: event.title,
          body: event.body,
          createdAt: event.createdAt,
        })),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
    return { activity };
  }
  if (pathname === '/api/investor/deals' && method === 'POST') {
    // Watching a startup from Scouting. The showcase keeps no server state, so
    // it answers the shape the caller reads rather than pretending to persist.
    const name = typeof body.name === 'string' ? body.name : 'New deal';
    return {
      deal: {
        ...PREVIEW_DEALS[0],
        id: `deal-preview-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        pipelineStage: 'discovered',
        starred: false,
        investedCents: null,
        currentValueCents: null,
        investedAt: null,
        recentEvents: [],
      },
    };
  }
  if (pathname === '/api/investor/deals' || pathname.startsWith('/api/investor/deals?')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const stage = params.get('pipelineStage');
    const starred = params.get('starred');
    const status = params.get('status');
    const search = params.get('search')?.toLowerCase() ?? '';
    const limit = Number(params.get('limit') ?? 50);
    const offset = Number(params.get('offset') ?? 0);
    const matched = PREVIEW_DEALS
      .filter((d) => !stage || d.pipelineStage === stage)
      .filter((d) => starred == null || d.starred === (starred === 'true'))
      .filter((d) => !status || d.status === status)
      .filter((d) => !search || `${d.name} ${d.tagline ?? ''} ${d.industry ?? ''}`.toLowerCase().includes(search))
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    const deals = matched.slice(offset, offset + limit);
    return { deals, total: matched.length, hasMore: offset + deals.length < matched.length };
  }
  if (pathname.startsWith('/api/investor/deals/')) {
    const id = pathname.split('/')[4];
    const deal = PREVIEW_DEALS.find((d) => d.id === id);
    if (method !== 'GET') return { ok: true, deal: deal ?? PREVIEW_DEALS[0] };
    return deal ? { deal } : { deal: PREVIEW_DEALS[0] };
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
