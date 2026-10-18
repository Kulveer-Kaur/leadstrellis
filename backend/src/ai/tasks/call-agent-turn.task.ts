import { scriptedAgentTurn } from '../fallbacks/scripted-call-agent.js';
import { runJsonTask } from '../guards/run-json-task.js';
import { CALL_AGENT_PROMPT_VERSION, callAgentSystemPrompt, callAgentUserPrompt, type CallAgentContext } from '../prompts/call-agent.prompt.js';
import { callAgentTurnSchema } from '../schemas/call-agent.schema.js';

export type TranscriptLine = { speaker: 'AI' | 'LEAD'; text: string };

/** Step 7: the next thing the voice agent says. Replies are trimmed for text-to-speech. */
export async function callAgentTurn(context: CallAgentContext, transcript: TranscriptLine[]) {
  const result = await runJsonTask({
    task: 'call-agent-turn',
    promptVersion: CALL_AGENT_PROMPT_VERSION,
    system: callAgentSystemPrompt(context),
    user: callAgentUserPrompt(transcript.slice(-16)),
    schema: callAgentTurnSchema,
    fallback: () => scriptedAgentTurn(context, transcript),
  });
  const reply = result.data.reply.replace(/[*_#`>]/g, '').replace(/\s+/g, ' ').trim();
  return { ...result.data, reply, endCall: result.data.endCall || context.turnsLeft <= 1 };
}
