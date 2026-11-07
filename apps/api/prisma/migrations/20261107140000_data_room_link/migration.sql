-- CreateTable
CREATE TABLE "DataRoomLink" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "lastOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataRoomLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataRoomLink_tokenHash_key" ON "DataRoomLink"("tokenHash");

-- CreateIndex
CREATE INDEX "DataRoomLink_roundId_idx" ON "DataRoomLink"("roundId");

-- AddForeignKey
ALTER TABLE "DataRoomLink" ADD CONSTRAINT "DataRoomLink_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "FundraisingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
