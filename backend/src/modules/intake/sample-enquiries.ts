import type { LeadSource } from '../../generated/prisma/enums.js';

export interface SampleEnquiry {
  id: string;
  source: LeadSource;
  fullName: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  message: string;
}

/**
 * Realistic dummy enquiries for the simulator and the seed: clear, vague, Arabic-English
 * mix, investors, renters, and an unrealistic budget. Phone numbers use the 0000 block.
 */
export const SAMPLE_ENQUIRIES: SampleEnquiry[] = [
  { id: 'wa-marina-cash', source: 'WHATSAPP', fullName: 'Omar Haddad', phone: '+971500000101', message: 'Hi, looking for a 2BR with sea view in Dubai Marina, budget up to 2.4M, cash buyer. Ready to move, want to see options this week.' },
  { id: 'wa-jvc-rent', source: 'WHATSAPP', fullName: 'Priya Raman', phone: '+971500000102', message: 'Hello! Need a 1 bed flat in JVC for rent, max 75k per year, 4 cheques ok. Moving next month, pet friendly would be great 🐶' },
  { id: 'wa-arabizi-villa', source: 'WHATSAPP', fullName: 'Khalid Al Mazrouei', phone: '+971500000103', message: 'Salam habibi, looking for villa 4 bed + maid in Arabian Ranches or Dubai Hills, around 6.5 mil. Family with 3 kids so need garden and near schools. Inshallah buying in 2-3 months' },
  { id: 'wa-vague', source: 'WHATSAPP', fullName: 'Ravi Menon', phone: '+971500000104', message: 'hi what do you have?' },
  { id: 'wa-arabic', source: 'WHATSAPP', fullName: 'Mariam Al Suwaidi', phone: '+971500000105', message: 'مرحبا، أبحث عن شقة غرفتين في داون تاون دبي للشراء بميزانية ٣ مليون درهم، جاهزة للسكن' },
  { id: 'ig-palm-ph', source: 'INSTAGRAM', fullName: 'Sofia Laurent', instagramHandle: 'sofia.laurent', message: 'Saw your reel on the Palm 😍 do you have penthouses there? Budget around 12M, would love a private pool' },
  { id: 'ig-studio-invest', source: 'INSTAGRAM', fullName: 'Arjun Kapoor', instagramHandle: 'arjun.invests', message: 'Interested in off-plan studios for investment, Dubai South or JVC, under 700k with payment plan. What ROI can I expect?' },
  { id: 'ig-browse', source: 'INSTAGRAM', fullName: 'Lina Haddad', instagramHandle: 'lina.h', message: 'Price list for Creek Harbour pls' },
  { id: 'web-downtown-mortgage', source: 'WEBSITE', fullName: 'James Whitfield', email: 'james.whitfield@example.com', phone: '+971500000108', message: 'Relocating from London in January with my wife. Looking for a 3 bedroom apartment in Downtown or Business Bay, budget £900k. Mortgage pre-approved. Would like to book viewings when we land.' },
  { id: 'web-ranches-th', source: 'WEBSITE', fullName: 'Fatima Al Zaabi', email: 'fatima.z@example.com', phone: '+971500000109', message: '3BR townhouse, Arabian Ranches, up to 3.8M. Not in a rush, maybe end of year.' },
  { id: 'email-abudhabi', source: 'EMAIL', fullName: 'Hassan Qureshi', email: 'hassan.q@example.com', message: 'Good afternoon, I am looking to buy a 2 or 3 bedroom apartment on Saadiyat or Al Reem Island in Abu Dhabi. Budget AED 2.5M to 3.2M. I would prefer a sea view and two parking spaces. Please send me what you have available.' },
  { id: 'email-unrealistic', source: 'EMAIL', fullName: 'Lukas Becker', email: 'lukas.b@example.com', message: 'I want a 5 bedroom villa on Palm Jumeirah beachfront for 300k AED. Thanks' },
  { id: 'ads-studio-rent', source: 'ADS', fullName: 'Mei Chen', phone: '+971500000113', message: 'Studio for rent near metro in Business Bay or JLT, 5k a month, furnished, asap' },
  { id: 'phone-yas', source: 'PHONE', fullName: 'Ahmed Al Hashimi', phone: '+971500000114', message: 'Called in: wants 3BR townhouse on Yas Island for family, budget 3M, cash, ready property only, wants to view this weekend.' },
];

export const findSample = (id: string) => SAMPLE_ENQUIRIES.find((s) => s.id === id);
