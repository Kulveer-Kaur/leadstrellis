import type { LeadStatus } from '../../../src/generated/prisma/enums.js';
import { SAMPLE_ENQUIRIES, type SampleEnquiry } from '../../../src/modules/intake/sample-enquiries.js';

/** PENDING = left unprocessed so the live AI (Groq) handles it when the server starts. */
export type SeedStage = LeadStatus | 'PENDING';

export interface SeedLead extends Omit<SampleEnquiry, 'id'> {
  stage: SeedStage;
  /** Days before seeding that the enquiry arrived (fractions allowed). */
  daysAgo: number;
}

const EXTRA: SeedLead[] = [
  { source: 'WHATSAPP', fullName: 'Aisha Rahman', phone: '+971500000201', message: '3 bedroom apartment Downtown Dubai with Burj view, up to 4.2M, mortgage pre-approved. Can view this week', stage: 'VIEWING', daysAgo: 3 },
  { source: 'WHATSAPP', fullName: 'Daniel Okafor', phone: '+971500000202', message: 'Need 2BR in JLT near metro for rent, 120k per year max, family of 3, moving in 2 months', stage: 'CONTACTED', daysAgo: 4 },
  { source: 'WHATSAPP', fullName: 'Noura Al Ketbi', phone: '+971500000203', message: 'Looking for townhouse in Dubai Hills, 4 bed, budget 5.5M cash. Want ready unit.', stage: 'VIEWING', daysAgo: 6 },
  { source: 'WHATSAPP', fullName: 'Vikram Shah', phone: '+971500000204', message: 'Investor here. 2-3 off plan units in Dubai Creek Harbour or Dubai South, total 3M, payment plan required', stage: 'QUALIFIED', daysAgo: 1.5 },
  { source: 'WHATSAPP', fullName: 'Elena Petrova', phone: '+971500000205', message: 'Hi do you have any penthouse in Marina with sea view? up to 9 mil', stage: 'CONTACTED', daysAgo: 8 },
  { source: 'WHATSAPP', fullName: 'Yousef Al Hammadi', phone: '+971500000206', message: 'Yalla brother, villa 5BR Palm Jumeirah private pool, 25M budget, want to see this weekend', stage: 'CLOSED_WON', daysAgo: 24 },
  { source: 'INSTAGRAM', fullName: 'Chloe Martin', instagramHandle: 'chloe.in.dubai', message: 'Love the Dubai Harbour post! 1 bed for rent there? around 140k/yr, furnished pls', stage: 'CONTACTED', daysAgo: 2 },
  { source: 'INSTAGRAM', fullName: 'Hamza Siddiqui', instagramHandle: 'hamza.sq', message: 'Studio in JVC for investment under 600k, ready, good rental yield?', stage: 'QUALIFIED', daysAgo: 0.8 },
  { source: 'INSTAGRAM', fullName: 'Grace Lee', instagramHandle: 'gracelee.home', message: 'Just browsing, what areas are good for families?', stage: 'NURTURE', daysAgo: 19 },
  { source: 'INSTAGRAM', fullName: 'Tariq Mahmood', instagramHandle: 'tariq.m', message: 'Need 2BR Al Reem Island Abu Dhabi, sea view, 1.8M', stage: 'VIEWING', daysAgo: 9 },
  { source: 'WEBSITE', fullName: 'Sophie Turner', email: 'sophie.t@example.com', phone: '+971500000211', message: 'We are a family of five relocating in March. Looking for a 4 bedroom villa in Arabian Ranches with a garden, near schools, budget AED 5M.', stage: 'CONTACTED', daysAgo: 5 },
  { source: 'WEBSITE', fullName: 'Rashid Al Nuaimi', email: 'rashid.n@example.com', phone: '+971500000212', message: 'Yas Island 3BR townhouse, budget 3.2M, cash, ready.', stage: 'CLOSED_WON', daysAgo: 33 },
  { source: 'WEBSITE', fullName: 'Ana Costa', email: 'ana.costa@example.com', phone: '+971500000213', message: 'Looking to rent a studio in Business Bay, 70k per year, from next month', stage: 'CONTACTED', daysAgo: 12 },
  { source: 'WEBSITE', fullName: 'Marcus Johnson', email: 'marcus.j@example.com', phone: '+971500000214', message: 'Interested in Saadiyat Island beach villa, 5 bed, 12M, want to visit when I fly in next month', stage: 'QUALIFIED', daysAgo: 0.3 },
  { source: 'EMAIL', fullName: 'Olivia Brown', email: 'olivia.brown@example.com', message: 'Hello, could you share 2 bedroom apartments in Dubai Marina for sale under 2.2M? Prefer a high floor with marina view. We plan to buy within 3 months.', stage: 'VIEWING', daysAgo: 7 },
  { source: 'EMAIL', fullName: 'Ibrahim Khoury', email: 'ibrahim.k@example.com', message: 'Seeking a 1BR in DIFC for investment, budget 1.6M, ROI focused.', stage: 'NURTURE', daysAgo: 27 },
  { source: 'EMAIL', fullName: 'Emma Wilson', email: 'emma.w@example.com', message: 'Looking for a 3 bed townhouse in DAMAC Hills, 2.5M max, no rush, maybe next year.', stage: 'NURTURE', daysAgo: 40 },
  { source: 'ADS', fullName: 'Rajesh Kumar', phone: '+971500000218', message: 'Interested in Aljada 2BR, payment plan, under 1.3M', stage: 'CONTACTED', daysAgo: 10 },
  { source: 'ADS', fullName: 'Fatima Noor', phone: '+971500000219', message: 'Apartment Sharjah Al Majaz 2 bed rent 55k', stage: 'QUALIFIED', daysAgo: 2.5 },
  { source: 'ADS', fullName: 'George Mitchell', phone: '+971500000220', message: 'Hi', stage: 'CLOSED_LOST', daysAgo: 35 },
  { source: 'PHONE', fullName: 'Salma Al Qasimi', phone: '+971500000221', message: 'Called: 3BR apartment Al Marjan Island RAK, sea view, holiday home, 2.5M cash, wants viewing next week.', stage: 'VIEWING', daysAgo: 4.5 },
  { source: 'PHONE', fullName: 'Peter Novak', phone: '+971500000222', message: 'Called: looking at 2BR in Dubai Hills Park Heights, up to 2.6M, mortgage, 2 months.', stage: 'CONTACTED', daysAgo: 6.5 },
  { source: 'MANUAL', fullName: 'Layla Hassan', phone: '+971500000223', email: 'layla.h@example.com', message: 'Walk-in referral from existing client. Wants 2BR Palm Jumeirah apartment with beach access, 4M, ready, buying this month.', stage: 'VIEWING', daysAgo: 2 },
  { source: 'MANUAL', fullName: 'Chen Wei', phone: '+971500000224', message: 'Referral: investor buying 3 studios in Dubai South off-plan, 2M total.', stage: 'QUALIFIED', daysAgo: 1 },
  { source: 'WHATSAPP', fullName: 'Nadia Farouk', phone: '+971500000225', message: 'Need 1BR in Al Jaddaf near Creek, rent 85k, pet friendly, asap', stage: 'PENDING', daysAgo: 0.05 },
  { source: 'INSTAGRAM', fullName: 'Jake Robinson', instagramHandle: 'jake.robinson', message: 'Do you have 3 bed villas in Arabian Ranches under 4.5M? Moving from Abu Dhabi in 2 months', stage: 'PENDING', daysAgo: 0.03 },
];

