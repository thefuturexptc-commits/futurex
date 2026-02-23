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
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  const [address, setAddress] = useState<Omit<Address, 'id'>>({
    street: '',
    city: '',
    zip: '',
    country: ''
  });

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
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

    const addressId = Date.now().toString();
    const finalAddress: Address = { ...address, id: addressId };

    try {
      // ✅ COD FLOW
      if (paymentMethod === 'cod') {
        const order = await createOrder(
          user.id,
          items,
          totalPrice,
          finalAddress
        );

        await saveAddressIfNeeded(finalAddress);
        clearCart();
        navigate('/order-success', { state: { orderId: order.id } });
        return;
      }

      // ✅ ONLINE PAYMENT FLOW
     const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,

  // ✅ safer amount conversion
  amount: Number((totalPrice * 100).toFixed(0)),

  currency: "INR",
  name: "FutureX",
  description: "Order Payment",

  handler: async function (response: any) {
    const order = await createOrder(
      user.id,
      items,
      totalPrice,
      finalAddress
    );

    await saveAddressIfNeeded(finalAddress);
    clearCart();
    navigate('/order-success', { state: { orderId: order.id } });
  },

  modal: {
    ondismiss: function () {
      setLoading(false);
      alert("Payment cancelled");
    }
  },

  prefill: {
    name: user.name,
    email: user.email
  },

  theme: {
    color: "#6366f1"
  }
};

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error(error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveAddressIfNeeded = async (finalAddress: Address) => {
    const existingAddresses = user?.addresses || [];

    const addressExists = existingAddresses.some(
      a =>
        a.street.toLowerCase() === finalAddress.street.toLowerCase() &&
        a.zip === finalAddress.zip
    );

    if (!addressExists && user) {
      const newAddresses = [finalAddress, ...existingAddresses];
      await updateUserAddresses(user.id, newAddresses);
      updateUser({ ...user, addresses: newAddresses });
    }
  };

  if (!user) return <div className="p-10 text-center dark:text-white">Please log in to continue.</div>;
  if (items.length === 0) return <div className="p-10 text-center dark:text-white">Your cart is empty.</div>;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <form onSubmit={handleOrder} className="space-y-6">

          {/* Shipping Address */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Shipping Address
            </h2>

            <input required type="text" placeholder="Street"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:bg-white/5 dark:text-white p-2"
            />

            <div className="grid grid-cols-2 gap-4">
              <input required type="text" placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:bg-white/5 dark:text-white p-2"
              />

              <input required type="text" placeholder="Zip Code"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:bg-white/5 dark:text-white p-2"
              />
            </div>

            <input required type="text" placeholder="Country"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:bg-white/5 dark:text-white p-2"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method
            </h2>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                />
                <span className="text-sm dark:text-white">Online Payment</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span className="text-sm dark:text-white">Cash on Delivery</span>
              </label>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            Place Order (₹{totalPrice.toFixed(2)})
          </Button>

        </form>

        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-xl h-fit">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Order
          </h2>

          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <span>{item.name} x {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <div className="border-t mt-4 pt-4 font-bold text-lg flex justify-between">
            <span>Total</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};