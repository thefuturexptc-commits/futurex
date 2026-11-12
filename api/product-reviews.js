import { generateProductReviewFeed } from '../utils/generateProductReviewFeed.js';
import { verifyMerchantFeedAuth, setMerchantFeedAuthChallenge } from '../utils/merchantFeedAuth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  if (!verifyMerchantFeedAuth(req.headers.authorization || '')) {
    setMerchantFeedAuthChallenge(res);
    return res.status(401).send('Authentication required.');
  }
  try {
    const feed = await generateProductReviewFeed();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('X-Product-Review-Count', String(feed.count));
    return res.status(200).end(req.method === 'HEAD' ? '' : feed.xml);
  } catch (error) {
    console.error('Product review feed unavailable', error.code || error.message);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(503).send('Product reviews are temporarily unavailable. Please retry later.');
  }
}
