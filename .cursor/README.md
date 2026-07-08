# Cursor instructions for frontend

This folder contains rules and context for the **Glider Pilot Logbook** frontend.

The frontend lives in a **separate repository**. When you create it, copy this entire `.cursor/` directory to the frontend repo root:

```bash
cp -R /path/to/GliderPilotLogbookCore/.cursor /path/to/your-frontend-repo/
```

## Backend (local, no Docker)

```bash
# In GliderPilotLogbookCore
source .venv/bin/activate
cp .env.example .env   # set USE_REDIS=false, GOOGLE_*, FERNET_KEY
cd backend && python manage.py migrate && python manage.py runserver
```

- API base: `http://localhost:8000/api`
- Swagger: `http://localhost:8000/api/docs/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

Export schema into the frontend repo (optional):

```bash
curl -s http://localhost:8000/api/schema/ -o openapi/schema.yaml
```

## Frontend env (Vue + Vite)

```env
VITE_API_URL=http://localhost:8000/api
```

Dev server: `http://localhost:5173` — add to backend `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL`.

## Full backend spec

See `GliderPilotLogbookCore/docs/backend-specification.md` (§10 auth, §12 API, §16 security).
