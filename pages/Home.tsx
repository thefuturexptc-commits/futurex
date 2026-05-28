import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addOfferLead } from '../services/backend';
import { FAN_OFFER_COUPON_CODE, SURPRISE_COUPON_CODE, WEARABLE_OFFER_COUPON_CODE } from '../utils/coupons';
import bandCutout from '../assets/images/band-hero-cutout.webp';
import bandHeroLifestyle from '../assets/images/band-men-women-lifestyle.webp';
import bandProof from '../assets/images/band-proof.webp';
import bandLongBattery from '../assets/images/band-long-battery.webp';
import bandScreenlessComfort from '../assets/images/band-screenless-comfort.webp';
import bandFashionableWear from '../assets/images/band-fashionable-wear.webp';
import bandHeroVideo from '../assets/images/band-hero-video.mp4';
import appAssistantScreen from '../assets/images/tfxvital-ai-assistant-screen.webp';
import appVitalAgeScreen from '../assets/images/tfxvital-vital-age-screen.webp';
import appExerciseScreen from '../assets/images/tfxvital-exercise-screen.webp';

const featureTiles = [
  {
    title: 'Waterproof',
    text: 'Water-ready protection keeps everyday tracking steady through sweat, splashes, and daily routines.',
    image: bandProof,
  },
  {
    title: 'Long Battery Life',
    text: 'Up to 14 days of typical use keeps health tracking steady between charges.',
    image: bandLongBattery,
  },
  {
    title: 'Screenless Comfort',
    text: 'A quiet, lightweight wearable made for sleep, recovery, work, and movement.',
    image: bandScreenlessComfort,
  },
  {
    title: 'Fashionable Wear',
    text: 'Minimal band finishes that feel polished with training wear or daily outfits.',
    image: bandFashionableWear,
  },
];

