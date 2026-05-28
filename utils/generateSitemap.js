import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const SITE_URL = 'https://thefuturex.in';

const toSlug = (name = '') =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'futurexweb-ae46b.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'futurexweb-ae46b',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'futurexweb-ae46b.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '721727785001',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:721727785001:web:f0ed7c4ed7555e018ef438',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || 'G-JD32TH0PJS',
};

const baseRoutes = [
  { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE_URL}/shop/all`, changefreq: 'daily', priority: '0.9' },
  { loc: `${SITE_URL}/smart-bands`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/smart-rings`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/bladeless-fan`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/smart-monitoring`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/new-arrivals`, changefreq: 'daily', priority: '0.8' },
  { loc: `${SITE_URL}/info/about-us`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/info/contact`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/info/shipping`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/info/returns-refund`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE_URL}/info/privacy`, changefreq: 'monthly', priority: '0.4' },
  { loc: `${SITE_URL}/info/terms`, changefreq: 'monthly', priority: '0.4' },
];

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const getRemoteProducts = async () => {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'products'));

  const products = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((product) => typeof product?.name === 'string' && product.name.trim().length > 0);

  console.log('TOTAL PRODUCTS:', products.length);
  return products;
};

export async function generateSitemapXML() {
  const nowIso = new Date().toISOString();
  const remoteProducts = await getRemoteProducts();

  const productMap = new Map();
  remoteProducts.forEach((product) => {
    const slug = toSlug(product.name);
    if (!slug) return;
    productMap.set(slug, {
      loc: `${SITE_URL}/product/${slug}`,
      lastmod: nowIso,
      changefreq: 'weekly',
      priority: '0.9',
    });
  });

  const urls = [...baseRoutes.map((entry) => ({ ...entry, lastmod: nowIso })), ...productMap.values()]
    .map(buildUrlEntry)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}
