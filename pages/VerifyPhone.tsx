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

  const readPersistedFlow = (): CheckoutFlowState | null => {
    try {
      const raw = window.sessionStorage.getItem('checkout_flow_state');
      if (!raw) return null;
      return JSON.parse(raw) as CheckoutFlowState;
    } catch {
      return null;
    }
  };

  const [currentFlow, setCurrentFlow] = useState<CheckoutFlowState | null>(() => flowState || readPersistedFlow());
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [draftPhone, setDraftPhone] = useState('');
  const [lastOtpPhone, setLastOtpPhone] = useState('');
  const [autoSendAttemptedPhone, setAutoSendAttemptedPhone] = useState('');
  const [sendMode, setSendMode] = useState<'auto' | 'manual' | null>(null);

  const phone = useMemo(() => currentFlow?.phone?.replace(/\D/g, '').slice(0, 10) || '', [currentFlow?.phone]);

  useEffect(() => {
    if (flowState) setCurrentFlow(flowState);
  }, [flowState]);

  useEffect(() => {
    setDraftPhone(phone);
  }, [phone]);

  useEffect(() => {
    if (!currentFlow) return;
    window.sessionStorage.setItem('checkout_flow_state', JSON.stringify(currentFlow));
  }, [currentFlow]);

  useEffect(() => {
    resetPhoneOtpFlow();
    return () => {
      resetPhoneOtpFlow();
    };
  }, []);

  if (!currentFlow?.shippingDetails || !phone) {
    return <Navigate to="/checkout" replace />;
  }

  const sendOtpForPhone = async (targetPhone: string, mode: 'auto' | 'manual' = 'manual') => {
    if (sending) return;
    const normalizedTarget = targetPhone.replace(/\D/g, '').slice(0, 10);
    if (!/^[6-9]\d{9}$/.test(normalizedTarget)) {
      setError('Please check your phone number. Enter a valid 10-digit Indian mobile number starting with 6-9.');
      setMessage('');
      setOtpSent(false);
      setEditingPhone(true);
      return;
    }

    setError('');
    setMessage('');
    setSendMode(mode);
    setSending(true);
    setOtpSent(false);
    try {
      await Promise.race([
        sendPhoneOtp(normalizedTarget, 'checkout-recaptcha-container'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('OTP request timed out. Please try again.')), 10000)),
      ]);
      setMessage(mode === 'auto' ? `OTP sent automatically to +91 ${normalizedTarget}.` : `OTP sent to +91 ${normalizedTarget}.`);
      setOtpSent(true);
      setLastOtpPhone(normalizedTarget);
    } catch (err: any) {
      const raw = String(err?.message || 'Failed to send OTP.');
      if (/recaptcha|captcha/i.test(raw)) {
        setError('Captcha issue detected. Please wait a few seconds and try again, or refresh the page.');
      } else if (/invalid|phone|number/i.test(raw)) {
        setError('Please check your phone number. It looks invalid or unreachable for OTP.');
        setEditingPhone(true);
      } else {
        setError(raw);
      }
      setOtpSent(false);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!phone) return;
    if (sending) return;
    if (autoSendAttemptedPhone === phone) return;
    if (lastOtpPhone === phone) return;
    setAutoSendAttemptedPhone(phone);
    void sendOtpForPhone(phone, 'auto');
  }, [phone, sending, lastOtpPhone, autoSendAttemptedPhone]);

  const handleUpdatePhone = async () => {
    const cleaned = draftPhone.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length !== 10 || !currentFlow) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    const nextFlow: CheckoutFlowState = {
      ...currentFlow,
      phone: cleaned,
      phoneVerified: false,
      shippingDetails: {
        ...currentFlow.shippingDetails,
        phoneNumber: cleaned,
      },
    };

    setCurrentFlow(nextFlow);
    navigate('/verify-phone', { replace: true, state: nextFlow });
    setEditingPhone(false);
    setOtp('');
    setError('');
    setMessage('Phone updated. Sending OTP automatically...');
    setAutoSendAttemptedPhone('');
  };

  const handleVerifyOtp = async () => {
    if (sending) {
      setError('OTP is still being sent. Please wait a few seconds and try verify again.');
      return;
    }
    if (!otpSent) {
      setError('OTP not sent yet. Please wait a moment or check your number/captcha message below.');
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
          ...currentFlow,
          phoneVerified: true,
        } as CheckoutFlowState,
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid OTP.';
      setError(errMsg);
      setEditingPhone(true);
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
          <Button type="button" onClick={() => void sendOtpForPhone(phone, 'manual')} disabled={sending}>
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
        {sending && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {sendMode === 'manual' ? 'Sending OTP...' : 'Sending OTP automatically...'}
          </p>
        )}

        <div id="checkout-recaptcha-container" className="min-h-[78px]" />
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="pt-1">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Didn't receive OTP?</p>
          <button
            type="button"
            onClick={() => setEditingPhone((prev) => !prev)}
            className="text-sm font-semibold text-primary-600 hover:text-primary-500"
          >
            {editingPhone ? 'Cancel' : 'Edit Phone Number'}
          </button>
        </div>

        {editingPhone && (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3 bg-gray-50/60 dark:bg-white/5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Correct Phone Number</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">+91</span>
              <input
                type="tel"
                value={draftPhone}
                onChange={(e) => setDraftPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="flex-1 rounded-lg p-3 border border-gray-300 dark:border-white/20 dark:bg-white/5 dark:text-white"
              />
            </div>
            <Button type="button" onClick={handleUpdatePhone}>
              Update Number
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