/** Pipeline stage and age for each simulator sample, so the seed also covers them. */
const SAMPLE_PLAN: Record<string, Pick<SeedLead, 'stage' | 'daysAgo'>> = {
  'wa-marina-cash': { stage: 'PENDING', daysAgo: 0.02 },
  'wa-jvc-rent': { stage: 'CONTACTED', daysAgo: 0.6 },
  'wa-arabizi-villa': { stage: 'QUALIFIED', daysAgo: 1.2 },
  'wa-vague': { stage: 'NEW', daysAgo: 0.4 },
  'wa-arabic': { stage: 'CONTACTED', daysAgo: 3.5 },
  'ig-palm-ph': { stage: 'VIEWING', daysAgo: 5 },
  'ig-studio-invest': { stage: 'CONTACTED', daysAgo: 2.2 },
  'ig-browse': { stage: 'NURTURE', daysAgo: 14 },
  'web-downtown-mortgage': { stage: 'PENDING', daysAgo: 0.01 },
  'web-ranches-th': { stage: 'NURTURE', daysAgo: 22 },
  'email-abudhabi': { stage: 'CONTACTED', daysAgo: 11 },
  'email-unrealistic': { stage: 'CLOSED_LOST', daysAgo: 16 },
  'ads-studio-rent': { stage: 'QUALIFIED', daysAgo: 0.9 },
  'phone-yas': { stage: 'VIEWING', daysAgo: 1.8 },
};

export const SEED_LEADS: SeedLead[] = [
  ...SAMPLE_ENQUIRIES.map(({ id, ...s }) => ({ ...s, ...SAMPLE_PLAN[id] })),
  ...EXTRA,
];
