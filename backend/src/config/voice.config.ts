import { env, isProd } from './env.js';

const twilioReady = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);

export const voiceConfig = {
  twilioReady,
  /** Real calls need Twilio creds, a public URL for webhooks, and (outside prod) a test number. */
  useTwilioCalls:
    env.CALL_PROVIDER === 'twilio' && twilioReady && Boolean(env.PUBLIC_BASE_URL) && (isProd || Boolean(env.TWILIO_TEST_TO_NUMBER)),
  /** Outside production, every real outbound call/SMS/WhatsApp goes to the test number. */
  dialOverride: isProd ? undefined : env.TWILIO_TEST_TO_NUMBER,
  elevenLabsReady: Boolean(env.ELEVENLABS_API_KEY),
  sayVoice: env.TWILIO_SAY_VOICE,
  language: env.VOICE_LANGUAGE,
  /** Max agent turns before the call is wrapped up politely. */
  maxTurns: 14,
  /** Consecutive silent turns before hanging up. */
  maxSilentTurns: 2,
  /** A simulated call with no reply for this long is closed as unanswered. */
  simulatedIdleMinutes: 10,
  /** Safety net: a Twilio call with no final status webhook after this long is closed. */
  twilioStaleMinutes: 60,
} as const;
