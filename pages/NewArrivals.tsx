import React, { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ProductComparisonSection } from '../components/ProductComparisonSection';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { getEffectivePrice, isNewArrivalProduct } from '../utils/productCollections';

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'low-high', label: 'Price: Low to High' },
  { value: 'high-low', label: 'Price: High to Low' },
];

export const NewArrivals: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const newArrivals = useMemo(() => {
    const result = products.filter(isNewArrivalProduct);

    if (sortBy === 'low-high') {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, sortBy]);

  return (
    <div className="new-arrivals-page relative min-h-screen overflow-hidden bg-dark-bg px-4 py-10 text-white sm:py-16">
      <style>{`
        @keyframes naDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes naDriftSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-24px, 24px) scale(1.06); }
        }
        @keyframes naFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes naPulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(28, 169, 164, 0.55); }
          70% { box-shadow: 0 0 0 7px rgba(28, 169, 164, 0); }
        }
        @keyframes naShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes naSpin {
          to { transform: rotate(360deg); }
        }
        .na-orb-a { animation: naDrift 14s ease-in-out infinite; }
        .na-orb-b { animation: naDriftSlow 18s ease-in-out infinite; }
        .na-fade-up { opacity: 0; animation: naFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .na-live-dot { animation: naPulseDot 2.2s ease-in-out infinite; }
        .na-skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.05) 63%); background-size: 800px 100%; animation: naShimmer 1.6s linear infinite; }
        .na-glow-card { position: relative; }
        .na-glow-card::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 1.1rem;
          padding: 1.5px;
          background: conic-gradient(from 0deg, #1ca9a4, #ffb648, #1ca9a4, #117c78, #1ca9a4);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.35s ease;
          animation: naSpin 3.2s linear infinite;
          pointer-events: none;
        }
        .na-glow-card:hover::before { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .na-orb-a, .na-orb-b, .na-fade-up, .na-live-dot, .na-skeleton, .na-glow-card::before {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ambient backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="na-orb-a absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-20 blur-[90px]" style={{ background: 'radial-gradient(circle, #1ca9a4 0%, transparent 72%)' }} />
        <div className="na-orb-b absolute -right-20 top-40 h-96 w-96 rounded-full opacity-[0.14] blur-[100px]" style={{ background: 'radial-gradient(circle, #ffb648 0%, transparent 72%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="na-fade-up">
            <div className="flex items-center gap-2">
              <span className="na-live-dot h-2 w-2 rounded-full bg-[#1ca9a4]" />
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">Just Dropped</p>
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-6xl">
              New{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #1ca9a4 60%, #ffb648 100%)' }}
              >
                Arrivals
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">
              Latest TheFutureX products, updated as new models go live.
            </p>
            {!loading && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#1ca9a4]/30 bg-[#1ca9a4]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5fd6d0]">
                {newArrivals.length} model{newArrivals.length === 1 ? '' : 's'} live now
              </span>
            )}
          </div>

          <label
            className="na-fade-up flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm font-semibold backdrop-blur transition-colors focus-within:border-[#1ca9a4]/60 md:w-auto"
            style={{ animationDelay: '0.08s' }}
          >
            <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Sort</span>
            <div className="relative flex-1 md:flex-none">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full min-w-[150px] appearance-none bg-transparent pr-6 text-white outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-black text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1ca9a4]"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </label>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mx-auto w-full max-w-[260px]">
                <div className="na-skeleton aspect-[4/3] w-full rounded-xl bg-white/5" />
                <div className="na-skeleton mt-3 h-3 w-3/4 rounded bg-white/5" />
                <div className="na-skeleton mt-2 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <div
                key={product.id}
                className="na-glow-card mx-auto w-full max-w-[260px] rounded-2xl opacity-0 home-product-slide"
                style={{ ['--reveal-delay' as string]: `${Math.min(index, 7) * 80}ms` }}
              >
                <div className="relative rounded-2xl bg-dark-bg">
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-[#ffb648] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-black shadow-md">
                    New
                  </span>
                  <ProductCard product={product} compact imageAspectClassName="aspect-[4/3]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="na-fade-up rounded-3xl border border-dashed border-white/15 bg-black/50 p-12 text-center backdrop-blur">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#1ca9a4]/30 bg-[#1ca9a4]/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v18M3 12h18" stroke="#1ca9a4" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold">No new arrivals yet</h2>
            <p className="mt-2 text-gray-300">New products will appear here when they are marked as new arrivals.</p>
          </div>
        )}
      </div>
      {!loading && newArrivals.length > 0 && (
        <ProductComparisonSection
          products={newArrivals}
          eyebrow="New arrival comparison"
          title="Compare New Arrivals"
          subtitle="Use this quick view to compare fresh models by price, highlights, availability, and everyday fit."
          className="relative mt-14 bg-[#f8fbfb] text-slate-950"
        />
      )}
    </div>
  );
};