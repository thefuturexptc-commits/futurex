import type { Product } from '../types';
import { getFallbackProductImageUrl } from './productImageFallback.js';

/** Local, category-matched image used when a product has no usable image URL. */
export const getProductFallbackImage = (product: Pick<Product, 'category' | 'name'>): string => {
  return getFallbackProductImageUrl(product);
};
