import { getRemoteProducts } from '../utils/generateMerchantFeed.js';
import { getProductSlug, SITE_URL } from '../utils/productSeoData.js';

export default async function handler(req, res) {
  try {
    const id = String(req.query?.id || '');
    const products = await getRemoteProducts();
    const product = products.find((item) => String(item.id) === id);
    if (product) {
      return res.redirect(301, `${SITE_URL}/product/${encodeURIComponent(getProductSlug(product))}`);
    }
    return res.status(410).send('This legacy product URL has been permanently removed.');
  } catch (error) {
    console.error('Legacy product lookup failed', error);
    return res.status(503).send('Product information is temporarily unavailable. Please try again.');
  }
}
