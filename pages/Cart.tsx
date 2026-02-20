import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any futuristic gear yet.</p>
        <Link to="/shop/all">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-dark-surface p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center space-x-4">
              <img src={item.images[0]} alt={item.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
              
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.category}</p>
                <div className="font-bold text-primary-600 mt-1">₹{item.price}</div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                 <div className="flex items-center space-x-2 bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                   <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-white hover:bg-white dark:hover:bg-white/10 rounded shadow-sm">-</button>
                   <span className="w-8 text-center font-medium dark:text-white">{item.quantity}</span>
                   <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-white hover:bg-white dark:hover:bg-white/10 rounded shadow-sm">+</button>
                 </div>
                 <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-sm hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 h-fit sticky top-24">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h3>
           <div className="space-y-3 mb-6">
             <div className="flex justify-between text-gray-600 dark:text-gray-400">
               <span>Subtotal</span>
               <span>₹{totalPrice.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-600 dark:text-gray-400">
               <span>Tax (8%)</span>
               <span>₹{(totalPrice * 0.08).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-600 dark:text-gray-400">
               <span>Shipping</span>
               <span>Free</span>
             </div>
             <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
               <span>Total</span>
               <span>₹{(totalPrice * 1.08).toFixed(2)}</span>
             </div>
           </div>
           <Button className="w-full" size="lg" onClick={handleCheckout}>Proceed to Checkout</Button>
        </div>
      </div>
    </div>
  );
};
