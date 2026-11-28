import test from 'node:test';
import assert from 'node:assert/strict';
import { getCatalogOffer, getAutomaticOfferItemPricing, getCatalogMrp, isQ8Pro } from '../utils/catalogPricing.js';
import { getMerchantPricing } from '../utils/merchantPricing.js';
import { buildProductItem, generateMerchantFeedCSV } from '../utils/generateMerchantFeed.js';
import { buildProductInput } from '../services/merchant-api/merchantService.js';

const base = { id: 'test-product', slug: 'test-product', name: 'Test product', category: 'Accessories', price: 1000, mrp: 2000, stock: 5, images: ['https://example.test/product.webp'] };
const fixtures = [
  { ...base, name: 'Smart Ring', category: 'Smart Rings', price: 3855, salePrice: 3855, mrp: 4699 },
  { ...base, name: 'Tower Fan', category: 'Fans', price: 12599, salePrice: 12599, mrp: 13999 },
  { ...base, slug: 'tfx-advance', name: 'Futurex Q8 PRO Bladeless Tower Fan', category: 'Fans', price: 12599, salePrice: 12599, mrp: 13999 },
  { ...base, name: 'TheFutureX AI Smart Band TFX5', category: 'Smart Bands', price: 9999, salePrice: 8000, mrp: 11999 },
  { ...base, name: 'TFX-TP02 3-in-1 Fan', slug: 'tfx-pureair-3-in-1', category: 'Fans', price: 13500, mrp: 15000 },
  base,
];

for (const product of fixtures) {
  test(`${product.name}: XML, CSV and API prices match the storefront including automatic offers`, async () => {
    const offer = getCatalogOffer(product);
    const xml = buildProductItem(product);
    const csv = await generateMerchantFeedCSV([product]);
    const attributes = buildProductInput(product).productAttributes;
    const current = `${offer.currentPrice.toFixed(2)} INR`;
    const regular = `${offer.regularPrice.toFixed(2)} INR`;
    assert.ok(xml.includes(`<g:price>${regular}</g:price>`));
    assert.ok(xml.includes(`<g:sale_price>${current}</g:sale_price>`));
    assert.ok(csv.includes(`"${regular}","${current}"`));
    assert.equal(attributes.price.currencyCode, 'INR');
    assert.equal(attributes.price.amountMicros, String(Math.round(offer.regularPrice * 1e6)));
    assert.equal(attributes.salePrice.amountMicros, String(Math.round(offer.currentPrice * 1e6)));
  });
}

test('every color listing keeps the displayed product offer rather than stale variant override values', async () => {
  const product = { ...fixtures[0], colors: [{ name: 'Gold', stock: 2 }, { name: 'Silver', stock: 3 }], variants: [{ colorName: 'Gold', price: -1 }, { colorName: 'Silver', price: 5 }] };
  const xml = buildProductItem(product);
  const price = getCatalogOffer(product).currentPrice.toFixed(2);
  assert.equal((xml.match(new RegExp(`<g:sale_price>${price} INR</g:sale_price>`, 'g')) || []).length, 2);
  for (const name of ['Gold', 'Silver']) {
    const attributes = buildProductInput(product, { name, slug: name.toLowerCase(), stock: 1, images: [] }).productAttributes;
    assert.equal(Number(attributes.salePrice.amountMicros) / 1e6, Number(price));
  }
});

test('Merchant product inputs send availability without a sell-on-Google quantity', () => {
  for (const [stock, availability] of [[1, 'IN_STOCK'], [0, 'OUT_OF_STOCK']]) {
    const product = { ...base, stock };
    const variant = { name: 'Black', slug: 'black', stock, images: [] };
    for (const input of [buildProductInput(product), buildProductInput(product, variant)]) {
      assert.equal(input.productAttributes.availability, availability);
      assert.equal(Object.hasOwn(input.productAttributes, 'sellOnGoogleQuantity'), false);
    }
  }
});

test('invalid prices fail exports and API submission rather than publishing zero, negative or nonfinite values', async () => {
  for (const price of [0, -1, NaN, Infinity, 'not-a-price']) {
    const product = { ...base, price };
    assert.throws(() => getMerchantPricing(product), /invalid Merchant price/);
    assert.throws(() => buildProductItem(product), /invalid Merchant price/);
    assert.throws(() => buildProductInput(product), /invalid Merchant price/);
    await assert.rejects(generateMerchantFeedCSV([product]), /invalid Merchant price/);
  }
});

test('Q8 Pro sells for exactly INR 11,999 without an additional automatic fan discount', () => {
  const product = fixtures.find(product => product.slug === 'tfx-advance');
  assert.equal(getCatalogOffer(product).currentPrice, 11999);
  assert.equal(getCatalogOffer(product).regularPrice, 13999);
  const cart = getAutomaticOfferItemPricing({ ...product, quantity: 2 });
  assert.equal(cart.rate, 0);
  assert.equal(cart.lineTotal, 23998);
  assert.equal(isQ8Pro({ name: 'QG830 fan' }), false);
  assert.equal(isQ8Pro({ name: 'Q8 PRO Bladeless Fan' }), true);
});

test('MRPs use saved catalog values without increasing them by price band', () => {
  for (const price of [1000, 6000, 12000, 20000]) {
    assert.equal(getCatalogMrp({ ...base, price, mrp: price + 1500 }), price + 1500);
  }
  assert.equal(getCatalogMrp({ name: 'TFX5 AI Smart Band', category: 'Smart Bands', price: 9999 }), 11999);
  assert.equal(getCatalogMrp({ slug: 'tfx-pureair-3-in-1', name: 'PureAir 3-in-1', price: 13500 }), 15000);
  assert.equal(getMerchantPricing({ ...fixtures[0], mrp: 3690 }).regularPrice, 3690);
  assert.throws(() => getMerchantPricing({ ...base, mrp: 500 }), /invalid Merchant price/);
});
