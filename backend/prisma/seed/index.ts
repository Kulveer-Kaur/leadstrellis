/**
 * Seed entry (npx prisma db seed). Forces the rule-based "mock" AI so seeding never spends
 * Groq quota; the env must be set before any app module is imported, hence the dynamic import.
 */
process.env.LLM_PROVIDER = 'mock';
process.env.LOG_LEVEL ??= 'warn';

const { runSeed } = await import('./run.js');
await runSeed();
