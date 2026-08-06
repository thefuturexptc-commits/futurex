import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const SITE_URL = (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://thefuturex.in').replace(/\/+$/, '');
const BRAND = process.env.MERCHANT_FEED_BRAND || 'TheFutureX';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'futurexweb-ae46b.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'futurexweb-ae46b',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'futurexweb-ae46b.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '721727785001',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:721727785001:web:f0ed7c4ed7555e018ef438',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || 'G-JD32TH0PJS',
};

const DISPLAY_PRO_LEGACY_SLUG = 'tfx-display-pro-smart-ring-premium-tracking-with-display-and-wireless-charging';
const DISPLAY_PRO_CANONICAL_SLUG = 'tfx-display-pro-smart-ring';

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getProductSlug = (product) => {
  const slug = slugify(product.slug || product.name || product.id);
  return slug === DISPLAY_PRO_LEGACY_SLUG ? DISPLAY_PRO_CANONICAL_SLUG : slug;
};

const hashString = (value = '') => {
  let hash = 5381;
  for (const char of String(value)) {
    hash = ((hash << 5) + hash + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
};

const getMerchantProductId = (product) => {
  const source = String(product.id || product.slug || product.name || 'item');
  const normalized = slugify(source) || 'item';
  if (normalized.length <= 50) return normalized;

  const suffix = hashString(source);
  const prefixLength = Math.max(1, 49 - suffix.length);
  const prefix = normalized.slice(0, prefixLength).replace(/-+$/, '') || 'item';
  return `${prefix}-${suffix}`;
};

const xmlEscape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const resolveUrl = (value = '') => {
  const url = String(value || '').trim();
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url.replace(/^\.?\//, '')}`;
};

const flattenValues = (value) => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  if (typeof value === 'object') return Object.values(value).flatMap(flattenValues);
  return [];
};

const collectImages = (product) => {
  const values = [
    product.image,
    product.imageLink,
    product.additionalImageLink,
    product.additionalImageLinks,
    product.additional_image_link,
    product.additional_image_links,
    product.images,
    product.imagesByColor,
    ...(Array.isArray(product.colors) ? product.colors.map((color) => color.images) : []),
    ...(Array.isArray(product.variants) ? product.variants.map((variant) => variant.images) : []),
  ];

  const seen = new Set();
  return flattenValues(values)
    .map(resolveUrl)
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
};

const getProductStock = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce((sum, variant) => {
      if (Array.isArray(variant.sizes) && variant.sizes.length > 0) {
        return sum + variant.sizes.reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0);
      }
      return sum + Number(variant.stock || 0);
    }, 0);
  }

  if (Array.isArray(product.colors) && product.colors.length > 0) {
    return product.colors.reduce((sum, color) => sum + Number(color.stock || 0) - Number(color.reservedStock || 0), 0);
  }

  return Number(product.stock || 0) - Number(product.reservedStock || 0);
};

const getPrice = (product) => {
  const price = Number(product.salePrice || product.price || product.mrp || 0);
  return Number.isFinite(price) && price > 0 ? price.toFixed(2) : '';
};

const getEmiAvailable = (product) => {
  if (typeof product.emiAvailable === 'boolean') return product.emiAvailable;
  if (typeof product.emi_available === 'boolean') return product.emi_available;
  return true;
};

const buildDescription = (product) => {
  const parts = [stripHtml(product.description || '')];

  if (Array.isArray(product.features) && product.features.length > 0) {
    parts.push(`Features: ${product.features.map(stripHtml).filter(Boolean).join('; ')}.`);
  }

  const specs = Object.entries(product.specs || {}).filter(([, value]) => String(value || '').trim());
  if (specs.length > 0) {
    parts.push(`Specifications: ${specs.map(([key, value]) => `${key}: ${value}`).join('; ')}.`);
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Merchant feed product fetch timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);

const getRemoteProducts = async () => {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await withTimeout(getDocs(collection(db, 'products')), 6500);

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((product) => typeof product?.name === 'string' && product.name.trim().length > 0);
};

const tag = (name, value) => {
  const text = String(value ?? '').trim();
  return text ? `    <${name}>${xmlEscape(text)}</${name}>` : '';
};

const buildProductItem = (product) => {
  const images = collectImages(product);
  const imageLink = images[0];
  const price = getPrice(product);
  const slug = getProductSlug(product);

  if (!product.id || !product.name || !slug || !imageLink || !price) return '';

  const description = buildDescription(product) || product.name;
  const availability = getProductStock(product) > 0 && product.inStock !== false ? 'in_stock' : 'out_of_stock';
  const additionalImages = images.slice(1, 11).map((image) => tag('g:additional_image_link', image));

  return [
    '  <item>',
    tag('g:id', getMerchantProductId(product)),
    tag('g:title', product.name),
    tag('g:description', description),
    tag('g:link', `${SITE_URL}/product/${slug}`),
    tag('g:image_link', imageLink),
    ...additionalImages,
    tag('g:availability', availability),
    tag('emiAvailable', getEmiAvailable(product) ? 'true' : 'false'),
    tag('g:price', `${price} INR`),
    tag('g:condition', 'new'),
    tag('g:brand', product.brand || BRAND),
    tag('g:product_type', product.category || ''),
    product.mrp && Number(product.mrp) > Number(price) ? tag('g:sale_price', `${price} INR`) : '',
    '  </item>',
  ]
    .filter(Boolean)
    .join('\n');
};

export async function generateMerchantFeedXML() {
  const products = await getRemoteProducts();
  const items = products.map(buildProductItem).filter(Boolean).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>TheFutureX Product Feed</title>
  <link>${xmlEscape(SITE_URL)}</link>
  <description>Live product feed for Google Merchant Center</description>
${items}
</channel>
</rss>`;
}
