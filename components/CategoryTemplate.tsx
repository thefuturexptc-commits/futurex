import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CategoryTemplateProps {
  category: string;
  title: string;
  subtitle: string;
  heroGradient: string; // CSS class for gradient background
  heroImage: string; // URL for the hero image
  heroBackgroundImage?: string; // optional URL for immersive hero backdrop
  heroOverlayClassName?: string;
  heroTintClassName?: string;
  heroSideOverlayClassName?: string;
  showHeroGridPattern?: boolean;
  accentColor: string; // text-color class for accents
  features: Feature[];
  autoSlideModels?: boolean;
  modelCardClassName?: string;
  modelCardSkeletonClassName?: string;
  modelCardImageAspectClassName?: string;
}

const CategoryTemplateComponent: React.FC<CategoryTemplateProps> = ({
  category,
  title,
  subtitle,
  heroGradient,
  heroImage,
  heroBackgroundImage,
  heroOverlayClassName,
  heroTintClassName,
  heroSideOverlayClassName,
  showHeroGridPattern = true,
  accentColor,
  features,
  autoSlideModels = true,
  modelCardClassName,
  modelCardSkeletonClassName,
  modelCardImageAspectClassName
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isDraggingModels, setIsDraggingModels] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const modelsScrollerRef = useRef<HTMLDivElement | null>(null);
  const pauseAutoSlideRef = useRef(false);
  const featureScrollerRef = useRef<HTMLDivElement | null>(null);
  const pauseFeatureAutoSlideRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const handleHorizontalWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
    event.preventDefault();
  }, []);

  const handleModelsMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const scroller = modelsScrollerRef.current;
    if (!scroller) return;
    setIsDraggingModels(true);
    pauseAutoSlideRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = scroller.scrollLeft;
  }, []);

  const handleModelsMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingModels) return;
    const scroller = modelsScrollerRef.current;
    if (!scroller) return;
    const deltaX = event.clientX - dragStartXRef.current;
    scroller.scrollLeft = dragStartScrollLeftRef.current - deltaX;
  }, [isDraggingModels]);

  const stopModelsDragging = useCallback(() => {
    if (!isDraggingModels) return;
    setIsDraggingModels(false);
    pauseAutoSlideRef.current = false;
  }, [isDraggingModels]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getProducts()
      .then((data) => {
        if (cancelled) return;
        const normalizedCategory = category.trim().toLowerCase();
        const categoryProducts = data.filter(
          (p) => (p.category || '').trim().toLowerCase() === normalizedCategory
        );
        setProducts(categoryProducts);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load products right now.';
        setLoadError(message);
        setProducts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const filteredProducts = useMemo(() => {
    const result = [...products];
    const getEffectivePrice = (p: Product) => Number(p.salePrice || p.price || 0);
    if (sortBy === 'low-high') {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
    }
    return result;
  }, [products, sortBy]);

  // Auto-slide animation: mobile carousel always shows, but animation requires autoSlideModels=true
  useEffect(() => {
    if (!autoSlideModels || !isMobile || loading || filteredProducts.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!modelsScrollerRef.current) return;

    let rafId = 0;
    let lastTs = 0;
    const speedPxPerMs = 0.05;

    const tick = (ts: number) => {
      const scroller = modelsScrollerRef.current;
      if (!scroller) return;
      if (!lastTs) lastTs = ts;
      const delta = Math.min(ts - lastTs, 32);
      lastTs = ts;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll > 0 && !pauseAutoSlideRef.current && !document.hidden) {
        const resetPoint = Math.min(scroller.scrollWidth / 2, maxScroll);
        scroller.scrollLeft += delta * speedPxPerMs;
        if (scroller.scrollLeft >= resetPoint) scroller.scrollLeft = 0;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [autoSlideModels, isMobile, loading, filteredProducts.length]);

  useEffect(() => {
    if (!isMobile || features.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!featureScrollerRef.current) return;

    let rafId = 0;
    let lastTs = 0;
    const speedPxPerMs = 0.045;

    const tick = (ts: number) => {
      const scroller = featureScrollerRef.current;
      if (!scroller) return;
      if (!lastTs) lastTs = ts;
      const delta = Math.min(ts - lastTs, 32);
      lastTs = ts;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll > 0 && !pauseFeatureAutoSlideRef.current && !document.hidden) {
        const resetPoint = Math.min(scroller.scrollWidth / 2, maxScroll);
        scroller.scrollLeft += delta * speedPxPerMs;
        if (scroller.scrollLeft >= resetPoint) scroller.scrollLeft = 0;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [features.length]);

  const modelCardBaseClass = modelCardClassName || 'w-[62vw] sm:w-[36vw] lg:w-[24vw] xl:w-[20vw] min-w-[180px] max-w-[280px]';
  const modelSkeletonBaseClass = modelCardSkeletonClassName || 'h-72';
  const modelImageAspectClass = modelCardImageAspectClassName || 'aspect-[4/3]';
  const featureCards = features.length > 1 ? [...features, ...features] : features;

  // On mobile, always duplicate products for infinite scroll feel
  const mobileProducts = filteredProducts.length > 1
    ? [...filteredProducts, ...filteredProducts]
    : filteredProducts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white transition-colors duration-500">

      {/* Immersive Hero Section */}
      <div className={`relative ${heroBackgroundImage ? 'bg-black' : heroGradient} min-h-[60vh] flex items-center overflow-hidden text-white`}>
        {heroBackgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 animate-pulse"
            style={{ backgroundImage: `url(${heroBackgroundImage})`, animationDuration: '10s' }}
            aria-hidden="true"
          />
        )}
        {heroBackgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 animate-pulse mix-blend-screen"
            style={{ backgroundImage: `url(${heroBackgroundImage})`, animationDuration: '7s' }}
            aria-hidden="true"
          />
        )}
        {/* Abstract Background Patterns */}
        {showHeroGridPattern && <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>}
        <div className={`absolute inset-0 ${heroOverlayClassName || 'bg-gradient-to-b from-black/52 via-black/68 to-black/80'}`}></div>
        <div className={`absolute inset-0 ${heroTintClassName || 'bg-black/22'}`}></div>
        <div className={`absolute top-0 right-0 w-1/2 h-full ${heroSideOverlayClassName || 'bg-gradient-to-l from-black/55 to-transparent'}`}></div>
        <div className="absolute -top-20 left-8 w-72 h-72 rounded-full bg-cyan-300/8 blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-8 right-16 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl animate-float-slow" style={{ animationDelay: '1.5s' }}></div>

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
            <div className="absolute -inset-6 rounded-[3.5rem] bg-cyan-300/20 blur-3xl animate-pulse-slow"></div>
            <div className="relative z-10 w-full max-w-md aspect-square rounded-[3rem] overflow-hidden glass-card border border-cyan-300/25 shadow-2xl shadow-cyan-700/25 animate-float-slow group">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-cyan-200/10 z-10"></div>
              <img
                src={heroImage}
                alt={category}
                loading="lazy"
                width={960}
                height={960}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            {/* Decorative Blur Behind Image */}
            <div className="absolute inset-0 bg-cyan-100/20 blur-[100px] rounded-full transform scale-75 animate-pulse-slow"></div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Strip (Overlapping Hero) */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 sm:-mt-14 lg:-mt-20 relative z-20 text-gray-900 dark:text-white">
        <div
          ref={featureScrollerRef}
          onWheel={handleHorizontalWheel}
          onMouseEnter={() => {
            pauseFeatureAutoSlideRef.current = true;
          }}
          onMouseLeave={() => {
            pauseFeatureAutoSlideRef.current = false;
          }}
          onTouchStart={() => {
            pauseFeatureAutoSlideRef.current = true;
          }}
          onTouchEnd={() => {
            pauseFeatureAutoSlideRef.current = false;
          }}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 px-1 select-none [-webkit-overflow-scrolling:touch]"
        >
          {featureCards.map((feature, idx) => (
            <div key={`${feature.title}_${idx}`} className="glass-card bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-5 sm:p-8 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300 w-[74vw] sm:w-[52vw] md:w-[320px] lg:w-[360px] shrink-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-3 sm:mb-4 flex items-center justify-center bg-gray-50 dark:bg-white/5 ${accentColor}`}>
                {feature.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-display mb-1.5 sm:mb-2">{feature.title}</h3>
              <p className="text-[13px] sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-24 text-gray-900 dark:text-white">
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {loadError}
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Available Models</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Explore the latest generation of {category}.</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[160px]"
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
          isMobile ? (
            // 📱 MOBILE LOADING (scrollable skeleton)
            <div className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`bg-white dark:bg-white/5 rounded-[2rem] ${modelSkeletonBaseClass} ${modelCardBaseClass} shrink-0 animate-pulse snap-start`}
                />
              ))}
            </div>
          ) : (
            // 💻 DESKTOP LOADING (grid skeleton — w-full, let grid cols handle sizing)
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`bg-white dark:bg-white/5 rounded-[2rem] ${modelSkeletonBaseClass} w-full animate-pulse`} />
              ))}
            </div>
          )
        ) : filteredProducts.length > 0 ? (
          isMobile ? (
            // 📱 MOBILE → ALWAYS SCROLLABLE CAROUSEL (auto-slides when autoSlideModels=true)
            <div
              ref={modelsScrollerRef}
              onWheel={handleHorizontalWheel}
              onMouseDown={handleModelsMouseDown}
              onMouseMove={handleModelsMouseMove}
              onMouseUp={stopModelsDragging}
              onMouseLeave={() => {
                stopModelsDragging();
                pauseAutoSlideRef.current = false;
              }}
              onTouchStart={() => { pauseAutoSlideRef.current = true; }}
              onTouchEnd={() => { pauseAutoSlideRef.current = false; }}
              className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing [-webkit-overflow-scrolling:touch]"
            >
              {mobileProducts.map((p, index) => (
                <div
                  key={`${p.id}_${index}`}
                  className={`${modelCardBaseClass} shrink-0 snap-start`}
                >
                  <ProductCard
                    product={p}
                    compact
                    imageAspectClassName={modelImageAspectClass}
                    disableHoverEffects
                  />
                </div>
              ))}
            </div>
          ) : (
            // 💻 DESKTOP → NORMAL WRAP GRID
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  compact
                  imageAspectClassName={modelImageAspectClass}
                />
              ))}
            </div>
          )
        ) : (
          // EMPTY STATE
          <div className="text-center py-20 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5">
            <p className="text-xl font-bold">Coming Soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CategoryTemplate = React.memo(CategoryTemplateComponent);