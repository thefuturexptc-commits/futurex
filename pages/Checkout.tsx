import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, updateUserAddresses } from '../services/backend';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Address } from '../types';

export const Checkout: React.FC = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [address, setAddress] = useState<Omit<Address, 'id'>>({
    street: '',
    city: '',
    zip: '',
    country: ''
  });

  // Pre-fill address if user has saved addresses
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
        // Use the most recently added/updated address (or first one)
        const defaultAddress = user.addresses[0];
        setAddress({
            street: defaultAddress.street,
            city: defaultAddress.city,
            zip: defaultAddress.zip,
            country: defaultAddress.country
        });
    }
  }, [user]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const addressId = Date.now().toString();
      const finalAddress: Address = { ...address, id: addressId };

      // 1. Create Order
      const order = await createOrder(
        user.id,
        items,
        totalPrice * 1.08,
        finalAddress
      );

      // 2. Check if this address is already saved, if not, save it to profile
      const existingAddresses = user.addresses || [];
      const addressExists = existingAddresses.some(
          a => a.street.toLowerCase() === finalAddress.street.toLowerCase() && 
               a.zip === finalAddress.zip
      );

      if (!addressExists) {
          const newAddresses = [finalAddress, ...existingAddresses];
          await updateUserAddresses(user.id, newAddresses);
          updateUser({ ...user, addresses: newAddresses });
      }

      clearCart();
      // Redirect to success page
      navigate('/order-success', { state: { orderId: order.id } });
    } catch (error) {
      console.error(error);
      alert('Failed to place order. Please try again.');
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
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shipping Address</h2>
                {user.addresses && user.addresses.length > 0 && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Auto-filled from profile</span>
                )}
            </div>
            
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
          <p className="text-xs text-gray-500 text-center">Your address will be automatically saved to your profile for future orders.</p>
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
             <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₹{totalPrice.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax (8%)</span>
                <span>₹{(totalPrice * 0.08).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg pt-2 border-t border-gray-200 dark:border-white/10">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};