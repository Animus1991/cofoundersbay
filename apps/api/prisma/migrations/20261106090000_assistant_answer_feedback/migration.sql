-- A member's 👍 or 👎 on one assistant answer (docs §54.7 #5, §111): the
-- verdict, a reason from a fixed list and which assistant answered. No
-- question, no answer, no free text.

-- CreateTable
CREATE TABLE "AssistantAnswerFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantAnswerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistantAnswerFeedback_updatedAt_idx" ON "AssistantAnswerFeedback"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantAnswerFeedback_userId_answerId_key" ON "AssistantAnswerFeedback"("userId", "answerId");

-- AddForeignKey
ALTER TABLE "AssistantAnswerFeedback" ADD CONSTRAINT "AssistantAnswerFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
