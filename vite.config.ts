import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      proxy: {
        '/api/piste': {
          target: 'https://oauth.piste.gouv.fr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/piste/, ''),
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Strip headers that identify this as a browser request
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              proxyReq.removeHeader('user-agent');
              proxyReq.removeHeader('sec-ch-ua');
              proxyReq.removeHeader('sec-ch-ua-mobile');
              proxyReq.removeHeader('sec-ch-ua-platform');

              // Add headers to mimic a server-to-server call
              proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.29.0'); // Pretend to be Postman or similar tool
              proxyReq.setHeader('Accept', '*/*');
            });
          }
        },
        '/api/legifrance': {
          target: 'https://api.piste.gouv.fr/dila/legifrance/lf-engine-app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/legifrance/, ''),
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              proxyReq.removeHeader('user-agent');
              proxyReq.removeHeader('sec-ch-ua');

              proxyReq.setHeader('User-Agent', 'PostmanRuntime/7.29.0');
              proxyReq.setHeader('Accept', '*/*');
            });
          }
        },
      }
    },
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      'import.meta.env.VITE_DAILY_API_KEY': JSON.stringify(env.VITE_DAILY_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      }
    }
  };
});
