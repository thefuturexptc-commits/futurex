import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProductReviewFeed } from '../utils/generateProductReviewFeed.js';
import { getMerchantReviewSkus } from '../utils/generateMerchantFeed.js';

const review = { id: 'saved-1', name: 'Customer & family', rating: 2, comment: 'Battery <b>could last longer</b> & charging is slow.', date: '2026-11-12T10:00:00Z', images: ['https://example.test/photo.webp?x=1&y=2'], userEmail: 'private@example.test', userPhone: '9999999999' };
const product = { id: 'band-1', name: 'Smart Band', slug: 'smart-band', category: 'Smart Bands', brand: 'TheFutureX', mpn: 'TFX-B1', reviews: [review] };

test('Shopping feed shares every saved review, including low ratings, with no private contact details', async () => {
  const result = await generateProductReviewFeed([{ ...product, reviews: [review, { ...review, id: 'saved-2', rating: 5 }, { ...review, id: 'saved-3', rating: 4 }] }]);
  assert.equal(result.count, 3);
  assert.equal((result.xml.match(/<review>/g) || []).length, 3);
  assert.match(result.xml, /<overall min="1" max="5">2<\/overall>/);
  assert.match(result.xml, /Customer &amp; family/);
  assert.match(result.xml, /could last longer/);
  assert.match(result.xml, /photo.webp\?x=1&amp;y=2/);
  assert.doesNotMatch(result.xml, /private@example|9999999999|<is_verified_purchase>true/);
  assert.match(result.xml, /review_url type="group"/);
  assert.match(result.xml, /<mpn>TFX-B1<\/mpn>/);
});
test('feed uses the exact variant SKUs from the product feed and never invents a GTIN', async () => {
  const variantProduct = { ...product, variants: [{ colorName: 'Gold', images: ['https://example.test/gold.webp'], sizes: [{ size: '8', stock: 1 }] }] };
  const result = await generateProductReviewFeed([variantProduct]);
  getMerchantReviewSkus(variantProduct).forEach(sku => assert.ok(result.xml.includes(`<sku>${sku}</sku>`)));
  assert.doesNotMatch(result.xml, /<gtin>/);
});
test('missing review dates fail the full feed instead of silently exporting a partial data set', async () => {
  await assert.rejects(generateProductReviewFeed([{ ...product, reviews: [{ ...review, date: '' }] }]), /saved ID and date/);
});
