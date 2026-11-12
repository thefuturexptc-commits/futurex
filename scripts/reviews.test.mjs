import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewSchema, withProductReviewSummary } from '../utils/productSchema.js';
import { renderProductPage } from '../api/product-page.js';

const first = { id: 'review-1', name: 'First customer', rating: 5, comment: 'Comfortable for everyday use.', date: '2026-06-25', images: ['https://example.test/photo.webp'] };
const second = { id: 'review-2', name: 'Second customer', rating: 4, comment: 'Useful app insights.', date: '2026-06-26' };
const base = { id: 'band', name: 'AI Smart Band', slug: 'ai-smart-band', category: 'Smart Bands', description: 'Smart band for everyday use.', price: 5000, salePrice: 5000, mrp: 6000, stock: 3, inStock: true, images: ['https://example.test/band.webp'], reviews: [], rating: 0, reviewCount: 999 };
const shell = '<html><head><title>Shell</title></head><body><div id="root"></div></body></html>';
function parse(html) {
  const schema = JSON.parse(html.match(/<script id="product-json-ld" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const section = html.match(/<section id="reviews">([\s\S]*?)<\/section>/)[1];
  return { schema, section };
}
test('two saved reviews agree in page HTML, count, average and Google schema', () => {
  const product = withProductReviewSummary(base, [first, second]);
  assert.equal(product.reviewCount, 2);
  assert.equal(product.rating, 4.5);
  const { schema, section } = parse(renderProductPage(shell, product));
  assert.equal(schema.aggregateRating.reviewCount, 2);
  assert.equal(schema.aggregateRating.ratingValue, 4.5);
  assert.match(section, /4.5 out of 5 \(2 reviews\)/);
  assert.equal((section.match(/<article>/g) || []).length, 2);
  assert.match(section, /photo.webp/);
});
test('a new saved website review increases the real total but initial preview stays at two', () => {
  const product = withProductReviewSummary({ ...base, reviews: [first, second] }, [{ id: 'review-3', name: 'New customer', rating: 3, comment: 'My experience with the product.', date: '2026-11-12T10:00:00Z', source: 'website', verifiedBuyer: false }]);
  const { schema, section } = parse(renderProductPage(shell, product));
  assert.equal(product.reviewCount, 3);
  assert.equal(schema.aggregateRating.reviewCount, 3);
  assert.equal(schema.aggregateRating.ratingValue, 4);
  assert.equal((section.match(/<article>/g) || []).length, 2);
  assert.match(section, /New customer/);
  assert.equal(schema.review.length, 2);
  assert.equal(schema.review[0].datePublished, '2026-11-12');
});
test('re-fetching the same review never double counts it; seeded, rejected and invalid rows do not count', () => {
  const product = withProductReviewSummary({ ...base, reviews: [first] }, [first, second, { ...first, id: 'band_seed_review_1' }, { ...first, id: 'sleep_monitor_default_review' }, { ...first, id: 'rejected', status: 'rejected' }, { ...first, id: 'invalid', rating: 6 }]);
  assert.equal(product.reviewCount, 2);
  assert.equal(buildReviewSchema(product.reviews).aggregateRating.reviewCount, 2);
});
test('a product with no saved customer reviews has no invented stars or aggregate rating', () => {
  const product = withProductReviewSummary(base);
  assert.equal(product.reviewCount, 0);
  assert.equal(product.rating, 0);
  assert.deepEqual(buildReviewSchema(product.reviews), {});
});
