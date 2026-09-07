import type { ReactNode } from 'react';
import { getPageMetaEl } from '@/lib/i18n/strings-pages';

export type PageMeta = {
  /** Route pattern, e.g. `/matches` or `/profiles/[userId]` */
  path: string;
  title: string;
  /** Greek title — additive; English `title` remains canonical in UI primary line */
  titleEl?: string;
  /** One-line subtitle shown under the page title */
  description: string;
  descriptionEl?: string;
  /** Optional contextual help (HTML-free markdown-ish strings in JSX at call site) */
  helpId?: string;
  helpTitle?: string;
  /** Greek help heading — additive, same contract as `titleEl`. */
  helpTitleEl?: string;
  /** Primary user action label for empty states */
  primaryAction?: string;
  /** Breadcrumb parent */
  section?: string;
  /** WCAG: who this page is for */
  audience?: string[];
  /** UX priority for audit tracking */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  /** Implementation status */
  status?: 'complete' | 'partial' | 'scaffold';
};

/** Static registry — dynamic segments matched by prefix/pattern in getPageMeta */
export const PAGE_REGISTRY: PageMeta[] = [
  // ── Public ──
  { path: '/', title: 'Home', description: 'CoFounderBay landing — find co-founders, mentors, and investors.', section: 'Public', priority: 'critical', status: 'complete' },
  { path: '/pricing', title: 'Pricing', description: 'Plans for founders, mentors, organizations, and enterprises.', section: 'Public', status: 'complete' },
  { path: '/login', title: 'Sign in', description: 'Access your workspace with email, Google, LinkedIn, or SSO.', section: 'Auth', priority: 'critical', status: 'complete' },
  { path: '/register', title: 'Create account', description: 'Join as founder, mentor, investor, or organization.', section: 'Auth', priority: 'critical', status: 'complete' },
  { path: '/onboarding', title: 'Welcome to CoFounderBay', description: 'A 3-minute setup so matching, search, and recommendations actually work for you.', helpId: 'onboarding', helpTitle: 'Why we ask these questions', helpTitleEl: 'Γιατί ρωτάμε αυτά', section: 'Auth', priority: 'critical', status: 'complete' },

  // ── Founder work ──
  { path: '/dashboard/founder', title: 'Founder dashboard', description: 'Your startup command center — readiness, matches, and next actions.', helpId: 'dashboard-founder', helpTitle: 'Founder dashboard', helpTitleEl: 'Ο πίνακας του ιδρυτή', section: 'Work', audience: ['founder'], priority: 'critical', status: 'complete' },
  { path: '/readiness', title: 'Readiness Score', description: 'Assess your startup\u2019s readiness across 6 key dimensions and see what to fix next.', helpId: 'readiness', helpTitle: 'How the readiness score works', helpTitleEl: 'Πώς υπολογίζεται η ετοιμότητα', section: 'Work', audience: ['founder'], status: 'complete' },
  { path: '/analytics', title: 'Analytics', description: 'Track your profile performance and network growth.', helpId: 'analytics', helpTitle: 'How to read these metrics', helpTitleEl: 'Πώς διαβάζονται οι μετρήσεις', section: 'Work', audience: ['founder'], status: 'complete' },
  { path: '/builder', title: 'Startup Builder', description: 'Structure idea, team, market, traction, and pitch \u2014 all in one workspace.', helpId: 'builder', helpTitle: 'Using the Startup Builder', helpTitleEl: 'Πώς δουλεύει ο Startup Builder', section: 'Work', priority: 'critical', status: 'complete' },
  { path: '/builder/pitch-deck', title: 'Pitch deck', description: 'Draft slides tied to Builder data. Completion counts filled content, not empty outlines.', helpId: 'pitch-deck', helpTitle: 'How this pitch deck works', helpTitleEl: 'Πώς δουλεύει αυτό το pitch deck', section: 'Work', status: 'complete' },
  { path: '/builder/applications', title: 'Program applications', description: 'Four templates — YC, Techstars, university, grants. Answers save on the same workspace artefact as the Builder Applications tab.', helpId: 'applications', helpTitle: 'How program applications work', helpTitleEl: 'Πώς δουλεύουν οι αιτήσεις προγράμματος', section: 'Work', status: 'complete' },
  { path: '/research', title: 'Research boards', description: 'Visual canvases for market, product, and competitive research. Templates seed a board; the canvas holds notes, files, and links.', helpId: 'research', helpTitle: 'How research boards work', helpTitleEl: 'Πώς δουλεύουν οι πίνακες έρευνας', section: 'Work', status: 'complete' },
  { path: '/milestones', title: 'Milestones', description: 'Atomic goals with owners and dates. Completing them feeds Readiness and investor updates.', helpId: 'milestones', helpTitle: 'How milestones work', helpTitleEl: 'Πώς δουλεύουν τα ορόσημα', section: 'Work', status: 'complete' },
  // Creation routes need their own line: inheriting the list page told the user
  // they were "tracking" milestones on the form that creates one.
  { path: '/milestones/new', title: 'New milestone', description: 'Define one milestone — what done looks like, who owns it, and when it is due.', helpId: 'milestones', helpTitle: 'How milestones work', helpTitleEl: 'Πώς δουλεύουν τα ορόσημα', section: 'Work', status: 'complete' },
  { path: '/projects', title: 'Projects', description: 'Discover startup projects, join a team, or publish one with open roles. Completing work here sits next to Milestones and Builder.', helpId: 'projects', helpTitle: 'How projects work', helpTitleEl: 'Πώς δουλεύουν τα έργα', section: 'Work', status: 'complete' },
  { path: '/projects/create', title: 'Create project', description: 'Name the idea, pick a stage, and list the roles you still need — then publish.', helpId: 'projects', helpTitle: 'How projects work', helpTitleEl: 'Πώς δουλεύουν τα έργα', section: 'Work', status: 'complete' },
  { path: '/fundraising', title: 'Fundraising', description: 'Track the round, move investors through the pipeline, and share a private data room. Completing diligence here sits next to Pitch deck and Readiness.', helpId: 'fundraising', helpTitle: 'Running your fundraise here', helpTitleEl: 'Ο γύρος χρηματοδότησης εδώ', section: 'Work', audience: ['founder'], status: 'complete' },

  // ── Discovery ──
  { path: '/matches', title: 'Matches', description: 'AI-ranked co-founder and team matches based on your profile compatibility.', helpId: 'matches', helpTitle: 'How matching works', helpTitleEl: 'Πώς γίνεται η αντιστοίχιση', section: 'Explore', priority: 'critical', status: 'complete' },
  { path: '/matches/compare', title: 'Compare profiles', description: 'Side-by-side comparison of skills, stage, and fit.', section: 'Explore', status: 'partial' },
  { path: '/discover', title: 'Explore', description: 'Discover founders, mentors, investors, and team members with filters for role, skills, and location.', helpId: 'discover', helpTitle: 'How discovery works', helpTitleEl: 'Πώς λειτουργεί η εξερεύνηση', section: 'Explore', status: 'complete' },
  { path: '/recommendations', title: 'For you', description: 'Personalized suggestions based on your profile and activity.', section: 'Explore', status: 'complete' },
  { path: '/search', title: 'Search', description: 'Find people, jobs, events, programs, and posts. Use filters in the result tabs to narrow by type.', section: 'Explore', status: 'complete' },
  { path: '/connections', title: 'Connections', description: 'Manage pending requests and active professional relationships.', helpId: 'connections', helpTitle: 'Connections', helpTitleEl: 'Συνδέσεις', section: 'Network', status: 'complete' },
  { path: '/shortlist', title: 'Saved profiles', description: 'Profiles you bookmarked for later outreach.', section: 'Network', status: 'complete' },
  { path: '/messages', title: 'Messages', description: 'Full-height inbox for chats and intro requests. New message opens a connection picker; Ask AI drafts from the thread.', helpId: 'messages', helpTitle: 'Chats vs intro requests', helpTitleEl: 'Συνομιλίες και αιτήματα γνωριμίας', section: 'Communicate', priority: 'critical', status: 'complete' },
  { path: '/calendar', title: 'Calendar', description: 'Sessions, calls, and events in one timeline.', section: 'Communicate', status: 'complete' },

  // ── Mentor ──
  { path: '/dashboard/mentor', title: 'Mentor dashboard', description: 'Sessions, requests, earnings, and mentee overview.', section: 'Work', audience: ['mentor'], status: 'complete' },
  { path: '/mentor/sessions', title: 'My sessions', description: 'Upcoming and past mentoring sessions.', section: 'Work', audience: ['mentor'], status: 'complete' },
  { path: '/mentor/requests', title: 'Mentee requests', description: 'Accept or decline new mentoring requests.', section: 'Work', audience: ['mentor'], status: 'complete' },
  { path: '/mentoring', title: 'Find mentors', description: 'Directory of mentors — filter by expertise and availability.', section: 'Explore', status: 'complete' },

  // ── Investor ──
  { path: '/dashboard/investor', title: 'Investor dashboard', description: 'Deal flow KPIs, pipeline snapshot, and watchlist.', section: 'Work', audience: ['investor'], status: 'complete' },
  { path: '/investor/scouting', title: 'Scout startups', description: 'Search and filter startups by stage, sector, and traction.', section: 'Work', audience: ['investor'], status: 'partial' },
  { path: '/investor/pipeline', title: 'Pipeline', description: 'Kanban of deals from intro to term sheet.', section: 'Work', audience: ['investor'], status: 'complete' },
  { path: '/investors', title: 'Investor directory', description: 'Discover angels, VCs, and syndicates on the platform.', section: 'Explore', status: 'complete' },

  // ── Provider ──
  { path: '/dashboard/provider', title: 'Provider dashboard', description: 'Services, inquiries, and active client projects.', section: 'Work', audience: ['service_provider'], status: 'complete' },
  { path: '/marketplace', title: 'Services marketplace', description: 'Browse legal, design, growth, and ops providers.', section: 'Resources', status: 'complete' },

  // ── Organization ──
  { path: '/org/dashboard', title: 'Organization dashboard', description: 'Programs, cohorts, and portfolio health.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/programs', title: 'Programs', description: 'Create, run, and review accelerator, bootcamp, and incubator programs.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/applications', title: 'Applications', description: 'Review and score startup applications across all your open programs.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/cohorts', title: 'Cohorts', description: 'Manage program cohorts, mentor coverage, and participant progress.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/startups', title: 'Portfolio Startups', description: 'Startups currently in your programs and graduates.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/members', title: 'Team Members', description: 'Invite and manage who can run programs, review applications, and access settings.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/mentors', title: 'Mentor Pool', description: 'Mentors available to your cohorts. Invite by email or onboard from directory.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/events', title: 'Organization Events', description: 'Demo days, office hours, workshops, and pitch nights for your cohorts.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/analytics', title: 'Org Analytics', description: 'Cohort health, program impact, application funnel, and member growth.', section: 'Work', audience: ['org'], status: 'complete' },
  { path: '/org/settings', title: 'Organization Settings', description: 'Profile, branding, team, permissions, and billing for your organization.', section: 'Work', audience: ['org'], status: 'complete' },

  // ── Tenant admin ──
  { path: '/tenant/dashboard', title: 'Tenant dashboard', description: 'White-label community overview and key metrics.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/branding', title: 'Branding', description: 'Customize colors, logos, fonts, and landing page copy. Work in draft, then publish to apply across your tenant.', helpId: 'tenant-branding', helpTitle: 'Tenant branding', helpTitleEl: 'Επωνυμία tenant', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/sso', title: 'SSO / Authentication', description: 'Configure SAML, OIDC, or Google Workspace SSO. Optional rules map IdP claims to roles.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/domains', title: 'Domain Management', description: 'Add a subdomain or connect a custom domain. SSL is provisioned automatically once DNS verifies.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/members', title: 'Tenant Members', description: 'Invite, role, and remove members for your workspace.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/programs', title: 'Tenant Programs', description: 'Workspaces with programs unlock applications, cohorts, and structured mentoring.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/automation', title: 'Automation', description: 'Event-driven workflows: triggers, conditions, actions for your workspace.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/webhooks', title: 'Webhooks', description: 'Push real-time events to Zapier, Slack, or any HTTPS endpoint.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/api-keys', title: 'API Keys', description: 'Grant programmatic access scoped to specific permissions. Rotate regularly.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/billing', title: 'Organization Billing', description: 'Plan, seats, invoices, and payment methods for your workspace.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/analytics', title: 'Tenant Analytics', description: 'Member growth, engagement, and program activity for your workspace.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },
  { path: '/tenant/settings', title: 'Tenant Settings', description: 'General workspace settings: membership policy, notifications, and email preferences.', section: 'Tenant', audience: ['tenant_admin'], status: 'complete' },

  // ── Platform admin ──
  { path: '/admin', title: 'Admin dashboard', description: 'Platform-wide health, alerts, and quick actions.', helpId: 'admin-overview', helpTitle: 'What this console covers', helpTitleEl: 'Τι καλύπτει αυτή η κονσόλα', section: 'Admin', audience: ['platform_admin'], priority: 'critical', status: 'complete' },
  { path: '/admin/users', title: 'Users', description: 'Search and moderate platform accounts.', section: 'Admin', status: 'complete' },
  { path: '/admin/user-management', title: 'User management', description: 'Advanced filters, bulk actions, and verification controls.', helpId: 'admin-user-management', helpTitle: 'User management', helpTitleEl: 'Διαχείριση χρηστών', section: 'Admin', status: 'complete' },
  { path: '/admin/analytics', title: 'Global analytics', description: 'Growth, engagement, and financial platform metrics.', helpId: 'admin-analytics', helpTitle: 'Reading the analytics', helpTitleEl: 'Πώς διαβάζονται τα αναλυτικά', section: 'Admin', status: 'complete' },
  { path: '/admin/content-moderation', title: 'Content moderation', description: 'Review flagged posts, profiles, and media.', helpId: 'admin-content-moderation', helpTitle: 'Moderation queue', helpTitleEl: 'Ουρά εποπτείας', section: 'Admin', status: 'complete' },
  { path: '/admin/security-monitoring', title: 'Security monitoring', description: 'Auth events, anomalies, and audit trails.', helpId: 'admin-security', helpTitle: 'Security monitoring', helpTitleEl: 'Παρακολούθηση ασφάλειας', section: 'Admin', status: 'complete' },
  { path: '/admin/community-management', title: 'Community management', description: 'Inspect community health, growth, and flagged content.', helpId: 'admin-community-management', helpTitle: 'Community management', helpTitleEl: 'Διαχείριση κοινοτήτων', section: 'Admin', status: 'complete' },
  { path: '/admin/mentorship-management', title: 'Mentorship management', description: 'Approve mentors, review credentials, and monitor session quality.', helpId: 'admin-mentorship', helpTitle: 'Mentorship management', helpTitleEl: 'Διαχείριση mentorship', section: 'Admin', status: 'complete' },
  { path: '/admin/system-settings', title: 'System settings', description: 'Platform-wide toggles for maintenance, registration, and email.', helpId: 'admin-system-settings', helpTitle: 'System settings', helpTitleEl: 'Ρυθμίσεις συστήματος', section: 'Admin', status: 'complete' },
  // Without their own entry these fell through to `/admin` and each announced
  // itself as "Admin dashboard — platform-wide health", which is a different
  // page. Titles here match the heading each route already renders.
  { path: '/admin/dashboard', title: 'Admin dashboard', description: 'Platform-wide health, alerts, and quick actions.', section: 'Admin', audience: ['platform_admin'], status: 'complete' },
  { path: '/admin/audit-log', title: 'Audit log', description: 'Immutable record of administrative actions — who changed what, and when.', section: 'Admin', status: 'complete' },
  { path: '/admin/automations', title: 'Automation rules', description: 'Trigger-and-action rules that run without manual review.', section: 'Admin', status: 'complete' },
  { path: '/admin/billing', title: 'Billing administration', description: 'Platform revenue, invoices, and subscription states across all accounts.', section: 'Admin', status: 'complete' },
  { path: '/admin/communities', title: 'Communities', description: 'Every community on the platform, with membership and activity levels.', section: 'Admin', status: 'complete' },
  { path: '/admin/domains', title: 'Domain management', description: 'Verify and route custom domains for tenant workspaces.', section: 'Admin', status: 'complete' },
  { path: '/admin/feature-flags', title: 'Feature flags', description: 'Roll features out or back per environment without a deploy.', section: 'Admin', status: 'complete' },
  { path: '/admin/programs', title: 'Programs', description: 'Accelerators and cohorts platform-wide — approve, pause, or audit.', section: 'Admin', status: 'complete' },
  { path: '/admin/reports', title: 'Reports & moderation', description: 'User-submitted reports awaiting a moderation decision.', section: 'Admin', status: 'complete' },
  { path: '/admin/sso', title: 'SSO configuration', description: 'Identity providers, ACS endpoints, and test sign-in for enterprise tenants.', section: 'Admin', status: 'complete' },
  { path: '/admin/taxonomy', title: 'Taxonomy management', description: 'Skills, industries, and stage vocabularies that matching and search read from.', section: 'Admin', status: 'complete' },
  { path: '/admin/tenants', title: 'Tenant management', description: 'Provision, suspend, and inspect tenant workspaces.', section: 'Admin', status: 'complete' },

  // ── Account ──
  { path: '/profile', title: 'My Profile', description: 'This is exactly how others see you. Keep skills, headline, and bio current \u2014 it powers matches and search.', section: 'Account', status: 'complete' },
  { path: '/profile/edit', title: 'Edit profile', description: 'Update photo, bio, skills, and visibility settings. Changes save automatically as you type.', section: 'Account', status: 'partial' },
  { path: '/settings', title: 'Settings', description: 'Manage billing, notifications, integrations, and privacy.', helpId: 'settings', helpTitle: 'Settings overview', helpTitleEl: 'Επισκόπηση ρυθμίσεων', section: 'Account', priority: 'high', status: 'complete' },
  // Each settings sub-page previously inherited the hub's "Manage billing,
  // notifications, integrations, and privacy" line, so all four described the
  // same four things instead of the one the user actually opened.
  { path: '/settings/ai', title: 'AI assistant', description: 'Choose the model and default agent that answer your questions across the platform.', section: 'Account', status: 'complete' },
  { path: '/settings/billing', title: 'Plan & billing', description: 'Your current plan, what it includes, and where invoices are sent.', section: 'Account', status: 'complete' },
  { path: '/settings/notifications', title: 'Notification preferences', description: 'Pick which events reach you by email and how often digests arrive.', section: 'Account', status: 'complete' },
  { path: '/settings/data-export', title: 'Data export', description: 'Download a copy of your profile, messages, and activity.', section: 'Account', status: 'complete' },
  { path: '/notifications', title: 'Notifications', description: 'Activity alerts — matches, messages, and program updates.', section: 'Account', status: 'complete' },
  { path: '/achievements', title: 'Achievements', description: 'Badges and XP earned from platform activity.', section: 'Account', status: 'complete' },
  { path: '/help', title: 'Help & support', description: 'Guides, FAQs, and contact options.', section: 'Resources', status: 'complete' },

  // ── Programs, jobs, marketplace, community ──
  { path: '/jobs', title: 'Jobs & roles', description: 'Equity, full-time, and contract roles posted by startups on the platform.', section: 'Resources', status: 'complete' },
  { path: '/opportunities', title: 'Opportunities', description: 'Co-founder calls, paid gigs, equity roles, and short-term collaborations in one feed.', section: 'Resources', status: 'complete' },
  { path: '/events', title: 'Events', description: 'Workshops, demo days, meetups, and online sessions \u2014 RSVP and add to calendar.', section: 'Resources', status: 'complete' },
  { path: '/events/create', title: 'Create event', description: 'Publish a workshop, demo day, or meetup for the community to RSVP to.', section: 'Resources', status: 'complete' },
  { path: '/learning', title: 'Learning hub', description: 'Curated courses, founder guides, and templates aligned with your readiness gaps.', section: 'Resources', status: 'complete' },
  { path: '/groups', title: 'Communities', description: 'Industry, stage, and interest-based groups. Join to participate; create your own anytime.', section: 'Community', status: 'complete' },
  { path: '/posts', title: 'Feed', description: 'Updates from your network, communities, and people you follow.', section: 'Community', status: 'complete' },
  { path: '/mentoring', title: 'Find mentors', description: 'Directory of vetted mentors \u2014 filter by expertise, timezone, and rate.', section: 'Explore', status: 'complete' },

  // ── Mentor sub-pages ──
  { path: '/mentor/profile-setup', title: 'Mentor setup', description: 'Tell founders what you offer, your rates, and your availability.', section: 'Work', audience: ['mentor'], status: 'complete' },

  // ── Investor sub-pages ──
  { path: '/investor/profile-setup', title: 'Investor setup', description: 'Configure thesis, check size, sectors, and stages to receive matching dealflow.', section: 'Work', audience: ['investor'], status: 'complete' },

  // ── Provider sub-pages ──
  { path: '/provider/listings', title: 'My listings', description: 'Manage services you offer to startups on the marketplace.', section: 'Work', audience: ['service_provider'], status: 'complete' },
];

