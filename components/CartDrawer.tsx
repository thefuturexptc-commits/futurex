import React from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';
import './CartDrawer.css';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart, items, removeFromCart, updateQuantity, totalItems, totalPrice, productOfferDiscount, discountedTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const nineMonthEstimate = formatInrAmount(discountedTotal / 9);
  const sixMonthEstimate = formatInrAmount(discountedTotal / 6);

  const handleCheckout = (preferredPayment?: 'emi') => {
    if (preferredPayment === 'emi') {
      window.sessionStorage.setItem('tfx_preferred_payment', 'emi');
    } else {
      window.sessionStorage.removeItem('tfx_preferred_payment');
    }
    closeCart();
    if (!user) {
      navigate('/login?redirect=%2Fcheckout');
      return;
    }
    navigate('/checkout');
  };

  return createPortal(
    <div hidden={!isCartOpen} className="cart-drawer fixed inset-0 z-[85] overflow-hidden">
      <div
        className="cart-drawer-backdrop absolute inset-0 bg-black/60"
        onClick={closeCart}
      ></div>

      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md flex">
        <div className="cart-drawer-panel flex h-full w-full flex-col border-l border-white/10 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
            <h2 className="font-display font-bold text-white">Shopping Cart ({totalItems})</h2>
            <button
              onClick={closeCart}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-white">Your cart is empty</p>
                  <p className="text-gray-500 text-sm mt-1">Looks like you haven't added anything yet.</p>
                </div>
                <Button variant="outline" onClick={closeCart} className="mt-4">Continue Shopping</Button>
              </div>
            ) : (
              items.map(item => {
                const pricing = getAutomaticOfferItemPricing(item);
                const mrpSubtotal = Number((Number(item.mrp || 0) * item.quantity).toFixed(2));
                const hasMrp = Number.isFinite(mrpSubtotal) && mrpSubtotal > 0 && mrpSubtotal >= pricing.lineTotal;
                const regularTotal = hasMrp ? mrpSubtotal : pricing.lineSubtotal;
                const savings = Math.max(0, regularTotal - pricing.lineTotal);
                const percentOff = savings > 0 ? Math.round((savings / regularTotal) * 100) : 0;
                return (
                  <div key={`${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}_${item.price}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.images[0]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover object-center"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-semibold" title={item.name}>{item.name}</h3>
                        <p className="mt-1 text-[11px] leading-4 text-gray-500">
                          {item.category}
                          {item.selectedColorName ? ` | Color: ${item.selectedColorName}` : ''}
                          {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                        </p>
                      </div>
                    </div>
                    <dl className="cart-drawer-pricing mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-4 dark:bg-slate-800">
                      {(hasMrp || savings > 0) && (
                        <div>
                          <dt className="font-medium opacity-80">{hasMrp ? 'MRP' : 'Regular price'}</dt>
                          <dd className={savings > 0 ? 'line-through' : ''}>{formatInrAmount(regularTotal)}</dd>
                        </div>
                      )}
                      {savings > 0 && (
                        <div className="rounded-lg bg-emerald-100 px-2 py-1 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                          <dt className="font-semibold">{percentOff > 0 ? `${percentOff}% off` : 'Savings'}</dt>
                          <dd className="font-bold">{formatInrAmount(savings)}</dd>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <dt className="font-semibold">{savings > 0 ? 'Sale price' : 'Price'}</dt>
                        <dd className="text-sm font-black tabular-nums">{formatInrAmount(pricing.lineTotal)}</dd>
                      </div>
                    </dl>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center border border-white/20 rounded-md">
                        <button onClick={() => {
                          if (Number(item.quantity || 0) - 1 < 1) {
                            removeFromCart(item.id, item.selectedColorName, item.price, item.selectedSize);
                          } else {
                            updateQuantity(item.id, Number(item.quantity || 0) - 1, item.selectedColorName, item.price, item.selectedSize);
                          }
                        }} className="px-2 py-1 hover:bg-white/10 text-gray-300">-</button>
                        <span className="px-2 font-medium text-white">{Number(item.quantity || 0)}</span>
                        <button onClick={() => updateQuantity(item.id, Number(item.quantity || 0) + 1, item.selectedColorName, item.price, item.selectedSize)} className="px-2 py-1 hover:bg-white/10 text-gray-300">+</button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id, item.selectedColorName, item.price, item.selectedSize)}
                        className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-white/10 bg-white/5 px-4 py-3 sm:px-5">
              <div className="mb-1.5 flex justify-between text-[13px] font-bold text-white">
                <p>Subtotal</p>
                <p>{formatInrAmount(totalPrice)}</p>
              </div>
              {productOfferDiscount > 0 && (
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-emerald-300">
                  <p>Product offer</p>
                  <p>-{formatInrAmount(productOfferDiscount)}</p>
                </div>
              )}
              <div className="mb-1 flex justify-between text-sm font-bold text-white">
                <p>Total</p>
                <p className="text-emerald-300">{formatInrAmount(discountedTotal)}</p>
              </div>
              <p className="mb-2 text-[11px] leading-4 text-gray-500">Shipping calculated at checkout.</p>
              <section aria-label="Razorpay EMI options" className="cart-drawer-emi mb-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 dark:border-sky-800 dark:bg-sky-950">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <h3 className="font-bold">Pay now with EMI</h3>
                  <span className="text-[11px] font-semibold">Razorpay</span>
                </div>
                <div className="mt-2 grid grid-cols-2 items-end gap-3">
                  <div>
                    <p className="text-[11px] font-medium leading-4">Estimated first instalment</p>
                    <strong className="block text-lg font-black leading-6 tabular-nums text-sky-800 dark:text-sky-200">{nineMonthEstimate}</strong>
                    <p className="text-[11px] leading-4">9-month example</p>
                  </div>
                  <div className="border-l border-sky-200 pl-3 dark:border-sky-800">
                    <strong className="block text-xs leading-4 tabular-nums">{sixMonthEstimate}/mo</strong>
                    <p className="text-[11px] leading-4">6-month example</p>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] leading-4">Estimates before interest and fees. Checkout shows eligible plans and the amount due today.</p>
              </section>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" className="min-h-11" onClick={() => handleCheckout()}>Checkout</Button>
                <Button size="sm" variant="secondary" className="min-h-11" onClick={() => handleCheckout('emi')}>Pay with EMI</Button>
                <Button size="sm" variant="outline" className="col-span-2 min-h-11 w-full" onClick={closeCart}>Continue Shopping</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
