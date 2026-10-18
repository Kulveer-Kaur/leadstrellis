import { randomUUID } from 'node:crypto';

const TTL_MS = 15 * 60_000;
const store = new Map<string, { audio: Buffer; expires: number }>();

/** Short-lived in-memory store for generated speech that Twilio fetches by URL. */
export function putAudio(audio: Buffer) {
  const now = Date.now();
  for (const [id, v] of store) if (v.expires < now) store.delete(id);
  const id = randomUUID();
  store.set(id, { audio, expires: now + TTL_MS });
  return id;
}

export const getAudio = (id: string) => store.get(id)?.audio;
