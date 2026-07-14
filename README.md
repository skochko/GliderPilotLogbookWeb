# Glider Pilot Logbook — Frontend

Vue 3 + TypeScript + Vite SPA for the [Glider Pilot Logbook](https://github.com/skochko/GliderPilotLogbookSync) web application.

Google Sheets is the source of truth; this frontend talks to the Django REST API in **GliderPilotLogbookCore** using session cookies and CSRF.

## Prerequisites

- Node.js 24+
- Running backend at `http://localhost:8000` ([GliderPilotLogbookCore](../GliderPilotLogbookCore))

Backend dev config must allow the Vite origin:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173
```

## Setup

```bash
cp .env.example .env
# Set VITE_API_URL, VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY

npm install --legacy-peer-deps
npm run dev
```

App: `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run type-check` | Vue/TS type check |
| `npm test` | Vitest unit tests |
| `npm run generate:types` | Regenerate types from `openapi/schema.yaml` |

Export OpenAPI schema from a running backend:

```bash
curl -s http://localhost:8000/api/schema/ -o openapi/schema.yaml
npm run generate:types
```

## Architecture

- **Auth:** full-page redirect to `GET /api/auth/google`; callback via `?auth=success|error`
- **Logbook connect:** Google Drive Picker only (grants per-file `drive.file` access)
- **Data:** composables + typed API modules; no local long-term flight storage

See [`.cursor/rules/`](.cursor/rules/) for full project conventions.

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base (e.g. `http://localhost:8000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Same OAuth client ID as backend (for Picker) |
| `VITE_GOOGLE_API_KEY` | Google Cloud API key (`AIza…`) with Picker + Drive APIs enabled |

**Picker error "The API developer key is invalid"?** See [docs/google-picker-setup.md](docs/google-picker-setup.md).

Never commit secrets or `.env`.

## Docker (staging & production)

Frontend only: **nginx** serves the built Vue SPA. Backend runs separately ([GliderPilotLogbookCore](../GliderPilotLogbookCore)).

### Staging

```bash
cp .env.staging.example .env.staging
# Set VITE_API_URL to your staging API (e.g. https://api-staging.example.com/api)

docker compose -f docker-compose.yml -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

App: `http://localhost:8080` (or `WEB_HTTP_PORT` from env).

### Production

```bash
cp .env.prod.example .env.prod
# Set VITE_API_URL to your production API

docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Put TLS termination on an external reverse proxy in front of `web:80` if needed.

`VITE_*` variables are baked in at **build time** — rebuild the image when they change.
