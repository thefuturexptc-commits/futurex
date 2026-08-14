import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductSlug, getProducts } from '../services/backend';
import { isSameCollection } from '../utils/productCollections';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';
import bandCutout from '../assets/images/band-hero-cutout.webp';
import bandHeroLifestyle from '../assets/images/band-men-women-lifestyle.webp';
import bandHeroVideo from '../assets/images/band-hero-video.mp4';
import tfxV5BannerOne from '../assets/images/tfx-v5-banner-01.webp';
import tfxV5BannerTwo from '../assets/images/tfx-v5-banner-02.webp';
import tfxVitalAppQr from '../assets/images/tfx-vital-app-qr-512.png';

const stats = [
  ['7-10 days', 'typical battery'],
  ['IP68', 'water resistant'],
  ['24/7', 'vitals sync'],
  ['TFXVital', 'app support'],
];

const FEATURED_BAND_PRODUCT_PATH = '/product/tfx5-ai-smart-band';

const bandFaqs = [
  {
    q: 'What does the TFX Smart Band track?',
    a: 'The TFX Smart Band supports activity tracking, heart rate monitoring, sleep tracking, calorie tracking and app-connected wellness monitoring features.',
  },
  {
    q: 'Does the TFX Smart Band support SpO2 monitoring?',
    a: 'Selected TFX Smart Band models support blood oxygen (SpO2) monitoring functionality.',
  },
  {
    q: 'Can the smart band connect to a smartphone?',
    a: 'Yes, TFX Smart Bands connect to compatible smartphones using Bluetooth and companion app integration.',
  },
  {
    q: 'Is the TFX Smart Band suitable for daily wear?',
    a: 'The lightweight design is intended for comfortable everyday use during work, exercise and daily activities.',
  },
  {
    q: 'Which TFX Smart Band is best for fitness tracking?',
 a: 'Choose a model based on the metrics you need. TFX5 AI Smart Band is suited for users who want heart rate, SpO2, blood pressure wellness trends, VO2, vital age, sleep, stress, recovery, GPS activity and app-connected AI insights.',
  },
  {
    q: 'Can I use a TFX Smart Band for sleep tracking?',
    a: 'Yes. TFX Smart Bands are designed for lightweight overnight wear and app-based sleep trend review.',
  },
];

const getProductImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || bandCutout;

const getProductPreviewImages = (product: Product): string[] => {
  const colorImages = (product.colors || []).map((color) => color.images?.[0]).filter(Boolean);
  const variantImages = (product.variants || []).map((variant) => variant.images?.[0]).filter(Boolean);
  const productImages = (product.images || []).filter(Boolean);
  const images = colorImages.length ? colorImages : variantImages.length ? variantImages : productImages;
  return Array.from(new Set(images));
};

