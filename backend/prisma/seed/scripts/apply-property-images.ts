/**
 * Gives every property already in the database its photos from the saved pool, in the
 * same order the seed uses, so no two listings share a photo. Safe to run again.
 *
 *   npm run images:apply
 */
import { prisma } from '../../../src/lib/prisma.js';
import { PROPERTY_IMAGES } from '../data/property-images.data.js';
import { createImageAllocator, imagesFor } from '../images/image-plan.js';

async function main() {
  const properties = await prisma.property.findMany({ select: { id: true, refCode: true, type: true } });
  const refOf = (code: string) => Number(code.replace(/\D/g, '')) || 0;
  properties.sort((a, b) => refOf(a.refCode) - refOf(b.refCode));

  const take = createImageAllocator(PROPERTY_IMAGES);
  const updates = properties.map((p) => ({ id: p.id, imageUrls: imagesFor(p.type, refOf(p.refCode), take) }));
  for (let i = 0; i < updates.length; i += 50) {
    await prisma.$transaction(updates.slice(i, i + 50).map((u) => prisma.property.update({ where: { id: u.id }, data: { imageUrls: u.imageUrls } })));
  }

  const all = updates.flatMap((u) => u.imageUrls);
  const unique = new Set(all).size;
  console.log(`Updated ${updates.length} properties: ${all.length} photos, ${unique} unique${unique < all.length ? ` (${all.length - unique} repeats: fetch a bigger pool)` : ''}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
