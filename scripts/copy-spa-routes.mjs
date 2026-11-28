import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { infoRoutes, sitemapRoutes, spaFallbackRoutes } from '../utils/siteRoutes.js';
import { fanGuideRoutes } from '../utils/fanGuideRoutes.js';
import { SITE_URL, mergeProductSeoRecords, resolveUrl } from '../utils/productSeoData.js';
import { generateSitemapXML, getRemotePublishedBlogPosts } from '../utils/generateSitemap.js';
import { generateMerchantFeedXML, generateMerchantFeedCSV, getRemoteCatalogCategories, getRemoteProducts } from '../utils/generateMerchantFeed.js';
import { homepageFaqs, homepageFaqSchema } from '../utils/homepageFaqs.js';
import { renderProductPage } from '../utils/renderProductPage.js';
import { getColorVariants } from '../utils/productOfferAvailability.js';
import { getProductSlug } from '../utils/productSeoData.js';
import { tfx5BlogPosts } from '../utils/tfx5BlogPosts.js';
import { getBlogProductImage } from '../utils/blogProductImage.ts';
import { publishedBlogPosts, isBlogPostPublic } from '../utils/publishedBlogPosts.ts';
import { normalizeSeoKeywords } from '../utils/seoKeywords.js';

const distDir = 'dist';
const indexFile = join(distDir, 'index.html');
const DEFAULT_IMAGE = `${SITE_URL}/images/tfx-google-logo.webp`;
const BRAND_NAME = 'The Future X';

if (!existsSync(indexFile)) {
  throw new Error('Missing dist/index.html. Run this script after vite build.');
}

// Package the shared TypeScript modules as JavaScript for the Vercel functions.
if (process.env.VERCEL === '1') {
  await build({
    entryPoints: ['utils/renderProductPage.js', 'utils/renderCategoryPage.js', 'utils/publishedBlogPosts.ts'],
    outdir: join(distDir, '_catalog/server'),
    outExtension: { '.js': '.mjs' },
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'node',
    target: 'node24',
  });
}

const htmlEscape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const textOnly = (value = '') =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
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

import { getCatalogCategoryPages } from '../utils/categorySeo.js';
import { renderCategoryPage } from '../utils/renderCategoryPage.js';

const blogSeoOverrides = {
  ...Object.fromEntries(tfx5BlogPosts.map((post) => [`blog/${post.slug}`, { title: post.metaTitle, description: post.metaDescription, post }])),
  'blog/tfx-smart-band-emi-guide': {
    title: 'Buy a TFX Smart Band on EMI — Step-by-Step Guide | TheFutureX',
    description: 'Want a TFX smart band without paying the full amount upfront? Here\'s exactly how EMI works at checkout, what you need, and what it actually costs per month.',
  },
};

const remotePublishedBlogPosts = await getRemotePublishedBlogPosts();
const staticPublishedBlogPosts = publishedBlogPosts
  .filter((post) => isBlogPostPublic(post))
  .map((post) => ({
    path: post.canonicalPath || `/blog/${post.slug}`,
    label: post.title,
    changefreq: 'monthly',
    priority: '0.7',
    post,
  }));
const remoteBlogRoutes = remotePublishedBlogPosts.map((post) => ({
  path: post.path,
  label: post.label,
  changefreq: post.changefreq,
  priority: post.priority,
  keywords: post.keywords,
}));
const unlistedJournalPaths = new Set(fanGuideRoutes.filter(({ listedInJournal }) => !listedInJournal).map(({ path }) => path));

