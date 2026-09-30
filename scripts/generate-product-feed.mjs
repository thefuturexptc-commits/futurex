import { writeFile } from 'node:fs/promises';
import { getRemoteProducts, generateMerchantFeedCSV, generateMerchantFeedXML } from '../utils/generateMerchantFeed.js';

const products = await getRemoteProducts();
if (products.length === 0) {
  throw new Error('No published products were loaded; refusing to replace the Merchant feed with an empty catalog.');
}

const csv = await generateMerchantFeedCSV(products);
await writeFile(new URL('../public/product-feed.csv', import.meta.url), csv);
await writeFile(new URL('../product-feed.csv', import.meta.url), csv);
await writeFile(new URL('../public/product-feed.xml', import.meta.url), await generateMerchantFeedXML(products));
console.log('Generated XML and CSV feeds for ' + products.length + ' saved products.');
process.exit(0);
