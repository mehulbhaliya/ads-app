import { MasterRatio } from '../types';

export interface OpenArtConfig {
  endpoint: string;
  authToken?: string;
  model?: string;
}

export interface McpRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface McpRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

const STORAGE_KEY = 'diginerve_openart_config_v1';

export const DEFAULT_OPENART_ENDPOINT = 'https://mcp.openart.ai/mcp';

export function loadOpenArtConfig(): OpenArtConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load OpenArt config from localStorage', e);
  }
  return {
    endpoint: DEFAULT_OPENART_ENDPOINT,
    model: 'openart-sdxl',
  };
}

export function saveOpenArtConfig(cfg: OpenArtConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn('Failed to save OpenArt config', e);
  }
}

/**
 * Maps standard master ratio to OpenArt image dimensions
 */
export function getDimensionsForRatio(ratio: MasterRatio): { width: number; height: number; aspectRatioStr: string } {
  switch (ratio) {
    case '9:16':
      return { width: 720, height: 1280, aspectRatioStr: '9:16' };
    case '3:4':
    default:
      return { width: 864, height: 1152, aspectRatioStr: '3:4' };
  }
}

/**
 * Directly calls the OpenArt MCP Server endpoint via JSON-RPC 2.0 / MCP tool invocation protocol
 */
export async function generateImageViaOpenArtMcp(
  prompt: string,
  masterRatio: MasterRatio = '3:4',
  config: OpenArtConfig
): Promise<{ imageUrl: string; rawResponse?: any }> {
  const endpoint = config.endpoint.trim() || DEFAULT_OPENART_ENDPOINT;
  const dimensions = getDimensionsForRatio(masterRatio);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream, */*',
  };

  if (config.authToken?.trim()) {
    headers['Authorization'] = `Bearer ${config.authToken.trim()}`;
  }

  // 1. First probe tools/call for generate_image
  const payload: McpRpcRequest = {
    jsonrpc: '2.0',
    id: `req_${Date.now()}`,
    method: 'tools/call',
    params: {
      name: 'generate_image',
      arguments: {
        prompt: prompt,
        aspect_ratio: dimensions.aspectRatioStr,
        width: dimensions.width,
        height: dimensions.height,
        model: config.model || undefined,
        n: 1,
      },
    },
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (netErr: any) {
    throw new Error(
      `Network / CORS error reaching OpenArt MCP (${endpoint}): ${netErr.message || 'Failed to fetch'}. ` +
      `Browsers block cross-origin calls unless an OAuth token is provided or a local proxy / MCP client is used.`
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `OpenArt MCP Server returned HTTP ${res.status}: ${errText.slice(0, 300) || res.statusText}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  let json: any;

  if (contentType.includes('application/json')) {
    json = await res.json();
  } else {
    // If SSE or text
    const text = await res.text();
    try {
      json = JSON.parse(text);
    } catch {
      // Look for data: lines if SSE
      const match = text.match(/data:\s*(\{.*\})/);
      if (match) {
        json = JSON.parse(match[1]);
      } else {
        throw new Error(`Unexpected non-JSON response from MCP endpoint: ${text.slice(0, 200)}`);
      }
    }
  }

  if (json.error) {
    throw new Error(`MCP Error ${json.error.code}: ${json.error.message}`);
  }

  // Find image URL or base64 in MCP Tool response
  // MCP tool call results typically return { content: [{ type: 'image'|'text', data/text/url }] } or { image_url: '...' }
  const result = json.result || json;
  let imageUrl = '';

  if (Array.isArray(result?.content)) {
    for (const item of result.content) {
      if (item.type === 'image' && item.data) {
        imageUrl = `data:${item.mimeType || 'image/png'};base64,${item.data}`;
        break;
      }
      if (item.type === 'text' && typeof item.text === 'string') {
        // Text might contain URL or markdown image
        const urlMatch = item.text.match(/https?:\/\/[^\s")]+/);
        if (urlMatch) {
          imageUrl = urlMatch[0];
          break;
        }
      }
    }
  }

  if (!imageUrl && typeof result?.imageUrl === 'string') {
    imageUrl = result.imageUrl;
  }
  if (!imageUrl && typeof result?.url === 'string') {
    imageUrl = result.url;
  }
  if (!imageUrl && Array.isArray(result?.images) && result.images[0]) {
    imageUrl = typeof result.images[0] === 'string' ? result.images[0] : result.images[0].url;
  }

  if (!imageUrl) {
    throw new Error(
      `No image received from OpenArt MCP. Response received: ${JSON.stringify(result).slice(0, 300)}`
    );
  }

  return {
    imageUrl,
    rawResponse: result,
  };
}
