export type ProjectStatus = 'idea' | 'validating' | 'building' | 'launched' | 'scaling';

export type DemoRole = {
  title: string;
  description: string;
  equity: string;
  commitment: string;
};

export type DemoMember = {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  joinedAt?: string;
};

export type DemoMilestone = {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  date: string;
};

export type DemoUpdate = {
  id: string;
  content: string;
  date: string;
  author: string;
};

export type DemoProject = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  stage: string;
  industry: string;
  location: string;
  website: string;
  teamSize: number;
  maxTeamSize: number;
  createdAt: string;
  updatedAt: string;
  founder: { id: string; name: string; avatar?: string; role: string };
  members: DemoMember[];
  rolesNeeded: DemoRole[];
  tags: string[];
  isStarred?: boolean;
  messageCount?: number;
  progress?: number;
  milestones: DemoMilestone[];
  updates: DemoUpdate[];
};

/** Same id as preview-api `ME_ID` so demo tabs match the signed-in Alex Demo. */
export const DEMO_PROJECTS_ME_ID = 'preview-demo-user';

const STORAGE_KEY = 'cfb:demo-projects';

export const PROJECT_STATUS_GLYPH: Record<ProjectStatus, 'spark' | 'target' | 'builder' | 'award' | 'chart'> = {
  idea: 'spark',
  validating: 'target',
  building: 'builder',
  launched: 'award',
  scaling: 'chart',
};

