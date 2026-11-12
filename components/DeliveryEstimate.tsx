import React, { useState } from 'react';
import { verifyIndianPincode } from '../services/backend';
import './StorefrontEngagement.css';

export function DeliveryEstimate({ warranty }: { warranty: string }) {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  return <section className="delivery-estimate mt-4 text-sm text-slate-800" aria-label="Delivery and warranty">
    <form onSubmit={async event => {
      event.preventDefault();
      if (!/^[1-9]\d{5}$/.test(pin)) { setMessage('Enter a valid 6-digit Indian pincode.'); return; }
      setBusy(true);
      setMessage('');
      try {
        const location = await verifyIndianPincode(pin);
        setMessage(location ? `${location.city}, ${location.state}: estimated delivery in 3–7 business days. Final serviceability and COD eligibility are confirmed at checkout.` : 'We could not verify this pincode. Please contact us to confirm delivery.');
      } catch { setMessage('Unable to check right now. Please try again.'); }
      finally { setBusy(false); }
    }}>
      <label htmlFor="delivery-pin" className="font-semibold">Check delivery by pincode</label>
      <div className="mt-2 flex gap-2"><input id="delivery-pin" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={pin} onChange={event => { setPin(event.target.value.replace(/\D/g, '')); setMessage(''); }} placeholder="6-digit pincode" className="delivery-estimate__pin min-w-0 flex-1 rounded-lg px-3 py-2" /><button type="submit" disabled={busy} className="delivery-estimate__check rounded-lg px-4 py-2">{busy ? 'Checking…' : 'Check'}</button></div>
      <p role="status" className={message ? 'mt-2 text-xs leading-5' : 'sr-only'}>{message}</p>
    </form>
    <p className="mt-3">Cash on delivery available on eligible orders.</p>
    <p className="mt-1 font-medium">{warranty}</p>
  </section>;
}
