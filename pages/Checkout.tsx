import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { firebaseService } from '../services/firebase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Address } from '../types';

export const Checkout: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/');
    }
    // Select default address if exists
    const def = user.addresses.find(a => a.isDefault);
    if (def) setSelectedAddressId(def.id);
    else if (user.addresses.length > 0) setSelectedAddressId(user.addresses[0].id);
    else setShowNewAddressForm(true);
  }, [user, items, navigate]);

  const handlePlaceOrder = async () => {
      if(!user) return;
      setLoading(true);

      try {
          let shippingAddress: Address;

          if (showNewAddressForm || !selectedAddressId) {
             // Save new address first
             if(!newAddress.street || !newAddress.city) {
                 alert("Please fill address");
                 setLoading(false);
                 return;
             }
             const updatedUser = await firebaseService.addAddress(user.id, {
                 street: newAddress.street!,
                 city: newAddress.city!,
                 state: newAddress.state || '',
                 zip: newAddress.zip || '',
                 country: newAddress.country || '',
                 isDefault: true
             });
             updateUser(updatedUser);
             shippingAddress = updatedUser.addresses[updatedUser.addresses.length - 1];
          } else {
             shippingAddress = user.addresses.find(a => a.id === selectedAddressId)!;
          }

          await firebaseService.createOrder({
              userId: user.id,
              userName: user.name,
              items: items,
              total: total,
              shippingAddress: shippingAddress
          });

          clearCart();
          navigate('/profile'); // Or success page
      } catch(err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  if(!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
            {/* Address Selection */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Shipping Address</h2>
                
                {!showNewAddressForm && user.addresses.length > 0 && (
                    <div className="space-y-3 mb-4">
                        {user.addresses.map(addr => (
                            <div 
                                key={addr.id} 
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-primary/50'}`}
                            >
                                <p className="text-slate-900 font-medium">{addr.street}</p>
                                <p className="text-sm text-slate-500">{addr.city}, {addr.zip}</p>
                            </div>
                        ))}
                         <button onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(''); }} className="text-primary text-sm hover:underline mt-2">
                            + Add New Address
                        </button>
                    </div>
                )}

                {(showNewAddressForm || user.addresses.length === 0) && (
                     <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <Input placeholder="Street" value={newAddress.street || ''} onChange={e => setNewAddress({...newAddress, street: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="City" value={newAddress.city || ''} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                            <Input placeholder="ZIP" value={newAddress.zip || ''} onChange={e => setNewAddress({...newAddress, zip: e.target.value})} />
                        </div>
                         <Input placeholder="Country" value={newAddress.country || ''} onChange={e => setNewAddress({...newAddress, country: e.target.value})} />
                         
                         {user.addresses.length > 0 && (
                             <button onClick={() => setShowNewAddressForm(false)} className="text-slate-500 text-sm hover:text-slate-900">Cancel</button>
                         )}
                     </div>
                )}
            </div>

            {/* Payment (Mock) */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Method</h2>
                <div className="p-4 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm">
                    <p>Cash on Delivery (Standard for Demo)</p>
                </div>
            </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Your Order</h3>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                        <span className="text-slate-900 font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                ))}
            </div>
            
            <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-slate-900">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                </div>
            </div>

            <Button fullWidth size="lg" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Processing...' : 'Place Order'}
            </Button>
        </div>
      </div>
    </div>
  );
};