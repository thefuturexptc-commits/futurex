import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { Address, CheckoutFlowState } from '../types';
import { createOrder, updateUserAddresses } from '../services/backend';
import { cartItemsToAnalyticsItems, pushDataLayerEvent } from '../services/analytics';
import { auth } from '../services/firebaseConfig';
import { formatInrAmount, getAutomaticOfferItemPricing, getPrepaidDiscountForItems } from '../utils/coupons';

const LAST_ORDER_SUCCESS_KEY = 'last_order_success';
const ORDER_SOURCE_SESSION_KEY = 'tfx_order_source';
const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const cleanupRazorpayUi = () => {
  if (typeof document === 'undefined') return;
  try {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';
    document.body.style.pointerEvents = '';
  } catch {
    // ignore style reset failures
  }

  const cleanupSelectors = [
    '.razorpay-container',
    '.razorpay-backdrop',
    '.razorpay-checkout-frame',
  ];
  cleanupSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      try {
        node.parentNode?.removeChild(node);
      } catch {
        // ignore DOM cleanup failures
      }
    });
  });
};

const loadRazorpaySdk = (): Promise<void> => {
  const existingRazorpay = (window as any).Razorpay;
  if (existingRazorpay) return Promise.resolve();

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SDK_URL}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay. Please try again.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay. Please try again.'));
    document.head.appendChild(script);
  });
};

const getOrderSourceFromSession = (): string => {
  if (typeof window === 'undefined') return 'Website';
  const stored = window.sessionStorage.getItem(ORDER_SOURCE_SESSION_KEY)?.trim();
  return stored || 'Website';
};

const RazorpayAutoOpen: React.FC<{ enabled: boolean; onOpen: () => void }> = ({ enabled, onOpen }) => {
  const openedRef = useRef(false);

  useEffect(() => {
    if (!enabled || openedRef.current) return;
    openedRef.current = true;
    const timer = window.setTimeout(onOpen, 500);
    return () => window.clearTimeout(timer);
  }, [enabled, onOpen]);

  return null;
};

const sendCompanyOrderEmail = async (order: unknown) => {
  try {
    await fetch('/api/order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
      keepalive: true,
    });
  } catch (emailError) {
    if (import.meta.env.DEV) {
      console.warn('Order email notification failed:', emailError);
    }
  }
};

