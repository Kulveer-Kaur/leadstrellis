-- CreateEnum
CREATE TYPE "AiRouteStep" AS ENUM ('OFF', 'ANALYSING', 'MATCHING', 'PROPOSING', 'AWAITING_REPLY', 'WON', 'LOST', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SENT', 'FAILED', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "aiRouteEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiRouteNote" TEXT,
ADD COLUMN     "aiRouteStartedAt" TIMESTAMP(3),
ADD COLUMN     "aiRouteStep" "AiRouteStep" NOT NULL DEFAULT 'OFF';

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SENT',
    "fitScore" INTEGER,
    "headline" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "whyItFits" TEXT[],
    "nextSteps" TEXT[],
    "slots" TIMESTAMP(3)[],
    "alternatives" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "emailMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "viewingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_token_key" ON "Proposal"("token");

-- CreateIndex
CREATE INDEX "Proposal_leadId_createdAt_idx" ON "Proposal"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_emailMessageId_idx" ON "Proposal"("emailMessageId");

-- CreateIndex
CREATE INDEX "Lead_aiRouteEnabled_aiRouteStep_idx" ON "Lead"("aiRouteEnabled", "aiRouteStep");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_viewingId_fkey" FOREIGN KEY ("viewingId") REFERENCES "Viewing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
