import type { NextFunction, Request, Response } from 'express';
import twilio from 'twilio';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Rejects webhook calls that are not signed by Twilio. The URL Twilio signed is
 * PUBLIC_BASE_URL + the original path, so that variable must match the tunnel exactly.
 */
export function twilioSignature(req: Request, res: Response, next: NextFunction) {
  if (!env.TWILIO_AUTH_TOKEN || !env.PUBLIC_BASE_URL) return res.status(503).send('Twilio not configured');
  const signature = req.header('X-Twilio-Signature') ?? '';
  const url = `${env.PUBLIC_BASE_URL.replace(/\/$/, '')}${req.originalUrl}`;
  const valid = twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body ?? {});
  if (!valid) {
    logger.warn({ url }, 'invalid Twilio signature');
    return res.status(403).send('Invalid signature');
  }
  next();
}
