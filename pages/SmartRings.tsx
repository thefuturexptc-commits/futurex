import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductReviews, getProductSlug, getProducts } from '../services/backend';
import { isSameCollection } from '../utils/productCollections';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';
import ringProduct from '../assets/images/mainring.webp';
import ringLowProfile from '../assets/images/ring-low-profile.webp';
import ringAiWellness from '../assets/images/ring-ai-wellness.webp';
import ringOverviewCharging from '../assets/images/ring-overview-charging.jpg';
import ringOverviewWaterproof from '../assets/images/ring-overview-waterproof.jpg';
import ringOverviewColors from '../assets/images/ring-overview-colors.jpg';
import smartRingHeroVideo from '../assets/images/smart-ring-hero-video.mp4';
import appAssistantScreen from '../assets/images/tfxvital-ai-assistant-screen.webp';
import appVitalAgeScreen from '../assets/images/tfxvital-vital-age-screen.webp';
import appExerciseScreen from '../assets/images/tfxvital-exercise-screen.webp';
import smartRingsCatalogBanner from '../assets/images/smart-rings-catalog-banner.webp';

const FEATURED_RING_PRODUCT_PATH = '/product/tfx-display-pro-smart-ring';

const getProductImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || ringProduct;

const getProductPreviewImages = (product: Product): string[] => {
  const colorImages = (product.colors || []).map((color) => color.images?.[0]).filter(Boolean);
  const variantImages = (product.variants || []).map((variant) => variant.images?.[0]).filter(Boolean);
  const productImages = (product.images || []).filter(Boolean);
  const images = colorImages.length ? colorImages : variantImages.length ? variantImages : productImages;
  return Array.from(new Set(images));
};

const getCatalogLine = (product: Product): string => {
  const featureLine = product.features?.filter(Boolean).slice(0, 2).join(' | ');
  if (featureLine) return featureLine;

  const specLine = Object.values(product.specs || {}).filter(Boolean).slice(0, 2).join(' | ');
  if (specLine) return specLine;

  return product.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Smart wellness tracking';
};

const ringFeatures = [
  {
    title: 'Effortless Charging',
    text: 'Keep your smart ring ready with a compact charging dock designed for simple, reliable everyday power.',
    image: ringOverviewCharging,
  },
  {
    title: 'Low-Profile Comfort',
    text: 'A smooth daily-wear form made for work, workouts, and overnight wellness tracking.',
    image: ringOverviewColors,
  },
  {
    title: 'Water Resistant Design',
    text: 'Built to handle everyday splashes, sweat, and rain so your smart ring keeps up with your routine.',
    image: ringOverviewWaterproof,
  },
];

const stats = [
 ['24/7', 'tracking'],
  ['3-5 days', 'battery life'],
  ['Sleep', 'recovery trends'],
  ['TFXVital', 'app connected'],
];

const aiCards = [
  {
    title: 'AI Assistant',
    detail: 'Ask TFXVital for reports, trends, recovery cues, and simple plans based on your latest vitals.',
 tagline: 'AI guidance, reports and daily decisions in one flow.',
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
 detail: 'Start GPS-based runs, follow distance and pace and keep workouts connected to your profile.',
    tagline: 'Live activity tracking with goals, steps, calories, and route context.',
    image: appExerciseScreen,
    imagePosition: 'center',
  },
];

interface RingPageReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  images: string[];
  date: string;
}

