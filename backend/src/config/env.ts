import 'dotenv/config';
import { z } from 'zod';

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  PUBLIC_BASE_URL: optional,
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  /** Secure (HTTPS-only) auth cookie. Unset = on in production. Set false when serving plain http (e.g. a server IP). */
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),

  ADMIN_NAME: z.string().default('Admin'),
  ADMIN_EMAIL: z.string().email().default('admin@leadstrellis.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Admin@123'),

  LLM_PROVIDER: z.enum(['groq', 'mock']).default('groq'),
  GROQ_API_KEY: optional,
  GROQ_MODEL_FAST: z.string().default('openai/gpt-oss-20b'),
  GROQ_MODEL_SMART: z.string().default('openai/gpt-oss-120b'),

  CALL_PROVIDER: z.enum(['twilio', 'simulated']).default('simulated'),
  TWILIO_ACCOUNT_SID: optional,
  TWILIO_AUTH_TOKEN: optional,
  TWILIO_FROM_NUMBER: optional,
  TWILIO_TEST_TO_NUMBER: optional,
  TWILIO_WHATSAPP_FROM: optional,
  TWILIO_SAY_VOICE: z.string().default('Polly.Joanna'),
  VOICE_LANGUAGE: z.string().default('en-US'),

  ELEVENLABS_API_KEY: optional,
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'),
  ELEVENLABS_MODEL_ID: z.string().default('eleven_flash_v2_5'),

  NO_REPLY_HOURS: z.coerce.number().positive().default(48),
  MAX_CONTACT_ATTEMPTS: z.coerce.number().int().positive().default(3),
  SCHEDULER_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
  JOB_SPACING_MS: z.coerce.number().int().nonnegative().default(1500),

  // Phase 2 mail. Leaving SMTP_HOST blank keeps the mailer in "log only" mode,
  // so the agent runner still works end-to-end for QA without a real mailbox.
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optional,
  SMTP_PASS: optional,
  SMTP_FROM: optional,
  PUBLIC_APP_URL: z.string().default('http://localhost:5173'),
  /** Browser-reachable API base for links in emails (PDF download). Defaults to PUBLIC_APP_URL + /api/v1 (Vite proxy). */
  PUBLIC_API_URL: optional,
  // Replies are read over IMAP. Blank values fall back to the SMTP account (Gmail → imap.gmail.com).
  IMAP_HOST: optional,
  IMAP_PORT: z.coerce.number().int().positive().default(993),
  IMAP_USER: optional,
  IMAP_PASS: optional,
  IMAP_POLL_SECONDS: z.coerce.number().int().positive().default(60),
  ADMIN_BRIEFING_TO: optional,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
