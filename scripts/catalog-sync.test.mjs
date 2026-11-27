import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProductItem, generateMerchantFeedCSV, generateMerchantFeedXML } from '../utils/generateMerchantFeed.js';
import { buildProductSeoRecord, mergeProductSeoRecords } from '../utils/productSeoData.js';
import { getAutomaticOfferItemPricing } from '../utils/catalogPricing.js';
import { findProductForRoute } from '../api/product-page.js';
import { renderProductPage } from '../utils/renderProductPage.js';
import { renderCategoryPage } from '../utils/renderCategoryPage.js';
import { getCategoryFaqs } from '../utils/categoryFaqs.js';
import { escapeHtml } from '../utils/renderProductPage.js';
import { mergeProductReviews } from '../utils/productSchema.js';
import { buildProductInput } from '../services/merchant-api/merchantService.js';
import { getCatalogMrp } from '../utils/catalogPricing.js';

const product = {
  id: 'p_1772274359863', slug: 'tfx-pureair-3-in-1',
  name: 'My saved title & model', category: 'Smart Fans',
  description: '<p>My updated description.</p>', features: ['My added feature'],
  specs: { Material: 'ABS' }, images: ['/images/fan.jpg', '/images/fan-side.jpg'],
  price: 13500, stock: 3, reservedStock: 3,
};

test('feed and page preserve saved title, content, offer price and availability', () => {
  const item = buildProductItem(product);
  const seo = buildProductSeoRecord(product);
  assert.equal(seo.name, product.name);
  assert.equal(seo.price, getAutomaticOfferItemPricing(product).unitOfferPrice);
  assert.equal(seo.price, 13500);
  assert.match(item, /<g:title>The FutureX My saved title &amp; model<\/g:title>/);
  assert.match(item, /My updated description/);
  assert.match(item, /My added feature/);
  assert.match(item, /Material: ABS/);
  assert.match(item, /<g:price>15000.00 INR/);
  assert.match(item, /<g:availability>out_of_stock/);
  assert.equal(seo.availability, 'https://schema.org/OutOfStock');
  assert.match(item, /additional_image_link/);
  assert.match(item, /<g:sale_price>13500.00 INR/);
});

test('reserved variant inventory and manual unavailability agree across outputs', () => {
  const variant = { ...product, variants: [{ sizes: [{ size: 'M', stock: 4 }] }], colors: [{ stock: 4, reservedStock: 4 }] };
  for (const value of [variant, { ...product, reservedStock: 0, inStock: false }]) {
    assert.match(buildProductItem(value), /<g:availability>out_of_stock/);
    assert.equal(buildProductSeoRecord(value).availability, 'https://schema.org/OutOfStock');
  }
});

test('new products appear in both feeds; removed products do not return as fallback records', async () => {
  const added = { ...product, id: 'new-product', slug: 'new-product', name: 'New product' };
  const xml = await generateMerchantFeedXML([added]);
  const csv = await generateMerchantFeedCSV([added]);
  assert.match(xml, /<g:id>new-product/);
  assert.match(csv, /"new-product","","The FutureX New product"/);
  assert.doesNotMatch(xml, /p-1772274359863/);
  assert.equal(mergeProductSeoRecords([added]).length, 1);
});

test('every Merchant title uses the The FutureX brand prefix once', async () => {
  const xml = await generateMerchantFeedXML([
    { ...product, name: 'TFX Fan' },
    { ...product, id: 'already-branded', name: 'The FutureX TFX Ring' },
  ]);
  assert.match(xml, /<g:title>The FutureX TFX Fan<\/g:title>/);
  assert.match(xml, /<g:title>The FutureX TFX Ring<\/g:title>/);
  assert.doesNotMatch(xml, /The FutureX The FutureX/);
});

test('standard wearable discounts use the checkout calculation', () => {
  const ring = { ...product, slug: 'custom-ring', category: 'Smart Rings', price: 4000 };
  assert.equal(buildProductSeoRecord(ring).price, 3800);
  assert.match(buildProductItem(ring), /<g:price>4000.00 INR/);
  assert.match(buildProductItem(ring), /<g:sale_price>3800.00 INR/);
});

