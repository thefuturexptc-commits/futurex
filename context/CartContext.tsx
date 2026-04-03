import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, selectedColorName?: string, price?: number) => void;
  updateQuantity: (productId: string, quantity: number, selectedColorName?: string, price?: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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
  }, []);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    const normalizedPrice = Number(product.salePrice ?? product.price ?? 0);
    const normalizedProduct = { ...product, price: normalizedPrice };

    setItems(prev => {
      const existing = prev.find(item =>
        item.id === normalizedProduct.id &&
        (item.selectedColorName || '') === (normalizedProduct.selectedColorName || '') &&
        Number(item.price) === normalizedPrice
      );
      if (existing) {
        return prev.map(item =>
          item.id === existing.id &&
          (item.selectedColorName || '') === (existing.selectedColorName || '') &&
          Number(item.price) === Number(existing.price)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity }];
    });

    setIsCartOpen(true);
  };

  const isSameVariant = (item: CartItem, id: string, colorName?: string, price?: number) =>
    item.id === id &&
    (colorName === undefined || (item.selectedColorName || '') === (colorName || '')) &&
    (price === undefined || Number(item.price) === Number(price));

  const removeFromCart = (productId: string, selectedColorName?: string, price?: number) => {
    setItems(prev => prev.filter(item => !isSameVariant(item, productId, selectedColorName, price)));
  };

  const updateQuantity = (productId: string, quantity: number, selectedColorName?: string, price?: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item =>
      isSameVariant(item, productId, selectedColorName, price) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};