const blogPages = Object.fromEntries(
  [...sitemapRoutes, ...staticPublishedBlogPosts, ...remoteBlogRoutes]
    .filter((route) => route.path === '/blog' || /^\/blogs?\//.test(route.path))
    .map((route) => {
      const cleanRoute = route.path.replace(/^\//, '');
      return [
        cleanRoute,
        {
          title: route.path === '/blog' ? 'TheFutureX Blog' : route.label,
          keywords: route.keywords || route.post?.keywords,
          description:
            route.path === '/blog'
              ? 'Explore TheFutureX smart wearable guides, smart band articles, smart ring articles, smart fan guides, heart rate monitoring posts, and sleep tracking resources.'
              : `Read ${route.label} on TheFutureX for practical smart wearable guidance, buying tips, and connected lifestyle insights.`,
          ...blogSeoOverrides[cleanRoute],
        },
      ];
    })
);

const infoPages = Object.fromEntries(
  infoRoutes
    .filter((route) => route.path.startsWith('/info/'))
    .map((route) => [route.path.replace(/^\//, ''), route])
);
const publicPages = Object.fromEntries(
  sitemapRoutes.map((route) => [route.path.replace(/^\//, '') || '', route])
);

const upsertTag = (html, pattern, tag) => {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
};

const injectStaticRoot = (html, bodyHtml) => {
  // Show useful content before React starts, including when scripts are disabled.
  const staticHtml = `<div id="root"><div class="seo-prerendered-page">${bodyHtml}</div></div>`;
  return html
    .replace(/<noscript>\s*<main\b[\s\S]*?<\/noscript>/gi, '')
    .replace(/<div id="root"><\/div>/i, staticHtml);
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
            <h3>${htmlEscape(product.name)}</h3>
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
      <p>Shop smart bands, smart rings, smart fans, and monitoring wearables from TheFutureX. Compare everyday tracking, sleep insights, app connectivity, airflow comfort, and practical connected technology for modern living.</p>
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
          <li><a href="/blog">Blog</a></li>
        </ul>
      </section>
      <section class="seo-faq">
        <h2>Frequently Asked Questions</h2>
        ${homepageFaqs.map(({ question, answer }) => `<details><summary>${htmlEscape(question)}</summary><p>${htmlEscape(answer)}</p></details>`).join('')}
      </section>
    </main>`;
};

const buildBlogIndexStaticHtml = () => {
  const posts = Object.entries(blogPages)
    .filter(([route]) => route !== 'blog' && !unlistedJournalPaths.has(`/${route}`))
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
        ${page.post ? `<img src="${htmlEscape(page.post.image)}" alt="The FutureX AI Smart Band TFX5" />${page.post.contentHtml}` : '<p>Read this TheFutureX guide for practical smart wearable context, product education, and buying support.</p>'}
      </article>
    </main>`;

const crawlerDisallowRules = [
  '/admin',
  '/api/',
  '/checkout',
  '/payment',
  '/profile',
  '/login',
  '/signup',
  '/cart',
  '/verify-phone',
];

const buildRobotsBlock = (userAgent) =>
  `User-agent: ${userAgent}\nAllow: /\n${crawlerDisallowRules.map((path) => `Disallow: ${path}`).join('\n')}`;

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
      sameAs: [
        'https://www.instagram.com/thefuturex.in/',
        'https://www.linkedin.com/in/thefuture-x-088216419/',
        'https://x.com/x_the19117',
      ],
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

const getProductUrl = (product) => `${SITE_URL}/product/${product.canonicalSlug || product.slug}`;

const injectPageSeo = (html, { title, description, url, image = DEFAULT_IMAGE, type = 'website', jsonLd = '', keywords = [] }) => {
  const imageUrl = resolveUrl(image);
  const normalizedKeywords = normalizeSeoKeywords(keywords);
  let next = html
    .replace(/<meta\s+name="keywords"\s+[^>]*>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(title)}</title>`)
    .replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:type" content="${htmlEscape(type)}" />`);

  next = upsertTag(next, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${htmlEscape(description)}" />`);
  if (normalizedKeywords.length) {
    next = next.replace('</head>', () => `    <meta name="keywords" content="${htmlEscape(normalizedKeywords.join(', '))}" />\n  </head>`);
  }
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

const baseHtml = readFileSync(indexFile, 'utf8');
// Keep the compiled SPA shell for live product pages, including products added after a build.
writeFileSync(join(distDir, 'product-shell.html'), baseHtml, 'utf8');
let catalogAvailable = true;
const remoteProducts = await getRemoteProducts({ includeReviews: true }).catch((error) => {
  catalogAvailable = false;
  console.warn('Could not build catalog snapshots:', error.message);
  return [];
});
// A production snapshot must represent the live catalog. Vercel exposes VERCEL=1
// during builds; other CI systems can opt in with REQUIRE_LIVE_PRODUCT_DATA=true.
// This turns a transient Firestore/network problem into a failed deploy rather
// than quietly publishing stale fallback pricing, stock, or specifications.
const requireLiveProductData = process.env.VERCEL === '1' || process.env.REQUIRE_LIVE_PRODUCT_DATA === 'true';
if (requireLiveProductData && !catalogAvailable) {
  throw new Error('Live Firestore product data was unavailable. Refusing to publish SEO snapshots from static fallbacks.');
}
const productRecords = (catalogAvailable && !remoteProducts.length ? [] : mergeProductSeoRecords(remoteProducts)).filter(product => product.slug === product.canonicalSlug);
const remoteCategories = await getRemoteCatalogCategories().catch((error) => {
  console.warn('Could not load category SEO during build:', error.message);
  return [];
});
const categoryPages = getCatalogCategoryPages(remoteCategories);
Object.values(blogPages).forEach((page) => {
  if (page.post) page.post.image = getBlogProductImage(page.post, productRecords) || page.post.image;
});
const publishedRoutes = [...sitemapRoutes, ...staticPublishedBlogPosts, ...remoteBlogRoutes].map(({ path }) => path.replace(/^\//, ''));
const standaloneBlogPaths = new Set(fanGuideRoutes.map(({ path }) => path));
const routes = new Set(['', ...spaFallbackRoutes, ...publishedRoutes, ...Object.keys(categoryPages)].filter((route) =>
  !standaloneBlogPaths.has('/' + route) && !route.startsWith('product/')
));

let snapshotCount = 0;
for (const product of remoteProducts) {
  const slug = getProductSlug(product);
  if (!slug) continue;
  for (const color of ['', ...getColorVariants(product).map(({ slug }) => slug)]) {
    const html = renderProductPage(baseHtml, product, color);
    const target = join(distDir, process.env.VERCEL === '1' ? '_catalog/products' : 'product', slug, color, 'index.html');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html, 'utf8');
    snapshotCount += 1;
  }
}

const getRouteHtml = (route) => {
  if (route === 'shop') return renderCategoryPage(baseHtml, 'shop/all', productRecords, categoryPages);
  if (route === '') {
    const title = 'Smart Bands & Fitness Trackers Online India | TheFutureX';
    const description = 'Buy smart bands, fitness trackers, smart rings & bladeless fans online in India. Heart rate, sleep & health tracking with the TheFutureX SmartWear app.';
    const html = injectPageSeo(baseHtml, {
      title,
      description,
      url: `${SITE_URL}/`,
      image: DEFAULT_IMAGE,
      jsonLd: `${buildHomepageJsonLd()}\n    <script id="homepage-faq-json-ld" type="application/ld+json">${JSON.stringify(homepageFaqSchema)}</script>`,
    });
    return injectStaticRoot(html, buildHomeStaticHtml(productRecords));
  }

  if (Object.hasOwn(categoryPages, route)) return renderCategoryPage(baseHtml, route, productRecords, categoryPages);

  const blogPage = blogPages[route];
  if (blogPage) {
    const title = blogSeoOverrides[route]?.title || (route === 'blog' ? blogPage.title : `${blogPage.title} | TheFutureX Blog`);
    const html = injectPageSeo(baseHtml, {
      title,
      description: blogPage.description,
      url: `${SITE_URL}/${route}`,
      image: blogPage.post?.image || DEFAULT_IMAGE,
      keywords: blogPage.keywords,
      type: 'article',
      jsonLd: blogPage.post ? `<script id="blog-article-json-ld" type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Article', headline: blogPage.post.title,
        description: blogPage.description, image: resolveUrl(blogPage.post.image),
        mainEntityOfPage: `${SITE_URL}/${route}`, datePublished: blogPage.post.updatedAt, dateModified: blogPage.post.updatedAt,
        author: { '@type': 'Organization', name: 'TheFutureX' },
      }).replace(/</g, '\\u003c')}</script>` : '',
    });
    return injectStaticRoot(html, route === 'blog' ? buildBlogIndexStaticHtml() : buildBlogPostStaticHtml(blogPage));
  }

  const infoPage = infoPages[route];
  if (infoPage) {
    const html = injectPageSeo(baseHtml, {
      title: `${infoPage.label} | TheFutureX`,
      description: `${infoPage.label} information and guidance from TheFutureX.`,
      url: `${SITE_URL}/${route}`,
      image: DEFAULT_IMAGE,
    });
    return injectStaticRoot(html, `${buildStaticStyles()}<main><h1>${htmlEscape(infoPage.label)}</h1><p>${htmlEscape(infoPage.label)} information and guidance from TheFutureX.</p></main>`);
  }

  const publicPage = publicPages[route];
  if (publicPage) {
    const html = injectPageSeo(baseHtml, {
      title: `${publicPage.label} | TheFutureX`,
      description: `${publicPage.label} from TheFutureX.`,
      url: `${SITE_URL}/${route}`,
      image: DEFAULT_IMAGE,
    });
    return injectStaticRoot(html, `${buildStaticStyles()}<main><h1>${htmlEscape(publicPage.label)}</h1><p>${htmlEscape(publicPage.label)} from TheFutureX.</p></main>`);
  }

  return baseHtml;
};

for (const route of routes) {
  const cleanRoute = String(route || '').replace(/^\/+/, '').replace(/\/+$/, '');
  const categorySnapshot = process.env.VERCEL === '1' && (cleanRoute === 'shop' || Object.hasOwn(categoryPages, cleanRoute));
  const target = cleanRoute ? join(distDir, categorySnapshot ? '_catalog/categories' : '', cleanRoute, 'index.html') : indexFile;
  const html = getRouteHtml(cleanRoute);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html, 'utf8');
}

if (process.env.VERCEL === '1') {
  for (const file of ['sitemap.xml', 'product-feed.xml', 'product-feed.csv']) {
    const target = join(distDir, file);
    if (existsSync(target)) unlinkSync(target);
  }
} else {
  writeFileSync(join(distDir, 'sitemap.xml'), await generateSitemapXML(remoteProducts, remoteCategories), 'utf8');
  writeFileSync(join(distDir, 'product-feed.xml'), await generateMerchantFeedXML(remoteProducts), 'utf8');
  writeFileSync(join(distDir, 'product-feed.csv'), await generateMerchantFeedCSV(remoteProducts), 'utf8');
}
writeFileSync(
  join(distDir, 'robots.txt'),
  `${['*', 'GPTBot', 'Google-Extended', 'ClaudeBot', 'PerplexityBot', 'Applebot-Extended'].map(buildRobotsBlock).join('\n\n')}\n\nSitemap: ${SITE_URL}/sitemap.xml\nLLMS: ${SITE_URL}/llms.txt\n`,
  'utf8'
);

console.log(`Copied ${routes.size} SPA route fallbacks with ${snapshotCount} product snapshots.`);
process.exit(0);
