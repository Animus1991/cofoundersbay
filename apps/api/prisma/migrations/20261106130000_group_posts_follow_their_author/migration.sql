-- DropForeignKey
ALTER TABLE "GroupPost" DROP CONSTRAINT "GroupPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "GroupPostComment" DROP CONSTRAINT "GroupPostComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "GroupPostReaction" DROP CONSTRAINT "GroupPostReaction_userId_fkey";

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostComment" ADD CONSTRAINT "GroupPostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostReaction" ADD CONSTRAINT "GroupPostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

