import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSitemapXML } from './utils/generateSitemap.js';

const readRequestBody = (req: import('http').IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    Object.assign(process.env, env);
    return {
      server: {
        port: 3001,
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'local-sitemap-route',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url) {
                next();
                return;
              }

              const url = req.url.split('?')[0];
              if (url !== '/sitemap.xml') {
                next();
                return;
              }

              try {
                const xml = await generateSitemapXML();
                res.setHeader('Content-Type', 'text/xml; charset=utf-8');
                res.statusCode = 200;
                res.end(xml);
              } catch (error) {
                server.ssrFixStacktrace(error as Error);
                next(error);
              }
            });
          },
        },
        {
          name: 'local-merchant-sync-route',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url) {
                next();
                return;
              }

              const url = req.url.split('?')[0];
              if (url !== '/api/merchant-sync') {
                next();
                return;
              }

              try {
                const body = await readRequestBody(req);
                const { default: handler } = await import('./api/merchant-sync.js');
                const response = res as typeof res & {
                  status: (code: number) => typeof res;
                  json: (payload: unknown) => void;
                };

                response.status = (code: number) => {
                  res.statusCode = code;
                  return response;
                };
                response.json = (payload: unknown) => {
                  if (!res.getHeader('Content-Type')) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  }
                  res.end(JSON.stringify(payload));
                };

                await handler({ ...req, body }, response);
              } catch (error) {
                server.ssrFixStacktrace(error as Error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  ok: false,
                  error: error instanceof Error ? error.message : 'Local Merchant sync failed.',
                }));
              }
            });
          },
        },
        {
          name: 'local-shiprocket-track-route',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url) {
                next();
                return;
              }

              const url = req.url.split('?')[0];
              if (url !== '/api/shiprocket-track') {
                next();
                return;
              }

              try {
                const body = await readRequestBody(req);
                const { default: handler } = await import('./api/shiprocket-track.js');
                const response = res as typeof res & {
                  status: (code: number) => typeof res;
                  json: (payload: unknown) => void;
                };

                response.status = (code: number) => {
                  res.statusCode = code;
                  return response;
                };
                response.json = (payload: unknown) => {
                  if (!res.getHeader('Content-Type')) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  }
                  res.end(JSON.stringify(payload));
                };

                await handler({ ...req, body }, response);
              } catch (error) {
                server.ssrFixStacktrace(error as Error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  ok: false,
                  error: error instanceof Error ? error.message : 'Local Shiprocket tracking failed.',
                }));
              }
            });
          },
        },
        {
          name: 'local-order-email-route',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url) {
                next();
                return;
              }

              const url = req.url.split('?')[0];
              if (url !== '/api/order-email') {
                next();
                return;
              }

              try {
                const body = await readRequestBody(req);
                const { default: handler } = await import('./api/order-email.js');
                const response = res as typeof res & {
                  status: (code: number) => typeof res;
                  json: (payload: unknown) => void;
                };

                response.status = (code: number) => {
                  res.statusCode = code;
                  return response;
                };
                response.json = (payload: unknown) => {
                  if (!res.getHeader('Content-Type')) {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  }
                  res.end(JSON.stringify(payload));
                };

                await handler({ ...req, body }, response);
              } catch (error) {
                server.ssrFixStacktrace(error as Error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({
                  ok: false,
                  error: error instanceof Error ? error.message : 'Local order email failed.',
                }));
              }
            });
          },
        },
      ],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              router: ['react-router-dom'],
              firebaseApp: ['firebase/app'],
              firebaseAuth: ['firebase/auth'],
              firebaseDb: ['firebase/firestore'],
              firebaseStorage: ['firebase/storage'],
              editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-underline'],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
