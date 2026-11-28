import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getRemoteCatalogCategories, getRemoteProducts, getRemoteProductWithReviews } from '../utils/generateMerchantFeed.js';
import { buildProductSeoRecord, getProductSlug, SITE_URL } from '../utils/productSeoData.js';
import { categoryPages, getCatalogCategoryPages } from '../utils/categorySeo.js';

const loadProductRenderer = () => process.env.VERCEL === '1'
  ? import(new URL('../dist/_catalog/server/renderProductPage.mjs', import.meta.url).href)
  : import('../utils/renderProductPage.js');
const loadCategoryRenderer = () => process.env.VERCEL === '1'
  ? import(new URL('../dist/_catalog/server/renderCategoryPage.mjs', import.meta.url).href)
  : import('../utils/renderCategoryPage.js');

export const findProductForRoute = (products, slug) =>
  products.find((item) => getProductSlug(item) === slug) ||
  products.find((item) => item.id === slug || item.seoPreviousSlugs?.includes(slug));

export default async function handler(req, res) {
  const slug = String(req.query?.slug || '');
  const color = String(req.query?.variant || '');
  const collection = slug ? '' : String(req.query?.collection || '');
  const category = collection ? 'shop/' + encodeURIComponent(collection) : slug ? '' : String(req.query?.category || '');
  const validSlug = /^[a-z\d][a-z\d_-]*$/i;
  res.setHeader('Cache-Control', 'private, no-store');
  if (collection === '.' || collection === '..') return res.status(404).send('Category not found.');
  if (category ? (!collection && !Object.hasOwn(categoryPages, category)) : !validSlug.test(slug) || (color && !validSlug.test(color))) {
    return res.status(404).send('Product not found.');
  }

  try {
    const [products, shell, categories, renderer] = await Promise.all([
      getRemoteProducts(),
      readFile(join(process.cwd(), 'dist/product-shell.html'), 'utf8'),
      category ? getRemoteCatalogCategories().catch((error) => {
        if (collection) throw error;
        return [];
      }) : [],
      category ? loadCategoryRenderer() : loadProductRenderer(),
    ]);
    if (category) {
      const catalog = products.map(buildProductSeoRecord).filter(Boolean);
      const pages = getCatalogCategoryPages(categories);
      const route = Object.keys(pages).find((path) => path.toLowerCase() === category.toLowerCase());
      if (!route) return res.status(404).send('Category not found.');
      if (route !== category) return res.redirect(301, SITE_URL + '/' + route);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderer.renderCategoryPage(shell, route, catalog, pages));
    }
    const product = findProductForRoute(products, slug);
    if (!product) return res.status(404).send('Product not found.');
    const canonicalSlug = getProductSlug(product);
    const html = renderer.renderProductPage(shell, await getRemoteProductWithReviews(product), color.toLowerCase());
    if (!html) return res.status(404).send('Product not found.');
    if (slug !== canonicalSlug || color !== color.toLowerCase()) {
      const requestUrl = new URL(req.url || '/', SITE_URL);
      if (requestUrl.pathname.startsWith('/api/')) {
        for (const parameter of ['slug', 'variant', 'category', 'collection']) requestUrl.searchParams.delete(parameter);
      }
      return res.redirect(301, SITE_URL + '/product/' + canonicalSlug + (color ? '/' + color.toLowerCase() : '') + requestUrl.search);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=30');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Live product page failed', error);
    try {
      const snapshot = category
        ? join(process.env.VERCEL === '1' ? '_catalog/categories' : '', category, 'index.html')
        : join(process.env.VERCEL === '1' ? '_catalog/products' : 'product', slug, color, 'index.html');
      const staticPage = await readFile(join(process.cwd(), 'dist', snapshot), 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(staticPage);
    } catch {
      res.setHeader('Retry-After', '60');
      return res.status(503).send('Product information is temporarily unavailable. Please try again.');
    }
  }
}
