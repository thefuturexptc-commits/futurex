import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { Address, CheckoutFlowState } from '../types';
import { createOrder, updateUserAddresses } from '../services/backend';

const LAST_ORDER_SUCCESS_KEY = 'last_order_success';
const ORDER_SOURCE_SESSION_KEY = 'tfx_order_source';

const getOrderSourceFromSession = (): string => {
  if (typeof window === 'undefined') return 'Website';
  const stored = window.sessionStorage.getItem(ORDER_SOURCE_SESSION_KEY)?.trim();
  return stored || 'Website';
};

export const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { items, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

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

  const isPhoneVerified = Boolean((flowState?.phoneVerified && phone) || (phone && verifiedPhone === phone));

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
    return <Navigate to="/login?redirect=%2Fpayment" replace />;
  }

  if (!addressForOrder || (items.length === 0 && !orderSubmitting)) {
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

  const finalizeSuccessfulOrder = async (paymentStatus: 'Pending' | 'Paid') => {
    setOrderSubmitting(true);
    const verifiedFlow: CheckoutFlowState = {
      ...(flowState as CheckoutFlowState),
      phoneVerified: true,
    };
    window.sessionStorage.setItem('checkout_flow_state', JSON.stringify(verifiedFlow));

    const order = await createOrder(
      user.id,
      items,
      totalPrice,
      addressForOrder,
      {
        phoneNumber: flowState.shippingDetails.phoneNumber,
        paymentStatus,
        paymentMethod,
        shippingDetails: flowState.shippingDetails,
        orderSource: getOrderSourceFromSession(),
      }
    );

    try {
      await saveAddressIfNeeded(addressForOrder);
    } catch (addressError) {
      console.warn('Order placed, but address save failed:', addressError);
    }

    window.sessionStorage.removeItem('checkout_flow_state');
    window.sessionStorage.removeItem('checkout_phone_verified');
    window.sessionStorage.setItem(
      LAST_ORDER_SUCCESS_KEY,
      JSON.stringify({ orderId: order.id, paymentMethod })
    );
    navigate(`/order-success?orderId=${encodeURIComponent(order.id)}&paymentMethod=${encodeURIComponent(paymentMethod)}`, {
      replace: true,
      state: { orderId: order.id, paymentMethod },
    });
  };

  const placeOrder = async (paymentStatus: 'Pending' | 'Paid') => {
    await finalizeSuccessfulOrder(paymentStatus);
  };

  const handlePayment = async () => {
    setError('');
    setLoading(true);

    try {
      if (paymentMethod === 'cod') {
        await placeOrder('Pending');
        return;
      }

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
          await placeOrder('Paid');
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`rounded-xl border p-4 text-left transition-colors ${
                paymentMethod === 'online'
                  ? 'border-primary-500 bg-primary-50 text-gray-900 dark:bg-primary-500/10 dark:text-white'
                  : 'border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'
              }`}
            >
              <p className="font-semibold">Online Payment</p>
              <p className="mt-1 text-sm opacity-80">Pay securely with Razorpay.</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`rounded-xl border p-4 text-left transition-colors ${
                paymentMethod === 'cod'
                  ? 'border-primary-500 bg-primary-50 text-gray-900 dark:bg-primary-500/10 dark:text-white'
                  : 'border-gray-200 bg-white text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'
              }`}
            >
              <p className="font-semibold">Cash on Delivery</p>
              <p className="mt-1 text-sm opacity-80">Pay when your order arrives.</p>
            </button>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <p><span className="font-semibold">Name:</span> {flowState.shippingDetails.name}</p>
            <p><span className="font-semibold">Phone:</span> +91 {flowState.shippingDetails.phoneNumber}</p>
            <p><span className="font-semibold">Address:</span> {flowState.shippingDetails.address}</p>
            <p><span className="font-semibold">City/State:</span> {flowState.shippingDetails.city}, {flowState.shippingDetails.state}</p>
            <p><span className="font-semibold">Pincode:</span> {flowState.shippingDetails.pincode}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="button" className="w-full sm:w-auto" onClick={handlePayment} isLoading={loading}>
            {paymentMethod === 'cod' ? `Place COD Order (Rs ${totalPrice.toFixed(2)})` : `Pay Now (Rs ${totalPrice.toFixed(2)})`}
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
