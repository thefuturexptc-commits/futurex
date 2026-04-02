import React, { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { getProducts, seedDatabase, toProductSlug } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import ringHomeImage from '../assets/images/smart-rings-home-new.webp';
import bandHomeImage from '../assets/images/mainband.webp';
import fanHomeImage from '../assets/images/mainfan.webp';
import monitorHomeImage from '../assets/images/mainmonitor.webp';

export const Home: React.FC = () => {
  const colorMoods = useMemo(
    () => [
      {
        id: 'neon',
        dot: 'bg-primary-500',
        heroGradient: 'from-pink-500 via-purple-500 to-cyan-500',
        bullet: 'text-primary-500',
        chip: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
        sectionText: 'text-primary-600 dark:text-primary-400',
        sectionHoverText: 'hover:text-primary-600 dark:hover:text-primary-400',
        categoryGlow: 'group-hover:shadow-[0_0_40px_rgba(236,72,153,0.4)]',
        offerCard: 'from-cyan-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950',
      },
      {
        id: 'ocean',
        dot: 'bg-cyan-500',
        heroGradient: 'from-cyan-500 via-blue-500 to-indigo-500',
        bullet: 'text-cyan-500',
        chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        sectionText: 'text-cyan-600 dark:text-cyan-400',
        sectionHoverText: 'hover:text-cyan-600 dark:hover:text-cyan-400',
        categoryGlow: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]',
        offerCard: 'from-cyan-50 via-sky-50 to-blue-50 dark:from-cyan-950/40 dark:via-slate-950 dark:to-blue-950/40',
      },
      {
        id: 'sunset',
        dot: 'bg-amber-500',
        heroGradient: 'from-amber-500 via-orange-500 to-rose-500',
        bullet: 'text-amber-500',
        chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        sectionText: 'text-amber-600 dark:text-amber-400',
        sectionHoverText: 'hover:text-amber-600 dark:hover:text-amber-400',
        categoryGlow: 'group-hover:shadow-[0_0_40px_rgba(251,146,60,0.4)]',
        offerCard: 'from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/35 dark:via-slate-950 dark:to-rose-950/35',
      },
      {
        id: 'emerald',
        dot: 'bg-emerald-500',
        heroGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        bullet: 'text-emerald-500',
        chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        sectionText: 'text-emerald-600 dark:text-emerald-400',
        sectionHoverText: 'hover:text-emerald-600 dark:hover:text-emerald-400',
        categoryGlow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]',
        offerCard: 'from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/35 dark:via-slate-950 dark:to-cyan-950/35',
      },
    ],
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const bestSellerScrollerRef = useRef<HTMLDivElement | null>(null);
  const featuredScrollerRef = useRef<HTMLDivElement | null>(null);
  const [heroSpotlightIndex, setHeroSpotlightIndex] = useState(0);
  const [dealCountdown, setDealCountdown] = useState('00:00:00');
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [activeMoodId] = useState('neon');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load products from Firestore.';
      setLoadError(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setLoadError('');
    try {
      await seedDatabase();
      await loadProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to seed database.';
      setLoadError(message);
    } finally {
      setSeeding(false);
    }
  };

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const bestSellersForSlider = bestSellers;
  const featuredProductsForSlider = featuredProducts;
  const heroSpotlights = useMemo(
    () =>
      [...featuredProducts, ...bestSellers].filter(
        (product, index, arr) => arr.findIndex((item) => item.id === product.id) === index
      ),
    [featuredProducts, bestSellers]
  );

  const handleShopNavigation = (path: string) => {
    navigate(path);
  };

  const handleProtectedCategoryClick = (event: MouseEvent<HTMLAnchorElement>, categoryPath: string) => {
    event.preventDefault();
    handleShopNavigation(categoryPath);
  };

  const handleHorizontalWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
    event.preventDefault();
  }, []);

  const topPriceDrops = [...products]
    .filter((p) => Number(p.mrp || 0) > Number(p.salePrice || p.price || 0))
    .sort((a, b) => {
      const aDrop = Number(a.mrp || 0) - Number(a.salePrice || a.price || 0);
      const bDrop = Number(b.mrp || 0) - Number(b.salePrice || b.price || 0);
      return bDrop - aDrop;
    })
    .slice(0, 2);

  const topNewArrivals = [...featuredProducts].slice(0, 2);
  const openProtectedOffer = (event: MouseEvent<HTMLAnchorElement>, offerPath: string) => {
    event.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(offerPath)}`);
      return;
    }
    navigate(offerPath);
  };

  // useEffect(() => {
  //   if (loading) return;
  //   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  //   const setupAutoGlide = (
  //     scrollerRef: React.MutableRefObject<HTMLDivElement | null>,
  //     speedPxPerMs: number
  //   ) => {
  //     const scroller = scrollerRef.current;
  //     if (!scroller) return () => {};
  //     let rafId = 0;
  //     let lastTs = 0;
  //     const tick = (ts: number) => {
  //       const current = scrollerRef.current;
  //       if (!current) return;
  //       if (!lastTs) lastTs = ts;
  //       const delta = Math.min(ts - lastTs, 32);
  //       lastTs = ts;
  //       const maxScroll = current.scrollWidth - current.clientWidth;
  //       if (maxScroll > 0) {
  //         current.scrollLeft += delta * speedPxPerMs;
  //         if (current.scrollLeft >= maxScroll) current.scrollLeft = 0;
  //       }
  //       rafId = window.requestAnimationFrame(tick);
  //     };
  //     rafId = window.requestAnimationFrame(tick);
  //     return () => window.cancelAnimationFrame(rafId);
  //   };

  //   const cleanupBest = setupAutoGlide(bestSellerScrollerRef, 0.05);
  //   const cleanupFeatured = setupAutoGlide(featuredScrollerRef, 0.04);
  //   return () => {
  //     cleanupBest();
  //     cleanupFeatured();
  //   };
  // }, [loading, bestSellersForSlider.length, featuredProductsForSlider.length]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(23, 59, 59, 999);
      const diff = Math.max(0, target.getTime() - now.getTime());
      const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setDealCountdown(`${hh}:${mm}:${ss}`);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const raw = localStorage.getItem('aura_recently_viewed_products');
        const ids = raw ? (JSON.parse(raw) as string[]) : [];
        setRecentlyViewedIds(ids.slice(0, 8));
      } catch {
        setRecentlyViewedIds([]);
      }
    };
    loadRecentlyViewed();
    window.addEventListener('focus', loadRecentlyViewed);
    return () => window.removeEventListener('focus', loadRecentlyViewed);
  }, []);

  useEffect(() => {
    const onCompareAdd = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      const id = detail?.id;
      if (!id) return;
      setCompareProductIds((prev) => {
        const next = [id, ...prev.filter((item) => item !== id)].slice(0, 3);
        return next;
      });
      setIsCompareOpen(true);
    };
    window.addEventListener('product:compare-add', onCompareAdd as EventListener);
    return () => window.removeEventListener('product:compare-add', onCompareAdd as EventListener);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % 3);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const dynamicDeals = [
    ...topPriceDrops.map((p) => {
      const mrp = Number(p.mrp || 0);
      const sale = Number(p.salePrice || p.price || 0);
      const pct = mrp > 0 ? Math.round(((mrp - sale) / mrp) * 100) : 0;
      return {
        title: `${pct}% OFF on ${p.name}`,
        desc: `Price dropped from Rs ${mrp.toLocaleString()} to Rs ${sale.toLocaleString()}.`,
        badge: 'PRICE DROP',
        href: `/product/${toProductSlug(p.name)}`,
        cta: 'Claim Price Drop',
      };
    }),
    ...topNewArrivals.map((p) => ({
      title: `New Arrival: ${p.name}`,
      desc: `Latest in ${p.category}. Now available from Rs ${Number(p.salePrice || p.price || 0).toLocaleString()}.`,
      badge: 'NEW',
      href: `/product/${toProductSlug(p.name)}`,
      cta: 'Unlock Launch Offer',
    })),
  ].slice(0, 4);

  const dealsToShow = dynamicDeals.length > 0 ? dynamicDeals : [
    { title: 'Flat 20% OFF', desc: 'On new wearable launches this week.', badge: 'LIMITED', href: '/offers/flat-20-off', cta: 'Claim 20% OFF' },
    { title: 'Free Express Delivery', desc: 'On prepaid orders above Rs 1,499.', badge: 'FAST', href: '/offers/free-express-delivery', cta: 'Unlock Delivery' },
    { title: 'Exchange Bonus', desc: 'Upgrade your old band/ring and save more.', badge: 'BONUS', href: '/offers/exchange-bonus', cta: 'Claim Exchange Bonus' },
    { title: 'Weekend Flash Deal', desc: 'Extra 10% off on Smart Bands and Rings every weekend.', badge: 'FLASH', href: '/offers/weekend-flash-deal', cta: 'Grab Flash Deal' },
  ];
  const primaryOfferPath = dealsToShow[0]?.href || '/offers/member-offer';

  const categoryCardImages: Record<string, string> = {
    'Smart Bands': bandHomeImage,
    'Smart Rings': ringHomeImage,
    'Smart Fans': fanHomeImage,
    'Smart Monitoring': monitorHomeImage,
  };
  const heroExcludedCategories = new Set(['Smart Bands', 'Smart Fans']);
  const heroSpotlightsForHero = useMemo(
    () => heroSpotlights.filter((item) => !heroExcludedCategories.has(item.category)),
    [heroSpotlights]
  );
  const spotlightProduct =
    heroSpotlightsForHero.length > 0
      ? heroSpotlightsForHero[heroSpotlightIndex % heroSpotlightsForHero.length]
      : undefined;
  useEffect(() => {
    if (heroSpotlightsForHero.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroSpotlightIndex((prev) => (prev + 1) % heroSpotlightsForHero.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [heroSpotlightsForHero.length]);
  const recentlyViewedProducts = useMemo(() => {
    if (!recentlyViewedIds.length || !products.length) return [];
    const byId = new Map(products.map((product) => [product.id, product]));
    return recentlyViewedIds
      .map((productId) => byId.get(productId))
      .filter((item): item is Product => Boolean(item))
      .slice(0, 4);
  }, [recentlyViewedIds, products]);
  const compareProducts = useMemo(() => {
    if (!compareProductIds.length || !products.length) return [];
    const byId = new Map(products.map((product) => [product.id, product]));
    return compareProductIds
      .map((productId) => byId.get(productId))
      .filter((item): item is Product => Boolean(item))
      .slice(0, 3);
  }, [compareProductIds, products]);
  const testimonials = useMemo(
    () => [
      { name: 'Ritika S.', role: 'Smart Band Buyer', text: 'Battery backup is excellent and fitness tracking is accurate. Design feels premium.' },
      { name: 'Arjun K.', role: 'Smart Ring User', text: 'The ring is light, stylish, and sleep insights are very helpful for daily routine.' },
      { name: 'Neha P.', role: 'Smart Fan Buyer', text: 'Cooling plus purifier mode works smoothly. The app control is quick and stable.' },
    ],
    []
  );
  const activeMood = colorMoods.find((mood) => mood.id === activeMoodId) || colorMoods[0];

  const getArrivalHighlight = (product: Product) => {
    const mrp = Number(product.mrp || 0);
    const sale = Number(product.salePrice || product.price || 0);
    const hasDrop = mrp > 0 && sale > 0 && mrp > sale;
    const dropPct = hasDrop ? Math.round(((mrp - sale) / mrp) * 100) : 0;
    if (hasDrop) {
      return {
        label: `${dropPct}% OFF`,
        className: 'bg-rose-500 text-white shadow-[0_0_22px_rgba(244,63,94,0.6)] animate-pulse',
      };
    }
    return {
      label: 'LATEST ARRIVAL',
      className: 'bg-emerald-500 text-white shadow-[0_0_22px_rgba(16,185,129,0.55)] animate-pulse',
    };
  };

  // Helper to get route from category name
  const getCategoryRoute = (cat: string) => {
    const map: Record<string, string> = {
      'Smart Bands': '/smart-bands',
      'Smart Rings': '/smart-rings',
      'Smart Fans': '/smart-fans',
      'Smart Monitoring': '/smart-monitoring'
    };
    return map[cat] || '/shop/all';
  };

  return (
    <div className="min-h-screen overflow-x-hidden pb-24 sm:pb-0 text-gray-900 dark:text-white bg-white dark:bg-dark-bg">
      {loadError && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm font-medium">Product feed error: {loadError}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void loadProducts()} disabled={loading}>
                Retry
              </Button>
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <Button size="sm" onClick={handleSeedDefaults} isLoading={seeding}>
                  {seeding ? 'Seeding...' : 'Seed Defaults'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}




      {/* Hero Section */}
      <section className="relative w-full aspect-[16/9] sm:aspect-auto lg:h-screen overflow-hidden">

        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/demobanner.webp')" }}
        />

      </section>


      

      {/* Floating Category Cards - Overlapping Hero */}
      <section className="relative z-20 pt-2 pb-12 sm:pb-14 px-4 text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring'].map((cat, idx) => (
              <Link
                key={cat}
                to={getCategoryRoute(cat)}
                onClick={(event) => handleProtectedCategoryClick(event, getCategoryRoute(cat))}
                className={`group relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-cyan-500/20 bg-[#060b1a] transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-[0_18px_40px_-20px_rgba(34,211,238,0.45)] ${activeMood.categoryGlow} animate-fade-in-up`}
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                {/* Image */}
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800">
                  <img
                    src={categoryCardImages[cat] || `https://picsum.photos/seed/${cat}tech/500/700`}
                    alt={cat}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 25vw"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-[0.7] saturate-125"
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050910] via-[#070d18]/40 to-transparent opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-300/5 to-blue-400/0 opacity-70"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-3 sm:p-5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 font-display text-cyan-300/90">Series 0{idx + 1}</p>
                      <h3 className="text-xs sm:text-lg md:text-2xl font-bold tracking-tight text-white leading-tight font-display">{cat}</h3>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-300/15 border border-cyan-200/40 flex items-center justify-center shadow-lg transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-10 sm:py-16 relative overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className={`font-bold tracking-widest uppercase text-xs font-display mb-2 block ${activeMood.sectionText}`}>Customer Favorites</span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white font-display">Best Sellers</h2>
            </div>
            <button onClick={() => handleShopNavigation('/shop/all')} className={`group flex items-center gap-2 text-gray-600 dark:text-gray-300 ${activeMood.sectionHoverText} font-medium transition-colors font-display tracking-wide`}>
              VIEW ALL
              {/* <span className="group-hover:translate-x-1 transition-transform">{'->'}</span> */}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white dark:from-dark-bg to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white dark:from-dark-bg to-transparent pointer-events-none z-10"></div>
              {/* <div
                ref={bestSellerScrollerRef}
                onWheel={handleHorizontalWheel}
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
              > */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {bestSellersForSlider.map((product, idx) => (
                  <div
                    // key={`${product.id}_${idx}`}
                    // className="w-[70vw] sm:w-[46vw] lg:w-[320px] min-w-[220px] max-w-[360px] shrink-0 snap-start opacity-0 home-product-slide"

                    key={product.id}
                    className="w-full opacity-0 home-product-slide"
                    style={{ ['--reveal-delay' as string]: `${idx * 120}ms` }}
                  >
                    <ProductCard product={product} compact imageAspectClassName="aspect-[4/3]" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <div className="h-10 bg-gradient-to-b from-transparent via-primary-100/40 to-transparent dark:via-primary-900/10" />

      {/* Featured / New Arrivals Section */}
      <section className="py-10 sm:py-16 bg-gray-50 dark:bg-dark-surface/40 relative border-y border-gray-200 dark:border-white/5 text-gray-900 dark:text-white animate-fade-in-up">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <span className="inline-block py-1.5 px-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm border border-purple-200/50 dark:border-purple-700/30 font-display">
              Just Dropped
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white font-display">New Arrivals</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light text-lg">
              Cutting-edge technology designed to seamlessly integrate into your lifestyle.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white dark:from-dark-bg to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white dark:from-dark-bg to-transparent pointer-events-none z-10"></div>
              {/* <div
                ref={featuredScrollerRef}
                onWheel={handleHorizontalWheel}
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
              > */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {featuredProductsForSlider.map((product, idx) => (
                  <div
                    // key={`${product.id}_${idx}`}
                    // className="w-[70vw] sm:w-[46vw] lg:w-[320px] min-w-[220px] max-w-[360px] shrink-0 snap-start opacity-0 home-product-slide relative"
                    key={product.id}
                    className="w-full opacity-0 home-product-slide"
                    style={{ ['--reveal-delay' as string]: `${idx * 120}ms` }}
                  >
                    <div
                      className={`absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getArrivalHighlight(product).className}`}
                    >
                      {getArrivalHighlight(product).label}
                    </div>
                    <div className="hidden sm:block absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-500/30 via-fuchsia-500/20 to-cyan-500/30 blur-xl opacity-80 pointer-events-none" />
                    <ProductCard product={product} compact imageAspectClassName="aspect-[4/3]" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-10 flex justify-center">
            <Button onClick={() => handleShopNavigation('/shop/all')} variant="outline" className="rounded-full px-8 py-3">
              View All New Arrivals
            </Button>
          </div>
        </div>
      </section>
      {recentlyViewedProducts.length > 0 && (
        <section className="py-10 sm:py-16 bg-[#040813] dark:bg-[#03060f] border-y border-cyan-500/10 text-gray-100 dark:text-white animate-fade-in-up">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between gap-4 mb-7">
              <div>
                <p className={`text-xs uppercase tracking-[0.25em] font-bold ${activeMood.sectionText}`}>Continue Shopping</p>
                <h2 className="text-xl sm:text-3xl font-bold font-display mt-2">Recently Viewed</h2>
              </div>
              <Button variant="outline" size="sm" className="rounded-full shrink-0" onClick={() => navigate('/shop/all')}>
                Browse All
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:overflow-visible">
              {recentlyViewedProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[78vw] min-w-[240px] shrink-0 min-[420px]:w-[62vw] sm:w-auto sm:min-w-0 rounded-2xl border border-cyan-500/20 bg-[#060b1a] p-1.5 sm:p-2 shadow-[0_14px_34px_-20px_rgba(34,211,238,0.4)]"
                >
                  <ProductCard product={product} compact imageAspectClassName="aspect-[4/3]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="h-10 bg-gradient-to-b from-transparent via-cyan-100/40 to-transparent dark:via-cyan-900/10" />

      <section className="py-10 sm:py-16 px-4 bg-white dark:bg-dark-bg border-y border-gray-200 dark:border-white/10 text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className={`text-xs uppercase tracking-[0.25em] font-bold ${activeMood.sectionText}`}>Customer Stories</p>
            <h2 className="mt-2 text-2xl sm:text-4xl font-bold font-display">What Buyers Say</h2>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-sky-50 via-white to-rose-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 p-6 sm:p-8 shadow-xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
            >
              {testimonials.map((entry) => (
                <article key={entry.name} className="w-full shrink-0 text-center px-1">
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">"{entry.text}"</p>
                  <p className="mt-4 text-sm font-bold text-gray-900 dark:text-white">{entry.name}</p>
                  <p className={`text-xs uppercase tracking-[0.2em] ${activeMood.sectionText}`}>{entry.role}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            {testimonials.map((entry, idx) => (
              <button
                key={entry.name}
                type="button"
                className={`h-2.5 rounded-full transition-all ${testimonialIndex === idx ? `${activeMood.dot} w-7` : 'w-2.5 bg-gray-300 dark:bg-gray-600'}`}
                onClick={() => setTestimonialIndex(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 px-4 bg-[#040813] dark:bg-[#03060f] border-y border-cyan-500/10 text-gray-100 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className={`text-xs uppercase tracking-[0.3em] font-bold ${activeMood.sectionText}`}>Live Offers</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white font-display mt-2">Deals & Benefits</h2>
            <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">Flash window ends in {dealCountdown}</p>
            <div className="mt-4">
              <Link
                to={primaryOfferPath}
                onClick={(event) => openProtectedOffer(event, primaryOfferPath)}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-xs font-semibold tracking-wide"
              >
                Open Member Offer
                {/* <span aria-hidden="true">{'->'}</span> */}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {dealsToShow.map((offer, idx) => (
              <Link
                key={offer.title}
                to={offer.href}
                onClick={(event) => openProtectedOffer(event, offer.href)}
                className="relative rounded-2xl border border-cyan-500/20 p-3 sm:p-5 bg-[#060b1a] shadow-[0_18px_34px_-22px_rgba(34,211,238,0.45)] hover:-translate-y-1 hover:scale-[1.01] transition-transform duration-300 animate-fade-in-up w-full overflow-hidden"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-300/0 via-cyan-300/5 to-blue-400/0 pointer-events-none"></div>
                <span className="inline-block text-[10px] font-bold tracking-widest px-2.5 sm:px-3 py-1 rounded-full animate-pulse bg-cyan-300/15 text-cyan-100 border border-cyan-200/30">
                  {offer.badge}
                </span>
                <h3 className="text-sm sm:text-lg font-bold mt-2.5 sm:mt-3 text-white leading-snug">{offer.title}</h3>
                <p className="text-[11px] sm:text-sm text-gray-300 mt-1.5 sm:mt-2 line-clamp-2">{offer.desc}</p>
                <span className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-300/15 text-cyan-100 border border-cyan-200/30 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold tracking-wide">
                  {offer.cta}
                  {/* <span aria-hidden="true">{'->'}</span> */}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-10 sm:py-20 px-4 relative overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-white animate-fade-in-up">
        {/* Background blobs for this section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-primary-100/30 to-purple-100/30 dark:from-primary-900/10 dark:to-purple-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-20 text-center relative border border-white/60 dark:border-white/10 shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 font-display">Join the Revolution.</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-lg mx-auto leading-relaxed">
              Be the first to experience the next generation of wearable tech. Exclusive drops for members.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full border border-gray-300 bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-inner"
              />
              <Button onClick={() => (user ? navigate('/profile') : navigate('/shop/all'))} className="rounded-full px-10 py-4 font-display tracking-wide shadow-lg shadow-primary-500/20 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)]">SUBSCRIBE</Button>
            </div>
          </div>
        </div>
      </section>
      {compareProducts.length > 0 && (
        <div
          className={`fixed left-3 right-3 sm:left-auto sm:right-5 sm:w-[420px] bottom-[74px] sm:bottom-5 z-50 transition-all duration-300 ${isCompareOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
            }`}
        >
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm font-bold ${activeMood.sectionText}`}>Compare Products ({compareProducts.length}/3)</p>
              <button
                type="button"
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setIsCompareOpen(false)}
              >
                Hide
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {compareProducts.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{item.name}</p>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-rose-500"
                    onClick={() => setCompareProductIds((prev) => prev.filter((id) => id !== item.id))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const names = compareProducts.map((item) => item.name).join(' vs ');
                  window.dispatchEvent(new CustomEvent('support-assistant:ask-product', { detail: { prompt: `compare ${names}` } }));
                }}
              >
                Compare Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCompareProductIds([]);
                  setIsCompareOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
