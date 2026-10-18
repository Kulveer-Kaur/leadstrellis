import { createServer } from 'node:http';
import { aiConfig } from './config/ai.config.js';
import { env } from './config/env.js';
import { voiceConfig } from './config/voice.config.js';
import { createApp } from './app.js';
import { registerAutomations } from './automation/automation.engine.js';
import { recoverPendingLeads } from './jobs/lead-processing.job.js';
import { startScheduler, stopScheduler } from './jobs/scheduler.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { initSocket } from './lib/socket.js';
import { bootstrapUsers } from './modules/auth/bootstrap.js';

async function main() {
  await prisma.$connect();
  await bootstrapUsers();
  const server = createServer(createApp());
  initSocket(server);
  registerAutomations();
  startScheduler();

  server.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        llm: aiConfig.provider === 'groq' ? `groq (${env.GROQ_MODEL_FAST} / ${env.GROQ_MODEL_SMART})` : 'mock (rule-based, no API key)',
        calls: voiceConfig.useTwilioCalls ? `twilio → ${voiceConfig.dialOverride ? 'test number' : 'lead phones'}` : 'simulated',
        tts: voiceConfig.elevenLabsReady ? 'elevenlabs' : 'twilio say',
      },
      `Leadstrellis API ready on http://localhost:${env.PORT}`,
    );
    void recoverPendingLeads();
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    stopScheduler();
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
