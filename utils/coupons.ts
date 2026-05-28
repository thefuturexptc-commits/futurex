import type { CartItem } from '../types';

export const TFX_COUPON_CODE = 'WELCOME';
export const SURPRISE_COUPON_CODE = 'SURPRISE';
export const FAN_OFFER_COUPON_CODE = 'NEW10';
export const WEARABLE_OFFER_COUPON_CODE = 'NEW5';
export const SUPPORTED_COUPON_CODES = [TFX_COUPON_CODE, SURPRISE_COUPON_CODE, FAN_OFFER_COUPON_CODE, WEARABLE_OFFER_COUPON_CODE, 'TFXSAVE'];
const FEATURED_BAND_PRODUCT_SLUG = 'ai-v5-smart-band-heart-rate-spo2-fitness-tracker';

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();
const toCouponSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getCouponRateForItem = (item: Pick<CartItem, 'category' | 'name'>, code = TFX_COUPON_CODE) => {
  const text = `${item.category || ''} ${item.name || ''}`.toLowerCase();
  const isFeaturedBandProduct = toCouponSlug(item.name || '') === FEATURED_BAND_PRODUCT_SLUG;
  if (isFeaturedBandProduct) return 0;

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
export const getOfferCouponCodeForItem = (item: Pick<CartItem, 'category' | 'name'>) =>
  getCouponRateForItem(item, FAN_OFFER_COUPON_CODE) > 0 ? FAN_OFFER_COUPON_CODE : WEARABLE_OFFER_COUPON_CODE;

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
