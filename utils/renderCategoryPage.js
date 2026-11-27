import { categoryPages } from './categorySeo.js';
import { getCategoryFaqs } from './categoryFaqs.js';
import { buildFaqSchema } from './faqSchema.js';
import { SITE_URL, resolveUrl } from './productSeoData.js';
import { isSameCollection } from './productCollections.ts';
import { buildBreadcrumbSchema, organizationSchema } from './productPresentation.ts';
import { escapeHtml, renderCatalogShell, renderFaqSection } from './renderProductPage.js';

export const renderCategoryPage = (shell, route, catalog, pages = categoryPages) => {
  if (!Object.hasOwn(pages, route)) return null;
  const { name, title, description, category } = pages[route];
  const faqs = getCategoryFaqs(route);
  const url = SITE_URL + '/' + route;
  const products = catalog.filter((product) => !category || isSameCollection(product.category, category));
  const entries = products.map((product) => ({
    ...product, url: SITE_URL + '/product/' + product.canonicalSlug,
  }));
  const cards = entries.map((product) => `<article>
    <a href="${escapeHtml(product.url)}"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="240" height="240" loading="lazy">
      <h2>${escapeHtml(product.name)}</h2></a>
    ${product.price > 0 ? `<p>INR ${product.price.toFixed(2)}</p>` : ''}
  </article>`).join('');
  const content = `<main class="catalog-prerender"><nav aria-label="Breadcrumb"><a href="/">Home</a></nav>
    <h1>${escapeHtml(name)}</h1><p>${escapeHtml(description)}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1.5rem">${cards || '<p>No products currently listed.</p>'}</div>
    ${renderFaqSection(faqs)}
  </main>`;
  return renderCatalogShell(shell, {
    title, url, metaDescription: description, image: resolveUrl('/images/tfx-google-logo.webp'), type: 'website', content,
    schemas: {
      'collection-page-json-ld': {
        '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': url + '#collection', name, description, url,
        ...(entries.length ? { mainEntity: { '@type': 'ItemList', itemListElement: entries.map((product, index) => ({
          '@type': 'ListItem', position: index + 1, url: product.url, name: product.name,
        })) } } : {}),
      },
      'collection-breadcrumb-json-ld': buildBreadcrumbSchema([{ name, url }]),
      'collection-faq-json-ld': buildFaqSchema(faqs),
      'organization-json-ld': organizationSchema,
    },
  });
};
