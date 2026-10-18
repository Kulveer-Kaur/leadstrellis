-- CreateEnum
CREATE TYPE "AgentMode" AS ENUM ('OFF', 'RULES', 'AI');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "agentMode" "AgentMode" NOT NULL DEFAULT 'OFF';

-- Leads already on the route before modes existed were run by the AI.
UPDATE "Lead" SET "agentMode" = 'AI' WHERE "aiRouteEnabled" = true OR "aiRouteStep" <> 'OFF';
