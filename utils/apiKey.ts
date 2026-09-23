/**
 * Reads the Gemini key injected by Google AI Studio (process.env.API_KEY /
 * GEMINI_API_KEY) or by Vite's `define` locally. Wrapped in try/catch because
 * `process` does not exist in a plain browser runtime.
 */
export function getGeminiApiKey(): string {
  try {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  } catch {
    return '';
  }
}
