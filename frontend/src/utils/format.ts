const compact = new Intl.NumberFormat('en-AE', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const whole = new Intl.NumberFormat('en-AE');

/** AED 1.2M style for KPIs and cards. */
export const formatAedCompact = (value: number) => `AED ${compact.format(value)}`;

export const formatNumber = (value: number) => whole.format(value);

export const formatPercent = (value: number) => `${Math.round(value)}%`;

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "5 minutes ago", "yesterday", … relative to `now`. */
export const formatRelative = (iso: string, now: Date = new Date()) => {
  const diffSec = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'just now';
  if (abs < 3600) return relative.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(diffSec / 3600), 'hour');
  return relative.format(Math.round(diffSec / 86400), 'day');
};

const timeFmt = new Intl.DateTimeFormat('en-AE', { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-AE', { weekday: 'short', day: 'numeric', month: 'short' });

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatDay = (iso: string) => dayFmt.format(new Date(iso));

const dateTimeFmt = new Intl.DateTimeFormat('en-AE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** "Tue, 7 Oct, 3:30 pm" */
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

/** AED 1,250,000 (full figure, for detail pages). */
export const formatAed = (value: number) => `AED ${whole.format(value)}`;
