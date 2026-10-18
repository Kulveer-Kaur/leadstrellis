/**
 * One-off: builds a large, non-repeating pool of listing photos and writes it to
 * prisma/seed/data/property-images.data.ts. The app never calls these services; re-seeding
 * reuses the saved list.
 *
 * Source: Openverse (openverse.org, no API key), limited to public-domain (CC0 / PDM)
 * photos from the StockSnap and rawpixel stock libraries, so no credit line is needed.
 * Off-topic results are dropped by title; anything that slips through and looks wrong goes
 * in prisma/seed/images/excluded-photos.ts.
 *
 *   npm run images:fetch            (add -- --review <file.json> to also dump a list for review)
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXCLUDED_PHOTOS } from '../images/excluded-photos.js';
import { IMAGE_CATEGORIES, type ImageCategory, type ImagePool } from '../images/image-plan.js';

/** How many photos each kind needs for ~184 listings, with some to spare. */
const TARGET: Record<ImageCategory, number> = { house: 70, tower: 120, living: 185, bedroom: 105, kitchen: 100, studio: 60, bathroom: 30, office: 25 };

const QUERIES: Record<ImageCategory, string[]> = {
  house: ['modern house', 'house exterior', 'modern villa', 'luxury home', 'suburban house', 'contemporary house', 'townhouse', 'villa pool'],
  tower: ['skyscraper', 'apartment building', 'high rise building', 'residential building', 'city skyline', 'dubai'],
  living: ['living room', 'modern living room', 'interior design living room', 'apartment living room', 'living room interior', 'sofa interior'],
  bedroom: ['bedroom', 'modern bedroom', 'hotel room bed', 'bedroom interior'],
  kitchen: ['kitchen', 'modern kitchen', 'kitchen interior', 'kitchen island'],
  studio: ['small apartment', 'loft interior', 'apartment interior', 'modern interior'],
  bathroom: ['bathroom', 'modern bathroom', 'bathroom interior'],
  office: ['office interior', 'modern office', 'workspace interior', 'office building'],
};

/** Listing photos show the space: no people, pets, artwork, cut-outs or commercial kitchens. */
const OFF_TOPIC =
  /\b(woman|women|man|men|person|people|girl|boy|child|children|kid|kids|baby|couple|family|dog|cat|puppy|portrait|hands?|restaurant|cafe|bar|urinals?|toilet sign|engraving|etching|painting|drawing|illustration|sketch|vintage|antique|poster|vector|icon|pattern|png|mockup|psd|template|collage|ruins?|church|cathedral|castle|museum|palace|abandoned|construction|night club|shop|store|supermarket)\b/i;

/** --scale 2.5 gathers extra candidates for review (see --review); the saved pool uses 1. */
const SCALE = Number(process.argv[process.argv.indexOf('--scale') + 1]) || 1;

interface OpenverseImage {
  id: string;
  title: string | null;
  url: string;
  width: number | null;
  height: number | null;
  filetype: string | null;
  source: string;
}

const CACHE = process.env.OPENVERSE_CACHE_DIR ?? join(tmpdir(), 'estatepilot-openverse');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One results page; cached on disk so re-runs (after editing the exclude list) don't hit the rate limit. */
async function search(query: string, page: number): Promise<OpenverseImage[]> {
  mkdirSync(CACHE, { recursive: true });
  const params = new URLSearchParams({ q: query, page: String(page), page_size: '20', source: 'rawpixel,stocksnap', license: 'cc0,pdm' });
  const file = join(CACHE, `${createHash('sha1').update(params.toString()).digest('hex')}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as OpenverseImage[];

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, { headers: { 'User-Agent': 'EstatePilot seed script' } });
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') ?? 60) * 1000;
      console.log(`  rate limited, waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    // Past the last page Openverse answers 400/404: treat as no more results.
    if (res.status === 400 || res.status === 404) return [];
    if (!res.ok) throw new Error(`Openverse ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const results = ((await res.json()) as { results: OpenverseImage[] }).results;
    writeFileSync(file, JSON.stringify(results));
    await sleep(1500); // stay well under the anonymous rate limit
    return results;
  }
  throw new Error('Openverse kept rate-limiting; try again in a few minutes.');
}

const usable = (p: OpenverseImage) =>
  !EXCLUDED_PHOTOS.has(p.id) &&
  (p.filetype ?? 'jpg').toLowerCase().startsWith('jp') &&
  (p.width ?? 0) >= 1000 &&
  (p.width ?? 0) > (p.height ?? 0) * 1.2 &&
  !OFF_TOPIC.test(p.title ?? '');

async function main() {
  const reviewIdx = process.argv.indexOf('--review');
  const reviewFile = reviewIdx > -1 ? process.argv[reviewIdx + 1] : undefined;
  const used = new Set<string>();
  const pool = Object.fromEntries(IMAGE_CATEGORIES.map((c) => [c, [] as string[]])) as ImagePool;
  const review: { category: ImageCategory; id: string; title: string | null; url: string }[] = [];

  // Smallest categories first, so a photo that fits several kinds lands where it is scarce.
  const order = [...IMAGE_CATEGORIES].sort((a, b) => TARGET[a] - TARGET[b]);
  for (const category of order) {
    const target = Math.round(TARGET[category] * (process.argv.includes('--scale') ? SCALE : 1));
    pages: for (let page = 1; page <= 12; page++) {
      for (const query of QUERIES[category]) {
        if (pool[category].length >= target) break pages;
        for (const p of await search(query, page)) {
          if (used.has(p.id) || used.has(p.url) || !usable(p)) continue;
          used.add(p.id).add(p.url);
          pool[category].push(p.url);
          review.push({ category, id: p.id, title: p.title, url: p.url });
          if (pool[category].length >= target) break pages;
        }
      }
    }
    console.log(`${category.padEnd(9)} ${pool[category].length}/${target}`);
  }

  if (reviewFile) writeFileSync(reviewFile, JSON.stringify(review, null, 1));
  const total = IMAGE_CATEGORIES.reduce((n, c) => n + pool[c].length, 0);
  const file = fileURLToPath(new URL('../data/property-images.data.ts', import.meta.url));
  const body = IMAGE_CATEGORIES.map((c) => `  ${c}: [\n${pool[c].map((u) => `    '${u}',`).join('\n')}\n  ],`).join('\n');
  writeFileSync(
    file,
    `import type { ImagePool } from '../images/image-plan.js';

/**
 * Listing photos by kind: ${total} different public-domain (CC0) photos from StockSnap and
 * rawpixel via Openverse; no credit needed. Each is used by one listing only.
 * Generated by \`npm run images:fetch\`; do not edit by hand.
 */
export const PROPERTY_IMAGES: ImagePool = {
${body}
};
`,
  );
  console.log(`\nSaved ${total} unique photos to prisma/seed/data/property-images.data.ts`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
