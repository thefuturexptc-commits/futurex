import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckoutFlowState, CheckoutShippingDetails } from '../types';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { verifyIndianPincode } from '../services/backend';
import { cartItemsToAnalyticsItems, pushDataLayerEvent } from '../services/analytics';
import { getCouponItemPricing } from '../utils/coupons';

const emptyShipping: CheckoutShippingDetails = {
  name: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

export const Checkout: React.FC = () => {
  const { items, totalPrice, couponCode, couponDiscount, discountedTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shippingDetails, setShippingDetails] = useState<CheckoutShippingDetails>(emptyShipping);
  const [error, setError] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [lastVerifiedPin, setLastVerifiedPin] = useState('');
  const pinVerifySeqRef = useRef(0);
  const checkoutEventKey = useMemo(
    () => `begin_checkout_${items.map((item) => `${item.id}:${item.quantity}:${item.price}`).join('|')}_${discountedTotal}_${couponCode}`,
    [items, discountedTotal, couponCode]
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
        coupon: couponCode || undefined,
        items: cartItemsToAnalyticsItems(items),
      },
    });
  }, [checkoutEventKey, items, discountedTotal, couponCode]);

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
    const flowState: CheckoutFlowState = {
      phone: phoneDigits,
      phoneVerified: window.sessionStorage.getItem('checkout_phone_verified') === phoneDigits,
      shippingDetails: nextShippingDetails,
    };
    window.sessionStorage.setItem('checkout_flow_state', JSON.stringify(flowState));
    pushDataLayerEvent('add_shipping_info', {
      ecommerce: {
        currency: 'INR',
        value: Number(discountedTotal.toFixed(2)),
        coupon: couponCode || undefined,
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
    return <div className="checkout-page p-10 text-center dark:text-white">Your cart is empty.</div>;
  }

  return (
    <div className="checkout-page min-h-screen max-w-5xl mx-auto px-4 py-10 sm:py-12 pb-24 sm:pb-12 text-white">
      <h1 className="text-xl sm:text-3xl font-bold text-white mb-3">Checkout</h1>
      <CheckoutStepper current="address" />
      {!user && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="text-sm text-gray-200">
            Login or signup is optional. You can continue as guest, or use your account for faster checkout.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/login?redirect=%2Fcheckout">
              <Button type="button" variant="outline">Login</Button>
            </Link>
            <Link to="/signup?redirect=%2Fcheckout">
              <Button type="button" variant="outline">Sign up</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleContinue} className="lg:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Shipping Details</h2>

          <input
            required
            type="text"
            placeholder="Name"
            value={shippingDetails.name}
            onChange={(e) => setShippingDetails((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-500"
          />

          <input
            required
            type="tel"
            placeholder="Phone Number"
            value={shippingDetails.phoneNumber}
            onChange={(e) =>
              setShippingDetails((prev) => ({
                ...prev,
                phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 12),
              }))
            }
            className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-400">Autofill-friendly: 10-digit, `0xxxxxxxxxx`, or `91xxxxxxxxxx` are accepted.</p>

          <div className="space-y-2">
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
              className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-500"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button type="button" variant="outline" onClick={() => void handleVerifyPincode()} disabled={verifyingPin}>
                {verifyingPin ? 'Verifying...' : 'Verify Pincode'}
              </Button>
              {pinMessage && (
                <p className={`text-xs ${pinMessage.startsWith('Verified') ? 'text-green-600' : 'text-amber-300'}`}>
                  {pinMessage}
                </p>
              )}
            </div>
          </div>

          <input
            required
            type="text"
            placeholder="Address"
            value={shippingDetails.address}
            onChange={(e) => setShippingDetails((prev) => ({ ...prev, address: e.target.value }))}
            className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              type="text"
              placeholder="City"
              value={shippingDetails.city}
              onChange={(e) => setShippingDetails((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-500"
            />
            <input
              required
              type="text"
              placeholder="State"
              value={shippingDetails.state}
              onChange={(e) => setShippingDetails((prev) => ({ ...prev, state: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-black/30 p-3 text-white placeholder:text-gray-500"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full sm:w-auto" isLoading={verifyingPin}>
            Continue
          </Button>
        </form>

        <div className="h-fit rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
          {items.map((item) => {
            const pricing = getCouponItemPricing(item, couponCode);
            return (
              <div key={`${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}_${item.price}`} className="flex justify-between text-sm mb-2 text-gray-200">
                <span className="pr-3">{item.name} x {item.quantity}</span>
                <span className="text-right">
                  {pricing.discount > 0 ? (
                    <>
                      <span className="block text-xs text-gray-500 line-through">Rs {pricing.lineSubtotal.toFixed(2)}</span>
                      <span>Rs {pricing.lineTotal.toFixed(2)}</span>
                    </>
                  ) : (
                    <>Rs {pricing.lineSubtotal.toFixed(2)}</>
                  )}
                </span>
              </div>
            );
          })}
          <div className="border-t border-white/10 mt-4 pt-4 flex justify-between text-sm text-gray-300">
            <span>Subtotal</span>
            <span>Rs {totalPrice.toFixed(2)}</span>
          </div>
          {couponCode && (
            <div className="mt-2 flex justify-between text-sm font-semibold text-emerald-300">
              <span>Coupon {couponCode}</span>
              <span>-Rs {couponDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-white/10 mt-4 pt-4 font-bold flex justify-between text-white">
            <span>Total</span>
            <span>Rs {discountedTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
