import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/backend';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const Checkout: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    zip: '',
    country: ''
  });

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await createOrder(
        user.id,
        items,
        totalPrice * 1.08,
        { ...address, id: Date.now().toString() }
      );
      clearCart();
      alert('Order placed successfully!');
      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center dark:text-white">Please log in to continue.</div>;
  if (items.length === 0) return <div className="p-10 text-center dark:text-white">Your cart is empty.</div>;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={handleOrder} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shipping Address</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</label>
              <input 
                required
                type="text" 
                value={address.street}
                onChange={(e) => setAddress({...address, street: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-white/5 dark:border-white/20 dark:text-white p-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                <input 
                  required
                  type="text" 
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-white/5 dark:border-white/20 dark:text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zip Code</label>
                <input 
                  required
                  type="text" 
                  value={address.zip}
                  onChange={(e) => setAddress({...address, zip: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-white/5 dark:border-white/20 dark:text-white p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <input 
                required
                type="text" 
                value={address.country}
                onChange={(e) => setAddress({...address, country: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-white/5 dark:border-white/20 dark:text-white p-2"
              />
            </div>
          </div>
          
          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            Place Order (₹{(totalPrice * 1.08).toFixed(2)})
          </Button>
        </form>

        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl h-fit">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Order</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden">
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{item.name} x {item.quantity}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-white/10 mt-6 pt-4 space-y-2">
             <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg">
                <span>Total</span>
                <span>₹{(totalPrice * 1.08).toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
