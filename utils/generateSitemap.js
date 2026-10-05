import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { SITE_URL, sitemapRoutes } from './siteRoutes.js';
import { isCatalogProductPublished } from './catalogVisibility.js';
import { staticProductSeoRecords } from './productSeoData.js';

const toSlug = (name = '') =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const DISPLAY_PRO_LEGACY_SLUG = 'tfx-display-pro-smart-ring-premium-tracking-with-display-and-wireless-charging';
const DISPLAY_PRO_CANONICAL_SLUG = 'tfx-display-pro-smart-ring';

const getProductSlug = (product) => {
  const slug = toSlug(product.slug || product.name);
  return slug === DISPLAY_PRO_LEGACY_SLUG ? DISPLAY_PRO_CANONICAL_SLUG : slug;
};

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'futurexweb-ae46b.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'futurexweb-ae46b',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'futurexweb-ae46b.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '721727785001',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:721727785001:web:f0ed7c4ed7555e018ef438',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || 'G-JD32TH0PJS',
};

const baseRoutes = sitemapRoutes.map(({ path, changefreq, priority }) => ({
  loc: `${SITE_URL}${path === '/' ? '/' : path}`,
  changefreq,
  priority,
}));

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Sitemap product fetch timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);

const getRemoteProducts = async () => {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await withTimeout(getDocs(collection(db, 'products')), 6500);

  const products = snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }))
    .filter(isCatalogProductPublished)
    .filter((product) => typeof product?.name === 'string' && product.name.trim().length > 0);

  const sitemapProducts = products.length ? products : staticProductSeoRecords;
  console.log('TOTAL PRODUCTS:', sitemapProducts.length);
  return sitemapProducts;
};

export async function getRemotePublishedBlogPosts() {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDocs(collection(db, 'blog_posts')), 6500);
    return snapshot.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .filter((post) => post.status === 'published' && typeof post.slug === 'string' && post.slug.trim() && typeof post.title === 'string' && post.title.trim())
      .map((post) => ({
        path: `/blog/${post.slug.trim()}`,
        label: post.title.trim(),
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: post.updatedAt,
      }));
  } catch (error) {
    console.warn('Skipping remote blog URLs in sitemap because the blog fetch failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

export async function generateSitemapXML() {
  const nowIso = new Date().toISOString();
  const [remoteProducts, remoteBlogRoutes] = await Promise.all([
    getRemoteProducts().catch((error) => {
      console.warn('Using product fallbacks in sitemap because product fetch failed:', error instanceof Error ? error.message : error);
      return staticProductSeoRecords;
    }),
    getRemotePublishedBlogPosts(),
  ]);

  const productMap = new Map();

  remoteProducts.forEach((product) => {
    const slug = getProductSlug(product);
    if (!slug) return;
    productMap.set(slug, {
      loc: `${SITE_URL}/product/${slug}`,
      lastmod: nowIso,
      changefreq: 'weekly',
      priority: '0.9',
    });
  });

  const baseRouteMap = new Map(baseRoutes.map((entry) => [entry.loc, { ...entry, lastmod: nowIso }]));
  remoteBlogRoutes.forEach((route) => {
    const loc = `${SITE_URL}${route.path}`;
    baseRouteMap.set(loc, { loc, changefreq: route.changefreq, priority: route.priority, lastmod: route.lastmod || nowIso });
  });

  const urls = [...baseRouteMap.values(), ...productMap.values()]
    .map(buildUrlEntry)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}
