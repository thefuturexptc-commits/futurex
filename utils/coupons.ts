import type { CartItem } from '../types';

export const TFX_COUPON_CODE = 'WELCOME';
export const SURPRISE_COUPON_CODE = 'SURPRISE';
export const FAN_OFFER_COUPON_CODE = 'NEW10';
export const WEARABLE_OFFER_COUPON_CODE = 'NEW5';
export const SUPPORTED_COUPON_CODES = [TFX_COUPON_CODE, SURPRISE_COUPON_CODE, FAN_OFFER_COUPON_CODE, WEARABLE_OFFER_COUPON_CODE, 'TFXSAVE'];
export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

type OfferPricedItem = Pick<CartItem, 'category' | 'name'> & Partial<Pick<CartItem, 'price' | 'salePrice' | 'quantity'>>;

export const TFX5_AI_BAND_PRICE = 9999;

export const formatInrAmount = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
})}`;

export const isTfxV5Band = (item: Pick<CartItem, 'category' | 'name'>) => {
  const category = String(item.category || '').toLowerCase();
  const name = String(item.name || '');
  return category.includes('band') && /\btfx\s*v?5\b|\btfx5\b|\bai\s*v5\b|\bv5\b/i.test(name);
};

export const getOfferBaseUnitPrice = (item: OfferPricedItem) => {
  if (isTfxV5Band(item)) return TFX5_AI_BAND_PRICE;
  const salePrice = Number(item.salePrice || 0);
  const regularPrice = Number(item.price || 0);
  return salePrice > 0 ? salePrice : regularPrice;
};

export const isFanOfferItem = (item: Pick<CartItem, 'category' | 'name'>) => {
  const text = `${item.category || ''} ${item.name || ''}`.toLowerCase();
  return text.includes('fan');
};

export const isWearableOfferItem = (item: Pick<CartItem, 'category' | 'name'>) => {
  const text = `${item.category || ''} ${item.name || ''}`.toLowerCase();
  return text.includes('ring') || text.includes('band');
};

export const getAutomaticOfferRateForItem = (item: Pick<CartItem, 'category' | 'name'>) => {
  if (isTfxV5Band(item)) return 0;
  if (isFanOfferItem(item)) return 0.1;
  if (isWearableOfferItem(item)) return 0.05;
  return 0;
};

export const getAutomaticOfferRateLabel = (rate: number) => `${Math.round(rate * 100)}%`;

export const getAutomaticOfferItemPricing = (item: OfferPricedItem) => {
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

export const calculateAutomaticOfferSummary = (items: OfferPricedItem[]) => {
  const subtotal = Number(items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1);
    return sum + getOfferBaseUnitPrice(item) * quantity;
  }, 0).toFixed(2));
  const discount = Number(items.reduce((sum, item) => sum + getAutomaticOfferItemPricing(item).discount, 0).toFixed(2));
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));

  return {
    subtotal,
    discount,
    total,
    hasEligibleItems: discount > 0,
  };
};

export const getPrepaidDiscountForItems = (items: Pick<CartItem, 'category' | 'name'>[], total: number) => {
  if (total <= 0 || items.length === 0) return 0;
  const hasFan = items.some(isFanOfferItem);
  return Math.min(hasFan ? 200 : 100, Math.floor(total));
};

export const getCouponRateForItem = (item: Pick<CartItem, 'category' | 'name'>, code = TFX_COUPON_CODE) => {
  const text = `${item.category || ''} ${item.name || ''}`.toLowerCase();
  if (isTfxV5Band(item)) return 0;

  const isRingOrBand = text.includes('ring') || text.includes('band');
  const isFan = text.includes('fan');
  const normalizedCode = normalizeCouponCode(code);
  if (normalizedCode === SURPRISE_COUPON_CODE) {
    if (isRingOrBand) return 0.05;
    if (isFan) return 0.1;
    return 0;
  }
  if (normalizedCode === FAN_OFFER_COUPON_CODE) return isFan ? 0.1 : 0;
  if (normalizedCode === WEARABLE_OFFER_COUPON_CODE) return isRingOrBand ? 0.05 : 0;
  if (text.includes('fan')) return 0.1;
  if (isRingOrBand) return 0.05;
  return 0;
};

export const getCouponRateLabel = (rate: number) => `${Math.round(rate * 100)}%`;
export const getOfferCouponCodeForItem = (item: Pick<CartItem, 'category' | 'name'>) => {
  if (getCouponRateForItem(item, FAN_OFFER_COUPON_CODE) > 0) return FAN_OFFER_COUPON_CODE;
  if (getCouponRateForItem(item, WEARABLE_OFFER_COUPON_CODE) > 0) return WEARABLE_OFFER_COUPON_CODE;
  return '';
};

export const isSupportedCouponCode = (code: string) => SUPPORTED_COUPON_CODES.includes(normalizeCouponCode(code));

export const getCouponItemPricing = (item: CartItem, code: string) => {
  const quantity = Number(item.quantity || 0);
  const lineSubtotal = Number(item.price || 0) * quantity;
  const rate = isSupportedCouponCode(code) ? getCouponRateForItem(item, code) : 0;
  const discount = Number((lineSubtotal * rate).toFixed(2));
  const lineTotal = Number(Math.max(0, lineSubtotal - discount).toFixed(2));

  return {
    rate,
    discount,
    lineSubtotal,
    lineTotal,
  };
};

export const calculateCouponSummary = (items: CartItem[], code: string) => {
  const isApplied = isSupportedCouponCode(code);
  const subtotal = Number(items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0).toFixed(2));
  const discount = isApplied
    ? Number(items.reduce((sum, item) => sum + getCouponItemPricing(item, code).discount, 0).toFixed(2))
    : 0;
  const eligibleSubtotal = isApplied
    ? Number(items.reduce((sum, item) => {
      const pricing = getCouponItemPricing(item, code);
      return pricing.rate > 0 ? sum + pricing.lineSubtotal : sum;
    }, 0).toFixed(2))
    : 0;
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));

  return {
    code: isApplied ? normalizeCouponCode(code) : '',
    subtotal,
    eligibleSubtotal,
    discount,
    total,
    hasEligibleItems: eligibleSubtotal > 0,
  };
};
