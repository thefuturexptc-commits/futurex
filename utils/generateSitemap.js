import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { SITE_URL, sitemapRoutes } from './siteRoutes.js';
import { getProductSlug } from './productSeoData.js';
import { getRemoteCatalogCategories, getRemoteProducts } from './generateMerchantFeed.js';
import { getCatalogCategoryPages } from './categorySeo.js';
import { getColorVariants } from './productOfferAvailability.js';
import { normalizeSeoKeywords } from './seoKeywords.js';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'futurexweb-ae46b.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'futurexweb-ae46b',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'futurexweb-ae46b.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '721727785001',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:721727785001:web:f0ed7c4ed7555e018ef438',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || 'G-JD32TH0PJS',
};

const isGlassesMention = (value = '') => /glass/i.test(String(value));

const baseRoutes = sitemapRoutes.filter((route) => !isGlassesMention(route.path) && !isGlassesMention(route.label)).map(({ path, changefreq, priority }) => ({
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

export async function getRemotePublishedBlogPosts() {
  const { publishedBlogPosts, isBlogPostPublic } = process.env.VERCEL === '1'
    ? await import(new URL('../dist/_catalog/server/publishedBlogPosts.mjs', import.meta.url).href)
    : await import('./publishedBlogPosts.ts');
  const localRoutes = publishedBlogPosts
    .filter((post) => isBlogPostPublic(post) && typeof post.slug === 'string' && post.slug.trim())
    .filter((post) => !isGlassesMention(`${post.slug} ${post.title || ''}`))
    .map((post) => ({
      path: post.canonicalPath || `/blog/${post.slug.trim()}`,
      label: post.title.trim(),
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: post.updatedAt || post.publishedAt,
      keywords: normalizeSeoKeywords(post.keywords),
    }));
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDocs(collection(db, 'blog_posts')), 6500);
    const remoteRoutes = snapshot.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .filter((post) => isBlogPostPublic(post) && typeof post.slug === 'string' && post.slug.trim() && typeof post.title === 'string' && post.title.trim())
      .filter((post) => !isGlassesMention(post.slug) && !isGlassesMention(post.title))
      .map((post) => ({
        path: `/blog/${post.slug.trim()}`,
        label: post.title.trim(),
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: post.updatedAt,
        keywords: normalizeSeoKeywords(post.keywords),
      }));
    const routesByPath = new Map(localRoutes.map((route) => [route.path, route]));
    remoteRoutes.forEach((route) => routesByPath.set(route.path, route));
    return [...routesByPath.values()];
  } catch (error) {
    console.warn('Skipping remote blog URLs in sitemap because the blog fetch failed:', error instanceof Error ? error.message : error);
    return localRoutes;
  }
}

export async function generateSitemapXML(products, categories) {
  const nowIso = new Date().toISOString();
  const [remoteProducts, remoteBlogRoutes, remoteCategories] = await Promise.all([
    products ?? getRemoteProducts(),
    getRemotePublishedBlogPosts(),
    categories ?? getRemoteCatalogCategories(),
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
    getColorVariants(product).forEach(({ slug: colorSlug }) => {
      const loc = `${SITE_URL}/product/${slug}/${colorSlug}`;
      productMap.set(`${slug}/${colorSlug}`, {
        loc,
        lastmod: nowIso,
        changefreq: 'weekly',
        priority: '0.8',
      });
    });
  });

  const baseRouteMap = new Map(baseRoutes.map((entry) => [entry.loc, { ...entry, lastmod: nowIso }]));
  Object.keys(getCatalogCategoryPages(remoteCategories)).forEach((path) => {
    const loc = SITE_URL + '/' + path;
    if (!baseRouteMap.has(loc)) baseRouteMap.set(loc, { loc, lastmod: nowIso, changefreq: 'weekly', priority: '0.8' });
  });
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
