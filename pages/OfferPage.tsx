import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const formatOfferTitle = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

export const OfferPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const offerTitle = formatOfferTitle(slug) || 'Exclusive Member Offer';

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg px-4 py-10 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 p-6 sm:p-10 shadow-lg">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary-600 dark:text-primary-300">Member Offer</p>
          <h1 className="mt-3 text-2xl sm:text-4xl font-bold leading-tight break-words">{offerTitle}</h1>
          <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            You unlocked this deal after login. Continue to checkout with eligible products to apply this offer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/shop/all" className="w-full sm:w-auto">
              <Button className="w-full justify-center whitespace-normal px-4 text-center sm:w-auto">
                Shop Eligible Products
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full justify-center whitespace-normal px-4 text-center sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
