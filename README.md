# LeadsTrellis AI

> **Autonomous Real Estate CRM & AI-Powered Lead Conversion Engine**  
> Built specifically for UAE and international real estate brokerages to qualify leads in seconds, rank matching properties, automate multi-channel follow-ups, and conduct AI voice discovery calls.

---

## Overview

LeadsTrellis AI transforms real estate brokerage operations by uniting a reactive modern CRM with an autonomous AI orchestration engine. Inquiries arriving from property portals, WhatsApp, Instagram, or email are ingested instantly, enriched with qualification scores, matched to available inventory, and nurtured through multi-channel conversations without manual data entry.

---

## Core Application Workflow & Functionality

The platform operates as a continuous, closed-loop conversion pipeline:

```text
[ Omnichannel Lead Intake ]
         │
         ▼
[ 1. Intake Agent ] ──────────► Parses raw message, extracts budget, timeline, community
         │
         ▼
[ 2. Qualifier Agent ] ───────► Scores lead (0-100), flags HIGH/MED/LOW intent & financing
         │
         ▼
[ 3. Matchmaker Agent ] ──────► Matches criteria against active inventory & ranks top properties
         │
         ▼
[ 4. Outreach / Proposal ] ───► Auto-drafts or sends tailored WhatsApp/Email with property brochure
         │
         ▼
[ 5. Voice Call Agent ] ──────► Initiates conversational discovery call (Twilio / Simulator)
         │
         ▼
[ 6. Reply & Sentiment ] ─────► Ingests inbound replies, gauges sentiment, advances CRM stage
         │
         ▼
[ 7. Agent Closing ] ─────────► Dedicated agent conducts viewing, negotiates, and closes won
```

1. **Omnichannel Intake**: Inquiries arrive via portal webhooks, WhatsApp, email, or direct admin entry.
2. **AI Extraction & Understanding**: Raw text is parsed for property type, preferred locations, budget, and readiness.
3. **Automated Scoring**: The lead is assigned an initial score and urgency tier based on budget reality and timeline.
4. **Inventory Matching**: The matching engine evaluates current property inventory and generates AI compatibility scores.
5. **Contextual Outreach**: Personalized introductory messages and bespoke proposals are drafted and dispatched.
6. **Voice Qualification**: Voice calling agents handle initial phone screening, transcribing discussions into actionable CRM notes.
7. **Two-Way Reply Processing**: Inbound email replies are read in real time via IMAP IDLE, advancing pipeline stages.
8. **Scoped Agent Follow-Up**: Leads are assigned to dedicated sales agents who access them via their private agent dashboard.

---

## Autonomous Automation Agents

LeadsTrellis AI deploys specialized, cooperative AI agents powered by Groq LLMs (`openai/gpt-oss-20b` & `openai/gpt-oss-120b`) with deterministic rule-based fallbacks that ensure the entire platform functions reliably even without external API keys:

### 1. Intake Agent (`understand-lead`)
- Ingests messy, unstructured, and multilingual lead inquiries (English and Arabic) across WhatsApp, portals, and web forms.
- Automatically extracts structured parameters: budget, preferred communities, bedroom counts, purpose (Buy/Rent/Invest), and purchase timeline.
- Normalizes disparate currency and unit values into standard AED and square footage metrics for instant CRM processing.

### 2. Qualifier Agent (`scoring & intent`)
- Evaluates client readiness, timeline urgency, and budget compatibility against UAE market realities.
- Categorizes each lead into clear intent tiers (HIGH, MEDIUM, LOW) and computes a dynamic 0–100 lead quality score.
- Identifies financing feasibility (Cash vs. Mortgage vs. Undecided) to guide agents on the best sales angle.

### 3. Matchmaker Agent (`rerank-properties`)
- Continuously scans active property inventory against the buyer's explicit and implicit requirements.
- Calculates an AI fit score for each candidate property based on location proximity, price alignment, and lifestyle amenities.
- Produces a prioritized shortlist of top listings and explains why each property fits the lead's profile.

### 4. Outreach Agent (`compose-message`)
- Drafts tailored, high-converting opening messages and follow-up sequences across WhatsApp, Email, and SMS.
- Adapts tone and structure dynamically based on the lead's urgency level, source channel, and primary language.
- Integrates matched property highlights into the message body to maximize client response rates.

### 5. Proposal Agent (`compose-proposal`)
- Automatically generates comprehensive property investment briefs and branded client brochures.
- Formats property specs, floor areas, annual pricing or rental terms, and community amenities into clear proposals.
- Prepares ready-to-send email drafts with direct viewing call-to-actions.

### 6. Voice Call Agent (`call-agent-turn` & `summarize-call`)
- Executes interactive conversational discovery phone calls using Twilio Voice and ElevenLabs audio (or the in-app simulator).
- Converses naturally with buyers to clarify missing criteria, verify budget flexibility, and handle preliminary objections.
- Immediately transcribes the call, extracts key highlights, tags lead status, and posts an executive summary to the CRM timeline.

### 7. Sentiment & Reply Agent (`classify-reply` & `reply-sentiment`)
- Listens to incoming email replies (via IMAP IDLE) and messaging responses in real time.
- Gauges buyer sentiment (positive, neutral, hesitant, or objecting) and detects viewing requests or timeline changes.
- Automatically transitions the lead to the appropriate stage (e.g. `VIEWING`, `NEGOTIATION`, or `NURTURE`) and notifies the assigned agent.

