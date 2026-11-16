import { getCatalogOffer } from './catalogPricing.js';

// The feed and direct API submissions must use the same offer as the storefront.
export const getMerchantPricing = (product) => {
  const offer = getCatalogOffer(product);
  if (!Number.isFinite(offer.currentPrice) || offer.currentPrice <= 0 ||
      !Number.isFinite(offer.regularPrice) || offer.regularPrice <= 0 || offer.regularPrice < offer.currentPrice) {
    throw new Error(`Product ${product.id || product.slug || 'unknown'} has an invalid Merchant price. Save a positive selling price before exporting or syncing.`);
  }
  return offer;
};
