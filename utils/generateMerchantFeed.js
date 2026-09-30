import { getProductStock } from './productAvailability.js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { getCustomerFacingPrice } from './productSeoData.js';
import { isCatalogProductPublished } from './catalogVisibility.js';
import { getCatalogOffer, isTfxV5Band } from './catalogPricing.js';
import { mergeProductReviews } from './productSchema.js';
import { formatProductName } from './productName.js';
import { getFanTitle } from './fanListings.ts';

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

export const getMerchantProductId = (product) => {
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

const collectVideos = (product) => {
  const values = [
    product.videoUrl,
    product.videoByColor,
    ...(Array.isArray(product.variants) ? product.variants.map((variant) => variant?.videoUrl) : []),
  ];
  const seen = new Set();
  return flattenValues(values)
    .map(resolveUrl)
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => /(?:youtube\.com|youtu\.be)/i.test(url) || /\.(?:mpg|mp4|wmv|avi|mov|flv|mpeg|mpegps)(?:[?#]|$)/i.test(url))
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .slice(0, 10);
};

const getPrice = (product) => {
  const price = getCustomerFacingPrice(product);
  return Number.isFinite(price) && price > 0 ? price.toFixed(2) : '';
};

export const buildDescription = (product) => {
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

const getSpec = (product, names) => {
  const specs = product.specs || {};
  const key = Object.keys(specs).find((candidate) => names.some((name) => candidate.toLowerCase() === name));
  return key ? String(specs[key] || '').trim() : '';
};

const getColors = (product) => {
  const colors = [
    ...(Array.isArray(product.colors) ? product.colors.map((color) => typeof color === 'string' ? color : color?.name) : []),
    ...(Array.isArray(product.variants) ? product.variants.map((variant) => variant?.color || variant?.colorName) : []),
  ];
  return [...new Set(colors.map((color) => String(color || '').trim()).filter(Boolean))];
};

export const getMerchantTitle = (product) => {
  if (isTfxV5Band(product)) {
    return 'The FutureX AI Smart Band TFX5 - Heart Rate, SPO2 & Fitness Tracker';
  }

  const fanTitle = getFanTitle(product);
  if (fanTitle) return fanTitle;

  const title = formatProductName(product.name || product.id);
  const isHotAndCoolFan = /hot\s*(?:and|&)\s*cool|smart\s*10x\s*air/i.test(`${product.name || ''} ${product.description || ''}`);
  const model = getSpec(product, ['model', 'model number']);
  return isHotAndCoolFan && model && !title.toLowerCase().includes(model.toLowerCase())
    ? `${title} - Model ${model}`
    : title;
};

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Merchant feed product fetch timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);

export const getRemoteProducts = async ({ includeReviews = false } = {}) => {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await withTimeout(getDocs(collection(db, 'products')), 6500);

  const products = snapshot.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }))
    .filter(isCatalogProductPublished)
    .filter((product) => typeof product?.name === 'string' && product.name.trim().length > 0);
  if (!includeReviews) return products;
  try {
    const reviews = await withTimeout(getDocs(collection(db, 'product_reviews')), 6500);
    const rows = reviews.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    return products.map((product) => ({ ...product, reviews: mergeProductReviews(product.reviews, rows.filter((review) => review.productId === product.id)) }));
  } catch (error) {
    console.warn('Public review fetch failed; using saved product reviews.');
    return products;
  }
};

const tag = (name, value) => {
  const text = String(value ?? '').trim();
  return text ? `    <${name}>${xmlEscape(text)}</${name}>` : '';
};

export const buildProductItem = (product) => {
  if (!isCatalogProductPublished(product)) return '';
  const images = collectImages(product);
  const imageLink = images[0];
  const price = getPrice(product);
  const slug = getProductSlug(product);

  if (!product.id || !product.name || !slug || !imageLink || !price) return '';

  const description = buildDescription(product) || product.name;
  const availability = getProductStock(product) > 0 && product.inStock !== false ? 'in_stock' : 'out_of_stock';
  const additionalImages = images.slice(1, 11).map((image) => tag('g:additional_image_link', image));
  const offer = getCatalogOffer(product);

  return [
    '  <item>',
    tag('g:id', getMerchantProductId(product)),
    tag('g:title', getMerchantTitle(product)),
    tag('g:description', description),
    tag('g:link', `${SITE_URL}/product/${slug}`),
    tag('g:image_link', imageLink),
    ...additionalImages,
    ...collectVideos(product).map((video) => tag('g:video_link', video)),
    tag('g:availability', availability),
    tag('g:price', `${(offer.onSale ? offer.regularPrice : offer.currentPrice).toFixed(2)} INR`),
    offer.onSale ? tag('g:sale_price', `${price} INR`) : '',
    tag('g:condition', 'new'),
    tag('g:brand', product.brand || BRAND),
    tag('g:product_type', product.category || ''),
    tag('g:google_product_category', product.googleProductCategory || product.google_product_category || ''),
    ...getColors(product).map((color) => tag('g:color', color)),
    tag('g:material', getSpec(product, ['material'])),
    tag('g:size', getSpec(product, ['size'])),
    tag('g:gender', getSpec(product, ['gender'])),
    tag('g:age_group', getSpec(product, ['age group', 'age_group'])),
    tag('g:gtin', product.gtin || product.barcode || ''),
    tag('g:mpn', product.mpn || product.manufacturerPartNumber || ''),
    tag('g:identifier_exists', product.gtin || product.barcode || product.mpn || product.manufacturerPartNumber ? 'yes' : 'no'),
    '  </item>',
  ]
    .filter(Boolean)
    .join('\n');
};

export async function generateMerchantFeedXML(products = undefined) {
  products = products || await getRemoteProducts();
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

export async function generateMerchantFeedCSV(products = undefined) {
  products = products || await getRemoteProducts();
  const headers = ['id', 'title', 'description', 'link', 'image_link', 'additional_image_link', 'video_link', 'availability', 'price', 'sale_price', 'condition', 'brand', 'product_type', 'google_product_category', 'color', 'material', 'size', 'gender', 'age_group', 'gtin', 'mpn', 'identifier_exists'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = products.filter((product) => buildProductItem(product)).map((product) => [
    getMerchantProductId(product), getMerchantTitle(product), buildDescription(product) || product.name,
    `${SITE_URL}/product/${getProductSlug(product)}`, collectImages(product)[0], collectImages(product).slice(1, 11).join(','),
    collectVideos(product).join(','),
    getProductStock(product) > 0 && product.inStock !== false ? 'in_stock' : 'out_of_stock',
    `${getCatalogOffer(product).regularPrice.toFixed(2)} INR`,
    getCatalogOffer(product).onSale ? `${getPrice(product)} INR` : '', 'new', product.brand || BRAND, product.category || '',
    product.googleProductCategory || product.google_product_category || '', getColors(product).join(', '),
    getSpec(product, ['material']), getSpec(product, ['size']), getSpec(product, ['gender']), getSpec(product, ['age group', 'age_group']),
    product.gtin || product.barcode || '', product.mpn || product.manufacturerPartNumber || '',
    product.gtin || product.barcode || product.mpn || product.manufacturerPartNumber ? 'yes' : 'no',
  ].map(escape).join(','));
  return [headers.join(','), ...rows].join('\n') + '\n';
}
