# Google Drive Picker setup

Error **"The API developer key is invalid"** comes from Google Cloud configuration, not from application code.

Both credentials must belong to the **same Google Cloud project** as the backend OAuth client (`GOOGLE_CLIENT_ID`).

## 1. Enable APIs

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Library**, enable:

- **Google Picker API**
- **Google Drive API**
- **Google Sheets API** (backend reads/writes the connected logbook via per-file `drive.file` access)

Billing must be enabled on the project (free tier is enough).

## 2. OAuth client (Web)

**APIs & Services → Credentials → OAuth 2.0 Client IDs → Web client**

| Field | Values |
|-------|--------|
| **Authorized JavaScript origins** | `http://localhost:5173`, `http://127.0.0.1:5173`, `https://gliderlogbook.co.uk` |
| **Authorized redirect URIs** | Backend callback only, e.g. `https://api.gliderlogbook.co.uk/api/auth/google/callback` |

Copy **Client ID** → frontend `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID`.

## 3. API key (for Picker)

**Credentials → Create credentials → API key**

The key must start with **`AIza`**. It is **not** the OAuth Client ID.

### Application restrictions

Choose **HTTP referrers (web sites)** and add:

```
http://localhost:5173/*
http://127.0.0.1:5173/*
https://gliderlogbook.co.uk/*
https://www.gliderlogbook.co.uk/*
```

Add every origin where the SPA is served. Missing referrer = invalid key in the browser.

### API restrictions

Choose **Restrict key** and allow at least:

- Google Picker API
- Google Drive API

For debugging only, you can temporarily set **Don't restrict key** — if Picker works then, the problem is referrer or API restrictions.

Copy key → `VITE_GOOGLE_API_KEY`.

## 4. App ID (automatic)

Picker uses the **project number** from the Client ID (`631305470714-…` → App ID `631305470714`). The frontend derives this from `VITE_GOOGLE_CLIENT_ID` in `useGooglePicker.ts`.

Project number is also shown in **Google Cloud Console → Home → Project info**.

## 5. Frontend `.env`

```env
VITE_GOOGLE_CLIENT_ID=631305470714-xxxxx.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSy...
```

Restart Vite after changes (`npm run dev`).

## 6. Production (Docker)

Vite bakes env vars at **build time**. After setting `.env.prod`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Changing `.env.prod` without `--build` leaves the old (or empty) API key in the image.

## 7. Verify

1. Sign in to the app (session cookie + OAuth token).
2. Open **Connect logbook → Choose spreadsheet**.
3. Picker should list spreadsheets from your Google account.

If Picker fails, **URL connect** still works as fallback.

## Common mistakes

| Symptom | Cause |
|---------|--------|
| Invalid developer key | Client ID pasted as API key |
| Invalid developer key | API key from a different GCP project than OAuth client |
| Invalid developer key | Picker API or Drive API not enabled |
| Invalid developer key | HTTP referrer for current origin not allowed |
| Invalid developer key | Production image built without `VITE_GOOGLE_API_KEY` |
| Picker opens but empty / access denied | User not signed in with same Google account; use URL connect or re-auth |

## Checklist

- [ ] Same GCP project for OAuth client, API key, and enabled APIs
- [ ] Google Picker API enabled
- [ ] Google Drive API enabled
- [ ] API key = `AIza…`, not Client ID
- [ ] HTTP referrers include current site origin
- [ ] API key restricted to Picker + Drive (or unrestricted for test)
- [ ] OAuth JavaScript origins include current site origin
- [ ] Backend `GET /api/auth/google/access-token` works when logged in
- [ ] Docker rebuild after changing prod env vars
