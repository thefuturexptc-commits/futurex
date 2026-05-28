import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/Button';
import { TFX_COUPON_CODE, getCouponItemPricing, getCouponRateLabel } from '../utils/coupons';

export const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, couponCode, couponDiscount, discountedTotal, applyCoupon, removeCoupon } = useCart();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState(couponCode || TFX_COUPON_CODE);
  const [couponMessage, setCouponMessage] = useState('');

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput);
    setCouponMessage(result.message);
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
            const pricing = getCouponItemPricing(item, couponCode);
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
                  <div className="font-bold text-primary-600 mt-1">Rs {item.price.toFixed(2)}</div>
                  {pricing.discount > 0 && (
                    <p className="mt-1 text-xs font-semibold text-emerald-300">
                      After coupon: Rs {(pricing.lineTotal / Number(item.quantity || 1)).toFixed(2)} each ({getCouponRateLabel(pricing.rate)} off)
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
            <div className="rounded-xl border border-primary-400/30 bg-primary-400/10 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-200">Coupon</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder={TFX_COUPON_CODE}
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-primary-300"
                />
                {couponCode ? (
                  <button type="button" onClick={() => { removeCoupon(); setCouponMessage('Coupon removed.'); }} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">
                    Remove
                  </button>
                ) : (
                  <button type="button" onClick={handleApplyCoupon} className="rounded-lg bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-400">
                    Apply
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-300">Fans get 10% off. Rings and bands get 5% off. Not valid on EMI.</p>
              {couponMessage && <p className={`mt-2 text-xs font-semibold ${couponCode ? 'text-emerald-300' : 'text-red-300'}`}>{couponMessage}</p>}
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>Rs {totalPrice.toFixed(2)}</span>
            </div>
            {couponCode && (
              <div className="flex justify-between text-emerald-300">
                <span>Coupon discount</span>
                <span>-Rs {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-lg text-white">
              <span>Total</span>
              <span>Rs {discountedTotal.toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={handleCheckout}>Proceed to Checkout</Button>
        </div>
      </div>

      <div className="sm:hidden fixed left-0 right-0 bottom-0 z-40 border-t border-white/10 bg-dark-bg/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between text-sm mb-2 text-gray-200">
          <span>Total</span>
          <span className="font-bold text-white">Rs {discountedTotal.toFixed(2)}</span>
        </div>
        <Button className="w-full h-11 rounded-xl" onClick={handleCheckout}>Proceed to Checkout</Button>
      </div>
    </div>
  );
};
