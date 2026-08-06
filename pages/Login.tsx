import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, loginWithGoogle } from '../services/backend';
import { Button } from '../components/ui/Button';
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
    <div className="auth-page tfx-standard-page min-h-screen overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="auth-card mx-auto w-full max-w-md space-y-6 rounded-2xl bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.08)] sm:p-8">
          <div>
            <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[#df0b16]">Welcome back</p>
            <h1 className="mt-3 text-center text-3xl font-black text-slate-950">Login</h1>
            <p className="mt-2 text-center text-sm leading-6 text-slate-600">Sign in to continue checkout and view your orders.</p>
          </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && <div className="rounded-lg bg-red-50 p-3 text-center text-sm font-semibold text-red-700" role="alert">{error}</div>}
          {authHint && (
            <div className="rounded-lg bg-cyan-50 p-3 text-center text-sm font-semibold text-cyan-800 break-words" role="status" aria-live="polite">
              <p>{authHint}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3 w-full rounded-lg" onClick={() => navigate(signupPath)}>
                Create account
              </Button>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="mb-1.5 block text-sm font-bold text-slate-800">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                className="auth-input relative block w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-[#df0b16] focus:ring-2 focus:ring-[#df0b16]/15"
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
              <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-800">Password</label>
              <div className="flex gap-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
                  className="auth-input relative block min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-[#df0b16] focus:ring-2 focus:ring-[#df0b16]/15"
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading || googleLoading}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="button" size="sm" variant="outline" className="h-auto rounded-lg px-4" disabled={loading || googleLoading} onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full rounded-lg" isLoading={loading} disabled={googleLoading}>
              Login
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
            className="w-full rounded-lg bg-white !text-slate-950 hover:!bg-slate-100"
            onClick={handleGoogleLogin}
            disabled={loading}
            isLoading={googleLoading}
          >
            <span className="mr-2 grid h-5 w-5 place-items-center rounded-full bg-white text-sm font-black text-[#4285f4]">G</span>
            Continue with Google
          </Button>

          <div className="text-center mt-4">
            <span className="text-slate-500 text-sm">Don't have an account? </span>
            <Link to={signupPath} className="text-primary-600 hover:text-primary-500 text-sm font-medium">Sign up</Link>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};
