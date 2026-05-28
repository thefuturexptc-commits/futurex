import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyHealthSection: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-dark-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-400">Privacy policy</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy Health Section</h1>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-bold">Health and Wellness Data Disclaimer</h2>
            <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-base">
              TheFutureX is a general fitness, wellness, and lifestyle tracking application. The app is not a medical
              device and is not intended to diagnose, treat, cure, monitor, or prevent any disease or medical
              condition.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-base">
              The app may display health and wellness-related data received from compatible wearable devices, including
              steps, heart rate, SpO2, sleep, body temperature, activity, and related wellness trends. This
              information is provided for general informational and wellness purposes only. It may be inaccurate,
              incomplete, delayed, or affected by device quality, sensor limitations, user behavior, connectivity, or
              other factors.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-base">
              You should not use TheFutureX or any data shown in the app for medical decisions, emergency decisions,
              diagnosis, treatment, or disease prevention. Always consult a qualified healthcare professional for
              medical advice, diagnosis, or treatment. If you believe you may have a medical emergency, contact
              emergency services immediately.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
            <p>This page is available by direct URL.</p>
            <Link to="/" className="font-semibold text-primary-400 transition-colors hover:text-primary-300">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
