import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { productToAnalyticsItem, pushDataLayerEvent } from '../services/analytics';
import { calculateAutomaticOfferSummary, getOfferBaseUnitPrice } from '../utils/coupons';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, options?: { openCart?: boolean }) => void;
  removeFromCart: (productId: string, selectedColorName?: string, price?: number, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColorName?: string, price?: number, selectedSize?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  productOfferDiscount: number;
  productOfferTotal: number;
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

const readStoredCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem('aura_cart');
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem('aura_cart');
    return [];
  }
};

const readStoredCouponCode = (): string => {
  return '';
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCartItems());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState(() => readStoredCouponCode());

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

  const addToCart = (product: Product, quantity = 1, options: { openCart?: boolean } = {}) => {
    const normalizedPrice = getOfferBaseUnitPrice(product);
    const normalizedProduct = { ...product, price: normalizedPrice, salePrice: normalizedPrice };

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

    if (options.openCart !== false) {
      setIsCartOpen(true);
    }
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
  const productOfferSummary = calculateAutomaticOfferSummary(items);
  const totalPrice = productOfferSummary.subtotal;
  const productOfferDiscount = productOfferSummary.discount;
  const productOfferTotal = productOfferSummary.total;
  const couponDiscount = 0;
  const discountedTotal = productOfferTotal;

  const applyCoupon = (code: string) => {
    return { ok: true, message: 'Offers are applied automatically.' };
  };

  const removeCoupon = () => setCouponCode('');

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, productOfferDiscount, productOfferTotal, couponCode, couponDiscount, discountedTotal, applyCoupon, removeCoupon, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
