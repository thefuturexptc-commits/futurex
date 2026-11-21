import React from 'react';
import { Link } from 'react-router-dom';
import ringPhoto from '../assets/images/ring-wellness.webp';
import { Button } from './ui/Button';
import './AccountLayout.css';

type AccountLayoutProps = React.PropsWithChildren<{
  mode: 'login' | 'signup';
  alternatePath: string;
  error: string;
  authHint: string;
  loading: boolean;
  googleLoading: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onGoogle: () => void;
}>;

export const AccountLayout = ({
  mode, alternatePath, error, authHint, loading, googleLoading, onSubmit, onGoogle, children,
}: AccountLayoutProps) => {
  const isSignup = mode === 'signup';
  const alternateAction = isSignup ? 'Sign in' : 'Create an account';

  return (
    <div className="account-page">
      <div className="account-layout">
        <div className="account-visual">
          <img src={ringPhoto} alt="" decoding="async" loading="lazy" />
          <div className="account-visual-copy">
            <p className="account-visual-title">Your FutureX account</p>
            <p>View past orders and manage your saved addresses.</p>
          </div>
        </div>
        <section className="account-content" aria-labelledby="account-title">
          <div className="account-heading">
            <h1 id="account-title">{isSignup ? 'Create an account' : 'Welcome back'}</h1>
            <p>{isSignup ? 'Sign up to track your orders and make checkout easier.' : 'Sign in to view your orders and continue checkout.'}</p>
          </div>

          {error && <p className="account-feedback account-error" role="alert">{error}</p>}
          {authHint && (
            <div className="account-feedback" role="status">
              <p>{authHint}</p>
              <Link className="account-link" to={alternatePath}>{alternateAction}</Link>
            </div>
          )}

          <Button type="button" variant="outline" className="account-button account-google" onClick={onGoogle} disabled={loading} isLoading={googleLoading}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.7-.4-4H24v7.6h11a9.5 9.5 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.8Z" />
              <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5a12.3 12.3 0 0 1-18.3-6.5H5.8v5.2A20 20 0 0 0 24 44Z" />
              <path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4v-5.2H5.8a20 20 0 0 0 0 17.8l6.8-5.2Z" />
              <path fill="#EA4335" d="M24 11.9c3 0 5.6 1 7.6 3l5.7-5.7A19 19 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.2A12 12 0 0 1 24 12Z" />
            </svg>
            Continue with Google
          </Button>
          <div className="account-divider">or continue with email</div>

          <form className="account-form" onSubmit={onSubmit} aria-busy={loading}>
            {children}
            <Button type="submit" className="account-button account-submit" disabled={googleLoading} isLoading={loading}>
              {isSignup ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="account-switch">
            {isSignup ? 'Already have an account?' : 'New to FutureX?'}{' '}
            <Link className="account-link" to={alternatePath}>{alternateAction}</Link>
          </p>
        </section>
      </div>
    </div>
  );
};
