import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';
import DarkVeil from './DarkVeil';

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

  const loadProducts = useCallback(() => {
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

  useEffect(() => loadProducts(), [loadProducts]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

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
  const normalizedHeroCategory = category.toLowerCase();
  const isFanHero = normalizedHeroCategory.includes('fan');
  const isBandHero = normalizedHeroCategory.includes('band');

  // On mobile, always duplicate products for infinite scroll feel
  const mobileProducts = filteredProducts.length > 1
    ? [...filteredProducts, ...filteredProducts]
    : filteredProducts;

  return (
    <div className="min-h-screen bg-dark-bg text-white transition-colors duration-500">

      {/* Immersive Hero Section */}
      <section className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#020817] text-white">
        <div className="absolute inset-0 opacity-100" aria-hidden="true">
          <DarkVeil
            hueShift={35}
            noiseIntensity={0.02}
            scanlineIntensity={0}
            speed={0.8}
            scanlineFrequency={1.9}
            warpAmount={0}
            resolutionScale={1}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.12)_48%,rgba(0,0,0,0.64)_100%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/8 via-transparent to-black/72" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pb-14 pt-16 text-center">
          <img
            src={heroImage}
            alt={category}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width={1100}
            height={760}
            className={`mb-8 h-auto w-full object-contain drop-shadow-[0_36px_90px_rgba(80,150,255,0.22)] ${
              isFanHero
                ? 'max-h-[52vh] max-w-[860px] sm:max-h-[60vh]'
                : isBandHero
                  ? 'max-h-[52vh] max-w-[860px] brightness-110 contrast-110 sm:max-h-[60vh]'
                  : 'max-h-[52vh] max-w-[860px] sm:max-h-[60vh]'
            }`}
          />
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Introducing</p>
          <h1 className="font-display text-4xl font-bold leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 text-white">
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            {loadError}
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-white font-display">Available Models</h2>
            <p className="text-gray-300 mt-2">Explore the latest generation of {category}.</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-900 text-white border border-white/15 py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[160px]"
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
