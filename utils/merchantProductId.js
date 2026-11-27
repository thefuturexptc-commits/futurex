import { slugify } from './productSeoData.js';

const hashString = (value = '') => {
  let hash = 5381;
  for (const char of String(value)) {
    hash = ((hash << 5) + hash + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36);
};

export const getMerchantProductId = (product) => {
  const source = String(product.id || product.slug || product.name || 'item');
  const normalized = slugify(source) || 'item';
  if (normalized.length <= 50) return normalized;

  const suffix = hashString(source);
  const prefixLength = Math.max(1, 49 - suffix.length);
  const prefix = normalized.slice(0, prefixLength).replace(/-+$/, '') || 'item';
  return `${prefix}-${suffix}`;
};

export const getVariantProductId = (product, variant) => getMerchantProductId({
  ...product,
  id: `${product.id || product.slug || product.name}-${variant.slug}`,
});
