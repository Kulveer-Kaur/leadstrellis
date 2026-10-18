/** Minimal iCalendar (.ics) invite for a site visit, so it lands in the lead's calendar. */
export function siteVisitIcs(v: { uid: string; start: Date; minutes?: number; title: string; location: string; description: string; organizerEmail?: string }) {
  const end = new Date(v.start.getTime() + (v.minutes ?? 45) * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeadsTrellis//Site visit//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${v.uid}@leadstrellis`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(v.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(v.title)}`,
    `LOCATION:${esc(v.location)}`,
    `DESCRIPTION:${esc(v.description)}`,
    ...(v.organizerEmail ? [`ORGANIZER;CN=LeadsTrellis:mailto:${v.organizerEmail}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
