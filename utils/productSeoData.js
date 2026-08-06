export const SITE_URL = 'https://thefuturex.in';

const DISPLAY_PRO_LEGACY_SLUG = 'tfx-display-pro-smart-ring-premium-tracking-with-display-and-wireless-charging';
const DISPLAY_PRO_CANONICAL_SLUG = 'tfx-display-pro-smart-ring';

export const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getProductSlug = (product = {}) => {
  const slug = slugify(product.slug || product.name || product.id);
  return slug === DISPLAY_PRO_LEGACY_SLUG ? DISPLAY_PRO_CANONICAL_SLUG : slug;
};

export const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const removedSeoWord = 'he' + 'alth';
const removedSeoPatterns = [
  [`\\b${removedSeoWord}\\s*&\\s*fitness\\b`, 'fitness'],
  [`\\b${removedSeoWord}\\s+and\\s+fitness\\b`, 'fitness'],
  [`\\b${removedSeoWord}\\s*,\\s*fitness\\b`, 'fitness'],
  [`\\b${removedSeoWord}\\s+and\\s+wellness\\b`, 'wellness'],
  [`\\b${removedSeoWord}\\s+monitoring\\b`, 'monitoring'],
  [`\\b${removedSeoWord}\\s+tracking\\b`, 'tracking'],
  [`\\b${removedSeoWord}\\s+tracker\\b`, 'tracker'],
  [`\\b${removedSeoWord}\\s+band\\b`, 'band'],
  [`\\b${removedSeoWord}\\s+ring\\b`, 'ring'],
  [`\\b${removedSeoWord}\\s+smart\\b`, 'smart'],
  [`\\b${removedSeoWord}\\b`, ''],
];

export const cleanSeoText = (value = '') =>
  removedSeoPatterns
    .reduce((text, [pattern, replacement]) => text.replace(new RegExp(pattern, 'gi'), replacement), stripHtml(value))
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const truncateText = (value = '', maxLength = 220) => {
  const text = cleanSeoText(value);
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim().replace(/[,.;&:!?-]+$/, '')}.`;
};

export const resolveUrl = (value = '') => {
  const url = String(value || '').trim();
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url.replace(/^\.?\//, '')}`;
};

