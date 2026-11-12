const test = require('node:test');
const assert = require('node:assert/strict');
const { eligibleCart, buildReviewMessage } = require('../functions/engagementPolicy');
test('reminders stop when consent is withdrawn, cart is empty, or purchase completes', () => {
  const cart = { consent: true, completed: false, items: [{ id: 'ring', quantity: 1 }] };
  assert.equal(eligibleCart(cart), true);
  assert.equal(eligibleCart({ ...cart, consent: false }), false);
  assert.equal(eligibleCart({ ...cart, items: [] }), false);
  assert.equal(eligibleCart({ ...cart, completed: true }), false);
  assert.equal(eligibleCart(null), false);
});
test('review email links to every distinct ordered product and its photo review form', () => {
  const message = buildReviewMessage({ id: 'order-1', items: [{ id: 'ring', slug: 'smart-ring', name: 'Ring' }, { id: 'ring', slug: 'smart-ring', name: 'Ring' }, { id: 'band', name: 'Band' }] }, 'https://thefuturex.in');
  assert.match(message.text, /\/product\/smart-ring#reviews/);
  assert.match(message.text, /\/product\/band#reviews/);
  assert.equal(message.text.split('smart-ring#reviews').length, 2);
});
