import type { CorsOptions } from 'cors';
import { env } from './env.js';

const allowList = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, cb) => cb(null, !origin || allowList.includes(origin)),
  credentials: true,
};

export const corsAllowList = allowList;