const getProductSlugKey = (product: Product): string =>
  String(product.slug || product.name || product.id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isMegaPriceDropBand = (product: Product): boolean => {
  const slug = getProductSlugKey(product);
  return slug === 'tfx5-ai-smart-band' || slug === 'ai-v5-smart-band-heart-rate-spo2-fitness-tracker';
};

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

export const SmartBands: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
        setProducts(data.filter((product) => isSameCollection(product.category, 'Smart Bands')));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load smart bands right now.');
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
  const featuredBandHref = FEATURED_BAND_PRODUCT_PATH;

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
    <div className="smart-bands-page relative min-h-screen bg-white text-slate-950">
      <section
        className="smart-bands-fixed-hero relative z-0 min-h-[560px] w-full overflow-hidden bg-slate-950 text-white sm:min-h-[calc(100svh-64px)] lg:min-h-[calc(100svh-80px)]"
        aria-label="TFX smart band lifestyle"
      >
        <video
          className="band-hero-video site-hero-media absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={(event) => {
            void event.currentTarget.play().catch(() => undefined);
          }}
          onCanPlay={(event) => {
            void event.currentTarget.play().catch(() => undefined);
          }}
          aria-hidden="true"
        >
          <source src={bandHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,18,0.22)_0%,rgba(2,6,18,0.12)_42%,rgba(2,6,18,0.04)_72%,rgba(2,6,18,0.14)_100%)] sm:bg-[linear-gradient(90deg,rgba(2,6,18,0.48)_0%,rgba(2,6,18,0.26)_44%,rgba(2,6,18,0.04)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/18 to-transparent sm:from-black/20" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl flex-col justify-start px-4 pb-12 pt-28 sm:min-h-[calc(100svh-64px)] sm:justify-center sm:px-8 sm:pb-14 sm:pt-24 lg:min-h-[calc(100svh-80px)] lg:px-10">
          <div
            className="max-w-3xl will-change-transform"
            style={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
          >
            <h1 className="max-w-[340px] font-display text-[1.7rem] font-black leading-[1.12] tracking-normal text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] sm:max-w-none sm:text-5xl lg:text-6xl">
              Your <span className="text-[#23d4ca]">Health.</span> Predicted. Optimized. Protected.
            </h1>
            <p className="mt-2 max-w-[340px] text-[13px] font-extrabold leading-5 text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:mt-5 sm:max-w-none sm:text-xl">
              AI-powered wellness that learns from your body
            </p>
            <p className="mt-3 max-w-[340px] text-[15px] font-medium leading-[1.48] text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.55)] sm:mt-4 sm:max-w-2xl sm:text-lg sm:leading-8">
              Our AI continuously learns from your body, helping you stay ahead with smarter insights, deeper analysis, and personalized recommendations.
            </p>
            <div className="mt-5 flex gap-2.5 sm:mt-8 sm:flex-wrap sm:gap-4">
              <a href="#models" className="site-hero-cta site-hero-cta-primary">
                Buy Now
              </a>
              <Link to={featuredBandHref} className="site-hero-cta site-hero-cta-secondary">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="band-overview" className="relative z-10 bg-white px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
            Product Line Overview
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="overflow-hidden rounded-[1.5rem] bg-[#eff8f8] sm:rounded-[2rem]">
              <img src={bandHeroLifestyle} alt="TFX smart band lifestyle" className="h-full min-h-[300px] w-full object-cover object-center sm:min-h-[420px]" loading="lazy" />
            </div>
            <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">Product Overview</p>
            <h3 className="mt-4 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              Elevating Wellness from Your Wrist
            </h3>
            <p className="mt-5 text-lg font-bold leading-8 text-slate-950 sm:text-xl">
              Smart bands and screen-light fitness bands for advanced tracking.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
 TFX bands are built for long battery life, all-day comfort and clear app-based summaries. The device stays light on your wrist while TFXVital turns synced data into trends you can actually use.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-4">
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
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">TFX smart bands</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
                Product Catalog
              </h2>
              {!loading && (
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Showing all {catalogProducts.length} connected smart band products.
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
                    aria-label="Previous smart band products"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCatalogBy(1)}
                    className="absolute right-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-2xl font-black leading-none text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-[#0ea5e9] hover:text-white sm:-right-5"
                    aria-label="Next smart band products"
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
                const detailLine = getCatalogBullets(product).slice(0, 2).join(' | ');
                const showMegaPriceDrop = isMegaPriceDropBand(product);
                const allPreviewImages = getProductPreviewImages(product);
                const previewImages = allPreviewImages.slice(0, 2);
                const extraPreviewCount = Math.max(0, allPreviewImages.length - previewImages.length);

                return (
                  <article
                    key={product.id}
                    className="group relative flex min-h-[394px] w-[min(82vw,286px)] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-100 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(15,63,70,0.13)] min-[420px]:w-[280px] sm:min-h-[420px] sm:w-[292px]"
                  >
                    {showMegaPriceDrop && (
                      <div className="absolute left-2.5 top-2.5 z-10 rounded-r-full bg-[#df0b16] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_8px_18px_rgba(223,11,22,0.18)]">
                        Mega Price Drop
                      </div>
                    )}
                    {(product.isNewArrival || product.isBestSeller || product.isFeatured) && (
                      <div className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[#86d8d2] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">
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
                      <p className="mt-2 truncate text-xs font-medium leading-5 text-slate-600">{detailLine}</p>
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
              <p className="text-xl font-black text-slate-950">Smart band models are coming soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#c6d6e3] px-0 py-0" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 2400px' }}>
        <h2 className="sr-only">TFX V5 smart band and TheFutureX app banners</h2>
        <div className="mx-auto max-w-[1120px] overflow-hidden bg-[#c6d6e3]">
          <div className="relative">
            <Link
              to={featuredBandHref}
              className="block cursor-pointer"
              aria-label="View TFX5 AI Smart Band"
            >
              <img
                src={tfxV5BannerOne}
                alt="TFX5 AI Smart Band powered by TFX Vital Pro"
                className="block w-full"
                width="1080"
                height="1920"
                loading="lazy"
                fetchPriority="low"
                decoding="async"
              />
            </Link>
            <div className="absolute bottom-[6.5%] left-[8%] z-10 flex flex-col items-center gap-1.5 sm:bottom-[7.5%] sm:left-[12%]">
              <p className="max-w-[clamp(92px,18vw,210px)] rounded-md bg-white/92 px-2 py-1 text-center text-[clamp(8px,1.5vw,14px)] font-black uppercase leading-tight tracking-[0.08em] text-slate-950 shadow-[0_8px_22px_rgba(15,23,42,0.18)]">
                TheFutureX app available on Play Store
              </p>
              <img
                src={tfxVitalAppQr}
                alt="TheFutureX Smartwear app QR code"
                className="h-[clamp(72px,15vw,172px)] w-[clamp(72px,15vw,172px)] rounded-lg bg-white p-[clamp(4px,0.8vw,10px)] object-contain shadow-[0_10px_28px_rgba(15,23,42,0.24)]"
                width="512"
                height="512"
                loading="lazy"
                fetchPriority="low"
                decoding="async"
              />
            </div>
          </div>
          <Link
            to={featuredBandHref}
            className="block cursor-pointer"
            aria-label="View TFX5 AI Smart Band color variants"
          >
            <img
              src={tfxV5BannerTwo}
              alt="TheFutureX app and TFX5 smart band color variants"
              className="block w-full"
              width="1080"
              height="1920"
              loading="lazy"
              fetchPriority="low"
              decoding="async"
            />
          </Link>
        </div>
      </section>

      <section className="bg-[#f2fbfb] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">FAQ</h2>
          <div className="mt-8 space-y-4">
            {bandFaqs.map((item) => (
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
