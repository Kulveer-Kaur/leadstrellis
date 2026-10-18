import { rateLimit } from 'express-rate-limit';

const json = (message: string) => ({ success: false, error: { code: 'RATE_LIMITED', message } });

/** Public lead-capture endpoints: 20 enquiries per IP per 10 minutes. */
export const intakeLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many enquiries, please try again later'),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: json('Too many login attempts, please try again later'),
});
