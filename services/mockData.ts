import { Product } from '../types';
import { PRODUCT_ASSET_TOKENS, PRODUCT_CATALOG } from './productCatalog.js';

const resolveAssetImage = (image: string): string => {
  if (Object.values(PRODUCT_ASSET_TOKENS).includes(image as (typeof PRODUCT_ASSET_TOKENS)[keyof typeof PRODUCT_ASSET_TOKENS])) {
    return image;
  }

  return image;
};

export const INITIAL_PRODUCTS: Product[] = PRODUCT_CATALOG.map((product) => ({
  ...product,
  images: (product.images || []).map(resolveAssetImage),
  colors: (product.colors || []).map((color) => ({
    ...color,
    images: (color.images || []).map(resolveAssetImage),
  })),
})) as Product[];
