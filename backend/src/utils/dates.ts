/** Dubai is UTC+4 all year (no DST), so slot maths can stay simple and exact. */
const DUBAI_OFFSET_HOURS = 4;

/** A Date for `hour:00` Dubai time, `daysAhead` days from now (viewings run 7 days a week). */
export function dubaiSlot(daysAhead: number, hour: number, now = new Date()): Date {
  const local = new Date(now.getTime() + DUBAI_OFFSET_HOURS * 3_600_000);
  local.setUTCDate(local.getUTCDate() + daysAhead);
  local.setUTCHours(hour - DUBAI_OFFSET_HOURS, 0, 0, 0);
  return local;
}

/** Two upcoming viewing slots the AI can offer (tomorrow 11:00 and 17:00 Dubai time). */
export const nextViewingSlots = (now = new Date()) => [dubaiSlot(1, 11, now), dubaiSlot(1, 17, now)];

const fmt = new Intl.DateTimeFormat('en-AE', {
  timeZone: 'Asia/Dubai',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
});

/** "Friday 3 October at 11:00 am" in Dubai time, for prompts and messages. */
export const formatDubai = (d: Date) => fmt.format(d);

export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);
export const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 3_600_000);
