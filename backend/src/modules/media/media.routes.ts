import { Router, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getAudio } from '../../integrations/tts/tts-cache.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { ApiError } from '../../utils/api-error.js';
import { created } from '../../utils/api-response.js';

export const mediaRoutes = Router();

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/** Public: Twilio fetches generated ElevenLabs speech from here during a call (unguessable ids, 15-min TTL). */
mediaRoutes.get('/tts/:id.mp3', (req, res) => {
  const audio = getAudio(req.params.id);
  if (!audio) return res.sendStatus(404);
  res.type('audio/mpeg').setHeader('Cache-Control', 'no-store');
  res.send(audio);
});

/** Serve uploaded media files publicly */
mediaRoutes.get('/images/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile(filePath);
});

/** Authenticated upload (base64 image) */
mediaRoutes.post('/upload', requireAuth, async (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || typeof data !== 'string') {
    throw ApiError.badRequest('Image data is required');
  }

  const matches = data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  let ext = 'jpg';
  let buffer: Buffer;

  if (matches) {
    ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(data, 'base64');
  }

  if (buffer.length > 10 * 1024 * 1024) {
    throw ApiError.badRequest('File size exceeds 10MB limit');
  }

  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(filePath, buffer);

  const url = `/api/v1/media/images/${uniqueName}`;
  created(res, { url, filename: uniqueName });
});
