import React, { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import fanShowcaseImage from '../assets/images/fan-hero-q8pro-cutout.webp';
import bandHomeImage from '../assets/images/band-hero-cutout.webp';
import ringHomeImage from '../assets/images/smartrings-hero.webp';
import monitoringPhoneImage from '../assets/images/monitoring-phone-cutout.webp';

const toProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const runWhenIdle = (work: () => void, timeout = 1200): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  let cleanup = () => {};
  const delayId = window.setTimeout(() => {
    const requestIdle = (window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    const cancelIdle = (window as Window & {
      cancelIdleCallback?: (id: number) => void;
    }).cancelIdleCallback;

    if (requestIdle) {
      const idleId = requestIdle(work, { timeout: 2500 });
      cleanup = () => cancelIdle?.(idleId);
      return;
    }

    const id = window.setTimeout(work, 300);
    cleanup = () => window.clearTimeout(id);
  }, timeout);

  return () => {
    window.clearTimeout(delayId);
    cleanup();
  };
};

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
      const { getProducts } = await import('../services/backend');
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
    const cancel = runWhenIdle(() => void loadProducts(), 6500);
    return cancel;
  }, [loadProducts]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setLoadError('');
    try {
      const { seedDatabase } = await import('../services/backend');
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
  const handleShopNavigation = (path: string) => {
    navigate(path);
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

  const showcasePanels = [
    {
      category: 'Smart Fans',
      route: '/smart-fans',
      title: 'Air, Perfected.',
      subtitle: 'Cool. Warm. Intelligent airflow.',
      image: fanShowcaseImage,
      theme: 'dark',
      bannerClassName: 'bg-black text-white',
      imageWrapClassName: 'sm:right-0 sm:top-16 sm:bottom-0 sm:w-[58%] lg:w-[54%]',
      contentClassName: 'items-start text-left',
      imageClassName: 'max-h-[330px] sm:max-h-[470px] lg:max-h-[540px]',
    },
    {
      category: 'Smart Rings',
      route: '/smart-rings',
      title: 'Your Health. On Your Finger.',
      subtitle: 'Track. Sleep. Perform.',
      image: ringHomeImage,
      theme: 'light',
      bannerClassName: 'bg-white text-gray-950',
      imageWrapClassName: 'sm:left-0 sm:top-0 sm:bottom-0 sm:w-[60%] lg:w-[56%]',
      contentClassName: 'items-start text-left sm:items-end sm:text-right',
      imageClassName: 'max-h-[270px] sm:max-h-[380px] lg:max-h-[430px]',
    },
    {
      category: 'Smart Bands',
      route: '/smart-bands',
      title: 'Every Beat Matters.',
      subtitle: 'Real-time health insights.',
      image: bandHomeImage,
      theme: 'dark',
      bannerClassName: 'bg-black text-white',
      imageWrapClassName: 'sm:right-0 sm:top-0 sm:bottom-0 sm:w-[60%] lg:w-[56%]',
      contentClassName: 'items-start text-left',
      imageClassName: 'max-h-[270px] sm:max-h-[380px] lg:max-h-[430px]',
    },
    {
      category: 'Smart Monitoring',
      route: '/smart-monitoring',
      title: 'Know Your Body Better.',
      subtitle: 'AI-powered health tracking.',
      image: monitoringPhoneImage,
      theme: 'light',
      bannerClassName: 'bg-white text-gray-950',
      imageWrapClassName: 'sm:left-0 sm:top-0 sm:bottom-0 sm:w-[58%] lg:w-[52%]',
      contentClassName: 'items-start text-left sm:items-end sm:text-right',
      imageClassName: 'max-h-[310px] sm:max-h-[460px] lg:max-h-[520px]',
    },
  ];

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




      <section className="bg-white text-gray-950 dark:bg-black dark:text-white" aria-label="TheFutureX product collections">
        {showcasePanels.map((panel, idx) => {
          const isDark = panel.theme === 'dark';
          const imageOnLeft = panel.imageWrapClassName.includes('left-0');
          return (
            <button
              key={panel.category}
              type="button"
              onClick={() => handleShopNavigation(panel.route)}
              className={`home-showcase-panel ${isDark ? 'home-showcase-dark' : 'home-showcase-light'} group relative block min-h-[610px] w-full overflow-hidden text-left transition-transform duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400 sm:min-h-[640px] lg:min-h-[700px] ${panel.bannerClassName}`}
              aria-label={`Open ${panel.category}`}
            >
              <div
                className={`absolute inset-0 ${
                  isDark
                    ? imageOnLeft
                      ? 'bg-gradient-to-b from-black/15 via-black/20 to-black sm:bg-gradient-to-l sm:from-black sm:via-black/82 sm:to-black/22'
                      : 'bg-gradient-to-b from-black/15 via-black/20 to-black sm:bg-gradient-to-r sm:from-black sm:via-black/82 sm:to-black/22'
                    : imageOnLeft
                      ? 'bg-gradient-to-b from-white/10 via-white/25 to-white sm:bg-gradient-to-l sm:from-white sm:via-white/88 sm:to-white/28'
                      : 'bg-gradient-to-b from-white/10 via-white/25 to-white sm:bg-gradient-to-r sm:from-white sm:via-white/88 sm:to-white/28'
                }`}
                aria-hidden="true"
              />
              <div className={`absolute left-1/2 top-7 flex h-[300px] w-[90%] -translate-x-1/2 items-center justify-center sm:left-auto sm:top-auto sm:h-auto sm:w-auto sm:translate-x-0 ${panel.imageWrapClassName}`}>
                <img
                  src={panel.image}
                  alt={`${panel.category} collection`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  sizes="(max-width: 640px) 90vw, 58vw"
                  className={`h-full w-full object-contain drop-shadow-[0_34px_70px_rgba(0,0,0,0.38)] transition-transform duration-700 group-hover:scale-[1.035] sm:h-auto ${panel.imageClassName}`}
                />
              </div>
              <div className={`relative z-10 flex min-h-[610px] w-full flex-col justify-end px-5 pb-12 pt-[340px] sm:min-h-[640px] sm:justify-center sm:px-12 sm:py-20 lg:min-h-[700px] lg:px-24 ${panel.contentClassName}`}>
                <p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs ${isDark ? 'text-cyan-100/80' : 'text-gray-500'}`}>
                  {panel.category}
                </p>
                {idx === 0 ? (
                  <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                    {panel.title}
                  </h1>
                ) : (
                  <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                    {panel.title}
                  </h2>
                )}
                <p className={`mt-4 max-w-xl text-base font-medium sm:text-2xl ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
                  {panel.subtitle}
                </p>
                <div className={`mt-8 flex flex-wrap gap-3 ${imageOnLeft ? 'sm:justify-end' : 'justify-start'}`}>
                  <span className={`inline-flex min-w-[116px] items-center justify-center rounded-lg border px-5 py-2 text-sm font-semibold transition-colors ${isDark ? 'border-white/35 bg-black/20 text-white group-hover:bg-white group-hover:text-black' : 'border-gray-300 bg-white/70 text-gray-900 group-hover:border-gray-900'}`}>
                    Learn more
                  </span>
                  <span className={`home-shop-now-button inline-flex min-w-[104px] items-center justify-center rounded-lg border px-5 py-2 text-sm font-semibold shadow-sm transition-colors ${isDark ? 'border-white/35 bg-white text-black group-hover:bg-cyan-100' : 'border-black bg-black text-white group-hover:bg-gray-800'}`}>
                    Shop now
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Best Sellers Section */}
      <section className="py-10 sm:py-16 relative overflow-hidden bg-black text-white animate-fade-in-up">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,#050505,#101010)]" aria-hidden="true"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.24em] text-black shadow-[0_12px_30px_-18px_rgba(255,255,255,0.75)]">
                Customer Favorites
              </span>
              <h2 className="mt-3 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-display">Best Sellers</h2>
            </div>
            <button onClick={() => handleShopNavigation('/shop/all')} className="group flex items-center gap-2 text-gray-300 hover:text-white font-medium transition-colors font-display tracking-wide">
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
              <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent pointer-events-none z-10"></div>
              {/* <div
                ref={bestSellerScrollerRef}
                onWheel={handleHorizontalWheel}
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
              > */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {bestSellersForSlider.map((product) => (
                  <div
                    key={product.id}
                    className="w-full max-w-[260px] mx-auto"
                  >
                    <ProductCard product={product} compact monochrome imageAspectClassName="aspect-[4/3]" disableHoverEffects />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <div className="h-10 bg-gradient-to-b from-transparent via-primary-100/40 to-transparent dark:via-primary-900/10" />

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
