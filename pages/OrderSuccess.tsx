import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useCart } from '../context/CartContext';
import { pushDataLayerEvent } from '../services/analytics';

const LAST_ORDER_SUCCESS_KEY = 'last_order_success';
const PURCHASE_FIRED_KEY = 'tfx_purchase_fired_order_id';

type OrderSuccessState = {
  orderId: string;
  paymentMethod?: 'online' | 'cod';
  purchaseEvent?: Record<string, unknown>;
};

export const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const state = location.state as OrderSuccessState | undefined;
  const searchState = useMemo<OrderSuccessState | undefined>(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId') || undefined;
    const paymentMethodParam = params.get('paymentMethod');
    const paymentMethod = paymentMethodParam === 'cod' || paymentMethodParam === 'online'
      ? paymentMethodParam
      : undefined;
    return orderId ? { orderId, paymentMethod } : undefined;
  }, [location.search]);
  const persistedState = useMemo<OrderSuccessState | undefined>(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_SUCCESS_KEY);
      return raw ? (JSON.parse(raw) as OrderSuccessState) : undefined;
    } catch {
      return undefined;
    }
  }, []);
  const finalState = state || searchState || persistedState;
  const orderId = finalState?.orderId || 'Unknown';
  const paymentMethod = finalState?.paymentMethod || 'online';

  useEffect(() => {
    if (finalState?.purchaseEvent && orderId !== 'Unknown') {
      const lastFiredOrderId = window.sessionStorage.getItem(PURCHASE_FIRED_KEY);
      if (lastFiredOrderId !== orderId) {
        pushDataLayerEvent('purchase', finalState.purchaseEvent);
        window.sessionStorage.setItem(PURCHASE_FIRED_KEY, orderId);
      }
    }

    clearCart();
    window.sessionStorage.removeItem(LAST_ORDER_SUCCESS_KEY);
  }, [clearCart, finalState?.purchaseEvent, orderId]);

  return (
    <div className="order-success-dark min-h-screen flex items-center justify-center p-4 bg-dark-bg text-white">
      <div className="bg-white dark:bg-dark-surface p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/5 text-center max-w-lg w-full">
        
        {/* Animated Checkmark */}
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
           <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
           </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-display">Order Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          {paymentMethod === 'cod'
            ? 'Your Cash on Delivery order has been placed successfully and will be confirmed on delivery.'
            : 'Thank you for your purchase. Your order has been placed successfully and is being processed.'}
        </p>

        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Order ID</p>
            <p className="text-xl font-mono font-bold text-gray-900 dark:text-white mt-1">{orderId}</p>
        </div>

        <div className="space-y-3">
          <Button className="w-full h-12" onClick={() => navigate('/profile')}>
            View Order Details
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};
