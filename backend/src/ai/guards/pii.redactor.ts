const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /(\+?\d[\d\s-]{7,}\d)/g;

/** Masks emails and phone numbers before text is stored in AI logs. */
export const redactPii = (text: string) => text.replace(EMAIL, '[email]').replace(PHONE, '[phone]');
