import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getRemoteProducts } from '../utils/generateMerchantFeed.js';
import { buildProductSeoRecord, getProductSlug, SITE_URL, stripHtml } from '../utils/productSeoData.js';
import { buildReviewSchema, getSchemaReviews, productOfferPolicies, buildSalePriceSpecification } from '../utils/productSchema.js';
import { getCatalogOffer } from '../utils/catalogPricing.js';

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export const renderProductPage = (shell, product) => {
  const seo = buildProductSeoRecord(product);
  const url = `${SITE_URL}/product/${seo.canonicalSlug}`;
  const offer = getCatalogOffer(product);
  const reviewSchema = buildReviewSchema(product.reviews);
  const schema = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: seo.name, description: stripHtml(product.description), image: seo.images,
    sku: product.id, brand: { '@type': 'Brand', name: seo.brand },
    ...reviewSchema,
    ...(seo.price > 0 ? { offers: {
      '@type': 'Offer', url, price: seo.price, priceCurrency: 'INR',
      availability: seo.availability, itemCondition: 'https://schema.org/NewCondition',
      ...productOfferPolicies,
      ...buildSalePriceSpecification(offer.regularPrice, offer.currentPrice),
    } } : {}),
  };
  const metadata = [
    `<title>${escape(seo.name)}</title>`,
    `<meta name="description" content="${escape(seo.description)}">`,
    `<link rel="canonical" href="${escape(url)}">`,
    ...Object.entries({ 'og:title': seo.name, 'og:description': seo.description, 'og:url': url, 'og:image': seo.image, 'og:type': 'product' })
      .map(([key, value]) => `<meta property="${key}" content="${escape(value)}">`),
    ...Object.entries({ 'twitter:title': seo.name, 'twitter:description': seo.description, 'twitter:image': seo.image })
      .map(([key, value]) => `<meta name="${key}" content="${escape(value)}">`),
    `<script id="product-json-ld" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`,
  ].join('\n');
  const saleHtml = offer.onSale ? '<p>Regular price: <del>INR ' + offer.regularPrice.toFixed(2) + '</del> ? Sale price: INR ' + offer.currentPrice.toFixed(2) + '</p>' : '';
  const reviewsHtml = reviewSchema.aggregateRating
    ? '<section id="reviews"><h2>Customer reviews</h2><p>' + reviewSchema.aggregateRating.ratingValue + ' out of 5 (' + reviewSchema.aggregateRating.reviewCount + ' reviews)</p>' + getSchemaReviews(product.reviews).map((review) => '<article><h3>' + escape(review.name) + '</h3><p>' + Number(review.rating) + ' out of 5</p><p>' + escape(stripHtml(review.comment)) + '</p></article>').join('') + '</section>'
    : '<section id="reviews"><h2>Customer reviews</h2><p>No customer reviews yet.</p></section>';
  const customerTermsHtml = '<p><strong>Free delivery</strong> across India.</p><p><a href="/info/returns-refund"><strong>7-day exchange review</strong> for verified delivery defects.</a></p>';
  const content = `<main><h1>${escape(seo.name)}</h1><img src="${escape(seo.image)}" alt="${escape(seo.name)}"><p>₹${seo.price.toFixed(2)}</p><p>${seo.availability.endsWith('/InStock') ? 'In stock' : 'Out of stock'}</p>${customerTermsHtml}<p>${escape(stripHtml(product.description))}</p><ul>${(product.features || []).map((feature) => `<li>${escape(feature)}</li>`).join('')}</ul><dl>${Object.entries(product.specs || {}).map(([key, value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl>${saleHtml}${reviewsHtml}</main>`;
  return shell
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name="(?:description|twitter:(?:title|description|image))"|property="og:[^"]*")[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
    .replace('</head>', `${metadata}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
};

export default async function handler(req, res) {
  try {
    const slug = String(req.query?.slug || '');
    const [products, shell] = await Promise.all([
      getRemoteProducts({ includeReviews: true }), readFile(join(process.cwd(), 'dist/product-shell.html'), 'utf8'),
    ]);
    const product = products.find((item) => getProductSlug(item) === slug || item.id === slug);
    if (product) {
      const canonicalSlug = getProductSlug(product);
      if (canonicalSlug !== slug) {
        return res.redirect(301, `${SITE_URL}/product/${encodeURIComponent(canonicalSlug)}`);
      }
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!product) return res.status(404).send('Product not found.');
    return res.status(200).send(renderProductPage(shell, product));
  } catch (error) {
    console.error('Live product page failed', error);
    return res.status(503).send('Product information is temporarily unavailable. Please try again.');
  }
}
