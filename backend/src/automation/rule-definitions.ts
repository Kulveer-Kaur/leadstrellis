/** Automation rules (implemented in code). The seed stores these so admins can switch them on/off. */
export const RULES = {
  SEND_TOP_MATCHES: {
    key: 'send-top-matches',
    name: 'Send top 3 matches',
    description: 'As soon as a lead is understood and matched, send the best matches on the lead\'s preferred channel.',
    trigger: 'Lead processed',
  },
  INSTANT_CALL: {
    key: 'instant-call-high-intent',
    name: 'Instant AI call for high intent',
    description: 'High-intent leads with a phone number get an AI call right after the matches are sent.',
    trigger: 'Lead scored ≥ 70',
  },
  POST_CALL: {
    key: 'post-call-next-step',
    name: 'Next step after AI call',
    description: 'Interested → book viewing and confirm; not ready → schedule follow-up; not interested → nurture.',
    trigger: 'AI call completed',
  },
  RETRY_NEXT_CHANNEL: {
    key: 'retry-next-channel',
    name: 'Retry on next channel',
    description: 'No reply within the wait window → try the next channel (WhatsApp → email → call), up to the max attempts, then nurture.',
    trigger: 'No reply in 48h',
  },
  NURTURE_DRIP: {
    key: 'nurture-drip',
    name: 'Monthly nurture drip',
    description: 'Leads in nurture get a short market update every 30 days.',
    trigger: 'Moved to nurture',
  },
} as const;

export type RuleKey = (typeof RULES)[keyof typeof RULES]['key'];
