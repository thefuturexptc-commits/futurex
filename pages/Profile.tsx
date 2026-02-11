import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/backend';
import { Order } from '../types';
import { Button } from '../components/ui/Button';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      getUserOrders(user.id).then(setOrders);
    }
  }, [user]);

  if (!user) return <div className="p-10 text-center dark:text-white">Please log in.</div>;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-dark-surface shadow-sm rounded-xl overflow-hidden mb-8 border border-gray-200 dark:border-white/5">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 h-32"></div>
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-surface p-1">
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500">
                {user.name[0]}
              </div>
            </div>
            <div className="mb-1">
               <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                 {user.role}
               </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order History</h2>
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm text-center text-gray-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 hover:border-primary-500 transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order #{order.id}</h3>
                   <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium 
                    ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-white/5 pt-4">
                 <div className="space-y-2">
                   {order.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                       <span>{item.quantity}x {item.name}</span>
                       <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                     </div>
                   ))}
                 </div>
                 <div className="flex justify-between mt-4 font-bold text-gray-900 dark:text-white">
                   <span>Total</span>
                   <span>₹{order.total.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