---

## Human Team & Role-Based Access

- **Admin Account**: Bootstrapped securely via environment variables (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Admins maintain global oversight over leads, property inventory, automation rule toggles, and team invitations.
- **Sales Agents**: Invited by Admins via direct email activation links (`/setup-account?token=...`). Agents set their own password and are strictly scoped to leads assigned to them.
- **Lead Assignment**: Admins can assign leads to individual agents upon intake or reassign them dynamically from the lead detail view.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite | Fast, responsive client-rendered SPA |
| **Styling** | Tailwind CSS v4 | Curated modern real estate design with light/dark harmony |
| **State & Caching** | TanStack Query & Zustand | Server cache invalidation and lightweight UI state |
| **Backend** | Node.js 20, Express 5, TypeScript | Modular REST API and automation workers |
| **Database & ORM** | PostgreSQL 16 & Prisma 7 | Strongly typed relational schema with indexing |
| **AI Engine** | Groq (`openai/gpt-oss-20b` / `120b`) | Strict JSON schema extraction with rule-based fallback |
| **Voice & Speech** | Twilio Voice & ElevenLabs | Outbound qualification calls and voice synthesis |
| **Email & IMAP** | Nodemailer & ImapFlow | SMTP proposal delivery and automated IMAP reply reading |
| **Containerization** | Docker & Docker Compose | Multi-container architecture (Frontend, Backend, Postgres) |

---

## Running with Docker

The entire platform (Frontend, Backend, and Database) is orchestrated via Docker Compose.

### 1. Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) & Docker Compose plugin (or Docker Desktop on Windows/macOS).

### 2. Configure Environment
Copy the example environment file to `.env`:

```bash
cp .env.docker.example .env
```

Key variables to verify in `.env`:
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Credentials for your Admin account.
- `POSTGRES_PASSWORD`: Database password used to initialize the PostgreSQL container.
- `JWT_SECRET`: Random 64-character secret key (`openssl rand -hex 32`).
- `PUBLIC_APP_URL`: The URL used to access the application (default: `http://localhost:8080`).
- `GROQ_API_KEY`: *(Optional)* Groq API key. If omitted, the rule-based fallback handles all AI tasks.
- `SMTP_*` & `IMAP_*`: *(Optional)* Gmail or custom SMTP/IMAP credentials for live email delivery and reply sync.

### 3. Build & Start the Containers

```bash
docker compose up -d --build
```

Verify that all three services are running and healthy:

```bash
docker compose ps
```

Expected output:
- `estatepilotai-frontend-1` — Port `0.0.0.0:8080->80/tcp`
- `estatepilotai-backend-1` — Internal port `4000/tcp` (healthy)
- `estatepilotai-db-1` — Internal port `5432/tcp` (healthy)

Open your browser at **[http://localhost:8080](http://localhost:8080)**.

### 4. Seed Sample Catalog & Test Data (First Run Only)
To populate 180+ Dubai real estate listings and realistic sample leads:

```bash
docker compose exec backend npm run db:seed
```

> **Note**: `npm run db:seed` truncates existing tables to ensure deterministic test runs. Do not run it on a production database with live client data.

### 5. Common Docker Commands

| Action | Command |
|---|---|
| View real-time backend logs | `docker compose logs -f backend` |
| View real-time frontend logs | `docker compose logs -f frontend` |
| View database logs | `docker compose logs -f db` |
| Run database migrations | `docker compose exec backend npx prisma migrate deploy` |
| Open a shell inside backend | `docker compose exec backend sh` |
| Stop all containers | `docker compose stop` |
| Stop and remove containers | `docker compose down` |
| Rebuild after code changes | `docker compose up -d --build` |

### 6. Data Persistence
Data is preserved across container restarts through named Docker volumes:
- `db-data`: Stores all PostgreSQL tables, leads, users, and call logs.
- `uploads-data`: Stores all uploaded property photos and media assets.

---

## Local Development (Without Docker)

### Backend
```bash
cd backend
npm install
npm run db:deploy
npm run db:seed
npm run dev      # API runs on http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Vite dev server runs on http://localhost:5173
```

---

## Repository Structure

```text
├── backend/
│   ├── prisma/             # Prisma schema models, migrations, and seeders
│   ├── src/
│   │   ├── ai/             # AI prompts, task runners, and rule fallbacks
│   │   ├── automation/     # Background automation rules and triggers
│   │   ├── config/         # Zod-validated environment configurations
│   │   ├── integrations/   # Email (SMTP/IMAP), Twilio, and ElevenLabs
│   │   ├── jobs/           # Scheduled background tasks and queue runners
│   │   └── modules/        # Domain modules: auth, leads, properties, calls, media
│   └── uploads/            # Persistent directory for uploaded property photos
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI library (modals, forms, buttons)
│   │   ├── features/       # Feature slices: leads, properties, settings, dashboard
│   │   ├── pages/          # React Router page views
│   │   └── services/       # HTTP client and query keys
├── docker-compose.yml       # Production-ready container orchestration
└── DOCKER.md                # Detailed container architecture notes
```

---

## License
Proprietary & Confidential. All rights reserved by the development team.
