import { writeFile } from 'node:fs/promises';
import { getRemoteProducts, generateMerchantFeedCSV, generateMerchantFeedXML } from '../utils/generateMerchantFeed.js';

const products = await getRemoteProducts();
await writeFile(new URL('../public/product-feed.csv', import.meta.url), await generateMerchantFeedCSV(products));
await writeFile(new URL('../public/product-feed.xml', import.meta.url), await generateMerchantFeedXML(products));
console.log('Generated XML and CSV feeds for ' + products.length + ' saved products.');
process.exit(0);
