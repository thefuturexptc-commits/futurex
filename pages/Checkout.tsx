import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckoutFlowState, CheckoutShippingDetails } from '../types';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { verifyIndianPincode } from '../services/backend';

const emptyShipping: CheckoutShippingDetails = {
  name: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

export const Checkout: React.FC = () => {
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();
  const [shippingDetails, setShippingDetails] = useState<CheckoutShippingDetails>(emptyShipping);
  const [error, setError] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [lastVerifiedPin, setLastVerifiedPin] = useState('');
  const pinVerifySeqRef = useRef(0);

  const normalizeIndianMobile = (input: string) => {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length === 10) return digits;
    return '';
  };

  const isAddressLikelyValid = (value: string) => {
    const normalized = value.trim();
    return normalized.length >= 8 && /[A-Za-z]/.test(normalized) && /\d/.test(normalized);
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
      return false;
    }

    setPinMessage('');
    setVerifyingPin(true);
    const pinData = await verifyIndianPincode(pin);
    setVerifyingPin(false);

    if (!pinData) {
      setPinMessage('Pincode not found. Please enter a valid Indian pincode.');
      setLastVerifiedPin('');
      return false;
    }

    setPinMessage(`Verified pincode: ${pinData.city}, ${pinData.country}`);
    setLastVerifiedPin(pin);
    return true;
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
      const ok = await verifyPin(pin);
      if (pinVerifySeqRef.current !== seq) return;
      if (!ok && !/not found|valid|verified/i.test(pinMessage)) {
        setPinMessage('Pincode not found. Please enter a valid Indian pincode.');
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [shippingDetails.pincode, lastVerifiedPin]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = normalizedPhone;

    if (!isAddressLikelyValid(shippingDetails.address)) {
      setError('Please enter a valid address with house/building details.');
      return;
    }

    if (!isValid) {
      setError('Please fill all fields correctly before continuing.');
      return;
    }

    const pin = shippingDetails.pincode.replace(/\D/g, '').slice(0, 6);
    const isPinValid = pin === lastVerifiedPin ? true : await verifyPin(pin);
    if (!isPinValid) {
      setError('Please enter a valid Indian pincode before continuing.');
      return;
    }

    setError('');
    const flowState: CheckoutFlowState = {
      phone: phoneDigits,
      phoneVerified: window.sessionStorage.getItem('checkout_phone_verified') === phoneDigits,
      shippingDetails: {
        ...shippingDetails,
        phoneNumber: phoneDigits,
        pincode: pin,
      },
    };
    window.sessionStorage.setItem('checkout_flow_state', JSON.stringify(flowState));

    // ✅ META PIXEL: InitiateCheckout
    if (flowState.phoneVerified) {
      navigate('/payment', { replace: true, state: flowState });
      return;
    }
    navigate('/verify-phone', { replace: true, state: flowState });
  };

  if (items.length === 0) {
    return <div className="p-10 text-center dark:text-white">Your cart is empty.</div>;
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10 sm:py-12 pb-24 sm:pb-12 text-white">
      <h1 className="text-xl sm:text-3xl font-bold text-white mb-3">Checkout</h1>
      <CheckoutStepper current="address" />

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

          <input
            required
            type="text"
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
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => void handleVerifyPincode()} disabled={verifyingPin}>
              {verifyingPin ? 'Verifying...' : 'Verify Pincode'}
            </Button>
            {pinMessage && (
              <p className={`text-xs ${pinMessage.startsWith('Verified') ? 'text-green-600' : 'text-red-500'}`}>
                {pinMessage}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full sm:w-auto" isLoading={verifyingPin}>
            Continue
          </Button>
        </form>

        <div className="h-fit rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm mb-2 text-gray-200">
              <span className="pr-3">{item.name} x {item.quantity}</span>
              <span>Rs {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-white/10 mt-4 pt-4 font-bold flex justify-between text-white">
            <span>Total</span>
            <span>Rs {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