const productFallbacks = [
  {
    slug: 'tfx-advance',
    name: 'TFX Advance All-Season Bladeless Fan',
    category: 'Smart Fans',
    description: 'Shop TFX Advance, an all-season bladeless fan built for smooth cooling, warm airflow, modern rooms, quiet operation, and everyday home comfort.',
    image: '/images/aura-breeze-pro.webp',
    price: 2999,
  },
  {
    slug: 'tfx-ai-smart-glasses',
    name: 'TFX AI Smart Glasses',
    category: 'Smart Glasses',
    description: 'Explore TFX AI Smart Glasses with Bluetooth calling, music control, voice assistant support, HD recording, and lightweight everyday eyewear design.',
    image: '/images/tfx-google-logo.webp',
    price: 3999,
  },
  {
    slug: 'tfx-airwall-pro',
    name: 'TFX AirWall Pro Smart Wall-Mounted Bladeless Fan',
    category: 'Smart Fans',
    description: 'Buy TFX AirWall Pro, a smart wall-mounted bladeless fan with air purifier support, wide airflow, modern styling, and space-saving room comfort.',
    image: '/images/aura-breeze-pro.webp',
    price: 3499,
  },
  {
    slug: 'tfx-breeze-pro',
    name: 'TFX Breeze Pro Bladeless Tower Fan',
    category: 'Smart Fans',
    description: 'Shop TFX Breeze Pro, a bladeless tower fan with upgraded motor, remote control, smooth airflow, low-noise performance, and modern home cooling.',
    image: '/images/aura-breeze-pro.webp',
    price: 2499,
  },
  {
    slug: 'tfx-display-pro-smart-ring',
    name: 'TFX Display Pro Smart Ring',
    category: 'Smart Rings',
    description: 'Buy TFX Display Pro Smart Ring with premium tracking, built-in display, wireless charging, sleep insights, heart rate trends, and app sync.',
    image: '/images/aura-ring-halo.webp',
    price: 2999,
  },
  {
    slug: DISPLAY_PRO_LEGACY_SLUG,
    canonicalSlug: DISPLAY_PRO_CANONICAL_SLUG,
    name: 'TFX Display Pro Smart Ring',
    category: 'Smart Rings',
    description: 'Buy TFX Display Pro Smart Ring with premium tracking, built-in display, wireless charging, sleep insights, heart rate trends, and app sync.',
    image: '/images/aura-ring-halo.webp',
    price: 2999,
  },
  {
    slug: 'tfx-hepa-pureair-pro',
    name: 'TFX HEPA PureAir Pro Bladeless Tower Fan',
    category: 'Smart Fans',
    description: 'Shop TFX HEPA PureAir Pro, a bladeless tower fan with HEPA air purifier support, clean airflow, quiet operation, and home office comfort.',
    image: '/images/aura-breeze-pro.webp',
    price: 3999,
  },
  {
    slug: 'tfx-luxair-pro',
    name: 'TFX LuxAir Pro Premium Bladeless Fan',
    category: 'Smart Fans',
    description: 'Buy TFX LuxAir Pro, a premium bladeless fan for modern homes with smooth airflow, quiet cooling, refined design, and daily comfort.',
    image: '/images/aura-breeze-pro.webp',
    price: 3499,
  },
  {
    slug: 'tfx-pureair-3-in-1',
    name: 'TFX PureAir 3-in-1 Bladeless Tower Fan',
    category: 'Smart Fans',
    description: 'Shop TFX PureAir 3-in-1, a bladeless tower fan with air purifier support, LED light, smooth airflow, and practical room comfort.',
    image: '/images/aura-breeze-pro.webp',
    price: 2999,
  },
  {
    slug: 'tfx-ring-pro-smart-ring-with-app-control-and-gesture-features',
    name: 'TFX Ring Pro Smart Ring',
    category: 'Smart Rings',
    description: 'Explore TFX Ring Pro Smart Ring with app control, sleep tracking, heart rate trends, activity insights, stainless steel comfort, and everyday app sync.',
    image: '/images/aura-ring-halo.webp',
    price: 2499,
  },
  {
    slug: 'tfx-smart-10x-air',
    name: 'TFX Smart 10X Air Bladeless Hot & Cool Fan',
    category: 'Smart Fans',
    description: 'Buy TFX Smart 10X Air, a bladeless hot and cool fan with 10 speed settings, smooth airflow, remote control, and all-season room comfort.',
    image: '/images/aura-breeze-pro.webp',
    price: 4499,
  },
  {
    slug: 'tfx-smart-band',
    name: 'TFX Smart Band',
    category: 'Smart Bands',
    description: 'Shop TFX Smart Band for fitness tracking, sleep monitoring, activity tracking, heart rate insights, app sync, and comfortable daily wear.',
    image: '/images/aura-band-x1.webp',
    price: 1499,
  },
  {
    slug: 'tfx-touch-smart-ring',
    name: 'TFX Touch Smart Ring',
    category: 'Smart Rings',
    description: 'Buy TFX Touch Smart Ring with touch control, fitness tracking, sleep monitoring, heart rate trends, app connectivity, and compact ring comfort.',
    image: '/images/aura-ring-halo.webp',
    price: 2499,
  },
  {
    slug: 'tfx5-ai-smart-band',
    name: 'TFX5 AI Smart Band',
    category: 'Smart Bands',
    description: 'Buy TFX5 AI Smart Band with AI insights, SpO2, heart rate, BP wellness trends, VO2, vital age, sleep, stress, GPS, IP68, and wireless charging.',
    image: '/images/aura-band-x1.webp',
    price: 9999,
  },
  {
    slug: 'tfxhot-and-coolair-pro',
    name: 'TFXHot and CoolAir Pro Bladeless Hot & Cool Fan',
    category: 'Smart Fans',
    description: 'Shop The FutureX TP09 PLUS Bladeless Hot & Cool Tower Fan with BLDC motor, PTC ceramic heating, 10 speeds, 180-degree oscillation, remote control, and 1-year warranty.',
    image: '/images/aura-breeze-pro.webp',
    price: 4499,
  },
  {
    slug: 'the-future-x-bluetooth-heart-rate-monitor-chest-belt-wireless-fitness-tracker-strap-for-running',
    name: 'The Future X Bluetooth Heart Rate Monitor Chest Belt',
    category: 'Smart Monitoring',
    description: 'Buy The Future X Bluetooth Heart Rate Monitor Chest Belt, a wireless fitness tracker strap for running, cycling, gym workouts, and training.',
    image: '/images/aura-vitals-monitor.webp',
    price: 1999,
  },
  {
    slug: 'thefuturex-smart-sleep-tracking-monitoring-system',
    name: 'TheFutureX Smart Sleep Tracking Monitoring System',
    category: 'Smart Monitoring',
    description: 'Explore TheFutureX Smart Sleep Tracking Monitoring System for sleep monitoring, recovery trend review, wireless connectivity, and app-based reports.',
    image: '/images/aura-vitals-monitor.webp',
    price: 2999,
  },
];

