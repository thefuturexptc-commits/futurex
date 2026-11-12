import { getRemoteProducts, getMerchantReviewSkus } from './generateMerchantFeed.js';
import { getSchemaReviews } from './productSchema.js';
import { getProductSlug } from './productSeoData.js';

const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));
const text = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export async function generateProductReviewFeed(products, { siteUrl = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://thefuturex.in' } = {}) {
  // Google replaces the entire previous feed. Never serve a partial feed on a
  // review read failure, which would accidentally remove previously sent reviews.
  products ??= await getRemoteProducts({ includeReviews: true, requireReviews: true });
  siteUrl = siteUrl.replace(/\/+$/, '');
  const reviews = [];
  const seen = new Set();
  for (const product of products) {
    const url = `${siteUrl}/product/${encodeURIComponent(getProductSlug(product))}`;
    for (const review of getSchemaReviews(product.reviews)) {
      if (!review.id || !Number.isFinite(Date.parse(review.date || ''))) throw new Error(`Review feed needs a saved ID and date for product ${product.id}.`);
      const id = `${product.id}:${review.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const gtin = product.gtin || product.barcode;
      const mpn = product.mpn || product.manufacturerPartNumber;
      const brand = product.brand || process.env.MERCHANT_FEED_BRAND || 'TheFutureX';
      const photos = (review.images || []).filter(image => /^https?:\/\//i.test(image));
      reviews.push(`    <review>
      <review_id>${xml(id)}</review_id>
      <reviewer><name>${xml(text(review.name))}</name></reviewer>
      ${review.verifiedBuyer === true ? '<is_verified_purchase>true</is_verified_purchase>' : ''}
      <review_timestamp>${new Date(review.date).toISOString()}</review_timestamp>
      <content>${xml(text(review.comment))}</content>
      <review_url type="group">${xml(`${url}#reviews`)}</review_url>
      ${photos.length ? `<reviewer_images>${photos.map(image => `<reviewer_image><url>${xml(image)}</url></reviewer_image>`).join('')}</reviewer_images>` : ''}
      <ratings><overall min="1" max="5">${Number(review.rating)}</overall></ratings>
      <products><product>
        <product_ids>
          ${gtin ? `<gtins><gtin>${xml(gtin)}</gtin></gtins>` : ''}
          ${mpn ? `<mpns><mpn>${xml(mpn)}</mpn></mpns>` : ''}
          <skus>${getMerchantReviewSkus(product).map(sku => `<sku>${xml(sku)}</sku>`).join('')}</skus>
          <brands><brand>${xml(brand)}</brand></brands>
        </product_ids>
        <product_name>${xml(product.name)}</product_name>
        <product_url>${xml(url)}</product_url>
      </product></products>
    </review>`);
    }
  }
  return { count: reviews.length, xml: `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.4/product_reviews.xsd">
  <version>2.4</version>
  <publisher><name>TheFutureX</name></publisher>
  ${reviews.length ? `<reviews>\n${reviews.join('\n')}\n  </reviews>` : ''}
</feed>` };
}
