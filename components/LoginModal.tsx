import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isPhoneRegistered, loginUser, loginWithGoogle, registerUser, resetPhoneOtpFlow, sendPhoneOtp, verifyPhoneOtp } from '../services/backend';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, redirectPath = '/profile' }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const isValidIndianPhoneInput = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return /^\d{10}$/.test(digits) || /^91\d{10}$/.test(digits) || /^0\d{10}$/.test(digits);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setEmail('');
      setPassword('');
      setPhone('');
      setOtp('');
      setOtpSent(false);
      setOtpVerified(false);
      setOtpSending(false);
      setOtpVerifying(false);
      setError('');
      setShowPassword(false);
      resetPhoneOtpFlow();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !(otpSent && !otpVerified)) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'OTP verification in progress.';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isOpen, otpSent, otpVerified]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (otpSent && !otpVerified) {
      setError('OTP already sent. Please verify it first.');
      return;
    }
    if (!isValidIndianPhoneInput(phone)) {
      setError('Enter a valid Indian number (10-digit or +91 format)');
      return;
    }
    setError('');
    setOtpSending(true);
    try {
      const alreadyRegistered = await isPhoneRegistered(phone);
      if (alreadyRegistered) {
        setError('This phone number is already registered. Please log in.');
        return;
      }
      await sendPhoneOtp(phone, 'recaptcha-container');
      setOtp('');
      setOtpSent(true);
      setOtpVerified(false);
    } catch (error: any) {
      setError(error?.message || 'Failed to send OTP. Check phone auth setup and try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const performRegistration = async (skipOtpCheck = false) => {
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!isValidIndianPhoneInput(phone)) {
      setError('Enter a valid Indian number (10-digit or +91 format)');
      return;
    }
    if (!skipOtpCheck && !otpVerified) {
      setError('Please verify OTP first');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = await registerUser(email.trim(), password, phone);
      login(user);
      onClose();
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : '/');
    } catch {
      setError('Registration failed. Email or phone may already exist.');
    } finally {
      setLoading(false);
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
      await performRegistration(true);
    } catch (error: any) {
      setOtpVerified(false);
      setError(error?.message || 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      login(user);
      onClose();
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : redirectPath);
    } catch (error: any) {
      setError(error?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(email.trim(), password);
      login(user);
      onClose();
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : redirectPath);
    } catch (error: any) {
      setError(error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performRegistration();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div onClick={onClose} className="fixed inset-0 bg-black/70" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-8 transform transition-all duration-300 ease-out animate-modal-pop mx-4"
      >
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Secure Access</p>
        <div className="mt-4 grid grid-cols-2 gap-2 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Register
          </button>
        </div>

        <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{mode === 'login' ? 'Login' : 'Register'}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {mode === 'login' ? 'Continue with Email + Password or Google.' : 'Register with Email + Password + Phone OTP.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit}>
          {error && <p className="text-sm text-red-500 bg-red-100 rounded-md p-2">{error}</p>}
          {mode === 'login' && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full rounded-xl border border-gray-300 dark:border-white/20 py-3 font-semibold text-gray-900 dark:text-white transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60"
            >
              Continue with Google
            </button>
          )}

          {(mode === 'register' || mode === 'login') && (
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
            />
          )}

          {(mode === 'register' || mode === 'login') && (
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="e.g. Future@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="px-4 rounded-lg border border-gray-300 dark:border-white/20 text-sm font-semibold"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          )}

          {mode === 'register' && (
            <>
              <input
                type="tel"
                required
                placeholder="+91XXXXXXXXXX or 10-digit"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp('');
                }}
                className="w-full p-3 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full p-3 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || !otpSent}
                  className="px-4 rounded-lg border border-gray-300 dark:border-white/20 text-sm font-semibold disabled:opacity-50"
                >
                  {otpVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpSending}
                className="w-full rounded-xl border border-gray-300 dark:border-white/20 py-2 font-semibold text-gray-900 dark:text-white transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-60"
              >
                {otpSending ? 'Sending OTP...' : otpSent && !otpVerified ? 'OTP Sent' : 'Send SMS OTP (Live)'}
              </button>
              <div id="recaptcha-container" className="min-h-[78px]" />
              {otpVerified && <p className="text-xs text-green-600 font-semibold">OTP verified successfully</p>}
            </>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (mode === 'register' && !otpVerified)
            }
            className="w-full rounded-xl bg-primary-600 text-white py-3 font-semibold transition-all duration-300 hover:bg-primary-700 disabled:opacity-60"
          >
            {loading
              ? (mode === 'login' ? 'Logging in...' : 'Registering...')
              : (mode === 'login' ? 'Login with Email' : 'Register')}
          </button>
        </form>
      </div>
    </div>
  );
};
