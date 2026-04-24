import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSitemapXML } from './utils/generateSitemap.js';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    Object.assign(process.env, env);
    return {
      server: {
        port: 3000,
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
