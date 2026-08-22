import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '../components/ui/Button';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addOfferLead, getProductSlug } from '../services/backend';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';
import bandCutout from '../assets/images/band-hero-cutout.webp';
import bestSellerTfx5AiBandImage from '../assets/images/best-seller-tfx5-ai-band.webp';
import homeCollectionBandImage from '../assets/images/home-collection-smart-band.webp';
import homeCollectionFanImage from '../assets/images/home-collection-smart-fan.webp';
import homeCollectionRingImage from '../assets/images/home-collection-smart-ring.png';
import homeRainReadyBandBanner from '../assets/images/home-rain-ready-band-banner.webp';
import homeStormRingBanner from '../assets/images/home-storm-ring-banner.webp';
import homeWaterproofBandBanner from '../assets/images/home-waterproof-band-banner.webp';
import homeScrollBannerOne from '../assets/images/home-scroll-banner-01.webp';
import homeScrollBannerTwo from '../assets/images/home-scroll-banner-02.webp';
import homeScrollBannerThree from '../assets/images/home-scroll-banner-03.webp';
import homeScrollBannerFour from '../assets/images/home-scroll-banner-04.webp';
import { homepageFaqs } from '../services/seo';

gsap.registerPlugin(ScrollTrigger);

/**
 * Fades and lifts its children into view the first time they scroll into the
 * viewport. Pure CSS transition driven by one IntersectionObserver per
 * instance; disconnects itself after firing once. No images, no libraries.
 * Respects prefers-reduced-motion by rendering fully visible immediately.
 */
