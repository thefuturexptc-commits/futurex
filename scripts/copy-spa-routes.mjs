import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { sitemapRoutes, spaFallbackRoutes } from '../utils/siteRoutes.js';
import { SITE_URL, mergeProductSeoRecords, resolveUrl, slugify } from '../utils/productSeoData.js';
import { generateSitemapXML } from '../utils/generateSitemap.js';

const distDir = 'dist';
const indexFile = join(distDir, 'index.html');
const DEFAULT_IMAGE = `${SITE_URL}/images/tfx-google-logo.webp`;
const BRAND_NAME = 'The Future X';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'futurexweb-ae46b.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'futurexweb-ae46b',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'futurexweb-ae46b.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '721727785001',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:721727785001:web:f0ed7c4ed7555e018ef438',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID || 'G-JD32TH0PJS',
};

if (!existsSync(indexFile)) {
  throw new Error('Missing dist/index.html. Run this script after vite build.');
}

const htmlEscape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const xmlEscape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const csvEscape = (value = '') => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const textOnly = (value = '') =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanFeedText = (value = '') =>
  textOnly(value)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

const truncate = (value = '', maxLength = 220) => {
  const text = textOnly(value);
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 100 ? lastSpace : maxLength).replace(/[,.;&:!?-]+$/, '').trim()}.`;
};

const formatPrice = (value = 0) => {
  const price = Number(value || 0);
  return price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Check price';
};

const getProductFamily = (product = {}) => {
  const text = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  if (text.includes('ring')) return 'ring';
  if (text.includes('band') || text.includes('bracelet')) return 'band';
  if (text.includes('fan') || text.includes('air')) return 'fan';
  if (text.includes('monitor') || text.includes('sleep') || text.includes('heart rate')) return 'monitoring';
  if (text.includes('glass')) return 'glasses';
  return 'product';
};

const categoryPages = {
  shop: {
    name: 'Shop All Products',
    title: 'Shop All Products | TheFutureX',
    description: 'Browse all TheFutureX smart wearables, smart rings, smart bands, smart fans, monitoring products, and connected lifestyle devices.',
    category: '',
  },
  'shop/all': {
    name: 'Shop All Products',
    title: 'Shop All Products | TheFutureX',
    description: 'Browse all TheFutureX smart wearables, smart rings, smart bands, smart fans, monitoring products, and connected lifestyle devices.',
    category: '',
  },
  'smart-bands': {
    name: 'Smart Bands',
    title: 'Smart Bands | TheFutureX',
    description: 'Explore TheFutureX smart bands for fitness tracking, sleep monitoring, SpO2, heart rate insights, app sync, and comfortable daily wear.',
    category: 'Smart Bands',
  },
  'smart-rings': {
    name: 'Smart Rings',
    title: 'Smart Rings | TheFutureX',
    description: 'Explore TheFutureX smart rings for compact activity tracking, sleep insights, heart rate trends, app connectivity, and everyday ring comfort.',
    category: 'Smart Rings',
  },
  'bladeless-fan': {
    name: 'Bladeless Fan',
    title: 'Bladeless Fan | TheFutureX',
    description: 'Shop TheFutureX bladeless fans built for smooth airflow, modern homes, quiet room comfort, remote control, and all-season living.',
    category: 'Smart Fans',
  },
  'smart-monitoring': {
    name: 'Smart Monitoring',
    title: 'Smart Monitoring | TheFutureX',
    description: 'Discover TheFutureX smart monitoring devices for fitness performance, sleep tracking, heart rate monitoring, recovery trends, and app-based reports.',
    category: 'Smart Monitoring',
  },
  'smart-glasses': {
    name: 'AI Smart Glasses',
    title: 'AI Smart Glasses | TheFutureX',
    description: 'Explore TheFutureX AI smart glasses for hands-free calling, music, voice assistant support, smart capture, and lightweight everyday eyewear.',
    category: 'Smart Glasses',
  },
};

const blogPages = Object.fromEntries(
  sitemapRoutes
    .filter((route) => route.path === '/blog' || route.path.startsWith('/blog/'))
    .map((route) => {
      const cleanRoute = route.path.replace(/^\//, '');
      return [
        cleanRoute,
        {
          title: route.path === '/blog' ? 'TheFutureX Blog' : route.label,
          description:
            route.path === '/blog'
              ? 'Explore TheFutureX smart wearable guides, smart band articles, smart ring articles, smart fan guides, heart rate monitoring posts, and sleep tracking resources.'
              : `Read ${route.label} on TheFutureX for practical smart wearable guidance, buying tips, and connected lifestyle insights.`,
        },
      ];
    })
);

const productFaqsByFamily = {
  band: [
    ['What does this smart band track?', 'TheFutureX smart bands can support activity tracking, sleep monitoring, heart rate trends, SpO2 on selected models, and app-based daily summaries.'],
    ['Does this smart band connect to a phone?', 'Yes. Compatible smart bands connect to supported smartphones through Bluetooth and companion app integration.'],
    ['Is this smart band suitable for daily wear?', 'Yes. The bands are designed for lightweight everyday wear during work, exercise, travel, and sleep tracking.'],
  ],
  ring: [
    ['What can this smart ring track?', 'TheFutureX smart rings are designed for compact activity tracking, sleep insights, heart rate trends, and app-connected wellness summaries depending on the model.'],
    ['How is a smart ring different from a smart band?', 'A smart ring gives discreet finger-worn tracking, while a smart band is worn on the wrist and can suit users who prefer wrist-based fitness tracking.'],
    ['Does this smart ring connect to an app?', 'Yes. Compatible TFX smart rings sync with supported smartphones for activity, sleep, and wellness insights.'],
  ],
  fan: [
    ['What is a bladeless fan?', 'A bladeless fan circulates air without exposed rotating blades, giving a modern design and smoother everyday airflow.'],
    ['Can this fan be used in a bedroom?', 'Yes. Selected TheFutureX bladeless fans are suitable for bedrooms, study rooms, living rooms, and home offices.'],
    ['Do bladeless fans require maintenance?', 'Bladeless fans can be easier to clean than traditional exposed-blade fans, though filters, vents, and surfaces should be maintained as recommended.'],
  ],
  monitoring: [
    ['What is a smart monitoring device?', 'Smart monitoring devices help track activity, sleep, training, or recovery metrics through sensors and compatible apps.'],
    ['Can it connect to a phone?', 'Compatible monitoring products connect to supported smartphones or apps to show fitness and wellness data.'],
    ['Who should use smart monitoring products?', 'They are useful for people who want focused fitness, sleep, recovery, or performance tracking.'],
  ],
  glasses: [
    ['What can smart glasses be used for?', 'Smart glasses can support hands-free calling, music, voice assistant access, and selected capture features depending on the model.'],
    ['Do smart glasses connect to a phone?', 'Compatible smart glasses connect with supported smartphones through Bluetooth for calling, media, and smart controls.'],
    ['Are smart glasses suitable for everyday use?', 'TheFutureX smart glasses are designed as modern connected eyewear for daily convenience, travel, and hands-free use.'],
  ],
  product: [
    ['What is this product used for?', 'This TheFutureX product is designed for everyday connected convenience, practical performance, and modern lifestyle use.'],
    ['Does it include brand support?', 'Eligible products include TheFutureX support, secure checkout, India shipping, and product assistance.'],
  ],
};

const getProductFaqs = (product) => productFaqsByFamily[getProductFamily(product)] || productFaqsByFamily.product;

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Product SEO fetch timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);

const fetchRemoteProducts = async () => {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDocs(collection(db, 'products')), 6500);
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((product) => typeof product?.name === 'string' && product.name.trim().length > 0);
  } catch (error) {
    console.warn('Using static product SEO fallbacks because Firebase product fetch failed:', error instanceof Error ? error.message : error);
    return [];
  }
};

const upsertTag = (html, pattern, tag) => {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
};

const injectStaticRoot = (html, bodyHtml) => {
  // Keep crawler-visible fallback markup in the initial HTML without flashing it
  // over the real app while React loads and replaces the root contents.
  const staticHtml = `<div id="root"><div class="seo-prerendered-page" style="display:none">${bodyHtml}</div></div>`;
  return html.replace(/<div id="root"><\/div>/i, staticHtml);
};

const buildProductCards = (products = [], limit = 8) =>
  products
    .slice(0, limit)
    .map((product) => {
      const url = getProductUrl(product);
      const image = resolveUrl(product.image || product.images?.[0] || DEFAULT_IMAGE);
      const description = truncate(product.description, 120);
      return `
        <article class="seo-product-card">
          <a href="${htmlEscape(url)}">
            <img src="${htmlEscape(image)}" alt="${htmlEscape(product.name)}" loading="lazy" decoding="async" />
            <h2>${htmlEscape(product.name)}</h2>
          </a>
          <p>${htmlEscape(description)}</p>
          <p><strong>${htmlEscape(formatPrice(product.price))}</strong></p>
        </article>`;
    })
    .join('');

const buildStaticStyles = () => `
  <style id="seo-prerendered-style">
    .seo-prerendered-page{font-family:Arial,sans-serif;background:#fff;color:#0f172a;line-height:1.6}
    .seo-prerendered-page a{color:#0369a1;text-decoration:none}
    .seo-prerendered-page main{max-width:1180px;margin:0 auto;padding:32px 20px}
    .seo-prerendered-page h1{font-size:clamp(2rem,5vw,4.5rem);line-height:1.05;margin:0 0 16px}
    .seo-prerendered-page h2{font-size:clamp(1.35rem,3vw,2.25rem);line-height:1.15;margin:24px 0 12px}
    .seo-prerendered-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-top:24px}
    .seo-product-card{border:1px solid #dbe7ea;border-radius:12px;padding:16px;background:#f8fbfb}
    .seo-product-card img{display:block;width:100%;height:180px;object-fit:contain;background:#fff;border-radius:8px}
    .seo-faq details{border:1px solid #dbe7ea;border-radius:10px;margin:10px 0;padding:14px;background:#fff}
  </style>`;

const buildHomeStaticHtml = (products = []) => {
  const featured = products.slice(0, 8);
  return `${buildStaticStyles()}
    <main>
      <h1>TheFutureX Smart Wearables and Connected Lifestyle Products</h1>
      <p>Shop smart bands, smart rings, smart fans, AI smart glasses, and monitoring wearables from TheFutureX. Compare everyday tracking, sleep insights, app connectivity, airflow comfort, and practical connected technology for modern living.</p>
      <section>
        <h2>Featured TheFutureX Products</h2>
        <div class="seo-prerendered-grid">${buildProductCards(featured)}</div>
      </section>
      <section>
        <h2>Shop by Category</h2>
        <ul>
          <li><a href="/smart-bands">Smart Bands</a></li>
          <li><a href="/smart-rings">Smart Rings</a></li>
          <li><a href="/bladeless-fan">Bladeless Fans</a></li>
          <li><a href="/smart-monitoring">Smart Monitoring</a></li>
          <li><a href="/smart-glasses">AI Smart Glasses</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </section>
      <section class="seo-faq">
        <h2>Frequently Asked Questions</h2>
        <details><summary>What is TheFutureX (TFX)?</summary><p>TheFutureX (TFX) is an Indian brand of smart wearables and connected lifestyle products, including smart bands, smart rings, bladeless fans, smart monitoring devices, and AI smart glasses.</p></details>
        <details><summary>Does TheFutureX ship across India?</summary><p>Yes, TheFutureX ships smart wearables and connected lifestyle products across India when ordered directly from thefuturex.in.</p></details>
        <details><summary>Does TheFutureX offer a warranty?</summary><p>Smart bands and smart rings include a 6-month limited warranty. Bladeless fans include a 1-year warranty on the motor and internal components. See the warranty policy for applicable terms and exclusions.</p></details>
        <details><summary>Does TheFutureX have a mobile app?</summary><p>TheFutureX Smartwear is available on Google Play and connects compatible smart bands and rings to display device insights.</p></details>
      </section>
    </main>`;
};

const buildCategoryStaticHtml = (page, products = []) => {
  const categoryProducts = page.category
    ? products.filter((product) => String(product.category || '').toLowerCase() === String(page.category || '').toLowerCase())
    : products;
  return `${buildStaticStyles()}
    <main>
      <h1>${htmlEscape(page.name)}</h1>
      <p>${htmlEscape(page.description)}</p>
      <section>
        <h2>${htmlEscape(page.name)} Products</h2>
        <div class="seo-prerendered-grid">${buildProductCards(categoryProducts.length ? categoryProducts : products.slice(0, 8))}</div>
      </section>
    </main>`;
};

const buildBlogIndexStaticHtml = () => {
  const posts = Object.entries(blogPages)
    .filter(([route]) => route !== 'blog')
    .map(([route, page]) => `<li><a href="/${htmlEscape(route)}">${htmlEscape(page.title)}</a></li>`)
    .join('');

  return `${buildStaticStyles()}
    <main>
      <h1>TheFutureX Blog</h1>
      <p>Explore TheFutureX smart wearable guides, smart band articles, smart ring articles, smart fan guides, heart rate monitoring posts, and sleep tracking resources.</p>
      <section>
        <h2>Latest Blog Guides</h2>
        <ul>${posts}</ul>
      </section>
    </main>`;
};

const buildBlogPostStaticHtml = (page) => `${buildStaticStyles()}
    <main>
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a> / <span>${htmlEscape(page.title)}</span></nav>
      <article>
        <h1>${htmlEscape(page.title)}</h1>
        <p>${htmlEscape(page.description)}</p>
        <p>Read this TheFutureX guide for practical smart wearable context, product education, and buying support.</p>
      </article>
    </main>`;

const buildProductStaticHtml = (product) => {
  const image = resolveUrl(product.image || product.images?.[0] || DEFAULT_IMAGE);
  const faqs = getProductFaqs(product);
  return `${buildStaticStyles()}
    <main>
      <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${htmlEscape(getCategoryUrl(product.category).replace(SITE_URL, ''))}">${htmlEscape(product.category || 'Products')}</a> / <span>${htmlEscape(product.name)}</span></nav>
      <article>
        <h1>${htmlEscape(product.name)}</h1>
        <img src="${htmlEscape(image)}" alt="${htmlEscape(product.name)}" loading="eager" decoding="async" />
        <p>${htmlEscape(product.description)}</p>
        <p><strong>${htmlEscape(formatPrice(product.price))}</strong></p>
        <p>Brand: <span>${htmlEscape(product.brand || BRAND_NAME)}</span></p>
        <p>Availability: ${product.availability?.includes('OutOfStock') ? 'Out of stock' : 'In stock'}</p>
      </article>
      <section>
        <h2>Product Highlights</h2>
        <ul>
          <li>Secure checkout and India shipping from TheFutureX.</li>
          <li>App-connected features and everyday support depending on product model.</li>
          <li>Designed for practical daily use, comfort, and modern connected living.</li>
        </ul>
      </section>
      <section class="seo-faq">
        <h2>Frequently Asked Questions</h2>
        ${faqs.map(([question, answer]) => `<details><summary>${htmlEscape(question)}</summary><p>${htmlEscape(answer)}</p></details>`).join('')}
      </section>
    </main>`;
};

const buildCollectionJsonLd = (route, page, products = []) => {
  const url = `${SITE_URL}/${route}`;
  const categoryProducts = products.filter((product) => String(product.category || '').toLowerCase() === String(page.category || '').toLowerCase()).slice(0, 12);
  return `    <script id="collection-page-json-ld" type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name: page.name,
    description: page.description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: categoryProducts.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: getProductUrl(product),
        name: product.name,
      })),
    },
  })}</script>`;
};

const buildHomepageJsonLd = () => `    <script id="homepage-json-ld" type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_NAME,
      alternateName: ['TFX', 'TheFutureX'],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/images/tfx-google-logo.webp`,
      sameAs: ['https://www.instagram.com/thefuturex.in/'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: BRAND_NAME,
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
})}</script>`;

