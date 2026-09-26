import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-only: POST /__save-export?name=<file>.png with PNG bytes writes the
 * finished ad to local-assets/exports/. Loopback callers only, so nothing on
 * the LAN can write files through the dev server.
 */
function saveExports(): Plugin {
  const outDir = path.resolve(__dirname, 'local-assets', 'exports');
  return {
    name: 'save-exports',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-export', (req, res) => {
        const ip = req.socket.remoteAddress || '';
        if (req.method !== 'POST' || !/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip)) {
          res.statusCode = 403;
          return res.end('forbidden');
        }
        const name = new URL(req.url || '', 'http://x').searchParams.get('name') || '';
        if (!/^[\w.-]+\.png$/.test(name)) {
          res.statusCode = 400;
          return res.end('bad name');
        }
        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.join(outDir, name), Buffer.concat(chunks));
          res.end(JSON.stringify({ saved: path.join(outDir, name) }));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, '');
    return {
      root: __dirname,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), saveExports()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENART_PROXY_URL': JSON.stringify(env.OPENART_PROXY_URL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
