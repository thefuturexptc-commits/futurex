import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { addProductNotifyRequest } from '../services/backend';

const SMART_GLASSES_NOTIFY_ID = 'coming-soon-tfx-ai-smart-glasses';
const SMART_GLASSES_NOTIFY_NAME = 'TFX AI Smart Glasses';

export const SmartGlasses: React.FC = () => {
  const { user } = useAuth();
  const [showNotifyCard, setShowNotifyCard] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contact, setContact] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');

  useEffect(() => {
    if (!showNotifyCard) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showNotifyCard]);

  const openNotifyCard = () => {
    const preferredEmail = user?.email?.trim();
    const preferredPhone = user?.phone?.trim();
    const nextType = preferredEmail ? 'email' : preferredPhone ? 'phone' : 'email';
    setContactType(nextType);
    setContact(nextType === 'email' ? preferredEmail || '' : preferredPhone || '');
    setNotifyMessage('');
    setShowNotifyCard(true);
  };

  const handleNotify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedContact = contact.trim();
    const phoneDigits = normalizedContact.replace(/\D/g, '');

    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContact)) {
      setNotifyMessage('Please enter a valid email address.');
      return;
    }
    if (contactType === 'phone' && phoneDigits.length < 10) {
      setNotifyMessage('Please enter a valid phone number.');
      return;
    }

    setNotifySubmitting(true);
    setNotifyMessage('');
    try {
      await addProductNotifyRequest({
        productId: SMART_GLASSES_NOTIFY_ID,
        productName: SMART_GLASSES_NOTIFY_NAME,
        contact: contactType === 'phone' ? phoneDigits : normalizedContact,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
      });
      setNotifyMessage('Done. We will notify you first.');
    } catch (error) {
      setNotifyMessage(error instanceof Error ? error.message : 'Unable to save your request.');
    } finally {
      setNotifySubmitting(false);
    }
  };

  return (
    <main className="smart-glasses-page bg-white">
      <section className="smart-glasses-gifts-section flex items-center justify-center px-4 py-12 text-center sm:px-5 sm:py-20">
        <div className="max-w-2xl">
          <p className="smart-glasses-eyebrow font-serif text-3xl font-bold italic text-[#d6aa4d] min-[380px]:text-4xl sm:text-6xl">
            AI Smart Glasses
          </p>
          <h2 className="smart-glasses-title mt-4 font-display text-3xl font-black min-[380px]:text-4xl sm:mt-6 sm:text-6xl">
            Coming Soon
          </h2>
          <p className="smart-glasses-description mx-auto mt-4 max-w-xl text-sm font-medium leading-6 text-slate-600 min-[380px]:text-base min-[380px]:leading-7 sm:mt-5 sm:text-lg">
            TheFutureX AI Smart Glasses are being prepared for hands-free capture, voice control, and smarter everyday moments.
          </p>
          <button
            type="button"
            onClick={openNotifyCard}
            className="smart-glasses-cta mt-7 inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-[#b58a39] sm:mt-8 sm:min-h-12 sm:w-auto sm:px-8"
          >
            Notify Me
          </button>
        </div>
      </section>

      {showNotifyCard && createPortal(
        <div className="smart-glasses-notify-overlay" role="presentation" onMouseDown={() => setShowNotifyCard(false)}>
          <div
            className="smart-glasses-notify-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="smart-glasses-notify-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="smart-glasses-notify-close"
              onClick={() => setShowNotifyCard(false)}
              aria-label="Close notification form"
            >
              X
            </button>
            <span className="smart-glasses-notify-kicker">Coming soon</span>
            <h2 id="smart-glasses-notify-title">Be first to know</h2>
            <p>Choose where you would like to receive the TFXAI Smart Glasses launch alert.</p>

            <div className="smart-glasses-contact-tabs" role="group" aria-label="Contact method">
              {(['email', 'phone'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={contactType === type ? 'is-active' : ''}
                  onClick={() => {
                    setContactType(type);
                    setContact(type === 'email' ? user?.email || '' : user?.phone || '');
                    setNotifyMessage('');
                  }}
                >
                  {type === 'email' ? 'Email' : 'Phone number'}
                </button>
              ))}
            </div>

            <form onSubmit={handleNotify}>
              <label htmlFor="smart-glasses-notify-contact">
                {contactType === 'email' ? 'Email address' : 'Phone number'}
              </label>
              <input
                id="smart-glasses-notify-contact"
                type={contactType === 'email' ? 'email' : 'tel'}
                inputMode={contactType === 'email' ? 'email' : 'tel'}
                autoComplete={contactType === 'email' ? 'email' : 'tel'}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder={contactType === 'email' ? 'you@example.com' : 'Enter your phone number'}
                autoFocus
              />
              {notifyMessage && (
                <span className={notifyMessage.startsWith('Done') ? 'is-success' : 'is-error'}>
                  {notifyMessage}
                </span>
              )}
              <button type="submit" disabled={notifySubmitting || notifyMessage.startsWith('Done')}>
                {notifySubmitting ? 'Saving...' : notifyMessage.startsWith('Done') ? 'You are on the list' : 'Notify Me'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
};
