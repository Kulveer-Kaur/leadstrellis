/**
 * Normalises a phone number to E.164. Local UAE formats ("050 123 4567", "0501234567")
 * become +9715…; numbers that already have a country code are kept.
 */
export function normalizePhone(input?: string | null): string | undefined {
  if (!input) return undefined;
  const raw = input.replace(/^whatsapp:/i, '').trim();
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (digits.startsWith('+')) return digits.length >= 9 ? digits : undefined;
  if (digits.startsWith('971')) return `+${digits}`;
  if (digits.startsWith('05') && digits.length === 10) return `+971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `+971${digits}`;
  return digits.length >= 9 ? `+${digits}` : undefined;
}

/** "+971 50 *** 4567" for logs and AI prompts. */
export const maskPhone = (phone?: string | null) =>
  phone ? `${phone.slice(0, Math.min(6, phone.length - 4))}***${phone.slice(-4)}` : '';
