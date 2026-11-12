import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../services/firebaseConfig';

// Mounted once at app level so cart changes on any page keep the saved cart current.
export function CartRecoverySync() {
  const { user, isAuthReady, isAdmin } = useAuth();
  const { items } = useCart();
  useEffect(() => {
    if (!isAuthReady || !user || isAdmin) return;
    const timer = window.setTimeout(async () => {
      try {
        const ref = doc(db, 'recovery_carts', user.id);
        const saved = await getDoc(ref);
        if (!saved.exists() || !saved.data().consent) return;
        await setDoc(ref, { items: JSON.parse(JSON.stringify(items)), updatedAt: new Date().toISOString(), completed: items.length === 0 }, { merge: true });
      } catch { /* Optional reminders never interrupt shopping. */ }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [items, user?.id, isAuthReady, isAdmin]);
  return null;
}

export function CartReminder() {
  const { user, isAdmin } = useAuth();
  const { items } = useCart();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (user && !isAdmin) void getDoc(doc(db, 'recovery_carts', user.id)).then(snapshot => setEnabled(Boolean(snapshot.data()?.consent))).catch(() => {});
  }, [user?.id, isAdmin]);
  if (isAdmin) return null;
  return <section className="my-5 rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-800">
    <h2 className="font-semibold">Need more time?</h2>
    {user?.email ? <label className="mt-2 flex items-start gap-3"><input type="checkbox" className="mt-1" checked={enabled} disabled={busy} onChange={async event => {
      const consent = event.target.checked;
      setBusy(true);
      try {
        await setDoc(doc(db, 'recovery_carts', user.id), { userId: user.id, consent, consentAt: new Date().toISOString(), items: JSON.parse(JSON.stringify(items)), updatedAt: new Date().toISOString(), completed: items.length === 0 }, { merge: true });
        setEnabled(consent);
        setMessage(consent ? `We’ll email one reminder to ${user.email} if you leave your cart for an hour. You can turn this off here.` : 'Cart reminders turned off.');
      } catch { setMessage('Unable to save your preference. Please try again.'); }
      finally { setBusy(false); }
    }} /><span>Email me a reminder about this cart. Optional; no preselected consent.</span></label> : <p className="mt-2"><Link className="text-teal-700 underline" to="/login?redirect=%2Fcart">Sign in</Link> to save your cart and opt in to an email reminder.</p>}
    <p role="status" className="mt-2 text-xs">{message}</p>
  </section>;
}
