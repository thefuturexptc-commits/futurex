import { getProductStock } from './productAvailability.js';

export function getBundleChoices(products, family) {
  const pattern = family === 'ring' ? /\brings?\b/i : /\b(?:bands?|bracelets?)\b/i;
  return products.filter(product => product.inStock !== false && getProductStock(product) > 0 && pattern.test(`${product.category} ${product.name}`)).flatMap(product => {
    if (product.variants?.length) return product.variants.flatMap(variant => {
      const color = variant.colorName || variant.color;
      const colorRow = product.colors?.find(item => item.name === color);
      if (colorRow && colorRow.stock - (colorRow.reservedStock || 0) <= 0) return [];
      const base = { ...product, selectedColorName: color, selectedColorHex: variant.colorHex || variant.hex, images: variant.images?.length ? variant.images : product.images, price: variant.price || product.price, salePrice: variant.price || product.salePrice };
      if (variant.sizes?.length) return variant.sizes.filter(size => size.stock > 0).map(size => ({ label: `${product.name} · ${color || ''} · Size ${size.size}`, product: { ...base, selectedSize: size.size } }));
      if (family === 'ring' || Number(variant.stock || 0) <= 0) return [];
      return [{ label: `${product.name} · ${color || ''}`, product: base }];
    });
    if (family === 'ring') return [];
    if (product.colors?.length) return product.colors.filter(color => color.stock - (color.reservedStock || 0) > 0).map(color => ({ label: `${product.name} · ${color.name}`, product: { ...product, selectedColorName: color.name, selectedColorHex: color.hex, images: color.images?.length ? color.images : product.images } }));
    return [{ label: product.name, product }];
  });
}
