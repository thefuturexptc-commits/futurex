import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
