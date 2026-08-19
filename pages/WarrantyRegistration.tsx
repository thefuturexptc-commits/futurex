import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const productTypes = ['Smart Band', 'Smart Ring', 'Bladeless Fan', 'Smart Monitoring', 'Smart Glasses', 'Accessories'];
const modelsByType: Record<string, string[]> = {
  'Smart Band': ['TFX Vital V5', 'Premium Smart Band'],
  'Smart Ring': ['TFX Display Pro Smart Ring', 'Smart Ring'],
  'Bladeless Fan': ['TP-09 Pro', 'Q8 Pro', 'Tower Fan'],
  'Smart Monitoring': ['TheFutureX Smart Sleep Tracking Monitoring System'],
  'Smart Glasses': ['Smart Glasses'],
  Accessories: ['Power Essential', 'Other Accessory'],
};
const purchaseChannels = ['TheFutureX Website', 'Amazon', 'Flipkart', 'Retail Store', 'Corporate Order', 'Gift', 'Other'];
const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const WarrantyRegistration: React.FC = () => {
  const location = useLocation();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [productType, setProductType] = useState('');
  const [model, setModel] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [channel, setChannel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const orderId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('orderId') || '';
  }, [location.search]);

  const selectedProductName = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('product') || '';
  }, [location.search]);

  const modelOptions = useMemo(() => {
    if (!productType) return [];
    return modelsByType[productType] || [];
  }, [productType]);

  useEffect(() => {
    setModel('');
  }, [productType]);

  const requiredValues = [fullName, mobile, email, productType, model, channel, purchaseDate, stateName, city, pincode];
  const filledCount = requiredValues.filter((value) => value.trim().length > 0).length;
  const progress = Math.round((filledCount / requiredValues.length) * 100);
  const isComplete = filledCount === requiredValues.length;
  const ringOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * progress) / 100;

  return (
    <div className="tfx-warranty">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .tfx-warranty {
          --ink: #0a0e15;
          --surface: #131a25;
          --surface-raised: #1a2330;
          --hairline: #2a3546;
          --hairline-soft: #212b3a;
          --brass: #c9a876;
          --brass-bright: #e9d19b;
          --teal: #57d8cb;
          --text: #edf0f5;
          --text-muted: #8e97ab;
          --text-faint: #5c6579;
          --font-display: 'Space Grotesk', 'Inter', sans-serif;
          --font-body: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;

          position: relative;
          min-height: 100vh;
          background: var(--ink);
          color: var(--text);
          font-family: var(--font-body);
          padding: 64px 20px 96px;
          overflow-x: hidden;
        }

        /* Keep the registration page readable even when global theme rules
           apply broad heading/text color overrides. */
        html.dark .tfx-warranty h1,
        html.dark .tfx-warranty h2,
        html.dark .tfx-warranty h3,
        html.dark .tfx-warranty strong,
        html.dark .tfx-warranty label,
        html.dark .tfx-warranty .tfx-hero__sub,
        .tfx-warranty h1,
        .tfx-warranty h2,
        .tfx-warranty h3,
        .tfx-warranty strong,
        .tfx-warranty label,
        .tfx-warranty .tfx-hero__sub {
          color: var(--text) !important;
        }

        html.dark .tfx-warranty .tfx-hero__eyebrow,
        html.dark .tfx-warranty .tfx-field > span,
        html.dark .tfx-warranty .tfx-rail__notes,
        .tfx-warranty .tfx-hero__eyebrow,
        .tfx-warranty .tfx-field > span,
        .tfx-warranty .tfx-rail__notes {
          color: var(--text-muted) !important;
        }

        html.dark .tfx-warranty .tfx-hero__mark,
        html.dark .tfx-warranty .tfx-seal__status,
        .tfx-warranty .tfx-hero__mark,
        .tfx-warranty .tfx-seal__status {
          color: var(--brass-bright) !important;
        }

        html.dark .tfx-warranty .tfx-rail__notes li,
        .tfx-warranty .tfx-rail__notes li {
          color: var(--text-muted) !important;
        }

        .tfx-warranty__glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(640px 420px at 88% -8%, rgba(201, 168, 118, 0.16), transparent 60%),
            radial-gradient(560px 420px at -6% 92%, rgba(87, 216, 203, 0.10), transparent 60%);
        }

        .tfx-warranty__container {
          position: relative;
          max-width: 1040px;
          margin: 0 auto;
        }

        .tfx-hero {
          max-width: 640px;
          margin: 0 auto 56px;
          text-align: center;
        }

        .tfx-hero__mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: min(260px, 72vw);
          height: auto;
          border: 0;
          margin-bottom: 20px;
        }

        .tfx-hero__mark img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .tfx-hero__eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--brass);
          margin: 0 0 14px;
        }

        .tfx-hero h1 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.15;
          margin: 0 0 14px;
          letter-spacing: -0.01em;
        }

        .tfx-hero__sub {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-muted);
          margin: 0;
        }

        .tfx-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 780px) {
          .tfx-layout {
            grid-template-columns: 1fr;
          }
        }

        .tfx-rail {
          position: sticky;
          top: 32px;
          background: var(--surface);
          border: 1px solid var(--hairline);
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }

        @media (max-width: 780px) {
          .tfx-rail {
            position: static;
          }
        }

        .tfx-seal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .tfx-seal__ring-wrap {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .tfx-seal__ring-wrap svg {
          transform: rotate(-90deg);
        }

        .tfx-seal__track {
          fill: none;
          stroke: var(--hairline-soft);
          stroke-width: 3;
        }

        .tfx-seal__progress {
          fill: none;
          stroke: var(--teal);
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease, stroke 0.5s ease;
        }

        .tfx-seal--complete .tfx-seal__progress {
          stroke: var(--brass-bright);
        }

        .tfx-seal__icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tfx-seal__icon svg {
          width: 40px;
          height: 40px;
        }

        .tfx-seal__icon .shield {
          stroke: var(--text-faint);
          fill: none;
          stroke-width: 1.6;
          transition: stroke 0.4s ease;
        }

        .tfx-seal--complete .shield {
          stroke: var(--brass-bright);
        }

        .tfx-seal__icon .check {
          stroke: var(--teal);
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .tfx-seal--complete .check {
          opacity: 1;
          stroke: var(--brass-bright);
        }

        .tfx-seal__status {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0;
        }

        .tfx-seal--complete .tfx-seal__status {
          color: var(--brass-bright);
        }

        .tfx-rail__notes {
          list-style: none;
          margin: 0;
          padding: 18px 0 0;
          border-top: 1px solid var(--hairline-soft);
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tfx-rail__notes li {
          position: relative;
          padding-left: 16px;
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--text-muted);
        }

        .tfx-rail__notes li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 5px;
          height: 5px;
          background: var(--brass);
        }

        .tfx-form {
          background: var(--surface);
          border: 1px solid var(--hairline);
          padding: 32px;
        }

        @media (max-width: 560px) {
          .tfx-form {
            padding: 24px 18px;
          }
        }

        .tfx-success {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid var(--brass);
          background: rgba(201, 168, 118, 0.08);
          padding: 16px 18px;
          margin-bottom: 26px;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--text);
        }

        .tfx-form.is-submitted {
          min-height: 0;
          padding: 0;
          border: 0;
          background: transparent;
        }

        .tfx-form.is-submitted > :not(.tfx-success) {
          display: none;
        }

        .tfx-form.is-submitted .tfx-success {
          position: fixed;
          inset: 50% auto auto 50%;
          z-index: 100;
          width: min(92vw, 520px);
          transform: translate(-50%, -50%);
          margin: 0;
          padding: 28px;
          border: 1px solid var(--teal);
          background: var(--surface-raised);
          box-shadow: 0 24px 80px rgba(0,0,0,.55);
          font-size: 15px;
        }

        .tfx-success strong {
          display: block;
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--brass-bright);
          margin-bottom: 3px;
        }

        .tfx-form__error {
          margin-bottom: 26px;
          padding: 12px 14px;
          border: 1px solid #f87171;
          background: #3b1720;
          color: #fecaca !important;
          font-weight: 600;
        }

        .tfx-form__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 24px;
        }

        @media (max-width: 640px) {
          .tfx-form__grid {
            grid-template-columns: 1fr;
          }
        }

        .tfx-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tfx-field--wide {
          grid-column: 1 / -1;
        }

        .tfx-field > span {
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .tfx-form input[type='text'],
        .tfx-form input[type='email'],
        .tfx-form input[type='tel'],
        .tfx-form input[type='date'],
        .tfx-form select {
          background: var(--surface-raised);
          border: 1px solid var(--hairline);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 14px;
          padding: 11px 13px;
          width: 100%;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .tfx-form select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238e97ab' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 32px;
        }

        .tfx-form select:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .tfx-form input::placeholder {
          color: var(--text-muted) !important;
        }

        html.dark .tfx-warranty .tfx-form input,
        html.dark .tfx-warranty .tfx-form select,
        .tfx-warranty .tfx-form input,
        .tfx-warranty .tfx-form select {
          color: #0f172a !important;
          -webkit-text-fill-color: #0f172a !important;
          opacity: 1 !important;
          caret-color: var(--brass-bright) !important;
        }

        html.dark .tfx-warranty .tfx-form select option,
        .tfx-warranty .tfx-form select option {
          background: var(--surface-raised) !important;
          color: #edf0f5 !important;
          -webkit-text-fill-color: #edf0f5 !important;
        }

        html.dark .tfx-warranty .tfx-form select:disabled,
        .tfx-warranty .tfx-form select:disabled {
          color: var(--text-muted) !important;
          opacity: 1 !important;
        }

        html.dark .tfx-warranty .tfx-form input::placeholder,
        .tfx-warranty .tfx-form input::placeholder {
          color: #64748b !important;
          -webkit-text-fill-color: #64748b !important;
          opacity: 1 !important;
        }

        .tfx-form input:focus,
        .tfx-form select:focus {
          outline: none;
          border-color: var(--brass);
          box-shadow: 0 0 0 3px rgba(201, 168, 118, 0.15);
        }

        .tfx-form input[readonly] {
          color: var(--text-muted);
          background: var(--surface);
        }

        .tfx-phone {
          display: flex;
          align-items: stretch;
          background: var(--surface-raised);
          border: 1px solid var(--hairline);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .tfx-phone:focus-within {
          border-color: var(--brass);
          box-shadow: 0 0 0 3px rgba(201, 168, 118, 0.15);
        }

        .tfx-phone strong {
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--brass-bright);
          border-right: 1px solid var(--hairline);
        }

        .tfx-phone input {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        .tfx-check {
          flex-direction: row;
          align-items: center;
          gap: 10px;
          padding-top: 4px;
        }

        .tfx-check input {
          width: 16px;
          height: 16px;
          accent-color: var(--brass);
        }

        .tfx-check span {
          text-transform: none;
          letter-spacing: normal;
          font-family: var(--font-body);
          font-size: 13.5px;
          color: var(--text);
        }

        .tfx-upload {
          position: relative;
          border: 1px dashed var(--hairline);
          background: var(--surface-raised);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .tfx-upload:hover {
          border-color: var(--brass);
        }

        .tfx-upload svg {
          flex-shrink: 0;
          stroke: var(--brass);
        }

        .tfx-upload__text {
          font-size: 13px;
          color: var(--text-muted);
        }

        .tfx-upload__text strong {
          color: var(--text);
          font-weight: 500;
        }

        .tfx-upload input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .tfx-form__submit {
          margin-top: 28px;
          width: 100%;
          background: var(--brass) !important;
          color: var(--ink) !important;
          border: none !important;
          font-family: var(--font-display) !important;
          font-weight: 600 !important;
          letter-spacing: 0.02em;
          padding: 14px !important;
          font-size: 14.5px !important;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .tfx-form__submit:hover {
          background: var(--brass-bright) !important;
        }
      `}</style>

      <div className="tfx-warranty__glow" aria-hidden="true" />

      <div className="tfx-warranty__container">
        <div className="tfx-hero">
          <span className="tfx-hero__mark">
            <img src="/images/tfx-offer-logo.png" alt="TheFutureX" />
          </span>
          <p className="tfx-hero__eyebrow">Product Authentication &amp; Warranty</p>
          <h1>Register Your TheFutureX Device</h1>
          <p className="tfx-hero__sub">
            A verified registration confirms your coverage window and unlocks priority support if you ever need to file a claim.
          </p>
        </div>

        <div className="tfx-layout">
          <aside className="tfx-rail">
            <div className={`tfx-seal ${isComplete ? 'tfx-seal--complete' : ''}`}>
              <div className="tfx-seal__ring-wrap">
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle className="tfx-seal__track" cx="60" cy="60" r={RING_RADIUS} />
                  <circle
                    className="tfx-seal__progress"
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="tfx-seal__icon">
                  <svg viewBox="0 0 40 40" fill="none">
                    <path
                      className="shield"
                      d="M20 4 L34 9 V19 C34 27.5 28 33.5 20 36 C12 33.5 6 27.5 6 19 V9 Z"
                    />
                    <path className="check" d="M13 20 L18 25 L27 15" />
                  </svg>
                </div>
              </div>
              <p className="tfx-seal__status">{isComplete ? 'Ready to register' : `${progress}% complete`}</p>
            </div>

            <ul className="tfx-rail__notes">
              <li>Coverage is calculated from your verified purchase date</li>
              <li>Keep your invoice on file — it's required for claims</li>
              <li>Registrations are typically confirmed within 48 hours</li>
            </ul>
          </aside>

          <form
            className={`tfx-form${submitted ? ' is-submitted' : ''}`}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              if (!form.checkValidity()) {
                setSubmitted(false);
                setSubmitError('Please complete all required fields before registering.');
                form.querySelector<HTMLElement>(':invalid')?.focus();
                return;
              }
              if (!/^\d{10}$/.test(mobile)) {
                setSubmitted(false);
                setSubmitError('Please enter a valid 10-digit mobile number.');
                return;
              }
              if (!/^\d{6}$/.test(pincode)) {
                setSubmitted(false);
                setSubmitError('Please enter a valid 6-digit pincode.');
                return;
              }
              setSubmitError('');
              setSubmitted(true);
              window.requestAnimationFrame(() => {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            }}
          >
            {submitError && (
              <div className="tfx-form__error" role="alert">{submitError}</div>
            )}
            {submitted && (
              <div className="tfx-success" role="status">
                <div>
                  <strong>Registration recorded</strong>
                  We've logged your device details. Our team will verify your invoice and confirm coverage by email.
                </div>
              </div>
            )}

            <div className="tfx-form__grid">
              {orderId && (
                <label className="tfx-field tfx-field--wide">
                  <span>Order ID</span>
                  <input type="text" value={orderId} readOnly spellCheck={false} />
                </label>
              )}

              {selectedProductName && (
                <label className="tfx-field tfx-field--wide">
                  <span>Product selected</span>
                  <input type="text" value={selectedProductName} readOnly spellCheck={false} />
                </label>
              )}

              <label className="tfx-field">
                <span>Full name*</span>
                <input
                  required
                  type="text"
                  placeholder="As on your invoice"
                  spellCheck={false}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>

              <label className="tfx-field">
                <span>Mobile number*</span>
                <div className="tfx-phone">
                  <strong>+91</strong>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </label>

              <label className="tfx-field tfx-field--wide">
                <span>Email address*</span>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="tfx-field">
                <span>Product type*</span>
                <select required value={productType} onChange={(event) => setProductType(event.target.value)}>
                  <option value="">Select type</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tfx-field">
                <span>Model*</span>
                <select required disabled={!productType} value={model} onChange={(event) => setModel(event.target.value)}>
                  <option value="">Select model</option>
                  {modelOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tfx-field tfx-check tfx-field--wide">
                <input type="checkbox" checked={isGift} onChange={(event) => setIsGift(event.target.checked)} />
                <span>This was a gift to me</span>
              </label>

              <label className="tfx-field">
                <span>Purchase channel*</span>
                <select required value={channel} onChange={(event) => setChannel(event.target.value)}>
                  <option value="">Select channel</option>
                  {purchaseChannels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tfx-field">
                <span>Date of purchase*</span>
                <input
                  required
                  type="date"
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                />
              </label>

              <label className="tfx-field tfx-field--wide">
                <span>Purchase invoice</span>
                <div className="tfx-upload">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" />
                    <path d="M7 8l5-5 5 5" />
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  </svg>
                  <span className="tfx-upload__text">
                    {invoiceFileName ? <strong>{invoiceFileName}</strong> : 'Click to upload PDF, JPG or PNG'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(event) => setInvoiceFileName(event.target.files?.[0]?.name || '')}
                  />
                </div>
              </label>

              <label className="tfx-field">
                <span>State*</span>
                <select required value={stateName} onChange={(event) => setStateName(event.target.value)}>
                  <option value="">Select state</option>
                  {indianStates.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tfx-field">
                <span>City*</span>
                <input required type="text" placeholder="City" spellCheck={false} value={city} onChange={(event) => setCity(event.target.value)} />
              </label>

              <label className="tfx-field">
                <span>Pincode*</span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  value={pincode}
                  onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </label>
            </div>

            <Button type="submit" className="tfx-form__submit">
              Register device
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
