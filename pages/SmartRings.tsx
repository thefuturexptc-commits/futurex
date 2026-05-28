import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { isSameCollection } from '../utils/productCollections';
import { useCart } from '../context/CartContext';
import ringHero from '../assets/images/smartrings-hero.webp';
import ringSleepHero from '../assets/images/ring-sleep-hero.webp';
import ringProduct from '../assets/images/mainring.webp';
import ringHealth from '../assets/images/ring-health.webp';
import ringLowProfile from '../assets/images/ring-low-profile.webp';
import ringAiHealth from '../assets/images/ring-ai-health.webp';
import ringDailySync from '../assets/images/ring-daily-sync.webp';
import ringOverviewCharging from '../assets/images/ring-overview-charging.jpg';
import ringOverviewWaterproof from '../assets/images/ring-overview-waterproof.jpg';
import ringOverviewColors from '../assets/images/ring-overview-colors.jpg';
import ringRotatingGif from '../assets/images/smart-ring-rotating.gif';
import appAssistantScreen from '../assets/images/tfxvital-ai-assistant-screen.webp';
import appVitalAgeScreen from '../assets/images/tfxvital-vital-age-screen.webp';
import appExerciseScreen from '../assets/images/tfxvital-exercise-screen.webp';

const toProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getProductImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || ringProduct;

