import type { Product } from '../types';

export const normalizeCollectionKey = (value: string | undefined | null): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isSameCollection = (left: string | undefined | null, right: string | undefined | null): boolean => {
  const leftKey = normalizeCollectionKey(left);
  const rightKey = normalizeCollectionKey(right);
  return leftKey === rightKey || leftKey.replace(/\s/g, '') === rightKey.replace(/\s/g, '');
};

export const isNewArrivalProduct = (product: Product): boolean =>
  Boolean(product.isNewArrival || product.isFeatured);

export const isBestSellerProduct = (product: Product): boolean =>
  Boolean(product.isBestSeller) || Number(product.sold || 0) > 0 || Number(product.rating || 0) >= 4.4;

export const getEffectivePrice = (product: Product): number =>
  Number(product.salePrice || product.price || 0);
