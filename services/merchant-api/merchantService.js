import { getCustomerFacingPrice } from '../../utils/productSeoData.js';
import { isCatalogProductPublished } from '../../utils/catalogVisibility.js';
import { getCatalogOffer } from '../../utils/catalogPricing.js';
import { getProductStock } from '../../utils/productAvailability.js';
import { getMerchantProductId, getMerchantTitle, buildDescription } from '../../utils/generateMerchantFeed.js';
import { getFallbackProductImageUrl } from '../../utils/productImageFallback.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadLocalEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
};

// Vercel supplies environment variables directly; local development reads .env.local.
loadLocalEnvFile(path.resolve(process.cwd(), '.env.local'));

const merchantId = process.env.GOOGLE_MERCHANT_ID || process.env.MERCHANT_ID || '';
const siteUrl = (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://thefuturex.in').replace(/\/+$/, '');
const configuredDataSource = process.env.GOOGLE_MERCHANT_DATA_SOURCE || '';
let cachedDataSource = configuredDataSource;
let dataSourceInitialization = null;
let merchantApiRegistered = false;

const getAuthConfig = () => {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) return { credentials: JSON.parse(credentialsJson) };

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    const keyFile = path.isAbsolute(credentialsPath) ? credentialsPath : path.resolve(process.cwd(), credentialsPath);
    if (fs.existsSync(keyFile)) return { keyFile };
    throw new Error(`Google service account key file was not found at ${keyFile}.`);
  }

  const localKeyFile = path.join(__dirname, 'service-account.json');
  if (fs.existsSync(localKeyFile)) return { keyFile: localKeyFile };
  throw new Error('Missing Google service account credentials. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON.');
};

const auth = new google.auth.GoogleAuth({
  ...getAuthConfig(),
  scopes: ['https://www.googleapis.com/auth/content'],
});

const getAuthClient = () => auth.getClient();
const accountName = () => {
  if (!merchantId) throw new Error('Missing GOOGLE_MERCHANT_ID.');
  return `accounts/${merchantId}`;
};

const apiRequest = async ({ version, path: apiPath, method = 'GET', params, data }) => {
  const client = await getAuthClient();
  const response = await client.request({
    url: `https://merchantapi.googleapis.com/${version}/${apiPath}`,
    method,
    params,
    data,
  });
  return response.data;
};

const ensureProductDataSource = async () => {
  if (cachedDataSource) return cachedDataSource;
  if (dataSourceInitialization) return dataSourceInitialization;

  dataSourceInitialization = (async () => {
    const parent = accountName();
    let pageToken = '';
    do {
      const page = await apiRequest({
        version: 'datasources/v1',
        path: `${parent}/dataSources`,
        params: { pageSize: 1000, ...(pageToken ? { pageToken } : {}) },
      });
      const sources = page.dataSources || [];
      const primaryApiSource = sources.find((source) =>
        source.input === 'API' && source.primaryProductDataSource &&
        (!(source.primaryProductDataSource.countries || []).length ||
          source.primaryProductDataSource.countries.includes('IN'))
      );
      if (primaryApiSource?.name) {
        cachedDataSource = primaryApiSource.name;
        return cachedDataSource;
      }
      pageToken = page.nextPageToken || '';
    } while (pageToken);

    const created = await apiRequest({
      version: 'datasources/v1',
      path: `${parent}/dataSources`,
      method: 'POST',
      data: {
        displayName: 'TheFutureX API Product Listings',
        primaryProductDataSource: { countries: ['IN'] },
      },
    });
    if (!created.name) throw new Error('Merchant API created a data source but did not return its resource name.');
    cachedDataSource = created.name;
    return cachedDataSource;
  })();

  try {
    return await dataSourceInitialization;
  } finally {
    dataSourceInitialization = null;
  }
};

export const ensureMerchantDataSource = async () => ensureProductDataSource();

const registerMerchantApiProject = async (developerEmail) => {
  const email = String(developerEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A valid developer contact email is required for Merchant API registration.');
  }
  return apiRequest({
    version: 'accounts/v1',
    path: `${accountName()}/developerRegistration:registerGcp`,
    method: 'POST',
    data: { developerEmail: email },
  });
};

export const ensureMerchantApiRegistration = async (developerEmail) => {
  if (merchantApiRegistered) return { registeredNow: false };
  const registrationName = `${accountName()}/developerRegistration`;
  try {
    await apiRequest({ version: 'accounts/v1', path: registrationName });
    merchantApiRegistered = true;
    return { registeredNow: false };
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
  }
  await registerMerchantApiProject(developerEmail);
  merchantApiRegistered = true;
  return { registeredNow: true };
};

const slugify = (value = '') => String(value).trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const DISPLAY_PRO_OLD_SLUG = 'tfx-display-pro-smart-ring-premium-tracking-with-display-and-wireless-charging';
const getProductSlug = (product) => {
  const slug = slugify(product.slug || product.name || product.id);
  return slug === DISPLAY_PRO_OLD_SLUG ? 'tfx-display-pro-smart-ring' : slug;
};

