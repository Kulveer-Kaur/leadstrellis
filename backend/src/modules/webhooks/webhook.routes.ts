import express, { Router } from 'express';
import { twilioSignature } from '../../middlewares/twilio-signature.middleware.js';
import * as voice from '../calls/twilio-webhook.controller.js';
import { inboundWhatsapp } from './twilio-whatsapp.controller.js';

/** Twilio webhooks: form-encoded and signature-verified (PUBLIC_BASE_URL must match the tunnel). */
export const webhookRoutes = Router();

webhookRoutes.use(express.urlencoded({ extended: false }), twilioSignature);
webhookRoutes.post('/twilio/voice/:callId/answer', voice.answer);
webhookRoutes.post('/twilio/voice/:callId/turn', voice.turn);
webhookRoutes.post('/twilio/voice/:callId/status', voice.status);
webhookRoutes.post('/twilio/whatsapp', inboundWhatsapp);
