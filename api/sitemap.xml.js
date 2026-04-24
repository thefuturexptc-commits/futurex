import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { PRODUCT_CATALOG } from '../services/productCatalog.js';

const toProductSlug = (name = '') =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const getBaseUrls = () => [
  { loc: 'https://thefuturex.in/', changefreq: 'daily', priority: '1.0' },
  { loc: 'https://thefuturex.in/shop/all', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://thefuturex.in/smart-bands', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://thefuturex.in/smart-rings', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://thefuturex.in/smart-fans', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://thefuturex.in/smart-monitoring', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://thefuturex.in/new-arrivals', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://thefuturex.in/info/about-us', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://thefuturex.in/info/contact', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://thefuturex.in/info/shipping', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://thefuturex.in/info/returns-refund', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://thefuturex.in/info/privacy', changefreq: 'monthly', priority: '0.4' },
  { loc: 'https://thefuturex.in/info/terms', changefreq: 'monthly', priority: '0.4' },
];

const EXTRA_PRODUCT_SLUGS = [
  'the-future-x-tp02-3-in-1-bladeless-tower-fan-air-cooler-plasma-purifier-led-light-for-home-office-use',
  'the-future-x-tp-09-pro-heating-cooling-air-safe-for-kids-pets',
];

const getRemoteProducts = async () => {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    throw new Error('Missing Firebase environment variables for sitemap generation.');
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'products'));

  const products = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((product) => typeof product?.name === 'string' && product.name.trim().length > 0);

  console.log('TOTAL PRODUCTS:', products.length);

  return products;
};

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

export default async function handler(_req, res) {
  const nowIso = new Date().toISOString();

  try {
    const remoteProducts = await getRemoteProducts();

    const productMap = new Map();
    [...PRODUCT_CATALOG.map((product) => ({ name: product.name })), ...remoteProducts].forEach((product) => {
      const slug = toProductSlug(product.name);
      if (!slug) return;
      productMap.set(slug, {
        loc: `https://thefuturex.in/product/${slug}`,
        changefreq: 'weekly',
        priority: '0.9',
        lastmod: nowIso,
      });
    });

    EXTRA_PRODUCT_SLUGS.forEach((slug) => {
      productMap.set(slug, {
        loc: `https://thefuturex.in/product/${slug}`,
        changefreq: 'weekly',
        priority: '0.9',
        lastmod: nowIso,
      });
    });

    const urls = [...getBaseUrls().map((entry) => ({ ...entry, lastmod: nowIso })), ...productMap.values()]
      .map(buildUrlEntry)
      .join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).end(sitemap);
  } catch (error) {
    console.error('Error generating sitemap.xml', error);
    res.status(500).send(`Error generating sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
