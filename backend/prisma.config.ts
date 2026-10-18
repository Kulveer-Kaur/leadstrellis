import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Multi-file schema: every *.prisma file in this folder is merged.
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
