export const getProductStock = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const total = product.variants.reduce((sum, variant) => {
      if (Array.isArray(variant.sizes) && variant.sizes.length > 0) {
        return sum + variant.sizes.reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0);
      }
      return sum + Number(variant.stock || 0);
    }, 0);
    const reserved = Array.isArray(product.colors) && product.colors.length
      ? product.colors.reduce((sum, color) => sum + Number(color.reservedStock || 0), 0)
      : Number(product.reservedStock || 0);
    return Math.max(0, total - reserved);
  }

  if (Array.isArray(product.colors) && product.colors.length > 0) {
    return product.colors.reduce((sum, color) => sum + Number(color.stock || 0) - Number(color.reservedStock || 0), 0);
  }

  return Number(product.stock || 0) - Number(product.reservedStock || 0);
};

