import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckoutFlowState, CheckoutShippingDetails } from '../types';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { verifyIndianPincode } from '../services/backend';
import { cartItemsToAnalyticsItems, pushDataLayerEvent } from '../services/analytics';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';

const emptyShipping: CheckoutShippingDetails = {
  name: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

const fieldClass =
  'w-full rounded-xl border border-[#17130f]/10 bg-white py-3 pl-11 pr-3 text-[15px] text-[#17130f] placeholder:text-[#766a5a] outline-none transition focus:border-[#ad8a4c] focus:ring-2 focus:ring-[#ad8a4c]/20';

const FieldIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ad8a4c]">
    {children}
  </span>
);

export const Checkout: React.FC = () => {
  const { items, totalPrice, productOfferDiscount, discountedTotal } = useCart();
  const { user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [shippingDetails, setShippingDetails] = useState<CheckoutShippingDetails>(emptyShipping);
  const [error, setError] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [lastVerifiedPin, setLastVerifiedPin] = useState('');
  const pinVerifySeqRef = useRef(0);
  const checkoutEventKey = useMemo(
    () => `begin_checkout_${items.map((item) => `${item.id}:${item.quantity}:${item.price}`).join('|')}_${discountedTotal}`,
    [items, discountedTotal]
  );

  useEffect(() => {
    if (items.length === 0) return;
    const firedKey = window.sessionStorage.getItem('tfx_begin_checkout_key');
    if (firedKey === checkoutEventKey) return;
    window.sessionStorage.setItem('tfx_begin_checkout_key', checkoutEventKey);
    pushDataLayerEvent('begin_checkout', {
      ecommerce: {
        currency: 'INR',
        value: Number(discountedTotal.toFixed(2)),
        items: cartItemsToAnalyticsItems(items),
      },
    });
  }, [checkoutEventKey, items, discountedTotal]);

  useEffect(() => {
    if (!isAuthReady || user || items.length === 0) return;
    navigate('/login?redirect=%2Fcheckout', { replace: true });
  }, [isAuthReady, items.length, navigate, user]);

  const normalizeIndianMobile = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length === 10) return digits;
    return '';
  };

  const isAddressLikelyValid = (value: string) => {
    const normalized = value.trim();
    return normalized.length >= 5;
  };

  const normalizedPhone = useMemo(
    () => normalizeIndianMobile(shippingDetails.phoneNumber),
    [shippingDetails.phoneNumber]
  );

  const isValid = useMemo(() => {
    return (
      shippingDetails.name.trim().length >= 2 &&
      /^[6-9]\d{9}$/.test(normalizedPhone) &&
      isAddressLikelyValid(shippingDetails.address) &&
      shippingDetails.city.trim().length >= 2 &&
      shippingDetails.state.trim().length >= 2 &&
      /^\d{6}$/.test(shippingDetails.pincode)
    );
  }, [shippingDetails, normalizedPhone]);

  const verifyPin = async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) {
      setPinMessage('Enter a valid 6-digit Indian pincode.');
      setLastVerifiedPin('');
      return null;
    }

    setPinMessage('');
    setVerifyingPin(true);
    const pinData = await verifyIndianPincode(pin).finally(() => setVerifyingPin(false));

    if (!pinData) {
      setPinMessage('Could not auto-verify. Enter City and State manually.');
      setLastVerifiedPin('');
      return null;
    }

    setShippingDetails((prev) => ({
      ...prev,
      city: pinData.city || prev.city,
      state: pinData.state || prev.state,
    }));
    setPinMessage(`Verified: ${pinData.city}${pinData.state ? `, ${pinData.state}` : ''}`);
    setLastVerifiedPin(pin);
    return pinData;
  };

  const handleVerifyPincode = async () => {
    const pin = shippingDetails.pincode.replace(/\D/g, '').slice(0, 6);
    await verifyPin(pin);
  };

  useEffect(() => {
    const pin = shippingDetails.pincode.replace(/\D/g, '').slice(0, 6);
    if (pin.length < 6) {
      setLastVerifiedPin('');
      if (!pin.length) setPinMessage('');
      return;
    }
    if (pin === lastVerifiedPin) return;

    const seq = ++pinVerifySeqRef.current;
    setPinMessage('Verifying pincode...');
    const timer = window.setTimeout(async () => {
      await verifyPin(pin);
      if (pinVerifySeqRef.current !== seq) return;
    }, 450);

    return () => window.clearTimeout(timer);
  }, [shippingDetails.pincode, lastVerifiedPin]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = normalizedPhone;

    if (!isAddressLikelyValid(shippingDetails.address)) {
      setError('Please enter your delivery address.');
      return;
    }

    const pin = shippingDetails.pincode.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(pin)) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }

    const pinData = pin === lastVerifiedPin ? null : await verifyPin(pin);
    const nextShippingDetails = {
      ...shippingDetails,
      city: pinData?.city || shippingDetails.city,
      state: pinData?.state || shippingDetails.state,
      phoneNumber: phoneDigits,
      pincode: pin,
    };

    if (
      nextShippingDetails.name.trim().length < 2 ||
      !/^[6-9]\d{9}$/.test(phoneDigits) ||
      nextShippingDetails.city.trim().length < 2 ||
      nextShippingDetails.state.trim().length < 2
    ) {
      setError('Please fill all fields correctly before continuing.');
      return;
    }

    setError('');
    const preferredPayment =
      window.sessionStorage.getItem('tfx_preferred_payment') === 'emi' ? 'emi' : undefined;
    const flowState: CheckoutFlowState = {
      phone: phoneDigits,
      phoneVerified: window.sessionStorage.getItem('checkout_phone_verified') === phoneDigits,
      shippingDetails: nextShippingDetails,
      preferredPayment,
    };
    window.sessionStorage.setItem('checkout_flow_state', JSON.stringify(flowState));
    pushDataLayerEvent('add_shipping_info', {
      phone: phoneDigits,
      city: nextShippingDetails.city,
      region: nextShippingDetails.state,
      country: 'India',
      pincode: nextShippingDetails.pincode,
      locationSource: 'checkout',
      ecommerce: {
        currency: 'INR',
        value: Number(discountedTotal.toFixed(2)),
        shipping_tier: 'Standard',
        items: cartItemsToAnalyticsItems(items),
      },
    });

    // ✅ META PIXEL: InitiateCheckout
    if (flowState.phoneVerified) {
      navigate('/payment', { replace: true, state: flowState });
      return;
    }
    navigate('/verify-phone', { replace: true, state: flowState });
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page checkout-luxury flex min-h-screen items-center justify-center px-4 py-16 text-center">
        <div className="luxe-panel luxe-anim mx-auto max-w-md rounded-2xl p-8">
          <span className="luxe-lock-badge mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#ad8a4c]/40 text-[#ad8a4c]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
          <p className="luxe-muted mt-3 text-sm">Add a product before continuing to checkout.</p>
          <Link to="/shop/all" className="mt-6 inline-flex">
            <Button type="button">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthReady || !user) {
    return (
      <div className="checkout-page checkout-luxury min-h-screen px-4 py-16 text-center">
        <div className="luxe-panel luxe-anim mx-auto max-w-md rounded-2xl p-8">
          <h1 className="text-2xl font-bold">Login required</h1>
          <p className="luxe-muted mt-3 text-sm">Please login to continue your Buy Now checkout.</p>
          <Link to="/login?redirect=%2Fcheckout" className="mt-6 inline-flex">
            <Button type="button">Login to checkout</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page checkout-luxury min-h-screen max-w-5xl mx-auto px-4 py-10 sm:py-12 pb-24 sm:pb-12">
      <div className="luxe-eyebrow luxe-anim mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]">
        <span className="luxe-lock-badge flex h-5 w-5 items-center justify-center rounded-full border border-[#ad8a4c]/40">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        Secure Checkout
      </div>
      <h1 className="luxe-anim luxe-anim-d1 text-xl sm:text-3xl font-bold mb-3">Checkout</h1>
      <div className="luxe-anim luxe-anim-d1">
        <CheckoutStepper current="address" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form
          onSubmit={handleContinue}
          className="luxe-panel luxe-anim luxe-anim-d2 lg:col-span-2 space-y-4 rounded-2xl p-4 sm:p-6"
        >
          <div className="luxe-divider flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-semibold">Shipping Details</h2>
            <span className="luxe-muted text-[11px] font-semibold uppercase tracking-[0.14em]">Step 1 of 3</span>
          </div>

          <div className="relative">
            <FieldIcon>
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </FieldIcon>
            <input
              required
              type="text"
              placeholder="Full name"
              value={shippingDetails.name}
              onChange={(e) => setShippingDetails((prev) => ({ ...prev, name: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <div>
            <div className="relative">
              <FieldIcon>
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-1.9.952a11.05 11.05 0 005.516 5.516l.952-1.9a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </FieldIcon>
              <input
                required
                type="tel"
                placeholder="Phone number"
                value={shippingDetails.phoneNumber}
                onChange={(e) =>
                  setShippingDetails((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
                  }))
                }
                className={fieldClass}
              />
            </div>
            <p className="luxe-muted mt-1.5 pl-1 text-xs">Accepts 10-digit, `0xxxxxxxxxx`, or `91xxxxxxxxxx`.</p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <FieldIcon>
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </FieldIcon>
              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Pincode"
                value={shippingDetails.pincode}
                onChange={(e) =>
                  {
                    setShippingDetails((prev) => ({
                      ...prev,
                      pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                    }));
                    setPinMessage('');
                  }
                }
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button type="button" variant="outline" onClick={() => void handleVerifyPincode()} disabled={verifyingPin}>
                {verifyingPin ? 'Verifying...' : 'Verify Pincode'}
              </Button>
              {pinMessage && (
                <p className={`flex items-center gap-1.5 text-xs ${pinMessage.startsWith('Verified') ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {pinMessage.startsWith('Verified') && (
                    <span className="luxe-check-pop">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {pinMessage}
                </p>
              )}
            </div>
          </div>

          <div className="relative">
            <FieldIcon>
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4m0-14v14m9-14v10l-9 4" />
              </svg>
            </FieldIcon>
            <input
              required
              type="text"
              placeholder="Address"
              value={shippingDetails.address}
              onChange={(e) => setShippingDetails((prev) => ({ ...prev, address: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <FieldIcon>
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                </svg>
              </FieldIcon>
              <input
                required
                type="text"
                placeholder="City"
                value={shippingDetails.city}
                onChange={(e) => setShippingDetails((prev) => ({ ...prev, city: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div className="relative">
              <FieldIcon>
                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </FieldIcon>
              <input
                required
                type="text"
                placeholder="State"
                value={shippingDetails.state}
                onChange={(e) => setShippingDetails((prev) => ({ ...prev, state: e.target.value }))}
                className={fieldClass}
              />
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </p>
          )}

          <Button type="submit" className="luxe-shimmer-btn w-full sm:w-auto" isLoading={verifyingPin}>
            Continue to payment
          </Button>
        </form>

        <div className="luxe-panel luxe-anim luxe-anim-d3 h-fit rounded-2xl p-4 sm:p-6">
          <h2 className="luxe-divider mb-4 border-b pb-3 text-lg font-semibold">Order Summary</h2>
          {items.map((item) => {
            const pricing = getAutomaticOfferItemPricing(item);
            return (
              <div key={`${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}_${item.price}`} className="flex justify-between text-sm mb-3">
                <span className="pr-3">{item.name} <span className="luxe-muted">x{item.quantity}</span></span>
                <span className="text-right">
                  {pricing.discount > 0 ? (
                    <>
                      <span className="luxe-muted block text-xs line-through">{formatInrAmount(pricing.lineSubtotal)}</span>
                      <span className="luxe-total font-semibold">{formatInrAmount(pricing.lineTotal)}</span>
                      <span className="block text-[11px] font-semibold text-emerald-600">
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
          <div className="luxe-divider luxe-muted mt-4 flex justify-between border-t pt-4 text-sm">
            <span>Subtotal</span>
            <span>{formatInrAmount(totalPrice)}</span>
          </div>
          {productOfferDiscount > 0 && (
            <div className="mt-2 flex justify-between text-sm font-semibold text-emerald-600">
              <span>Product offer</span>
              <span>-{formatInrAmount(productOfferDiscount)}</span>
            </div>
          )}
          <div className="mt-4 flex items-baseline justify-between border-t pt-4 font-bold" style={{ borderColor: 'rgba(173,138,76,0.3)' }}>
            <span className="luxe-muted text-sm font-semibold uppercase tracking-[0.1em]">Total</span>
            <span className="luxe-total text-xl">{formatInrAmount(discountedTotal)}</span>
          </div>
          <div className="luxe-muted mt-5 flex items-center justify-center gap-1.5 text-[11px]">
            <span className="luxe-lock-badge flex h-4.5 w-4.5 items-center justify-center rounded-full text-[#ad8a4c]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            Your information is encrypted and secure
          </div>
        </div>
      </div>
    </div>
  );
};