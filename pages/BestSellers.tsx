import React, { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { ProductComparisonSection } from '../components/ProductComparisonSection';
import { getProducts } from '../services/backend';
import { Product } from '../types';
import { getEffectivePrice, isBestSellerProduct } from '../utils/productCollections';
import bestSellerTfx5AiBandImage from '../assets/images/best-seller-tfx5-ai-band.webp';

const isTfx5AiBandProduct = (product: Product): boolean => {
  const text = `${product.id || ''} ${product.slug || ''} ${product.name || ''} ${product.category || ''}`.toLowerCase();
  return /\b(tfx\s*5|tfx5|v5|ai\s*v5|ai\s+smart\s+band)\b/.test(text) && /\b(band|fitness\s*tracker|wristband)\b/.test(text);
};

const addPrimaryProductImage = (images: string[] = [], image: string): string[] => [
  image,
  ...images.filter((item) => item && item !== image),
];

const withBestSellerDisplayImage = (product: Product): Product => {
  if (!isTfx5AiBandProduct(product)) return product;

  return {
    ...product,
    images: addPrimaryProductImage(product.images, bestSellerTfx5AiBandImage),
    colors: product.colors?.map((color, index) =>
      index === 0
        ? {
            ...color,
            images: addPrimaryProductImage(color.images, bestSellerTfx5AiBandImage),
          }
        : color
    ),
    variants: product.variants?.map((variant, index) =>
      index === 0
        ? {
            ...variant,
            images: addPrimaryProductImage(variant.images, bestSellerTfx5AiBandImage),
          }
        : variant
    ),
  };
};

export const BestSellers: React.FC = () => {
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

  const bestSellers = useMemo(() => {
    const result = products.filter(isBestSellerProduct);
    const visibleProducts = result.length > 0 ? result : products;

    if (sortBy === 'low-high') {
      visibleProducts.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'high-low') {
      visibleProducts.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'rating') {
      visibleProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      visibleProducts.sort((a, b) => Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) || (b.sold || 0) - (a.sold || 0) || (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name));
    }

    return visibleProducts.map(withBestSellerDisplayImage);
  }, [products, sortBy]);

  return (
    <div className="best-sellers-page min-h-screen bg-white px-4 py-8 text-slate-950 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">Customer Favorites</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">Best Sellers</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Popular TheFutureX products marked as best sellers in your inventory.
            </p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)] md:w-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-w-[150px] rounded-md bg-white text-slate-950 outline-none"
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
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#df0b16]" />
          </div>
        ) : bestSellers.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((product, index) => (
              <div
                key={product.id}
                className="mx-auto w-full max-w-[320px] opacity-0 home-product-slide sm:max-w-none"
                style={{ ['--reveal-delay' as string]: `${Math.min(index, 7) * 80}ms` }}
              >
                <ProductCard product={product} compact imageAspectClassName="aspect-[4/3]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center shadow-[0_12px_34px_rgba(15,23,42,0.08)]">
            <h2 className="font-display text-2xl font-bold">No best sellers yet</h2>
            <p className="mt-2 text-slate-600">Products will appear here when they are marked as best sellers.</p>
          </div>
        )}
      </div>
      {!loading && bestSellers.length > 0 && (
        <ProductComparisonSection
          products={bestSellers}
          eyebrow="Best seller comparison"
          title="Compare Best Sellers"
          subtitle="Compare customer favorites by price, rating, stock status, and practical use case before adding one to your cart."
          className="mt-14 bg-[#f8fbfb] text-slate-950"
        />
      )}
    </div>
  );
};
