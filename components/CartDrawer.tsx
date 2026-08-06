import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart, items, removeFromCart, updateQuantity, totalItems, totalPrice, productOfferDiscount, discountedTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (!user) {
      navigate('/login?redirect=%2Fcheckout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div hidden={!isCartOpen} className="fixed inset-0 z-[60] overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={closeCart}
      ></div>

      <div className="absolute inset-y-0 right-0 w-full sm:max-w-md flex">
        <div
          className="cart-drawer-panel h-full w-full bg-dark-surface text-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-white/10"
          style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white font-display">Shopping Cart ({totalItems})</h2>
            <button
              onClick={closeCart}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                return (
                  <div key={`${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}_${item.price}`} className="flex gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-white">
                          <h3>{item.name}</h3>
                          <div className="ml-4 text-right">
                            {pricing.discount > 0 && <p className="text-xs text-gray-500 line-through">{formatInrAmount(pricing.lineSubtotal)}</p>}
                            <p className={pricing.discount > 0 ? 'text-emerald-300' : ''}>{formatInrAmount(pricing.lineTotal)}</p>
                            {pricing.discount > 0 && <p className="text-xs text-emerald-300">Save {formatInrAmount(pricing.discount)} ({pricing.rateLabel} off)</p>}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.category}
                          {item.selectedColorName ? ` | Color: ${item.selectedColorName}` : ''}
                          {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
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
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-white/10 px-6 py-6 bg-white/5">
              <div className="flex justify-between text-base font-bold text-white mb-3">
                <p>Subtotal</p>
                <p>{formatInrAmount(totalPrice)}</p>
              </div>
              {productOfferDiscount > 0 && (
                <div className="mb-2 flex justify-between text-sm font-semibold text-emerald-300">
                  <p>Product offer</p>
                  <p>-{formatInrAmount(productOfferDiscount)}</p>
                </div>
              )}
              <div className="mb-4 flex justify-between text-base font-bold text-white">
                <p>Total</p>
                <p className="text-emerald-300">{formatInrAmount(discountedTotal)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 mb-6">Shipping calculated at checkout.</p>
              <div className="space-y-3">
                <Button className="w-full h-12 text-lg" onClick={handleCheckout}>Checkout</Button>
                <Button variant="outline" className="w-full" onClick={closeCart}>Continue Shopping</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
