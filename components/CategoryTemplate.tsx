<<<<<<< HEAD
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';
import { isSameCollection } from '../utils/productCollections';
=======
import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

<<<<<<< HEAD
interface ShowcaseImage {
  src: string;
  alt: string;
}

=======
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
interface CategoryTemplateProps {
  category: string;
  title: string;
  subtitle: string;
<<<<<<< HEAD
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
=======
  heroGradient: string; // CSS class for gradient background
  heroImage: string; // URL for the hero image
  accentColor: string; // text-color class for accents
  features: Feature[];
}

export const CategoryTemplate: React.FC<CategoryTemplateProps> = ({ 
  category, 
  title, 
  subtitle, 
  heroGradient,
  heroImage,
  accentColor,
  features
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    setLoading(true);
    getProducts().then(data => {
      const categoryProducts = data.filter(p => p.category === category);
      setProducts(categoryProducts);
      setLoading(false);
    });
  }, [category]);

  useEffect(() => {
    let result = [...products];
    
    if (sortBy === 'low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
    }

    setFilteredProducts(result);
  }, [products, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500">
      
      {/* Immersive Hero Section */}
      <div className={`relative ${heroGradient} min-h-[60vh] flex items-center overflow-hidden`}>
        {/* Abstract Background Patterns */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 text-xs font-bold tracking-[0.2em] uppercase mb-6 font-display">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    {category} Series
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                    {title}
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                    {subtitle}
                </p>
            </div>

            {/* Hero Image */}
            <div className="relative flex justify-center lg:justify-end animate-float">
                <div className="relative z-10 w-full max-w-md aspect-square rounded-[3rem] overflow-hidden glass-card border-0 shadow-2xl shadow-black/30">
                     <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent z-10"></div>
                     <img 
                        src={heroImage} 
                        alt={category} 
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                     />
                </div>
                {/* Decorative Blur Behind Image */}
                <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full transform scale-75"></div>
            </div>
        </div>
      </div>

      {/* Feature Highlights Strip (Overlapping Hero) */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                  <div key={idx} className="glass-card bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300">
                      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gray-50 dark:bg-white/5 ${accentColor}`}>
                          {feature.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Available Models</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Explore the latest generation of {category}.</p>
            </div>
            
            <div className="flex items-center gap-4">
               <span className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap hidden sm:inline">Sort by:</span>
               <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[160px]"
                  >
                    <option value="featured">Featured</option>
                    <option value="rating">Top Rated</option>
                    <option value="low-high">Price: Low to High</option>
                    <option value="high-low">Price: High to Low</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
               </div>
            </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white dark:bg-white/5 rounded-[2rem] h-96 animate-pulse"></div>
                ))}
            </div>
        ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 12H4M12 20V4" /></svg>
                <p className="text-xl font-bold text-gray-900 dark:text-white font-display">Coming Soon</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">New {category} are being manufactured in our labs.</p>
            </div>
        )}
      </div>
    </div>
  );
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
