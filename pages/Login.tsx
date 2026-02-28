import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initPhoneRecaptcha, loginWithPhoneOtp, resetPhoneOtpFlow, sendPhoneOtp, verifyPhoneOtp } from '../services/backend';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/profile';
  const isValidIndianPhoneInput = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return /^\d{10}$/.test(digits) || /^91\d{10}$/.test(digits) || /^0\d{10}$/.test(digits);
  };
  useEffect(() => {
    initPhoneRecaptcha('recaptcha-container').catch(() => {
      // Errors are handled in sendPhoneOtp.
    });
    return () => resetPhoneOtpFlow();
  }, []);

  const handleSendOtp = async () => {
    if (!isValidIndianPhoneInput(phone)) {
      setError('Enter a valid Indian number (10-digit or +91 format)');
      return;
    }
    setError('');
    setOtpSending(true);
    try {
      await sendPhoneOtp(phone, 'recaptcha-container');
      setOtp('');
      setOtpSent(true);
      setOtpVerified(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpSent) {
      setError('Please send OTP first');
      return;
    }
    setError('');
    setOtpVerifying(true);
    try {
      await verifyPhoneOtp(otp);
      setOtpVerified(true);
    } catch (err: any) {
      setOtpVerified(false);
      setError(err?.message || 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError('Please verify OTP first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginWithPhoneOtp(phone);
      login(user);
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : redirectPath);
    } catch (err: any) {
      setError(err?.message || 'No account found for this phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_#111827_0%,_#020617_60%,_#000000_100%)]">
      <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-cyan-100 dark:border-cyan-900/40">
        <div>
          <p className="text-center text-xs tracking-[0.25em] font-bold text-cyan-600 dark:text-cyan-300 uppercase">Secure Access</p>
          <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Phone OTP Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Login securely using Firebase phone verification
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <div className="flex gap-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-white/5"
                  placeholder="+91XXXXXXXXXX or 10-digit"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" onClick={handleSendOtp} disabled={otpSending}>
                  {otpSending ? 'Sending...' : 'Send SMS OTP (Live)'}
                </Button>
              </div>
            </div>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OTP</label>
              <div className="flex gap-2">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-white/5"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <Button type="button" size="sm" variant="outline" onClick={handleVerifyOtp} disabled={otpVerifying || !otpSent}>
                  {otpVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              <div id="recaptcha-container" className="min-h-[78px]" />
              {otpVerified && <p className="text-green-600 text-xs mt-1 font-semibold">OTP verified successfully</p>}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full rounded-xl" isLoading={loading} disabled={!otpVerified}>
              Access Account
            </Button>
          </div>

          <div className="text-center mt-4">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Don't have an account? </span>
            <Link to={`/signup?redirect=${encodeURIComponent(redirectPath)}`} className="text-primary-600 hover:text-primary-500 text-sm font-medium">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
