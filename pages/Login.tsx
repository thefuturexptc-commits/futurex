<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
=======
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
import { useAuth } from '../context/AuthContext';
import { loginUser, loginWithGoogle } from '../services/backend';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
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
    if (!isAuthReady || !user) return;
    navigate(getPostAuthPath(user), { replace: true });
  }, [isAuthReady, navigate, redirectPath, user]);

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);
=======
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
=======
    try {
      const user = await loginUser(email, password);
      login(user);
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    } catch (error) {
      setError('Invalid email or password');
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
<<<<<<< HEAD
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
    <div className="auth-page min-h-screen flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="auth-card max-w-md w-full space-y-6 sm:space-y-8 backdrop-blur-xl p-4 sm:p-8 rounded-2xl sm:rounded-3xl">
        <div>
          <p className="text-center text-xs tracking-[0.25em] font-bold text-cyan-600 dark:text-cyan-300 uppercase">Join TheFutureX</p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            New or returning customer, you can continue with email or Google and get in smoothly.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-center text-sm text-red-200" role="alert">{error}</div>}
          {authHint && (
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-center text-sm text-cyan-100 break-words" role="status" aria-live="polite">
              <p>{authHint}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3 w-full rounded-xl" onClick={() => navigate(signupPath)}>
                Create account
              </Button>
            </div>
          )}
=======
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      login(user);
      navigate(user.role === 'admin' ? '/admin' : '/profile');
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-surface p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-white/5">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to manage your orders and profile
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">{error}</div>}
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
          <div className="rounded-md shadow-sm space-y-4">
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
=======
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-white/5"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
<<<<<<< HEAD
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
                  className="auth-input appearance-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading || googleLoading}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto" disabled={loading || googleLoading} onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
=======
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
              Continue with Email
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
            onClick={handleGoogleLogin}
            disabled={loading}
            isLoading={googleLoading}
          >
            Continue with Google
          </Button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            New users can create an account with Google instantly, and existing users can log in with the same Google account.
          </p>

          <div className="text-center mt-4">
            <span className="text-gray-300 text-sm">Don't have an account? </span>
            <Link to={signupPath} className="text-primary-600 hover:text-primary-500 text-sm font-medium">Sign up</Link>
=======
            <Button type="submit" className="w-full" isLoading={loading}>Sign in</Button>
          </div>
          
          <div className="flex flex-col space-y-3 mt-4">
             <button 
               type="button" 
               onClick={handleGoogleLogin}
               disabled={loading}
               className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
               </svg>
               {loading ? 'Signing in...' : 'Sign in with Google'}
             </button>
          </div>
          
          <div className="text-center mt-4">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Don't have an account? </span>
            <Link to="/signup" className="text-primary-600 hover:text-primary-500 text-sm font-medium">Sign up</Link>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
          </div>
        </form>
      </div>
    </div>
  );
};
