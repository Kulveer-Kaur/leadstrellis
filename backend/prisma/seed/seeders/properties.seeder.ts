import { prisma } from '../../../src/lib/prisma.js';
import { COMMUNITY_PROFILES } from '../data/community-profiles.data.js';
import { buildProperty } from '../factories/property.factory.js';
import { createRandom } from '../utils/random.js';

export async function seedProperties() {
  const rnd = createRandom(7);
  let ref = 1001;
  const data = COMMUNITY_PROFILES.flatMap((profile) => Array.from({ length: Math.ceil(profile.count * 1.6) }, (_, i) => buildProperty(profile, i, ref++, rnd)));
  await prisma.property.createMany({ data });
  return data.length;
}
