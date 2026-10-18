-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('INTAKE', 'QUALIFIER', 'MATCHMAKER', 'OUTREACH', 'INBOX', 'FOLLOW_UP', 'DEAL', 'PILOT');

-- CreateEnum
CREATE TYPE "AgentTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'SKIPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadSource" ADD VALUE 'GOOGLE_BUSINESS';
ALTER TYPE "LeadSource" ADD VALUE 'FACEBOOK';
ALTER TYPE "LeadSource" ADD VALUE 'PROPERTY_PORTAL';
ALTER TYPE "LeadSource" ADD VALUE 'REFERRAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'ENGAGED';
ALTER TYPE "LeadStatus" ADD VALUE 'NEGOTIATION';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "automationPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "dealValueAed" INTEGER,
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3),
ADD COLUMN     "winProbability" DOUBLE PRECISION,
ADD COLUMN     "winReasons" TEXT[],
ADD COLUMN     "wonAt" TIMESTAMP(3),
ADD COLUMN     "wonPropertyId" TEXT;

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "agent" "AgentType" NOT NULL,
    "type" TEXT NOT NULL,
    "leadId" TEXT,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSetting" (
    "id" TEXT NOT NULL,
    "agent" "AgentType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "tasksDoneToday" INTEGER NOT NULL DEFAULT 0,
    "statsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "pilotEnabled" BOOLEAN NOT NULL DEFAULT false,
    "liveFeedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "workingHoursStart" INTEGER NOT NULL DEFAULT 9,
    "workingHoursEnd" INTEGER NOT NULL DEFAULT 19,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dubai',
    "aiDailyTokenBudget" INTEGER NOT NULL DEFAULT 180000,
    "aiTokensUsedToday" INTEGER NOT NULL DEFAULT 0,
    "aiBudgetResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailsPerLeadPerDay" INTEGER NOT NULL DEFAULT 1,
    "emailsPerLeadPerWeek" INTEGER NOT NULL DEFAULT 4,
    "dailySendCap" INTEGER NOT NULL DEFAULT 150,
    "dailySendCount" INTEGER NOT NULL DEFAULT 0,
    "dailySendResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentTask_status_runAfter_idx" ON "AgentTask"("status", "runAfter");

-- CreateIndex
CREATE INDEX "AgentTask_agent_status_idx" ON "AgentTask"("agent", "status");

-- CreateIndex
CREATE INDEX "AgentTask_leadId_createdAt_idx" ON "AgentTask"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSetting_agent_key" ON "AgentSetting"("agent");

-- CreateIndex
CREATE INDEX "Lead_winProbability_idx" ON "Lead"("winProbability");

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_wonPropertyId_fkey" FOREIGN KEY ("wonPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
