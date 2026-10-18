import { summarizeWithRules } from '../fallbacks/call-summary.fallback.js';
import { runJsonTask } from '../guards/run-json-task.js';
import {
  SUMMARIZE_CALL_PROMPT_VERSION,
  summarizeCallSystemPrompt,
  summarizeCallUserPrompt,
  type SummarizeCallPromptInput,
} from '../prompts/summarize-call.prompt.js';
import { summarizeCallSchema } from '../schemas/summarize-call.schema.js';

/** After the call: outcome, summary and the CRM field updates. */
export async function summarizeCall(input: SummarizeCallPromptInput) {
  if (!input.transcript.some((t) => t.speaker === 'LEAD' && t.text.trim())) {
    return { data: summarizeWithRules(input.transcript), source: 'fallback' as const };
  }
  return runJsonTask({
    task: 'summarize-call',
    promptVersion: SUMMARIZE_CALL_PROMPT_VERSION,
    system: summarizeCallSystemPrompt(),
    user: summarizeCallUserPrompt(input),
    schema: summarizeCallSchema,
    fallback: () => summarizeWithRules(input.transcript),
  });
}
