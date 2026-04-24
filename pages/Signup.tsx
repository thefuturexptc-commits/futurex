import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmailRegistered, loginWithGoogle, registerUser } from '../services/backend';
import { Button } from '../components/ui/Button';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, user, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectPath = redirectParam && redirectParam.startsWith('/') ? redirectParam : '';
  const getPostAuthPath = (nextUser = user) =>
    redirectPath || (nextUser?.role === 'admin' || nextUser?.role === 'superadmin' ? '/admin' : '/');

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
        setLoading(false);
        const goToLogin = window.confirm('This email is already registered. Go to Login instead?');
        if (goToLogin) {
          navigate(`/login?email=${encodeURIComponent(normalizedEmail)}&redirect=${encodeURIComponent(redirectPath)}`);
        }
        return;
      }

      const nextUser = await registerUser(normalizedEmail, password, phone, name.trim());
      login(nextUser);
      navigate(getPostAuthPath(nextUser), { replace: true });
    } catch (err: any) {
      const message = String(err?.message || 'Registration failed');
      if (message.includes('Email already registered')) {
        setLoading(false);
        const goToLogin = window.confirm('This email already has an account. Go to Login now?');
        if (goToLogin) {
          navigate(`/login?email=${encodeURIComponent(normalizedEmail)}&redirect=${encodeURIComponent(redirectPath)}`);
        }
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const nextUser = await loginWithGoogle();
      login(nextUser);
      navigate(getPostAuthPath(nextUser), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="auth-card max-w-md w-full space-y-6 sm:space-y-8 backdrop-blur-xl p-4 sm:p-8 rounded-2xl sm:rounded-3xl">
        <div>
          <p className="text-center text-xs tracking-[0.25em] font-bold text-cyan-600 dark:text-cyan-300 uppercase">Join TheFutureX</p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Register</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            New customer? Sign up with email or Google. Already registered? We will guide you back to login.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-center text-sm text-red-200">{error}</div>}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                id="full-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="+91XXXXXXXXXX or 10-digit"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="e.g. Future@123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full rounded-xl" isLoading={loading}>
              Register
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300 dark:bg-white/15" />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">OR</span>
            <div className="h-px flex-1 bg-gray-300 dark:bg-white/15" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            Continue with Google
          </Button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            New users can create an account with Google instantly, and existing users can sign in with the same Google account.
          </p>

          <div className="text-center mt-4">
            <span className="text-gray-300 text-sm">Already have an account? </span>
            <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="text-primary-600 hover:text-primary-500 text-sm font-medium">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
