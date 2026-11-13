import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({ entryPoints: ['utils/analyticsReport.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { enrichAnalyticsCustomers, buildLocationCsv, downloadLocationCsv } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const event = (extra = {}) => ({ id: 'cart', sessionId: 'session-1', event: 'add_to_cart', timestamp: '2026-11-13T10:00:00Z', ...extra });

test('cart identity resolves recorded accounts and later login details without matching shared IPs', () => {
  const events = [event({ userId: 'customer' }), event({ id: 'login', event: 'login', timestamp: '2026-11-13T10:01:00Z', userId: 'customer', userEmail: 'person@example.test' }), event({ id: 'guest', sessionId: 'session-2', ipAddress: '1.2.3.4' })];
  const rows = enrichAnalyticsCustomers(events, [{ id: 'customer', name: 'Customer Name', email: 'person@example.test', phone: '9876543210' }]);
  assert.equal(rows[0].userName, 'Customer Name');
  assert.equal(rows[0].userPhone, '9876543210');
  assert.equal(rows[2].userEmail, undefined);
  assert.equal(events[0].userName, undefined);
});

test('switching accounts does not reuse the previous account contact', () => {
  const rows = enrichAnalyticsCustomers([
    event({ userId: 'one', userPhone: '111', userEmail: 'one@example.test' }),
    event({ id: 'next', timestamp: '2026-11-13T10:01:00Z', userId: 'two', userEmail: 'two@example.test' }),
  ], []);
  assert.equal(rows[0].userEmail, 'one@example.test');
  assert.equal(rows[1].userPhone, undefined);
});

test('CSV includes all filtered rows, preserves unicode and escapes spreadsheet formulas, quotes and line breaks', () => {
  const rows = Array.from({ length: 100 }, (_, index) => event({ id: String(index), city: 'पुणे', productName: 'Fan, "Pro"\nBlue', userName: '=HYPERLINK("bad")', userPhone: '+919876543210', quantity: 2 }));
  const csv = buildLocationCsv(rows);
  assert.ok(csv.startsWith('\uFEFF"Time (IST)"'));
  assert.equal(csv.split('"add_to_cart"').length - 1, 100);
  assert.ok(csv.includes('"Fan, ""Pro""\nBlue"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('पुणे'));
  assert.ok(csv.includes('"\'+919876543210"'));
});

test('download creates a CSV file, clicks its link and cleans up', async () => {
  const calls = [];
  const originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const link = { click: () => calls.push('click'), remove: () => calls.push('remove') };
  globalThis.document = { createElement: () => link, body: { appendChild: () => calls.push('append') } };
  URL.createObjectURL = blob => { assert.equal(blob.type, 'text/csv;charset=utf-8;'); return 'blob:report'; };
  URL.revokeObjectURL = url => calls.push(url);
  try {
    downloadLocationCsv([event()]);
    assert.match(link.download, /^futurex-location-analytics-.*\.csv$/);
    assert.equal(link.href, 'blob:report');
    assert.deepEqual(calls, ['append', 'click', 'remove']);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(calls.at(-1), 'blob:report');
  } finally {
    globalThis.document = originalDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});
