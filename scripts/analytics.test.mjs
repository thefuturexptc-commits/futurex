import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { buildConversionFunnel, filterStorefrontEvents } from '../utils/analyticsPolicy.js';

const event = (name, session, time, extra = {}) => ({ id: `${session}_${time}`, event: name, sessionId: session, timestamp: new Date(time * 1000).toISOString(), pagePath: '/', ...extra });
test('historical admin sessions and known admin identities are excluded across the storefront', () => {
  const events = [event('page_view', 'owner', 1), event('page_view', 'owner', 2, { pagePath: '/admin?tab=analytics' }), event('page_view', 'staff', 3, { userId: 'admin-uid' }), event('page_view', 'customer', 4), event('page_view', 'mail', 5, { userEmail: 'THEFUTUREX.PTC@GMAIL.COM' })];
  assert.deepEqual(filterStorefrontEvents(events, [{ id: 'admin-uid', email: 'admin@example.test' }]).map(item => item.sessionId), ['customer']);
});
test('funnel counts ordered unique sessions and ignores duplicate/out-of-order steps', () => {
  const events = [event('page_view', 'a', 1), event('add_to_cart', 'a', 2), event('add_to_cart', 'a', 3), event('begin_checkout', 'a', 4), event('purchase', 'a', 5), event('purchase', 'a', 6), event('page_view', 'b', 1), event('begin_checkout', 'b', 2), event('add_to_cart', 'b', 3), event('purchase', 'b', 4), event('page_view', 'c', 8)];
  assert.deepEqual(buildConversionFunnel(events.reverse()), [3, 2, 1, 1]);
});

const bundle = await build({ entryPoints: ['services/analytics.ts'], bundle: true, write: false, platform: 'node', format: 'esm', define: { 'import.meta.env': '{}' }, plugins: [{ name: 'firebase-test-double', setup(builder) {
  builder.onResolve({ filter: /firebaseConfig|^firebase\/firestore$/ }, args => ({ path: args.path, namespace: 'test' }));
  builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `export const auth = globalThis.mockAuth; export const db = {}; export const doc = (...args) => args.slice(1).join('/'); export const setDoc = async (path, event) => { globalThis.savedEvents.push({ path, event }); };` }));
} }] });
let version = 0;
async function tracking(path = '/', storedUser = null) {
  const storage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) }; };
  globalThis.savedEvents = [];
  globalThis.mockAuth = { currentUser: null };
  globalThis.window = { localStorage: storage(), sessionStorage: storage(), location: { pathname: path, href: `https://example.test${path}` }, dataLayer: [] };
  if (storedUser) window.localStorage.setItem('aura_active_user', JSON.stringify(storedUser));
  globalThis.document = { title: 'Shop', referrer: '', head: { appendChild() {} }, createElement: () => ({}), getElementsByTagName: () => [{ parentNode: { insertBefore() {} } }] };
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text + `\n//${version++}`).toString('base64')}`);
}
test('no admin page, logged-in admin, or unresolved identity reaches any tracking sink', async () => {
  let analytics = await tracking('/admin');
  analytics.setAnalyticsIdentity(true, false);
  analytics.pushPageView('/admin', 'Admin');
  assert.equal(savedEvents.length, 0);
  assert.equal(window.dataLayer.length, 0);
  analytics = await tracking('/', { role: 'superadmin' });
  analytics.setAnalyticsIdentity(true, true);
  analytics.pushDataLayerEvent('add_to_cart', {});
  assert.equal(savedEvents.length, 0);
  analytics = await tracking();
  analytics.pushPageView('/', 'Shop');
  assert.equal(savedEvents.length, 0);
  analytics.setAnalyticsIdentity(true, true);
  assert.equal(savedEvents.length, 0);
});
test('customer events persist clean ecommerce data, preserve session, and deduplicate purchases', async () => {
  const analytics = await tracking();
  analytics.pushPageView('/', 'Shop');
  analytics.setAnalyticsIdentity(true, false);
  const payload = { ecommerce: { currency: 'INR', value: 2500, items: [{ item_id: 'band', item_name: 'Band', quantity: 1 }] } };
  analytics.pushDataLayerEvent('add_to_cart', payload);
  analytics.pushDataLayerEvent('begin_checkout', payload);
  analytics.pushDataLayerEvent('purchase', { ecommerce: { ...payload.ecommerce, transaction_id: 'order-1' } });
  analytics.pushDataLayerEvent('purchase', { ecommerce: { ...payload.ecommerce, transaction_id: 'order-1' } });
  assert.deepEqual(savedEvents.map(item => item.event.event), ['page_view', 'add_to_cart', 'begin_checkout', 'purchase']);
  assert.equal(new Set(savedEvents.map(item => item.event.sessionId)).size, 1);
  assert.equal(savedEvents[3].path, 'site_analytics/purchase_order-1');
  assert.equal(savedEvents[1].event.productId, 'band');
  assert.equal(Object.values(savedEvents[1].event).includes(undefined), false);
  assert.deepEqual(buildConversionFunnel(savedEvents.map(item => item.event)), [1, 1, 1, 1]);
});
test('admin login marks both current and legacy browser sessions for historical exclusion', async () => {
  const analytics = await tracking();
  window.localStorage.setItem('tfx_analytics_session_id', 'legacy-owner-session');
  mockAuth.currentUser = { uid: 'owner', isAnonymous: false };
  analytics.setAnalyticsIdentity(true, true);
  analytics.pushDataLayerEvent('purchase', { ecommerce: { transaction_id: 'admin-order' } });
  assert.equal(savedEvents.length, 2);
  assert.equal(savedEvents.every(item => item.path.startsWith('analytics_excluded_sessions/')), true);
  assert.equal(savedEvents.some(item => item.path.endsWith('legacy-owner-session')), true);
  assert.equal(window.dataLayer.length, 0);
});
