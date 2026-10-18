import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

/** ElevenLabs text-to-speech → MP3 bytes, or null on any failure (caller falls back to Twilio <Say>). */
export async function synthesizeSpeech(text: string): Promise<Buffer | null> {
  if (!env.ELEVENLABS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${env.ELEVENLABS_VOICE_ID}?output_format=mp3_22050_32`,
      {
        method: 'POST',
        headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL_ID }),
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) {
      logger.warn({ status: res.status, body: (await res.text()).slice(0, 200) }, 'ElevenLabs TTS failed');
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    logger.warn({ err }, 'ElevenLabs TTS error');
    return null;
  }
}