test('live product pages render current details and safely replace stale metadata', () => {
  const shell = '<html><head><title>Old title</title><meta name="description" content="Old"><link rel="canonical" href="/old"></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>';
  const html = renderProductPage(shell, { ...product, name: 'New <script>alert(1)</script> title' });
  assert.doesNotMatch(html, /Old title|href="\/old"|<script>alert/);
  assert.match(html, /My updated description/);
  assert.match(html, /My added feature/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /\/assets\/app.js/);
  const schema = JSON.parse(html.match(/<script id="product-json-ld" type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(schema.offers.price, 13500);
  assert.equal(schema.offers.availability, 'https://schema.org/OutOfStock');
});

test('the owner-excluded glasses listing stays out even if its price changes', async () => {
  const excluded = { ...product, id: 'p_1780575129873_6djio', price: 5000 };
  assert.equal(buildProductItem(excluded), '');
  assert.equal(buildProductSeoRecord(excluded), null);
  assert.doesNotMatch(await generateMerchantFeedCSV([excluded]), /p-1780575129873-6djio/);
});

test('Merchant XML contains only supported, namespaced product attributes', async () => {
  const xml = await generateMerchantFeedXML([{ ...product, emiAvailable: true }]);
  assert.doesNotMatch(xml, /emiAvailable|emi_available/);
  const item = xml.match(/<item>([\s\S]*?)<\/item>/)[1];
  assert.ok([...item.matchAll(/<([\w:]+)>/g)].every((match) => match[1].startsWith('g:')));
});

test('sale price, title and real reviews are visible and agree with structured data', async () => {
  const review = { id: 'customer-1', name: 'Customer', comment: 'Works well.', rating: 4 };
  const reviews = mergeProductReviews([review, { ...review, id: 'p_seed_review_1', rating: 5 }], [{ ...review, rating: 5 }]);
  assert.equal(reviews.length, 1);
  const ring = { ...product, slug: 'custom-ring', category: 'Smart Rings', price: 4000, mrp: 6000, reviews };
  const html = renderProductPage('<head></head><div id="root"></div>', ring);
  assert.match(html, /<h1>My saved title &amp; model<\/h1>/);
  assert.match(html, /<del>INR 6000.00<\/del>/);
  assert.match(html, /Sale price: INR 3800.00/);
  assert.match(html, /Works well\./);
  assert.match(html, /Free delivery/);
  assert.match(html, /7-day exchange review/);
  const schema = JSON.parse(html.match(/<script id="product-json-ld" type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(schema.aggregateRating.reviewCount, 1);
  assert.equal(schema.aggregateRating.ratingValue, 5);
  assert.equal(schema.offers.price, 3800);
  assert.equal(schema.offers.priceSpecification.price, 6000);
  const csv = await generateMerchantFeedCSV([ring]);
  assert.match(csv, /price,sale_price/);
  assert.match(csv, /"6000.00 INR","3800.00 INR"/);
});

test('increased MRPs and unchanged sale prices agree in feeds, API and landing pages', async () => {
  const products = [
    { ...product, slug: 'custom-ring', category: 'Smart Rings', price: 4000, mrp: 6000 },
    { ...product, slug: 'tfx5-ai-smart-band', name: 'TFX5 AI Smart Band', category: 'Smart Bands', price: 9999 },
    product,
    { ...product, slug: 'premium-fan', category: 'Smart Fans', price: 16000, mrp: 18000 },
  ];
  for (const value of products) {
    const mrp = getCatalogMrp(value);
    const salePrice = getAutomaticOfferItemPricing(value).unitOfferPrice;
    const xml = buildProductItem(value);
    const csv = await generateMerchantFeedCSV([value]);
    const input = buildProductInput(value);
    assert.match(xml, new RegExp(`<g:price>${mrp.toFixed(2)} INR`));
    assert.match(xml, new RegExp(`<g:sale_price>${salePrice.toFixed(2)} INR`));
    assert.ok(csv.includes(`"${mrp.toFixed(2)} INR","${salePrice.toFixed(2)} INR"`));
    assert.equal(Number(input.productAttributes.price.amountMicros), mrp * 1e6);
    assert.equal(Number(input.productAttributes.salePrice.amountMicros), salePrice * 1e6);
    const html = renderProductPage('<head></head><div id="root"></div>', value);
    assert.ok(html.includes(`<del>INR ${mrp.toFixed(2)}</del>`));
    assert.ok(html.includes(`Sale price: INR ${salePrice.toFixed(2)}`));
  }
});

test('color variant feeds include sale prices alongside the saved MRP', async () => {
  const ring = {
    ...product, slug: 'custom-ring', category: 'Smart Rings', price: 4000, mrp: 6000,
    colors: [{ name: 'Black', stock: 4, images: ['/images/ring-black.jpg'] }],
  };
  const xml = buildProductItem(ring);
  const csv = await generateMerchantFeedCSV([ring]);
  assert.match(xml, /<g:color>Black/);
  assert.match(xml, /<g:price>6000.00 INR/);
  assert.match(xml, /<g:sale_price>3800.00 INR/);
  assert.ok(csv.includes('"6000.00 INR","3800.00 INR"'));
  const input = buildProductInput(ring, { name: 'Black', slug: 'black', stock: 4, images: ['/images/ring-black.jpg'] });
  assert.equal(Number(input.productAttributes.price.amountMicros), 6000e6);
  assert.equal(Number(input.productAttributes.salePrice.amountMicros), 3800e6);
});

test('admin edits drive the initial HTML, FAQ schema, canonical redirects and Merchant offers', () => {
  const edited = {
    ...product, seoPreviousSlugs: ['old-fan'], seoTitle: 'Updated SEO title', seoDescription: 'Updated meta description',
    shortDescription: 'Updated overview', warranty: 'Two-year motor warranty', useCatalogPricing: true, useCatalogTitle: true,
    salePrice: 14000, mrp: 16000, modelNumber: 'TP-02', mpn: 'TX-123', gtin: '8901234567890',
    faqs: [{ question: 'Can I clean the filter?', answer: 'Yes. Follow the care instructions.' }],
    colors: [{ name: 'Matte Black', stock: 3, reservedStock: 3 }],
    variants: [{ colorName: 'Matte Black', sizes: [{ stock: 3 }] }],
  };
  const shell = '<head></head><div id="root"></div>';
  const html = renderProductPage(shell, edited, 'matte-black');
  const parse = (id) => JSON.parse(html.match(new RegExp(`<script id="${id}" type="application/ld\\+json">(.*?)</script>`))[1]);
  assert.match(html, /<title>Updated SEO title – Matte Black<\/title>/);
  assert.match(html, /<meta name="description" content="Updated meta description">/);
  assert.match(html, /<summary>Can I clean the filter\?<\/summary><p>Yes\. Follow the care instructions\.<\/p>/);
  assert.match(html, /Two-year motor warranty/);
  assert.equal(parse('product-faq-json-ld').mainEntity[0].acceptedAnswer.text, edited.faqs[0].answer);
  assert.equal(parse('product-json-ld').model, 'TP-02');
  assert.equal(parse('product-json-ld').gtin, edited.gtin);
  assert.equal(parse('product-json-ld').offers.price, 14000);
  assert.equal(parse('product-json-ld').offers.availability, 'https://schema.org/OutOfStock');
  assert.match(buildProductItem(edited), /<g:sale_price>14000.00 INR/);
  assert.equal(findProductForRoute([edited], 'old-fan'), edited);
  assert.equal(renderProductPage(shell, edited, 'unknown-color'), null);
  assert.doesNotMatch(renderProductPage(shell, { ...edited, faqs: [] }), /FAQPage|<details>/);
  assert.match(renderCategoryPage(shell, 'bladeless-fan', [buildProductSeoRecord(edited)]), /BreadcrumbList.*bladeless-fan/);
});

test('all dedicated category FAQs are visible before JavaScript and match their schema', () => {
  const shell = '<head></head><div id="root"></div>';
  for (const route of ['smart-bands', 'smart-rings', 'bladeless-fan', 'smart-monitoring']) {
    const html = renderCategoryPage(shell, route, []);
    const faqs = getCategoryFaqs(route);
    assert.ok(faqs.length > 0);
    const script = html.match(/<script id="collection-faq-json-ld" type="application\/ld\+json">([^]*?)<\/script>/);
    const schema = JSON.parse(script[1]);
    assert.equal(schema.mainEntity.length, faqs.length);
    for (const { q, a } of faqs) {
      assert.ok(html.includes(`<summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p>`));
      assert.ok(schema.mainEntity.some((question) => question.name === q && question.acceptedAnswer.text === a));
    }
  }
  assert.doesNotMatch(renderCategoryPage(shell, 'shop/all', []), /collection-faq-json-ld/);
});
