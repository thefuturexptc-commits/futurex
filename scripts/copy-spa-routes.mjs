import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const distDir = 'dist';
const indexFile = join(distDir, 'index.html');

const fallbackRoutes = [
  'delete-account',
  'shop',
  'shop/all',
];

if (!existsSync(indexFile)) {
  throw new Error('Missing dist/index.html. Run this script after vite build.');
}

for (const route of fallbackRoutes) {
  const target = join(distDir, route, 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(indexFile, target);
}
