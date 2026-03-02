import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, loginWithGoogle } from '../services/backend';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/profile';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!email.trim() || !password.trim()) {
        setError('Enter email and password');
        setLoading(false);
        return;
      }
      const user = await loginUser(email.trim(), password);
      login(user);
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : redirectPath);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      login(user);
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : redirectPath);
    } catch (err: any) {
      setError(err?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_45%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_#111827_0%,_#020617_60%,_#000000_100%)]">
      <div className="max-w-md w-full space-y-8 bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-cyan-100 dark:border-cyan-900/40">
        <div>
          <p className="text-center text-xs tracking-[0.25em] font-bold text-cyan-600 dark:text-cyan-300 uppercase">Secure Access</p>
          <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Login with Email + Password or Google
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center bg-red-100 p-2 rounded">{error}</div>}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Continue with Google
          </Button>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full rounded-xl" isLoading={loading}>
              Login
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
