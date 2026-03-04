import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { Address, CheckoutFlowState } from '../types';
import { createOrder, updateUserAddresses } from '../services/backend';

export const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const readPersistedFlow = (): CheckoutFlowState | null => {
    try {
      const raw = window.sessionStorage.getItem('checkout_flow_state');
      if (!raw) return null;
      return JSON.parse(raw) as CheckoutFlowState;
    } catch {
      return null;
    }
  };
  const flowState = (location.state as CheckoutFlowState | undefined) || readPersistedFlow() || undefined;
  const phone = flowState?.phone?.replace(/\D/g, '').slice(0, 10) || '';
  const verifiedPhone = window.sessionStorage.getItem('checkout_phone_verified') || '';

  const isPhoneVerified = Boolean(flowState?.phoneVerified && phone && verifiedPhone === phone);

  const addressForOrder = useMemo<Address | null>(() => {
    if (!flowState?.shippingDetails) return null;
    return {
      id: `addr_${Date.now()}`,
      street: flowState.shippingDetails.address,
      city: flowState.shippingDetails.city,
      zip: flowState.shippingDetails.pincode,
      country: `India, ${flowState.shippingDetails.state}`,
    };
  }, [flowState?.shippingDetails]);

  if (!flowState?.shippingDetails || !phone) {
    return <Navigate to="/checkout" replace />;
  }

  if (!isPhoneVerified) {
    return <Navigate to="/verify-phone" replace state={flowState} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!addressForOrder || items.length === 0) {
    return <Navigate to="/checkout" replace />;
  }

  const saveAddressIfNeeded = async (finalAddress: Address) => {
    const existingAddresses = user?.addresses || [];
    const addressExists = existingAddresses.some(
      (a) => a.street.toLowerCase() === finalAddress.street.toLowerCase() && a.zip === finalAddress.zip
    );

    if (!addressExists) {
      const newAddresses = [finalAddress, ...existingAddresses];
      await updateUserAddresses(user.id, newAddresses);
      updateUser({ ...user, addresses: newAddresses });
    }
  };

  const handlePayment = async () => {
    setError('');
    setLoading(true);

    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Number((totalPrice * 100).toFixed(0)),
        currency: 'INR',
        name: 'FutureX',
        description: 'Order Payment',
        prefill: {
          name: user.name,
          email: user.email,
          contact: flowState.shippingDetails.phoneNumber,
        },
        theme: { color: '#6366f1' },
        handler: async () => {
          const order = await createOrder(
            user.id,
            items,
            totalPrice,
            addressForOrder,
            {
              phoneNumber: flowState.shippingDetails.phoneNumber,
              paymentStatus: 'Paid',
              shippingDetails: flowState.shippingDetails,
            }
          );
          await saveAddressIfNeeded(addressForOrder);
          window.sessionStorage.removeItem('checkout_flow_state');
          window.sessionStorage.removeItem('checkout_phone_verified');
          clearCart();
          navigate('/order-success', { state: { orderId: order.id } });
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay SDK not loaded.');
      }

      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Checkout</h1>
      <CheckoutStepper current="payment" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 bg-white dark:bg-white/5 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment</h2>
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <p><span className="font-semibold">Name:</span> {flowState.shippingDetails.name}</p>
            <p><span className="font-semibold">Phone:</span> +91 {flowState.shippingDetails.phoneNumber}</p>
            <p><span className="font-semibold">Address:</span> {flowState.shippingDetails.address}</p>
            <p><span className="font-semibold">City/State:</span> {flowState.shippingDetails.city}, {flowState.shippingDetails.state}</p>
            <p><span className="font-semibold">Pincode:</span> {flowState.shippingDetails.pincode}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="button" className="w-full sm:w-auto" onClick={handlePayment} isLoading={loading}>
            Pay Now (Rs {totalPrice.toFixed(2)})
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 sm:p-6 h-fit border border-gray-200 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm mb-2 text-gray-700 dark:text-gray-200">
              <span className="pr-3">{item.name} x {item.quantity}</span>
              <span>Rs {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4 font-bold flex justify-between text-gray-900 dark:text-white">
            <span>Total</span>
            <span>Rs {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
