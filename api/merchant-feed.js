import { generateMerchantFeedXML, generateMerchantFeedCSV } from '../utils/generateMerchantFeed.js';
import { setMerchantFeedAuthChallenge, verifyMerchantFeedAuth } from '../utils/merchantFeedAuth.js';

export default async function handler(req, res) {
  try {
    if (!verifyMerchantFeedAuth(req.headers.authorization || '')) {
      setMerchantFeedAuthChallenge(res);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(401).send('Authentication required.');
      return;
    }

    const csv = req.query?.format === 'csv';
    const feed = await (csv ? generateMerchantFeedCSV() : generateMerchantFeedXML());
    res.setHeader('Content-Type', csv ? 'text/csv; charset=utf-8' : 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).end(feed);
  } catch (error) {
    console.error('Error generating merchant-feed.xml', error);
    res.status(500).send(`Error generating merchant feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
