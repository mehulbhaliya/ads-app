import { MasterRatio } from '../types';

/**
 * OpenArt image generation through the server-side proxy in /server.
 * The browser never talks to mcp.openart.ai directly (no CORS, OAuth only);
 * it talks to the proxy, which runs the MCP calls with the user's OpenArt login.
 */

export type OpenArtModel = 'nano-banana-2' | 'nano-banana-2-lite' | 'nano-banana-pro' | 'gpt-image-2';

export const OPENART_MODELS: { id: OpenArtModel; label: string; credits: number }[] = [
  { id: 'nano-banana-2', label: 'Nano Banana 2 (realistic people, recommended)', credits: 20 },
  { id: 'nano-banana-2-lite', label: 'Nano Banana 2 Lite (fast, cheapest)', credits: 15 },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro (highest quality)', credits: 40 },
  { id: 'gpt-image-2', label: 'GPT Image 2 (premium aesthetics)', credits: 40 },
];

export interface OpenArtConfig {
  proxyUrl: string;
  model: OpenArtModel;
  session?: string;
}

const STORAGE_KEY = 'diginerve_openart_config_v2';

function defaultProxyUrl(): string {
  let configured = '';
  try {
    configured = process.env.OPENART_PROXY_URL || '';
  } catch {
    configured = '';
  }
  if (configured) return configured;
  // Default: the proxy running on this PC (server/, started from the "Start OpenArt server"
  // desktop shortcut). Works from AI Studio too, since an https page may call http://localhost.
  return 'http://localhost:8080';
}

export function loadOpenArtConfig(): OpenArtConfig {
  const defaults: OpenArtConfig = { proxyUrl: defaultProxyUrl(), model: 'nano-banana-2' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed, proxyUrl: parsed.proxyUrl || defaults.proxyUrl };
    }
  } catch (e) {
    console.warn('Failed to load OpenArt config from localStorage', e);
  }
  return defaults;
}

export function saveOpenArtConfig(cfg: OpenArtConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn('Failed to save OpenArt config', e);
  }
}

const trimUrl = (u: string) => u.trim().replace(/\/$/, '');

/**
 * Opens the OpenArt login popup via the proxy and resolves with the encrypted
 * session blob the proxy posts back.
 */
export function connectOpenArt(proxyUrl: string): Promise<string> {
  const base = trimUrl(proxyUrl);
  if (!base) return Promise.reject(new Error('Set the OpenArt proxy URL first.'));
  let proxyOrigin: string;
  try {
    proxyOrigin = new URL(base).origin;
  } catch {
    return Promise.reject(new Error(`Invalid proxy URL: ${base}`));
  }

  return new Promise((resolve, reject) => {
    const popup = window.open(
      `${base}/auth/start?origin=${encodeURIComponent(window.location.origin)}`,
      'openart-login',
      'width=520,height=720'
    );
    if (!popup) {
      reject(new Error('Popup blocked. Allow popups for this app and try again.'));
      return;
    }

    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('OpenArt login window was closed before finishing.'));
      }
    }, 800);

    function onMessage(e: MessageEvent) {
      if (e.origin !== proxyOrigin || e.data?.type !== 'openart-session') return;
      cleanup();
      resolve(e.data.session);
    }

    function cleanup() {
      window.clearInterval(timer);
      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);
  });
}

async function proxyFetch(
  config: OpenArtConfig,
  path: string,
  init: RequestInit,
  onSessionUpdate: (session: string) => void
): Promise<any> {
  if (!config.session) throw new Error('Not connected to OpenArt. Click "Connect OpenArt" first.');
  let res: Response;
  try {
    res = await fetch(`${trimUrl(config.proxyUrl)}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), 'X-OpenArt-Session': config.session },
    });
  } catch (err: any) {
    const local = /localhost|127\.0\.0\.1/.test(config.proxyUrl);
    throw new Error(
      `Cannot reach the OpenArt proxy at ${config.proxyUrl}: ${err.message || 'network error'}` +
        (local ? '. Start it with the "Start OpenArt server" shortcut on your desktop, then try again.' : '')
    );
  }
  const updated = res.headers.get('X-OpenArt-Session-Update');
  if (updated) onSessionUpdate(updated);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(json.error || `OpenArt proxy HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/**
 * Submits a text-to-image job and polls until it finishes (max ~4 minutes).
 * Resolves with the image as a data URL so the canvas can export it.
 */
export async function generateImageViaOpenArt(
  prompt: string,
  masterRatio: MasterRatio,
  config: OpenArtConfig,
  onStatus: (msg: string) => void,
  onSessionUpdate: (session: string) => void
): Promise<string> {
  let cfg = config;
  const updateSession = (s: string) => {
    cfg = { ...cfg, session: s };
    onSessionUpdate(s);
  };

  onStatus('Submitting job to OpenArt...');
  const { historyId } = await proxyFetch(
    cfg,
    '/api/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio: masterRatio, model: cfg.model, imageCount: 1 }),
    },
    updateSession
  );

  const deadline = Date.now() + 4 * 60 * 1000;
  let waitSeconds = 4;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, waitSeconds * 1000));
    const status = await proxyFetch(cfg, `/api/status/${encodeURIComponent(historyId)}`, { method: 'GET' }, updateSession);
    if (status.status === 'COMPLETED' && status.images?.length) return status.images[0];
    if (status.status === 'FAILED' || status.status === 'CANCELLED') {
      throw new Error(`OpenArt generation ${status.status.toLowerCase()}: ${status.error || 'no details'}`);
    }
    onStatus(`OpenArt is rendering (${String(status.status).toLowerCase()})...`);
    waitSeconds = Math.min(Math.max(Number(status.pollAfterSeconds) || 4, 2), 10);
  }
  throw new Error(`OpenArt took too long. Job ${historyId} may still finish in your OpenArt account.`);
}