const getCategoryUrl = (category = '') => {
  const normalized = String(category || '').trim().toLowerCase();
  if (normalized === 'smart bands') return `${SITE_URL}/smart-bands`;
  if (normalized === 'smart rings') return `${SITE_URL}/smart-rings`;
  if (normalized === 'smart fans') return `${SITE_URL}/bladeless-fan`;
  if (normalized === 'smart monitoring') return `${SITE_URL}/smart-monitoring`;
  if (normalized === 'smart glasses') return `${SITE_URL}/smart-glasses`;
  return `${SITE_URL}/shop/all`;
};

const getProductUrl = (product) => `${SITE_URL}/product/${product.canonicalSlug || product.slug}`;

const formatMerchantPrice = (value = 0) => {
  const price = Number(value || 0);
  return Number.isFinite(price) && price > 0 ? `${price.toFixed(2)} INR` : '';
};

const hashString = (value = '') => {
  let hash = 5381;
  for (const char of String(value)) {
    hash = ((hash << 5) + hash + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
};

const getMerchantProductId = (product) => {
  const source = String(product.id || product.canonicalSlug || product.slug || product.name || 'item');
  const normalized = slugify(source) || 'item';
  if (normalized.length <= 50) return normalized;

  const suffix = hashString(source);
  const prefixLength = Math.max(1, 49 - suffix.length);
  const prefix = normalized.slice(0, prefixLength).replace(/-+$/, '') || 'item';
  return `${prefix}-${suffix}`;
};

const getMerchantAvailability = (product) =>
  String(product.availability || '').toLowerCase().includes('outofstock') ? 'out_of_stock' : 'in_stock';

const buildMerchantDescription = (product) =>
  cleanFeedText(product.description || `Shop ${product.name} from TheFutureX.`).slice(0, 5000);

const getMerchantFeedProducts = (products = []) => {
  const seen = new Set();
  return products
    .filter((product) => product?.id && product?.name && product?.slug && product?.image && product?.price)
    .filter((product) => {
      const key = String(product.canonicalSlug || product.slug || product.id).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const buildMerchantXmlFeed = (products = []) => {
  const items = getMerchantFeedProducts(products)
    .map((product) => {
      const images = (product.images?.length ? product.images : [product.image]).map(resolveUrl).filter(Boolean);
      const additionalImages = images
        .slice(1, 11)
        .map((image) => `    <g:additional_image_link>${xmlEscape(image)}</g:additional_image_link>`)
        .join('\n');

      return `  <item>
    <g:id>${xmlEscape(getMerchantProductId(product))}</g:id>
    <g:title>${xmlEscape(product.name)}</g:title>
    <g:description>${xmlEscape(buildMerchantDescription(product))}</g:description>
    <g:link>${xmlEscape(getProductUrl(product))}</g:link>
    <g:image_link>${xmlEscape(resolveUrl(product.image))}</g:image_link>
${additionalImages ? `${additionalImages}\n` : ''}    <g:availability>${getMerchantAvailability(product)}</g:availability>
    <g:price>${xmlEscape(formatMerchantPrice(product.price))}</g:price>
    <g:condition>new</g:condition>
    <g:brand>${xmlEscape(product.brand || BRAND_NAME)}</g:brand>
    <g:product_type>${xmlEscape(product.category || 'Products')}</g:product_type>
  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>TheFutureX Product Feed</title>
  <link>${xmlEscape(SITE_URL)}</link>
  <description>Product feed for Google Merchant Center</description>
${items}
</channel>
</rss>
`;
};

const buildMerchantCsvFeed = (products = []) => {
  const headers = [
    'id',
    'title',
    'description',
    'link',
    'image_link',
    'availability',
    'price',
    'condition',
    'brand',
    'product_type',
  ];

  const rows = getMerchantFeedProducts(products).map((product) => ({
    id: getMerchantProductId(product),
    title: product.name,
    description: buildMerchantDescription(product),
    link: getProductUrl(product),
    image_link: resolveUrl(product.image),
    availability: getMerchantAvailability(product),
    price: formatMerchantPrice(product.price),
    condition: 'new',
    brand: product.brand || BRAND_NAME,
    product_type: product.category || 'Products',
  }));

  return `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')).join('\n')}\n`;
};

const buildJsonLd = (product) => {
  const productUrl = getProductUrl(product);
  const categoryUrl = getCategoryUrl(product.category);
  // Keep Offer.price numeric in the crawler-visible JSON-LD.
  const schemaPrice = Number(Math.max(1, Number(product.price || 1)).toFixed(2));
  const images = (product.images?.length ? product.images : [product.image || DEFAULT_IMAGE]).map(resolveUrl).filter(Boolean);
  const ratingValue = Math.max(1, Math.min(5, Number(product.ratingValue || 0))).toFixed(1);
  const reviewCount = Math.max(0, Number(product.reviewCount || 0));
  const faqItems = getProductFaqs(product);
  const additionalProperty = Object.entries(product.specs || {})
    .filter(([name, value]) => String(name).trim() && String(value).trim())
    .slice(0, 20)
    .map(([name, value]) => ({ '@type': 'PropertyValue', name: String(name), value: String(value) }));
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: product.description,
    image: images,
    brand: {
      '@type': 'Brand',
      name: product.brand || BRAND_NAME,
    },
    sku: product.id || product.slug,
    ...(product.model ? { mpn: product.model, model: product.model } : {}),
    category: product.category || 'Products',
    ...(additionalProperty.length ? { additionalProperty } : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: schemaPrice,
      availability: product.availability || 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
      },
    },
  };

  if (reviewCount > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return [
    {
      id: 'product-json-ld',
      data: productSchema,
    },
    {
      id: 'product-breadcrumb-json-ld',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category || 'Products',
            item: categoryUrl,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: productUrl,
          },
        ],
      },
    },
    {
      id: 'product-faq-json-ld',
      data: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      },
    },
  ]
    .map(({ id, data }) => `    <script id="${id}" type="application/ld+json">${JSON.stringify(data)}</script>`)
    .join('\n');
};

const injectPageSeo = (html, { title, description, url, image = DEFAULT_IMAGE, type = 'website', jsonLd = '' }) => {
  const imageUrl = resolveUrl(image);
  let next = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(title)}</title>`)
    .replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${htmlEscape(type)}" />`);

  next = upsertTag(next, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${htmlEscape(description)}" />`);
  next = upsertTag(next, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${htmlEscape(url)}" />`);
  next = upsertTag(next, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${htmlEscape(title)}" />`);
  next = upsertTag(next, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${htmlEscape(description)}" />`);
  next = upsertTag(next, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${htmlEscape(url)}" />`);
  next = upsertTag(next, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${htmlEscape(imageUrl)}" />`);
  next = upsertTag(next, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${htmlEscape(title)}" />`);
  next = upsertTag(next, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${htmlEscape(description)}" />`);
  next = upsertTag(next, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${htmlEscape(imageUrl)}" />`);

  return jsonLd ? next.replace('</head>', `${jsonLd}\n  </head>`) : next;
};

const injectProductSeo = (html, product) => {
  const title = product.seoTitle || `${product.name} - TheFutureX`;
  const description = product.description;
  const productUrl = getProductUrl(product);
  const imageUrl = resolveUrl(product.image || product.images?.[0] || DEFAULT_IMAGE);
  const jsonLd = buildJsonLd(product);

  let next = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(title)}</title>`)
    .replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, '<meta property="og:type" content="product" />');

  next = upsertTag(next, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${htmlEscape(description)}" />`);
  next = upsertTag(next, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${htmlEscape(productUrl)}" />`);
  next = upsertTag(next, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${htmlEscape(title)}" />`);
  next = upsertTag(next, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${htmlEscape(description)}" />`);
  next = upsertTag(next, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${htmlEscape(productUrl)}" />`);
  next = upsertTag(next, /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${htmlEscape(imageUrl)}" />`);
  next = upsertTag(next, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${htmlEscape(title)}" />`);
  next = upsertTag(next, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${htmlEscape(description)}" />`);
  next = upsertTag(next, /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${htmlEscape(imageUrl)}" />`);

  return next.replace('</head>', `${jsonLd}\n  </head>`);
};

const baseHtml = readFileSync(indexFile, 'utf8');
const remoteProducts = await fetchRemoteProducts();
const productRecords = mergeProductSeoRecords(remoteProducts);
const productRouteMap = new Map();

productRecords.forEach((product) => {
  const canonicalSlug = product.canonicalSlug || product.slug;
  productRouteMap.set(canonicalSlug, { ...product, slug: canonicalSlug });
  if (product.id) {
    // IDs are not public URLs. Publishing one static page per ID creates
    // duplicate canonical candidates, so only the canonical slug is built.
  }
});

const productRoutes = [...productRouteMap.keys()]
  .filter(Boolean)
  .map((slug) => `product/${slug}`);

const routes = new Set(['', ...spaFallbackRoutes, ...productRoutes]);

const getRouteHtml = (route, product) => {
  if (product) {
    return injectStaticRoot(injectProductSeo(baseHtml, product), buildProductStaticHtml(product));
  }

  if (route === '') {
    const title = 'TheFutureX | Future of Wearables';
    const description = 'Shop smart bands, smart rings, smart fans and monitoring wearables from TheFutureX.';
    const html = injectPageSeo(baseHtml, {
      title,
      description,
      url: `${SITE_URL}/`,
      image: DEFAULT_IMAGE,
      jsonLd: buildHomepageJsonLd(),
    });
    return injectStaticRoot(html, buildHomeStaticHtml(productRecords));
  }

  const categoryPage = categoryPages[route];
  if (categoryPage) {
    const html = injectPageSeo(baseHtml, {
      title: categoryPage.title,
      description: categoryPage.description,
      url: `${SITE_URL}/${route}`,
      image: DEFAULT_IMAGE,
      jsonLd: buildCollectionJsonLd(route, categoryPage, productRecords),
    });
    return injectStaticRoot(html, buildCategoryStaticHtml(categoryPage, productRecords));
  }

  const blogPage = blogPages[route];
  if (blogPage) {
    const title = route === 'blog' ? blogPage.title : `${blogPage.title} | TheFutureX Blog`;
    const html = injectPageSeo(baseHtml, {
      title,
      description: blogPage.description,
      url: `${SITE_URL}/${route}`,
      image: DEFAULT_IMAGE,
      type: 'article',
    });
    return injectStaticRoot(html, route === 'blog' ? buildBlogIndexStaticHtml() : buildBlogPostStaticHtml(blogPage));
  }

  return baseHtml;
};

for (const route of routes) {
  const cleanRoute = String(route || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const target = cleanRoute ? join(distDir, cleanRoute, 'index.html') : indexFile;
  const productSlug = cleanRoute.startsWith('product/') ? cleanRoute.slice('product/'.length) : '';
  const product = productSlug ? productRouteMap.get(productSlug) : null;
  const html = getRouteHtml(cleanRoute, product);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf8');
}

writeFileSync(join(distDir, 'sitemap.xml'), await generateSitemapXML(), 'utf8');
writeFileSync(join(distDir, 'product-feed.xml'), buildMerchantXmlFeed(productRecords), 'utf8');
writeFileSync(join(distDir, 'product-feed.csv'), buildMerchantCsvFeed(productRecords), 'utf8');
writeFileSync(
  join(distDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\nLLMS: ${SITE_URL}/llms.txt\n`,
  'utf8'
);

console.log(`Copied ${routes.size} SPA route fallbacks with ${productRouteMap.size} product SEO route(s).`);
process.exit(0);
