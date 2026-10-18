# Running LeadsTrellis AI with Docker

Three containers, started together by `docker-compose.yml`:

| Container | What it is | Reachable at |
|---|---|---|
| `frontend` | React app served by nginx; also forwards `/api` and `/socket.io` to the backend | `http://<server>:8080` |
| `backend` | Express API; applies database migrations on every start | inside Docker only |
| `db` | PostgreSQL 16; data kept in the `db-data` volume | inside Docker only |

Everything (Node, PostgreSQL, nginx) lives inside the containers, so nothing else is needed on the machine.

## 1. Install Docker (the only requirement)

| OS | Install |
|---|---|
| Linux server (Ubuntu/Debian/CentOS…) | Docker Engine + Compose plugin: `curl -fsSL https://get.docker.com \| sh`, then `sudo usermod -aG docker $USER` and log out/in |
| Windows 10/11 | Docker Desktop (uses WSL 2; the installer sets it up) |
| macOS (Intel or Apple Silicon) | Docker Desktop |

Check it works:

```bash
docker --version
docker compose version
```

## 2. Configure

From the project root:

```bash
cp .env.docker.example .env
```

Edit `.env`. These are the ones that matter:

- `POSTGRES_PASSWORD`: any password; the database is created with it.
- `JWT_SECRET`: a long random string (`openssl rand -hex 32`).
- `PUBLIC_APP_URL`: the exact URL people open, e.g. `http://203.0.113.10:8080` or `https://app.example.com`.
- `COOKIE_SECURE`: `true` only when served over `https://`.
- `GROQ_API_KEY`, `SMTP_*`: optional. Leave them blank to use the rule-based AI and logged emails.

## 3. Start

```bash
docker compose up -d --build
```

The first build takes a few minutes. Open `http://localhost:8080`, or `PUBLIC_APP_URL` on a server.

**First run only, to load the sample data** (184 properties, 40 leads, 4 users):

```bash
docker compose exec backend npm run db:seed
```

Login: `admin@leadstrellis.com` / `Admin@123` (or `lead.strellis@gmail.com` / `Admin@123`).
**Warning:** `db:seed` deletes all data before loading. Never run it on a live database.

## Everyday commands

| Task | Command |
|---|---|
| See status | `docker compose ps` |
| Follow logs | `docker compose logs -f backend` |
| Stop | `docker compose down` (data is kept) |
| Update after code changes | `docker compose up -d --build` |
| Wipe everything incl. database | `docker compose down -v` |
| Database backup | `docker compose exec db pg_dump -U estatepilot estatepilot > backup.sql` |

## Notes

- **Any CPU and OS:** the images use multi-arch bases (`node:22-bookworm-slim`, `nginx:1.27-alpine`, `postgres:16-alpine`) and are built on the machine that runs them, so they work the same on x86 and ARM servers (AWS Graviton, Apple Silicon).
- **Port clash:** if 8080 is taken, change `APP_PORT` in `.env`. Postgres and the API don't publish ports, so they can't clash with services already running on the host.
- **HTTPS:** put a reverse proxy (Caddy, Nginx, Traefik, or a cloud load balancer) in front of port 8080, then set `PUBLIC_APP_URL=https://…` and `COOKIE_SECURE=true`.
- **Production mode:** the backend runs with `NODE_ENV=production`, so the Twilio "test number only" safety is off. Real calls and SMS stay disabled while the Twilio keys are blank.
