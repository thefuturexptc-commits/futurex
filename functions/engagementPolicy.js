const eligibleCart = cart => Boolean(cart?.consent === true && !cart.completed && Array.isArray(cart.items) && cart.items.length > 0);
const buildReviewMessage = (order, site) => ({
  subject: 'How was your TheFutureX order?',
  text: `Your order ${order.id || ''} has been delivered. Share an honest review and, if you like, a product photo.\n\n${[...new Map((order.items || []).map(item => [item.id, item])).values()].map(item => `${item.name}: ${site}/product/${encodeURIComponent(item.slug || item.id)}#reviews`).join('\n')}\n\nThanks for helping other shoppers. This is a one-time request for your delivered order.`,
});
module.exports = { eligibleCart, buildReviewMessage };
