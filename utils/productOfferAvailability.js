import { getProductStock } from './productAvailability.js';
import { slugify } from './productSeoData.js';

export const getMerchantAvailability = (product) => {
  const rawAvailability = String(product.availability || product.availabilityStatus || '').trim().toLowerCase();
  const normalized = rawAvailability.split('/').pop()?.replace(/[^a-z]/g, '') || '';
  if (['instock', 'outofstock', 'preorder', 'backorder'].includes(normalized)) {
    return normalized === 'instock' ? 'in_stock' : normalized === 'outofstock' ? 'out_of_stock' : normalized;
  }
  return getProductStock(product) > 0 && product.inStock !== false ? 'in_stock' : 'out_of_stock';
};

export const getColorVariants = (product) => {
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variations = Array.isArray(product.variations) ? product.variations : [];
  const names = [
    ...colors.map((color) => typeof color === 'string' ? color : color?.name),
    ...variants.map((variant) => variant?.colorName || variant?.color),
    ...variations.map((variation) => variation?.color),
  ].map((name) => String(name || '').trim());
  const namesBySlug = new Map(names.map((name) => [slugify(name), name]));
  namesBySlug.delete('');
  return [...namesBySlug].map(([key, name]) => {
    const color = colors.find((item) => slugify(typeof item === 'string' ? item : item?.name) === key);
    const variant = variants.find((item) => slugify(item?.colorName || item?.color) === key);
    const legacy = variations.filter((item) => slugify(item?.color) === key);
    const sizeStock = variant?.sizes?.length ? variant.sizes.reduce((sum, row) => sum + Number(row.stock || 0), 0) : undefined;
    const inventory = sizeStock ?? color?.stock ?? variant?.stock ?? legacy.reduce((sum, row) => sum + Number(row.stock || 0), 0);
    const stock = product.inStock === false ? 0 : Math.max(0, Number(inventory) - Number(color?.reservedStock || 0));
    const images = [color?.images, product.imagesByColor?.[name], variant?.images, legacy.flatMap((row) => row.images || [])]
      .find((value) => Array.isArray(value) && value.length) || [];
    return { name: color?.name || variant?.colorName || name, slug: key, stock, images: images.flat(Infinity) };
  });
};

