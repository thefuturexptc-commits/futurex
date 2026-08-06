import { generateSitemapXML } from '../utils/generateSitemap.js';

export default async function handler(_req, res) {
  try {
    const sitemap = await generateSitemapXML();
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).end(sitemap);
  } catch (error) {
    console.error('Error generating sitemap.xml', error);
    res.status(500).send(`Error generating sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