const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  hiddenClassName?: string;
  visibleClassName?: string;
  durationClassName?: string;
}> = ({
  children,
  className = '',
  delayMs = 0,
  hiddenClassName = 'opacity-0 translate-y-6',
  visibleClassName = 'opacity-100 translate-y-0',
  durationClassName = 'duration-700',
}) => {
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || typeof window === 'undefined') return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={nodeRef}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
      className={`transition-all ${durationClassName} ease-out ${visible ? visibleClassName : hiddenClassName} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Small circular button that fades in once the page has scrolled down and
 * smoothly returns the user to the top when clicked. Pure scroll-listener,
 * no libraries.
 */
const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll back to top"
      className={`fixed bottom-5 right-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-white shadow-[0_10px_26px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#0ea5e9] active:scale-90 sm:bottom-7 sm:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

const CATALOG_PAGE_SIZE = 4;
const FEATURED_BAND_PRODUCT_PATH = '/product/tfx5-ai-smart-band';
const FEATURED_RING_PRODUCT_PATH = '/product/tfx-display-pro-smart-ring';
const FEATURED_FAN_PRODUCT_PATH = '/product/tfx-advance';
const HOME_WATER_RESISTANT_BANNERS: Array<{ image: string; href: string; alt: string; mobileImage?: string }> = [
  {
    image: homeWaterproofBandBanner,
    href: FEATURED_BAND_PRODUCT_PATH,
    alt: 'Minimalist TFX smart band with water drops and maximum durability message',
  },
  {
    image: homeRainReadyBandBanner,
    href: FEATURED_BAND_PRODUCT_PATH,
    alt: 'Rain ready fitness ready TFX smart bands in a rainy outdoor scene',
  },
  {
    image: homeStormRingBanner,
    href: FEATURED_RING_PRODUCT_PATH,
    alt: 'TFX smart rings in rain with elegance meets every storm message',
  },
];
const HOME_COLLECTION_CARDS = [
  {
    title: 'Best Seller',
    image: bestSellerTfx5AiBandImage,
    href: FEATURED_BAND_PRODUCT_PATH,
    alt: 'TFX5 AI Smart Band best seller collection',
  },
  {
    title: 'Smart Bands',
    image: homeCollectionBandImage,
    href: '/smart-bands',
    alt: 'Smart bands collection',
  },
  {
    title: 'Smart Rings',
    image: homeCollectionRingImage,
    href: '/smart-rings',
    alt: 'Smart rings collection',
  },
  {
    title: 'Smart Fans',
    image: homeCollectionFanImage,
    href: '/bladeless-fan',
    alt: 'Smart fans collection',
  },
];

const HOME_SCROLL_BANNERS = [
  { label: 'Smart Band', image: homeScrollBannerOne, alt: 'TFX smart band banner' },
  { label: 'Smart Fans', image: homeScrollBannerTwo, alt: 'TFX bladeless fan banner' },
  { label: 'Smart Monitoring', image: homeScrollBannerThree, alt: 'TFX heart rate monitor banner' },
  { label: 'Smart Rings', image: homeScrollBannerFour, alt: 'TFX smart ring banner' },
];

const ScrollLinkedBanners: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const sectionRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const tabListRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const panelRefs = React.useRef<Array<HTMLElement | null>>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  const updatePill = useCallback(() => {
    const list = tabListRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!list || !tab) return;
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    setPillStyle({ left: `${tabBox.left - listBox.left}px`, width: `${tabBox.width}px`, opacity: 1 });
  }, [activeIndex]);

  useEffect(() => {
    updatePill();
    const observer = new ResizeObserver(updatePill);
    if (tabListRef.current) observer.observe(tabListRef.current);
    return () => observer.disconnect();
  }, [updatePill]);

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth < 640);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // One pinned, layered product stage. Every banner occupies the same space;
  // normal vertical page scrolling brings the next layer to the front. There
  // is deliberately no translateX or horizontal slider behaviour.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.home-scroll-banner-panel');
      if (!panels.length || !sectionRef.current || !sceneRef.current) return;

      const incomingYOffset = isMobileViewport ? 8 : 10;
      const incomingScale = isMobileViewport ? 1.02 : 1.04;
      gsap.set(panels, { autoAlpha: 0, yPercent: incomingYOffset, scale: incomingScale, zIndex: 0 });
      gsap.set(panels[0], { autoAlpha: 1, yPercent: 0, scale: 1, zIndex: 1 });

      const timeline = gsap.timeline({ defaults: { ease: 'none' } });
      panels.slice(1).forEach((panel, index) => {
        const previous = panels[index];
        timeline
          .set(panel, { zIndex: index + 2 }, index)
          .to(previous, { autoAlpha: 0, scale: 0.985, duration: 1 }, index)
          .to(panel, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1 }, index);
      });
      // Reserve a final scroll segment for the last graphic so it is fully
      // visible before the pinned product-story section releases.
      timeline.to({}, { duration: 1 });

      scrollTriggerRef.current = ScrollTrigger.create({
        animation: timeline,
        trigger: sectionRef.current,
        start: 'top top+=104',
        end: () => `+=${Math.max(window.innerHeight * panels.length, 2000)}`,
        pin: sceneRef.current,
        scrub: 0.7,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (trigger) => {
          const nextIndex = Math.min(panels.length - 1, Math.round(trigger.progress * (panels.length - 1)));
          setActiveIndex((current) => current === nextIndex ? current : nextIndex);
        },
      });
    }, sectionRef);

    return () => {
      scrollTriggerRef.current = null;
      context.revert();
    };
  }, [isMobileViewport]);

  const selectBanner = (index: number) => {
    setActiveIndex(index);
    const trigger = scrollTriggerRef.current;
    if (!trigger) return;
    const progress = index / (HOME_SCROLL_BANNERS.length - 1);
    window.scrollTo({ top: trigger.start + ((trigger.end - trigger.start) * progress), behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="home-scroll-banner-section bg-white px-0 py-0" aria-label="Featured product banners">
      <h2 className="sr-only">TheFutureX featured product banners</h2>
      <div ref={sceneRef} className="home-scroll-banner-scene mx-auto max-w-[1440px] px-3 sm:px-4">
        <div className="home-scroll-banner-tabs sticky z-30 mx-auto max-w-6xl" role="tablist" aria-label="Featured product categories" ref={tabListRef}>
          <span className="home-scroll-banner-pill" style={pillStyle} aria-hidden="true" />
          {HOME_SCROLL_BANNERS.map((banner, index) => (
            <button
              key={banner.label}
              id={`home-scroll-tab-${index}`}
              ref={(node) => { tabRefs.current[index] = node; }}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-controls={`home-scroll-panel-${index}`}
              onClick={() => selectBanner(index)}
              className="home-scroll-banner-tab"
            >
              {banner.label}
            </button>
          ))}
        </div>
        <div className="home-scroll-banner-stage mt-3 sm:mt-4">
          {HOME_SCROLL_BANNERS.map((banner, index) => (
            <article
              key={banner.image}
              id={`home-scroll-panel-${index}`}
              ref={(node) => { panelRefs.current[index] = node; }}
              data-banner-index={index}
              role="tabpanel"
              aria-labelledby={`home-scroll-tab-${index}`}
              className={`home-scroll-banner-panel${activeIndex === index ? ' home-scroll-banner-panel--active' : ''}`}
            >
              <img
                src={banner.image}
                alt={banner.alt}
                className="block h-auto w-full"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const toCategorySlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isMegaPriceDropBand = (product: Product): boolean => {
  const slug = toCategorySlug(product.slug || product.name || product.id || '');
  return slug === 'tfx5-ai-smart-band' || slug === 'ai-v5-smart-band-heart-rate-spo2-fitness-tracker';
};

const getHomeCatalogHref = (product: Product): string => {
  return `/product/${getProductSlug(product)}`;
};

const getHomeCatalogCategoryRank = (product: Product): number => {
  const categoryText = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  if (/\b(band|bracelet)\b/.test(categoryText)) return 0;
  if (/\bring\b/.test(categoryText)) return 1;
  if (/\bfan\b/.test(categoryText)) return 2;
  if (/\b(monitor|watch|belt|spo2|ecg|blood\s*pressure|glucose)\b/.test(categoryText)) return 3;
  if (/\b(glass|glasses|eyewear|ar|vr)\b/.test(categoryText)) return 4;
  return 5;
};

const getProductImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || bandCutout;

const getProductPreviewImages = (product: Product): string[] => {
  const colorImages = (product.colors || []).map((color) => color.images?.[0]).filter(Boolean);
  const variantImages = (product.variants || []).map((variant) => variant.images?.[0]).filter(Boolean);
  const productImages = (product.images || []).filter(Boolean);
  const images = colorImages.length ? colorImages : variantImages.length ? variantImages : productImages;
  return Array.from(new Set(images));
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

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [offerName, setOfferName] = useState('');
  const [offerPhone, setOfferPhone] = useState('');
  const [offerConsent, setOfferConsent] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerUnlocked, setOfferUnlocked] = useState(false);
  const [copiedOfferCode, setCopiedOfferCode] = useState('');
  const [homeWaterBannerIndex, setHomeWaterBannerIndex] = useState(0);
  const [popupEntered, setPopupEntered] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

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
    setShowOfferPopup(false);
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
    if (!showOfferPopup) {
      setPopupEntered(false);
      return undefined;
    }
    const raf = window.requestAnimationFrame(() => setPopupEntered(true));
    return () => window.cancelAnimationFrame(raf);
  }, [showOfferPopup]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

  const [isHomeBannerPaused, setIsHomeBannerPaused] = useState(false);

  useEffect(() => {
    if (isHomeBannerPaused || HOME_WATER_RESISTANT_BANNERS.length <= 1) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const intervalId = window.setInterval(() => {
      setHomeWaterBannerIndex((current) => (current + 1) % HOME_WATER_RESISTANT_BANNERS.length);
    }, 4500);
    return () => window.clearInterval(intervalId);
  }, [isHomeBannerPaused]);

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

  const handleHomeAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleHomeBuyNow = (product: Product) => {
    addToCart(product, 1, { openCart: false });
    navigate(user ? '/checkout' : '/login?redirect=%2Fcheckout');
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
      couponCodes: [],
      message: 'Direct offer: 10% off fans, 5% off rings and eligible bands',
    });
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

  const handleShopWithOffer = () => {
    setShowOfferPopup(false);
    document.getElementById('models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const catalogProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const categoryRank = getHomeCatalogCategoryRank(a) - getHomeCatalogCategoryRank(b);
      if (categoryRank !== 0) return categoryRank;

      const aScore = Number(Boolean(a.isFeatured || a.isNewArrival)) + Number(Boolean(a.isBestSeller));
      const bScore = Number(Boolean(b.isFeatured || b.isNewArrival)) + Number(Boolean(b.isBestSeller));
      return bScore - aScore || a.name.localeCompare(b.name);
    });
  }, [products]);
  const totalCatalogPages = Math.max(1, Math.ceil(catalogProducts.length / CATALOG_PAGE_SIZE));
  const paginatedCatalogProducts = catalogProducts.slice(
    (catalogPage - 1) * CATALOG_PAGE_SIZE,
    catalogPage * CATALOG_PAGE_SIZE
  );
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
      <style>{`
        @keyframes tfx-shimmer {
          from { background-position: -400px 0; }
          to { background-position: 400px 0; }
        }
        .tfx-shimmer {
          background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 40%, #f1f5f9 80%);
          background-size: 800px 100%;
          animation: tfx-shimmer 1.4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tfx-shimmer { animation: none; background: #eef2f6; }
        }
      `}</style>

      <ScrollToTopButton />

      {showOfferPopup && createPortal((
        <div
          className={`fixed inset-0 flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/85 px-3 py-5 transition-opacity duration-300 ease-out sm:px-4 sm:py-8 ${
            popupEntered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 2147483647 }}
        >
          <div
            className={`relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[390px] overflow-y-auto rounded-2xl bg-[#050505] px-4 pb-5 pt-8 text-center shadow-2xl ring-1 ring-white/10 transition-all duration-300 ease-out sm:max-w-[460px] sm:px-8 sm:pb-8 sm:pt-9 ${
              popupEntered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.setItem('tfx_offer_popup_dismissed', '1');
                setShowOfferPopup(false);
              }}
              className="absolute right-2 top-2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl font-black leading-none text-white transition hover:bg-white/15 hover:text-[#df0b16] focus:outline-none focus:ring-2 focus:ring-[#df0b16] sm:right-3 sm:top-3"
              aria-label="Close offer"
            >
              {'\u00d7'}
            </button>

            <img src="/images/tfx-offer-logo.png" alt="TheFutureX" className="mx-auto h-20 w-auto max-w-[70%] object-contain sm:h-32 sm:max-w-[78%]" />

            {offerUnlocked ? (
              <div className="mt-3">
                <h2 className="font-display text-2xl font-black leading-tight text-white sm:text-4xl">Offer Unlocked</h2>
                <p className="mx-auto mt-3 max-w-[18rem] text-xs font-bold leading-5 text-slate-200 sm:max-w-none sm:text-base sm:leading-6">
                  Direct prices are active. Fans get 10% off, rings and eligible bands get 5% off.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    { label: 'Fans', offer: '10% OFF' },
                    { label: 'Rings & Bands', offer: '5% OFF' },
                  ].map((item) => (
                    <div key={item.label} className="min-w-0 rounded-2xl border border-white/15 bg-white p-3 text-left shadow-[0_14px_28px_rgba(0,0,0,0.25)]">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-base font-black tracking-wide text-slate-950 sm:text-lg">{item.label}</p>
                          <p className="mt-0.5 text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-emerald-700 sm:text-xs sm:tracking-[0.16em]">
                            Applied automatically - {item.offer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleShopWithOffer}
                  className="mt-5 h-11 w-full rounded-xl bg-[#df0b16] text-sm font-black text-white shadow-[0_16px_28px_rgba(223,11,22,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c70712] hover:shadow-[0_20px_34px_rgba(223,11,22,0.32)] active:translate-y-0 active:scale-[0.97] sm:h-12 sm:text-base"
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
              <p className="mt-3 text-sm font-black leading-5 text-[#df0b16] sm:text-base">Direct 10% off fans, 5% off rings & eligible bands</p>
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
                  <span aria-hidden="true">IN</span>
                  <span className="text-sm text-slate-500">v</span>
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
                className="mt-2 h-11 w-full rounded-xl bg-[#df0b16] text-sm font-black text-white shadow-[0_16px_28px_rgba(223,11,22,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c70712] hover:shadow-[0_20px_34px_rgba(223,11,22,0.32)] active:translate-y-0 active:scale-[0.97] sm:h-12 sm:text-base"
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
        className="relative isolate overflow-hidden bg-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.28)] sm:rounded-b-[1.75rem]"
        aria-label="Homepage banner"
        onMouseEnter={() => setIsHomeBannerPaused(true)}
        onMouseLeave={() => setIsHomeBannerPaused(false)}
        onFocus={() => setIsHomeBannerPaused(true)}
        onBlur={() => setIsHomeBannerPaused(false)}
      >
        <div
          className="relative w-full aspect-[16/9] overflow-hidden sm:aspect-[21/9]"
        >
          {HOME_WATER_RESISTANT_BANNERS.map((banner, index) => (
            <Link
              key={banner.alt}
              to={banner.href || '#'}
              className={`absolute inset-0 overflow-hidden transition-opacity duration-[900ms] ease-out ${
                index === homeWaterBannerIndex ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
              }`}
              aria-hidden={index !== homeWaterBannerIndex}
              tabIndex={index === homeWaterBannerIndex ? 0 : -1}
            >
              <picture>
                {banner.mobileImage && <source media="(max-width: 639px)" srcSet={banner.mobileImage} />}
                {banner.image && (
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="relative z-10 h-full w-full object-contain object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                )}
              </picture>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/4 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
            </Link>
          ))}
        </div>

        {HOME_WATER_RESISTANT_BANNERS.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setHomeWaterBannerIndex(
                  (current) => (current - 1 + HOME_WATER_RESISTANT_BANNERS.length) % HOME_WATER_RESISTANT_BANNERS.length
                )
              }
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-2 text-slate-900 shadow-md backdrop-blur transition hover:bg-white hover:scale-105 sm:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setHomeWaterBannerIndex((current) => (current + 1) % HOME_WATER_RESISTANT_BANNERS.length)}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-2 text-slate-900 shadow-md backdrop-blur transition hover:bg-white hover:scale-105 sm:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2 sm:bottom-5">
              {HOME_WATER_RESISTANT_BANNERS.map((banner, index) => (
                <button
                  key={banner.alt}
                  type="button"
                  onClick={() => setHomeWaterBannerIndex(index)}
                  aria-label={`Show banner ${index + 1} of ${HOME_WATER_RESISTANT_BANNERS.length}`}
                  aria-current={index === homeWaterBannerIndex}
                  className={`h-1.5 rounded-full shadow-[0_1px_6px_rgba(0,0,0,0.35)] transition-all duration-300 ${
                    index === homeWaterBannerIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section id="explore-collection" className="relative z-10 bg-white px-5 pb-8 pt-2 sm:px-8 sm:pb-12 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
            Explore Collection
          </h2>

          <div className="home-collection-strip mt-7 flex gap-3 overflow-x-auto pb-2 sm:mt-8 sm:gap-6 lg:grid lg:grid-cols-4 lg:gap-7 lg:overflow-visible">
            {HOME_COLLECTION_CARDS.map((card, index) => (
              <RevealOnScroll key={card.title} delayMs={index * 80} className="shrink-0 lg:shrink">
                <Link
                  to={card.href}
                  className="group flex min-w-[130px] shrink-0 flex-col items-center justify-center px-2 py-2 text-center transition sm:min-w-[160px] lg:min-h-[255px] lg:min-w-0 lg:rounded-xl lg:bg-white lg:px-5 lg:py-6 lg:shadow-[0_10px_22px_rgba(15,23,42,0.1)] lg:hover:-translate-y-1 lg:hover:shadow-[0_18px_34px_rgba(15,23,42,0.16)]"
                >
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="h-24 w-full object-contain transition duration-200 group-hover:scale-[1.04] sm:h-32 lg:h-40"
                    loading="lazy"
                    decoding="async"
                  />
                  <h3 className="mt-3 text-sm font-black leading-tight text-slate-950 sm:text-base lg:mt-5 lg:text-lg">{card.title}</h3>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="models" className="bg-white px-4 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-center justify-between gap-5 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                New Launches
              </h2>
            </div>
            <Link
              to="/new-arrivals"
              className="text-xs font-black uppercase tracking-[0.34em] text-slate-950 underline underline-offset-4 transition hover:text-[#0ea5e9]"
            >
              View All
            </Link>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
              {Array.from({ length: CATALOG_PAGE_SIZE }).map((_, item) => (
                <div key={item} className="flex min-h-[362px] flex-col overflow-hidden rounded-lg border border-slate-100 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.09)] sm:min-h-[436px]">
                  <div className="tfx-shimmer h-48 w-full rounded-md sm:h-64" />
                  <div className="flex flex-1 flex-col gap-2 px-1 pb-1 pt-3">
                    <div className="tfx-shimmer h-4 w-3/4 rounded" />
                    <div className="tfx-shimmer h-3 w-1/2 rounded" />
                    <div className="tfx-shimmer mt-auto h-8 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : catalogProducts.length > 0 ? (
            <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
              {paginatedCatalogProducts.map((product, index) => {
                const catalogHref = getHomeCatalogHref(product);
                const salePrice = Number(product.salePrice || product.price || 0);
                const mrp = salePrice > 0 ? salePrice + 2000 : 0;
                const offerPricing = getAutomaticOfferItemPricing(product);
                const detailLine = getCatalogBullets(product).slice(0, 2).join(' | ');
                const showMegaPriceDrop = isMegaPriceDropBand(product);
                const allPreviewImages = getProductPreviewImages(product);
                const previewImages = allPreviewImages.slice(0, 2);
                const extraPreviewCount = Math.max(0, allPreviewImages.length - previewImages.length);

                return (
                  <RevealOnScroll key={product.id} delayMs={(index % CATALOG_PAGE_SIZE) * 70} className="h-full">
                  <article
                    className="group relative flex h-full min-h-[362px] flex-col overflow-hidden rounded-lg border border-slate-100 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.09)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(15,63,70,0.13)] sm:min-h-[436px]"
                  >
                    {(showMegaPriceDrop || product.isNewArrival || product.isBestSeller || product.isFeatured) && (
                      <div className={`absolute left-2.5 top-2.5 z-10 rounded-r-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white sm:px-3 sm:text-[10px] ${
                        showMegaPriceDrop ? 'bg-[#df0b16] shadow-[0_8px_18px_rgba(223,11,22,0.18)]' : 'bg-[#86d8d2]'
                      }`}>
                        {showMegaPriceDrop ? 'Mega Price Drop' : product.isBestSeller ? 'Best Seller' : product.isNewArrival ? 'New Launch' : 'Featured'}
                      </div>
                    )}
                    <Link to={catalogHref} className="flex h-48 items-center justify-center overflow-hidden rounded-md bg-white sm:h-64">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.035]"
                        loading={catalogPage === 1 && index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                      {previewImages.length > 0 && (
                        <div className="mb-3 flex items-center gap-2">
                          {previewImages.map((image, previewIndex) => (
                            <Link
                              key={`${image}-${previewIndex}`}
                              to={catalogHref}
                              className="grid h-11 w-11 place-items-center rounded-lg border-2 border-rose-300 bg-white p-1 shadow-sm transition hover:border-rose-500"
                              aria-label={`View ${product.name} preview ${previewIndex + 1}`}
                            >
                              <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" aria-hidden="true" />
                            </Link>
                          ))}
                          {extraPreviewCount > 0 && (
                            <Link
                              to={catalogHref}
                              className="grid h-11 w-11 place-items-center rounded-lg border-2 border-rose-300 bg-white text-slate-700 shadow-sm transition hover:border-rose-500 hover:text-rose-500"
                              aria-label={`View ${extraPreviewCount} more ${product.name} previews`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      )}
                      <Link to={catalogHref} className="min-w-0">
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
                      <div className="relative z-20 mt-auto grid shrink-0 grid-cols-2 gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => handleHomeAddToCart(product)}
                          className="relative z-20 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl !bg-[#0a0e17] px-2 text-xs font-black !text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:!bg-[#161b28] active:translate-y-0 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-slate-900/30 focus:ring-offset-2 focus:ring-offset-white sm:text-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHomeBuyNow(product)}
                          className="relative z-20 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl !bg-[#4a0000] px-2 text-xs font-black !text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:!bg-[#630000] active:translate-y-0 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-[#4a0000]/30 focus:ring-offset-2 focus:ring-offset-white sm:text-sm"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </article>
                  </RevealOnScroll>
                );
              })}
            </div>
            {totalCatalogPages > 1 && (
              <nav className="mt-9 flex flex-wrap items-center justify-center gap-2" aria-label="Product catalog pagination">
                <button
                  type="button"
                  onClick={() => changeCatalogPage(catalogPage - 1)}
                  disabled={catalogPage <= 1}
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-black leading-none text-slate-700 shadow-sm transition hover:border-[#0ea5e9] hover:text-[#0369a1] disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Previous product catalog page"
                >
                  ‹
                </button>
                {Array.from({ length: totalCatalogPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => changeCatalogPage(page)}
                    className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition ${
                      catalogPage === page
                        ? 'border-[#0ea5e9] bg-[#0ea5e9] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#0ea5e9] hover:text-[#0369a1]'
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
                  className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-black leading-none text-slate-700 shadow-sm transition hover:border-[#0ea5e9] hover:text-[#0369a1] disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Next product catalog page"
                >
                  ›
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

      <ScrollLinkedBanners />


      <section className="bg-slate-50 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-700">TheFutureX help centre</p>
          <h2 className="mt-3 text-center text-3xl font-black text-slate-950 sm:text-4xl">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-3">
            {homepageFaqs.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <summary className="cursor-pointer list-none pr-8 text-base font-bold text-slate-900 marker:hidden">{item.question}</summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
