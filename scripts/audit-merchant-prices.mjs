import { writeFile } from 'node:fs/promises';
import { listMerchantProducts, getMerchantSyncConfig } from '../services/merchant-api/merchantService.js';

const site = getMerchantSyncConfig().siteUrl;
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const get = async (url, headers = {}) => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
};
const feedHeaders = process.env.MERCHANT_FEED_USERNAME && process.env.MERCHANT_FEED_PASSWORD
  ? { Authorization: `Basic ${Buffer.from(`${process.env.MERCHANT_FEED_USERNAME}:${process.env.MERCHANT_FEED_PASSWORD}`).toString('base64')}` }
  : {};

try {
  const feed = await get(`${site}/product-feed.xml`, feedHeaders);
  const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(match => {
    const field = name => decode(match[1].match(new RegExp(`<g:${name}>([\\s\\S]*?)</g:${name}>`))?.[1] || '');
    const [price, currency] = field('sale_price').trim() ? field('sale_price').split(' ') : field('price').split(' ');
    return { id: field('id'), link: field('link'), expectedPrice: Number(price), regularPrice: Number(field('price').split(' ')[0]), currency };
  });
  if (!items.length) throw new Error('The feed contains no product listings.');
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < items.length) {
      const item = items[next++];
      try {
        if (!Number.isFinite(item.expectedPrice) || item.expectedPrice <= 0 || item.currency !== 'INR') throw new Error('Invalid feed price or currency.');
        const html = await get(item.link);
        const nodes = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
          .flatMap(match => { try { const node = JSON.parse(match[1]); return Array.isArray(node) ? node : node['@graph'] || [node]; } catch { return []; } });
        const product = nodes.find(node => node['@type'] === 'Product');
        const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
        const actualPrice = offer?.price == null ? null : Number(offer.price);
        const specifications = [offer?.priceSpecification].flat().filter(Boolean);
        const regular = specifications.find(specification => specification.priceType?.endsWith('StrikethroughPrice'));
        const actualRegularPrice = regular?.price == null ? actualPrice : Number(regular.price);
        results.push({ ...item, actualPrice, actualRegularPrice, actualCurrency: offer?.priceCurrency || null, ok: actualPrice === item.expectedPrice && actualRegularPrice === item.regularPrice && offer?.priceCurrency === item.currency });
      } catch (error) {
        results.push({ ...item, ok: false, error: error.message });
      }
    }
  }));
  let merchant = null;
  if (process.argv.includes('--merchant')) {
    try {
      const products = await listMerchantProducts();
      const byId = new Map(products.filter(product => product.contentLanguage === 'en' && product.feedLabel === 'IN').map(product => [product.offerId, product]));
      merchant = items.map(item => {
        const product = byId.get(item.id);
        const attributes = product?.productAttributes;
        const price = attributes?.salePrice || attributes?.price;
        const actualPrice = price ? Number(price.amountMicros) / 1e6 : null;
        const actualRegularPrice = attributes?.price ? Number(attributes.price.amountMicros) / 1e6 : null;
        return { id: item.id, expectedPrice: item.expectedPrice, expectedRegularPrice: item.regularPrice, actualPrice, actualRegularPrice, ok: actualPrice === item.expectedPrice && actualRegularPrice === item.regularPrice && price?.currencyCode === item.currency, ...(product ? {} : { error: 'Listing not found in Merchant Center.' }) };
      });
    } catch (error) {
      merchant = { verified: false, error: error.message };
    }
  }
  const report = { checkedAt: new Date().toISOString(), site, feedListings: items.length, landingMatches: results.filter(result => result.ok).length, landingFailures: results.filter(result => !result.ok), merchant };
  const outputIndex = process.argv.indexOf('--output');
  if (outputIndex >= 0) {
    if (!process.argv[outputIndex + 1]) throw new Error('--output requires a file path.');
    await writeFile(process.argv[outputIndex + 1], JSON.stringify({ ...report, results }, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.landingFailures.length || (merchant && (!Array.isArray(merchant) || merchant.some(result => !result.ok)))) process.exitCode = 1;
} catch (error) {
  console.error(`Merchant price audit failed: ${error.message}`);
  process.exitCode = 1;
}
