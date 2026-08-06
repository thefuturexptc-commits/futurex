import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, productOfferDiscount, discountedTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=%2Fcheckout');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="cart-page min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-8">Looks like you haven't added any futuristic gear yet.</p>
        <Link to="/shop/all">
          <Button>Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page min-h-screen max-w-7xl mx-auto px-4 py-10 sm:py-12 pb-24 sm:pb-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const pricing = getAutomaticOfferItemPricing(item);
            return (
              <div key={`${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}_${item.price}`} className="rounded-xl border border-white/10 bg-white/5 p-3.5 sm:p-4 shadow-sm flex items-center space-x-3 sm:space-x-4">
                <img src={item.images[0]} alt={item.name} loading="lazy" decoding="async" width={96} height={96} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-black/30" />

                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-lg text-white line-clamp-2">{item.name}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {item.category}
                    {item.selectedColorName ? ` | Color: ${item.selectedColorName}` : ''}
                    {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {pricing.discount > 0 && (
                      <span className="text-xs font-bold text-gray-500 line-through">{formatInrAmount(pricing.unitPrice)}</span>
                    )}
                    <span className="font-bold text-emerald-300">{formatInrAmount(pricing.unitOfferPrice)}</span>
                  </div>
                  {pricing.discount > 0 && (
                    <p className="mt-1 text-xs font-semibold text-emerald-300">
                      Save {formatInrAmount(pricing.unitDiscount)} each ({pricing.rateLabel} off)
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedColorName, item.price, item.selectedSize)} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded shadow-sm">-</button>
                    <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedColorName, item.price, item.selectedSize)} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded shadow-sm">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id, item.selectedColorName, item.price, item.selectedSize)} className="text-red-500 text-xs sm:text-sm hover:underline">Remove</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden sm:block rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm h-fit sticky top-24">
          <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatInrAmount(totalPrice)}</span>
            </div>
            {productOfferDiscount > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Product offer</span>
                <span>-{formatInrAmount(productOfferDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-lg text-white">
              <span>Total</span>
              <span className="text-emerald-300">{formatInrAmount(discountedTotal)}</span>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={handleCheckout}>Proceed to Checkout</Button>
        </div>
      </div>

      <div className="sm:hidden fixed left-0 right-0 bottom-0 z-40 border-t border-white/10 bg-dark-bg/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between text-sm mb-2 text-gray-200">
          <span>Total</span>
          <span className="font-bold text-emerald-300">{formatInrAmount(discountedTotal)}</span>
        </div>
        <Button className="w-full h-11 rounded-xl" onClick={handleCheckout}>Proceed to Checkout</Button>
      </div>
    </div>
  );
};
