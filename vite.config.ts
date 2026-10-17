import path from 'path';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import sharp from 'sharp';
import { generateSitemapXML } from './utils/generateSitemap.js';

const optimizeImportedImages = () => ({
  name: 'optimize-imported-images',
  enforce: 'pre' as const,
  apply: 'build' as const,
  async load(id: string) {
    const filePath = id.split('?')[0];
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!normalizedPath.includes('/assets/images/') || !/\.(png|jpe?g|webp|avif)$/i.test(filePath)) {
      return null;
    }

    const input = await fs.readFile(filePath);
    const metadata = await sharp(input).metadata();
    const width = metadata.width ? Math.min(metadata.width, 1600) : 1600;
    const optimized = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();
    const outputName = `${path.parse(filePath).name}-${createHash('sha1').update(optimized).digest('hex').slice(0, 8)}.webp`;
    this.emitFile({
      type: 'asset',
      fileName: `assets/${outputName}`,
      source: optimized,
    });

    // Return the final emitted URL as an explicit root-relative path. This
    // keeps optimized images addressable from nested SPA routes as well.
    return `export default ${JSON.stringify(`/assets/${outputName}`)};`;
  },
});

const readRequestBody = (req: import('http').IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let body = '';
    const maxBodyLength = 4 * 1024 * 1024;
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBodyLength) {
        reject(new Error('Uploaded files are too large. Please upload smaller proof images under 900 KB each.'));
        req.destroy();
      }
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
        host: 'localhost',
      },
      plugins: [
        optimizeImportedImages(),
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
          name: 'local-merchant-feed-route',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url) {
                next();
                return;
              }

              const url = req.url.split('?')[0];
              if (url !== '/merchant-feed.xml') {
                next();
                return;
              }

              try {
                const { setMerchantFeedAuthChallenge, verifyMerchantFeedAuth } = await import('./utils/merchantFeedAuth.js');
                if (!verifyMerchantFeedAuth(req.headers.authorization || '')) {
                  setMerchantFeedAuthChallenge(res);
                  res.statusCode = 401;
                  res.end('Authentication required.');
                  return;
                }

                const { generateMerchantFeedXML } = await import('./utils/generateMerchantFeed.js');
                const xml = await generateMerchantFeedXML();
                res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                res.setHeader('Cache-Control', 'no-cache');
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
        {
          name: 'local-complaint-email-route',
          configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
              if (!req.url) {
                next();
                return;
              }

              const url = req.url.split('?')[0];
              if (url !== '/api/complaint-email') {
                next();
                return;
              }

              try {
                const body = await readRequestBody(req);
                const { default: handler } = await import('./api/complaint-email.js');
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
                  error: error instanceof Error ? error.message : 'Local complaint email failed.',
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