const DYNAMIC_PATTERNS: Array<{ pattern: RegExp; meta: Omit<PageMeta, 'path'> & { path?: string } }> = [
  {
    pattern: /^\/matches\/[^/]+$/,
    meta: {
      title: 'Match detail',
      description: 'Compatibility breakdown and suggested next steps with this person.',
      section: 'Explore',
      status: 'complete',
    },
  },
  {
    pattern: /^\/profiles\/[^/]+$/,
    meta: {
      title: 'Member profile',
      description: 'Public profile — connect, message, or save to shortlist.',
      section: 'Explore',
      status: 'complete',
    },
  },
  {
    pattern: /^\/admin\/user-detail\/[^/]+$/,
    meta: {
      title: 'User detail',
      description: 'Full admin view — activity, moderation history, and account controls.',
      section: 'Admin',
      status: 'complete',
    },
  },
  {
    pattern: /^\/research\/[^/]+$/,
    meta: {
      title: 'Research canvas',
      description: 'Collaborative whiteboard for startup research.',
      section: 'Work',
      status: 'complete',
    },
  },
  {
    pattern: /^\/groups\/[^/]+$/,
    meta: {
      title: 'Community',
      description: 'Posts, members, and events for this group.',
      section: 'Community',
      status: 'complete',
    },
  },
  // `/projects/create` is matched exactly above, so this pattern only ever sees
  // a real project id.
  {
    pattern: /^\/projects\/(?!create$)[^/]+$/,
    meta: {
      title: 'Project',
      description: 'Overview, open roles, team, milestones, and updates for this project.',
      helpId: 'projects',
      helpTitle: 'How projects work',
      helpTitleEl: 'Πώς δουλεύουν τα έργα',
      section: 'Work',
      status: 'complete',
    },
  },
  {
    pattern: /^\/org\/cohorts\/[^/]+$/,
    meta: {
      title: 'Cohort',
      description: 'Participants, mentor coverage, and recent matches for this cohort.',
      section: 'Work',
      status: 'complete',
    },
  },
];

