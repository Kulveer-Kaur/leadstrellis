import type { ListingView } from '../context/ai-context.types.js';
import { runJsonTask } from '../guards/run-json-task.js';
import { CLASSIFY_REPLY_PROMPT_VERSION, classifyReplySystemPrompt, classifyReplyUserPrompt } from '../prompts/classify-reply.prompt.js';
import { classifyReplySchema, type ClassifyReplyOutput } from '../schemas/classify-reply.schema.js';
import { formatDubai } from '../../utils/dates.js';
import { sentimentWithRules } from './reply-sentiment.task.js';

export interface ClassifyReplyInput {
  firstName: string;
  reply: string;
  best: ListingView;
  alternatives: ListingView[];
  slots: string[];
  agentName: string;
  /** False = keyword rules only, no AI tokens. */
  useAi?: boolean;
}

/** Reads a lead's reply to a proposal: did they confirm a site visit, ask something, or decline? */
export async function classifyReply(i: ClassifyReplyInput) {
  // Token saver: clear answers ("Option 2 works", "not interested") are read by rules for
  // free; the AI is only asked when the rules are unsure or a written answer is needed.
  const rules = classifyWithRules(i);
  const simple = i.reply.length <= 160 && !i.reply.includes('?') && !/\b(but|however|instead|except)\b/i.test(i.reply);
  if (i.useAi === false || (simple && rules.confidence >= 0.7 && (rules.intent === 'CONFIRM_VISIT' || rules.intent === 'NOT_INTERESTED'))) {
    return { ...rules, aiGenerated: false };
  }
  const result = await runJsonTask({
    task: 'classify-reply',
    promptVersion: CLASSIFY_REPLY_PROMPT_VERSION,
    system: classifyReplySystemPrompt(i.agentName, formatDubai(new Date())),
    user: classifyReplyUserPrompt(i.firstName, i.reply, i.best, i.alternatives, i.slots),
    schema: classifyReplySchema,
    fallback: () => classifyWithRules(i),
  });
  return { ...result.data, aiGenerated: result.source === 'ai' };
}

const ORDINALS: Record<string, number> = { first: 1, '1st': 1, second: 2, '2nd': 2, third: 3, '3rd': 3 };

/** Keyword fallback used offline or when the AI budget is spent. */
export function classifyWithRules(i: ClassifyReplyInput): ClassifyReplyOutput {
  const read = readIntentWithRules(i);
  const mood = sentimentWithRules(i.reply);
  // A decline is never a "go ahead", whatever keywords it contains.
  const sentiment = read.intent === 'NOT_INTERESTED' && mood.sentiment !== 'STOP' ? 'NEGATIVE' : mood.sentiment;
  return { ...read, sentiment, sentimentConfidence: mood.confidence };
}

function readIntentWithRules(i: ClassifyReplyInput): Omit<ClassifyReplyOutput, 'sentiment' | 'sentimentConfidence'> {
  const text = i.reply.toLowerCase();
  const sign = `${i.agentName}, LeadsTrellis`;
  const optionMatch = text.match(/option\s*#?\s*(\d)/) ?? text.match(/\b(first|second|third|1st|2nd|3rd)\b/);
  const slotNumber = optionMatch ? Number(optionMatch[1]) || ORDINALS[optionMatch[1]!] || null : null;
  const valid = slotNumber && slotNumber <= i.slots.length ? slotNumber : null;

  if (/not interested|no thanks|no, thank|stop|unsubscribe|bought|already found|remove me/.test(text)) {
    return { intent: 'NOT_INTERESTED', confidence: 0.7, slotNumber: null, requestedDateTime: null, propertyRef: null, summary: 'Lead declined.', replyBody: `Hi ${i.firstName},\n\nThank you for letting me know. I will keep an eye out and only get in touch if something truly fits.\n\n${sign}` };
  }
  if (valid && /(works|fine|ok|okay|good|confirm|yes|book|perfect|suits)/.test(text)) {
    return { intent: 'CONFIRM_VISIT', confidence: 0.75, slotNumber: valid, requestedDateTime: null, propertyRef: null, summary: `Lead confirmed option ${valid}.`, replyBody: '' };
  }
  const ask = `I can arrange a site visit at any of these times:\n${i.slots.map((s, n) => `Option ${n + 1}: ${s}`).join('\n')}\n\nJust reply with the option that suits you.`;
  if (text.includes('?')) {
    return { intent: 'ASK_QUESTION', confidence: 0.5, slotNumber: null, requestedDateTime: null, propertyRef: null, summary: 'Lead asked a question.', replyBody: `Hi ${i.firstName},\n\nThank you for your question. Your agent will confirm the details for you shortly.\n\n${ask}\n\n${sign}` };
  }
  if (/visit|view|see it|available|time|tomorrow|weekend/.test(text)) {
    return { intent: 'WANTS_OTHER_TIME', confidence: 0.5, slotNumber: null, requestedDateTime: null, propertyRef: null, summary: 'Lead wants to visit but did not pick a time.', replyBody: `Hi ${i.firstName},\n\nHappy to arrange a visit. Visits run daily from 10:00 to 19:00; tell me the day and time that suits you best.\n\n${ask}\n\n${sign}` };
  }
  return { intent: 'OTHER', confidence: 0.4, slotNumber: null, requestedDateTime: null, propertyRef: null, summary: 'Unclear reply.', replyBody: `Hi ${i.firstName},\n\nThank you for your reply. ${ask}\n\n${sign}` };
}
