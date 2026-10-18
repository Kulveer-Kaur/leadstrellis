import { env } from './env.js';

/** Which model each AI task uses, plus generation settings. One place to tune cost vs quality. */
export const aiConfig = {
  provider: env.LLM_PROVIDER === 'groq' && env.GROQ_API_KEY ? 'groq' : 'mock',
  groq: {
    apiKey: env.GROQ_API_KEY,
    baseUrl: 'https://api.groq.com/openai/v1',
    timeoutMs: 20_000,
    /** Retries on 429 / 5xx, honouring retry-after (free tier is 30 req/min, 8K tokens/min). */
    maxRetries: 3,
  },
  tasks: {
    'understand-lead': { model: env.GROQ_MODEL_FAST, temperature: 0.1, maxTokens: 1400 },
    'rerank-properties': { model: env.GROQ_MODEL_SMART, temperature: 0.2, maxTokens: 1200 },
    'compose-message': { model: env.GROQ_MODEL_FAST, temperature: 0.6, maxTokens: 900 },
    'call-agent-turn': { model: env.GROQ_MODEL_SMART, temperature: 0.4, maxTokens: 600 },
    'summarize-call': { model: env.GROQ_MODEL_FAST, temperature: 0.1, maxTokens: 900 },
    'compose-proposal': { model: env.GROQ_MODEL_FAST, temperature: 0.4, maxTokens: 1600 },
    'classify-reply': { model: env.GROQ_MODEL_SMART, temperature: 0.1, maxTokens: 1000 },
    'reply-sentiment': { model: env.GROQ_MODEL_FAST, temperature: 0.1, maxTokens: 400 },
  },
} as const;

export type AiTaskName = keyof typeof aiConfig.tasks;