/** Resolve metadata for the current pathname (exact match first, then dynamic). */
export function getPageMeta(pathname: string): PageMeta | undefined {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const exact = PAGE_REGISTRY.find((p) => p.path === normalized);
  let meta: PageMeta | undefined;

  if (exact) {
    meta = exact;
  } else {
    for (const { pattern, meta: dynamicMeta } of DYNAMIC_PATTERNS) {
      if (pattern.test(normalized)) {
        meta = { path: normalized, ...dynamicMeta };
        break;
      }
    }

    if (!meta) {
      const sorted = [...PAGE_REGISTRY].sort((a, b) => b.path.length - a.path.length);
      for (const entry of sorted) {
        if (entry.path !== '/' && normalized.startsWith(entry.path)) {
          meta = { ...entry, path: normalized };
          break;
        }
      }
    }
  }

  if (!meta) return undefined;

  const el = getPageMetaEl(normalized);
  if (!el) return meta;

  return {
    ...meta,
    titleEl: meta.titleEl ?? el.title,
    descriptionEl: meta.descriptionEl ?? el.description,
  };
}

export type PageMetaOverrides = Partial<Pick<PageMeta, 'title' | 'description' | 'titleEl' | 'descriptionEl'>>;

/** Merge explicit AppShell props with registry defaults. */
export function resolvePageHeader(
  pathname: string,
  overrides?: PageMetaOverrides,
): { title?: string; titleEl?: string; description?: string; descriptionEl?: string; meta?: PageMeta } {
  const meta = getPageMeta(pathname);
  return {
    title: overrides?.title ?? meta?.title,
    titleEl: overrides?.titleEl ?? meta?.titleEl,
    description: overrides?.description ?? meta?.description,
    descriptionEl: overrides?.descriptionEl ?? meta?.descriptionEl,
    meta,
  };
}
