import test from 'node:test';
import assert from 'node:assert/strict';
import { getBundleChoices } from '../utils/bundleChoices.js';
test('bundle choices keep stocked ring sizes and variant prices; monitoring is not a ring', () => {
  const products = [{ id: 'monitor', name: 'Smart Monitoring', category: 'Monitoring', stock: 3 }, { id: 'ring', name: 'Smart Ring', category: 'Rings', price: 4000, variants: [{ colorName: 'Gold', price: 4500, images: ['gold.webp'], sizes: [{ size: '7', stock: 0 }, { size: '8', stock: 2 }] }] }];
  const choices = getBundleChoices(products, 'ring');
  assert.equal(choices.length, 1);
  assert.equal(choices[0].product.selectedSize, '8');
  assert.equal(choices[0].product.selectedColorName, 'Gold');
  assert.equal(choices[0].product.salePrice, 4500);
  assert.deepEqual(choices[0].product.images, ['gold.webp']);
});
test('fully reserved stock and rings without a selectable size cannot enter a bundle', () => {
  assert.deepEqual(getBundleChoices([{ name: 'Ring', category: 'Rings', stock: 3 }], 'ring'), []);
  assert.deepEqual(getBundleChoices([{ name: 'Band', category: 'Bands', stock: 3, reservedStock: 3 }], 'band'), []);
});
