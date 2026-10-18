# LeadsTrellis AI — backend

Node 20+ · Express 5 · TypeScript · Prisma 7 · PostgreSQL · Groq (free tier) · Twilio · ElevenLabs.

## Run it

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL (and GROQ_API_KEY)
npm install
npm run db:deploy             # create tables (or `npm run db:migrate` while changing the schema)
npm run db:seed               # dummy UAE data: 184 properties, 40 leads, 4 users
npm run dev                   # http://localhost:4000  (health: /health)
```

Create the database first if it does not exist: `createdb -U postgres estatepilot` (or `CREATE DATABASE estatepilot;` in psql).

**Logins (seed):** `admin@leadstrellis.com` / `Admin@123` · agents `sara@`, `khalid@`, `rohan@leadstrellis.com` / `Agent@123`.

| Command | What it does |
|---|---|
| `npm run dev` | API with hot reload |
| `npm run build` then `npm start` | Production build in `dist/` |
| `npm test` | Unit tests (extractor, scoring, matching, pipeline) |
| `npm run typecheck` | TypeScript check |
| `npm run db:seed` | Wipe and re-seed dummy data (safe to repeat) |
| `npm run db:studio` | Browse the database |

## What runs without any keys

Everything. With no `GROQ_API_KEY` the app uses **rule-based fallbacks** for every AI task, and calls are **simulated** (typed in the app). Add keys to switch each part to the real service.

| Feature | Without keys | With keys |
|---|---|---|
| Lead understanding, scoring, matching, messages, call agent | Rule-based fallback | Groq LLM (`GROQ_API_KEY`) |
| AI phone call | Simulated text call (`POST /calls/:id/turn`) | Real Twilio call |
| Call voice | — | ElevenLabs if `ELEVENLABS_API_KEY`, else Twilio `<Say>` |
| WhatsApp / Instagram / email | Mock providers (stored, shown in the thread) | WhatsApp via Twilio if `TWILIO_WHATSAPP_FROM` |
| SMS | Mock | Twilio |

## AI (Groq free tier)

Get a key at console.groq.com → API keys, then set `GROQ_API_KEY`. Models (change in `.env`):

- `GROQ_MODEL_FAST=openai/gpt-oss-20b`: lead understanding, message drafts, call summaries
- `GROQ_MODEL_SMART=openai/gpt-oss-120b`: property re-ranking, live call agent

Free tier limits are about 30 requests and 8K tokens per minute per model, and 200K tokens per day. To stay inside them, the pipeline runs jobs one at a time (`JOB_SPACING_MS`), retries on 429 using `retry-after`, and understands each lead plus its intent in **one** call. Every AI request is logged in `AiCallLog` (model, prompt version, tokens, latency).

Output is enforced with Groq strict JSON Schema, validated with Zod, retried once with the error, then falls back to rules. Prompts live in `src/ai/prompts/` (one per task, versioned).

## Real AI calls (Twilio + optional ElevenLabs)

1. Expose the API: `ngrok http 4000` → copy the https URL.
2. `.env`:
   ```
   PUBLIC_BASE_URL=https://xxxx.ngrok-free.app
   CALL_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_FROM_NUMBER=+1...            # your Twilio number
   TWILIO_TEST_TO_NUMBER=+9715...      # your own verified phone
   ELEVENLABS_API_KEY=...              # optional, nicer voice
   ```
3. Restart, then call a lead: `POST /api/v1/leads/:id/calls` (or let automations call high-intent leads).

**Safety:** outside `NODE_ENV=production`, every real call, SMS and WhatsApp goes to `TWILIO_TEST_TO_NUMBER`, never to the dummy lead's number. If that variable is empty, the app refuses real calls and simulates them. Twilio trial accounts can only call verified numbers anyway.

Call flow: Twilio calls `/webhooks/twilio/voice/:id/answer` → agent speaks → lead's speech → `/turn` → … → `/status` (completed) → AI summary → requirement + score update → automation (book viewing / follow-up / nurture). Webhooks are signature-checked, so `PUBLIC_BASE_URL` must match the tunnel URL exactly.

**WhatsApp (optional, Twilio sandbox):** set `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` and set the sandbox's "When a message comes in" URL to `{PUBLIC_BASE_URL}/api/v1/webhooks/twilio/whatsapp`.

## The AI pipeline

```
intake (WhatsApp / Instagram / email / web form / manual / simulator)
  → understand (AI: requirements + intent)  → score (5 rules + AI intent, 0–100)
  → match (SQL filters, relaxed step by step → rule prescore → AI re-rank top 10 → top 3 with reasons)
  → automations: send matches on best channel; high intent → AI call
  → call summary → interested: viewing + confirmation · not ready: follow-up task · not interested: nurture
  → scheduler: due follow-ups, monthly nurture, no-reply retry on the next channel (WhatsApp → email → call)
