import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { productToAnalyticsItem, pushDataLayerEvent } from '../services/analytics';
import { calculateCouponSummary, isSupportedCouponCode, normalizeCouponCode } from '../utils/coupons';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, selectedColorName?: string, price?: number, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColorName?: string, price?: number, selectedSize?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  couponCode: string;
  couponDiscount: number;
  discountedTotal: number;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('aura_cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        localStorage.removeItem('aura_cart');
        setItems([]);
      }
    }
    const storedCoupon = localStorage.getItem('tfx_coupon_code');
    if (storedCoupon && isSupportedCouponCode(storedCoupon)) {
      setCouponCode(normalizeCouponCode(storedCoupon));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (couponCode) {
      localStorage.setItem('tfx_coupon_code', couponCode);
    } else {
      localStorage.removeItem('tfx_coupon_code');
    }
  }, [couponCode]);

  const addToCart = (product: Product, quantity = 1) => {
    const normalizedPrice = Number(product.salePrice ?? product.price ?? 0);
    const normalizedProduct = { ...product, price: normalizedPrice };

    setItems(prev => {
      const existing = prev.find(item =>
        item.id === normalizedProduct.id &&
        (item.selectedColorName || '') === (normalizedProduct.selectedColorName || '') &&
        (item.selectedSize || '') === (normalizedProduct.selectedSize || '') &&
        Number(item.price) === normalizedPrice
      );
      if (existing) {
        return prev.map(item =>
          item.id === existing.id &&
          (item.selectedColorName || '') === (existing.selectedColorName || '') &&
          (item.selectedSize || '') === (existing.selectedSize || '') &&
          Number(item.price) === Number(existing.price)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity }];
    });

    pushDataLayerEvent('add_to_cart', {
      ecommerce: {
        currency: 'INR',
        value: Number((normalizedPrice * quantity).toFixed(2)),
        items: [productToAnalyticsItem(normalizedProduct, quantity)],
      },
    });

    setIsCartOpen(true);
  };

  const isSameVariant = (item: CartItem, id: string, colorName?: string, price?: number, size?: string) =>
    item.id === id &&
    (colorName === undefined || (item.selectedColorName || '') === (colorName || '')) &&
    (size === undefined || (item.selectedSize || '') === (size || '')) &&
    (price === undefined || Number(item.price) === Number(price));

  const removeFromCart = (productId: string, selectedColorName?: string, price?: number, selectedSize?: string) => {
    setItems(prev => prev.filter(item => !isSameVariant(item, productId, selectedColorName, price, selectedSize)));
  };

  const updateQuantity = (productId: string, quantity: number, selectedColorName?: string, price?: number, selectedSize?: string) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item =>
      isSameVariant(item, productId, selectedColorName, price, selectedSize) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const couponSummary = calculateCouponSummary(items, couponCode);
  const couponDiscount = couponSummary.discount;
  const discountedTotal = couponSummary.total;

  const applyCoupon = (code: string) => {
    const normalized = normalizeCouponCode(code);
    if (!isSupportedCouponCode(normalized)) {
      return { ok: false, message: 'Invalid coupon code.' };
    }

    const summary = calculateCouponSummary(items, normalized);
    if (items.length === 0) {
      setCouponCode(normalized);
      return { ok: true, message: 'Coupon saved. Add an eligible product to see the discount.' };
    }

    if (!summary.hasEligibleItems) {
      return { ok: false, message: 'This coupon applies only on fans, rings, and bands.' };
    }

    setCouponCode(normalized);
    return { ok: true, message: 'Coupon applied.' };
  };

  const removeCoupon = () => setCouponCode('');

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, couponCode, couponDiscount, discountedTotal, applyCoupon, removeCoupon, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
