import React, { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { getProducts } from '../services/backend';

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
    const result = products.filter((product) => product.isFeatured);
    const getEffectivePrice = (product: Product) => Number(product.salePrice || product.price || 0);

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
    <div className="min-h-screen bg-dark-bg px-4 py-10 text-white sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">Just Dropped</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">New Arrivals</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-300 sm:text-base">
              Latest TheFutureX products, updated as new models go live.
            </p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-semibold md:w-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-w-[150px] bg-transparent text-white outline-none"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <div
                key={product.id}
                className="mx-auto w-full max-w-[260px] opacity-0 home-product-slide"
                style={{ ['--reveal-delay' as string]: `${Math.min(index, 7) * 80}ms` }}
              >
                <ProductCard product={product} compact imageAspectClassName="aspect-[4/3]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-black p-12 text-center">
            <h2 className="font-display text-2xl font-bold">No new arrivals yet</h2>
            <p className="mt-2 text-gray-300">New products will appear here when they are marked featured.</p>
          </div>
        )}
      </div>
    </div>
  );
};