const getCatalogBullets = (product: Product): string[] => {
  const features = product.features?.filter(Boolean) || [];
  if (features.length) return features.slice(0, 3);

  const specValues = Object.values(product.specs || {}).filter(Boolean);
  if (specValues.length) return specValues.slice(0, 3);

  return product.description
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const ringFeatures = [
  {
    title: 'Health in a Ring',
    text: 'Track sleep, HRV, heart rate, activity, and recovery trends from a compact wearable.',
    image: ringOverviewCharging,
  },
  {
    title: 'Low-Profile Comfort',
    text: 'A smooth daily-wear form made for work, workouts, and overnight wellness tracking.',
    image: ringOverviewColors,
  },
  {
    title: 'AI Health Insights',
    text: 'TFXVital turns long-term signals into practical summaries for everyday decisions.',
    image: ringOverviewWaterproof,
  },
  {
    title: 'Daily App Sync',
    text: 'Review phone-connected summaries and trend signals without adding another screen to your day.',
    image: ringHealth,
  },
];

const stats = [
  ['24/7', 'health tracking'],
  ['3-5 days', 'battery life'],
  ['Sleep', 'recovery trends'],
  ['TFXVital', 'app connected'],
];

const aiCards = [
  {
    title: 'AI Assistant',
    detail: 'Ask TFXVital for reports, trends, recovery cues, and simple plans based on your latest vitals.',
    tagline: 'AI guidance, reports, and daily health decisions in one flow.',
    image: appAssistantScreen,
    imagePosition: 'center',
  },
  {
    title: 'Vital Age Estimate',
    detail: 'Build a clearer bio-age signal from sleep, heart rate, exercise, and step data over time.',
    tagline: 'Daily signals turn into simple long-term wellness insight.',
    image: appVitalAgeScreen,
    imagePosition: 'center',
  },
  {
    title: 'Workout Tracking',
    detail: 'Start GPS-based runs, follow distance and pace, and keep workouts connected to your health profile.',
    tagline: 'Live activity tracking with goals, steps, calories, and route context.',
    image: appExerciseScreen,
    imagePosition: 'center',
  },
];

const testimonials = [
  {
    quote: 'The ring is easy to wear overnight and the recovery summaries make my mornings clearer.',
    name: 'Rohan K.',
    role: 'Runner',
    initials: 'RK',
  },
  {
    quote: 'I wanted health tracking without another bright screen. The app gives the right amount of detail.',
    name: 'Aisha M.',
    role: 'Founder',
    initials: 'AM',
  },
  {
    quote: 'The sleep and HRV trends helped me understand when to train harder and when to slow down.',
    name: 'Dev S.',
    role: 'Coach',
    initials: 'DS',
  },
];

const ringFaqs = [
  {
    q: 'Will all smart ring products appear in the catalog?',
    a: 'Yes. The catalog is connected to inventory and includes products categorized as Smart Rings.',
  },
  {
    q: 'Does the ring work with the TFXVital app?',
    a: 'Yes. TFX smart rings are presented with app-based insights for sleep, recovery, activity, and daily wellness summaries.',
  },
  {
    q: 'Can I tap a product to open details?',
    a: 'Yes. Every product card opens its own product detail page with images, pricing, options, and checkout actions.',
  },
];

export const SmartRings: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [heroTextProgress, setHeroTextProgress] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState(0);
  const catalogScrollerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { addToCart, closeCart } = useCart();

  const loadProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getProducts()
      .then((data) => {
        if (cancelled) return;
        setProducts(data.filter((product) => isSameCollection(product.category, 'Smart Rings')));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load smart rings right now.');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadProducts(), [loadProducts]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

  useEffect(() => {
    let frameId = 0;

    const updateHeroText = () => {
      const fadeDistance = Math.max(320, window.innerHeight * 0.55);
      const nextProgress = Math.min(1, Math.max(0, window.scrollY / fadeDistance));
      setHeroTextProgress(nextProgress);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateHeroText);
    };

    updateHeroText();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSelectedInsight((current) => (current + 1) % aiCards.length);
    }, 3600);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1);
    closeCart();
    navigate('/checkout');
  };

  const catalogProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aScore = Number(Boolean(a.isFeatured || a.isNewArrival)) + Number(Boolean(a.isBestSeller));
      const bScore = Number(Boolean(b.isFeatured || b.isNewArrival)) + Number(Boolean(b.isBestSeller));
      return bScore - aScore || a.name.localeCompare(b.name);
    });
  }, [products]);

  const selectedCard = aiCards[selectedInsight];

  useEffect(() => {
    if (loading || catalogProducts.length < 2) return;
    const scroller = catalogScrollerRef.current;
    if (!scroller) return;

    const scrollNextProduct = () => {
      const firstCard = scroller.querySelector<HTMLElement>('article');
      const cardStep = (firstCard?.offsetWidth || scroller.clientWidth * 0.86) + 20;
      const isNearEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - cardStep * 0.5;

      scroller.scrollTo({
        left: isNearEnd ? 0 : scroller.scrollLeft + cardStep,
        behavior: 'smooth',
      });
    };

    const intervalId = window.setInterval(scrollNextProduct, 3200);
    return () => window.clearInterval(intervalId);
  }, [catalogProducts.length, loading]);

  return (
    <div className="smart-rings-page min-h-screen bg-white text-slate-950">
      <section
        className="smart-rings-fixed-hero relative z-0 min-h-[680px] w-full overflow-hidden bg-slate-950 text-white sm:min-h-[calc(100svh-64px)] lg:min-h-[calc(100svh-80px)]"
        aria-label="TFX smart ring worn during sleep"
      >
        <img
          src={ringSleepHero}
          alt=""
          className="site-hero-media absolute inset-0 h-full w-full object-cover object-[58%_58%] sm:object-[center_58%]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,18,0.48)_0%,rgba(2,6,18,0.24)_48%,rgba(2,6,18,0.04)_100%)] sm:bg-[linear-gradient(90deg,rgba(2,6,18,0.52)_0%,rgba(2,6,18,0.28)_44%,rgba(2,6,18,0.04)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/22 to-transparent sm:from-black/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-center px-6 pb-16 pt-28 sm:min-h-[calc(100svh-64px)] sm:px-8 sm:pb-14 sm:pt-24 lg:min-h-[calc(100svh-80px)] lg:px-10">
          <div
            className="max-w-3xl will-change-transform"
            style={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
          >
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#67e8f9] sm:mb-4 sm:text-xs">TFX Smart Rings</p>
            <h1 className="max-w-[340px] font-display text-[1.9rem] font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:max-w-none sm:text-5xl lg:text-6xl">
              Explore The Next Generation Of <span className="text-[#23d4ca]">Smart Rings</span>
            </h1>
            <p className="mt-4 max-w-[320px] text-[13px] font-extrabold leading-5 text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:mt-5 sm:max-w-2xl sm:text-xl sm:leading-8">
              Embark on a new health experience for yourself
            </p>
            <p className="mt-3 max-w-[330px] text-sm font-medium leading-6 text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:mt-4 sm:max-w-2xl sm:text-lg sm:leading-8">
              TFX smart rings pair subtle wearable hardware with the TFXVital app for sleep, recovery, activity, and everyday wellness insights.
            </p>
            <div className="mt-5 flex gap-2.5 sm:mt-8 sm:flex-wrap sm:gap-4">
              <a href="#ring-catalog" className="site-hero-cta site-hero-cta-primary">
                Buy Now
              </a>
              <a href="#ring-overview" className="site-hero-cta site-hero-cta-secondary">
                Buy Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="ring-overview" className="relative z-10 bg-white px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
            Product Line Overview
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="overflow-hidden rounded-[1.5rem] bg-slate-950 sm:rounded-[2rem]">
              <img src={ringRotatingGif} alt="Rotating TFX smart ring product view" className="h-full min-h-[300px] w-full object-contain p-5 sm:min-h-[420px] sm:p-8" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">Product Overview</p>
              <h3 className="mt-4 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Discovering Health Encased in a Ring
              </h3>
              <p className="mt-5 text-lg font-bold leading-8 text-slate-950 sm:text-xl">
                Smart rings for health, fitness, and daily wellness.
              </p>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                TFX rings pack multi-sensor wellness tracking into a compact ring form. They support sleep, recovery, activity, heart-rate trends, and app-based summaries without adding another screen to your day.
              </p>
              <a href="#ring-catalog" className="tfx-buy-now-cta mt-7 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full px-5 text-sm font-black uppercase tracking-[0.08em]">
                Buy Now
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h11m-4-4 4 4-4 4" />
                </svg>
              </a>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map(([value, label]) => (
                  <div key={value} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ring-catalog" className="bg-[#f2fbfb] px-4 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col items-center justify-between gap-5 text-center lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">TFX smart rings</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
                Product Catalog
              </h2>
              {!loading && (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Showing all {catalogProducts.length} connected smart ring products.
                </p>
              )}
            </div>
          </div>

          {loadError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[430px] animate-pulse rounded-[1.5rem] bg-white shadow-sm" />
              ))}
            </div>
          ) : catalogProducts.length > 0 ? (
            <div ref={catalogScrollerRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {catalogProducts.map((product, index) => {
                const bullets = getCatalogBullets(product);
                return (
                  <article
                    key={product.id}
                    className="group flex min-h-[430px] w-[min(86vw,360px)] shrink-0 snap-start flex-col rounded-[1.5rem] bg-white p-5 transition duration-300 hover:-translate-y-1 sm:w-[360px] sm:p-6"
                  >
                    <Link to={`/product/${toProductSlug(product.name)}`} className="flex h-52 items-center justify-center overflow-hidden bg-transparent sm:h-60">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
                        loading={index < 3 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </Link>
                    <div className="mt-6 flex flex-1 flex-col">
                      <Link to={`/product/${toProductSlug(product.name)}`}>
                        <h3 className="font-display text-xl font-black leading-tight text-slate-950 transition hover:text-[#1ca9a4] sm:text-2xl">
                          {product.name}
                        </h3>
                      </Link>
                      <ul className="mt-4 space-y-1.5 text-sm leading-6 text-slate-600 sm:text-base">
                        {bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <button
                          type="button"
                          onClick={() => handleBuyNow(product)}
                          className="tfx-buy-now-cta inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-black uppercase tracking-[0.08em] sm:w-auto"
                        >
                          Buy Now
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h11m-4-4 4 4-4 4" />
                          </svg>
                        </button>
                        <p className="tfx-price-pill h-11 w-full px-5 text-base font-black sm:w-auto">
                          Rs {Number(product.salePrice || product.price || 0)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-14 text-center sm:py-20">
              <p className="text-xl font-black text-slate-950">Smart ring models are coming soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {ringFeatures.map((feature) => (
          <article key={feature.title} className="relative min-h-[300px] overflow-hidden sm:min-h-[360px]">
            <img src={feature.image} alt={feature.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/24 to-black/72" aria-hidden="true" />
            <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-end p-6 text-white sm:min-h-[360px] sm:p-7">
              <h3 className="max-w-[14rem] text-2xl font-black leading-tight sm:text-3xl">{feature.title}</h3>
              <p className="mt-3 max-w-[18rem] text-sm font-medium leading-6 text-white/84 sm:text-base sm:leading-7">{feature.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1ca9a4]">Explore the App</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl font-black leading-[1.02] text-slate-950 sm:text-6xl">
              TFXVital app showcase
            </h2>
            <p className="mt-5 max-w-md text-base leading-8 text-slate-600 sm:text-lg">
              Three app screens rotate automatically in a clean preview.
            </p>
            <div key={selectedCard.title} className="mt-7 animate-[fadeIn_450ms_ease]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1ca9a4]">Selected screen</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950">{selectedCard.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedCard.detail}</p>
              <p className="mt-4 inline-flex rounded-full bg-[#e7fbfa] px-4 py-2 text-xs font-bold text-[#117c78]">
                {selectedCard.tagline}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {aiCards.map((card, index) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setSelectedInsight(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    selectedInsight === index ? 'w-10 bg-[#22b8b4]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Show ${card.title}`}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-visible bg-transparent p-0 shadow-none">
            <div className="flex h-full min-h-[520px] items-center justify-center">
              <img
                key={selectedCard.title}
                src={selectedCard.image}
                alt={`${selectedCard.title} app screen`}
                className="max-h-[510px] w-full object-contain animate-[fadeIn_500ms_ease]"
                style={{ objectPosition: selectedCard.imagePosition }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f2fbfb] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">What our clients say</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-[1.5rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,63,70,0.08)]">
                <p className="text-5xl font-black leading-none text-[#22b8b4]">"</p>
                <p className="mt-6 min-h-[112px] text-lg leading-8 text-slate-700">{item.quote}</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#22b8b4] to-[#8e78ff] text-sm font-black text-white">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-black text-slate-950">{item.name}</p>
                    <p className="text-sm font-medium text-slate-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f2fbfb] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">FAQ</h2>
          <div className="mt-8 space-y-4">
            {ringFaqs.map((item) => (
              <details key={item.q} className="rounded-[1rem] bg-white p-5 shadow-[0_12px_40px_rgba(15,63,70,0.06)]">
                <summary className="cursor-pointer text-base font-black text-slate-950">{item.q}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