export const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { items, totalPrice, productOfferDiscount, discountedTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const readPersistedFlow = (): CheckoutFlowState | null => {
    try {
      const raw = window.sessionStorage.getItem('checkout_flow_state');
      if (!raw) return null;
      return JSON.parse(raw) as CheckoutFlowState;
    } catch {
      return null;
    }
  };
  const flowState = (location.state as CheckoutFlowState | undefined) || readPersistedFlow() || undefined;
  const phone = flowState?.phone?.replace(/\D/g, '').slice(0, 10) || '';
  const verifiedPhone = window.sessionStorage.getItem('checkout_phone_verified') || '';
  const preferredPayment =
    flowState?.preferredPayment ||
    (window.sessionStorage.getItem('tfx_preferred_payment') === 'emi' ? 'emi' : undefined);
  const isEmiCheckout = preferredPayment === 'emi';

  const isPhoneVerified = Boolean((flowState?.phoneVerified && phone) || (phone && verifiedPhone === phone));
  const prepaidDiscount = paymentMethod === 'online' ? getPrepaidDiscountForItems(items, discountedTotal) : 0;
  const payableTotal = Number(Math.max(0, discountedTotal - prepaidDiscount).toFixed(2));
  const totalSavings = Number(Math.max(0, totalPrice - payableTotal).toFixed(2));

  const addressForOrder = useMemo<Address | null>(() => {
    if (!flowState?.shippingDetails) return null;
    return {
      id: `addr_${Date.now()}`,
      street: flowState.shippingDetails.address,
      city: flowState.shippingDetails.city,
      zip: flowState.shippingDetails.pincode,
      country: `India, ${flowState.shippingDetails.state}`,
    };
  }, [flowState?.shippingDetails]);

  if (!flowState?.shippingDetails || !phone) {
    return <Navigate to="/checkout" replace />;
  }

  if (!isPhoneVerified) {
    return <Navigate to="/verify-phone" replace state={flowState} />;
  }

  if (!addressForOrder || (items.length === 0 && !orderSubmitting)) {
    return <Navigate to="/checkout" replace />;
  }

  const saveAddressIfNeeded = async (finalAddress: Address) => {
    if (!user) return;
    const existingAddresses = user.addresses || [];
    const addressExists = existingAddresses.some(
      (a) => a.street.toLowerCase() === finalAddress.street.toLowerCase() && a.zip === finalAddress.zip
    );

    if (!addressExists) {
      const newAddresses = [finalAddress, ...existingAddresses];
      await updateUserAddresses(user.id, newAddresses);
      updateUser({ ...user, addresses: newAddresses });
    }
  };

  const finalizeSuccessfulOrder = async (paymentStatus: 'Pending' | 'Paid') => {
    if (orderSubmitting) return;
    const hasLocalLoggedUser = Boolean(user && String(user.id || '').trim());
    const hasRealFirebaseSession = Boolean(auth.currentUser && !auth.currentUser.isAnonymous);
    if (hasLocalLoggedUser && !hasRealFirebaseSession) {
      setError('Your login session expired. Please login again before placing order.');
      navigate('/login?redirect=%2Fpayment', { replace: true });
      return;
    }
    setOrderSubmitting(true);
    const verifiedFlow: CheckoutFlowState = {
      ...(flowState as CheckoutFlowState),
      phoneVerified: true,
    };
    window.sessionStorage.setItem('checkout_flow_state', JSON.stringify(verifiedFlow));

    const order = await createOrder(
      user?.id,
      items,
      payableTotal,
      addressForOrder,
      {
        phoneNumber: flowState.shippingDetails.phoneNumber,
        paymentStatus,
        paymentMethod,
        couponDiscount: totalSavings,
        originalSubtotal: totalPrice,
        shippingDetails: flowState.shippingDetails,
        orderSource: getOrderSourceFromSession(),
        customerName: user?.name || flowState.shippingDetails.name,
        customerEmail: user?.email || '',
        customerPhone: flowState.shippingDetails.phoneNumber,
      }
    );

    // ✅ META PIXEL: Purchase — fires after order is successfully created
    void sendCompanyOrderEmail(order);

    const purchaseEvent = {
      ecommerce: {
        transaction_id: order.id,
        currency: 'INR',
        value: Number(payableTotal.toFixed(2)),
        discount: Number(totalSavings.toFixed(2)),
        payment_type: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        items: cartItemsToAnalyticsItems(items),
      },
    };

    try {
      await saveAddressIfNeeded(addressForOrder);
    } catch (addressError) {
      if (import.meta.env.DEV) {
        console.warn('Order placed, but address save failed:', addressError);
      }
    }

    window.sessionStorage.removeItem('checkout_flow_state');
    window.sessionStorage.removeItem('checkout_phone_verified');
    window.sessionStorage.removeItem('tfx_preferred_payment');
    window.sessionStorage.removeItem('tfx_begin_checkout_key');
    window.sessionStorage.setItem(
      LAST_ORDER_SUCCESS_KEY,
      JSON.stringify({ orderId: order.id, paymentMethod, purchaseEvent })
    );
    cleanupRazorpayUi();
    navigate(`/order-success?orderId=${encodeURIComponent(order.id)}&paymentMethod=${encodeURIComponent(paymentMethod)}`, {
      replace: true,
      state: { orderId: order.id, paymentMethod, purchaseEvent },
    });
  };

  const placeOrder = async (paymentStatus: 'Pending' | 'Paid') => {
    await finalizeSuccessfulOrder(paymentStatus);
  };

  const handlePayment = async () => {
    if (loading || orderSubmitting) return;
    setError('');
    setLoading(true);
    pushDataLayerEvent('add_payment_info', {
      ecommerce: {
        currency: 'INR',
        value: Number(payableTotal.toFixed(2)),
        discount: Number(totalSavings.toFixed(2)),
        payment_type: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        items: cartItemsToAnalyticsItems(items),
      },
    });

    // ✅ META PIXEL: AddPaymentInfo — user initiates payment
    try {
      if (paymentMethod === 'cod') {
        await placeOrder('Pending');
        return;
      }

      await loadRazorpaySdk();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Number((payableTotal * 100).toFixed(0)),
        currency: 'INR',
        name: 'FutureX',
        description: 'Order Payment',
        prefill: {
          name: user?.name || flowState.shippingDetails.name,
          email: user?.email || '',
          contact: flowState.shippingDetails.phoneNumber,
        },
        theme: { color: '#6366f1' },
        ...(isEmiCheckout
          ? {
              config: {
                display: {
                  blocks: {
                    emi_options: {
                      name: 'Pay using EMI',
                      instruments: [
                        { method: 'emi' },
                        { method: 'cardless_emi' },
                      ],
                    },
                  },
                  sequence: ['block.emi_options'],
                  preferences: {
                    show_default_blocks: true,
                  },
                },
              },
            }
          : {}),
        handler: async () => {
          cleanupRazorpayUi();
          await placeOrder('Paid');
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            cleanupRazorpayUi();
            setLoading(false);
          },
        },
      };

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay SDK not loaded.');
      }

      const rzp = new RazorpayCtor(options);
      rzp.on?.('payment.failed', () => {
        cleanupRazorpayUi();
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      cleanupRazorpayUi();
      setError(err?.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="payment-page min-h-screen max-w-5xl mx-auto px-4 py-8 sm:py-12 text-white">
      <RazorpayAutoOpen enabled={isEmiCheckout && paymentMethod === 'online' && !loading && !orderSubmitting} onOpen={handlePayment} />
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Checkout</h1>
      <CheckoutStepper current="payment" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Payment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`rounded-xl border p-4 text-left transition-colors ${
                paymentMethod === 'online'
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-white/10 bg-black/30 text-gray-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{isEmiCheckout ? 'Razorpay EMI' : 'Pay Online'}</p>
                {getPrepaidDiscountForItems(items, discountedTotal) > 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    Flat {formatInrAmount(getPrepaidDiscountForItems(items, discountedTotal))} off
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm opacity-80">
                {isEmiCheckout ? 'Razorpay will show eligible EMI and Cardless EMI options.' : 'Pay securely with Razorpay.'}
              </p>
              <p className="mt-2 text-lg font-black text-emerald-300">{formatInrAmount(Math.max(0, discountedTotal - getPrepaidDiscountForItems(items, discountedTotal)))}</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`rounded-xl border p-4 text-left transition-colors ${
                paymentMethod === 'cod'
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-white/10 bg-black/30 text-gray-300'
              }`}
            >
              <p className="font-semibold">Cash on Delivery</p>
              <p className="mt-1 text-sm opacity-80">Pay when your order arrives.</p>
              <p className="mt-2 text-lg font-black text-white">{formatInrAmount(discountedTotal)}</p>
            </button>
          </div>
          <div className="text-sm text-gray-200 space-y-1">
            <p><span className="font-semibold">Name:</span> {flowState.shippingDetails.name}</p>
            <p><span className="font-semibold">Phone:</span> +91 {flowState.shippingDetails.phoneNumber}</p>
            <p><span className="font-semibold">Address:</span> {flowState.shippingDetails.address}</p>
            <p><span className="font-semibold">City/State:</span> {flowState.shippingDetails.city}, {flowState.shippingDetails.state}</p>
            <p><span className="font-semibold">Pincode:</span> {flowState.shippingDetails.pincode}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {isEmiCheckout && paymentMethod === 'online' && (
            <p className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100">
              Opening Razorpay EMI checkout. If it does not open, tap the button below.
            </p>
          )}
          <Button type="button" className="w-full sm:w-auto" onClick={handlePayment} isLoading={loading || orderSubmitting} disabled={loading || orderSubmitting}>
            {paymentMethod === 'cod'
              ? `Place COD Order (${formatInrAmount(payableTotal)})`
              : isEmiCheckout
                ? `Continue to Razorpay EMI (${formatInrAmount(payableTotal)})`
                : `Pay Now (${formatInrAmount(payableTotal)})`}
          </Button>
        </div>

        <div className="h-fit rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
          {items.map((item) => {
            const pricing = getAutomaticOfferItemPricing(item);
            return (
              <div key={`${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}_${item.price}`} className="flex justify-between text-sm mb-2 text-gray-200">
                <span className="pr-3">{item.name} x {item.quantity}</span>
                <span className="text-right">
                  {pricing.discount > 0 ? (
                    <>
                      <span className="block text-xs text-gray-500 line-through">{formatInrAmount(pricing.lineSubtotal)}</span>
                      <span className="font-semibold text-emerald-300">{formatInrAmount(pricing.lineTotal)}</span>
                      <span className="block text-[11px] font-semibold text-emerald-300">
                        Save {formatInrAmount(pricing.discount)} ({pricing.rateLabel} off)
                      </span>
                    </>
                  ) : (
                    <>{formatInrAmount(pricing.lineSubtotal)}</>
                  )}
                </span>
              </div>
            );
          })}
          <div className="border-t border-white/10 mt-4 pt-4 flex justify-between text-sm text-gray-300">
            <span>Subtotal</span>
            <span>{formatInrAmount(totalPrice)}</span>
          </div>
          {productOfferDiscount > 0 && (
            <div className="mt-2 flex justify-between text-sm font-semibold text-emerald-300">
              <span>Product offer</span>
              <span>-{formatInrAmount(productOfferDiscount)}</span>
            </div>
          )}
          {prepaidDiscount > 0 && (
            <div className="mt-2 flex justify-between text-sm font-semibold text-emerald-300">
              <span>Pay online offer</span>
              <span>-{formatInrAmount(prepaidDiscount)}</span>
            </div>
          )}
          <div className="border-t border-white/10 mt-4 pt-4 font-bold flex justify-between text-white">
            <span>Total</span>
            <span className="text-emerald-300">{formatInrAmount(payableTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
