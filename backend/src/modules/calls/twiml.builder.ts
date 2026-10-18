import twilio from 'twilio';
import { env } from '../../config/env.js';
import { voiceConfig } from '../../config/voice.config.js';
import { synthesizeSpeech } from '../../integrations/tts/elevenlabs.tts.js';
import { putAudio } from '../../integrations/tts/tts-cache.js';
import { webhookUrl } from '../../integrations/voice/twilio-voice.js';

type VoiceResponse = InstanceType<typeof twilio.twiml.VoiceResponse>;
type Speakable = Pick<VoiceResponse, 'say' | 'play'>;

/** Speaks text with ElevenLabs when configured (served from /media/tts), else Twilio <Say>. */
async function speak(node: Speakable, text: string) {
  const audio = voiceConfig.elevenLabsReady ? await synthesizeSpeech(text) : null;
  if (audio) {
    node.play(`${env.PUBLIC_BASE_URL!.replace(/\/$/, '')}/api/v1/media/tts/${putAudio(audio)}.mp3`);
  } else {
    node.say({ voice: voiceConfig.sayVoice as never, language: voiceConfig.language as never }, text);
  }
}

/** Say `text`, then listen for the lead's answer and post it to the turn webhook. */
export async function speakAndListen(callId: string, text: string) {
  const vr = new twilio.twiml.VoiceResponse();
  const gather = vr.gather({
    input: ['speech'],
    action: webhookUrl(`/voice/${callId}/turn`),
    method: 'POST',
    speechTimeout: 'auto',
    language: voiceConfig.language as never,
    actionOnEmptyResult: true,
  });
  await speak(gather, text);
  return vr.toString();
}

/** Say `text` and hang up. */
export async function speakAndHangUp(text: string) {
  const vr = new twilio.twiml.VoiceResponse();
  await speak(vr, text);
  vr.hangup();
  return vr.toString();
}
