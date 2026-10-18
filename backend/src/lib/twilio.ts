import twilio from 'twilio';
import { env } from '../config/env.js';

let client: ReturnType<typeof twilio> | undefined;

export function getTwilio() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) throw new Error('Twilio is not configured');
  client ??= twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return client;
}
