import React from 'react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
  title?: string;
  description?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSignup,
  title = 'Login Required',
  description = 'Please login or register to continue.',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <button
        aria-label="Close auth popup"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-cyan-200/50 dark:border-cyan-900/50 bg-white/95 dark:bg-slate-900/95 p-8 shadow-2xl animate-fade-in-up">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">Secure Access</p>
          <h3 className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Continue to Login
          </button>
          <button
            onClick={onSignup}
            className="w-full rounded-xl border border-gray-300 dark:border-white/20 px-4 py-3 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Register New Account
          </button>
        </div>
      </div>
    </div>
  );
};
