import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmailRegistered, loginWithGoogle, registerUser } from '../services/backend';
import { AccountLayout } from '../components/AccountLayout';
import { removeProductJsonLd } from '../services/seo';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [authHint, setAuthHint] = useState('');
  const { login, user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectPath = redirectParam && redirectParam.startsWith('/') ? redirectParam : '';
  const getPostAuthPath = (nextUser = user) =>
    redirectPath || (nextUser?.role === 'admin' || nextUser?.role === 'superadmin' ? '/admin' : '/');

  useEffect(() => {
    removeProductJsonLd();
  }, []);

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    navigate(getPostAuthPath(user), { replace: true });
  }, [isAuthReady, navigate, redirectPath, user]);

  const isValidIndianPhoneInput = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return /^\d{10}$/.test(digits) || /^91\d{10}$/.test(digits) || /^0\d{10}$/.test(digits);
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAuthHint('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim()) {
      setError('Enter your full name');
      setLoading(false);
      return;
    }
    if (!normalizedEmail) {
      setError('Enter email address');
      setLoading(false);
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (!isValidIndianPhoneInput(phone)) {
      setError('Enter a valid Indian number (10-digit or +91 format)');
      setLoading(false);
      return;
    }

    try {
      const alreadyRegistered = await isEmailRegistered(normalizedEmail);
      if (alreadyRegistered) {
        setAuthHint(`${normalizedEmail} already has an account. Log in and we will continue from there.`);
        return;
      }

      const nextUser = await registerUser(normalizedEmail, password, phone, name.trim());
      login(nextUser);
      navigate(getPostAuthPath(nextUser), { replace: true });
    } catch (err: any) {
      const message = String(err?.message || 'Registration failed');
      if (message.includes('Email already registered')) {
        setAuthHint(`${normalizedEmail} already has an account. Log in and we will continue from there.`);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');
    setAuthHint('');
    try {
      const nextUser = await loginWithGoogle();
      login(nextUser);
      navigate(getPostAuthPath(nextUser), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginQuery = new URLSearchParams({
    ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
    ...(redirectPath ? { redirect: redirectPath } : {}),
  }).toString();
  const loginPath = loginQuery ? `/login?${loginQuery}` : '/login';

  return (
    <AccountLayout
      mode="signup"
      alternatePath={loginPath}
      error={error}
      authHint={authHint}
      loading={loading}
      googleLoading={googleLoading}
      onSubmit={handleSubmit}
      onGoogle={handleGoogleSignup}
    >
      <div className="account-field">
        <label htmlFor="full-name">Full name</label>
        <input
          id="full-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          enterKeyHint="next"
          placeholder="Your full name"
          value={name}
          disabled={loading || googleLoading}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="account-field">
        <label htmlFor="email-address">Email address</label>
        <input
          id="email-address"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="you@example.com"
          value={email}
          disabled={loading || googleLoading}
          onChange={(e) => {
            setEmail(e.target.value);
            setAuthHint('');
          }}
        />
      </div>
      <div className="account-field">
        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          enterKeyHint="next"
          placeholder="10 digits, with optional +91"
          value={phone}
          disabled={loading || googleLoading}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="account-field">
        <label htmlFor="password">Password</label>
        <div className="account-password">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            enterKeyHint="done"
            placeholder="At least 6 characters"
            value={password}
            disabled={loading || googleLoading}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="account-password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-controls="password"
            disabled={loading || googleLoading}
            onClick={() => setShowPassword((previous) => !previous)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </AccountLayout>
  );
};
