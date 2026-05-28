import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PRODUCT_CATALOG } from '../services/productCatalog.js';

const distDir = 'dist';
const indexFile = join(distDir, 'index.html');

const toSlug = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fallbackRoutes = [
  'delete-account',
  'cart',
  'checkout',
  'verify-phone',
  'payment',
  'order-success',
  'track-order',
  'login',
  'signup',
  'profile',
  'smart-bands',
  'smart-rings',
  'smart-fans',
  'bladeless-fan',
  'smart-monitoring',
  'new-arrivals',
  'shop',
  'shop/all',
  'info/about-us',
  'info/contact',
  'info/shipping',
  'info/returns-refund',
  'info/privacy',
  'info/terms',
  // Live/admin-created products are loaded from Firebase at runtime, so they
  // are not always present in PRODUCT_CATALOG during the static build.
  'product/thefuturex-smart-sleep-tracking-monitoring-system',
  ...PRODUCT_CATALOG.flatMap((product) => {
    const routes = [`product/${product.id}`];
    const slug = toSlug(product.name);
    if (slug) routes.push(`product/${slug}`);
    return routes;
  }),
];

if (!existsSync(indexFile)) {
  throw new Error('Missing dist/index.html. Run this script after vite build.');
}

for (const route of new Set(fallbackRoutes)) {
  const target = join(distDir, route, 'index.html');
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(indexFile, target);
}
