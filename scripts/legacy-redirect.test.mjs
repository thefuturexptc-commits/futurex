import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { getLegacyPageDestination } from '../api/legacy-page.js';

test('WordPress page redirects remove page_id and preserve campaign attribution', () => {
  assert.equal(getLegacyPageDestination('/?page_id=5'), 'https://thefuturex.in/');
  assert.equal(getLegacyPageDestination('/index.php?page_id=5&utm_source=backlink'), 'https://thefuturex.in/?utm_source=backlink');
  assert.equal(getLegacyPageDestination('/?page_id=99'), null);
  assert.equal(getLegacyPageDestination('/'), null);
  assert.equal(getLegacyPageDestination(getLegacyPageDestination('/?page_id=5')), null);
});

test('legacy endpoint returns a permanent redirect to the canonical host', () => {
  const headers = {};
  const res = { setHeader: (key, value) => { headers[key] = value; }, status(code) { this.statusCode = code; return this; }, end() {} };
  handler({ url: '/?page_id=5' }, res);
  assert.equal(res.statusCode, 301);
  assert.equal(headers.Location, 'https://thefuturex.in/');
});
