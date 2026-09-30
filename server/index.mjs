/**
 * OpenArt MCP proxy for DigiNerve Ad Creative Studio.
 *
 * Browsers cannot call https://mcp.openart.ai/mcp directly (no CORS, OAuth
 * required), so this tiny server does it on their behalf:
 *
 *   GET  /auth/start?origin=<app origin>   -> OpenArt OAuth login (popup)
 *   GET  /auth/callback                    -> exchanges code, postMessages an
 *                                             encrypted session blob to the app
 *   POST /api/generate                     -> openart_generate_image, returns historyId
 *   GET  /api/status/:historyId            -> openart_creation_get; when done,
 *                                             returns the image as a data URL
 *   GET  /healthz
 *
 * Stateless: the OAuth tokens live in an AES-GCM encrypted blob the app keeps
 * and sends back in the `X-OpenArt-Session` header, so Cloud Run can scale to
 * zero without losing logins. No npm dependencies (Node 20+).
 *
 * Env:
 *   SESSION_SECRET   required, long random string (encrypts session blobs)
 *   ALLOWED_ORIGINS  required, comma-separated app origins allowed to use this proxy.
 *                    A leading "*." in the host matches any subdomain, e.g.
 *                    https://*.usercontent.goog (every AI Studio account's app copy).
 *   PUBLIC_URL       optional, this server's public https URL (else derived from request)
 *   PORT             optional, default 8080
 *   HOST             optional; set 127.0.0.1 when running on a PC so only that PC can reach it
 */
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 8080);
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

// "https://*.example.com" matches https://a.example.com and https://a.b.example.com,
// never the bare domain or another scheme. Each user still signs in with their
// own OpenArt account, so a wildcard can't spend anyone else's credits.
const ORIGIN_MATCHERS = ALLOWED_ORIGINS.map((o) => {
  const m = o.match(/^(https?):\/\/\*\.(.+)$/);
  if (!m) return (origin) => origin === o;
  const scheme = `${m[1]}://`;
  const suffix = `.${m[2]}`;
  return (origin) =>
    origin.startsWith(scheme) &&
    origin.endsWith(suffix) &&
    /^[a-z0-9.-]+$/i.test(origin.slice(scheme.length, -suffix.length) || '!');
});
const isAllowedOrigin = (origin) => ORIGIN_MATCHERS.some((match) => match(origin));

const MCP_URL = 'https://mcp.openart.ai/mcp';
const OAUTH = {
  authorize: 'https://openart.ai/suite/api/auth/oauth/authorize',
  token: 'https://openart.ai/suite/api/auth/oauth/token',
  register: 'https://openart.ai/suite/api/auth/oauth/register',
};
const ALLOWED_MODELS = new Set(['nano-banana-2', 'nano-banana-2-lite', 'nano-banana-pro', 'gpt-image-2']);
const ALLOWED_RATIOS = new Set(['3:4', '9:16', '4:5', '1:1']);

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('SESSION_SECRET must be set (32+ chars).');
  process.exit(1);
}
if (ALLOWED_ORIGINS.length === 0) {
  console.error('ALLOWED_ORIGINS must list at least one app origin.');
  process.exit(1);
}

// ---------- encryption helpers (AES-256-GCM) ----------
const KEY = crypto.createHash('sha256').update(SESSION_SECRET).digest();

