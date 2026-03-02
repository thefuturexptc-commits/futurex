import React, { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { getProducts, seedDatabase } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import ringHomeImage from '../assets/images/mainring.jpg';
import bandHomeImage from '../assets/images/mainband.png';
import fanHomeImage from '../assets/images/mainfan.png';
import monitorHomeImage from '../assets/images/mainmonitor.png';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const bestSellerScrollerRef = useRef<HTMLDivElement | null>(null);
  const featuredScrollerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (loading) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const setupAutoGlide = (
      scrollerRef: React.MutableRefObject<HTMLDivElement | null>,
      speedPxPerMs: number
    ) => {
      const scroller = scrollerRef.current;
      if (!scroller) return () => {};
      let rafId = 0;
      let lastTs = 0;
      const tick = (ts: number) => {
        const current = scrollerRef.current;
        if (!current) return;
        if (!lastTs) lastTs = ts;
        const delta = Math.min(ts - lastTs, 32);
        lastTs = ts;
        const maxScroll = current.scrollWidth - current.clientWidth;
        if (maxScroll > 0) {
          current.scrollLeft += delta * speedPxPerMs;
          if (current.scrollLeft >= maxScroll) current.scrollLeft = 0;
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(rafId);
    };

    const cleanupBest = setupAutoGlide(bestSellerScrollerRef, 0.07);
    const cleanupFeatured = setupAutoGlide(featuredScrollerRef, 0.06);
    return () => {
      cleanupBest();
      cleanupFeatured();
    };
  }, [loading, bestSellersForSlider.length, featuredProductsForSlider.length]);

  const dynamicDeals = [
    ...topPriceDrops.map((p) => {
      const mrp = Number(p.mrp || 0);
      const sale = Number(p.salePrice || p.price || 0);
      const pct = mrp > 0 ? Math.round(((mrp - sale) / mrp) * 100) : 0;
      return {
        title: `${pct}% OFF on ${p.name}`,
        desc: `Price dropped from Rs ${mrp.toLocaleString()} to Rs ${sale.toLocaleString()}.`,
        badge: 'PRICE DROP',
      };
    }),
    ...topNewArrivals.map((p) => ({
      title: `New Arrival: ${p.name}`,
      desc: `Latest in ${p.category}. Now available from Rs ${Number(p.salePrice || p.price || 0).toLocaleString()}.`,
      badge: 'NEW',
    })),
  ].slice(0, 4);

  const dealsToShow = dynamicDeals.length > 0 ? dynamicDeals : [
    { title: 'Flat 20% OFF', desc: 'On new wearable launches this week.', badge: 'LIMITED' },
    { title: 'Free Express Delivery', desc: 'On prepaid orders above Rs 1,499.', badge: 'FAST' },
    { title: 'Exchange Bonus', desc: 'Upgrade your old band/ring and save more.', badge: 'BONUS' },
    { title: 'Weekend Flash Deal', desc: 'Extra 10% off on Smart Bands and Rings every weekend.', badge: 'FLASH' },
  ];

  const categoryCardImages: Record<string, string> = {
    'Smart Bands': bandHomeImage,
    'Smart Rings': ringHomeImage,
    'Smart Fans': fanHomeImage,
    'Smart Monitoring': monitorHomeImage,
  };

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
    <div className="min-h-screen overflow-x-hidden text-gray-900 dark:text-white">
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
      <section className="relative h-[78vh] min-h-[500px] sm:min-h-[620px] flex items-center justify-center overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-white animate-fade-in-up">
        
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gray-50 dark:bg-dark-bg transition-colors duration-500">
           {/* Tech Grid Pattern */}
           <div className="absolute inset-0 bg-grid-pattern opacity-60 z-0"></div>
           
           {/* Animated Gradient Orbs */}
           <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-primary-200/40 to-purple-200/40 dark:from-primary-900/20 dark:to-purple-900/20 rounded-full blur-[100px] animate-float-fast opacity-70"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-200/40 to-blue-200/40 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-full blur-[120px] animate-float" style={{animationDelay: '2s'}}></div>
           <div className="absolute top-20 left-8 w-72 h-72 rounded-full blur-3xl opacity-20 bg-pink-400 animate-float-slow"></div>
           <div className="absolute top-1/2 right-8 w-72 h-72 rounded-full blur-3xl opacity-20 bg-cyan-400 animate-float-slow" style={{ animationDelay: '1.5s' }}></div>
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-20 bg-purple-400 animate-float-slow" style={{ animationDelay: '3s' }}></div>
           <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-[length:200%_200%] animate-gradient-x"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto">
            
            {/* Tech Badge */}
            <div className="flex justify-center mb-8">
                <div className="glass-card px-6 py-2 rounded-full border border-primary-100 dark:border-white/10 flex items-center gap-3 shadow-lg">
                   <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                   <span className="text-xs font-bold tracking-[0.25em] uppercase text-gray-800 dark:text-gray-200 font-display">
                      Future Ready - Series X
                   </span>
                </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-gray-900 dark:text-white leading-[0.95] font-display">
              WEAR THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-[length:200%_200%] animate-gradient-x animate-pulse-slow">
                FUTURE
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
              Advanced biometrics. Seamless connectivity. Designed for the visionaries of tomorrow.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm md:text-base font-bold text-gray-700 dark:text-gray-200 tracking-wide">
              <span className="animate-fade-in-up">14 Days Battery</span>
              <span className="hidden md:inline text-primary-500">&bull;</span>
              <span className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>50m Water Proof</span>
              <span className="hidden md:inline text-primary-500">&bull;</span>
              <span className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>99% Accuracy</span>
            </div>

          </div>
        </div>

        {/* Floating Abstract Tech Elements */}
        <div className="absolute top-1/3 left-10 hidden lg:block opacity-20 pointer-events-none animate-spin-slow">
           <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="currentColor" className="text-gray-900 dark:text-white">
              <circle cx="100" cy="100" r="90" strokeWidth="1" strokeDasharray="10 10"/>
              <circle cx="100" cy="100" r="70" strokeWidth="1"/>
              <path d="M100 0 L100 200 M0 100 L200 100" strokeWidth="1"/>
           </svg>
        </div>
      </section>

      {/* Floating Category Cards - Overlapping Hero */}
      <section className="relative z-20 pt-2 pb-14 px-4 text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring'].map((cat, idx) => (
                <Link
                  key={cat}
                  to={getCategoryRoute(cat)}
                  onClick={(event) => handleProtectedCategoryClick(event, getCategoryRoute(cat))}
                  className="group relative h-80 rounded-[2rem] overflow-hidden cursor-pointer glass-card transition-all transition-shadow duration-500 hover:-translate-y-4 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_40px_rgba(236,72,153,0.4)] border-white/50"
                >
                {/* Image */}
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800">
                    <img 
                        src={categoryCardImages[cat] || `https://picsum.photos/seed/${cat}tech/500/700`} 
                        alt={cat} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                    />
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/10 to-transparent dark:from-black/95 dark:via-black/10 dark:to-transparent opacity-100 transition-opacity"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2 font-display">Series 0{idx + 1}</p>
                            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight font-display">{cat}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </div>
                    </div>
                </div>
                </Link>
            ))}
            </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-16 relative overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
                <span className="text-primary-600 dark:text-primary-400 font-bold tracking-widest uppercase text-xs font-display mb-2 block">Customer Favorites</span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white font-display">Best Sellers</h2>
            </div>
            <button onClick={() => handleShopNavigation('/shop/all')} className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors font-display tracking-wide">
              VIEW ALL 
              <span className="group-hover:translate-x-1 transition-transform">{'->'}</span>
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
              <div
                ref={bestSellerScrollerRef}
                onWheel={handleHorizontalWheel}
                className="flex gap-6 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
              >
                {bestSellersForSlider.map((product, idx) => (
                  <div
                    key={`${product.id}_${idx}`}
                    className="w-[74vw] sm:w-[46vw] lg:w-[320px] min-w-[240px] max-w-[360px] shrink-0 snap-start opacity-0 home-product-slide"
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
      
      {/* Featured / New Arrivals Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-surface/40 relative border-y border-gray-200 dark:border-white/5 text-gray-900 dark:text-white animate-fade-in-up">
          <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-10">
                 <span className="inline-block py-1.5 px-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm border border-purple-200/50 dark:border-purple-700/30 font-display">
                    Just Dropped
                 </span>
                 <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white font-display">New Arrivals</h2>
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
                  <div
                    ref={featuredScrollerRef}
                    onWheel={handleHorizontalWheel}
                    className="flex gap-6 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
                  >
                    {featuredProductsForSlider.map((product, idx) => (
                      <div
                        key={`${product.id}_${idx}`}
                        className="w-[74vw] sm:w-[46vw] lg:w-[320px] min-w-[240px] max-w-[360px] shrink-0 snap-start opacity-0 home-product-slide relative"
                        style={{ ['--reveal-delay' as string]: `${idx * 120}ms` }}
                      >
                        <div
                          className={`absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getArrivalHighlight(product).className}`}
                        >
                          {getArrivalHighlight(product).label}
                        </div>
                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-500/30 via-fuchsia-500/20 to-cyan-500/30 blur-xl opacity-80 pointer-events-none" />
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

      <section className="py-16 px-4 bg-white dark:bg-dark-bg border-y border-gray-200 dark:border-white/10 text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white font-display">Why Choose TheFutureX?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-primary-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L15 12l-5.25-5M13.5 17L18.75 12 13.5 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-2">AI Powered Sensors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Real-time biometric intelligence tuned by adaptive machine learning models.</p>
            </div>
            <div className="glass-card bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-primary-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M6 7v10a2 2 0 002 2h8a2 2 0 002-2V7M9 11h6M10 15h4" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-2">Fast Delivery Network</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Priority dispatch and optimized logistics ensure your smart devices reach you quickly and safely.</p>
            </div>
            <div className="glass-card bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gray-50 dark:bg-white/5 text-primary-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 005.5 9.5 4.5 4.5 0 003 15z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-2">Climate-Resistant Tech</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">Designed to perform reliably across heat, rain, sweat, and high-humidity conditions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50 dark:bg-dark-surface/40 border-y border-gray-200 dark:border-white/10 text-gray-900 dark:text-white animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-primary-600 font-bold">Live Offers</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-display mt-2">Deals & Benefits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {dealsToShow.map((offer, idx) => (
              <div
                key={offer.title}
                className="relative rounded-2xl border border-gray-200 dark:border-white/10 p-6 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 shadow-md hover:-translate-y-1 hover:scale-[1.01] transition-transform duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <span className="inline-block text-[10px] font-bold tracking-widest px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  {offer.badge}
                </span>
                <h3 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">{offer.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{offer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-20 px-4 relative overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-white animate-fade-in-up">
        {/* Background blobs for this section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-primary-100/30 to-purple-100/30 dark:from-primary-900/10 dark:to-purple-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto glass-card rounded-[3rem] p-10 md:p-20 text-center relative border border-white/60 dark:border-white/10 shadow-2xl">
             <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 font-display">Join the Revolution.</h2>
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
    </div>
  );
};
