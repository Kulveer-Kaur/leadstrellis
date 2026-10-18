import type { PropertyType } from '../../../src/generated/prisma/enums.js';

/**
 * Market profile per community: AED price per sqft (sale), gross rental yield,
 * what gets built there, real-ish building names, views and developers.
 * Figures are illustrative 2026 demo values, not market data.
 */
export interface CommunityProfile {
  community: string;
  ppsf: number;
  yieldPct: number;
  mix: PropertyType[];
  buildings: string[];
  views: string[];
  developer: string;
  offPlanShare: number;
  count: number;
}

export const COMMUNITY_PROFILES: CommunityProfile[] = [
  { community: 'Dubai Marina', ppsf: 2100, yieldPct: 6.5, mix: ['APARTMENT', 'APARTMENT', 'PENTHOUSE', 'STUDIO'], buildings: ['Marina Gate', 'Cayan Tower', 'Marina Promenade', 'Princess Tower', 'Damac Heights'], views: ['Sea', 'Marina', 'Palm'], developer: 'Select Group', offPlanShare: 0.1, count: 7 },
  { community: 'Downtown Dubai', ppsf: 2600, yieldPct: 5.8, mix: ['APARTMENT', 'APARTMENT', 'PENTHOUSE', 'STUDIO'], buildings: ['Boulevard Point', 'Burj Royale', 'Act One Act Two', 'The Address Residences', 'Grande'], views: ['Burj Khalifa', 'Fountain', 'Boulevard'], developer: 'Emaar', offPlanShare: 0.2, count: 7 },
  { community: 'Business Bay', ppsf: 1900, yieldPct: 6.8, mix: ['APARTMENT', 'STUDIO', 'APARTMENT', 'OFFICE'], buildings: ['Executive Towers', 'Peninsula', 'Canal Heights', 'Vera Residences'], views: ['Canal', 'Burj Khalifa', 'City'], developer: 'Omniyat', offPlanShare: 0.3, count: 6 },
  { community: 'Palm Jumeirah', ppsf: 3800, yieldPct: 5.2, mix: ['VILLA', 'APARTMENT', 'PENTHOUSE', 'VILLA'], buildings: ['Signature Villas', 'Garden Homes', 'Oceana', 'Tiara Residences', 'One Palm'], views: ['Sea', 'Atlantis', 'Skyline'], developer: 'Nakheel', offPlanShare: 0.1, count: 7 },
  { community: 'Dubai Harbour', ppsf: 3000, yieldPct: 6.0, mix: ['APARTMENT', 'APARTMENT', 'PENTHOUSE'], buildings: ['Emaar Beachfront', 'Sunrise Bay', 'Beach Vista', 'Grand Bleu Tower'], views: ['Sea', 'Marina', 'Palm'], developer: 'Emaar', offPlanShare: 0.4, count: 4 },
  { community: 'JVC', ppsf: 1150, yieldPct: 7.8, mix: ['APARTMENT', 'STUDIO', 'TOWNHOUSE', 'APARTMENT'], buildings: ['Binghatti Gems', 'Belgravia', 'Bloom Towers', 'Oxford Residences'], views: ['Community', 'Pool', 'Park'], developer: 'Binghatti', offPlanShare: 0.35, count: 7 },
  { community: 'JVT', ppsf: 1100, yieldPct: 7.5, mix: ['TOWNHOUSE', 'APARTMENT', 'VILLA'], buildings: ['District 4', 'Al Waha Villas', 'Pantheon Elysee'], views: ['Community', 'Park'], developer: 'Nakheel', offPlanShare: 0.2, count: 4 },
  { community: 'JLT', ppsf: 1350, yieldPct: 7.2, mix: ['APARTMENT', 'STUDIO', 'APARTMENT', 'OFFICE'], buildings: ['Lake Point', 'Goldcrest Views', 'MBL Residences', 'Green Lakes'], views: ['Lake', 'Golf', 'Marina'], developer: 'DMCC', offPlanShare: 0.15, count: 5 },
  { community: 'Dubai Hills Estate', ppsf: 2000, yieldPct: 5.6, mix: ['VILLA', 'TOWNHOUSE', 'APARTMENT', 'VILLA'], buildings: ['Maple', 'Sidra Villas', 'Park Heights', 'Golf Place', 'Club Villas'], views: ['Golf', 'Park', 'Burj Khalifa'], developer: 'Emaar', offPlanShare: 0.25, count: 7 },
  { community: 'Arabian Ranches', ppsf: 1500, yieldPct: 5.4, mix: ['VILLA', 'TOWNHOUSE', 'VILLA'], buildings: ['Saheel', 'Alvorada', 'Mirador', 'Palmera', 'Reem Community'], views: ['Golf', 'Park', 'Community'], developer: 'Emaar', offPlanShare: 0.1, count: 6 },
  { community: 'DAMAC Hills', ppsf: 1300, yieldPct: 6.2, mix: ['VILLA', 'TOWNHOUSE', 'APARTMENT'], buildings: ['Trump Estates', 'Golf Town', 'Carson', 'Rochester'], views: ['Golf', 'Park'], developer: 'DAMAC', offPlanShare: 0.3, count: 4 },
  { community: 'Dubai Creek Harbour', ppsf: 2000, yieldPct: 6.0, mix: ['APARTMENT', 'APARTMENT', 'PENTHOUSE'], buildings: ['Creek Rise', 'Harbour Gate', 'Address Harbour Point', 'Creek Edge'], views: ['Creek', 'Downtown skyline', 'Wildlife sanctuary'], developer: 'Emaar', offPlanShare: 0.5, count: 5 },
  { community: 'Dubai South', ppsf: 900, yieldPct: 7.6, mix: ['APARTMENT', 'TOWNHOUSE', 'STUDIO'], buildings: ['The Pulse', 'Emaar South', 'Expo Golf Villas', 'Azizi Venice'], views: ['Golf', 'Community', 'Lagoon'], developer: 'Emaar', offPlanShare: 0.6, count: 5 },
  { community: 'DIFC', ppsf: 2500, yieldPct: 6.0, mix: ['APARTMENT', 'PENTHOUSE', 'OFFICE'], buildings: ['Index Tower', 'Burj Daman', 'Central Park Towers'], views: ['City', 'Burj Khalifa'], developer: 'DIFC Properties', offPlanShare: 0.1, count: 3 },
  { community: 'Al Jaddaf', ppsf: 1500, yieldPct: 7.0, mix: ['APARTMENT', 'STUDIO'], buildings: ['Creek Views', 'Binghatti Creek', 'Riah Towers'], views: ['Creek', 'City'], developer: 'Azizi', offPlanShare: 0.4, count: 3 },
  { community: 'Saadiyat Island', ppsf: 2200, yieldPct: 5.6, mix: ['APARTMENT', 'VILLA', 'TOWNHOUSE'], buildings: ['Mamsha Al Saadiyat', 'Saadiyat Beach Villas', 'Jubail Island', 'Louvre Residences'], views: ['Sea', 'Beach', 'Cultural district'], developer: 'Aldar', offPlanShare: 0.3, count: 5 },
  { community: 'Yas Island', ppsf: 1400, yieldPct: 6.6, mix: ['TOWNHOUSE', 'APARTMENT', 'VILLA'], buildings: ['Yas Acres', 'Water\'s Edge', 'Ansam', 'Mayan'], views: ['Golf', 'Canal', 'Community'], developer: 'Aldar', offPlanShare: 0.3, count: 5 },
  { community: 'Al Reem Island', ppsf: 1300, yieldPct: 7.0, mix: ['APARTMENT', 'APARTMENT', 'STUDIO'], buildings: ['The Gate Towers', 'Sun Tower', 'Marina Square', 'Reem Hills'], views: ['Sea', 'Mangroves', 'City'], developer: 'Aldar', offPlanShare: 0.2, count: 5 },
  { community: 'Al Raha Beach', ppsf: 1350, yieldPct: 6.8, mix: ['APARTMENT', 'TOWNHOUSE'], buildings: ['Al Bandar', 'Al Zeina', 'Al Muneera'], views: ['Sea', 'Canal'], developer: 'Aldar', offPlanShare: 0.1, count: 3 },
  { community: 'Aljada', ppsf: 900, yieldPct: 7.4, mix: ['APARTMENT', 'TOWNHOUSE', 'STUDIO'], buildings: ['Nest', 'Misk', 'Sarab', 'East Boulevard'], views: ['Park', 'Community'], developer: 'Arada', offPlanShare: 0.5, count: 4 },
  { community: 'Al Majaz', ppsf: 750, yieldPct: 8.0, mix: ['APARTMENT', 'APARTMENT'], buildings: ['Majaz Waterfront Tower', 'Al Majaz 3'], views: ['Lagoon', 'City'], developer: 'Sharjah Holding', offPlanShare: 0.1, count: 2 },
  { community: 'Al Nuaimiya', ppsf: 500, yieldPct: 8.5, mix: ['APARTMENT', 'STUDIO'], buildings: ['City Towers', 'Al Nuaimiya Towers'], views: ['City'], developer: 'Ajman One', offPlanShare: 0.1, count: 2 },
  { community: 'Al Marjan Island', ppsf: 1600, yieldPct: 7.0, mix: ['APARTMENT', 'APARTMENT', 'VILLA'], buildings: ['Pacific', 'Bab Al Bahr', 'Nikki Beach Residences'], views: ['Sea', 'Beach'], developer: 'Marjan', offPlanShare: 0.5, count: 3 },
];
