/**
 * Canonical UAE communities with the aliases people actually type, and nearby
 * communities used when the matcher relaxes location filters.
 */
export interface Community {
  name: string;
  emirate: string;
  aliases: string[];
  nearby: string[];
  lat: number;
  lng: number;
}

export const COMMUNITIES: Community[] = [
  { name: 'Dubai Marina', emirate: 'Dubai', aliases: ['marina', 'dubai marina', 'jbr', 'jumeirah beach residence'], nearby: ['JLT', 'Palm Jumeirah', 'Dubai Harbour'], lat: 25.0805, lng: 55.1403 },
  { name: 'Downtown Dubai', emirate: 'Dubai', aliases: ['downtown', 'burj khalifa', 'boulevard', 'opera district'], nearby: ['Business Bay', 'DIFC'], lat: 25.1972, lng: 55.2744 },
  { name: 'Business Bay', emirate: 'Dubai', aliases: ['business bay', 'bb'], nearby: ['Downtown Dubai', 'DIFC', 'Al Jaddaf'], lat: 25.1857, lng: 55.2634 },
  { name: 'Palm Jumeirah', emirate: 'Dubai', aliases: ['palm', 'the palm', 'palm jumeirah'], nearby: ['Dubai Marina', 'Dubai Harbour'], lat: 25.1124, lng: 55.139 },
  { name: 'Dubai Harbour', emirate: 'Dubai', aliases: ['dubai harbour', 'emaar beachfront', 'beachfront'], nearby: ['Dubai Marina', 'Palm Jumeirah'], lat: 25.0937, lng: 55.1424 },
  { name: 'JVC', emirate: 'Dubai', aliases: ['jvc', 'jumeirah village circle', 'jumeirah village'], nearby: ['JVT', 'Dubai Hills Estate', 'Arjan'], lat: 25.0608, lng: 55.2094 },
  { name: 'JVT', emirate: 'Dubai', aliases: ['jvt', 'jumeirah village triangle'], nearby: ['JVC', 'Discovery Gardens'], lat: 25.0505, lng: 55.1924 },
  { name: 'JLT', emirate: 'Dubai', aliases: ['jlt', 'jumeirah lake towers', 'jumeirah lakes towers'], nearby: ['Dubai Marina', 'Emirates Hills'], lat: 25.0692, lng: 55.1442 },
  { name: 'Dubai Hills Estate', emirate: 'Dubai', aliases: ['dubai hills', 'hills estate', 'dhe'], nearby: ['Arabian Ranches', 'JVC', 'Al Barsha'], lat: 25.1035, lng: 55.2457 },
  { name: 'Arabian Ranches', emirate: 'Dubai', aliases: ['arabian ranches', 'ranches'], nearby: ['Dubai Hills Estate', 'DAMAC Hills', 'Motor City'], lat: 25.0553, lng: 55.2687 },
  { name: 'DAMAC Hills', emirate: 'Dubai', aliases: ['damac hills', 'akoya'], nearby: ['Arabian Ranches', 'Motor City'], lat: 25.0234, lng: 55.2528 },
  { name: 'Dubai Creek Harbour', emirate: 'Dubai', aliases: ['creek harbour', 'dubai creek', 'creek'], nearby: ['Al Jaddaf', 'Downtown Dubai'], lat: 25.2048, lng: 55.3464 },
  { name: 'Dubai South', emirate: 'Dubai', aliases: ['dubai south', 'expo city', 'near expo', 'al maktoum airport'], nearby: ['DAMAC Hills', 'Dubai Investments Park'], lat: 24.8886, lng: 55.1572 },
  { name: 'DIFC', emirate: 'Dubai', aliases: ['difc', 'financial centre', 'financial center'], nearby: ['Downtown Dubai', 'Business Bay'], lat: 25.2125, lng: 55.2811 },
  { name: 'Al Jaddaf', emirate: 'Dubai', aliases: ['jaddaf', 'al jaddaf', 'culture village'], nearby: ['Dubai Creek Harbour', 'Business Bay'], lat: 25.2222, lng: 55.3274 },
  { name: 'Saadiyat Island', emirate: 'Abu Dhabi', aliases: ['saadiyat'], nearby: ['Al Reem Island', 'Yas Island'], lat: 24.5414, lng: 54.4331 },
  { name: 'Yas Island', emirate: 'Abu Dhabi', aliases: ['yas', 'yas island'], nearby: ['Al Raha Beach', 'Saadiyat Island'], lat: 24.4889, lng: 54.6033 },
  { name: 'Al Reem Island', emirate: 'Abu Dhabi', aliases: ['reem', 'reem island', 'al reem'], nearby: ['Saadiyat Island', 'Al Raha Beach'], lat: 24.4978, lng: 54.4031 },
  { name: 'Al Raha Beach', emirate: 'Abu Dhabi', aliases: ['raha', 'al raha', 'raha beach'], nearby: ['Yas Island', 'Al Reem Island'], lat: 24.4485, lng: 54.6067 },
  { name: 'Aljada', emirate: 'Sharjah', aliases: ['aljada', 'al jada'], nearby: ['Al Majaz'], lat: 25.3047, lng: 55.4589 },
  { name: 'Al Majaz', emirate: 'Sharjah', aliases: ['majaz', 'al majaz'], nearby: ['Aljada'], lat: 25.3279, lng: 55.3854 },
  { name: 'Al Nuaimiya', emirate: 'Ajman', aliases: ['nuaimiya', 'al nuaimiya'], nearby: [], lat: 25.3956, lng: 55.4497 },
  { name: 'Al Marjan Island', emirate: 'Ras Al Khaimah', aliases: ['marjan', 'al marjan', 'marjan island'], nearby: [], lat: 25.6687, lng: 55.7426 },
];

export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah'] as const;

const byAlias = new Map<string, Community>();
for (const c of COMMUNITIES) {
  byAlias.set(c.name.toLowerCase(), c);
  for (const a of c.aliases) byAlias.set(a, c);
}

/** "marina" → Dubai Marina. Returns undefined for unknown places. */
export const findCommunity = (text: string) => byAlias.get(text.trim().toLowerCase());

export const normalizeEmirate = (text?: string | null) =>
  text ? EMIRATES.find((e) => e.toLowerCase() === text.trim().toLowerCase()) ?? (/^rak$/i.test(text) ? 'Ras Al Khaimah' : undefined) : undefined;

/** Alias list sorted longest-first, so "dubai marina" wins over "marina" in free-text scans. */
export const ALIASES_LONGEST_FIRST = [...byAlias.keys()].sort((a, b) => b.length - a.length);

/** Compact "Name (aliases)" list injected into the extraction prompt. */
export const COMMUNITY_PROMPT_LIST = COMMUNITIES.map((c) => `${c.name} [${c.emirate}]: ${c.aliases.join(', ')}`).join('\n');
