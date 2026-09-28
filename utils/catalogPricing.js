// Shared by checkout, storefront metadata, and Merchant feeds.
export const PUREAIR_3_IN_1_MRP = 15000;
export const PUREAIR_3_IN_1_SALE_PRICE = 13500;
export const isPureAirThreeInOne = (item) => {
    if (item.slug)
        return item.slug === 'tfx-pureair-3-in-1';
    return /\bpureair\s*3[\s-]*in[\s-]*1\b|\btfx[\s-]*tp02\s+3[\s-]*in[\s-]*1\b/i.test(item.name);
};
export const TFX5_AI_BAND_PRICE = 9999;
export const formatInrAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
})}`;
export const isTfxV5Band = (item) => {
    const category = String(item.category || '').toLowerCase();
    const name = String(item.name || '');
    return category.includes('band') && /\btfx\s*v?5\b|\btfx5\b|\bai\s*v5\b|\bv5\b/i.test(name);
};
export const getOfferBaseUnitPrice = (item) => {
    if (isPureAirThreeInOne(item))
        return PUREAIR_3_IN_1_SALE_PRICE;
    if (isTfxV5Band(item))
        return TFX5_AI_BAND_PRICE;
    const salePrice = Number(item.salePrice || 0);
    const regularPrice = Number(item.price || 0);
    return salePrice > 0 ? salePrice : regularPrice;
};
export const isFanOfferItem = (item) => {
    const text = `${item.category || ''} ${item.name || ''}`.toLowerCase();
    return text.includes('fan');
};
export const isWearableOfferItem = (item) => {
    const text = `${item.category || ''} ${item.name || ''}`.toLowerCase();
    return text.includes('ring') || text.includes('band');
};
export const getAutomaticOfferRateForItem = (item) => {
    if (isPureAirThreeInOne(item))
        return 0;
    if (isTfxV5Band(item))
        return 0;
    if (isFanOfferItem(item))
        return 0.1;
    if (isWearableOfferItem(item))
        return 0.05;
    return 0;
};
export const getAutomaticOfferRateLabel = (rate) => `${Math.round(rate * 100)}%`;
export const getAutomaticOfferItemPricing = (item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = getOfferBaseUnitPrice(item);
    const lineSubtotal = Number((unitPrice * quantity).toFixed(2));
    const rate = getAutomaticOfferRateForItem(item);
    const discount = Number((lineSubtotal * rate).toFixed(2));
    const lineTotal = Number(Math.max(0, lineSubtotal - discount).toFixed(2));
    const unitDiscount = Number((unitPrice * rate).toFixed(2));
    const unitOfferPrice = Number(Math.max(0, unitPrice - unitDiscount).toFixed(2));
    return {
        rate,
        rateLabel: getAutomaticOfferRateLabel(rate),
        unitPrice,
        unitDiscount,
        unitOfferPrice,
        discount,
        lineSubtotal,
        lineTotal,
    };
};

// Use the saved selling price before discounts, never an invented comparison price.
export const getCatalogOffer = (product) => {
    const pricing = getAutomaticOfferItemPricing(product);
    const currentPrice = pricing.unitOfferPrice;
    const regularPrice = Math.max(Number(product.price || 0), pricing.unitPrice);
    return { currentPrice, regularPrice, onSale: currentPrice > 0 && regularPrice > currentPrice };
};
