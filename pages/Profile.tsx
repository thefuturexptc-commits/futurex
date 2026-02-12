import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders, updateUserAddresses } from '../services/backend';
import { Order, Address } from '../types';
import { Button } from '../components/ui/Button';

export const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Address Management State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    street: '',
    city: '',
    zip: '',
    country: ''
  });

  useEffect(() => {
    if (user) {
      getUserOrders(user.id).then(setOrders);
    }
  }, [user]);

  if (!user) return <div className="p-10 text-center dark:text-white">Please log in.</div>;

  // --- Address Handlers ---

  const handleEditAddress = (addr: Address) => {
      setAddressForm({
          street: addr.street,
          city: addr.city,
          zip: addr.zip,
          country: addr.country
      });
      setEditingId(addr.id);
      setIsEditingAddress(true);
  };

  const handleAddNewAddress = () => {
      setAddressForm({ street: '', city: '', zip: '', country: '' });
      setEditingId(null);
      setIsEditingAddress(true);
  };

  const handleDeleteAddress = async (id: string) => {
      if(!window.confirm('Delete this address?')) return;
      
      const updatedAddresses = (user.addresses || []).filter(a => a.id !== id);
      await updateUserAddresses(user.id, updatedAddresses);
      updateUser({ ...user, addresses: updatedAddresses });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let updatedAddresses = [...(user.addresses || [])];
      
      if (editingId) {
          // Update existing
          updatedAddresses = updatedAddresses.map(a => 
            a.id === editingId ? { ...addressForm, id: editingId } : a
          );
      } else {
          // Add new
          updatedAddresses.push({ ...addressForm, id: Date.now().toString() });
      }

      await updateUserAddresses(user.id, updatedAddresses);
      updateUser({ ...user, addresses: updatedAddresses });
      
      setIsEditingAddress(false);
      setEditingId(null);
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      {/* Header Profile Card */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Orders */}
          <div className="lg:col-span-2 space-y-8">
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h2>
                    <Button variant="outline" size="sm" onClick={() => getUserOrders(user.id).then(setOrders)}>Refresh</Button>
                </div>
                {orders.length === 0 ? (
                    <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm text-center text-gray-500 border border-gray-200 dark:border-white/5">
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
                                order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
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
          </div>

          {/* Right Column: Address Book */}
          <div className="lg:col-span-1">
             <div className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5 sticky top-24">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Addresses</h2>
                    {!isEditingAddress && (
                        <button onClick={handleAddNewAddress} className="text-primary-600 dark:text-primary-400 text-sm font-bold hover:underline">+ Add New</button>
                    )}
                </div>

                {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="space-y-4 animate-fade-in">
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">{editingId ? 'Edit Address' : 'New Address'}</h3>
                        <input 
                            placeholder="Street" required
                            value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                            className="w-full p-2 border rounded text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
                        />
                         <input 
                            placeholder="City" required
                            value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                            className="w-full p-2 border rounded text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                placeholder="Zip" required
                                value={addressForm.zip} onChange={e => setAddressForm({...addressForm, zip: e.target.value})}
                                className="w-full p-2 border rounded text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
                            />
                            <input 
                                placeholder="Country" required
                                value={addressForm.country} onChange={e => setAddressForm({...addressForm, country: e.target.value})}
                                className="w-full p-2 border rounded text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button type="submit" size="sm" className="flex-1">Save</Button>
                            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setIsEditingAddress(false)}>Cancel</Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        {(!user.addresses || user.addresses.length === 0) && (
                            <p className="text-sm text-gray-500 italic">No addresses saved yet.</p>
                        )}
                        {user.addresses?.map(addr => (
                            <div key={addr.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 group relative">
                                <div className="text-sm text-gray-800 dark:text-gray-200">
                                    <p className="font-medium">{addr.street}</p>
                                    <p>{addr.city}, {addr.zip}</p>
                                    <p>{addr.country}</p>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                    <button onClick={() => handleEditAddress(addr)} className="text-primary-600 hover:text-primary-800 p-1 bg-white dark:bg-black rounded shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 hover:text-red-800 p-1 bg-white dark:bg-black rounded shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};