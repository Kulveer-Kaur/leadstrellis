import { aiConfig } from '../../config/ai.config.js';
import type { LlmProvider } from './llm.types.js';
import { GroqProvider } from './providers/groq.provider.js';

let provider: LlmProvider | null | undefined;

/** The configured LLM, or null in mock mode (tasks then use their rule-based fallback). */
export function getLlm(): LlmProvider | null {
  if (provider === undefined) provider = aiConfig.provider === 'groq' ? new GroqProvider() : null;
  return provider;
}
