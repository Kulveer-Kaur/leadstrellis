# EstatePilot API. Debian slim (glibc) base: Prisma's engines and every npm package work the same on
# amd64 and arm64, so the image builds natively on any Linux, macOS or Windows host running Docker.
FROM node:22-bookworm-slim

# openssl: needed by Prisma's migration engine. ca-certificates: outbound HTTPS (Groq, SMTP, IMAP).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first so this layer is cached until the lockfile changes.
# postinstall runs `prisma generate`, which only needs the schema (the URL is a placeholder).
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm ci

COPY tsconfig.json tsconfig.seed.json ./
COPY src ./src
RUN npm run build

# Dev deps stay installed on purpose: the Prisma CLI (migrations) and tsx (seed) run in this container.
ENV NODE_ENV=production
RUN mkdir -p /app/uploads

EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply pending migrations, then start. Inline (no .sh file) so Windows line endings can't break it.
CMD ["sh", "-c", "mkdir -p /app/uploads && npx prisma migrate deploy && exec node dist/server.js"]
