import React from 'react';
import { Link } from 'react-router-dom';

const supportEmail = 'support@thefuturex.in';

export const DeleteAccount: React.FC = () => {
  return (
    <div className="tfx-standard-page min-h-screen bg-dark-bg text-white">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-dark-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-400">Account support</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Delete Your TheFutureX Account</h1>
          <p className="mt-5 text-base leading-7 text-gray-300">
            If you would like to delete your TheFutureX account and associated personal data, you can request deletion
            by contacting our support team.
          </p>

          <div className="mt-8 space-y-6">
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-bold">How to request deletion</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-gray-300 sm:text-base">
                <li>
                  Send an email to{' '}
                  <a href={`mailto:${supportEmail}`} className="font-semibold text-white underline-offset-4 hover:underline">
                    {supportEmail}
                  </a>
                </li>
                <li>Use the subject line: Account Deletion Request</li>
                <li>Include your registered email or phone number linked to your account</li>
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-bold">What data will be deleted?</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-gray-300 sm:text-base">
                <li>Account profile information</li>
 <li>Tracking records</li>
                <li>Connected device information</li>
                <li>Saved preferences</li>
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-bold">Data retention</h2>
              <p className="mt-4 text-sm leading-6 text-gray-300 sm:text-base">
                Once your request is verified, your account and associated data will be permanently deleted within 30
                days.
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              For any questions, contact us at{' '}
              <a href={`mailto:${supportEmail}`} className="font-semibold text-white underline-offset-4 hover:underline">
                {supportEmail}
              </a>
            </p>
            <Link to="/" className="font-semibold text-primary-400 transition-colors hover:text-primary-300">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