const testimonials = [
  {
    quote: 'The stress and sleep summaries helped me build a calmer recovery routine without staring at another screen.',
    name: 'Aarav M.',
    role: 'Fitness Founder',
    initials: 'AM',
  },
  {
    quote: 'TFXVital feels simple, quiet, and useful. I check the app once and know what my day needs.',
    name: 'Khushi R.',
    role: 'Wellness Coach',
    initials: 'KR',
  },
  {
    quote: 'The band is light enough for sleep tracking and polished enough for work. That combination matters.',
    name: 'Neha S.',
    role: 'Product Designer',
    initials: 'NS',
  },
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

const stats = [
  ['14 days', 'typical battery'],
  ['5ATM', 'water ready'],
  ['24/7', 'vitals sync'],
  ['TFXVital', 'app support'],
];

const highlightedShorts = [
  { id: 'dr17QaEDStQ', title: 'TheFutureX Short 1' },
  { id: '_loPso9DDOo', title: 'TheFutureX Short 2' },
  { id: 'FRBg0PLIpPw', title: 'TheFutureX Short 3' },
  { id: 'lA7SflWKLZ4', title: 'TheFutureX Short 4' },
  { id: 'iAqOLfZDhpc', title: 'TheFutureX Short 5' },
];

const CATALOG_PAGE_SIZE = 4;
const FEATURED_BAND_PRODUCT_PATH = '/product/ai-v5-smart-band-heart-rate-spo2-fitness-tracker';

const toCategorySlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getHomeCatalogHref = (product: Product): string => {
  const categoryText = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  if (/\b(band|bracelet)\b/.test(categoryText)) return FEATURED_BAND_PRODUCT_PATH;
  if (/\bring\b/.test(categoryText)) return '/smart-rings';
  if (/\bfan\b/.test(categoryText)) return '/bladeless-fan';
  if (/\b(monitor|watch|belt|spo2|ecg|blood\s*pressure|glucose)\b/.test(categoryText)) return '/smart-monitoring';
  return `/shop/${toCategorySlug(product.category || 'all')}`;
};

const getProductImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || bandCutout;

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

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(0);
  const [heroTextProgress, setHeroTextProgress] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [offerName, setOfferName] = useState('');
  const [offerPhone, setOfferPhone] = useState('');
  const [offerConsent, setOfferConsent] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerUnlocked, setOfferUnlocked] = useState(false);
  const [copiedOfferCode, setCopiedOfferCode] = useState('');
  const [loadedShortIds, setLoadedShortIds] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, closeCart, applyCoupon } = useCart();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { getProducts } = await import('../services/backend');
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load products right now.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const hasOfferPhone = Boolean(window.localStorage.getItem('tfx_surprise_coupon_phone'));
    if (!hasOfferPhone) {
      const timer = window.setTimeout(() => setShowOfferPopup(true), 900);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!showOfferPopup) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showOfferPopup]);

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

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setLoadError('');
    try {
      const { seedDatabase } = await import('../services/backend');
      await seedDatabase();
      await loadProducts();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to seed database.');
    } finally {
      setSeeding(false);
    }
  };

  const handleHomeBuyNow = (product: Product) => {
    addToCart(product, 1);
    closeCart();
    navigate('/checkout');
  };

  const handleAvailHomeOffer = async () => {
    const digits = offerPhone.replace(/\D/g, '');
    const normalizedPhone = digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

    if (!offerName.trim()) {
      setOfferMessage('Please enter your name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setOfferMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!offerConsent) {
      setOfferMessage('Please agree to receive offer messages.');
      return;
    }

    window.localStorage.setItem('tfx_surprise_coupon_phone', normalizedPhone);
    window.localStorage.setItem('tfx_surprise_coupon_name', offerName.trim());
    await addOfferLead({
      name: offerName.trim(),
      phone: normalizedPhone,
      source: 'home_popup',
      couponCodes: [FAN_OFFER_COUPON_CODE, WEARABLE_OFFER_COUPON_CODE],
      message: `${FAN_OFFER_COUPON_CODE} for fans, ${WEARABLE_OFFER_COUPON_CODE} for rings and bands`,
    });
    applyCoupon(SURPRISE_COUPON_CODE);
    setOfferMessage('');
    setOfferUnlocked(true);
  };

  const handleCopyOfferCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedOfferCode(code);
    } catch {
      setCopiedOfferCode('');
    }
  };

  const loadHighlightedShort = (shortId: string) => {
    setLoadedShortIds((current) => (current.includes(shortId) ? current : [...current, shortId]));
  };

  const handleShopWithOffer = () => {
    setShowOfferPopup(false);
    document.getElementById('models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const catalogProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aScore = Number(Boolean(a.isFeatured || a.isNewArrival)) + Number(Boolean(a.isBestSeller));
      const bScore = Number(Boolean(b.isFeatured || b.isNewArrival)) + Number(Boolean(b.isBestSeller));
      return bScore - aScore || a.name.localeCompare(b.name);
    });
  }, [products]);
  const featuredBandHref = FEATURED_BAND_PRODUCT_PATH;

  const totalCatalogPages = Math.max(1, Math.ceil(catalogProducts.length / CATALOG_PAGE_SIZE));
  const paginatedCatalogProducts = catalogProducts.slice(
    (catalogPage - 1) * CATALOG_PAGE_SIZE,
    catalogPage * CATALOG_PAGE_SIZE
  );
  const selectedCard = aiCards[selectedInsight];

  useEffect(() => {
    setCatalogPage((currentPage) => Math.min(currentPage, totalCatalogPages));
  }, [totalCatalogPages]);

  const changeCatalogPage = (nextPage: number) => {
    const page = Math.min(totalCatalogPages, Math.max(1, nextPage));
    setCatalogPage(page);
    document.getElementById('models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="smart-bands-page relative min-h-screen overflow-x-hidden bg-white text-slate-950">
      {showOfferPopup && createPortal((
        <div
          className="fixed inset-0 flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/85 px-3 py-5 sm:px-4 sm:py-8"
          style={{ zIndex: 2147483647 }}
        >
          <div className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[390px] overflow-y-auto rounded-2xl bg-[#050505] px-4 pb-5 pt-8 text-center shadow-2xl ring-1 ring-white/10 sm:max-w-[460px] sm:px-8 sm:pb-8 sm:pt-9">
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.setItem('tfx_offer_popup_dismissed', '1');
                setShowOfferPopup(false);
              }}
              className="absolute right-2 top-2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl font-black leading-none text-white transition hover:bg-white/15 hover:text-[#df0b16] focus:outline-none focus:ring-2 focus:ring-[#df0b16] sm:right-3 sm:top-3"
              aria-label="Close offer"
            >
              ×
            </button>

            <img src="/images/tfx-offer-logo.png" alt="TheFutureX" className="mx-auto h-20 w-auto max-w-[70%] object-contain sm:h-32 sm:max-w-[78%]" />

            {offerUnlocked ? (
              <div className="mt-3">
                <h2 className="font-display text-2xl font-black leading-tight text-white sm:text-4xl">Here's Your Discount Code</h2>
                <p className="mx-auto mt-3 max-w-[18rem] text-xs font-bold leading-5 text-slate-200 sm:max-w-none sm:text-base sm:leading-6">
                  NEW10 is applied on fans. NEW5 is applied on rings and bands.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    { code: FAN_OFFER_COUPON_CODE, label: 'Fans', offer: '10% OFF' },
                    { code: WEARABLE_OFFER_COUPON_CODE, label: 'Rings & Bands', offer: '5% OFF' },
                  ].map((item) => (
                    <div key={item.code} className="min-w-0 rounded-2xl border border-white/15 bg-white p-3 text-left shadow-[0_14px_28px_rgba(0,0,0,0.25)]">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-base font-black tracking-wide text-slate-950 sm:text-lg">{item.code}</p>
                          <p className="mt-0.5 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-emerald-700 sm:text-xs sm:tracking-[0.16em]">
                            Applied - {item.offer} on {item.label}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyOfferCode(item.code)}
                          className="h-10 w-full shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-[#df0b16] hover:text-[#df0b16] sm:w-auto"
                        >
                          {copiedOfferCode === item.code ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleShopWithOffer}
                  className="mt-5 h-11 w-full rounded-xl bg-[#df0b16] text-sm font-black text-white shadow-[0_16px_28px_rgba(223,11,22,0.26)] transition hover:bg-[#c70712] sm:h-12 sm:text-base"
                >
                  Shop Now
                </button>
              </div>
            ) : (
              <>
            <div className="mt-2">
              <h2 className="font-display text-[2rem] font-black leading-none tracking-normal text-white min-[380px]:text-[2.2rem] sm:text-[2.75rem]">
                Get <span className="text-[#df0b16]">Up to 10% OFF</span>
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2 text-base font-bold leading-tight text-white sm:gap-3 sm:text-2xl">
                <span className="h-px w-7 bg-[#df0b16] sm:w-10" aria-hidden="true" />
                <span>on your 1st order!</span>
                <span className="h-px w-7 bg-[#df0b16] sm:w-10" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm font-black leading-5 text-[#df0b16] sm:text-base">Use NEW10 on fans, NEW5 on rings & bands</p>
            </div>

            <div className="mt-4 space-y-3 sm:mt-5">
              <input
                type="text"
                value={offerName}
                onChange={(event) => setOfferName(event.target.value)}
                placeholder="Enter your name"
                className="h-10 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_3px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-300 focus:border-[#df0b16]"
              />

              <div className="flex h-10 overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-[inset_0_1px_3px_rgba(15,23,42,0.18)]">
                <div className="flex min-w-[58px] items-center justify-center gap-1 border-r border-white/20 bg-white/10 px-2 text-sm font-bold text-white [&>span]:hidden">
                  <strong className="font-bold">IN v</strong>
                  <span aria-hidden="true">🇮🇳</span>
                  <span className="text-sm text-slate-500">▼</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={offerPhone}
                  onChange={(event) => setOfferPhone(event.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Phone number"
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-300"
                />
              </div>

              <label className="flex items-start gap-3 text-left text-[11px] font-bold leading-5 text-slate-200 sm:text-xs">
                <input
                  type="checkbox"
                  checked={offerConsent}
                  onChange={(event) => setOfferConsent(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-slate-400 accent-[#df0b16]"
                />
                <span>By signing up, you agree to receive marketing messages on the provided details.</span>
              </label>

              {offerMessage && <p className="text-sm font-semibold text-rose-300">{offerMessage}</p>}

              <button
                type="button"
                onClick={handleAvailHomeOffer}
                className="mt-2 h-11 w-full rounded-xl bg-[#df0b16] text-sm font-black text-white shadow-[0_16px_28px_rgba(223,11,22,0.26)] transition hover:bg-[#c70712] sm:h-12 sm:text-base"
              >
                Unlock Offer Now
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      ), document.body)}

      <section
        className="smart-bands-fixed-hero relative z-0 min-h-[680px] w-full cursor-pointer overflow-hidden bg-slate-950 text-white sm:min-h-[calc(100svh-64px)] lg:min-h-[calc(100svh-80px)]"
        aria-label="TFX smart band lifestyle"
        role="link"
        tabIndex={0}
        onClick={() => navigate(FEATURED_BAND_PRODUCT_PATH)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigate(FEATURED_BAND_PRODUCT_PATH);
          }
        }}
      >
        <video
          className="band-hero-video site-hero-media absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={bandCutout}
          aria-hidden="true"
        >
          <source src={bandHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,18,0.22)_0%,rgba(2,6,18,0.12)_42%,rgba(2,6,18,0.04)_72%,rgba(2,6,18,0.14)_100%)] sm:bg-[linear-gradient(90deg,rgba(2,6,18,0.48)_0%,rgba(2,6,18,0.26)_44%,rgba(2,6,18,0.04)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/18 to-transparent sm:from-black/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-[640px] max-w-7xl flex-col justify-end px-4 pb-6 pt-24 sm:min-h-[calc(100svh-64px)] sm:justify-center sm:px-8 sm:pb-16 sm:pt-28 lg:min-h-[calc(100svh-80px)] lg:px-10 xl:pb-20">
          <div
            className="max-w-[390px] rounded-2xl bg-[linear-gradient(90deg,rgba(2,6,23,0.62)_0%,rgba(2,6,23,0.42)_68%,rgba(2,6,23,0)_100%)] p-3.5 backdrop-blur-[1px] will-change-transform sm:max-w-2xl sm:translate-y-4 sm:p-5 lg:max-w-3xl lg:translate-y-4 xl:translate-y-6"
            style={{ opacity: 1 }}
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#df0b16] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_22px_rgba(223,11,22,0.38)] sm:px-4 sm:text-sm">
              <span aria-hidden="true">!</span>
              Price Drop Alert
            </div>
            <h1 className="mt-2 max-w-[340px] font-display text-[1.35rem] font-black uppercase leading-[1.1] tracking-normal text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)] sm:max-w-none sm:text-3xl lg:text-4xl xl:text-5xl">
              Upgrade to Smarter AI Today
            </h1>
            <p className="mt-1 max-w-[340px] text-sm font-extrabold leading-5 text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)] sm:max-w-none sm:text-lg">
              With <span className="text-[#23d4ca]">TFX AI V5</span>
            </p>
            <p className="mt-2 max-w-[340px] text-[12px] font-black uppercase leading-5 tracking-[0.22em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] sm:mt-3 sm:max-w-none sm:text-base">
              Massive Price Drop
            </p>
            <div className="mt-2 flex max-w-full flex-wrap gap-1.5 sm:gap-2">
              {['Premium Performance', 'Advanced AI Technology', 'Limited Time Offer'].map((item) => (
                <span key={item} className="rounded-full border border-[#23d4ca]/40 bg-[#23d4ca]/18 px-2.5 py-1 text-[10px] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] backdrop-blur sm:px-4 sm:py-1.5 sm:text-xs">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-2 flex max-w-full flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
              <span className="text-xl font-black text-white/80 line-through drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-3xl">
                ₹15,399
              </span>
              <div className="inline-flex min-h-11 max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[#df0b16]/35 bg-[#df0b16] px-4 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_rgba(223,11,22,0.34)] sm:min-h-12 sm:px-6 sm:text-sm">
                <span>Now Only</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-base font-black leading-none text-[#df0b16] shadow-[0_8px_18px_rgba(255,255,255,0.22)] sm:px-3 sm:text-xl">
                  ₹9,999
                </span>
              </div>
            </div>
            <div className="mt-2 max-w-[370px] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] sm:mt-3 sm:max-w-2xl">
              <p className="text-sm font-black leading-5 text-cyan-100 sm:text-lg">Limited Stock Available</p>
              <p className="text-sm font-semibold leading-5 text-white sm:text-lg sm:leading-6">
                Buy Now Before Prices Rise Again
              </p>
            </div>
            <div className="mt-3 flex max-w-full flex-wrap gap-2.5 sm:mt-5 sm:gap-4">
              <Link
                to={featuredBandHref}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#0ea5e9] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(14,165,233,0.34)] transition hover:bg-[#0284c7] sm:flex-none sm:px-7"
              >
                Buy Now
              </Link>
              <Link to={featuredBandHref} onClick={(event) => event.stopPropagation()} className="site-hero-cta site-hero-cta-secondary">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="band-overview" className="relative z-10 bg-white px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
            Product Line Overview
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <Link to={FEATURED_BAND_PRODUCT_PATH} className="block overflow-hidden rounded-[1.5rem] bg-[#eff8f8] sm:rounded-[2rem]" aria-label="Open AI V5 smart band product page">
              <img src={bandHeroLifestyle} alt="TFX smart band lifestyle" className="h-full min-h-[300px] w-full object-cover object-center transition duration-300 hover:scale-[1.02] sm:min-h-[420px]" loading="lazy" />
            </Link>
            <div className="flex flex-col justify-center">
              <Link
                to={FEATURED_BAND_PRODUCT_PATH}
                className="inline-flex w-fit text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4] transition hover:text-slate-950"
              >
                Product Overview
              </Link>
              <h3 className="mt-4 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Elevating Wellness from Your Wrist
              </h3>
              <p className="mt-5 text-lg font-bold leading-8 text-slate-950 sm:text-xl">
                Smart bands and screen-light fitness bands for advanced tracking.
              </p>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                TFX bands are built for long battery life, all-day comfort, and clear app-based health summaries. The device stays light on your wrist while TFXVital turns synced data into trends you can actually use.
              </p>
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

      <section id="models" className="bg-[#f2fbfb] px-4 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-5 text-center lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">TheFutureX products</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
                Product Catalog
              </h2>
              {!loading && (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Showing all {catalogProducts.length} connected products.
                </p>
              )}
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => changeCatalogPage(catalogPage - 1)}
                disabled={catalogPage <= 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#22b8b4] hover:text-[#128b87] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Prev
              </button>
              {Array.from({ length: totalCatalogPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => changeCatalogPage(page)}
                  className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition ${
                    catalogPage === page
                      ? 'border-[#22b8b4] bg-[#22b8b4] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#22b8b4] hover:text-[#128b87]'
                  }`}
                  aria-current={catalogPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => changeCatalogPage(catalogPage + 1)}
                disabled={catalogPage >= totalCatalogPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#22b8b4] hover:text-[#128b87] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
            </div>
          </div>

          {loadError && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <p>{loadError}</p>
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
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[430px] animate-pulse rounded-[1.5rem] bg-white shadow-sm" />
              ))}
            </div>
          ) : catalogProducts.length > 0 ? (
            <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
              {paginatedCatalogProducts.map((product, index) => {
                const bullets = getCatalogBullets(product).slice(0, 2);
                const catalogHref = getHomeCatalogHref(product);
                return (
                  <article
                    key={product.id}
                    className="group flex min-h-[260px] flex-col overflow-hidden rounded-xl bg-white p-2.5 shadow-[0_12px_32px_rgba(15,63,70,0.07)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,63,70,0.12)] sm:min-h-[430px] sm:rounded-[1.5rem] sm:p-6"
                  >
                    <Link to={catalogHref} className="flex h-32 items-center justify-center overflow-hidden bg-transparent sm:h-60">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                        loading={catalogPage === 1 && index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </Link>
                    <div className="mt-3 flex flex-1 flex-col sm:mt-6">
                      <Link to={catalogHref}>
                        <h3 className="line-clamp-2 font-display text-[13px] font-black leading-tight text-slate-950 transition hover:text-[#1ca9a4] sm:text-2xl">
                          {product.name}
                        </h3>
                      </Link>
                      <ul className="mt-3 hidden space-y-1 text-xs leading-5 text-slate-600 sm:mt-4 sm:block sm:space-y-1.5 sm:text-base sm:leading-6">
                        {bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500 sm:mt-3" aria-hidden="true" />
                            <span className="line-clamp-1 sm:line-clamp-none">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
                        <p className="tfx-price-pill h-9 w-full whitespace-nowrap px-3 text-sm font-black sm:h-11 sm:w-auto sm:px-5 sm:text-base">
                          Rs {Number(product.salePrice || product.price || 0).toLocaleString()}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleHomeBuyNow(product)}
                          className="tfx-buy-now-cta inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] focus:outline-none focus:ring-2 focus:ring-[#df0b16]/35 focus:ring-offset-2 focus:ring-offset-white sm:h-11 sm:w-auto sm:px-5 sm:text-sm sm:tracking-[0.08em]"
                        >
                          <span className="sm:hidden">Add To Cart</span>
                          <span className="hidden sm:inline">Buy Now</span>
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h11m-4-4 4 4-4 4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {totalCatalogPages > 1 && (
              <nav className="mt-9 flex flex-wrap items-center justify-center gap-2" aria-label="Product catalog pagination">
                <button
                  type="button"
                  onClick={() => changeCatalogPage(catalogPage - 1)}
                  disabled={catalogPage <= 1}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#22b8b4] hover:text-[#128b87] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Prev
                </button>
                {Array.from({ length: totalCatalogPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changeCatalogPage(page)}
                    className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition ${
                      catalogPage === page
                        ? 'border-[#22b8b4] bg-[#22b8b4] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#22b8b4] hover:text-[#128b87]'
                    }`}
                    aria-current={catalogPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => changeCatalogPage(catalogPage + 1)}
                  disabled={catalogPage >= totalCatalogPages}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-[#22b8b4] hover:text-[#128b87] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </nav>
            )}
            </>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-14 text-center sm:py-20">
              <p className="text-xl font-black text-slate-950">Products are coming soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#ff0033]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#df0b16] ring-1 ring-[#df0b16]/20">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#df0b16] text-[9px] text-white" aria-hidden="true">
                  ▶
                </span>
                TheFutureX Shorts
              </p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
                Highlighted Videos
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500 sm:text-base">
                Watch quick product highlights, wearable demos, and latest updates from our YouTube channel.
              </p>
            </div>
            <a
              href="https://www.youtube.com/@TheFutureXdotin/shorts"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-[#159c98]"
            >
              View Channel
            </a>
          </div>

          <div className="flex snap-x gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
            {highlightedShorts.map((short) => (
              <article
                key={short.id}
                className="min-w-[76vw] snap-start overflow-hidden rounded-2xl bg-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:min-w-0"
              >
                <div className="aspect-[9/16] w-full">
                  {loadedShortIds.includes(short.id) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${short.id}?autoplay=1&rel=0`}
                      title={short.title}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => loadHighlightedShort(short.id)}
                      className="group relative h-full w-full overflow-hidden bg-slate-950 text-white"
                      aria-label={`Play ${short.title}`}
                    >
                      <img
                        src={`https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`}
                        alt={short.title}
                        className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
                      <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#df0b16] text-sm font-black shadow-[0_14px_35px_rgba(223,11,22,0.35)] transition group-hover:scale-105">
                        Play
                      </span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {featureTiles.map((tile) => (
          <article key={tile.title} className="relative min-h-[300px] overflow-hidden sm:min-h-[360px]">
            <img src={tile.image} alt={tile.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/22 to-black/76" aria-hidden="true" />
            <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-end p-6 text-white sm:min-h-[360px] sm:p-7">
              <h3 className="max-w-[13rem] text-2xl font-black leading-tight sm:text-3xl">{tile.title}</h3>
              <p className="mt-3 max-w-[17rem] text-sm font-medium leading-6 text-white/84 sm:text-base sm:leading-7">{tile.text}</p>
            </div>
          </article>
        ))}
      </section>

    </div>
  );
};
