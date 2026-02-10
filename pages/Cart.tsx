import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/Button';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 px-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-8">Looks like you haven't added any tech yet.</p>
        <Link to="/">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-1 space-y-6">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                <p className="text-primary font-bold">₹{item.price.toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 rounded"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="text-slate-900 font-medium w-8 text-center">{item.quantity}</span>
                <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-slate-500 hover:text-slate-900 bg-slate-100 rounded"
                >
                    <Plus className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => removeFromCart(item.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:w-96">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-6 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between text-slate-900 font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            <Button fullWidth onClick={handleCheckout} size="lg">
              Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};