export const DEMO_PROJECTS_SEED: DemoProject[] = [
  {
    id: '1',
    name: 'EcoTrack',
    tagline: 'AI-powered carbon footprint tracking for businesses',
    description:
      'EcoTrack is building the future of corporate sustainability. Our AI-powered platform helps businesses of all sizes measure, reduce, and offset their carbon footprint with unprecedented accuracy and ease.\n\nWe are tackling one of the biggest challenges of our time: climate change. By making carbon tracking accessible and actionable, we are empowering companies to make real environmental impact.\n\nOur platform integrates with existing business tools, automatically calculates emissions across all operations, and provides actionable insights for reduction. We also facilitate verified carbon offset purchases and sustainability reporting.',
    status: 'building',
    stage: 'Pre-seed',
    industry: 'CleanTech',
    location: 'San Francisco, CA',
    website: 'https://ecotrack.io',
    teamSize: 3,
    maxTeamSize: 5,
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-03-10T00:00:00.000Z',
    founder: { id: 'u1', name: 'Sarah Chen', role: 'founder' },
    members: [
      { id: 'u1', name: 'Sarah Chen', role: 'CEO & Co-founder', joinedAt: '2024-01-15T00:00:00.000Z' },
      { id: 'u2', name: 'Mike Ross', role: 'CTO & Co-founder', joinedAt: '2024-01-15T00:00:00.000Z' },
      { id: 'u3', name: 'Lisa Park', role: 'Lead Designer', joinedAt: '2024-02-01T00:00:00.000Z' },
    ],
    rolesNeeded: [
      { title: 'Backend Engineer', description: 'Help build our data pipeline and API infrastructure', equity: '1-2%', commitment: 'Full-time' },
      { title: 'Growth Lead', description: 'Drive user acquisition and partnership development', equity: '0.5-1%', commitment: 'Full-time' },
    ],
    tags: ['AI', 'Sustainability', 'B2B', 'SaaS', 'Climate'],
    isStarred: true,
    messageCount: 12,
    progress: 65,
    milestones: [
      { id: 'm1', title: 'MVP Launch', status: 'completed', date: '2024-02-01T00:00:00.000Z' },
      { id: 'm2', title: 'First 10 Customers', status: 'completed', date: '2024-02-28T00:00:00.000Z' },
      { id: 'm3', title: 'Seed Funding', status: 'in_progress', date: '2024-04-15T00:00:00.000Z' },
      { id: 'm4', title: '100 Customers', status: 'pending', date: '2024-06-01T00:00:00.000Z' },
    ],
    updates: [
      { id: 'up1', content: 'Closed our first enterprise deal with a Fortune 500 company!', date: '2024-03-08T00:00:00.000Z', author: 'Sarah Chen' },
      { id: 'up2', content: 'Launched integration with Salesforce and HubSpot', date: '2024-02-25T00:00:00.000Z', author: 'Mike Ross' },
    ],
  },
  {
    id: '2',
    name: 'MentorMatch',
    tagline: 'Founders matched with mentors who have done it before',
    description:
      'Platform connecting early-stage founders with experienced mentors for personalized guidance and accountability.\n\nStructured office hours, written goals, and a shared scorecard so mentorship is not a one-off coffee.',
    status: 'validating',
    stage: 'Idea',
    industry: 'EdTech',
    location: 'London, UK',
    website: '',
    teamSize: 3,
    maxTeamSize: 4,
    createdAt: '2024-02-20T00:00:00.000Z',
    updatedAt: '2024-03-08T00:00:00.000Z',
    founder: { id: 'u4', name: 'James Wilson', role: 'founder' },
    members: [
      { id: 'u4', name: 'James Wilson', role: 'Founder', joinedAt: '2024-02-20T00:00:00.000Z' },
      { id: 'u5', name: 'Emma Davis', role: 'Product', joinedAt: '2024-02-22T00:00:00.000Z' },
      { id: DEMO_PROJECTS_ME_ID, name: 'Alex Demo', role: 'Advisor', joinedAt: '2024-03-01T00:00:00.000Z' },
    ],
    rolesNeeded: [
      { title: 'Full-stack Developer', description: 'Own the matching engine and the booking calendar', equity: '1-3%', commitment: 'Full-time' },
      { title: 'Marketing', description: 'Bring the first 50 founder–mentor pairs', equity: '0.5-1%', commitment: 'Part-time' },
    ],
    tags: ['Marketplace', 'Mentorship', 'Community'],
    messageCount: 5,
    progress: 30,
    milestones: [
      { id: 'mm1', title: 'Landing page live', status: 'completed', date: '2024-03-01T00:00:00.000Z' },
      { id: 'mm2', title: '10 mentor interviews', status: 'in_progress', date: '2024-03-20T00:00:00.000Z' },
      { id: 'mm3', title: 'Paid pilot', status: 'pending', date: '2024-05-01T00:00:00.000Z' },
    ],
    updates: [
      { id: 'mmu1', content: 'Five mentors confirmed for the first cohort.', date: '2024-03-06T00:00:00.000Z', author: 'James Wilson' },
    ],
  },
  {
    id: '3',
    name: 'HealthSync',
    tagline: 'Wearable data, one wellness picture',
    description:
      'Unified health data platform that aggregates wearable data for personalized wellness insights.\n\nYou own this catalogue entry in the demo — it is the project that should appear under My projects.',
    status: 'idea',
    stage: 'Concept',
    industry: 'HealthTech',
    location: 'Athens, GR',
    website: '',
    teamSize: 1,
    maxTeamSize: 4,
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-05T00:00:00.000Z',
    founder: { id: DEMO_PROJECTS_ME_ID, name: 'Alex Demo', role: 'founder' },
    members: [
      { id: DEMO_PROJECTS_ME_ID, name: 'Alex Demo', role: 'Founder', joinedAt: '2024-03-01T00:00:00.000Z' },
    ],
    rolesNeeded: [
      { title: 'Technical Co-founder', description: 'Architecture, mobile, and the data pipeline', equity: '15-30%', commitment: 'Full-time' },
      { title: 'Mobile Developer', description: 'iOS and Android clients for wearable sync', equity: '1-3%', commitment: 'Full-time' },
      { title: 'Data Scientist', description: 'Personalization models on wearable streams', equity: '1-2%', commitment: 'Part-time' },
    ],
    tags: ['Health', 'Wearables', 'Data', 'Consumer'],
    progress: 10,
    milestones: [
      { id: 'hs1', title: 'Problem interviews', status: 'in_progress', date: '2024-03-15T00:00:00.000Z' },
      { id: 'hs2', title: 'Wearable API spike', status: 'pending', date: '2024-04-01T00:00:00.000Z' },
    ],
    updates: [
      { id: 'hsu1', content: 'Twelve interviews booked with athletes using two or more wearables.', date: '2024-03-04T00:00:00.000Z', author: 'Alex Demo' },
    ],
  },
];

export type ProjectsOverlay = {
  created: DemoProject[];
  starred: Record<string, boolean>;
  deleted: string[];
};

