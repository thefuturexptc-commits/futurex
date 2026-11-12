import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const walk = value => value && typeof value === 'object' ? [value, ...Object.values(value).flatMap(walk)] : [];
const jsonLd = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(match => walk(JSON.parse(match[1])));
const metadata = (html, path) => {
  assert.match(html, /<title>[^<]+<\/title>/, `${path}: title`);
  assert.match(html, /<meta[^>]*name="description"[^>]*content="[^"]+"/, `${path}: description`);
  assert.match(html, /<link[^>]*rel="canonical"[^>]*href="https:\/\/thefuturex.in\//, `${path}: canonical`);
  assert.doesNotMatch(html, /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/, `${path}: indexable`);
};
const products = (await readdir('dist/product', { recursive: true })).filter(path => path.endsWith('index.html'));
assert.ok(products.length > 0, 'Generated product routes exist');
for (const path of products) {
  const html = await readFile(join('dist/product', path), 'utf8');
  metadata(html, path);
  const data = jsonLd(html);
  assert.ok(data.some(value => value['@type'] === 'Product'), `${path}: Product schema`);
  assert.ok(data.some(value => value['@type'] === 'Offer' && Number(value.price) > 0 && value.priceCurrency === 'INR' && /schema.org\/(InStock|OutOfStock|PreOrder|BackOrder)$/.test(value.availability)), `${path}: priced Offer and availability`);
  for (const rating of data.filter(value => value['@type'] === 'AggregateRating')) {
    assert.ok(Number(rating.reviewCount) > 0 && Number(rating.ratingValue) >= 1 && Number(rating.ratingValue) <= 5, `${path}: valid review rating`);
  }
}
const categories = ['smart-bands', 'smart-rings', 'bladeless-fan', 'smart-monitoring', 'shop', 'shop/all'];
for (const path of categories) {
  const html = await readFile(`dist/${path}/index.html`, 'utf8');
  metadata(html, path);
  assert.ok(jsonLd(html).some(value => value['@type'] === 'CollectionPage'), `${path}: CollectionPage schema`);
}
const blog = await readFile('dist/blog/index.html', 'utf8');
metadata(blog, 'blog');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert.ok(sitemap.includes('https://thefuturex.in/blog'), 'Blog appears in sitemap');
const home = await readFile('dist/index.html', 'utf8');
assert.ok(home.includes('href="/blog"'), 'Homepage contains a crawlable blog link');
console.log(`SEO audit passed: ${products.length} product routes, ${categories.length} category routes, blog metadata, sitemap and homepage link.`);
