-- A member's proposal on someone's listing (docs §111): one per member and
-- listing; the owner answers, the sender can withdraw while it is pending.

-- CreateEnum
CREATE TYPE "OpportunityProposalStatus" AS ENUM ('pending', 'accepted', 'declined', 'withdrawn');
-- CreateTable
CREATE TABLE "OpportunityProposal" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "timeframe" TEXT,
    "compensation" TEXT,
    "status" "OpportunityProposalStatus" NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpportunityProposal_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "OpportunityProposal_fromId_createdAt_idx" ON "OpportunityProposal"("fromId", "createdAt");
-- CreateIndex
CREATE INDEX "OpportunityProposal_opportunityId_status_idx" ON "OpportunityProposal"("opportunityId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "OpportunityProposal_opportunityId_fromId_key" ON "OpportunityProposal"("opportunityId", "fromId");
-- AddForeignKey
ALTER TABLE "OpportunityProposal" ADD CONSTRAINT "OpportunityProposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "OpportunityProposal" ADD CONSTRAINT "OpportunityProposal_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