const ringFaqs = [
  {
    q: 'What is a smart ring?',
 a: 'A smart ring is a wearable device designed to track fitness, activity and wellness metrics while maintaining the form factor of a traditional ring.',
  },
  {
    q: 'What can a TFX Smart Ring track?',
 a: 'TFX Smart Rings support features such as activity tracking, sleep monitoring, heart rate tracking, wellness insights and connected app-based monitoring depending on the model.',
  },
  {
    q: 'Does a TFX Smart Ring connect to an app?',
    a: 'Yes, TFX Smart Rings connect with compatible smartphones through app-based sync for wellness, activity, and sleep insights.',
  },
  {
    q: 'Is a smart ring suitable for daily wear?',
    a: 'TFX Smart Rings are designed with a compact wearable form factor for everyday wellness monitoring, sleep tracking, and activity tracking.',
  },
  {
    q: 'What is the difference between a smart ring and a smart band?',
    a: 'A smart ring offers a compact ring form factor for discreet daily tracking, while a smart band is worn on the wrist and may suit users who prefer wrist-based fitness tracking.',
  },
  {
    q: 'Which TFX Smart Ring should I choose?',
    a: 'Choose TFX Display Pro if you want quick on-device information, TFX Touch if you prefer touch-enabled control, and TFX Ring Pro for compact app-connected wellness tracking.',
  },
];

