# OpenArt proxy

Lets the Ad Creative Studio generate images with OpenArt. Browsers can't call
`mcp.openart.ai` directly (no CORS, OAuth-only), so this server does the MCP
calls. Each person signs in with their own OpenArt account; tokens are stored
encrypted in their browser, not on the server.

## Deploy to Cloud Run (one time)

```bash
gcloud run deploy openart-proxy --source server --region asia-south1 --allow-unauthenticated \
  --set-env-vars "SESSION_SECRET=<64 random chars>,ALLOWED_ORIGINS=<your app origin>"
```

- `ALLOWED_ORIGINS`: the exact origin(s) of the app, comma-separated, e.g.
  `https://ads-app-xxxx.a.run.app,http://localhost:3000`. Requests from any
  other site are refused, so strangers can't spend your credits.
- After deploy, paste the service URL into the app: **OpenArt → OpenArt Settings → Proxy URL**,
  or set `OPENART_PROXY_URL` in `.env.local` for local dev.

## Run locally

```bash
SESSION_SECRET=$(openssl rand -hex 32) ALLOWED_ORIGINS=http://localhost:3000 node server/index.mjs
```

Then set the proxy URL to `http://localhost:8080`.

## Endpoints

| Route | Purpose |
|---|---|
| `GET /auth/start?origin=` | Opens OpenArt login (popup) |
| `GET /auth/callback` | Finishes login, hands the encrypted session to the app |
| `POST /api/generate` | `{prompt, aspectRatio, model}` → `{historyId}` |
| `GET /api/status/:historyId` | Status; image as data URL when `COMPLETED` |
| `GET /healthz` | Health check |
