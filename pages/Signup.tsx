<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmailRegistered, loginWithGoogle, registerUser } from '../services/backend';
=======
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, loginWithGoogle } from '../services/backend';
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
import { Button } from '../components/ui/Button';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
<<<<<<< HEAD
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
=======
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
<<<<<<< HEAD
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
=======
    
    if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
    }

    try {
      const user = await registerUser(name, email, password);
      login(user);
      navigate('/profile');
    } catch (error: any) {
      setError(error.message || 'Registration failed');
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
<<<<<<< HEAD
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
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-center text-sm text-red-200" role="alert">{error}</div>}
          {authHint && (
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-center text-sm text-cyan-100 break-words" role="status" aria-live="polite">
              <p>{authHint}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3 w-full rounded-xl" onClick={() => navigate(loginPath)}>
                Log in instead
              </Button>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                id="full-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                enterKeyHint="next"
                className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Your full name"
                value={name}
                disabled={loading || googleLoading}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

=======
    setLoading(true);
    setError('');
    try {
      // Google Login handles both login and signup flows on the backend (creates doc if missing)
      const user = await loginWithGoogle();
      login(user);
      navigate('/profile');
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Google Sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-white/5">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Join the future of wearable technology
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-white/5"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
<<<<<<< HEAD
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                disabled={loading || googleLoading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAuthHint('');
                }}
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
                enterKeyHint="next"
                className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="+91XXXXXXXXXX or 10-digit"
                value={phone}
                disabled={loading || googleLoading}
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
                  enterKeyHint="done"
                  className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="e.g. Future@123"
                  value={password}
                  disabled={loading || googleLoading}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" disabled={loading || googleLoading} onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
=======
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-white/5"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-white/5"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
            </div>
          </div>

          <div>
<<<<<<< HEAD
            <Button type="submit" className="w-full rounded-xl" isLoading={loading} disabled={googleLoading}>
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
            isLoading={googleLoading}
          >
            Continue with Google
          </Button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            New users can create an account with Google instantly, and existing users can sign in with the same Google account.
          </p>

          <div className="text-center mt-4">
            <span className="text-gray-300 text-sm">Already have an account? </span>
            <Link to={loginPath} className="text-primary-600 hover:text-primary-500 text-sm font-medium">Log in</Link>
=======
            <Button type="submit" className="w-full" isLoading={loading}>Sign Up</Button>
          </div>
          
          <div className="flex flex-col space-y-3 mt-4">
             <button 
               type="button" 
               onClick={handleGoogleSignup}
               disabled={loading}
               className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
               </svg>
               {loading ? 'Connecting...' : 'Sign up with Google'}
             </button>
          </div>

          <div className="text-center mt-4">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Already have an account? </span>
            <Link to="/login" className="text-primary-600 hover:text-primary-500 text-sm font-medium">Log in</Link>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
          </div>
        </form>
      </div>
    </div>
  );
};
