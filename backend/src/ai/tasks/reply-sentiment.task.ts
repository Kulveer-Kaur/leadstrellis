import { runJsonTask } from '../guards/run-json-task.js';
import { REPLY_SENTIMENT_PROMPT_VERSION, replySentimentSystemPrompt, replySentimentUserPrompt } from '../prompts/reply-sentiment.prompt.js';
import { replySentimentSchema, type ReplySentimentOutput } from '../schemas/reply-sentiment.schema.js';

export interface ReplySentimentInput {
  firstName: string;
  /** Current pipeline status, as context for the model. */
  status: string;
  reply: string;
  /** False = keyword rules only, no AI tokens. */
  useAi?: boolean;
}

/** Reads any reply from a lead (not tied to a proposal): positive, negotiating, negative, stop or neutral. */
export async function readReplySentiment(i: ReplySentimentInput) {
  const result = await runJsonTask({
    task: 'reply-sentiment',
    promptVersion: REPLY_SENTIMENT_PROMPT_VERSION,
    system: replySentimentSystemPrompt(),
    user: replySentimentUserPrompt(i.firstName, i.status, i.reply),
    schema: replySentimentSchema,
    fallback: () => sentimentWithRules(i.reply),
    useAi: i.useAi,
  });
  return { ...result.data, aiGenerated: result.source === 'ai' };
}

/**
 * Keyword fallback used offline, for leads not on the AI agent, or when the AI budget is
 * spent. POSITIVE tops out below the auto-win bar, so rules alone never mark a lead won.
 */
export function sentimentWithRules(reply: string): ReplySentimentOutput {
  const text = reply.toLowerCase();
  if (/unsubscribe|stop (emailing|messaging|contacting|sending)|remove me|do not (contact|email)|don'?t (contact|email|message) me/.test(text)) {
    return { sentiment: 'STOP', confidence: 0.8, summary: 'Lead asked us to stop contacting them.' };
  }
  if (/not interested|no thanks|no, thank|already (bought|found|rented)|bought (a|another|elsewhere)|not (looking|buying) (now|anymore)/.test(text)) {
    return { sentiment: 'NEGATIVE', confidence: 0.7, summary: 'Lead is not interested.' };
  }
  if (/discount|best price|lower (the )?price|negotiat|counter.?offer|reduce|too (expensive|high)|can you do|final price|payment plan/.test(text)) {
    return { sentiment: 'NEGOTIATION', confidence: 0.65, summary: 'Lead wants to negotiate the price or terms.' };
  }
  if (/go ahead|proceed|i'?ll take it|we'?ll take it|we accept|i accept|send (me )?(the )?(contract|agreement|paperwork|booking form)|ready to (buy|pay|book|sign)|reserve (it|the)/.test(text)) {
    return { sentiment: 'POSITIVE', confidence: 0.7, summary: 'Lead seems ready to go ahead.' };
  }
  return { sentiment: 'NEUTRAL', confidence: 0.5, summary: 'Lead replied.' };
}
