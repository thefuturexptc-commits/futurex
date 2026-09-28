import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProductItem, generateMerchantFeedCSV, generateMerchantFeedXML } from '../utils/generateMerchantFeed.js';
import { buildProductSeoRecord, mergeProductSeoRecords } from '../utils/productSeoData.js';
import { getAutomaticOfferItemPricing } from '../utils/catalogPricing.js';
import { renderProductPage } from '../api/product-page.js';
import { mergeProductReviews } from '../utils/productSchema.js';

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
  assert.match(item, /<g:title>My saved title &amp; model<\/g:title>/);
  assert.match(item, /My updated description/);
  assert.match(item, /My added feature/);
  assert.match(item, /Material: ABS/);
  assert.match(item, /<g:price>13500.00 INR/);
  assert.match(item, /<g:availability>out_of_stock/);
  assert.equal(seo.availability, 'https://schema.org/OutOfStock');
  assert.match(item, /additional_image_link/);
  assert.doesNotMatch(item, /g:sale_price/);
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
  assert.match(csv, /"new-product","New product"/);
  assert.doesNotMatch(xml, /p-1772274359863/);
  assert.equal(mergeProductSeoRecords([added]).length, 1);
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
  const ring = { ...product, slug: 'custom-ring', category: 'Smart Rings', price: 4000, reviews };
  const html = renderProductPage('<head></head><div id="root"></div>', ring);
  assert.match(html, /<h1>My saved title &amp; model<\/h1>/);
  assert.match(html, /<del>INR 4000.00<\/del>/);
  assert.match(html, /Sale price: INR 3800.00/);
  assert.match(html, /Works well\./);
  assert.match(html, /Free delivery/);
  assert.match(html, /7-day exchange review/);
  const schema = JSON.parse(html.match(/<script id="product-json-ld" type="application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(schema.aggregateRating.reviewCount, 1);
  assert.equal(schema.aggregateRating.ratingValue, 5);
  assert.equal(schema.offers.price, 3800);
  assert.equal(schema.offers.priceSpecification.price, 4000);
  const csv = await generateMerchantFeedCSV([ring]);
  assert.match(csv, /price,sale_price/);
  assert.match(csv, /"4000.00 INR","3800.00 INR"/);
});