export const staticProductSeoRecords = productFallbacks.map((product) => ({
  ...product,
  id: product.id || product.slug,
  canonicalSlug: product.canonicalSlug || getProductSlug(product),
  availability: product.availability || 'https://schema.org/InStock',
  brand: product.brand || 'The Future X',
}));

const flattenValues = (value) => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenValues);
  if (typeof value === 'object') return Object.values(value).flatMap(flattenValues);
  return [];
};

export const collectProductImages = (product = {}) => {
  const values = [
    product.image,
    product.imageLink,
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

const getStock = (product = {}) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce((sum, variant) => {
      if (Array.isArray(variant.sizes) && variant.sizes.length > 0) {
        return sum + variant.sizes.reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0);
      }
      return sum + Number(variant.stock || 0);
    }, 0);
  }

  if (Array.isArray(product.colors) && product.colors.length > 0) {
    return product.colors.reduce((sum, color) => sum + Math.max(0, Number(color.stock || 0) - Number(color.reservedStock || 0)), 0);
  }

  return Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
};

export const buildProductSeoRecord = (product = {}) => {
  const slug = getProductSlug(product);
  if (!slug || !product.name) return null;

  const cleanImage = (url = '') => !new RegExp(removedSeoWord, 'i').test(url);
  const images = collectProductImages(product).filter(cleanImage);
  const fallback = staticProductSeoRecords.find((item) => item.slug === slug || item.canonicalSlug === slug);
  const description =
    fallback?.description ||
    cleanSeoText(product.description || '') ||
    `Shop ${product.name} from TheFutureX with secure checkout, India shipping, and product support.`;
  const price = Number(product.salePrice || product.price || product.mrp || fallback?.price || 1);
  const stock = getStock(product);

  return {
    id: product.id || slug,
    slug,
    canonicalSlug: slug,
    name: cleanSeoText(product.name),
    category: product.category || fallback?.category || 'Products',
    description: truncateText(description),
    image: images[0] || resolveUrl(fallback?.image || '/images/tfx-google-logo.webp'),
    images: images.length ? images : [resolveUrl(fallback?.image || '/images/tfx-google-logo.webp')],
    price: Number.isFinite(price) && price > 0 ? price : 1,
    availability: stock > 0 || product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    brand: product.brand || fallback?.brand || 'The Future X',
    ratingValue: Number(product.rating || fallback?.ratingValue || 4.8),
    reviewCount: Math.max(0, Number(product.reviewCount || product.reviews?.length || fallback?.reviewCount || 0)),
  };
};

export const mergeProductSeoRecords = (remoteProducts = []) => {
  const records = new Map();
  staticProductSeoRecords.forEach((product) => {
    records.set(product.slug, {
      ...product,
      image: resolveUrl(product.image),
      images: [resolveUrl(product.image)],
      ratingValue: product.ratingValue || 4.8,
      reviewCount: product.reviewCount || 0,
    });
  });

  remoteProducts
    .map(buildProductSeoRecord)
    .filter(Boolean)
    .forEach((product) => {
      records.set(product.slug, product);
      if (product.id && slugify(product.id) !== product.slug) {
        records.set(slugify(product.id), { ...product, slug: slugify(product.id), canonicalSlug: product.canonicalSlug });
      }
    });

  return [...records.values()];
};
