import React from 'react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart, items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={closeCart}
      ></div>

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="h-full w-full bg-white dark:bg-dark-surface shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-200 dark:border-white/10">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">Shopping Cart</h2>
            <button 
              onClick={closeCart}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <div>
                   <p className="text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</p>
                   <p className="text-gray-500 text-sm mt-1">Looks like you haven't added anything yet.</p>
                </div>
                <Button variant="outline" onClick={closeCart} className="mt-4">Continue Shopping</Button>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                    <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover object-center" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                        <h3>{item.name}</h3>
                        <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center border border-gray-300 dark:border-white/20 rounded-md">
                         <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">-</button>
                         <span className="px-2 font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">+</button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFromCart(item.id)}
                        className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-white/10 px-6 py-6 bg-gray-50 dark:bg-white/5">
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white mb-4">
                <p>Subtotal</p>
                <p>₹{totalPrice.toFixed(2)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
              <div className="space-y-3">
                 <Button className="w-full h-12 text-lg" onClick={handleCheckout}>Checkout</Button>
                 <Button variant="outline" className="w-full" onClick={closeCart}>Continue Shopping</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};