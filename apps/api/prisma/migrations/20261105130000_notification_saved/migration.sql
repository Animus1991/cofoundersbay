-- A notification kept for later (the inbox's Save, docs §54.7 #2, §111).
-- Nullable: every existing notification stays unsaved.

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "savedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_userId_savedAt_idx" ON "Notification"("userId", "savedAt");
