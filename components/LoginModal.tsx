import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, redirectPath = '/' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const goToLogin = () => {
    onClose();
    const next = `/login?redirect=${encodeURIComponent(redirectPath)}`;
    try {
      navigate(next);
    } catch {
      window.location.href = next;
    }
  };

  const goToRegister = () => {
    onClose();
    const next = `/signup?redirect=${encodeURIComponent(redirectPath)}`;
    try {
      navigate(next);
    } catch {
      window.location.href = next;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-3">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-[1px]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white dark:bg-dark-surface rounded-xl shadow-2xl p-5"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
          aria-label="Close auth popup"
        >
          ✕
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Join TheFutureX</p>
        <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">Join TheFutureX</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Login to unlock exclusive offers & faster checkout
        </p>

        <p className="mt-4 text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">Login / Register</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={goToLogin}
            className="rounded-lg bg-primary-600 text-white py-2.5 text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Continue with Email
          </button>
          <button
            type="button"
            onClick={goToRegister}
            className="rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};