const EMPTY_OVERLAY: ProjectsOverlay = { created: [], starred: {}, deleted: [] };

export function emptyProjectsOverlay(): ProjectsOverlay {
  return { created: [], starred: {}, deleted: [] };
}

export function readProjectsOverlay(): ProjectsOverlay {
  if (typeof window === 'undefined') return emptyProjectsOverlay();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProjectsOverlay();
    const parsed = JSON.parse(raw) as Partial<ProjectsOverlay>;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      starred: parsed.starred && typeof parsed.starred === 'object' ? parsed.starred : {},
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
    };
  } catch {
    return emptyProjectsOverlay();
  }
}

export function writeProjectsOverlay(overlay: ProjectsOverlay) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
}

export function resolveDemoProjects(overlay: ProjectsOverlay = emptyProjectsOverlay()): DemoProject[] {
  const fromSeed = DEMO_PROJECTS_SEED
    .filter((p) => !overlay.deleted.includes(p.id))
    .map((p) => ({
      ...p,
      isStarred: overlay.starred[p.id] ?? p.isStarred,
    }));
  const created = overlay.created
    .filter((p) => !overlay.deleted.includes(p.id))
    .map((p) => ({
      ...p,
      isStarred: overlay.starred[p.id] ?? p.isStarred,
    }));
  return [...created, ...fromSeed];
}

export function listDemoProjects(): DemoProject[] {
  return resolveDemoProjects(readProjectsOverlay());
}

export function getDemoProject(id: string, overlay?: ProjectsOverlay): DemoProject | undefined {
  return resolveDemoProjects(overlay ?? readProjectsOverlay()).find((p) => p.id === id);
}

export function isOwnedProject(project: DemoProject, userId = DEMO_PROJECTS_ME_ID): boolean {
  return project.founder.id === userId;
}

export function isJoinedProject(project: DemoProject, userId = DEMO_PROJECTS_ME_ID): boolean {
  return !isOwnedProject(project, userId) && project.members.some((m) => m.id === userId);
}

export function demoProjectStats(projects: DemoProject[]) {
  return {
    total: projects.length,
    active: projects.filter((p) => p.status === 'building' || p.status === 'launched' || p.status === 'scaling').length,
    openRoles: projects.reduce((n, p) => n + p.rolesNeeded.length, 0),
    industries: new Set(projects.map((p) => p.industry)).size,
  };
}

export function createDemoProject(input: {
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  industry: string;
  location: string;
  website: string;
  maxTeamSize: number;
  rolesNeeded: string[];
  tags: string[];
}): DemoProject {
  const now = new Date().toISOString();
  const project: DemoProject = {
    id: `p-${Date.now()}`,
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    status: input.status,
    stage: input.status === 'idea' ? 'Concept' : input.status === 'validating' ? 'Idea' : 'Pre-seed',
    industry: input.industry,
    location: input.location.trim(),
    website: input.website.trim(),
    teamSize: 1,
    maxTeamSize: input.maxTeamSize,
    createdAt: now,
    updatedAt: now,
    founder: { id: DEMO_PROJECTS_ME_ID, name: 'Alex Demo', role: 'founder' },
    members: [{ id: DEMO_PROJECTS_ME_ID, name: 'Alex Demo', role: 'Founder', joinedAt: now }],
    rolesNeeded: input.rolesNeeded.map((title) => ({
      title,
      description: '',
      equity: '',
      commitment: 'Full-time',
    })),
    tags: input.tags,
    progress: 5,
    milestones: [],
    updates: [],
  };
  const overlay = readProjectsOverlay();
  overlay.created = [project, ...overlay.created];
  writeProjectsOverlay(overlay);
  return project;
}

export function toggleDemoStar(id: string): boolean {
  const overlay = readProjectsOverlay();
  const current = getDemoProject(id, overlay);
  const next = !(current?.isStarred ?? false);
  overlay.starred[id] = next;
  writeProjectsOverlay(overlay);
  return next;
}

export function deleteDemoProject(id: string) {
  const overlay = readProjectsOverlay();
  if (!overlay.deleted.includes(id)) overlay.deleted.push(id);
  overlay.created = overlay.created.filter((p) => p.id !== id);
  writeProjectsOverlay(overlay);
}
