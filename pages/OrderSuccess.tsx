<<<<<<< HEAD
import React, { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const orderDetailsHref = orderId !== 'Unknown'
    ? `/track-order?orderId=${encodeURIComponent(orderId)}`
    : '/track-order';

  const resetPageInteractivity = () => {
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';

    document.querySelectorAll('.razorpay-container, .razorpay-backdrop, .razorpay-checkout-frame').forEach((node) => {
      try {
        node.parentNode?.removeChild(node);
      } catch {
        // ignore cleanup failures
      }
    });
  };

  const goToOrderDetails = () => {
    resetPageInteractivity();
    navigate(orderDetailsHref);

    window.setTimeout(() => {
      if (window.location.pathname !== '/track-order') {
        window.location.assign(orderDetailsHref);
      }
    }, 150);
  };

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

  useEffect(() => {
    // Defensive cleanup in case payment modal left the page non-interactive.
    resetPageInteractivity();
    void import('./TrackOrder');
  }, []);

  return (
    <div className="order-success-page min-h-screen bg-[#f5fbfb] px-4 py-10 text-slate-950 sm:py-14">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl shadow-slate-200/70 sm:p-10">
        
        {/* Animated Checkmark */}
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 sm:h-24 sm:w-24">
           <svg className="h-10 w-10 text-emerald-600 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
=======
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const state = location.state as { orderId: string } | undefined;
  const orderId = state?.orderId || 'Unknown';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-dark-bg">
      <div className="bg-white dark:bg-dark-surface p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/5 text-center max-w-lg w-full">
        
        {/* Animated Checkmark */}
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
           <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
           </svg>
        </div>

<<<<<<< HEAD
        <h1 className="mb-4 font-display text-2xl font-bold text-slate-950 sm:text-3xl">Order Successful!</h1>
        <p className="mb-7 text-base leading-7 text-slate-600 sm:text-lg">
          {paymentMethod === 'cod'
            ? 'Your Cash on Delivery order has been placed successfully and will be confirmed on delivery.'
            : 'Thank you for your purchase. Your order has been placed successfully and is being processed.'}
        </p>

        <div className="mb-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Order ID</p>
            <p className="mt-2 break-all font-mono text-lg font-bold text-slate-950 sm:text-xl">{orderId}</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={goToOrderDetails}
            onPointerDown={resetPageInteractivity}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-cyan-400/30 bg-gradient-to-r from-[#0b2a6e] via-[#0d3f9f] to-[#1167c7] px-5 text-base font-medium text-white shadow-lg shadow-cyan-700/30 transition-all duration-200 hover:from-[#0f3384] hover:via-[#1552be] hover:to-[#1678e6]"
          >
            View Order Details
          </button>
          <Link
            to="/shop/all"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg border-2 border-cyan-700/60 bg-[#050b17]/60 px-5 text-base font-medium text-cyan-100 transition-all duration-200 hover:border-cyan-400/80 hover:bg-[#0a1a34]/75 hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
=======
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-display">Order Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Thank you for your purchase. Your order has been placed successfully and is being processed.
        </p>

        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Order ID</p>
            <p className="text-xl font-mono font-bold text-gray-900 dark:text-white mt-1">{orderId}</p>
        </div>

        <div className="space-y-3">
          <Link to="/profile">
            <Button className="w-full h-12">View Order Details</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full h-12">Continue Shopping</Button>
          </Link>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