export const SmartRings: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [heroTextProgress, setHeroTextProgress] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState(0);
  const [ringReviews, setRingReviews] = useState<RingPageReview[]>([]);
  const [visibleRingReviewCount, setVisibleRingReviewCount] = useState(2);
  const catalogScrollerRef = useRef<HTMLDivElement | null>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    getProducts()
      .then((data) => {
        if (cancelled) return;
        const ringProducts = data.filter((product) => isSameCollection(product.category, 'Smart Rings'));
        setProducts(ringProducts);

        void Promise.all(
          ringProducts.map(async (product) => {
            const reviews = await getProductReviews(product.id);
            return reviews.map((review, index) => ({
              id: review.id || `${product.id}_${index}`,
              name: review.name,
              rating: review.rating,
              comment: review.comment,
              images: review.images || [],
              date: review.date || '',
            }));
          })
        ).then((reviewLists) => {
          if (!cancelled) setRingReviews(reviewLists.flat());
        });
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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      setSelectedInsight((current) => (current + 1) % aiCards.length);
    }, 3600);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product, 1, { openCart: false });
    navigate(user ? '/checkout' : '/login?redirect=%2Fcheckout');
  };

  const scrollCatalogBy = (direction: -1 | 1) => {
    const scroller = catalogScrollerRef.current;
    if (!scroller) return;
    const firstCard = scroller.querySelector<HTMLElement>('article');
    const cardStep = (firstCard?.offsetWidth || scroller.clientWidth * 0.86) + 20;
    scroller.scrollBy({ left: direction * cardStep, behavior: 'smooth' });
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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const scrollNextProduct = () => {
      if (document.hidden) return;
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
        className="smart-rings-fixed-hero smart-rings-banner-hero relative z-0 w-full cursor-pointer overflow-hidden bg-black text-white"
        aria-label="TFX smart ring health banner"
      >
        <img
          src={smartRingsCatalogBanner}
          alt="Your health one touch away smart ring banner"
          className="site-hero-media smart-rings-banner-image absolute inset-0 h-full w-full object-contain object-center"
          loading="eager"
          decoding="async"
        />
        <Link to={FEATURED_RING_PRODUCT_PATH} className="absolute inset-0 z-10" aria-label="View TFX Display Pro Smart Ring">
          <span className="sr-only">View TFX Display Pro Smart Ring</span>
        </Link>
      </section>

      <section id="ring-overview" className="relative z-10 overflow-hidden bg-white px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">Product Overview</p>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              A cleaner way to understand your body
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.7fr)_minmax(320px,0.95fr)] lg:items-center">
            <div className="relative mx-auto w-full max-w-[390px] overflow-hidden rounded-2xl bg-black shadow-[0_22px_70px_rgba(15,23,42,0.14)] sm:max-w-[430px] sm:rounded-3xl lg:mx-0">
              <video
                className="block aspect-[3/4] w-full object-contain object-center"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="TFX smart ring product video"
              >
                <source src={smartRingHeroVideo} type="video/mp4" />
              </video>
            </div>
            <div className="flex flex-col justify-between p-1 sm:p-3 lg:p-6">
              <div>
                <h3 className="font-display text-2xl font-black leading-tight text-slate-950 sm:text-3xl lg:text-4xl">
 Discovering encased in a ring
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
                  TFX rings pack multi-sensor wellness tracking into a compact ring form. They support sleep, recovery, activity, heart-rate trends, and app-based summaries without adding another screen to your day.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                {stats.map(([value, label]) => (
                  <div key={value} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <a href="#ring-catalog" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-black px-5 text-sm font-black text-white transition hover:bg-slate-800 sm:w-fit">
                View Catalog
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="ring-catalog" className="scroll-mt-0 bg-[#f2fbfb] px-4 pb-6 pt-0 sm:px-8 sm:pb-8 sm:pt-0 lg:px-10 lg:pb-10 lg:pt-0">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex flex-col items-center justify-between gap-3 pt-4 text-center sm:pt-5 lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">TFX smart rings</p>
              <h2 className="mt-1 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Product Catalog
              </h2>
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
                <div key={item} className="h-[330px] animate-pulse rounded-[1.5rem] bg-white shadow-sm sm:h-[430px]" />
              ))}
            </div>
          ) : catalogProducts.length > 0 ? (
            <div className="relative">
              {catalogProducts.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollCatalogBy(-1)}
                    className="absolute left-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-2xl font-black leading-none text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-[#0ea5e9] hover:text-white sm:-left-5"
                    aria-label="Previous smart ring products"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCatalogBy(1)}
                    className="absolute right-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-2xl font-black leading-none text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-[#0ea5e9] hover:text-white sm:-right-5"
                    aria-label="Next smart ring products"
                  >
                    ›
                  </button>
                </>
              )}
              <div ref={catalogScrollerRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {catalogProducts.map((product, index) => {
                const salePrice = Number(product.salePrice || product.price || 0);
                const mrp = salePrice > 0 ? salePrice + 2000 : 0;
                const offerPricing = getAutomaticOfferItemPricing(product);
                const allPreviewImages = getProductPreviewImages(product);
                const previewImages = allPreviewImages.slice(0, 2);
                const extraPreviewCount = Math.max(0, allPreviewImages.length - previewImages.length);

                return (
                  <article
                    key={product.id}
                    className="group relative flex min-h-[394px] w-[min(82vw,286px)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-100 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(15,63,70,0.13)] min-[420px]:w-[280px] sm:min-h-[420px] sm:w-[292px]"
                  >
                    {(product.isNewArrival || product.isBestSeller || product.isFeatured) && (
                      <div className="absolute left-2.5 top-2.5 z-10 rounded-r-full bg-[#86d8d2] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        {product.isBestSeller ? 'Best Seller' : product.isNewArrival ? 'New Launch' : 'Featured'}
                      </div>
                    )}
                    <Link to={`/product/${getProductSlug(product)}`} className="flex h-60 items-center justify-center overflow-hidden rounded-md bg-white sm:h-64">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.035]"
                        loading={index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                      {previewImages.length > 0 && (
                        <div className="mb-3 flex items-center gap-2">
                          {previewImages.map((image, previewIndex) => (
                            <Link
                              key={`${image}-${previewIndex}`}
                              to={`/product/${getProductSlug(product)}`}
                              className="grid h-11 w-11 place-items-center rounded-md border border-[#0ea5e9] bg-white p-1 shadow-sm"
                              aria-label={`View ${product.name} preview ${previewIndex + 1}`}
                            >
                              <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" aria-hidden="true" />
                            </Link>
                          ))}
                          {extraPreviewCount > 0 && (
                            <Link
                              to={`/product/${getProductSlug(product)}`}
                              className="grid h-11 w-11 place-items-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-500 shadow-sm"
                              aria-label={`View ${extraPreviewCount} more ${product.name} previews`}
                            >
                              +{extraPreviewCount}
                            </Link>
                          )}
                        </div>
                      )}
                      <Link to={`/product/${getProductSlug(product)}`} className="min-w-0">
                        <h3 className="product-catalog-title truncate text-slate-950 transition hover:text-[#1ca9a4]">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="mt-2 truncate text-xs font-medium leading-5 text-slate-600">{getCatalogLine(product)}</p>
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        {offerPricing.rate <= 0 && mrp > salePrice && (
                          <span className="text-xs font-bold leading-none text-slate-400 line-through">
                            &#8377;{mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                        {offerPricing.rate > 0 && (
                          <span className="text-xs font-bold leading-none text-slate-400 line-through">
                            {formatInrAmount(salePrice)}
                          </span>
                        )}
                        <span className={`text-base font-black leading-none ${offerPricing.rate > 0 ? 'text-emerald-600' : 'text-slate-950'}`}>
                          {formatInrAmount(offerPricing.unitOfferPrice)}
                        </span>
                      </div>
                      {offerPricing.rate > 0 && (
                        <p className="mt-1 text-[11px] font-bold text-emerald-600">
                          Save {formatInrAmount(offerPricing.unitDiscount)} ({offerPricing.rateLabel} off)
                        </p>
                      )}
                      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="inline-flex h-8 items-center justify-center rounded-md bg-black px-2 text-[10px] font-black text-white transition hover:bg-slate-800 sm:text-[11px]"
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBuyNow(product)}
                          className="inline-flex h-8 items-center justify-center rounded-md bg-[#540000] px-2 text-[10px] font-black text-white transition hover:bg-[#3f0000] sm:text-[11px]"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </article>
                );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-14 text-center sm:py-20">
              <p className="text-xl font-black text-slate-950">Smart ring models are coming soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1">
        {ringFeatures.map((feature) => (
          <article key={feature.title} className="relative min-h-[300px] overflow-hidden sm:min-h-[420px] lg:min-h-[480px]">
            <img src={feature.image} alt={feature.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/24 to-black/72" aria-hidden="true" />
            <div className="smart-ring-feature-copy relative z-10 mx-auto flex h-full min-h-[300px] max-w-7xl flex-col justify-end px-6 py-8 text-white sm:min-h-[420px] sm:px-8 sm:py-10 lg:min-h-[480px] lg:px-10">
              <h3 className="max-w-xl text-2xl font-black leading-tight sm:text-4xl">{feature.title}</h3>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/84 sm:text-lg sm:leading-8">{feature.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-[#f7fbfb] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">Customer Reviews</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Smart ring experiences
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-500">
              Read what customers say. Add your own review from the product detail page.
            </p>
          </div>

          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ringReviews.slice(0, visibleRingReviewCount).map((review) => (
                <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{review.name}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-amber-500">{'\u2605'.repeat(review.rating)}</p>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{review.comment}</p>
                  {review.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {review.images.slice(0, 2).map((image) => (
                        <img key={image} src={image} alt={`${review.name} review`} className="h-20 w-20 rounded-lg object-cover" loading="lazy" />
                      ))}
                    </div>
                  )}
                </article>
              ))}
              {ringReviews.length > 2 && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleRingReviewCount((current) =>
                        current < ringReviews.length ? Math.min(current + 4, ringReviews.length) : 2
                      )
                    }
                    className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-950 transition hover:border-[#0ea5e9] hover:text-[#0369a1] sm:w-fit"
                  >
                    {visibleRingReviewCount < ringReviews.length ? 'View More Reviews' : 'Show Less'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1ca9a4]">Explore the App</p>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
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
                    selectedInsight === index ? 'w-10 bg-[#0ea5e9]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Show ${card.title}`}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-visible bg-transparent p-0 shadow-none sm:min-h-[560px]">
            <div className="flex h-full min-h-[340px] items-center justify-center sm:min-h-[520px]">
              <img
                key={selectedCard.title}
                src={selectedCard.image}
                alt={`${selectedCard.title} app screen`}
                className="max-h-[340px] w-full object-contain animate-[fadeIn_500ms_ease] sm:max-h-[510px]"
                style={{ objectPosition: selectedCard.imagePosition }}
                loading="lazy"
                decoding="async"
              />
            </div>
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
