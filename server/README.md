# OpenArt proxy

Lets the Ad Creative Studio generate images with OpenArt. Browsers can't call
`mcp.openart.ai` directly (no CORS, OAuth-only), so this server does the MCP
calls. Each person signs in with their own OpenArt account; tokens are stored
encrypted in their browser, not on the server.

## Run on your PC (free, default)

The app's default proxy URL is `http://localhost:8080`, so the AI Studio copy of
the app works on any PC running this server:

1. Install Node.js 20+.
2. Put `index.mjs` in a folder with a `config.env`:
   ```
   SESSION_SECRET=<64 random hex chars>
   ALLOWED_ORIGINS=https://*.usercontent.goog,https://aistudio.google.com,http://localhost:3000
   PORT=8080
   HOST=127.0.0.1
   ```
3. Start it with `node --env-file=config.env index.mjs` and keep the window open.
   Chrome may ask to let the app access your local network: click Allow.

## Deploy to Cloud Run (optional, for teammates on other PCs)

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
