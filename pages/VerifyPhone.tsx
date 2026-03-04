import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckoutStepper } from '../components/CheckoutStepper';
import { CheckoutFlowState } from '../types';
import { resetPhoneOtpFlow, sendPhoneOtp, verifyPhoneOtp } from '../services/backend';

export const VerifyPhone: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const flowState = location.state as CheckoutFlowState | undefined;
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const phone = useMemo(() => flowState?.phone?.replace(/\D/g, '').slice(0, 10) || '', [flowState?.phone]);

  useEffect(() => {
    // Always start this step with a fresh OTP session.
    resetPhoneOtpFlow();
    return () => {
      resetPhoneOtpFlow();
    };
  }, []);

  if (!flowState?.shippingDetails || !phone) {
    return <Navigate to="/checkout" replace />;
  }

  const handleSendOtp = async () => {
    setError('');
    setMessage('');
    setSending(true);
    setOtpSent(false);
    try {
      await sendPhoneOtp(phone, 'checkout-recaptcha-container');
      setMessage('OTP sent successfully.');
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP.');
      setOtpSent(false);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpSent) {
      setError('Please send OTP first.');
      return;
    }
    setError('');
    setMessage('');
    setVerifying(true);
    try {
      await verifyPhoneOtp(otp);
      window.sessionStorage.setItem('checkout_phone_verified', phone);
      navigate('/payment', {
        state: {
          ...flowState,
          phoneVerified: true,
        } as CheckoutFlowState,
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid OTP.';
      setError(errMsg);
      if (/expired|invalid|resend/i.test(errMsg)) {
        setOtp('');
        setOtpSent(false);
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Checkout</h1>
      <CheckoutStepper current="verify" />

      <div className="bg-white dark:bg-white/5 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-white/10 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verify Phone Number</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">+91 {phone}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="button" onClick={handleSendOtp} disabled={sending}>
            {sending ? 'Sending OTP...' : 'Send OTP'}
          </Button>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="flex-1 rounded-lg p-3 border border-gray-300 dark:border-white/20 dark:bg-white/5 dark:text-white"
          />
          <Button type="button" onClick={handleVerifyOtp} disabled={verifying || otp.length !== 6 || !otpSent}>
            {verifying ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </div>

        <div id="checkout-recaptcha-container" className="min-h-[78px]" />
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};
