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
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
           </svg>
        </div>

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
        </div>
      </div>
    </div>
  );
};