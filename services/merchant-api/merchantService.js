import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const merchantId = process.env.GOOGLE_MERCHANT_ID || process.env.MERCHANT_ID || '';
const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://thefuturex.in').replace(/\/+$/, '');

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getAuthConfig = () => {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) {
    return { credentials: JSON.parse(credentialsJson) };
  }

  const localKeyFile = path.join(__dirname, 'service-account.json');
  if (fs.existsSync(localKeyFile)) {
    return { keyFile: localKeyFile };
  }

  throw new Error('Missing Google service account credentials.');
};

const auth = new google.auth.GoogleAuth({
  ...getAuthConfig(),
  scopes: ['https://www.googleapis.com/auth/content'],
});

const getClient = async () => {
  const client = await auth.getClient();
  return google.content({
    version: 'v2.1',
    auth: client,
  });
};

const getPrimaryImage = (product) =>
  product.image ||
  product.imageLink ||
  product.images?.[0] ||
  product.colors?.find((color) => color.images?.length)?.images?.[0] ||
  product.variants?.find((variant) => variant.images?.length)?.images?.[0] ||
  '';

const toAbsoluteUrl = (value = '') => {
  const url = String(value).trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${siteUrl}${url}`;
  return `${siteUrl}/${url.replace(/^\/+/, '')}`;
};

const getProductPrice = (product) => {
  const price = Number(product.salePrice || product.price || product.mrp || 0);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid price for product ${product.id || product.name || 'unknown'}.`);
  }
  return String(price).replace(/,/g, '');
};

const getProductStock = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.reduce(
      (sum, variant) => sum + (variant.sizes || []).reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0),
      0
    );
  }
  return Number(product.stock || 0) - Number(product.reservedStock || 0);
};

const buildMerchantProduct = (product) => {
  if (!merchantId) throw new Error('Missing GOOGLE_MERCHANT_ID.');
  if (!product?.id) throw new Error('Product id is required for Merchant sync.');

  const imageLink = toAbsoluteUrl(getPrimaryImage(product));
  if (!imageLink || !/^https?:\/\//i.test(imageLink)) {
    throw new Error(`Product ${product.id} needs a public image URL.`);
  }

  const slug = product.slug || slugify(product.name || product.id);
  return {
    offerId: String(product.id),
    title: product.name || product.id,
    description: product.description || product.name || product.id,
    link: `${siteUrl}/product/${slug}`,
    imageLink,
    contentLanguage: 'en',
    targetCountry: 'IN',
    channel: 'online',
    availability: getProductStock(product) > 0 && product.inStock !== false ? 'in stock' : 'out of stock',
    condition: 'new',
    price: {
      value: getProductPrice(product),
      currency: 'INR',
    },
    brand: product.brand || 'FutureX',
  };
};

export const upsertProduct = async (product) => {
  const content = await getClient();
  const requestBody = buildMerchantProduct(product);
  const response = await content.products.insert({
    merchantId,
    requestBody,
  });

  return {
    id: response.data.id,
    offerId: response.data.offerId || requestBody.offerId,
    title: requestBody.title,
  };
};

export const syncAllProducts = async (products = []) => {
  const results = [];

  for (const product of products) {
    try {
      const synced = await upsertProduct(product);
      results.push({ ok: true, productId: product.id, synced });
    } catch (error) {
      results.push({
        ok: false,
        productId: product?.id || '',
        error: error instanceof Error ? error.message : 'Merchant sync failed.',
      });
    }
  }

  return results;
};

export const deleteProductFromMerchant = async (productId) => {
  if (!merchantId) throw new Error('Missing GOOGLE_MERCHANT_ID.');
  if (!productId) throw new Error('Product id is required for Merchant delete.');

  const content = await getClient();
  await content.products.delete({
    merchantId,
    productId: `online:en:IN:${productId}`,
  });

  return { productId };
};
