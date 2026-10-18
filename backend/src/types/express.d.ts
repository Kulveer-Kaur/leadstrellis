import type { Role } from '../generated/prisma/enums.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; email: string };
      /** Parsed + coerced query/params from the validate middleware. */
      validated?: { query?: unknown; params?: unknown };
    }
  }
}

export {};