const toAbsoluteUrl = (value = '') => {
  const url = String(value).trim();
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${siteUrl}${url}`;
  return `${siteUrl}/${url.replace(/^\/+/, '')}`;
};

const flattenImageValues = (value) => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenImageValues);
  if (typeof value === 'object') return Object.values(value).flatMap(flattenImageValues);
  return [];
};

const collectProductImages = (product) => {
  const values = [
    product.image, product.imageLink, product.additionalImageLink, product.additionalImageLinks,
    product.additional_image_link, product.additional_image_links,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.colors) ? product.colors.flatMap((color) => color.images || []) : []),
    ...(Array.isArray(product.variants) ? product.variants.flatMap((variant) => variant.images || []) : []),
    ...flattenImageValues(product.imagesByColor),
  ];
  const seen = new Set();
  return flattenImageValues(values).map(toAbsoluteUrl)
    .filter((url) => /^https?:\/\//i.test(url))
    .filter((url) => !seen.has(url) && seen.add(url));
};

const getSpec = (product, names) => {
  const specs = product.specs || {};
  const key = Object.keys(specs).find((candidate) => names.includes(candidate.toLowerCase()));
  return key ? String(specs[key] || '').trim() : '';
};

const getColors = (product) => [...new Set([
  ...(Array.isArray(product.colors) ? product.colors.map((color) => typeof color === 'string' ? color : color?.name) : []),
  ...(Array.isArray(product.variants) ? product.variants.map((variant) => variant?.color || variant?.colorName) : []),
].map((color) => String(color || '').trim()).filter(Boolean))];

const toMerchantPrice = (amount) => ({
  amountMicros: String(Math.round(Number(amount || 0) * 1_000_000)),
  currencyCode: 'INR',
});

const buildProductInput = (product) => {
  if (!isCatalogProductPublished(product)) throw new Error('This product is excluded from the published catalog.');
  if (!product?.id) throw new Error('Product id is required for Merchant sync.');
  const images = collectProductImages(product);
  const imageLink = images[0] || toAbsoluteUrl(getFallbackProductImageUrl(product));
  if (!imageLink) throw new Error(`Product ${product.id} needs a public image URL.`);

  const offer = getCatalogOffer(product);
  const stock = getProductStock(product);
  const productAttributes = {
    title: getMerchantTitle(product),
    description: buildDescription(product) || product.name || product.id,
    link: `${siteUrl}/product/${getProductSlug(product)}`,
    imageLink,
    availability: stock > 0 && product.inStock !== false ? 'IN_STOCK' : 'OUT_OF_STOCK',
    sellOnGoogleQuantity: String(Math.max(0, stock)),
    condition: 'NEW',
    price: toMerchantPrice(offer.regularPrice),
    brand: product.brand || 'TheFutureX',
  };

  const additionalImageLinks = images.filter((image) => image !== imageLink).slice(0, 10);
  if (additionalImageLinks.length) productAttributes.additionalImageLinks = additionalImageLinks;
  const category = product.googleProductCategory || product.google_product_category;
  if (category) productAttributes.googleProductCategory = category;
  const colors = getColors(product);
  if (colors.length) productAttributes.color = colors.join(' / ');
  const material = getSpec(product, ['material']);
  const size = getSpec(product, ['size']);
  if (material) productAttributes.material = material;
  if (size) productAttributes.size = size;
  const gtin = product.gtin || product.barcode;
  const mpn = product.mpn || product.manufacturerPartNumber;
  if (gtin) productAttributes.gtins = [String(gtin)];
  if (mpn) productAttributes.mpn = String(mpn);
  if (!gtin && !mpn) productAttributes.identifierExists = false;
  if (offer.onSale) productAttributes.salePrice = toMerchantPrice(getCustomerFacingPrice(product));

  return {
    offerId: getMerchantProductId(product),
    contentLanguage: 'en',
    feedLabel: 'IN',
    productAttributes,
  };
};

export const upsertProduct = async (product) => {
  if (!isCatalogProductPublished(product)) {
    await deleteProductFromMerchant(product.id);
    return { merchantId, removed: true, offerId: getMerchantProductId(product) };
  }
  const dataSource = await ensureProductDataSource();
  const requestBody = buildProductInput(product);
  const inserted = await apiRequest({
    version: 'products/v1',
    path: `${accountName()}/productInputs:insert`,
    method: 'POST',
    params: { dataSource },
    data: requestBody,
  });
  return {
    merchantId,
    dataSource,
    id: inserted.name,
    offerId: inserted.offerId || requestBody.offerId,
    title: requestBody.productAttributes.title,
    imageLink: requestBody.productAttributes.imageLink,
    imageCount: 1 + Number(requestBody.productAttributes.additionalImageLinks?.length || 0),
  };
};

export const syncAllProducts = async (products = []) => {
  const results = new Array(products.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < products.length) {
      const index = nextIndex++;
      const product = products[index];
      try {
        if (!isCatalogProductPublished(product)) {
          try {
            await deleteProductFromMerchant(product.id);
          } catch (error) {
            if (error?.response?.status !== 404) throw error;
          }
          results[index] = { ok: true, productId: product.id, deleted: true };
        } else {
          results[index] = { ok: true, productId: product.id, synced: await upsertProduct(product) };
        }
      } catch (error) {
        results[index] = {
          ok: false,
          productId: product?.id || '',
          error: error instanceof Error ? error.message : 'Merchant API sync failed.',
          status: error?.response?.status,
        };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, products.length) }, worker));
  return results;
};

export const getMerchantSyncConfig = () => ({
  merchantId,
  siteUrl,
  dataSource: cachedDataSource || null,
  hasServiceAccountJson: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  hasCredentialsPath: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  hasLocalKeyFile: fs.existsSync(path.join(__dirname, 'service-account.json')),
});

export const deleteProductFromMerchant = async (productId) => {
  if (!productId) throw new Error('Product id is required for Merchant delete.');
  const dataSource = await ensureProductDataSource();
  const offerId = getMerchantProductId({ id: productId });
  const encodedInputId = Buffer.from(`en~IN~${offerId}`).toString('base64url');
  try {
    await apiRequest({
      version: 'products/v1',
      path: `${accountName()}/productInputs/${encodedInputId}`,
      method: 'DELETE',
      params: { dataSource },
    });
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
  }
  return { productId, dataSource };
};