function seal(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

function unseal(blob) {
  const buf = Buffer.from(String(blob || ''), 'base64url');
  if (buf.length < 29) throw new Error('bad blob');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8'));
}

// ---------- OAuth ----------
function publicUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${req.headers.host}`;
}

// Dynamic client registration result, cached per instance. The client_id is
// also stored inside each session so refresh keeps working after restarts.
const clientCache = new Map();
async function getClientId(redirectUri) {
  if (clientCache.has(redirectUri)) return clientCache.get(redirectUri);
  const res = await fetch(OAUTH.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'DigiNerve Ad Creative Studio',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'full_access',
    }),
  });
  if (!res.ok) throw new Error(`OpenArt client registration failed: HTTP ${res.status} ${await res.text()}`);
  const { client_id } = await res.json();
  clientCache.set(redirectUri, client_id);
  return client_id;
}

async function tokenRequest(params) {
  const res = await fetch(OAUTH.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenArt token request failed: HTTP ${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function sessionFromTokens(tok, clientId, previous = {}) {
  return {
    clientId,
    access: tok.access_token,
    refresh: tok.refresh_token || previous.refresh,
    exp: Date.now() + (Number(tok.expires_in || 3600) - 60) * 1000,
  };
}

/** Returns a valid access token; refreshes if needed. `updated` is set when the blob changed. */
async function resolveSession(req) {
  let session;
  try {
    session = unseal(req.headers['x-openart-session']);
  } catch {
    const err = new Error('Not connected to OpenArt. Click "Connect OpenArt" first.');
    err.status = 401;
    throw err;
  }
  if (Date.now() < session.exp) return { access: session.access, updated: null };
  if (!session.refresh) {
    const err = new Error('OpenArt session expired. Reconnect OpenArt.');
    err.status = 401;
    throw err;
  }
  const tok = await tokenRequest({
    grant_type: 'refresh_token',
    refresh_token: session.refresh,
    client_id: session.clientId,
  });
  const next = sessionFromTokens(tok, session.clientId, session);
  return { access: next.access, updated: seal(next) };
}

// ---------- MCP (streamable HTTP, JSON-RPC 2.0) ----------
function parseMcpBody(text, id) {
  const candidates = [];
  try {
    candidates.push(JSON.parse(text));
  } catch {
    for (const line of text.split('\n')) {
      if (line.startsWith('data:')) {
        try {
          candidates.push(JSON.parse(line.slice(5).trim()));
        } catch {}
      }
    }
  }
  const msg = candidates.flat().find((m) => m && m.id === id) || candidates.flat().find((m) => m && (m.result || m.error));
  if (!msg) throw new Error(`Unexpected MCP response: ${text.slice(0, 200)}`);
  if (msg.error) throw new Error(`OpenArt MCP error ${msg.error.code}: ${msg.error.message}`);
  return msg.result;
}

async function mcpPost(access, sessionId, body) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${access}`,
    'MCP-Protocol-Version': '2025-06-18',
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(MCP_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  if (res.status === 401) {
    const err = new Error('OpenArt rejected the login. Reconnect OpenArt.');
    err.status = 401;
    throw err;
  }
  if (!res.ok && res.status !== 202) throw new Error(`OpenArt MCP HTTP ${res.status}: ${text.slice(0, 200)}`);
  return { text, sessionId: res.headers.get('mcp-session-id') || sessionId };
}

async function callTool(access, name, args) {
  const init = await mcpPost(access, null, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'diginerve-ad-studio-proxy', version: '1.0.0' },
    },
  });
  parseMcpBody(init.text, 1);
  await mcpPost(access, init.sessionId, { jsonrpc: '2.0', method: 'notifications/initialized' });
  const call = await mcpPost(access, init.sessionId, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: { name, arguments: args },
  });
  const result = parseMcpBody(call.text, 2);
  if (result?.isError) {
    const msg = (result.content || []).map((c) => c.text).filter(Boolean).join(' ');
    throw new Error(`OpenArt: ${msg || 'tool call failed'}`);
  }
  return toolPayload(result);
}

/** Merge structuredContent and any JSON found in text content into one object. */
function toolPayload(result) {
  const out = { ...(result?.structuredContent || {}) };
  const texts = [];
  for (const c of result?.content || []) {
    if (c.type === 'text' && c.text) {
      texts.push(c.text);
      try {
        Object.assign(out, JSON.parse(c.text));
      } catch {}
    }
  }
  out._text = texts.join('\n');
  return out;
}

