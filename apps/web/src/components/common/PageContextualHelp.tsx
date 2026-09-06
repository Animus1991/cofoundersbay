'use client';

import type { ReactNode } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { HelpCallout } from '@/components/common/HelpCallout';

type PageContextualHelpProps = {
  /** Override registry help id */
  id?: string;
  title?: string;
  children?: ReactNode;
};

/**
 * Curated copy per page — concrete, actionable, no marketing fluff.
 * Falls back to the page description when no curated copy exists.
 */
const HELP_CONTENT: Record<string, ReactNode> = {
  builder: (
    <>
      <p>
        The Builder turns scattered notes into investor-ready artefacts. Move through{' '}
        <strong>Idea → Market → Business Model → MVP → Financials → Pitch</strong> at your own pace —
        progress unlocks the Pitch Deck and Application Generator tabs automatically.
      </p>
      <p>
        Every change syncs across collaborators in real time. Use <strong>Version History</strong> to roll back
        without losing data.
      </p>
    </>
  ),
  readiness: (
    <>
      <p>
        Your score combines 6 dimensions: <strong>Idea, Market, Team, Product, Traction, Funding</strong>. Each is
        weighted by stage — pre-seed weighs Team and Idea more, Series A weighs Traction and Funding.
      </p>
      <p>
        Click any dimension card to see what is missing. Hit <em>Reassess</em> after major updates (new MVP, signed LOI,
        team change) to refresh the score.
      </p>
    </>
  ),
  discover: (
    <>
      <p>
        Use Discover to <strong>browse</strong> with filters; use <a href="/matches">Matches</a> to see{' '}
        <strong>ranked</strong> suggestions. Combine role + skills + location to find specific profiles.
      </p>
      <p>
        Bookmark interesting people to <a href="/shortlist">Saved</a> and send a Connect request when ready.
      </p>
    </>
  ),
  fundraising: (
    <>
      <p>
        Kanban columns map to standard fundraising stages:{' '}
        <strong>Intro → Meeting → Diligence → Term Sheet → Closed/Passed</strong>. Drag cards as deals progress.
      </p>
      <p>
        The <strong>Data Room</strong> tab holds documents shared with investors via tokenised links — nothing is
        public unless you share it.
      </p>
    </>
  ),
  matches: (
    <>
      <p>
        Match score is computed from{' '}
        <strong>role complementarity, skill overlap, stage alignment, commitment, and location</strong>. Higher scores
        are stronger fits, but always read the &ldquo;Why you match&rdquo; reasons before reaching out.
      </p>
      <p>
        Click the chart icon on a card to see the compatibility breakdown, or open Compare to put two profiles side by side.
      </p>
    </>
  ),
  connections: (
    <>
      <p>
        <strong>Pending</strong> shows requests waiting for your response. <strong>Active</strong> is your network —
        message, schedule a call, or remove from the menu.
      </p>
      <p>
        Saved profiles you have not yet contacted live in <a href="/shortlist">Saved profiles</a>.
      </p>
    </>
  ),
  settings: (
    <>
      <p>
        Update notification frequency, manage billing and integrations, and control profile visibility. Changes save
        instantly.
      </p>
      <p>
        For privacy-sensitive actions (export data, delete account), see{' '}
        <a href="/settings/data-export">Data export</a>.
      </p>
    </>
  ),
  'dashboard-founder': (
    <>
      <p>
        Your dashboard surfaces the <strong>single next action</strong> most likely to move your startup forward right
        now — backed by your readiness score, recent activity, and platform signals.
      </p>
      <p>The widgets below it are reference cards: matches, recent messages, milestones, and gamified progress.</p>
    </>
  ),
  milestones: (
    <>
      <p>
        Milestones are atomic goals with owners and dates. Group them by quarter or theme. Completed milestones feed
        your readiness score and produce evidence for investor updates.
      </p>
    </>
  ),
  'tenant-branding': (
    <>
      <p>
        Branding changes preview live in the right panel and apply to your tenant&rsquo;s public landing and emails.
        Nothing goes live until you click <strong>Publish</strong> — work in draft as long as you need.
      </p>
    </>
  ),
  'admin-user-management': (
    <>
      <p>
        Use the <strong>filters</strong> on the left to narrow by role or status. Select rows with checkboxes for{' '}
        <strong>bulk activate, suspend, or delete</strong>. Open a user with the eye icon or row menu — full detail
        lives on the user detail page.
      </p>
    </>
  ),
  onboarding: (
    <>
      <p>
        Each step shapes one part of your match score: <strong>role</strong> decides who appears as a candidate,{' '}
        <strong>skills</strong> drive overlap, <strong>stage</strong> filters out misalignment,{' '}
        <strong>commitment</strong> filters timing, and <strong>location</strong> is a small tie-breaker.
      </p>
      <p>
        You can edit any answer later in <a href="/profile/edit">Edit profile</a>.
      </p>
    </>
  ),
  'admin-analytics': (
    <>
      <p>
        <strong>Active</strong> users logged in during the selected range. Role charts show signup mix — use this to
        balance supply (mentors/investors) vs demand (founders). Tenant count reflects white-label communities.
      </p>
    </>
  ),
  'admin-content-moderation': (
    <>
      <p>
        Open items need a decision: <strong>Resolve</strong> if action was taken (warn/suspend content),{' '}
        <strong>Dismiss</strong> if the report was invalid. Resolved items stay in history for audit.
      </p>
    </>
  ),
  'admin-security': (
    <>
      <p>
        <strong>Critical</strong> events need immediate review. Failed-login clusters may indicate credential stuffing;
        export spikes may indicate data exfiltration attempts. Cross-check with the audit log for context.
      </p>
    </>
  ),
  'admin-mentorship': (
    <>
      <p>
        <strong>Pending</strong> mentors need profile and credential review before appearing in{' '}
        <a href="/mentoring">Mentoring</a>. Session count and rating help identify top contributors vs. inactive
        listings.
      </p>
    </>
  ),
  'admin-community-management': (
    <>
      <p>
        Communities with status <strong>review</strong> were flagged or auto-held for first-time creators. High
        post-to-member ratio indicates healthy engagement; low activity may need admin outreach.
      </p>
    </>
  ),
  messages: (
    <>
      <p>
        <strong>Chats</strong> are open conversations with people you are already connected to.{' '}
        <strong>Intro requests</strong> are first messages from someone outside your network — accepting one
        starts a chat, declining it does not notify them.
      </p>
      <p>
        Nobody can message you directly until you connect or accept their intro, so an empty Chats tab usually
        means there are requests waiting next door.
      </p>
    </>
  ),
  'admin-overview': (
    <>
      <p>
        This is the platform-wide console: pending <strong>reports</strong>, user and cohort management, events
        and job postings, and the role distribution chart. Counts here cover every tenant, not one community.
      </p>
      <p>
        Each card links to the specialised screen — <a href="/admin/user-management">User management</a> for bulk
        actions and filters, <a href="/admin/content-moderation">Content moderation</a> for the report queue, and{' '}
        <a href="/admin/security-monitoring">Security monitoring</a> for auth anomalies.
      </p>
    </>
  ),
  'admin-system-settings': (
    <>
      <p>
        <strong>Maintenance mode</strong> shows a banner and blocks new sessions for non-admins.{' '}
        <strong>Registration</strong> toggle pauses new signups without affecting existing users.
      </p>
    </>
  ),
};

/**
 * Renders contextual help from page-registry when helpId/helpTitle exist,
 * or explicit props when provided.
 */
export function PageContextualHelp({ id, title, children }: PageContextualHelpProps) {
  const meta = usePageMeta();
  const helpId = id ?? meta?.helpId;
  const helpTitle = title ?? meta?.helpTitle ?? meta?.title;

  if (!helpId || !helpTitle) return null;

  const body = children ?? HELP_CONTENT[helpId] ?? (meta?.description ? <p>{meta.description}</p> : null);

  if (!body) return null;

  return (
    <HelpCallout id={helpId} title={helpTitle}>
      {body}
    </HelpCallout>
  );
}
