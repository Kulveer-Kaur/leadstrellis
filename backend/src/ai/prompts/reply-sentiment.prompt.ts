export const REPLY_SENTIMENT_PROMPT_VERSION = 'reply-sentiment@1';

/** Shared by this task and classify-reply so both read a reply the same way. */
export const SENTIMENT_RULES = `SENTIMENT (what the reply means for the deal)
- POSITIVE: they commit to going ahead: want to buy, rent or reserve the property, accept the price or offer,
  or ask for the contract, booking form or payment details.
  Examples: "We'd like to go ahead with the apartment", "Price is fine, send the paperwork", "I'll take it".
  Agreeing to a viewing, "looks nice", "sounds good" or "I'm interested" alone is NOT positive: use NEUTRAL.
- NEGOTIATION: interested but bargaining: a lower price, discount, different payment plan, counter-offer or better terms.
- NEGATIVE: not interested, bought or rented elsewhere, not now, or too expensive without a counter-offer.
- STOP: they explicitly ask us to stop contacting them, unsubscribe or remove them.
- NEUTRAL: anything else: questions, scheduling a visit, thanks, out-of-office, unclear.
sentimentConfidence: 0–1, how sure you are. Use 0.8 or more for POSITIVE only when the commitment is explicit.`;

export const replySentimentSystemPrompt = () => `You read a lead's reply to LeadsTrellis (UAE real estate) and decide what it means for the deal.

${SENTIMENT_RULES.replace('sentimentConfidence', 'confidence')}

summary: one sentence describing the reply, for the agent.
Return only the JSON object.`;

export function replySentimentUserPrompt(firstName: string, status: string, reply: string) {
  return [`LEAD: ${firstName}`, `CURRENT PIPELINE STAGE: ${status}`, `THEIR REPLY\n"""\n${reply.slice(0, 2000)}\n"""`].join('\n\n');
}