function findKey(obj, key, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined;
  if (obj[key] !== undefined) return obj[key];
  for (const v of Object.values(obj)) {
    const found = findKey(v, key, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function findImageUrls(obj) {
  const urls = new Set();
  const walk = (v, depth) => {
    if (depth > 8 || v == null) return;
    if (typeof v === 'string') {
      for (const m of v.matchAll(/https:\/\/[^\s"'<>)]+/g)) {
        if (/\.(png|jpe?g|webp)(\?|$)/i.test(m[0]) || /\/(image|images|media|cdn)\//i.test(m[0])) urls.add(m[0]);
      }
    } else if (typeof v === 'object') {
      Object.values(v).forEach((x) => walk(x, depth + 1));
    }
  };
  walk(obj, 0);
  return [...urls];
}

async function toDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download generated image (HTTP ${res.status})`);
  const type = res.headers.get('content-type') || 'image/png';
  if (!type.startsWith('image/')) throw new Error(`Generated asset is not an image (${type})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString('base64')}`;
}

// ---------- HTTP plumbing ----------
function corsHeaders(req) {
  const origin = (req.headers.origin || '').replace(/\/$/, '');
  if (!isAllowedOrigin(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-OpenArt-Session',
    'Access-Control-Expose-Headers': 'X-OpenArt-Session-Update',
    'Access-Control-Max-Age': '600',
    // Chrome's local-network check: lets an https app page reach this proxy on localhost.
    'Access-Control-Allow-Private-Network': 'true',
    Vary: 'Origin',
  };
}

function send(res, status, body, headers = {}) {
  const isHtml = typeof body === 'string';
  res.writeHead(status, {
    'Content-Type': isHtml ? 'text/html; charset=utf-8' : 'application/json',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isHtml ? body : JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 200_000) throw new Error('Request too large');
  }
  return raw ? JSON.parse(raw) : {};
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') return send(res, cors['Access-Control-Allow-Origin'] ? 204 : 403, {}, cors);

  try {
    if (url.pathname === '/healthz') return send(res, 200, { ok: true });

    // 1. Start OAuth in a popup opened by the app.
    if (url.pathname === '/auth/start' && req.method === 'GET') {
      const origin = (url.searchParams.get('origin') || '').replace(/\/$/, '');
      if (!isAllowedOrigin(origin)) return send(res, 403, `<p>Origin not allowed: ${escapeHtml(origin)}</p>`);
      const redirectUri = `${publicUrl(req)}/auth/callback`;
      const clientId = await getClientId(redirectUri);
      const verifier = crypto.randomBytes(32).toString('base64url');
      const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
      const state = seal({ verifier, origin, clientId, redirectUri, ts: Date.now() });
      const auth = new URL(OAUTH.authorize);
      auth.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'full_access',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
        resource: MCP_URL,
      }).toString();
      res.writeHead(302, { Location: auth.toString(), 'Cache-Control': 'no-store' });
      return res.end();
    }

    // 2. OAuth callback: exchange code, hand encrypted session to the opener.
    if (url.pathname === '/auth/callback' && req.method === 'GET') {
      if (url.searchParams.get('error')) {
        return send(res, 400, `<p>OpenArt login failed: ${escapeHtml(url.searchParams.get('error'))}</p>`);
      }
      const state = unseal(url.searchParams.get('state'));
      if (Date.now() - state.ts > 10 * 60 * 1000) return send(res, 400, '<p>Login link expired. Try again.</p>');
      const tok = await tokenRequest({
        grant_type: 'authorization_code',
        code: url.searchParams.get('code') || '',
        redirect_uri: state.redirectUri,
        client_id: state.clientId,
        code_verifier: state.verifier,
      });
      const blob = seal(sessionFromTokens(tok, state.clientId));
      const payload = JSON.stringify({ type: 'openart-session', session: blob });
      return send(
        res,
        200,
        `<!doctype html><meta charset="utf-8"><title>OpenArt connected</title>
<p style="font-family:sans-serif">OpenArt connected. You can close this window.</p>
<script>
  if (window.opener) {
    window.opener.postMessage(${payload}, ${JSON.stringify(state.origin)});
    setTimeout(() => window.close(), 800);
  } else {
    // Login opened in the same tab (some embedded browsers): return to the app and pass
    // the encrypted session in the URL fragment, which never leaves the browser.
    location.replace(${JSON.stringify(state.origin)} + '/#openart-session=' + encodeURIComponent(${JSON.stringify(blob)}));
  }
</script>`
      );
    }

    // All /api routes require an allowed origin.
    if (url.pathname.startsWith('/api/') && !cors['Access-Control-Allow-Origin']) {
      return send(res, 403, { error: 'Origin not allowed' });
    }

    // 3. Submit a generation.
    if (url.pathname === '/api/generate' && req.method === 'POST') {
      const body = await readJson(req);
      const prompt = String(body.prompt || '').trim();
      const model = ALLOWED_MODELS.has(body.model) ? body.model : 'nano-banana-2';
      const aspectRatio = ALLOWED_RATIOS.has(body.aspectRatio) ? body.aspectRatio : '3:4';
      const imageCount = Math.min(Math.max(Number(body.imageCount) || 1, 1), 4);
      if (!prompt) return send(res, 400, { error: 'prompt is required' }, cors);

      const { access, updated } = await resolveSession(req);
      const out = await callTool(access, 'openart_generate_image', {
        model,
        mode: 'text2image',
        params: { prompt: prompt.slice(0, 12000), aspectRatio, imageCount, resolution: '1K' },
      });
      const historyId = findKey(out, 'historyId');
      if (!historyId) return send(res, 502, { error: `No historyId from OpenArt: ${out._text.slice(0, 200)}` }, cors);
      return send(res, 200, { historyId, status: findKey(out, 'status') || 'PENDING' }, {
        ...cors,
        ...(updated ? { 'X-OpenArt-Session-Update': updated } : {}),
      });
    }

    // 4. Poll a generation; return image(s) as data URLs when finished.
    const statusMatch = url.pathname.match(/^\/api\/status\/([\w-]+)$/);
    if (statusMatch && req.method === 'GET') {
      const { access, updated } = await resolveSession(req);
      const out = await callTool(access, 'openart_creation_get', { historyId: statusMatch[1] });
      const status = String(findKey(out, 'status') || '').toUpperCase() || 'UNKNOWN';
      const result = { status, pollAfterSeconds: Number(findKey(out, 'pollAfterSeconds')) || 4 };
      if (status === 'COMPLETED') {
        const urls = findImageUrls(out);
        if (urls.length === 0) {
          result.status = 'FAILED';
          result.error = `Completed but no image URL found: ${out._text.slice(0, 200)}`;
        } else {
          result.images = await Promise.all(urls.slice(0, 4).map(toDataUrl));
        }
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        result.error = String(findKey(out, 'error') || findKey(out, 'message') || out._text).slice(0, 300);
      }
      return send(res, 200, result, {
        ...cors,
        ...(updated ? { 'X-OpenArt-Session-Update': updated } : {}),
      });
    }

    return send(res, 404, { error: 'Not found' }, cors);
  } catch (err) {
    console.error(err);
    return send(res, err.status || 500, { error: err.message || 'Server error' }, cors);
  }
});

server.listen(PORT, process.env.HOST || undefined, () => console.log(`OpenArt proxy listening on :${PORT} (origins: ${ALLOWED_ORIGINS.join(', ')})`));
