import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';
import { isSameCollection } from '../utils/productCollections';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ShowcaseImage {
  src: string;
  alt: string;
}

interface CategoryTemplateProps {
  category: string;
  title: string;
  subtitle: string;
  heroGradient: string;
  heroImage: string;
  mobileHeroImage?: string;
  heroVideo?: string;
  heroBackgroundImage?: string;
  heroOverlayClassName?: string;
  heroTintClassName?: string;
  heroSideOverlayClassName?: string;
  showHeroGridPattern?: boolean;
  heroAsFullBanner?: boolean;
  overviewImage?: string;
  accentColor: string;
  features: Feature[];
  showcaseImages?: ShowcaseImage[];
  autoSlideModels?: boolean;
  modelCardClassName?: string;
  modelCardSkeletonClassName?: string;
  modelCardImageAspectClassName?: string;
}

const CategoryTemplateComponent: React.FC<CategoryTemplateProps> = ({
  category,
  title,
  subtitle,
  heroImage,
  mobileHeroImage,
  heroVideo,
  heroAsFullBanner = false,
  overviewImage,
  features,
  showcaseImages = [],
  modelCardSkeletonClassName,
  modelCardImageAspectClassName,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const loadProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data.filter((product) => isSameCollection(product.category, category)));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load products right now.');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => loadProducts(), [loadProducts]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const result = [...products];
    const getEffectivePrice = (product: Product) => Number(product.salePrice || product.price || 0);

    if (sortBy === 'low-high') {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      result.sort((a, b) => {
        const aScore = Number(Boolean(a.isNewArrival || a.isFeatured)) + Number(Boolean(a.isBestSeller));
        const bScore = Number(Boolean(b.isNewArrival || b.isFeatured)) + Number(Boolean(b.isBestSeller));
        return bScore - aScore || a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [products, sortBy]);

  const skeletonClassName = modelCardSkeletonClassName || 'h-[430px]';
  const imageAspectClassName = modelCardImageAspectClassName || 'aspect-[4/3]';

  return (
    <div className="category-crescent-page min-h-screen bg-white text-slate-950 transition-colors duration-500">
      <section className="category-template-hero relative left-1/2 min-h-[560px] w-screen -translate-x-1/2 overflow-hidden bg-slate-950 text-white sm:min-h-[620px]">
        {heroAsFullBanner && (
          <>
            <img
              src={heroImage}
              alt=""
              className={`site-hero-media absolute inset-0 h-full w-full object-cover object-[center_58%] ${mobileHeroImage ? 'hidden sm:block' : ''}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              aria-hidden="true"
            />
            {mobileHeroImage && (
              <img
                src={mobileHeroImage}
                alt=""
                className="site-hero-media absolute inset-0 h-full w-full object-cover object-[center_58%] sm:hidden"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                aria-hidden="true"
              />
            )}
          </>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.52),rgba(2,6,23,0.28),rgba(2,6,23,0.04))]" aria-hidden="true" />
        <div className={`relative z-10 mx-auto grid min-h-[560px] max-w-7xl items-center gap-8 px-5 pb-14 pt-24 sm:min-h-[620px] sm:px-8 lg:px-10 ${heroAsFullBanner ? 'lg:grid-cols-[0.8fr_1.2fr]' : 'lg:grid-cols-[0.95fr_1.05fr]'}`}>
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#67e8f9] drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)] sm:text-xs">{category}</p>
            <h1 className="max-w-3xl font-display text-3xl font-black leading-[1.04] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.62)] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-white/92 drop-shadow-[0_2px_14px_rgba(0,0,0,0.62)] sm:text-lg sm:leading-8">{subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <a href="#catalog" className="site-hero-cta site-hero-cta-primary">
                Buy Now
              </a>
              <a href="#overview" className="site-hero-cta site-hero-cta-secondary">
                Buy Now
              </a>
            </div>
          </div>
          <div className={`flex justify-center lg:justify-end ${heroAsFullBanner ? 'hidden' : ''}`}>
            {heroVideo ? (
              <video
                src={heroVideo}
                poster={heroImage}
                className="max-h-[430px] w-full max-w-[560px] object-contain drop-shadow-[0_30px_90px_rgba(34,211,238,0.18)]"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={`${category} animation`}
              />
            ) : (
              <img
                src={heroImage}
                alt={category}
                className="max-h-[430px] w-full max-w-[560px] object-contain drop-shadow-[0_30px_90px_rgba(34,211,238,0.18)]"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            )}
          </div>
        </div>
      </section>

      <section id="overview" className="bg-white px-5 py-12 text-slate-950 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
            Product Line Overview
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="overflow-hidden rounded-[1.5rem] bg-[#eff8f8] sm:rounded-[2rem]">
              <img src={overviewImage || heroImage} alt={`${category} overview`} className="h-full min-h-[260px] w-full object-contain p-6 sm:min-h-[380px] sm:p-8" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">Product Overview</p>
              <h3 className="mt-4 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Premium {category} for Everyday Confidence
              </h3>
              <p className="mt-5 text-lg font-bold leading-8 text-slate-950 sm:text-xl">Smart hardware, clean design, and useful data in one refined experience.</p>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-[#f2fbfb] px-4 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {loadError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="mb-8 flex flex-col items-center justify-between gap-5 text-center lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">{category}</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">Product Catalog</h2>
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-950 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`rounded-[1.5rem] bg-white shadow-sm ${skeletonClassName} animate-pulse`} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} compact imageAspectClassName={imageAspectClassName} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-14 text-center sm:py-20">
              <p className="text-xl font-bold">Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {showcaseImages.length > 0 && (
        <section className="bg-white px-0 py-10 sm:px-0 lg:py-14">
          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
            {showcaseImages.map((image) => (
              <article key={image.src} className="min-h-[280px] overflow-hidden bg-slate-950 sm:min-h-[360px] xl:min-h-[420px]">
                <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
          Health Scenarios & Solutions
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,63,70,0.08)]">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#ecfbfb] text-[#159c98]">{feature.icon}</div>
              <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export const CategoryTemplate = React.memo(CategoryTemplateComponent);
