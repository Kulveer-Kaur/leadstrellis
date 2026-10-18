const compact = new Intl.NumberFormat('en-AE', { notation: 'compact', maximumFractionDigits: 2 });

/** "AED 1.25M" — used in AI prompts and outbound messages. */
export const formatAed = (value?: number | null) => (value == null ? 'not given' : `AED ${compact.format(value)}`);
