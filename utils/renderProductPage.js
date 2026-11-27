import { getProductPresentation } from './productPresentation.ts';
import { getSchemaReviews } from './productSchema.js';

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
export const safeJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');
export const jsonLdTag = (id, data) =>
  `<script id="${id}" type="application/ld+json">${safeJson(data)}</script>`;

export const renderFaqSection = (faqs) => faqs.length
  ? `<section id="faq"><h2>Frequently asked questions</h2>${faqs.map(({ q, a }) =>
    `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}</section>`
  : '';

export const renderCatalogShell = (shell, { title, url, metaDescription, image, type, schemas, content }) => {
  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(metaDescription)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    ...Object.entries({ 'og:title': title, 'og:description': metaDescription, 'og:url': url, 'og:image': image, 'og:type': type })
      .map(([key, value]) => `<meta property="${key}" content="${escapeHtml(value)}">`),
    ...Object.entries({ 'twitter:title': title, 'twitter:description': metaDescription, 'twitter:image': image })
      .map(([key, value]) => `<meta name="${key}" content="${escapeHtml(value)}">`),
    ...Object.entries(schemas).filter(([, data]) => data).map(([id, data]) => jsonLdTag(id, data)),
  ].join('\n');
  return shell
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name="(?:description|twitter:(?:title|description|image))"|property="og:[^"]*")[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript>\s*<main\b[\s\S]*?<\/noscript>/gi, '')
    .replace('</head>', () => `${metadata}\n<style>.catalog-prerender{max-width:72rem;margin:auto;padding:1.5rem}.catalog-prerender h1{font-size:2rem}.catalog-prerender h2{font-size:1.4rem;margin-top:1.25rem}.catalog-prerender-images{display:flex;gap:1rem;overflow:auto}.catalog-prerender-images img{width:min(72vw,360px);height:auto;object-fit:contain}.catalog-prerender dt{font-weight:bold}</style>\n</head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${content}</div>`);
};

export const renderProductPage = (shell, product, colorSlug = '') => {
  const page = getProductPresentation(product, colorSlug);
  if (!page) return null;

  const { title, url, name, overview, description, features, specs, model, stockLabel, warranty, faqs,
    reviews, images, offer, category, schemas, variant, metaDescription } = page;
  const price = (amount) => 'INR ' + amount.toFixed(2);
  const productImages = images.map((src, index) =>
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(name + (variant ? ' – ' + variant.name : '') + (index ? ' – image ' + (index + 1) : ''))}" width="360" height="360" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}>`
  ).join('');
  const specsHtml = Object.entries(specs).map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('');
  const eligibleReviews = getSchemaReviews(product.reviews);
  const reviewHtml = reviews.aggregateRating ? `
    <p>${reviews.aggregateRating.ratingValue} out of 5 (${reviews.aggregateRating.reviewCount} reviews)</p>
    ${reviews.review.map((review, index) => `<article><h3>${escapeHtml(review.author.name)}</h3><p>${review.reviewRating.ratingValue} out of 5</p><p>${escapeHtml(review.reviewBody)}</p>${(eligibleReviews[index].images || []).filter((src) => /^https?:\/\//i.test(src)).slice(0, 2).map((src) =>
      `<img src="${escapeHtml(src)}" alt="Photo by ${escapeHtml(review.author.name)}" width="80" height="80" loading="lazy">`).join('')}</article>`).join('')}`
    : '<p>No customer reviews yet.</p>';
  const content = `<main class="catalog-prerender">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${escapeHtml(category.url)}">${escapeHtml(category.name)}</a></nav>
    <h1>${escapeHtml(name)}</h1>
    ${variant ? `<p>Color <strong>${escapeHtml(variant.name)}</strong></p>` : ''}
    <div class="catalog-prerender-images">${productImages}</div>
    ${offer.currentPrice > 0 ? `<p><strong>${offer.onSale ? 'Sale price: ' : ''}${price(offer.currentPrice)}</strong></p>` : ''}
    ${offer.regularPrice > 0 ? `<p>MRP ${offer.onSale ? `<del>${price(offer.regularPrice)}</del>` : price(offer.regularPrice)}</p>` : ''}
    <p>${escapeHtml(stockLabel)}</p>
    <p>Free delivery across India. <a href="/info/returns-refund">7-day exchange review for verified delivery defects</a>.</p>
    <section><h2>Product overview</h2><p>${escapeHtml(overview)}</p></section>
    ${description !== overview ? `<section><h2>Description</h2><p>${escapeHtml(description)}</p></section>` : ''}
    ${features.length ? `<section><h2>Features and benefits</h2><ul>${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul></section>` : ''}
    ${model || specsHtml ? `<section><h2>Technical specifications</h2>${model ? `<p>Model ${escapeHtml(model)}</p>` : ''}<dl>${specsHtml}</dl></section>` : ''}
    <section><h2>Warranty</h2><p>${escapeHtml(warranty)}. <a href="/info/warranty-policy">Warranty policy</a></p></section>
    <section id="reviews"><h2>Customer reviews</h2>${reviewHtml}</section>
    ${renderFaqSection(faqs)}
  </main>`;
  return renderCatalogShell(shell, { title, url, metaDescription, image: images[0], type: 'product', schemas, content });
};