```

Status machine: `NEW → QUALIFIED → CONTACTED → VIEWING → CLOSED_WON / CLOSED_LOST`, plus `NURTURE` (`src/modules/pipeline/status-transitions.ts`).

## API (all under `/api/v1`, JSON `{ success, data, meta? }`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Intake | `POST /intake/web-form` (public), `POST /intake/whatsapp`, `/intake/instagram`, `/intake/email`, `/intake/simulate`, `GET /intake/samples` |
| Leads | `GET /leads?view=all\|hot\|action&status=&intent=&source=&search=`, `POST /leads` (manual), `GET/PATCH/DELETE /leads/:id`, `PATCH /leads/:id/requirement`, `PATCH /leads/:id/status`, `POST /leads/:id/reprocess`, `GET /leads/:id/timeline` |
| Matching | `GET /leads/:id/matches`, `POST /leads/:id/matches/refresh` |
| Messages | `GET/POST /leads/:id/messages` (omit `body` → AI writes it), `POST /leads/:id/draft-message`, `GET /conversations?search=` (inbox: one row per lead, newest first) |
| Calls | `POST /leads/:id/calls`, `GET /calls`, `GET /calls/:id`, `POST /calls/:id/turn` (simulated), `POST /calls/:id/end` |
| Properties | `GET /properties`, `GET /properties/:id`, `POST`/`PATCH` (admin) |
| Viewings / tasks | `GET/POST /viewings`, `PATCH /viewings/:id`, `GET /tasks`, `PATCH /tasks/:id` |
| Automations | `GET /automations`, `PATCH /automations/:id` (admin), `GET /automations/runs` |
| Dashboard | `GET /dashboard/summary?period=7d\|30d\|qtd&emirate=`, `/hotspots`, `/top-matches?segment=high\|all`, `/activity`, `/viewings`, `/automations`, `/forecast`, `/email-stats`, `/likely-to-win`, `/pilot-insights` |

Dashboard responses match the frontend's types in `frontend/src/features/dashboard/types.ts`. Socket.IO (same JWT in `auth.token`) pushes `lead:created`, `lead:updated`, `lead:status-changed`, `activity:created`, `message:sent`, `call:turn`, `call:ended`, `viewing:created`.

Example (simulated end-to-end):
```bash
TOKEN=$(curl -s -X POST localhost:4000/api/v1/auth/login -H 'content-type: application/json' \
  -d '{"email":"admin@leadstrellis.com","password":"Admin@123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')
curl -X POST localhost:4000/api/v1/intake/simulate -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"sampleId":"wa-marina-cash"}'
```

## Folder structure

```
backend/
├── prisma/
│   ├── schema/            one .prisma file per model group (lead, property, call, …)
│   ├── migrations/
│   └── seed/              data/ (UAE communities, leads, users) · factories/ · seeders/
├── src/
│   ├── server.ts · app.ts
│   ├── config/            env (Zod-validated), AI models per task, voice, CORS
│   ├── lib/               prisma, logger, socket, twilio clients
│   ├── modules/<feature>/ routes → controller → service (+ repository, validation, mapper)
│   │                      auth, leads, intake, properties, matching, communications, calls,
│   │                      viewings, tasks, pipeline, activity, automations, dashboard, users, webhooks, media
│   ├── ai/                llm/ (Groq provider) · prompts/ · schemas/ · tasks/ · fallbacks/ · guards/ · context/
│   ├── scoring/           engine + one file per rule
│   ├── automation/        engine, rules, channel selection, actions/
│   ├── jobs/              in-process queue, lead pipeline job, scheduler
│   ├── integrations/      messaging/ (mock, Twilio) · voice/ (Twilio) · tts/ (ElevenLabs)
│   ├── events/            typed event bus
│   ├── middlewares/ · utils/ · constants/ · types/
│   └── generated/         Prisma client (git-ignored, `npm run db:generate`)
└── tests/unit/
```

## Notes

- **pgvector** is not used yet (it is not installed on the local Postgres). Matching uses SQL filters plus a rule-based prescore plus an AI re-rank, which works well at this inventory size. Vector search can be added as a stage between them later.
- **Queue:** in-process with Postgres-backed state (`Lead.processingState`, `Task`), so no Redis is needed. Pending work is resumed on restart.
