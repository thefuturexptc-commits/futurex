import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, loginWithGoogle } from '../services/backend';
import { AccountLayout } from '../components/AccountLayout';
import { removeProductJsonLd } from '../services/seo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [authHint, setAuthHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectPath = redirectParam && redirectParam.startsWith('/') ? redirectParam : '';
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const getPostAuthPath = (nextUser = user) =>
    redirectPath || (nextUser?.role === 'admin' || nextUser?.role === 'superadmin' ? '/admin' : '/');

  useEffect(() => {
    removeProductJsonLd();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    navigate(getPostAuthPath(user), { replace: true });
  }, [isAuthReady, navigate, redirectPath, user]);

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAuthHint('');
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password.trim()) {
        setError('Enter email and password');
        setLoading(false);
        return;
      }
      if (!isValidEmail(normalizedEmail)) {
        setError('Enter a valid email format');
        setLoading(false);
        return;
      }

      const user = await loginUser(normalizedEmail, password);
      login(user);
      navigate(getPostAuthPath(user), { replace: true });
    } catch (err: any) {
      const message = String(err?.message || 'Login failed.');
      if (message.includes('Account not found')) {
        const normalizedEmail = email.trim().toLowerCase();
        setAuthHint(`No account found for ${normalizedEmail}. Create one and we will bring you right back.`);
        return;
      }
      if (message.includes('Incorrect password')) {
        setError('Incorrect password');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    setAuthHint('');
    try {
      const user = await loginWithGoogle();
      login(user);
      navigate(getPostAuthPath(user), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const signupQuery = new URLSearchParams({
    ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
    ...(redirectPath ? { redirect: redirectPath } : {}),
  }).toString();
  const signupPath = signupQuery ? `/signup?${signupQuery}` : '/signup';

  return (
    <AccountLayout
      mode="login"
      alternatePath={signupPath}
      error={error}
      authHint={authHint}
      loading={loading}
      googleLoading={googleLoading}
      onSubmit={handleSubmit}
      onGoogle={handleGoogleLogin}
    >
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
        <label htmlFor="password">Password</label>
        <div className="account-password">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            enterKeyHint="done"
            placeholder="Enter your password"
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
