-- Baseline: the rest of schema.prisma (docs §59.4.1, §111).
--
-- The five earlier migrations create 65 of the schema's 212 tables; every
-- other model was added with `prisma db push`, so `prisma migrate deploy` on
-- an empty database built most of the product without its tables. This
-- migration is `prisma migrate diff --from-migrations prisma/migrations
-- --to-schema-datamodel prisma/schema.prisma`, replayed on Postgres 16, with
-- one statement made lossless (TenantMembership.role, below).
--
-- A database made with `db push` already has these tables: record the
-- migrations as applied instead of running them, with
-- `pnpm --filter @cofounderbay/api db:baseline` (scripts/baseline-existing-db.mjs),
-- which first checks that the database matches the schema.

-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('aspiring_founder', 'existing_founder', 'cofounder_candidate', 'technical_talent', 'business_operator', 'mentor', 'advisor', 'coach', 'course_creator', 'incubator_admin', 'accelerator_admin', 'university_admin', 'venture_studio_admin', 'angel_investor', 'vc_scout', 'vc_analyst', 'syndicate_manager', 'service_provider', 'legal_partner', 'finance_advisor', 'recruiter', 'platform_admin');

-- CreateEnum
CREATE TYPE "RoleFacetScope" AS ENUM ('global', 'tenant', 'workspace', 'community', 'program');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('incubator', 'accelerator', 'university', 'venture_studio', 'innovation_hub', 'vc_fund', 'angel_syndicate', 'public_body', 'service_provider', 'corporate_innovation', 'chamber', 'cluster', 'ngo');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('owner', 'admin', 'program_manager', 'mentor', 'reviewer', 'member');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('accelerator', 'incubator', 'course', 'competition', 'grant', 'challenge', 'bootcamp', 'fellowship');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('draft', 'upcoming', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "ProgramParticipantRole" AS ENUM ('participant', 'mentor', 'judge', 'organizer', 'reviewer', 'observer');

-- CreateEnum
CREATE TYPE "ProgramParticipantStatus" AS ENUM ('applied', 'accepted', 'active', 'completed', 'dropped', 'rejected');

-- CreateEnum
CREATE TYPE "MentorAvailabilityStatus" AS ENUM ('available', 'limited', 'unavailable', 'by_invitation');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('angel', 'vc', 'scout', 'syndicate', 'cvc', 'family_office', 'institutional');

-- CreateEnum
CREATE TYPE "ServiceProviderType" AS ENUM ('legal', 'accounting', 'development', 'design', 'marketing', 'recruiting', 'consulting', 'coaching');

-- CreateEnum
CREATE TYPE "ConversationValidationMode" AS ENUM ('casual', 'one_party', 'two_party');

-- CreateEnum
CREATE TYPE "ResearchNodeType" AS ENUM ('note', 'document', 'image', 'pdf', 'link', 'reference');

-- CreateEnum
CREATE TYPE "ResearchBoardVisibility" AS ENUM ('private', 'team', 'organization', 'public');

-- CreateEnum
CREATE TYPE "TenantMemberRole" AS ENUM ('owner', 'admin', 'manager', 'member');

-- CreateEnum
CREATE TYPE "MentorshipRelationshipStatus" AS ENUM ('pending', 'active', 'paused', 'completed', 'terminated');

-- CreateEnum
CREATE TYPE "MentorRequestStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "WatchlistItemStatus" AS ENUM ('watching', 'in_pipeline', 'passed');

-- CreateEnum
CREATE TYPE "CommitmentKind" AS ENUM ('cofounder', 'equity_role', 'investor_intro');

-- CreateEnum
CREATE TYPE "CommitmentOutcome" AS ENUM ('open', 'in_discussion', 'agreed', 'closed');

-- CreateEnum
CREATE TYPE "CommitmentStep" AS ENUM ('interest', 'conversation', 'terms', 'agreed', 'closed');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('todo', 'in_progress', 'blocked', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ResearchBoardCollaboratorRole" AS ENUM ('viewer', 'editor', 'admin', 'owner');

-- CreateEnum
CREATE TYPE "ResearchCommentType" AS ENUM ('general', 'suggestion', 'question', 'resolved', 'pin');

-- CreateEnum
CREATE TYPE "CanvasBranchStatus" AS ENUM ('active', 'merged', 'archived');

-- CreateEnum
CREATE TYPE "CanvasMergeStrategy" AS ENUM ('fast_forward', 'manual', 'conflict_resolved');

-- CreateEnum
CREATE TYPE "CanvasVersionTrigger" AS ENUM ('manual', 'autosave', 'checkpoint', 'pre_merge', 'post_merge', 'branch_create', 'restore');

-- CreateEnum
CREATE TYPE "BuilderWorkspaceStatus" AS ENUM ('draft', 'active', 'archived', 'completed');

-- CreateEnum
CREATE TYPE "BuilderWorkspaceVisibility" AS ENUM ('private', 'team', 'organization', 'public');

-- CreateEnum
CREATE TYPE "BuilderDocumentType" AS ENUM ('idea_core', 'business_model_canvas', 'market_analysis', 'pitch_deck', 'mvp_plan', 'financial_plan', 'technical_architecture', 'prd', 'branding_kit', 'application', 'custom', 'swot_analysis', 'lean_canvas', 'competitive_analysis', 'customer_personas', 'go_to_market', 'fundraising_memo', 'venture_memo', 'investor_update', 'mentor_feedback', 'evaluator_scorecard', 'strategy_doc', 'meeting_notes', 'board_minutes', 'term_sheet', 'cap_table', 'team_charter', 'partnership_agreement', 'founder_agreement', 'vesting_schedule', 'product_roadmap', 'sprint_plan', 'retrospective', 'user_research', 'ab_test_plan', 'growth_model', 'unit_economics', 'cohort_analysis');

-- CreateEnum
CREATE TYPE "BuilderDocumentStatus" AS ENUM ('draft', 'in_progress', 'review', 'approved', 'archived');

-- CreateEnum
CREATE TYPE "BuilderCollaboratorRole" AS ENUM ('owner', 'editor', 'commenter', 'viewer');

-- CreateEnum
CREATE TYPE "BuilderCommentStatus" AS ENUM ('open', 'resolved', 'archived');

-- CreateEnum
CREATE TYPE "BuilderReviewStatus" AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicationTemplateType" AS ENUM ('yc', 'techstars', 'university_incubator', 'grant', 'custom');

-- CreateEnum
CREATE TYPE "ReadinessDimension" AS ENUM ('team', 'market', 'product', 'business', 'funding', 'execution');

-- CreateEnum
CREATE TYPE "MatchSuggestionStatus" AS ENUM ('pending', 'viewed', 'saved', 'dismissed', 'connected');

-- CreateEnum
CREATE TYPE "FeatureFlagScope" AS ENUM ('global', 'tenant', 'user', 'role', 'plan');

-- CreateEnum
CREATE TYPE "PlanBillingInterval" AS ENUM ('monthly', 'quarterly', 'annual', 'lifetime');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('active', 'paused', 'failed', 'revoked');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('onboarding', 'matching', 'collaboration', 'builder', 'community', 'mentoring', 'milestone', 'program', 'streak', 'platform');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('all', 'founders', 'mentors', 'investors', 'orgs', 'tenant', 'program');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "FundraisingRoundType" AS ENUM ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'safe', 'convertible_note', 'grant', 'revenue_based', 'other');

-- CreateEnum
CREATE TYPE "FundraisingRoundStatus" AS ENUM ('planning', 'active', 'closing', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "InvestorLeadStatus" AS ENUM ('prospect', 'contacted', 'meeting', 'due_diligence', 'committed', 'passed', 'inactive');

-- CreateEnum
CREATE TYPE "DataRoomDocCategory" AS ENUM ('pitch', 'financials', 'legal', 'product', 'market', 'team', 'traction', 'other');

-- CreateEnum
CREATE TYPE "DataRoomDocStatus" AS ENUM ('draft', 'ready', 'shared', 'archived');

-- CreateEnum
CREATE TYPE "CoachingSessionStatus" AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "CoachingSessionType" AS ENUM ('accountability', 'clarity', 'team_dynamics', 'execution', 'strategy', 'wellbeing', 'other');

-- CreateEnum
CREATE TYPE "ExpertReviewStatus" AS ENUM ('requested', 'accepted', 'in_progress', 'submitted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "ExpertReviewType" AS ENUM ('pitch_deck', 'business_model', 'financial_model', 'legal_structure', 'market_analysis', 'go_to_market', 'technical_architecture', 'product_strategy', 'general');

-- CreateEnum
CREATE TYPE "ServiceOfferStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "ServicePricingModel" AS ENUM ('fixed', 'hourly', 'monthly_retainer', 'project_based', 'equity', 'free', 'contact_for_pricing');

-- CreateEnum
CREATE TYPE "ServiceInquiryStatus" AS ENUM ('open', 'in_discussion', 'accepted', 'declined', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "VentureStatus" AS ENUM ('ideation', 'validation', 'building', 'launched', 'scaling', 'exited', 'failed', 'inactive');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "WorkspaceCommentType" AS ENUM ('general', 'suggestion', 'question', 'issue', 'approval');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'disputed', 'canceled');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('subscription_charge', 'one_time', 'addon', 'refund', 'credit_adjustment', 'manual_charge');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('ai_credits', 'api_calls', 'storage_bytes', 'workspaces', 'team_members', 'mentor_sessions', 'exports', 'messages');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed_amount');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'registered', 'converted');

-- CreateEnum
CREATE TYPE "PortfolioItemType" AS ENUM ('project', 'publication', 'award', 'certification', 'patent', 'open_source', 'case_study', 'press', 'other');

-- CreateEnum
CREATE TYPE "AIAssistantContext" AS ENUM ('general', 'workspace_builder', 'pitch_deck', 'fundraising', 'mentor_prep', 'match_explanation', 'program_application', 'readiness_coach');

-- CreateEnum
CREATE TYPE "AIMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "MentorshipGoalStatus" AS ENUM ('active', 'in_progress', 'completed', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('milestone', 'session', 'event', 'deadline', 'meeting', 'reminder');

-- CreateEnum
CREATE TYPE "FeedPostType" AS ENUM ('text', 'announcement', 'milestone_share', 'workspace_update', 'question', 'poll', 'event_share', 'resource_share');

-- CreateEnum
CREATE TYPE "FeedPostVisibility" AS ENUM ('public', 'connections_only', 'community_only', 'tenant_only', 'private');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('work_email', 'linkedin_identity', 'linkedin_workplace', 'admin');

-- CreateEnum
CREATE TYPE "FounderUpdateVisibility" AS ENUM ('followers', 'public');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'waiting_on_user', 'waiting_on_support', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('account', 'billing', 'technical', 'feature_request', 'bug_report', 'matching', 'messaging', 'workspace', 'community', 'program', 'other');

-- CreateEnum
CREATE TYPE "SavedSearchType" AS ENUM ('cofounder', 'mentor', 'investor', 'startup', 'opportunity', 'program', 'community', 'member', 'job');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('info', 'warning', 'success', 'maintenance', 'feature', 'promotion');

-- CreateEnum
CREATE TYPE "AnnouncementTarget" AS ENUM ('all', 'founders', 'mentors', 'investors', 'tenants', 'specific_roles');

-- CreateEnum
CREATE TYPE "AIAgentType" AS ENUM ('general', 'matching', 'research', 'pitch_coach', 'mentor_finder', 'market_analyst', 'fundraising', 'legal_advisor', 'technical_advisor', 'growth_strategist');

-- CreateEnum
CREATE TYPE "ArtifactBranchStatus" AS ENUM ('open', 'review', 'merged', 'closed', 'abandoned');

-- CreateEnum
CREATE TYPE "ChangeProposalStatus" AS ENUM ('open', 'approved', 'changes_requested', 'merged', 'closed');

-- CreateEnum
CREATE TYPE "ShareLinkPermission" AS ENUM ('view', 'comment', 'suggest');

-- CreateEnum
CREATE TYPE "VersionTrigger" AS ENUM ('explicit', 'autosave', 'pre_merge', 'merge', 'review_snapshot', 'published', 'restore');

-- CreateEnum
CREATE TYPE "XPEventType" AS ENUM ('CREATE_ARTIFACT', 'COMPLETE_ARTIFACT', 'IMPROVE_ARTIFACT', 'CREATE_BOARD', 'SYNTHESIZE_BOARD', 'LINK_ARTIFACTS', 'INVITE_COLLABORATOR', 'TEAM_CONTRIBUTION', 'HIGH_QUALITY_CONTRIBUTION', 'RECEIVE_MENTOR_FEEDBACK', 'APPLY_FEEDBACK', 'COMPLETE_REVIEW', 'PROVIDE_FEEDBACK', 'COMPLETE_MILESTONE', 'VALIDATED_PROGRESS', 'STREAK_BONUS');

-- CreateEnum
CREATE TYPE "GamificationBadgeCategory" AS ENUM ('progress', 'consistency', 'collaboration', 'quality', 'learning', 'execution');

-- CreateEnum
CREATE TYPE "GamificationBadgeRarity" AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('meaningful_daily');

-- CreateEnum
CREATE TYPE "AbuseFlagType" AS ENUM ('burst_spam', 'low_quality_repetition', 'fake_collaboration', 'streak_manipulation', 'empty_node_spam', 'self_link_abuse', 'mutual_endorsement_ring');

-- CreateEnum
CREATE TYPE "AbuseFlagStatus" AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');

-- CreateEnum
CREATE TYPE "OpenToVisibility" AS ENUM ('nobody', 'verified', 'everyone');

-- CreateEnum
CREATE TYPE "IntroStatus" AS ENUM ('pending', 'forwarded', 'declined', 'accepted', 'not_now', 'withdrawn');

-- CreateEnum
CREATE TYPE "ScoutProposalStatus" AS ENUM ('proposed', 'saved', 'dismissed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'mentor_request';
ALTER TYPE "NotificationType" ADD VALUE 'mentor_session_reminder';
ALTER TYPE "NotificationType" ADD VALUE 'mentor_review_received';
ALTER TYPE "NotificationType" ADD VALUE 'match_suggestion';
ALTER TYPE "NotificationType" ADD VALUE 'endorsement_received';
ALTER TYPE "NotificationType" ADD VALUE 'endorsement_request';
ALTER TYPE "NotificationType" ADD VALUE 'workspace_comment';
ALTER TYPE "NotificationType" ADD VALUE 'workspace_review';
ALTER TYPE "NotificationType" ADD VALUE 'workspace_invite';
ALTER TYPE "NotificationType" ADD VALUE 'program_application';
ALTER TYPE "NotificationType" ADD VALUE 'program_accepted';
ALTER TYPE "NotificationType" ADD VALUE 'program_rejected';
ALTER TYPE "NotificationType" ADD VALUE 'milestone_due';
ALTER TYPE "NotificationType" ADD VALUE 'milestone_completed';
ALTER TYPE "NotificationType" ADD VALUE 'group_invite';
ALTER TYPE "NotificationType" ADD VALUE 'group_post';
ALTER TYPE "NotificationType" ADD VALUE 'referral_converted';
ALTER TYPE "NotificationType" ADD VALUE 'follow_new';
ALTER TYPE "NotificationType" ADD VALUE 'ai_generation_complete';
ALTER TYPE "NotificationType" ADD VALUE 'expert_review_submitted';
ALTER TYPE "NotificationType" ADD VALUE 'coaching_session_reminder';
ALTER TYPE "NotificationType" ADD VALUE 'fundraising_update';
ALTER TYPE "NotificationType" ADD VALUE 'commitment_update';
ALTER TYPE "NotificationType" ADD VALUE 'founder_update';
ALTER TYPE "NotificationType" ADD VALUE 'organization_invite';
ALTER TYPE "NotificationType" ADD VALUE 'intro_request';

-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'team';

-- AlterEnum
ALTER TYPE "UploadKind" ADD VALUE 'research_asset';

-- AlterTable
ALTER TABLE "MentorBooking" ALTER COLUMN "currency" SET DEFAULT 'EUR';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "featureOverrides" JSONB,
ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "settings" JSONB;

-- AlterTable
-- Converted in place rather than dropped and re-added (Prisma's diff), so a
-- database built from the earlier migrations keeps each member's role. A
-- value the enum does not know becomes 'member', the column's default.
ALTER TABLE "TenantMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "TenantMembership" ALTER COLUMN "role" TYPE "TenantMemberRole"
  USING (CASE WHEN "role" IN ('owner', 'admin', 'manager', 'member') THEN "role"::"TenantMemberRole" ELSE 'member'::"TenantMemberRole" END);
ALTER TABLE "TenantMembership" ALTER COLUMN "role" SET DEFAULT 'member';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "ConversationValidation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "mode" "ConversationValidationMode" NOT NULL DEFAULT 'casual',
    "initiatedById" TEXT,
    "initiatedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "validationHash" TEXT,
    "transcriptAvailable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransparencyEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransparencyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentCard" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "CommitmentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "exists" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "missing" TEXT NOT NULL,
    "offerRole" TEXT NOT NULL,
    "offerEquity" TEXT,
    "offerHours" INTEGER NOT NULL,
    "offerScope" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "place" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "stage" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "projectRef" TEXT,
    "evidence" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "history" JSONB,
    "status" "CommitmentOutcome" NOT NULL DEFAULT 'open',
    "closedReason" TEXT,
    "settledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitmentCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentThread" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "step" "CommitmentStep" NOT NULL DEFAULT 'interest',
    "note" TEXT,
    "cardVersion" INTEGER NOT NULL DEFAULT 1,
    "ownerConfirmedAt" TIMESTAMP(3),
    "candidateConfirmedAt" TIMESTAMP(3),
    "revisions" INTEGER NOT NULL DEFAULT 0,
    "dealRoomActive" BOOLEAN NOT NULL DEFAULT false,
    "agreedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closedReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitmentThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitmentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentTerms" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "proposedById" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "equityPct" DOUBLE PRECISION,
    "vestingMonths" INTEGER,
    "cliffMonths" INTEGER,
    "hoursPerWeek" INTEGER,
    "scope" TEXT NOT NULL,
    "note" TEXT,
    "ownerAcceptedAt" TIMESTAMP(3),
    "candidateAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitmentTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingContact" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "vatId" TEXT,
    "taxId" TEXT,
    "legalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "collaboratorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "connectionRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProfile" (
    "id" TEXT NOT NULL,
    "savedById" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorDeal" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "founderId" TEXT,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "companyStage" TEXT,
    "teamSize" INTEGER,
    "pipelineStage" TEXT NOT NULL DEFAULT 'discovered',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "askAmountCents" INTEGER,
    "investedCents" INTEGER,
    "currentValueCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "investedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorDealEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "fromStage" TEXT,
    "toStage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorDealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endorsement" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "skill" TEXT,
    "content" TEXT NOT NULL,
    "relationship" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "basis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchBoard" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "ResearchBoardVisibility" NOT NULL DEFAULT 'private',
    "canvasState" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" TEXT,
    "icon" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchNode" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "type" "ResearchNodeType" NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "url" TEXT,
    "uploadId" TEXT,
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 280,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "refEntityType" TEXT,
    "refEntityId" TEXT,
    "builderDocumentId" TEXT,
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchConnector" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "label" TEXT,
    "color" TEXT,
    "style" TEXT DEFAULT 'solid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchConnector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchBoardCollaborator" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ResearchBoardCollaboratorRole" NOT NULL DEFAULT 'viewer',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchBoardCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchComment" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "commentType" "ResearchCommentType" NOT NULL DEFAULT 'general',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "posX" DOUBLE PRECISION,
    "posY" DOUBLE PRECISION,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchBoardSnapshot" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "label" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'manual',
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "nodeData" JSONB NOT NULL,
    "connectors" JSONB,
    "canvasState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchBoardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasVersion" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "branchId" TEXT,
    "parentVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "label" TEXT,
    "changeSummary" TEXT,
    "triggerType" "CanvasVersionTrigger" NOT NULL DEFAULT 'manual',
    "nodeData" JSONB NOT NULL,
    "connectors" JSONB,
    "canvasState" JSONB,
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "diffData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanvasVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasBranch" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseVersionId" TEXT,
    "headVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "CanvasBranchStatus" NOT NULL DEFAULT 'active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanvasBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasMerge" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "sourceBranchId" TEXT NOT NULL,
    "targetBranchId" TEXT NOT NULL,
    "mergedById" TEXT NOT NULL,
    "strategy" "CanvasMergeStrategy" NOT NULL DEFAULT 'manual',
    "conflictsJson" JSONB,
    "resolvedJson" JSONB,
    "sourceVersionId" TEXT,
    "resultVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanvasMerge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderWorkspace" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "status" "BuilderWorkspaceStatus" NOT NULL DEFAULT 'draft',
    "visibility" "BuilderWorkspaceVisibility" NOT NULL DEFAULT 'private',
    "startupName" TEXT,
    "industry" TEXT,
    "stage" TEXT,
    "targetMarket" TEXT,
    "foundingDate" TIMESTAMP(3),
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "BuilderWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "BuilderDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "contentSchema" TEXT,
    "status" "BuilderDocumentStatus" NOT NULL DEFAULT 'draft',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "lastEditedById" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiPromptHash" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "BuilderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderDocumentSection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiSuggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderDocumentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "versionLabel" TEXT,
    "content" JSONB NOT NULL,
    "changesSummary" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderWorkspaceVersion" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "versionLabel" TEXT,
    "description" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderWorkspaceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderCollaborator" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BuilderCollaboratorRole" NOT NULL DEFAULT 'viewer',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedById" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),
    "notifyOnComments" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnChanges" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnReviews" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BuilderCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderComment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sectionKey" TEXT,
    "anchorText" TEXT,
    "anchorStart" INTEGER,
    "anchorEnd" INTEGER,
    "parentId" TEXT,
    "status" "BuilderCommentStatus" NOT NULL DEFAULT 'open',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderSectionComment" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "status" "BuilderCommentStatus" NOT NULL DEFAULT 'open',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderSectionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderReview" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "title" TEXT,
    "instructions" TEXT,
    "status" "BuilderReviewStatus" NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "rating" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BuilderReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderReadinessScore" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "dimension" "ReadinessDimension" NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "criteria" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'needs-work',
    "recommendations" JSONB,
    "blockers" JSONB,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BuilderReadinessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderAIGeneration" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "BuilderDocumentType",
    "sectionKey" TEXT,
    "prompt" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER,
    "response" JSONB,
    "tokensUsed" INTEGER,
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "costCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BuilderAIGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderApplication" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "templateType" "ApplicationTemplateType" NOT NULL,
    "templateName" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submissionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderTemplate" (
    "id" TEXT NOT NULL,
    "type" "BuilderDocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "schema" TEXT,
    "category" TEXT,
    "industry" TEXT,
    "stage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "createdById" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderApplicationTemplate" (
    "id" TEXT NOT NULL,
    "templateType" "ApplicationTemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "deadline" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuilderApplicationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderExport" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "workspaceId" TEXT,
    "userId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSizeBytes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "BuilderExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuilderActivityLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuilderActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleFacet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleType" "UserRoleType" NOT NULL,
    "scope" "RoleFacetScope" NOT NULL DEFAULT 'global',
    "scopeId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoleFacet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdById" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "tagline" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "primaryColor" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "timezone" TEXT,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "message" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'member',
    "title" TEXT,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedBy" TEXT,
    "permissions" JSONB,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMentor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expertiseAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxMentees" INTEGER,
    "currentMentees" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "requestedAt" TIMESTAMP(3),
    "requestNote" TEXT,

    CONSTRAINT "OrganizationMentor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "programType" "ProgramType" NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "applicationDeadline" TIMESTAMP(3),
    "capacity" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "curriculum" JSONB,
    "requirements" JSONB,
    "benefits" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramParticipant" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "role" "ProgramParticipantRole" NOT NULL DEFAULT 'participant',
    "status" "ProgramParticipantStatus" NOT NULL DEFAULT 'applied',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "rank" INTEGER,
    "application" JSONB,
    "appliedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "notes" TEXT,
    "feedback" JSONB,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProgramParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramMilestone" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "requirements" JSONB,
    "deliverables" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "expertiseSummary" TEXT,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startupStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsExperience" INTEGER,
    "mentoringSince" TIMESTAMP(3),
    "totalMentees" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "availabilityStatus" "MentorAvailabilityStatus" NOT NULL DEFAULT 'available',
    "hoursPerWeek" INTEGER,
    "sessionFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionDuration" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "avgRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAcceptingRequests" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investorType" "InvestorType" NOT NULL,
    "firmName" TEXT,
    "firmRole" TEXT,
    "firmWebsite" TEXT,
    "firmLogoUrl" TEXT,
    "checkSizeMin" INTEGER,
    "checkSizeMax" INTEGER,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "geographies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessModels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portfolioCount" INTEGER,
    "exitsCount" INTEGER,
    "investingSince" TIMESTAMP(3),
    "bio" TEXT,
    "investmentThesis" TEXT,
    "isActivelyScouting" BOOLEAN NOT NULL DEFAULT true,
    "acceptsColdOutreach" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceType" "ServiceProviderType" NOT NULL,
    "companyName" TEXT,
    "companyWebsite" TEXT,
    "companyLogoUrl" TEXT,
    "services" JSONB,
    "headline" TEXT,
    "description" TEXT,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startupStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pricingModel" TEXT,
    "startingPrice" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "clientsServed" INTEGER,
    "yearsInBusiness" INTEGER,
    "avgRating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAcceptingClients" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipRelationship" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "programId" TEXT,
    "organizationId" TEXT,
    "status" "MentorshipRelationshipStatus" NOT NULL DEFAULT 'active',
    "goalsJson" JSONB,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" TIMESTAMP(3),
    "mentorNotes" TEXT,
    "menteeNotes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "nextSessionAt" TIMESTAMP(3),

    CONSTRAINT "MentorshipRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipSession" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT,
    "meetingType" TEXT NOT NULL DEFAULT 'video',
    "meetingUrl" TEXT,
    "meetingLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "agenda" TEXT,
    "mentorNotes" TEXT,
    "menteeNotes" TEXT,
    "actionItems" JSONB,
    "mentorRating" INTEGER,
    "menteeRating" INTEGER,
    "mentorFeedback" TEXT,
    "menteeFeedback" TEXT,
    "recordingUrl" TEXT,
    "transcriptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MentorshipSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "programId" TEXT,
    "message" TEXT NOT NULL,
    "goals" TEXT,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredFormat" TEXT,
    "preferredTimes" JSONB,
    "status" "MentorRequestStatus" NOT NULL DEFAULT 'pending',
    "responseMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MentorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startupStageInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roleInterest" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commitmentLevel" TEXT,
    "remotePreference" TEXT,
    "geographyPreference" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timezonePreference" TEXT,
    "industryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workStyle" JSONB,
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "riskTolerance" TEXT,
    "equityExpectation" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "matchNotifications" BOOLEAN NOT NULL DEFAULT true,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "showInMatching" BOOLEAN NOT NULL DEFAULT true,
    "showInSearch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lookingForRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lookingForSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lookingForIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "offeredRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "offeredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "offeredExperience" TEXT,
    "hasStartup" BOOLEAN NOT NULL DEFAULT false,
    "startupStage" TEXT,
    "startupIndustry" TEXT,
    "isActivelyLooking" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "excludedConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibilityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSuggestion" (
    "id" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "skillScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "industryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "locationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stageScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "valuesScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sharedStrengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frictionPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyThisMatch" TEXT,
    "status" "MatchSuggestionStatus" NOT NULL DEFAULT 'pending',
    "viewedAt" TIMESTAMP(3),
    "savedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dismissReason" TEXT,
    "algorithmVersion" TEXT DEFAULT 'v1',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MatchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "FeatureFlagScope" NOT NULL DEFAULT 'global',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPct" INTEGER,
    "targetRole" TEXT,
    "planKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabledFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFeatureFlag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "featureFlagId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL,
    "overriddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantFeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanTier" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingInterval" "PlanBillingInterval" NOT NULL DEFAULT 'monthly',
    "stripePriceId" TEXT,
    "stripeProductId" TEXT,
    "maxWorkspaces" INTEGER,
    "maxTeamMembers" INTEGER,
    "maxStorageMb" INTEGER,
    "maxAiGenerations" INTEGER,
    "maxMentorSessions" INTEGER,
    "features" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "WebhookStatus" NOT NULL DEFAULT 'active',
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "iconUrl" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "condition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3),
    "contextType" TEXT,
    "contextId" TEXT,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'all',
    "targetRole" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isDismissable" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementDismissal" (
    "userId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementDismissal_pkey" PRIMARY KEY ("userId","announcementId")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "skillsAdded" BOOLEAN NOT NULL DEFAULT false,
    "photoUploaded" BOOLEAN NOT NULL DEFAULT false,
    "preferencesSet" BOOLEAN NOT NULL DEFAULT false,
    "firstConnection" BOOLEAN NOT NULL DEFAULT false,
    "firstMessage" BOOLEAN NOT NULL DEFAULT false,
    "workspaceCreated" BOOLEAN NOT NULL DEFAULT false,
    "firstMilestone" BOOLEAN NOT NULL DEFAULT false,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastStepAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundraisingRound" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roundType" "FundraisingRoundType" NOT NULL DEFAULT 'seed',
    "status" "FundraisingRoundStatus" NOT NULL DEFAULT 'planning',
    "targetAmount" DECIMAL(18,2),
    "raisedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "preMoneyValuation" DECIMAL(18,2),
    "equityOffered" DECIMAL(5,4),
    "leadInvestorName" TEXT,
    "leadInvestorId" TEXT,
    "closingDate" TIMESTAMP(3),
    "announcedAt" TIMESTAMP(3),
    "description" TEXT,
    "terms" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundraisingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorPipelineLead" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "investorName" TEXT NOT NULL,
    "investorFirm" TEXT,
    "investorEmail" TEXT,
    "investorLinkedIn" TEXT,
    "investorType" TEXT,
    "isVerifiedOnPlatform" BOOLEAN NOT NULL DEFAULT false,
    "platformUserId" TEXT,
    "status" "InvestorLeadStatus" NOT NULL DEFAULT 'prospect',
    "checkSizeMin" DECIMAL(18,2),
    "checkSizeMax" DECIMAL(18,2),
    "committedAmount" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "meetingScheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "introducedVia" TEXT,
    "warmth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorPipelineLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomDocument" (
    "id" TEXT NOT NULL,
    "roundId" TEXT,
    "workspaceId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "DataRoomDocCategory" NOT NULL DEFAULT 'other',
    "status" "DataRoomDocStatus" NOT NULL DEFAULT 'draft',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWithLeads" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRoomDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingSession" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "programId" TEXT,
    "sessionType" "CoachingSessionType" NOT NULL DEFAULT 'accountability',
    "title" TEXT,
    "agenda" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "timezone" TEXT,
    "meetingUrl" TEXT,
    "meetingLocation" TEXT,
    "status" "CoachingSessionStatus" NOT NULL DEFAULT 'scheduled',
    "coachNotes" TEXT,
    "clientNotes" TEXT,
    "actionItems" JSONB,
    "keyInsights" TEXT,
    "coachRating" INTEGER,
    "clientRating" INTEGER,
    "coachFeedback" TEXT,
    "clientFeedback" TEXT,
    "nextSessionAt" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CoachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertReview" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "reviewType" "ExpertReviewType" NOT NULL DEFAULT 'general',
    "status" "ExpertReviewStatus" NOT NULL DEFAULT 'requested',
    "requestMessage" TEXT,
    "documentsJson" JSONB,
    "summaryFeedback" TEXT,
    "strengthsJson" JSONB,
    "improvementsJson" JSONB,
    "scoreOverall" INTEGER,
    "scoresByArea" JSONB,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "agreedFee" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "ratingComment" TEXT,

    CONSTRAINT "ExpertReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOffer" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortTagline" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pricingModel" "ServicePricingModel" NOT NULL DEFAULT 'contact_for_pricing',
    "priceFrom" DECIMAL(10,2),
    "priceTo" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricingNotes" TEXT,
    "deliverables" JSONB,
    "deliveryDays" INTEGER,
    "revisionsIncluded" INTEGER,
    "targetStartupStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portfolioUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testimonialsJson" JSONB,
    "completedProjects" INTEGER NOT NULL DEFAULT 0,
    "status" "ServiceOfferStatus" NOT NULL DEFAULT 'draft',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceInquiry" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "status" "ServiceInquiryStatus" NOT NULL DEFAULT 'open',
    "message" TEXT NOT NULL,
    "budgetEstimate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timelineExpected" TEXT,
    "responseMessage" TEXT,
    "agreedScope" TEXT,
    "agreedPrice" DECIMAL(10,2),
    "progress" INTEGER,
    "dueDate" DATE,
    "rating" INTEGER,
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupSnapshot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startupName" TEXT,
    "tagline" TEXT,
    "industry" TEXT,
    "stage" TEXT,
    "businessModel" TEXT,
    "location" TEXT,
    "monthlyRevenue" DECIMAL(18,2),
    "mrr" DECIMAL(18,2),
    "userCount" INTEGER,
    "growthRateMonthly" DECIMAL(5,4),
    "revenueModel" TEXT,
    "teamSize" INTEGER,
    "founderCount" INTEGER,
    "technicalCofounder" BOOLEAN NOT NULL DEFAULT false,
    "hasAdvisors" BOOLEAN NOT NULL DEFAULT false,
    "isRaisingNow" BOOLEAN NOT NULL DEFAULT false,
    "currentRoundType" TEXT,
    "targetAmount" DECIMAL(18,2),
    "raisedSoFar" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "readinessScore" INTEGER,
    "deckReady" BOOLEAN NOT NULL DEFAULT false,
    "isPublicToInvestors" BOOLEAN NOT NULL DEFAULT false,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StartupSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechArchitecture" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "frontendStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "backendStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "databaseStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "infrastructureStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiMlStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thirdPartyServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "architectureType" TEXT,
    "deploymentModel" TEXT,
    "architectureDiagramUrl" TEXT,
    "systemDesignNotes" TEXT,
    "scalingStrategy" TEXT,
    "securityNotes" TEXT,
    "technicalDebt" TEXT,
    "openTechnicalRisks" TEXT,
    "aiGeneratedDraft" BOOLEAN NOT NULL DEFAULT false,
    "aiPromptUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechArchitecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRequirementDoc" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "problemStatement" TEXT,
    "targetUsers" TEXT,
    "goals" JSONB,
    "nonGoals" TEXT,
    "assumptions" TEXT,
    "featuresJson" JSONB,
    "userStoriesJson" JSONB,
    "mvpScope" JSONB,
    "wireframesUrl" TEXT,
    "designSystemNotes" TEXT,
    "kpis" JSONB,
    "aiGeneratedDraft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRequirementDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenturePortfolio" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "startupName" TEXT NOT NULL,
    "description" TEXT,
    "status" "VentureStatus" NOT NULL DEFAULT 'ideation',
    "industry" TEXT,
    "stage" TEXT,
    "totalInvested" DECIMAL(18,2),
    "currentValuation" DECIMAL(18,2),
    "equityHeld" DECIMAL(5,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "investedAt" TIMESTAMP(3),
    "exitedAt" TIMESTAMP(3),
    "exitType" TEXT,
    "notes" TEXT,
    "keyMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenturePortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "programId" TEXT,
    "tenantId" TEXT,
    "externalUrl" TEXT,
    "programName" TEXT,
    "organizationName" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'draft',
    "coverLetter" TEXT,
    "answersJson" JSONB,
    "attachmentsJson" JSONB,
    "reviewScore" INTEGER,
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceComment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "sectionType" TEXT,
    "sectionKey" TEXT,
    "anchorText" TEXT,
    "commentType" "WorkspaceCommentType" NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "userId" TEXT,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(10,6),
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentType" "PaymentType" NOT NULL DEFAULT 'subscription_charge',
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "stripeChargeId" TEXT,
    "invoiceNumber" TEXT,
    "invoiceUrl" TEXT,
    "receiptUrl" TEXT,
    "description" TEXT,
    "refundedAmount" DECIMAL(10,2),
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "disputeId" TEXT,
    "disputeStatus" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "metric" "UsageMetric" NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'count',
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "maxPerUser" INTEGER NOT NULL DEFAULT 1,
    "applicablePlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minimumAmountUsd" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "stripeCouponId" TEXT,
    "stripePromoCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEndorsement" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "rewardType" TEXT,
    "rewardValue" DECIMAL(10,2),
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "rewardedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePortfolioItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PortfolioItemType" NOT NULL DEFAULT 'project',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAssistantSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" "AIAssistantContext" NOT NULL DEFAULT 'general',
    "entityType" TEXT,
    "entityId" TEXT,
    "title" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAssistantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAssistantMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "actionType" TEXT,
    "actionMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReputationScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "networkActivity" INTEGER NOT NULL DEFAULT 0,
    "communityContrib" INTEGER NOT NULL DEFAULT 0,
    "mentorActivity" INTEGER NOT NULL DEFAULT 0,
    "workspaceActivity" INTEGER NOT NULL DEFAULT 0,
    "endorsementsScore" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "trustTier" INTEGER NOT NULL DEFAULT 1,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "globalRank" INTEGER,
    "weeklyDelta" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReputationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupReadinessReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "teamScore" INTEGER NOT NULL DEFAULT 0,
    "marketScore" INTEGER NOT NULL DEFAULT 0,
    "productScore" INTEGER NOT NULL DEFAULT 0,
    "businessScore" INTEGER NOT NULL DEFAULT 0,
    "fundingScore" INTEGER NOT NULL DEFAULT 0,
    "executionScore" INTEGER NOT NULL DEFAULT 0,
    "assessmentType" TEXT NOT NULL DEFAULT 'auto',
    "notes" TEXT,
    "industryBenchmark" INTEGER,
    "stagePercentile" INTEGER,
    "triggeredBy" TEXT,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StartupReadinessReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRoomAccessLog" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accessorId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "durationSecs" INTEGER,
    "roundId" TEXT,
    "source" TEXT,
    "ndaAccepted" BOOLEAN NOT NULL DEFAULT false,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRoomAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipGoal" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "MentorshipGoalStatus" NOT NULL DEFAULT 'active',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "successCriteria" TEXT,
    "keyResults" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastDiscussedAt" TIMESTAMP(3),
    "checkInNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "meetingUrl" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "workspaceId" TEXT,
    "milestoneId" TEXT,
    "programId" TEXT,
    "tenantId" TEXT,
    "recurrence" TEXT,
    "recurrenceEnd" TIMESTAMP(3),
    "participantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminderMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "showSkills" BOOLEAN NOT NULL DEFAULT true,
    "showBio" BOOLEAN NOT NULL DEFAULT true,
    "showPortfolio" BOOLEAN NOT NULL DEFAULT true,
    "showStats" BOOLEAN NOT NULL DEFAULT false,
    "customHeadline" TEXT,
    "customBio" TEXT,
    "socialLinks" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postType" "FeedPostType" NOT NULL DEFAULT 'text',
    "visibility" "FeedPostVisibility" NOT NULL DEFAULT 'public',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "richContent" JSONB,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkPreview" JSONB,
    "communityId" TEXT,
    "workspaceId" TEXT,
    "milestoneId" TEXT,
    "tenantId" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPreference" (
    "userId" TEXT NOT NULL,
    "prefs" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FeedHiddenPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedHiddenPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicPitch" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowContact" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "contactRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PitchContactRequest" (
    "id" TEXT NOT NULL,
    "pitchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PitchContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "detail" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkEmailChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkEmailChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileImportDraft" (
    "userId" TEXT NOT NULL,
    "records" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileImportDraft_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FounderUpdate" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "asks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" "FounderUpdateVisibility" NOT NULL DEFAULT 'followers',
    "publicToken" TEXT,
    "milestoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedBookmark" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'medium',
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "assignedToId" TEXT,
    "tenantId" TEXT,
    "workspaceId" TEXT,
    "linkedEntityType" TEXT,
    "linkedEntityId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "searchType" "SavedSearchType" NOT NULL,
    "query" TEXT,
    "filters" JSONB NOT NULL,
    "sortBy" TEXT,
    "sortOrder" TEXT DEFAULT 'desc',
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "alertFrequency" TEXT DEFAULT 'daily',
    "lastAlertAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "lastResultCount" INTEGER,
    "seenResultIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pendingNewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAnnouncement" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "announcementType" "AnnouncementType" NOT NULL DEFAULT 'info',
    "target" "AnnouncementTarget" NOT NULL DEFAULT 'all',
    "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetTenantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "showBanner" BOOLEAN NOT NULL DEFAULT false,
    "bannerColor" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAnnouncementDismissal" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAnnouncementDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorReview" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "rating" INTEGER NOT NULL,
    "communicationRating" INTEGER,
    "expertiseRating" INTEGER,
    "engagementRating" INTEGER,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "mentorResponse" TEXT,
    "mentorRespondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorWatchlistItem" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "workspaceId" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" TEXT,
    "status" "WatchlistItemStatus" NOT NULL DEFAULT 'watching',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorWatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" "AIAgentType" NOT NULL DEFAULT 'general',
    "title" VARCHAR(255),
    "summary" TEXT,
    "contextType" TEXT,
    "contextId" TEXT,
    "contextData" JSONB,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AIMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "model" VARCHAR(100),
    "provider" VARCHAR(50),
    "responseTimeMs" INTEGER,
    "isStreamed" BOOLEAN NOT NULL DEFAULT false,
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" VARCHAR(50),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredModel" VARCHAR(100),
    "preferredProvider" VARCHAR(50),
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER DEFAULT 2048,
    "responseStyle" VARCHAR(50),
    "responseLanguage" VARCHAR(10) DEFAULT 'en',
    "useEmoji" BOOLEAN NOT NULL DEFAULT false,
    "enableStreaming" BOOLEAN NOT NULL DEFAULT true,
    "enableSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "enableContextMemory" BOOLEAN NOT NULL DEFAULT true,
    "enableAutoSave" BOOLEAN NOT NULL DEFAULT true,
    "saveConversations" BOOLEAN NOT NULL DEFAULT true,
    "shareForTraining" BOOLEAN NOT NULL DEFAULT false,
    "anonymizeData" BOOLEAN NOT NULL DEFAULT true,
    "defaultAgent" "AIAgentType" NOT NULL DEFAULT 'general',
    "matchingAgent" "AIAgentType" NOT NULL DEFAULT 'matching',
    "pitchAgent" "AIAgentType" NOT NULL DEFAULT 'pitch_coach',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIUserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPromptTemplate" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT,
    "tenantId" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "agentType" "AIAgentType" NOT NULL DEFAULT 'general',
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT,
    "variables" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "agentType" "AIAgentType" NOT NULL,
    "endpoint" VARCHAR(100) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "model" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "isStreamed" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL,
    "errorCode" VARCHAR(50),
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "contextType" VARCHAR(50),
    "featureUsed" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactBranch" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "baseVersionId" TEXT NOT NULL,
    "baseVersionNum" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "status" "ArtifactBranchStatus" NOT NULL DEFAULT 'open',
    "mergedAt" TIMESTAMP(3),
    "mergedById" TEXT,
    "mergeVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtifactBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeProposal" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "status" "ChangeProposalStatus" NOT NULL DEFAULT 'open',
    "diffSummary" JSONB,
    "changedSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mergedAt" TIMESTAMP(3),

    CONSTRAINT "ChangeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactShareLink" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "workspaceId" TEXT,
    "versionId" TEXT,
    "token" TEXT NOT NULL,
    "permissions" "ShareLinkPermission" NOT NULL DEFAULT 'view',
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "maxViews" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "recipientEmail" TEXT,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "ArtifactShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRDTSyncState" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sectionKey" TEXT,
    "yjsState" BYTEA NOT NULL,
    "yjsUpdate" BYTEA,
    "lastClientId" TEXT,
    "operationCount" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotContent" JSONB,
    "snapshotAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRDTSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "eventType" "XPEventType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "xpAmount" INTEGER NOT NULL,
    "baseXp" INTEGER NOT NULL,
    "weightMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "cooldownKey" TEXT,
    "isDiminished" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationBadge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "GamificationBadgeCategory" NOT NULL,
    "rarity" "GamificationBadgeRarity" NOT NULL DEFAULT 'common',
    "criteria" JSONB NOT NULL,
    "iconName" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamificationBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGamificationBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "UserGamificationBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streakType" "StreakType" NOT NULL DEFAULT 'meaningful_daily',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "graceUsedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "breakdown" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMomentumScore" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "velocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentActivityScore" INTEGER NOT NULL DEFAULT 0,
    "collaborationDensity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakdown" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMomentumScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorFeedbackMetric" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "feedbackCount" INTEGER NOT NULL DEFAULT 0,
    "appliedFeedbackCount" INTEGER NOT NULL DEFAULT 0,
    "appliedFeedbackRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseTimeHrs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "improvementScore" INTEGER NOT NULL DEFAULT 0,
    "lastFeedbackAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorFeedbackMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationReadinessScore" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "problemClarity" INTEGER NOT NULL DEFAULT 0,
    "solutionClarity" INTEGER NOT NULL DEFAULT 0,
    "marketUnderstanding" INTEGER NOT NULL DEFAULT 0,
    "productDefinition" INTEGER NOT NULL DEFAULT 0,
    "teamCompleteness" INTEGER NOT NULL DEFAULT 0,
    "executionReadiness" INTEGER NOT NULL DEFAULT 0,
    "validationScore" INTEGER NOT NULL DEFAULT 0,
    "artifactCompleteness" INTEGER NOT NULL DEFAULT 0,
    "dimensionBreakdown" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationReadinessScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbuseFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AbuseFlagType" NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "status" "AbuseFlagStatus" NOT NULL DEFAULT 'pending',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbuseFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "key" TEXT NOT NULL,
    "variantA" JSONB NOT NULL,
    "variantB" JSONB NOT NULL,
    "splitRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehavioralState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "previousState" TEXT,
    "stateChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signals" JSONB NOT NULL DEFAULT '{}',
    "nudgesSentToday" INTEGER NOT NULL DEFAULT 0,
    "nudgesSentTotal" INTEGER NOT NULL DEFAULT 0,
    "lastNudgeAt" TIMESTAMP(3),
    "fatigueSince" TIMESTAMP(3),
    "nextActionKey" TEXT,
    "nextActionScore" DOUBLE PRECISION,
    "nextActionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBehavioralState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NudgeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stateId" TEXT,
    "nudgeKey" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'control',
    "shown" BOOLEAN NOT NULL DEFAULT true,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "policyVersion" TEXT,
    "contextJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NudgeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorPolicy" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "experimentKey" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehaviorPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenToSignal" (
    "userId" TEXT NOT NULL,
    "kinds" TEXT[],
    "visibility" "OpenToVisibility" NOT NULL DEFAULT 'nobody',
    "note" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenToSignal_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "IntroRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "intermediaryId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "forwardNote" TEXT,
    "status" "IntroStatus" NOT NULL DEFAULT 'pending',
    "toRequester" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toTarget" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "threadId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntroRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoutBrief" (
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "skills" TEXT[],
    "place" TEXT,
    "remoteOk" BOOLEAN NOT NULL DEFAULT true,
    "commitment" TEXT,
    "stage" TEXT,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutBrief_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ScoutProposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "draftNote" TEXT NOT NULL,
    "draftNoteEl" TEXT,
    "status" "ScoutProposalStatus" NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perk" (
    "id" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEl" TEXT,
    "summary" TEXT NOT NULL,
    "summaryEl" TEXT,
    "value" TEXT NOT NULL,
    "valueEl" TEXT,
    "category" TEXT NOT NULL,
    "stages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "howToRedeem" TEXT NOT NULL,
    "howToRedeemEl" TEXT,
    "terms" TEXT,
    "termsEl" TEXT,
    "code" TEXT,
    "redeemUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerkClaim" (
    "id" TEXT NOT NULL,
    "perkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerkClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileViewerSetting" (
    "userId" TEXT NOT NULL,
    "shareName" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileViewerSetting_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationValidation_conversationId_key" ON "ConversationValidation"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationValidation_conversationId_idx" ON "ConversationValidation"("conversationId");

-- CreateIndex
CREATE INDEX "TransparencyEvent_kind_createdAt_idx" ON "TransparencyEvent"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommitmentCard_shareToken_key" ON "CommitmentCard"("shareToken");

-- CreateIndex
CREATE INDEX "CommitmentCard_ownerId_idx" ON "CommitmentCard"("ownerId");

-- CreateIndex
CREATE INDEX "CommitmentCard_status_kind_idx" ON "CommitmentCard"("status", "kind");

-- CreateIndex
CREATE INDEX "CommitmentCard_projectRef_idx" ON "CommitmentCard"("projectRef");

-- CreateIndex
CREATE INDEX "CommitmentCard_category_idx" ON "CommitmentCard"("category");

-- CreateIndex
CREATE INDEX "CommitmentCard_stage_idx" ON "CommitmentCard"("stage");

-- CreateIndex
CREATE INDEX "CommitmentThread_candidateId_idx" ON "CommitmentThread"("candidateId");

-- CreateIndex
CREATE INDEX "CommitmentThread_step_idx" ON "CommitmentThread"("step");

-- CreateIndex
CREATE UNIQUE INDEX "CommitmentThread_cardId_candidateId_key" ON "CommitmentThread"("cardId", "candidateId");

-- CreateIndex
CREATE INDEX "CommitmentMessage_threadId_createdAt_idx" ON "CommitmentMessage"("threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommitmentTerms_threadId_version_key" ON "CommitmentTerms"("threadId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BillingContact_subscriptionId_key" ON "BillingContact"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingContact_subscriptionId_idx" ON "BillingContact"("subscriptionId");

-- CreateIndex
CREATE INDEX "Milestone_ownerId_idx" ON "Milestone"("ownerId");

-- CreateIndex
CREATE INDEX "Milestone_collaboratorId_idx" ON "Milestone"("collaboratorId");

-- CreateIndex
CREATE INDEX "Milestone_status_idx" ON "Milestone"("status");

-- CreateIndex
CREATE INDEX "Milestone_dueDate_idx" ON "Milestone"("dueDate");

-- CreateIndex
CREATE INDEX "Milestone_createdAt_idx" ON "Milestone"("createdAt");

-- CreateIndex
CREATE INDEX "SavedProfile_savedById_idx" ON "SavedProfile"("savedById");

-- CreateIndex
CREATE INDEX "SavedProfile_userId_idx" ON "SavedProfile"("userId");

-- CreateIndex
CREATE INDEX "SavedProfile_createdAt_idx" ON "SavedProfile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProfile_savedById_userId_key" ON "SavedProfile"("savedById", "userId");

-- CreateIndex
CREATE INDEX "InvestorDeal_investorId_pipelineStage_idx" ON "InvestorDeal"("investorId", "pipelineStage");

-- CreateIndex
CREATE INDEX "InvestorDeal_investorId_starred_idx" ON "InvestorDeal"("investorId", "starred");

-- CreateIndex
CREATE INDEX "InvestorDeal_founderId_idx" ON "InvestorDeal"("founderId");

-- CreateIndex
CREATE INDEX "InvestorDeal_lastActivityAt_idx" ON "InvestorDeal"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorDeal_investorId_name_key" ON "InvestorDeal"("investorId", "name");

-- CreateIndex
CREATE INDEX "InvestorDealEvent_dealId_createdAt_idx" ON "InvestorDealEvent"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX "Endorsement_toUserId_isApproved_isPublic_idx" ON "Endorsement"("toUserId", "isApproved", "isPublic");

-- CreateIndex
CREATE INDEX "Endorsement_fromUserId_idx" ON "Endorsement"("fromUserId");

-- CreateIndex
CREATE INDEX "Endorsement_createdAt_idx" ON "Endorsement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Endorsement_fromUserId_toUserId_key" ON "Endorsement"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "ResearchBoard_ownerId_idx" ON "ResearchBoard"("ownerId");

-- CreateIndex
CREATE INDEX "ResearchBoard_orgId_idx" ON "ResearchBoard"("orgId");

-- CreateIndex
CREATE INDEX "ResearchBoard_visibility_idx" ON "ResearchBoard"("visibility");

-- CreateIndex
CREATE INDEX "ResearchBoard_createdAt_idx" ON "ResearchBoard"("createdAt");

-- CreateIndex
CREATE INDEX "ResearchNode_boardId_idx" ON "ResearchNode"("boardId");

-- CreateIndex
CREATE INDEX "ResearchNode_type_idx" ON "ResearchNode"("type");

-- CreateIndex
CREATE INDEX "ResearchNode_uploadId_idx" ON "ResearchNode"("uploadId");

-- CreateIndex
CREATE INDEX "ResearchNode_builderDocumentId_idx" ON "ResearchNode"("builderDocumentId");

-- CreateIndex
CREATE INDEX "ResearchConnector_boardId_idx" ON "ResearchConnector"("boardId");

-- CreateIndex
CREATE INDEX "ResearchConnector_fromNodeId_idx" ON "ResearchConnector"("fromNodeId");

-- CreateIndex
CREATE INDEX "ResearchConnector_toNodeId_idx" ON "ResearchConnector"("toNodeId");

-- CreateIndex
CREATE INDEX "ResearchBoardCollaborator_userId_idx" ON "ResearchBoardCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchBoardCollaborator_boardId_userId_key" ON "ResearchBoardCollaborator"("boardId", "userId");

-- CreateIndex
CREATE INDEX "ResearchComment_nodeId_idx" ON "ResearchComment"("nodeId");

-- CreateIndex
CREATE INDEX "ResearchComment_authorId_idx" ON "ResearchComment"("authorId");

-- CreateIndex
CREATE INDEX "ResearchComment_parentId_idx" ON "ResearchComment"("parentId");

-- CreateIndex
CREATE INDEX "ResearchBoardSnapshot_boardId_idx" ON "ResearchBoardSnapshot"("boardId");

-- CreateIndex
CREATE INDEX "ResearchBoardSnapshot_createdById_idx" ON "ResearchBoardSnapshot"("createdById");

-- CreateIndex
CREATE INDEX "ResearchBoardSnapshot_createdAt_idx" ON "ResearchBoardSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "CanvasVersion_boardId_idx" ON "CanvasVersion"("boardId");

-- CreateIndex
CREATE INDEX "CanvasVersion_branchId_idx" ON "CanvasVersion"("branchId");

-- CreateIndex
CREATE INDEX "CanvasVersion_parentVersionId_idx" ON "CanvasVersion"("parentVersionId");

-- CreateIndex
CREATE INDEX "CanvasVersion_createdById_idx" ON "CanvasVersion"("createdById");

-- CreateIndex
CREATE INDEX "CanvasVersion_createdAt_idx" ON "CanvasVersion"("createdAt");

-- CreateIndex
CREATE INDEX "CanvasBranch_boardId_idx" ON "CanvasBranch"("boardId");

-- CreateIndex
CREATE INDEX "CanvasBranch_createdById_idx" ON "CanvasBranch"("createdById");

-- CreateIndex
CREATE INDEX "CanvasBranch_status_idx" ON "CanvasBranch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CanvasBranch_boardId_name_key" ON "CanvasBranch"("boardId", "name");

-- CreateIndex
CREATE INDEX "CanvasMerge_boardId_idx" ON "CanvasMerge"("boardId");

-- CreateIndex
CREATE INDEX "CanvasMerge_sourceBranchId_idx" ON "CanvasMerge"("sourceBranchId");

-- CreateIndex
CREATE INDEX "CanvasMerge_targetBranchId_idx" ON "CanvasMerge"("targetBranchId");

-- CreateIndex
CREATE INDEX "CanvasMerge_mergedById_idx" ON "CanvasMerge"("mergedById");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderWorkspace_slug_key" ON "BuilderWorkspace"("slug");

-- CreateIndex
CREATE INDEX "BuilderWorkspace_ownerId_idx" ON "BuilderWorkspace"("ownerId");

-- CreateIndex
CREATE INDEX "BuilderWorkspace_tenantId_idx" ON "BuilderWorkspace"("tenantId");

-- CreateIndex
CREATE INDEX "BuilderWorkspace_status_idx" ON "BuilderWorkspace"("status");

-- CreateIndex
CREATE INDEX "BuilderWorkspace_visibility_idx" ON "BuilderWorkspace"("visibility");

-- CreateIndex
CREATE INDEX "BuilderWorkspace_slug_idx" ON "BuilderWorkspace"("slug");

-- CreateIndex
CREATE INDEX "BuilderWorkspace_createdAt_idx" ON "BuilderWorkspace"("createdAt");

-- CreateIndex
CREATE INDEX "BuilderDocument_workspaceId_idx" ON "BuilderDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderDocument_type_idx" ON "BuilderDocument"("type");

-- CreateIndex
CREATE INDEX "BuilderDocument_status_idx" ON "BuilderDocument"("status");

-- CreateIndex
CREATE INDEX "BuilderDocument_isLatest_idx" ON "BuilderDocument"("isLatest");

-- CreateIndex
CREATE INDEX "BuilderDocument_createdAt_idx" ON "BuilderDocument"("createdAt");

-- CreateIndex
CREATE INDEX "BuilderDocumentSection_documentId_idx" ON "BuilderDocumentSection"("documentId");

-- CreateIndex
CREATE INDEX "BuilderDocumentSection_sectionKey_idx" ON "BuilderDocumentSection"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderDocumentSection_documentId_sectionKey_key" ON "BuilderDocumentSection"("documentId", "sectionKey");

-- CreateIndex
CREATE INDEX "BuilderDocumentVersion_documentId_idx" ON "BuilderDocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "BuilderDocumentVersion_createdAt_idx" ON "BuilderDocumentVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderDocumentVersion_documentId_version_key" ON "BuilderDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "BuilderWorkspaceVersion_workspaceId_idx" ON "BuilderWorkspaceVersion"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderWorkspaceVersion_createdAt_idx" ON "BuilderWorkspaceVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderWorkspaceVersion_workspaceId_version_key" ON "BuilderWorkspaceVersion"("workspaceId", "version");

-- CreateIndex
CREATE INDEX "BuilderCollaborator_workspaceId_idx" ON "BuilderCollaborator"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderCollaborator_userId_idx" ON "BuilderCollaborator"("userId");

-- CreateIndex
CREATE INDEX "BuilderCollaborator_role_idx" ON "BuilderCollaborator"("role");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderCollaborator_workspaceId_userId_key" ON "BuilderCollaborator"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "BuilderComment_documentId_idx" ON "BuilderComment"("documentId");

-- CreateIndex
CREATE INDEX "BuilderComment_authorId_idx" ON "BuilderComment"("authorId");

-- CreateIndex
CREATE INDEX "BuilderComment_parentId_idx" ON "BuilderComment"("parentId");

-- CreateIndex
CREATE INDEX "BuilderComment_status_idx" ON "BuilderComment"("status");

-- CreateIndex
CREATE INDEX "BuilderComment_createdAt_idx" ON "BuilderComment"("createdAt");

-- CreateIndex
CREATE INDEX "BuilderSectionComment_sectionId_idx" ON "BuilderSectionComment"("sectionId");

-- CreateIndex
CREATE INDEX "BuilderSectionComment_authorId_idx" ON "BuilderSectionComment"("authorId");

-- CreateIndex
CREATE INDEX "BuilderSectionComment_parentId_idx" ON "BuilderSectionComment"("parentId");

-- CreateIndex
CREATE INDEX "BuilderSectionComment_status_idx" ON "BuilderSectionComment"("status");

-- CreateIndex
CREATE INDEX "BuilderReview_documentId_idx" ON "BuilderReview"("documentId");

-- CreateIndex
CREATE INDEX "BuilderReview_requestedById_idx" ON "BuilderReview"("requestedById");

-- CreateIndex
CREATE INDEX "BuilderReview_reviewerId_idx" ON "BuilderReview"("reviewerId");

-- CreateIndex
CREATE INDEX "BuilderReview_status_idx" ON "BuilderReview"("status");

-- CreateIndex
CREATE INDEX "BuilderReadinessScore_workspaceId_idx" ON "BuilderReadinessScore"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderReadinessScore_dimension_idx" ON "BuilderReadinessScore"("dimension");

-- CreateIndex
CREATE INDEX "BuilderReadinessScore_assessedAt_idx" ON "BuilderReadinessScore"("assessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuilderReadinessScore_workspaceId_dimension_version_key" ON "BuilderReadinessScore"("workspaceId", "dimension", "version");

-- CreateIndex
CREATE INDEX "BuilderAIGeneration_workspaceId_idx" ON "BuilderAIGeneration"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderAIGeneration_userId_idx" ON "BuilderAIGeneration"("userId");

-- CreateIndex
CREATE INDEX "BuilderAIGeneration_documentType_idx" ON "BuilderAIGeneration"("documentType");

-- CreateIndex
CREATE INDEX "BuilderAIGeneration_promptHash_idx" ON "BuilderAIGeneration"("promptHash");

-- CreateIndex
CREATE INDEX "BuilderAIGeneration_status_idx" ON "BuilderAIGeneration"("status");

-- CreateIndex
CREATE INDEX "BuilderAIGeneration_createdAt_idx" ON "BuilderAIGeneration"("createdAt");

-- CreateIndex
CREATE INDEX "BuilderApplication_workspaceId_idx" ON "BuilderApplication"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderApplication_templateType_idx" ON "BuilderApplication"("templateType");

-- CreateIndex
CREATE INDEX "BuilderApplication_status_idx" ON "BuilderApplication"("status");

-- CreateIndex
CREATE INDEX "BuilderApplication_deadline_idx" ON "BuilderApplication"("deadline");

-- CreateIndex
CREATE INDEX "BuilderTemplate_type_idx" ON "BuilderTemplate"("type");

-- CreateIndex
CREATE INDEX "BuilderTemplate_isPublic_idx" ON "BuilderTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "BuilderTemplate_isOfficial_idx" ON "BuilderTemplate"("isOfficial");

-- CreateIndex
CREATE INDEX "BuilderTemplate_tenantId_idx" ON "BuilderTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "BuilderTemplate_category_idx" ON "BuilderTemplate"("category");

-- CreateIndex
CREATE INDEX "BuilderApplicationTemplate_templateType_idx" ON "BuilderApplicationTemplate"("templateType");

-- CreateIndex
CREATE INDEX "BuilderApplicationTemplate_isActive_idx" ON "BuilderApplicationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "BuilderExport_userId_idx" ON "BuilderExport"("userId");

-- CreateIndex
CREATE INDEX "BuilderExport_documentId_idx" ON "BuilderExport"("documentId");

-- CreateIndex
CREATE INDEX "BuilderExport_workspaceId_idx" ON "BuilderExport"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderExport_status_idx" ON "BuilderExport"("status");

-- CreateIndex
CREATE INDEX "BuilderExport_createdAt_idx" ON "BuilderExport"("createdAt");

-- CreateIndex
CREATE INDEX "BuilderActivityLog_workspaceId_idx" ON "BuilderActivityLog"("workspaceId");

-- CreateIndex
CREATE INDEX "BuilderActivityLog_userId_idx" ON "BuilderActivityLog"("userId");

-- CreateIndex
CREATE INDEX "BuilderActivityLog_action_idx" ON "BuilderActivityLog"("action");

-- CreateIndex
CREATE INDEX "BuilderActivityLog_entityType_idx" ON "BuilderActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "BuilderActivityLog_createdAt_idx" ON "BuilderActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "UserRoleFacet_userId_idx" ON "UserRoleFacet"("userId");

-- CreateIndex
CREATE INDEX "UserRoleFacet_roleType_idx" ON "UserRoleFacet"("roleType");

-- CreateIndex
CREATE INDEX "UserRoleFacet_scope_idx" ON "UserRoleFacet"("scope");

-- CreateIndex
CREATE INDEX "UserRoleFacet_isActive_idx" ON "UserRoleFacet"("isActive");

-- CreateIndex
CREATE INDEX "UserRoleFacet_isPrimary_idx" ON "UserRoleFacet"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleFacet_userId_roleType_scope_scopeId_key" ON "UserRoleFacet"("userId", "roleType", "scope", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_tenantId_idx" ON "Organization"("tenantId");

-- CreateIndex
CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");

-- CreateIndex
CREATE INDEX "Organization_isFeatured_idx" ON "Organization"("isFeatured");

-- CreateIndex
CREATE INDEX "Organization_createdAt_idx" ON "Organization"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_tokenHash_key" ON "OrganizationInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_status_idx" ON "OrganizationInvitation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_idx" ON "OrganizationMembership"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMembership_role_idx" ON "OrganizationMembership"("role");

-- CreateIndex
CREATE INDEX "OrganizationMembership_isActive_idx" ON "OrganizationMembership"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "OrganizationMentor_organizationId_idx" ON "OrganizationMentor"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMentor_userId_idx" ON "OrganizationMentor"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMentor_isActive_idx" ON "OrganizationMentor"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMentor_organizationId_userId_key" ON "OrganizationMentor"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Program_organizationId_idx" ON "Program"("organizationId");

-- CreateIndex
CREATE INDEX "Program_tenantId_idx" ON "Program"("tenantId");

-- CreateIndex
CREATE INDEX "Program_programType_idx" ON "Program"("programType");

-- CreateIndex
CREATE INDEX "Program_status_idx" ON "Program"("status");

-- CreateIndex
CREATE INDEX "Program_isPublic_idx" ON "Program"("isPublic");

-- CreateIndex
CREATE INDEX "Program_startDate_idx" ON "Program"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Program_organizationId_slug_key" ON "Program"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "ProgramParticipant_programId_idx" ON "ProgramParticipant"("programId");

-- CreateIndex
CREATE INDEX "ProgramParticipant_userId_idx" ON "ProgramParticipant"("userId");

-- CreateIndex
CREATE INDEX "ProgramParticipant_workspaceId_idx" ON "ProgramParticipant"("workspaceId");

-- CreateIndex
CREATE INDEX "ProgramParticipant_role_idx" ON "ProgramParticipant"("role");

-- CreateIndex
CREATE INDEX "ProgramParticipant_status_idx" ON "ProgramParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramParticipant_programId_userId_key" ON "ProgramParticipant"("programId", "userId");

-- CreateIndex
CREATE INDEX "ProgramMilestone_programId_idx" ON "ProgramMilestone"("programId");

-- CreateIndex
CREATE INDEX "ProgramMilestone_dueDate_idx" ON "ProgramMilestone"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- CreateIndex
CREATE INDEX "MentorProfile_userId_idx" ON "MentorProfile"("userId");

-- CreateIndex
CREATE INDEX "MentorProfile_availabilityStatus_idx" ON "MentorProfile"("availabilityStatus");

-- CreateIndex
CREATE INDEX "MentorProfile_isActive_idx" ON "MentorProfile"("isActive");

-- CreateIndex
CREATE INDEX "MentorProfile_isVerified_idx" ON "MentorProfile"("isVerified");

-- CreateIndex
CREATE INDEX "MentorProfile_avgRating_idx" ON "MentorProfile"("avgRating");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorProfile_userId_key" ON "InvestorProfile"("userId");

-- CreateIndex
CREATE INDEX "InvestorProfile_userId_idx" ON "InvestorProfile"("userId");

-- CreateIndex
CREATE INDEX "InvestorProfile_investorType_idx" ON "InvestorProfile"("investorType");

-- CreateIndex
CREATE INDEX "InvestorProfile_isActive_idx" ON "InvestorProfile"("isActive");

-- CreateIndex
CREATE INDEX "InvestorProfile_isVerified_idx" ON "InvestorProfile"("isVerified");

-- CreateIndex
CREATE INDEX "InvestorProfile_isActivelyScouting_idx" ON "InvestorProfile"("isActivelyScouting");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProviderProfile_userId_key" ON "ServiceProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "ServiceProviderProfile_userId_idx" ON "ServiceProviderProfile"("userId");

-- CreateIndex
CREATE INDEX "ServiceProviderProfile_serviceType_idx" ON "ServiceProviderProfile"("serviceType");

-- CreateIndex
CREATE INDEX "ServiceProviderProfile_isActive_idx" ON "ServiceProviderProfile"("isActive");

-- CreateIndex
CREATE INDEX "ServiceProviderProfile_isVerified_idx" ON "ServiceProviderProfile"("isVerified");

-- CreateIndex
CREATE INDEX "MentorshipRelationship_mentorId_idx" ON "MentorshipRelationship"("mentorId");

-- CreateIndex
CREATE INDEX "MentorshipRelationship_menteeId_idx" ON "MentorshipRelationship"("menteeId");

-- CreateIndex
CREATE INDEX "MentorshipRelationship_workspaceId_idx" ON "MentorshipRelationship"("workspaceId");

-- CreateIndex
CREATE INDEX "MentorshipRelationship_programId_idx" ON "MentorshipRelationship"("programId");

-- CreateIndex
CREATE INDEX "MentorshipRelationship_status_idx" ON "MentorshipRelationship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipRelationship_mentorId_menteeId_key" ON "MentorshipRelationship"("mentorId", "menteeId");

-- CreateIndex
CREATE INDEX "MentorshipSession_relationshipId_idx" ON "MentorshipSession"("relationshipId");

-- CreateIndex
CREATE INDEX "MentorshipSession_mentorId_idx" ON "MentorshipSession"("mentorId");

-- CreateIndex
CREATE INDEX "MentorshipSession_menteeId_idx" ON "MentorshipSession"("menteeId");

-- CreateIndex
CREATE INDEX "MentorshipSession_scheduledAt_idx" ON "MentorshipSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "MentorshipSession_status_idx" ON "MentorshipSession"("status");

-- CreateIndex
CREATE INDEX "MentorRequest_requesterId_idx" ON "MentorRequest"("requesterId");

-- CreateIndex
CREATE INDEX "MentorRequest_mentorId_idx" ON "MentorRequest"("mentorId");

-- CreateIndex
CREATE INDEX "MentorRequest_workspaceId_idx" ON "MentorRequest"("workspaceId");

-- CreateIndex
CREATE INDEX "MentorRequest_status_idx" ON "MentorRequest"("status");

-- CreateIndex
CREATE INDEX "MentorRequest_createdAt_idx" ON "MentorRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorRequest_requesterId_mentorId_key" ON "MentorRequest"("requesterId", "mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchProfile_userId_key" ON "MatchProfile"("userId");

-- CreateIndex
CREATE INDEX "MatchProfile_userId_idx" ON "MatchProfile"("userId");

-- CreateIndex
CREATE INDEX "MatchProfile_isActivelyLooking_idx" ON "MatchProfile"("isActivelyLooking");

-- CreateIndex
CREATE INDEX "MatchSuggestion_sourceUserId_status_idx" ON "MatchSuggestion"("sourceUserId", "status");

-- CreateIndex
CREATE INDEX "MatchSuggestion_targetUserId_idx" ON "MatchSuggestion"("targetUserId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_overallScore_idx" ON "MatchSuggestion"("overallScore");

-- CreateIndex
CREATE INDEX "MatchSuggestion_generatedAt_idx" ON "MatchSuggestion"("generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSuggestion_sourceUserId_targetUserId_key" ON "MatchSuggestion"("sourceUserId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_isEnabled_idx" ON "FeatureFlag"("isEnabled");

-- CreateIndex
CREATE INDEX "FeatureFlag_scope_idx" ON "FeatureFlag"("scope");

-- CreateIndex
CREATE INDEX "FeatureFlag_scope_isEnabled_idx" ON "FeatureFlag"("scope", "isEnabled");

-- CreateIndex
CREATE INDEX "TenantFeatureFlag_tenantId_idx" ON "TenantFeatureFlag"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantFeatureFlag_tenantId_featureFlagId_key" ON "TenantFeatureFlag"("tenantId", "featureFlagId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTier_key_key" ON "PlanTier"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PlanTier_stripePriceId_key" ON "PlanTier"("stripePriceId");

-- CreateIndex
CREATE INDEX "PlanTier_isActive_isPublic_idx" ON "PlanTier"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "PlanTier_sortOrder_idx" ON "PlanTier"("sortOrder");

-- CreateIndex
CREATE INDEX "Webhook_tenantId_idx" ON "Webhook"("tenantId");

-- CreateIndex
CREATE INDEX "Webhook_status_idx" ON "Webhook"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_sentAt_idx" ON "WebhookDelivery"("webhookId", "sentAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventType_idx" ON "WebhookDelivery"("eventType");

-- CreateIndex
CREATE INDEX "WebhookDelivery_success_idx" ON "WebhookDelivery"("success");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementDefinition_key_key" ON "AchievementDefinition"("key");

-- CreateIndex
CREATE INDEX "AchievementDefinition_category_idx" ON "AchievementDefinition"("category");

-- CreateIndex
CREATE INDEX "AchievementDefinition_isActive_idx" ON "AchievementDefinition"("isActive");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_unlockedAt_idx" ON "UserAchievement"("userId", "unlockedAt");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "Announcement_tenantId_startsAt_idx" ON "Announcement"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

-- CreateIndex
CREATE INDEX "Announcement_isPinned_idx" ON "Announcement"("isPinned");

-- CreateIndex
CREATE INDEX "AnnouncementDismissal_userId_idx" ON "AnnouncementDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_userId_idx" ON "OnboardingProgress"("userId");

-- CreateIndex
CREATE INDEX "OnboardingProgress_completionPct_idx" ON "OnboardingProgress"("completionPct");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_tenantId_idx" ON "ApiKey"("tenantId");

-- CreateIndex
CREATE INDEX "ApiKey_status_idx" ON "ApiKey"("status");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "FundraisingRound_ownerId_idx" ON "FundraisingRound"("ownerId");

-- CreateIndex
CREATE INDEX "FundraisingRound_workspaceId_idx" ON "FundraisingRound"("workspaceId");

-- CreateIndex
CREATE INDEX "FundraisingRound_status_idx" ON "FundraisingRound"("status");

-- CreateIndex
CREATE INDEX "FundraisingRound_ownerId_status_idx" ON "FundraisingRound"("ownerId", "status");

-- CreateIndex
CREATE INDEX "InvestorPipelineLead_roundId_idx" ON "InvestorPipelineLead"("roundId");

-- CreateIndex
CREATE INDEX "InvestorPipelineLead_addedById_idx" ON "InvestorPipelineLead"("addedById");

-- CreateIndex
CREATE INDEX "InvestorPipelineLead_roundId_status_idx" ON "InvestorPipelineLead"("roundId", "status");

-- CreateIndex
CREATE INDEX "InvestorPipelineLead_status_idx" ON "InvestorPipelineLead"("status");

-- CreateIndex
CREATE INDEX "DataRoomDocument_roundId_idx" ON "DataRoomDocument"("roundId");

-- CreateIndex
CREATE INDEX "DataRoomDocument_workspaceId_idx" ON "DataRoomDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "DataRoomDocument_uploadedById_idx" ON "DataRoomDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "DataRoomDocument_roundId_category_idx" ON "DataRoomDocument"("roundId", "category");

-- CreateIndex
CREATE INDEX "DataRoomDocument_status_idx" ON "DataRoomDocument"("status");

-- CreateIndex
CREATE INDEX "CoachingSession_coachId_idx" ON "CoachingSession"("coachId");

-- CreateIndex
CREATE INDEX "CoachingSession_clientId_idx" ON "CoachingSession"("clientId");

-- CreateIndex
CREATE INDEX "CoachingSession_scheduledAt_idx" ON "CoachingSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "CoachingSession_status_idx" ON "CoachingSession"("status");

-- CreateIndex
CREATE INDEX "CoachingSession_coachId_status_idx" ON "CoachingSession"("coachId", "status");

-- CreateIndex
CREATE INDEX "CoachingSession_clientId_status_idx" ON "CoachingSession"("clientId", "status");

-- CreateIndex
CREATE INDEX "ExpertReview_requesterId_idx" ON "ExpertReview"("requesterId");

-- CreateIndex
CREATE INDEX "ExpertReview_expertId_idx" ON "ExpertReview"("expertId");

-- CreateIndex
CREATE INDEX "ExpertReview_workspaceId_idx" ON "ExpertReview"("workspaceId");

-- CreateIndex
CREATE INDEX "ExpertReview_status_idx" ON "ExpertReview"("status");

-- CreateIndex
CREATE INDEX "ExpertReview_reviewType_status_idx" ON "ExpertReview"("reviewType", "status");

-- CreateIndex
CREATE INDEX "ServiceOffer_providerId_idx" ON "ServiceOffer"("providerId");

-- CreateIndex
CREATE INDEX "ServiceOffer_status_idx" ON "ServiceOffer"("status");

-- CreateIndex
CREATE INDEX "ServiceOffer_category_idx" ON "ServiceOffer"("category");

-- CreateIndex
CREATE INDEX "ServiceOffer_isFeatured_idx" ON "ServiceOffer"("isFeatured");

-- CreateIndex
CREATE INDEX "ServiceOffer_providerId_status_idx" ON "ServiceOffer"("providerId", "status");

-- CreateIndex
CREATE INDEX "ServiceInquiry_offerId_idx" ON "ServiceInquiry"("offerId");

-- CreateIndex
CREATE INDEX "ServiceInquiry_clientId_idx" ON "ServiceInquiry"("clientId");

-- CreateIndex
CREATE INDEX "ServiceInquiry_providerId_idx" ON "ServiceInquiry"("providerId");

-- CreateIndex
CREATE INDEX "ServiceInquiry_status_idx" ON "ServiceInquiry"("status");

-- CreateIndex
CREATE INDEX "ServiceInquiry_providerId_status_idx" ON "ServiceInquiry"("providerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StartupSnapshot_workspaceId_key" ON "StartupSnapshot"("workspaceId");

-- CreateIndex
CREATE INDEX "StartupSnapshot_ownerId_idx" ON "StartupSnapshot"("ownerId");

-- CreateIndex
CREATE INDEX "StartupSnapshot_isRaisingNow_stage_idx" ON "StartupSnapshot"("isRaisingNow", "stage");

-- CreateIndex
CREATE INDEX "StartupSnapshot_industry_idx" ON "StartupSnapshot"("industry");

-- CreateIndex
CREATE INDEX "StartupSnapshot_readinessScore_idx" ON "StartupSnapshot"("readinessScore");

-- CreateIndex
CREATE INDEX "StartupSnapshot_isPublicToInvestors_idx" ON "StartupSnapshot"("isPublicToInvestors");

-- CreateIndex
CREATE UNIQUE INDEX "TechArchitecture_workspaceId_key" ON "TechArchitecture"("workspaceId");

-- CreateIndex
CREATE INDEX "TechArchitecture_workspaceId_idx" ON "TechArchitecture"("workspaceId");

-- CreateIndex
CREATE INDEX "ProductRequirementDoc_workspaceId_idx" ON "ProductRequirementDoc"("workspaceId");

-- CreateIndex
CREATE INDEX "ProductRequirementDoc_authorId_idx" ON "ProductRequirementDoc"("authorId");

-- CreateIndex
CREATE INDEX "ProductRequirementDoc_workspaceId_status_idx" ON "ProductRequirementDoc"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VenturePortfolio_workspaceId_key" ON "VenturePortfolio"("workspaceId");

-- CreateIndex
CREATE INDEX "VenturePortfolio_organizationId_idx" ON "VenturePortfolio"("organizationId");

-- CreateIndex
CREATE INDEX "VenturePortfolio_organizationId_status_idx" ON "VenturePortfolio"("organizationId", "status");

-- CreateIndex
CREATE INDEX "VenturePortfolio_status_idx" ON "VenturePortfolio"("status");

-- CreateIndex
CREATE INDEX "StartupApplication_applicantId_idx" ON "StartupApplication"("applicantId");

-- CreateIndex
CREATE INDEX "StartupApplication_workspaceId_idx" ON "StartupApplication"("workspaceId");

-- CreateIndex
CREATE INDEX "StartupApplication_programId_idx" ON "StartupApplication"("programId");

-- CreateIndex
CREATE INDEX "StartupApplication_tenantId_idx" ON "StartupApplication"("tenantId");

-- CreateIndex
CREATE INDEX "StartupApplication_status_idx" ON "StartupApplication"("status");

-- CreateIndex
CREATE INDEX "StartupApplication_applicantId_status_idx" ON "StartupApplication"("applicantId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceComment_workspaceId_idx" ON "WorkspaceComment"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceComment_authorId_idx" ON "WorkspaceComment"("authorId");

-- CreateIndex
CREATE INDEX "WorkspaceComment_workspaceId_sectionType_idx" ON "WorkspaceComment"("workspaceId", "sectionType");

-- CreateIndex
CREATE INDEX "WorkspaceComment_parentId_idx" ON "WorkspaceComment"("parentId");

-- CreateIndex
CREATE INDEX "WorkspaceComment_isResolved_idx" ON "WorkspaceComment"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripePaymentIntentId_key" ON "PaymentRecord"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_invoiceNumber_key" ON "PaymentRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PaymentRecord_subscriptionId_idx" ON "PaymentRecord"("subscriptionId");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_idx" ON "PaymentRecord"("userId");

-- CreateIndex
CREATE INDEX "PaymentRecord_status_idx" ON "PaymentRecord"("status");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentType_idx" ON "PaymentRecord"("paymentType");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_status_idx" ON "PaymentRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "PaymentRecord_stripePaymentIntentId_idx" ON "PaymentRecord"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paidAt_idx" ON "PaymentRecord"("paidAt");

-- CreateIndex
CREATE INDEX "PaymentRecord_status_createdAt_idx" ON "PaymentRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_idx" ON "UsageRecord"("userId");

-- CreateIndex
CREATE INDEX "UsageRecord_tenantId_idx" ON "UsageRecord"("tenantId");

-- CreateIndex
CREATE INDEX "UsageRecord_metric_idx" ON "UsageRecord"("metric");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_metric_idx" ON "UsageRecord"("userId", "metric");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_metric_billingPeriodStart_idx" ON "UsageRecord"("userId", "metric", "billingPeriodStart");

-- CreateIndex
CREATE INDEX "UsageRecord_billingPeriodStart_billingPeriodEnd_idx" ON "UsageRecord"("billingPeriodStart", "billingPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_code_idx" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_idx" ON "PromoCode"("isActive");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_validUntil_idx" ON "PromoCode"("isActive", "validUntil");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "SkillEndorsement_toUserId_idx" ON "SkillEndorsement"("toUserId");

-- CreateIndex
CREATE INDEX "SkillEndorsement_toUserId_skill_idx" ON "SkillEndorsement"("toUserId", "skill");

-- CreateIndex
CREATE INDEX "SkillEndorsement_fromUserId_idx" ON "SkillEndorsement"("fromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEndorsement_fromUserId_toUserId_skill_key" ON "SkillEndorsement"("fromUserId", "toUserId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_refereeId_idx" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "ProfilePortfolioItem_userId_idx" ON "ProfilePortfolioItem"("userId");

-- CreateIndex
CREATE INDEX "ProfilePortfolioItem_userId_type_idx" ON "ProfilePortfolioItem"("userId", "type");

-- CreateIndex
CREATE INDEX "ProfilePortfolioItem_userId_isFeatured_idx" ON "ProfilePortfolioItem"("userId", "isFeatured");

-- CreateIndex
CREATE INDEX "ProfilePortfolioItem_userId_sortOrder_idx" ON "ProfilePortfolioItem"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "AIAssistantSession_userId_idx" ON "AIAssistantSession"("userId");

-- CreateIndex
CREATE INDEX "AIAssistantSession_userId_context_idx" ON "AIAssistantSession"("userId", "context");

-- CreateIndex
CREATE INDEX "AIAssistantSession_userId_isArchived_updatedAt_idx" ON "AIAssistantSession"("userId", "isArchived", "updatedAt");

-- CreateIndex
CREATE INDEX "AIAssistantMessage_sessionId_idx" ON "AIAssistantMessage"("sessionId");

-- CreateIndex
CREATE INDEX "AIAssistantMessage_sessionId_createdAt_idx" ON "AIAssistantMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserReputationScore_userId_key" ON "UserReputationScore"("userId");

-- CreateIndex
CREATE INDEX "UserReputationScore_overallScore_idx" ON "UserReputationScore"("overallScore");

-- CreateIndex
CREATE INDEX "UserReputationScore_globalRank_idx" ON "UserReputationScore"("globalRank");

-- CreateIndex
CREATE INDEX "UserReputationScore_isVerified_idx" ON "UserReputationScore"("isVerified");

-- CreateIndex
CREATE INDEX "UserReputationScore_trustTier_idx" ON "UserReputationScore"("trustTier");

-- CreateIndex
CREATE INDEX "StartupReadinessReport_userId_idx" ON "StartupReadinessReport"("userId");

-- CreateIndex
CREATE INDEX "StartupReadinessReport_userId_snapshotAt_idx" ON "StartupReadinessReport"("userId", "snapshotAt");

-- CreateIndex
CREATE INDEX "StartupReadinessReport_workspaceId_idx" ON "StartupReadinessReport"("workspaceId");

-- CreateIndex
CREATE INDEX "StartupReadinessReport_snapshotAt_idx" ON "StartupReadinessReport"("snapshotAt");

-- CreateIndex
CREATE INDEX "StartupReadinessReport_overallScore_idx" ON "StartupReadinessReport"("overallScore");

-- CreateIndex
CREATE INDEX "DataRoomAccessLog_documentId_idx" ON "DataRoomAccessLog"("documentId");

-- CreateIndex
CREATE INDEX "DataRoomAccessLog_accessorId_idx" ON "DataRoomAccessLog"("accessorId");

-- CreateIndex
CREATE INDEX "DataRoomAccessLog_documentId_accessedAt_idx" ON "DataRoomAccessLog"("documentId", "accessedAt");

-- CreateIndex
CREATE INDEX "DataRoomAccessLog_accessorId_accessedAt_idx" ON "DataRoomAccessLog"("accessorId", "accessedAt");

-- CreateIndex
CREATE INDEX "DataRoomAccessLog_roundId_idx" ON "DataRoomAccessLog"("roundId");

-- CreateIndex
CREATE INDEX "MentorshipGoal_relationshipId_idx" ON "MentorshipGoal"("relationshipId");

-- CreateIndex
CREATE INDEX "MentorshipGoal_relationshipId_status_idx" ON "MentorshipGoal"("relationshipId", "status");

-- CreateIndex
CREATE INDEX "MentorshipGoal_targetDate_idx" ON "MentorshipGoal"("targetDate");

-- CreateIndex
CREATE INDEX "MentorshipGoal_status_idx" ON "MentorshipGoal"("status");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startAt_idx" ON "CalendarEvent"("userId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_eventType_idx" ON "CalendarEvent"("userId", "eventType");

-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_tenantId_startAt_idx" ON "CalendarEvent"("tenantId", "startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_workspaceId_idx" ON "CalendarEvent"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProfile_userId_key" ON "PublicProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProfile_slug_key" ON "PublicProfile"("slug");

-- CreateIndex
CREATE INDEX "PublicProfile_slug_idx" ON "PublicProfile"("slug");

-- CreateIndex
CREATE INDEX "PublicProfile_isPublished_idx" ON "PublicProfile"("isPublished");

-- CreateIndex
CREATE INDEX "FeedPost_authorId_idx" ON "FeedPost"("authorId");

-- CreateIndex
CREATE INDEX "FeedPost_communityId_createdAt_idx" ON "FeedPost"("communityId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_tenantId_createdAt_idx" ON "FeedPost"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_visibility_createdAt_idx" ON "FeedPost"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_postType_createdAt_idx" ON "FeedPost"("postType", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_isPinned_createdAt_idx" ON "FeedPost"("isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "FeedHiddenPost_userId_idx" ON "FeedHiddenPost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedHiddenPost_userId_postId_key" ON "FeedHiddenPost"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicPitch_documentId_key" ON "PublicPitch"("documentId");

-- CreateIndex
CREATE INDEX "PublicPitch_ownerId_idx" ON "PublicPitch"("ownerId");

-- CreateIndex
CREATE INDEX "PitchContactRequest_pitchId_createdAt_idx" ON "PitchContactRequest"("pitchId", "createdAt");

-- CreateIndex
CREATE INDEX "UserVerification_userId_idx" ON "UserVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_userId_method_key" ON "UserVerification"("userId", "method");

-- CreateIndex
CREATE UNIQUE INDEX "WorkEmailChallenge_userId_key" ON "WorkEmailChallenge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FounderUpdate_publicToken_key" ON "FounderUpdate"("publicToken");

-- CreateIndex
CREATE INDEX "FounderUpdate_authorId_createdAt_idx" ON "FounderUpdate"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedComment_postId_createdAt_idx" ON "FeedComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedComment_authorId_idx" ON "FeedComment"("authorId");

-- CreateIndex
CREATE INDEX "FeedComment_parentId_idx" ON "FeedComment"("parentId");

-- CreateIndex
CREATE INDEX "FeedLike_userId_idx" ON "FeedLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedLike_postId_userId_key" ON "FeedLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "FeedBookmark_userId_createdAt_idx" ON "FeedBookmark"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedBookmark_postId_userId_key" ON "FeedBookmark"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_category_status_idx" ON "SupportTicket"("category", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_status_idx" ON "SupportTicket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_authorId_idx" ON "TicketMessage"("authorId");

-- CreateIndex
CREATE INDEX "SavedItem_userId_createdAt_idx" ON "SavedItem"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItem_userId_kind_itemId_key" ON "SavedItem"("userId", "kind", "itemId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_searchType_idx" ON "SavedSearch"("userId", "searchType");

-- CreateIndex
CREATE INDEX "SavedSearch_alertEnabled_lastAlertAt_idx" ON "SavedSearch"("alertEnabled", "lastAlertAt");

-- CreateIndex
CREATE INDEX "PlatformAnnouncement_isActive_startsAt_idx" ON "PlatformAnnouncement"("isActive", "startsAt");

-- CreateIndex
CREATE INDEX "PlatformAnnouncement_target_isActive_idx" ON "PlatformAnnouncement"("target", "isActive");

-- CreateIndex
CREATE INDEX "PlatformAnnouncement_isPinned_isActive_idx" ON "PlatformAnnouncement"("isPinned", "isActive");

-- CreateIndex
CREATE INDEX "PlatformAnnouncementDismissal_userId_idx" ON "PlatformAnnouncementDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAnnouncementDismissal_announcementId_userId_key" ON "PlatformAnnouncementDismissal"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "MentorReview_mentorId_isPublic_idx" ON "MentorReview"("mentorId", "isPublic");

-- CreateIndex
CREATE INDEX "MentorReview_reviewerId_idx" ON "MentorReview"("reviewerId");

-- CreateIndex
CREATE INDEX "MentorReview_rating_idx" ON "MentorReview"("rating");

-- CreateIndex
CREATE INDEX "MentorReview_createdAt_idx" ON "MentorReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorReview_reviewerId_mentorId_key" ON "MentorReview"("reviewerId", "mentorId");

-- CreateIndex
CREATE INDEX "InvestorWatchlistItem_investorId_idx" ON "InvestorWatchlistItem"("investorId");

-- CreateIndex
CREATE INDEX "InvestorWatchlistItem_targetUserId_idx" ON "InvestorWatchlistItem"("targetUserId");

-- CreateIndex
CREATE INDEX "InvestorWatchlistItem_investorId_status_idx" ON "InvestorWatchlistItem"("investorId", "status");

-- CreateIndex
CREATE INDEX "InvestorWatchlistItem_addedAt_idx" ON "InvestorWatchlistItem"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorWatchlistItem_investorId_targetUserId_key" ON "InvestorWatchlistItem"("investorId", "targetUserId");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE INDEX "AIConversation_userId_agentType_idx" ON "AIConversation"("userId", "agentType");

-- CreateIndex
CREATE INDEX "AIConversation_userId_isArchived_idx" ON "AIConversation"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "AIConversation_userId_lastMessageAt_idx" ON "AIConversation"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "AIConversation_contextType_contextId_idx" ON "AIConversation"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AIMessage_role_idx" ON "AIMessage"("role");

-- CreateIndex
CREATE UNIQUE INDEX "AIUserPreference_userId_key" ON "AIUserPreference"("userId");

-- CreateIndex
CREATE INDEX "AIUserPreference_userId_idx" ON "AIUserPreference"("userId");

-- CreateIndex
CREATE INDEX "AIPromptTemplate_category_idx" ON "AIPromptTemplate"("category");

-- CreateIndex
CREATE INDEX "AIPromptTemplate_agentType_idx" ON "AIPromptTemplate"("agentType");

-- CreateIndex
CREATE INDEX "AIPromptTemplate_isPublic_isFeatured_idx" ON "AIPromptTemplate"("isPublic", "isFeatured");

-- CreateIndex
CREATE INDEX "AIPromptTemplate_creatorId_idx" ON "AIPromptTemplate"("creatorId");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_tenantId_idx" ON "AIUsageLog"("tenantId");

-- CreateIndex
CREATE INDEX "AIUsageLog_agentType_idx" ON "AIUsageLog"("agentType");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_success_idx" ON "AIUsageLog"("success");

-- CreateIndex
CREATE INDEX "ArtifactBranch_documentId_idx" ON "ArtifactBranch"("documentId");

-- CreateIndex
CREATE INDEX "ArtifactBranch_createdById_idx" ON "ArtifactBranch"("createdById");

-- CreateIndex
CREATE INDEX "ArtifactBranch_status_idx" ON "ArtifactBranch"("status");

-- CreateIndex
CREATE INDEX "ArtifactBranch_documentId_status_idx" ON "ArtifactBranch"("documentId", "status");

-- CreateIndex
CREATE INDEX "ChangeProposal_branchId_idx" ON "ChangeProposal"("branchId");

-- CreateIndex
CREATE INDEX "ChangeProposal_documentId_idx" ON "ChangeProposal"("documentId");

-- CreateIndex
CREATE INDEX "ChangeProposal_createdById_idx" ON "ChangeProposal"("createdById");

-- CreateIndex
CREATE INDEX "ChangeProposal_status_idx" ON "ChangeProposal"("status");

-- CreateIndex
CREATE INDEX "ChangeProposal_documentId_status_idx" ON "ChangeProposal"("documentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactShareLink_token_key" ON "ArtifactShareLink"("token");

-- CreateIndex
CREATE INDEX "ArtifactShareLink_token_idx" ON "ArtifactShareLink"("token");

-- CreateIndex
CREATE INDEX "ArtifactShareLink_documentId_idx" ON "ArtifactShareLink"("documentId");

-- CreateIndex
CREATE INDEX "ArtifactShareLink_workspaceId_idx" ON "ArtifactShareLink"("workspaceId");

-- CreateIndex
CREATE INDEX "ArtifactShareLink_createdById_idx" ON "ArtifactShareLink"("createdById");

-- CreateIndex
CREATE INDEX "ArtifactShareLink_isActive_idx" ON "ArtifactShareLink"("isActive");

-- CreateIndex
CREATE INDEX "ArtifactShareLink_isActive_expiresAt_idx" ON "ArtifactShareLink"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "CRDTSyncState_documentId_idx" ON "CRDTSyncState"("documentId");

-- CreateIndex
CREATE INDEX "CRDTSyncState_lastSyncAt_idx" ON "CRDTSyncState"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "CRDTSyncState_documentId_sectionKey_key" ON "CRDTSyncState"("documentId", "sectionKey");

-- CreateIndex
CREATE INDEX "XPEvent_userId_idx" ON "XPEvent"("userId");

-- CreateIndex
CREATE INDEX "XPEvent_userId_eventType_idx" ON "XPEvent"("userId", "eventType");

-- CreateIndex
CREATE INDEX "XPEvent_userId_createdAt_idx" ON "XPEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XPEvent_workspaceId_idx" ON "XPEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "XPEvent_eventType_createdAt_idx" ON "XPEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "XPEvent_cooldownKey_idx" ON "XPEvent"("cooldownKey");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationBadge_key_key" ON "GamificationBadge"("key");

-- CreateIndex
CREATE INDEX "GamificationBadge_category_idx" ON "GamificationBadge"("category");

-- CreateIndex
CREATE INDEX "GamificationBadge_rarity_idx" ON "GamificationBadge"("rarity");

-- CreateIndex
CREATE INDEX "GamificationBadge_isActive_idx" ON "GamificationBadge"("isActive");

-- CreateIndex
CREATE INDEX "UserGamificationBadge_userId_idx" ON "UserGamificationBadge"("userId");

-- CreateIndex
CREATE INDEX "UserGamificationBadge_badgeId_idx" ON "UserGamificationBadge"("badgeId");

-- CreateIndex
CREATE INDEX "UserGamificationBadge_awardedAt_idx" ON "UserGamificationBadge"("awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserGamificationBadge_userId_badgeId_key" ON "UserGamificationBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "StreakRecord_userId_key" ON "StreakRecord"("userId");

-- CreateIndex
CREATE INDEX "StreakRecord_currentStreak_idx" ON "StreakRecord"("currentStreak");

-- CreateIndex
CREATE INDEX "ContributionScore_userId_idx" ON "ContributionScore"("userId");

-- CreateIndex
CREATE INDEX "ContributionScore_workspaceId_idx" ON "ContributionScore"("workspaceId");

-- CreateIndex
CREATE INDEX "ContributionScore_score_idx" ON "ContributionScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionScore_userId_workspaceId_key" ON "ContributionScore"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMomentumScore_workspaceId_key" ON "TeamMomentumScore"("workspaceId");

-- CreateIndex
CREATE INDEX "TeamMomentumScore_score_idx" ON "TeamMomentumScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "MentorFeedbackMetric_workspaceId_key" ON "MentorFeedbackMetric"("workspaceId");

-- CreateIndex
CREATE INDEX "MentorFeedbackMetric_workspaceId_idx" ON "MentorFeedbackMetric"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationReadinessScore_workspaceId_key" ON "GamificationReadinessScore"("workspaceId");

-- CreateIndex
CREATE INDEX "GamificationReadinessScore_score_idx" ON "GamificationReadinessScore"("score");

-- CreateIndex
CREATE INDEX "AbuseFlag_userId_idx" ON "AbuseFlag"("userId");

-- CreateIndex
CREATE INDEX "AbuseFlag_type_idx" ON "AbuseFlag"("type");

-- CreateIndex
CREATE INDEX "AbuseFlag_status_idx" ON "AbuseFlag"("status");

-- CreateIndex
CREATE INDEX "AbuseFlag_severity_idx" ON "AbuseFlag"("severity");

-- CreateIndex
CREATE INDEX "AbuseFlag_createdAt_idx" ON "AbuseFlag"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_category_idx" ON "SystemConfig"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_key_key" ON "Experiment"("key");

-- CreateIndex
CREATE INDEX "Experiment_active_idx" ON "Experiment"("active");

-- CreateIndex
CREATE INDEX "Experiment_key_idx" ON "Experiment"("key");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_userId_idx" ON "ExperimentAssignment"("userId");

-- CreateIndex
CREATE INDEX "ExperimentAssignment_experimentId_idx" ON "ExperimentAssignment"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_userId_key" ON "ExperimentAssignment"("experimentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBehavioralState_userId_key" ON "UserBehavioralState"("userId");

-- CreateIndex
CREATE INDEX "UserBehavioralState_state_idx" ON "UserBehavioralState"("state");

-- CreateIndex
CREATE INDEX "UserBehavioralState_lastNudgeAt_idx" ON "UserBehavioralState"("lastNudgeAt");

-- CreateIndex
CREATE INDEX "NudgeLog_userId_idx" ON "NudgeLog"("userId");

-- CreateIndex
CREATE INDEX "NudgeLog_nudgeKey_idx" ON "NudgeLog"("nudgeKey");

-- CreateIndex
CREATE INDEX "NudgeLog_surface_idx" ON "NudgeLog"("surface");

-- CreateIndex
CREATE INDEX "NudgeLog_createdAt_idx" ON "NudgeLog"("createdAt");

-- CreateIndex
CREATE INDEX "NudgeLog_converted_idx" ON "NudgeLog"("converted");

-- CreateIndex
CREATE UNIQUE INDEX "BehaviorPolicy_version_key" ON "BehaviorPolicy"("version");

-- CreateIndex
CREATE INDEX "BehaviorPolicy_active_idx" ON "BehaviorPolicy"("active");

-- CreateIndex
CREATE INDEX "OpenToSignal_expiresAt_idx" ON "OpenToSignal"("expiresAt");

-- CreateIndex
CREATE INDEX "IntroRequest_requesterId_status_idx" ON "IntroRequest"("requesterId", "status");

-- CreateIndex
CREATE INDEX "IntroRequest_intermediaryId_status_idx" ON "IntroRequest"("intermediaryId", "status");

-- CreateIndex
CREATE INDEX "IntroRequest_targetId_status_idx" ON "IntroRequest"("targetId", "status");

-- CreateIndex
CREATE INDEX "SkillEvidence_userId_idx" ON "SkillEvidence"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEvidence_userId_skillName_kind_refId_key" ON "SkillEvidence"("userId", "skillName", "kind", "refId");

-- CreateIndex
CREATE INDEX "ScoutProposal_userId_status_idx" ON "ScoutProposal"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutProposal_userId_candidateId_key" ON "ScoutProposal"("userId", "candidateId");

-- CreateIndex
CREATE INDEX "Perk_active_category_idx" ON "Perk"("active", "category");

-- CreateIndex
CREATE INDEX "PerkClaim_userId_createdAt_idx" ON "PerkClaim"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PerkClaim_perkId_userId_key" ON "PerkClaim"("perkId", "userId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "ConversationValidation" ADD CONSTRAINT "ConversationValidation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationValidation" ADD CONSTRAINT "ConversationValidation_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationValidation" ADD CONSTRAINT "ConversationValidation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentCard" ADD CONSTRAINT "CommitmentCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentThread" ADD CONSTRAINT "CommitmentThread_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CommitmentCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentThread" ADD CONSTRAINT "CommitmentThread_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentMessage" ADD CONSTRAINT "CommitmentMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CommitmentThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentMessage" ADD CONSTRAINT "CommitmentMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentTerms" ADD CONSTRAINT "CommitmentTerms_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CommitmentThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentTerms" ADD CONSTRAINT "CommitmentTerms_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingContact" ADD CONSTRAINT "BillingContact_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProfile" ADD CONSTRAINT "SavedProfile_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProfile" ADD CONSTRAINT "SavedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDeal" ADD CONSTRAINT "InvestorDeal_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDeal" ADD CONSTRAINT "InvestorDeal_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDealEvent" ADD CONSTRAINT "InvestorDealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "InvestorDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endorsement" ADD CONSTRAINT "Endorsement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBoard" ADD CONSTRAINT "ResearchBoard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNode" ADD CONSTRAINT "ResearchNode_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNode" ADD CONSTRAINT "ResearchNode_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchNode" ADD CONSTRAINT "ResearchNode_builderDocumentId_fkey" FOREIGN KEY ("builderDocumentId") REFERENCES "BuilderDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchConnector" ADD CONSTRAINT "ResearchConnector_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchConnector" ADD CONSTRAINT "ResearchConnector_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "ResearchNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchConnector" ADD CONSTRAINT "ResearchConnector_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "ResearchNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBoardCollaborator" ADD CONSTRAINT "ResearchBoardCollaborator_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBoardCollaborator" ADD CONSTRAINT "ResearchBoardCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchComment" ADD CONSTRAINT "ResearchComment_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "ResearchNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchComment" ADD CONSTRAINT "ResearchComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchComment" ADD CONSTRAINT "ResearchComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ResearchComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBoardSnapshot" ADD CONSTRAINT "ResearchBoardSnapshot_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBoardSnapshot" ADD CONSTRAINT "ResearchBoardSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "CanvasBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "CanvasVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasVersion" ADD CONSTRAINT "CanvasVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasBranch" ADD CONSTRAINT "CanvasBranch_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasBranch" ADD CONSTRAINT "CanvasBranch_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "CanvasVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasBranch" ADD CONSTRAINT "CanvasBranch_headVersionId_fkey" FOREIGN KEY ("headVersionId") REFERENCES "CanvasVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasBranch" ADD CONSTRAINT "CanvasBranch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasMerge" ADD CONSTRAINT "CanvasMerge_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasMerge" ADD CONSTRAINT "CanvasMerge_sourceBranchId_fkey" FOREIGN KEY ("sourceBranchId") REFERENCES "CanvasBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasMerge" ADD CONSTRAINT "CanvasMerge_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "CanvasBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasMerge" ADD CONSTRAINT "CanvasMerge_mergedById_fkey" FOREIGN KEY ("mergedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderWorkspace" ADD CONSTRAINT "BuilderWorkspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderDocument" ADD CONSTRAINT "BuilderDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderDocumentSection" ADD CONSTRAINT "BuilderDocumentSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderDocumentVersion" ADD CONSTRAINT "BuilderDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderWorkspaceVersion" ADD CONSTRAINT "BuilderWorkspaceVersion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderCollaborator" ADD CONSTRAINT "BuilderCollaborator_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderCollaborator" ADD CONSTRAINT "BuilderCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderComment" ADD CONSTRAINT "BuilderComment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderComment" ADD CONSTRAINT "BuilderComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderComment" ADD CONSTRAINT "BuilderComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BuilderComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderSectionComment" ADD CONSTRAINT "BuilderSectionComment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BuilderDocumentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderSectionComment" ADD CONSTRAINT "BuilderSectionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderSectionComment" ADD CONSTRAINT "BuilderSectionComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BuilderSectionComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderReview" ADD CONSTRAINT "BuilderReview_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderReview" ADD CONSTRAINT "BuilderReview_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderReview" ADD CONSTRAINT "BuilderReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderReadinessScore" ADD CONSTRAINT "BuilderReadinessScore_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderAIGeneration" ADD CONSTRAINT "BuilderAIGeneration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderAIGeneration" ADD CONSTRAINT "BuilderAIGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderApplication" ADD CONSTRAINT "BuilderApplication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderExport" ADD CONSTRAINT "BuilderExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderActivityLog" ADD CONSTRAINT "BuilderActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuilderActivityLog" ADD CONSTRAINT "BuilderActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleFacet" ADD CONSTRAINT "UserRoleFacet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMentor" ADD CONSTRAINT "OrganizationMentor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMentor" ADD CONSTRAINT "OrganizationMentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramParticipant" ADD CONSTRAINT "ProgramParticipant_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramParticipant" ADD CONSTRAINT "ProgramParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramMilestone" ADD CONSTRAINT "ProgramMilestone_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorProfile" ADD CONSTRAINT "InvestorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProviderProfile" ADD CONSTRAINT "ServiceProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipRelationship" ADD CONSTRAINT "MentorshipRelationship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipRelationship" ADD CONSTRAINT "MentorshipRelationship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipSession" ADD CONSTRAINT "MentorshipSession_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "MentorshipRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipSession" ADD CONSTRAINT "MentorshipSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipSession" ADD CONSTRAINT "MentorshipSession_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRequest" ADD CONSTRAINT "MentorRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRequest" ADD CONSTRAINT "MentorRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchProfile" ADD CONSTRAINT "MatchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFeatureFlag" ADD CONSTRAINT "TenantFeatureFlag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantFeatureFlag" ADD CONSTRAINT "TenantFeatureFlag_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "AchievementDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDismissal" ADD CONSTRAINT "AnnouncementDismissal_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundraisingRound" ADD CONSTRAINT "FundraisingRound_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundraisingRound" ADD CONSTRAINT "FundraisingRound_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorPipelineLead" ADD CONSTRAINT "InvestorPipelineLead_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "FundraisingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorPipelineLead" ADD CONSTRAINT "InvestorPipelineLead_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomDocument" ADD CONSTRAINT "DataRoomDocument_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "FundraisingRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomDocument" ADD CONSTRAINT "DataRoomDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomDocument" ADD CONSTRAINT "DataRoomDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingSession" ADD CONSTRAINT "CoachingSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertReview" ADD CONSTRAINT "ExpertReview_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffer" ADD CONSTRAINT "ServiceOffer_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ServiceOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceInquiry" ADD CONSTRAINT "ServiceInquiry_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupSnapshot" ADD CONSTRAINT "StartupSnapshot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupSnapshot" ADD CONSTRAINT "StartupSnapshot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechArchitecture" ADD CONSTRAINT "TechArchitecture_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequirementDoc" ADD CONSTRAINT "ProductRequirementDoc_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequirementDoc" ADD CONSTRAINT "ProductRequirementDoc_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenturePortfolio" ADD CONSTRAINT "VenturePortfolio_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenturePortfolio" ADD CONSTRAINT "VenturePortfolio_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupApplication" ADD CONSTRAINT "StartupApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupApplication" ADD CONSTRAINT "StartupApplication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceComment" ADD CONSTRAINT "WorkspaceComment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceComment" ADD CONSTRAINT "WorkspaceComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceComment" ADD CONSTRAINT "WorkspaceComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WorkspaceComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEndorsement" ADD CONSTRAINT "SkillEndorsement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePortfolioItem" ADD CONSTRAINT "ProfilePortfolioItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistantSession" ADD CONSTRAINT "AIAssistantSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAssistantMessage" ADD CONSTRAINT "AIAssistantMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AIAssistantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReputationScore" ADD CONSTRAINT "UserReputationScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartupReadinessReport" ADD CONSTRAINT "StartupReadinessReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomAccessLog" ADD CONSTRAINT "DataRoomAccessLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DataRoomDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRoomAccessLog" ADD CONSTRAINT "DataRoomAccessLog_accessorId_fkey" FOREIGN KEY ("accessorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipGoal" ADD CONSTRAINT "MentorshipGoal_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "MentorshipRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicProfile" ADD CONSTRAINT "PublicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitchContactRequest" ADD CONSTRAINT "PitchContactRequest_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "PublicPitch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FounderUpdate" ADD CONSTRAINT "FounderUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedBookmark" ADD CONSTRAINT "FeedBookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedBookmark" ADD CONSTRAINT "FeedBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAnnouncement" ADD CONSTRAINT "PlatformAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAnnouncementDismissal" ADD CONSTRAINT "PlatformAnnouncementDismissal_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "PlatformAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAnnouncementDismissal" ADD CONSTRAINT "PlatformAnnouncementDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorReview" ADD CONSTRAINT "MentorReview_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorReview" ADD CONSTRAINT "MentorReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWatchlistItem" ADD CONSTRAINT "InvestorWatchlistItem_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWatchlistItem" ADD CONSTRAINT "InvestorWatchlistItem_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUserPreference" ADD CONSTRAINT "AIUserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPromptTemplate" ADD CONSTRAINT "AIPromptTemplate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactBranch" ADD CONSTRAINT "ArtifactBranch_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactBranch" ADD CONSTRAINT "ArtifactBranch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeProposal" ADD CONSTRAINT "ChangeProposal_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ArtifactBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeProposal" ADD CONSTRAINT "ChangeProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactShareLink" ADD CONSTRAINT "ArtifactShareLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactShareLink" ADD CONSTRAINT "ArtifactShareLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactShareLink" ADD CONSTRAINT "ArtifactShareLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRDTSyncState" ADD CONSTRAINT "CRDTSyncState_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "BuilderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XPEvent" ADD CONSTRAINT "XPEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGamificationBadge" ADD CONSTRAINT "UserGamificationBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGamificationBadge" ADD CONSTRAINT "UserGamificationBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "GamificationBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRecord" ADD CONSTRAINT "StreakRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionScore" ADD CONSTRAINT "ContributionScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionScore" ADD CONSTRAINT "ContributionScore_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMomentumScore" ADD CONSTRAINT "TeamMomentumScore_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorFeedbackMetric" ADD CONSTRAINT "MentorFeedbackMetric_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationReadinessScore" ADD CONSTRAINT "GamificationReadinessScore_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BuilderWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbuseFlag" ADD CONSTRAINT "AbuseFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBehavioralState" ADD CONSTRAINT "UserBehavioralState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NudgeLog" ADD CONSTRAINT "NudgeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NudgeLog" ADD CONSTRAINT "NudgeLog_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "UserBehavioralState"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkClaim" ADD CONSTRAINT "PerkClaim_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "Perk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkClaim" ADD CONSTRAINT "PerkClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileViewerSetting" ADD CONSTRAINT "ProfileViewerSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

