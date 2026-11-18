import type { Product } from '../types';
import { getFallbackProductImageUrl } from './productImageFallback.js';

/** Local, category-matched image used when a product has no usable image URL. */
export const getProductFallbackImage = (product: Pick<Product, 'category' | 'name'>): string => {
  return getFallbackProductImageUrl(product);
};

export const getProductThumbnail = (product: Product): string => {
  const images = [
    product.colors?.[0]?.images,
    product.images,
    ...(product.colors || []).slice(1).map((color) => color.images),
    ...(product.variants || []).map((variant) => variant.images),
  ].flatMap((group) => Array.isArray(group) ? group : []);
  return images.find((image) => typeof image === 'string' && image.trim())?.trim() || getProductFallbackImage(product);
};

export const applyProductImageFallback = (image: HTMLImageElement, product: Pick<Product, 'category' | 'name'>) => {
  const fallback = getProductFallbackImage(product);
  if (image.getAttribute('src') !== fallback) image.src = fallback;
};
