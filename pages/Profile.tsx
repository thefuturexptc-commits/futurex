import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebase';
import { Order, Address } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Package, MapPin, User as UserIcon } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', zip: '', country: '' });

  useEffect(() => {
    if (user) {
      firebaseService.getOrders(user.id).then(setOrders);
    }
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updatedUser = await firebaseService.addAddress(user.id, { ...newAddress, isDefault: user.addresses.length === 0 });
      updateUser(updatedUser);
      setShowAddAddress(false);
      setNewAddress({ street: '', city: '', state: '', zip: '', country: '' });
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <div className="pt-24 text-center text-slate-900">Please login.</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md">
          {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" alt="avatar"/> : user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-500">{user.email || user.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Addresses */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="text-primary" /> My Addresses
            </h2>
            <Button size="sm" variant="outline" onClick={() => setShowAddAddress(!showAddAddress)}>
                {showAddAddress ? 'Cancel' : 'Add New'}
            </Button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 mb-6">
               <Input placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required />
               <div className="grid grid-cols-2 gap-4">
                 <Input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                 <Input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <Input placeholder="ZIP Code" value={newAddress.zip} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} required />
                 <Input placeholder="Country" value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} required />
               </div>
               <Button type="submit">Save Address</Button>
            </form>
          )}

          {user.addresses.length === 0 ? (
              <p className="text-slate-500">No addresses saved yet.</p>
          ) : (
              <div className="space-y-4">
                  {user.addresses.map(addr => (
                      <div key={addr.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                          <p className="text-slate-900 font-medium">{addr.street}</p>
                          <p className="text-slate-500">{addr.city}, {addr.state} {addr.zip}</p>
                          <p className="text-slate-400 text-sm">{addr.country}</p>
                          {addr.isDefault && <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded mt-2 inline-block">Default</span>}
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* Order History */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="text-secondary" /> Order History
          </h2>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-slate-500">No orders placed yet.</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-900 font-bold">Order #{order.id}</p>
                      <p className="text-sm text-slate-500">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                        'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.name} x{item.quantity}</span>
                        <span className="text-slate-500">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between text-slate-900 font-bold">
                    <span>Total</span>
                    <span>₹{order.total.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};