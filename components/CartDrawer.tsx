import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, total } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };
  
  const handleViewCart = () => {
      closeCart();
      navigate('/cart');
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-start"> 
      {/* Changed justify-end to justify-start for left side slide as requested */}
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={closeCart}
      />
      
      {/* Drawer - Slide in from Left */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-left">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Shopping Cart
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p>Your cart is empty</p>
              <Button variant="outline" onClick={closeCart}>Continue Shopping</Button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 line-clamp-1">{item.name}</h4>
                  <p className="text-primary font-bold text-sm">₹{item.price.toLocaleString()}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                    <div className="flex-1"></div>
                    <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleViewCart}>View Cart</Button>
                <Button onClick={handleCheckout}>Checkout</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};