import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addOfferLead, getProductSlug } from '../services/backend';
import { WearableFinder } from '../components/WearableFinder';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';
import { getCatalogMrp, isMegaPriceDropProduct } from '../utils/catalogPricing.js';
import { bladelessFanBanner, smartBandBanner, smartRingBanner } from '../utils/collectionBanners';
import { getProductFallbackImage } from '../utils/productImages';
import homeCollectionBandImage from '../assets/images/home-collection-bands-banner.webp';
import homeCollectionRingImage from '../assets/images/home-collection-rings-banner.webp';
import homeCollectionFanImage from '../assets/images/home-collection-fans-banner.webp';
import smartRingsBanner from '../assets/images/smart-rings-main-banner.webp';
import bandHeroVideo from '../assets/images/band-hero-video.mp4';
import bandVideoPoster from '../assets/images/band-mobile-sleep-hero.webp';
import fanHeroVideo from '../assets/images/bladeless-fan-hero-video.mp4';
import fanVideoPoster from '../assets/images/fan-mobile-hero.webp';
import tfxV5BannerOne from '../assets/images/tfx-v5-banner-01.webp';
import tfxV5BannerTwo from '../assets/images/tfx-v5-banner-02.webp';
import { homepageFaqs } from '../services/seo';
import { homeImageSrcSet } from '../utils/responsiveHomeImages';
import './Home.css';


/**
 * Fades and lifts its children into view the first time they scroll into the
 * viewport. Pure CSS transition driven by one IntersectionObserver per
 * instance; disconnects itself after firing once. No images, no libraries.
 * Respects prefers-reduced-motion by rendering fully visible immediately.
 *
 * `variant` swaps the entrance style so back-to-back sections don't all feel
 * identical: `up` (default lift), `scale` (punchy zoom-in), `blur` (soft
 * focus-pull), `left` / `right` (directional slide).
 */
const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: 'up' | 'scale' | 'blur' | 'left' | 'right';
}> = ({ children, className = '', delayMs = 0, variant = 'up' }) => {
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

  const hiddenTransform =
    variant === 'scale'
      ? 'opacity-0 scale-90'
      : variant === 'blur'
        ? 'opacity-0 translate-y-3 blur-md'
        : variant === 'left'
          ? 'opacity-0 -translate-x-8'
          : variant === 'right'
            ? 'opacity-0 translate-x-8'
            : 'opacity-0 translate-y-6';

  const visibleTransform =
    variant === 'scale'
      ? 'opacity-100 scale-100'
      : variant === 'blur'
        ? 'opacity-100 translate-y-0 blur-0'
        : variant === 'left' || variant === 'right'
          ? 'opacity-100 translate-x-0'
          : 'opacity-100 translate-y-0';

  return (
    <div
      ref={nodeRef}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
      className={`transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
        visible ? visibleTransform : hiddenTransform
      } ${className}`}
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
      className={`fixed bottom-5 right-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-white shadow-[0_10px_26px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#0ea5e9] hover:shadow-[0_12px_30px_rgba(14,165,233,0.45)] active:scale-90 sm:bottom-7 sm:right-6 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

const TRUST_STRIP_ITEMS = [
  'IP68 Water Resistant',
  'Heart Rate & SpO2 Tracking',
  'Smart Alerts',
  '7-Day Easy Returns',
  'Cash on Delivery Available',
  '1 Year Warranty',
];

/**
 * Infinitely scrolling trust-badge strip. Duplicates the item list once so
 * the CSS marquee can loop seamlessly at -50% translate.
 */
const TrustMarquee: React.FC = () => {
  const items = [...TRUST_STRIP_ITEMS, ...TRUST_STRIP_ITEMS];
  return (
    <div className="tfx-marquee-mask group relative overflow-hidden border-y border-white/10 bg-slate-950 py-3">
      <div className="tfx-marquee-track group-hover:[animation-play-state:paused] flex w-max items-center gap-10 whitespace-nowrap">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/90 sm:text-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#1ca9a4] shadow-[0_0_10px_2px_rgba(28,169,164,0.7)]" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const CATALOG_PAGE_SIZE = 4;
const HOME_VIDEO_ID = '36BQ2gCuiiE';
const FEATURED_BAND_PRODUCT_PATH = '/product/tfx5-ai-smart-band';
const FEATURED_RING_PRODUCT_PATH = '/product/tfx-display-pro-smart-ring';
const FEATURED_FAN_PRODUCT_PATH = '/product/tfx-advance';
const FEATURED_BANNER_SLIDES = [
  {
    id: 'tfx5',
    tab: 'TFX5 AI Band',
    image: tfxV5BannerOne,
    alt: 'TFX5 AI Smart Band powered by TFX Vital Pro',
    eyebrow: 'AI health tracking',
    title: 'The FutureX AI Smart Band TFX5',
    description: 'A smarter way to understand your everyday wellness.',
    features: ['Heart rate & SpO2 insights', 'Sleep and activity tracking', 'TFX Vital app support'],
  },
  {
    id: 'vital',
    tab: 'TFX Vital App',
    image: tfxV5BannerTwo,
    alt: 'TheFutureX app and TFX5 smart band colour variants',
    eyebrow: 'Connected insights',
    title: 'Made for your everyday rhythm',
    description: 'See your trends, stay consistent, and keep every insight in one place.',
    features: ['Simple companion app', 'Wellness reports', 'Multi-day wearable support'],
  },
] as const;

/**
 * Pinned, scroll-scrubbed banner section for the TFX5 feature banners —
 * matches the Noise "Master Series" scroll-scrub pattern: the section pins
 * to the viewport while the user scrolls through it, and the banners
 * crossfade/scale purely as a function of scroll position (GSAP
 * ScrollTrigger `pin` + `scrub`). There is no autoplay, no click-driven
 * slider, and no timer — the only thing that moves the animation forward
 * is the user's scroll. A small progress-dot rail shows which banner is
 * current; it is a passive indicator, not a control.
 */
const FeaturedBannerTabs: React.FC<{ href: string }> = ({ href }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const wrapperRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReducedMotion(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    const panels = panelRefs.current.filter((panel): panel is HTMLElement => Boolean(panel));
    if (!wrapper || !stage || panels.length < 2 || reducedMotion) return undefined;

    let cancelled = false;
    let revertContext: (() => void) | null = null;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([gsapModule, triggerModule]) => {
      if (cancelled) return;
      const gsap = gsapModule.default;
      gsap.registerPlugin(triggerModule.ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.set(panels[0], { opacity: 1, scale: 1 });
        panels.slice(1).forEach((panel) => gsap.set(panel, { opacity: 0, scale: 1.08 }));

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            pin: stage,
            anticipatePin: 1,
            onUpdate: (self) => {
              const raw = self.progress * (panels.length - 1);
              const nearest = Math.min(panels.length - 1, Math.round(raw));
              setActiveIndex((prev) => (prev === nearest ? prev : nearest));
            },
          },
        });

        panels.forEach((panel, index) => {
          if (index === panels.length - 1) return;
          const next = panels[index + 1];
          tl.to(panel, { opacity: 0, scale: 0.94, ease: 'none' }, index)
            .fromTo(next, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, ease: 'none' }, index);
        });
      }, wrapper);
      revertContext = () => ctx.revert();
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      revertContext?.();
    };
  }, [reducedMotion]);

  const slideCount = FEATURED_BANNER_SLIDES.length;

  return (
    <section
      ref={wrapperRef}
      className="tfx-featured-banner-section relative bg-white"
      style={reducedMotion ? undefined : { height: `${slideCount * 100}vh` }}
      aria-label="Featured TFX5 experiences"
    >
      <div ref={stageRef} className={reducedMotion ? '' : 'h-screen w-full'}>
        <div className="mx-auto flex h-full max-w-[1120px] flex-col justify-center px-4 py-10 sm:py-14">
          <div
            className={`tfx-featured-banner-stage ${reducedMotion ? 'tfx-featured-banner-stage--stacked' : ''}`}
          >
            {FEATURED_BANNER_SLIDES.map((slide, index) => (
              <article
                key={slide.id}
                ref={(node) => { panelRefs.current[index] = node; }}
                aria-hidden={!reducedMotion && index !== activeIndex}
                className={`tfx-featured-banner-panel ${reducedMotion || index === 0 ? 'tfx-featured-banner-panel--static' : ''}`}
              >
                <img src={slide.image} alt={slide.alt} width={1600} height={900} className="tfx-featured-banner-image" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" />
                <div className="tfx-featured-banner-shade" aria-hidden="true" />
                <div className="tfx-featured-banner-copy">
                  <p className="tfx-featured-banner-eyebrow">{slide.eyebrow}</p>
                  <h2>{slide.title}</h2>
                  <p className="tfx-featured-banner-description">{slide.description}</p>
                  <ul>
                    {slide.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <Link to={href} className="tfx-featured-banner-cta">Shop Now</Link>
                </div>
              </article>
            ))}

            {!reducedMotion && (
              <div className="tfx-featured-banner-dots" aria-hidden="true">
                {FEATURED_BANNER_SLIDES.map((slide, index) => (
                  <span key={slide.id} className={`tfx-featured-banner-dot ${index === activeIndex ? 'is-active' : ''}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const HOME_BANNER_SLIDES = [
  {
    title: 'Smart Bands',
    href: '/smart-bands',
    src: bandHeroVideo,
    poster: bandVideoPoster,
    duration: 14000,
    copy: {
      heading: <>{smartBandBanner.titleStart} <span className="text-[#23d4ca] [-webkit-text-fill-color:#23d4ca]">{smartBandBanner.titleAccent}</span> {smartBandBanner.titleEnd}</>,
      subtitle: smartBandBanner.subtitle,
      description: smartBandBanner.description,
      buyHref: `/smart-bands#${smartBandBanner.catalogId}`,
      learnHref: smartBandBanner.featuredHref,
    },
  },
  {
    title: 'Bladeless Fans',
    href: '/bladeless-fan',
    mediaHref: bladelessFanBanner.featuredHref,
    src: fanHeroVideo,
    poster: fanVideoPoster,
    duration: 9000,
    copy: {
      eyebrow: bladelessFanBanner.category,
      heading: bladelessFanBanner.title,
      buyHref: `/bladeless-fan#${bladelessFanBanner.catalogId}`,
      learnHref: `/bladeless-fan#${bladelessFanBanner.overviewId}`,
    },
  },
  {
    title: 'Smart Rings',
    href: '/smart-rings',
    mediaHref: smartRingBanner.featuredHref,
    image: smartRingsBanner,
    alt: smartRingBanner.alt,
    duration: 6500,
  },
];

const HomeBanner: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [touching, setTouching] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const slide = HOME_BANNER_SLIDES[activeIndex];
  const moveSlide = (direction: -1 | 1) => {
    setActiveIndex((index) => (index + direction + HOME_BANNER_SLIDES.length) % HOME_BANNER_SLIDES.length);
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(motionPreference.matches);
    updateMotionPreference();
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.intersectionRatio >= 0.25);
    }, { threshold: 0.25 });

    observer.observe(stage);
    motionPreference.addEventListener('change', updateMotionPreference);
    return () => {
      observer.disconnect();
      motionPreference.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && !reducedMotion) void video.play().catch(() => undefined);
    else video.pause();
  }, [activeIndex, visible, reducedMotion]);

  useEffect(() => {
    if (!visible || reducedMotion || focusWithin || touching) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % HOME_BANNER_SLIDES.length);
    }, slide.duration);
    return () => window.clearTimeout(timer);
  }, [activeIndex, slide.duration, focusWithin, reducedMotion, touching, visible]);

  return (
    <section
      aria-label="Homepage banner"
      aria-roledescription="carousel"
      aria-keyshortcuts="ArrowLeft ArrowRight"
      className={`w-full ${slide.image ? 'bg-[#24170f]' : 'bg-slate-950'}`}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        moveSlide(event.key === 'ArrowRight' ? 1 : -1);
      }}
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) setFocusWithin(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
      }}
    >
      <div
        ref={stageRef}
        className={`relative grid w-full touch-pan-y overflow-hidden sm:aspect-[1983/793] ${
          slide.image ? 'aspect-[1983/793] min-h-0' : 'min-h-[calc(100svh-var(--tfx-sticky-header-height,70px))] sm:min-h-[370px]'
        }`}
        onTouchStart={(event) => {
          suppressClick.current = false;
          const touch = event.touches[0];
          touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
          setTouching(true);
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          setTouching(false);
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
          suppressClick.current = true;
          moveSlide(dx < 0 ? 1 : -1);
        }}
        onTouchCancel={() => {
          touchStart.current = null;
          setTouching(false);
        }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
          }
          suppressClick.current = false;
        }}
      >
        <Link to={slide.mediaHref ?? slide.href} aria-label={`View ${slide.title}`} className="absolute inset-0">
          {slide.image ? (
            <img
              src={slide.image}
              alt={slide.alt}
              width={1983}
              height={793}
              className="absolute inset-0 h-full w-full object-contain"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <video
              key={slide.href}
              ref={videoRef}
              src={slide.src}
              poster={slide.poster}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-[0.84] contrast-105"
              preload="none"
              muted
              playsInline
            />
          )}
        </Link>
        {slide.copy && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/10 bg-gradient-to-t from-black/75 via-black/42 to-black/15 sm:bg-gradient-to-r sm:from-black/75 sm:via-black/42 sm:to-black/15" />
            <div className="pointer-events-none relative mx-auto flex w-full max-w-7xl items-end px-4 pb-12 pt-5 sm:items-center sm:px-8 sm:py-10 lg:px-10">
              <div className="max-w-2xl [text-shadow:0_1px_5px_rgba(0,0,0,0.65)]">
                {slide.copy.eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] !text-[#67e8f9] [-webkit-text-fill-color:#67e8f9] sm:mb-4">{slide.copy.eyebrow}</p>}
                <h2 className="font-display font-black !text-white [-webkit-text-fill-color:#fff]">{slide.copy.heading}</h2>
                {slide.copy.subtitle && <p className="mt-2 text-sm font-extrabold !text-white [-webkit-text-fill-color:#fff] sm:mt-4 sm:text-xl">{slide.copy.subtitle}</p>}
                {slide.copy.description && <p className="mt-2 text-sm leading-relaxed !text-white [-webkit-text-fill-color:#fff] sm:mt-3 sm:text-lg">{slide.copy.description}</p>}
                <div className="pointer-events-auto mt-4 flex w-fit max-w-full flex-wrap gap-2 sm:mt-6 sm:gap-4">
                  <Link to={slide.copy.buyHref} className="site-hero-cta site-hero-cta-primary !min-h-11">Buy Now</Link>
                  <Link to={slide.copy.learnHref} className="site-hero-cta site-hero-cta-secondary !min-h-11">Learn More</Link>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="home-hero-arrows" aria-label="Browse homepage banners">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              moveSlide(-1);
            }}
            aria-label={`Previous banner, currently ${slide.title}`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              moveSlide(1);
            }}
            aria-label={`Next banner, currently ${slide.title}`}
          >
            ›
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-4 z-[12] flex justify-center gap-2" aria-label="Homepage banner slides">
          {HOME_BANNER_SLIDES.map((banner, index) => (
            <button
              key={banner.title}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveIndex(index);
              }}
              className={`h-2.5 rounded-full border border-white/70 shadow-sm transition ${activeIndex === index ? 'w-7 bg-white' : 'w-2.5 bg-white/55 hover:bg-white'}`}
              aria-label={`Show ${banner.title} banner`}
              aria-current={activeIndex === index ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const HOME_COLLECTION_CARDS = [
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

const INFLUENCER_SHORT_IDS = ['dr17QaEDStQ', 'sbPYLBEs8U0', 'lA7SflWKLZ4', 'FRBg0PLIpPw', 'xvDZla1QJn4', 'kySkO8x-prM', '36BQ2gCuiiE', 'Iezur6rF2j4', 'QA3INBbj52Y', 'OvUfkHbIDN0', '6YTVSq_zM6E'];

const InfluencerVideoCard: React.FC<{ videoId: string; index: number }> = ({ videoId, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const shouldAutoplay = index === 0 || isHovered || isSoundOn;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${shouldAutoplay ? `autoplay=1&mute=${isSoundOn ? 0 : 1}&loop=1&playlist=${videoId}&` : ''}playsinline=1&controls=1&rel=0&modestbranding=1`;

  return (
    <article
      className="group w-[72vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_42px_rgba(15,23,42,0.24)] sm:w-[240px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <iframe
        className="block aspect-[9/16] w-full border-0 bg-slate-950"
        src={embedUrl}
        title={`TheFutureX creator video ${index + 1}`}
        loading={index < 2 ? 'eager' : 'lazy'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <button type="button" onClick={() => setIsSoundOn((enabled) => !enabled)} className="flex min-h-10 w-full items-center justify-center border-t border-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/10">
        <span className="mr-1.5" aria-hidden="true">{isSoundOn ? '🔊' : '🔇'}</span>{isSoundOn ? 'Sound on' : 'Play with sound'}
      </button>
      <a href={`https://www.youtube.com/shorts/${videoId}`} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center justify-center px-3 text-xs font-bold text-white transition hover:bg-white/10">Watch on YouTube <span className="ml-1" aria-hidden="true">↗</span></a>
    </article>
  );
};

const InfluencerVideos: React.FC = () => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const autoScrollTimerRef = useRef<number | null>(null);
  const autoScrollDirectionRef = useRef<-1 | 1 | null>(null);
  const stopAutoScroll = useCallback(() => {
    autoScrollDirectionRef.current = null;
    if (autoScrollTimerRef.current !== null) window.clearInterval(autoScrollTimerRef.current);
    autoScrollTimerRef.current = null;
  }, []);
  const startAutoScroll = useCallback((direction: -1 | 1) => {
    if (autoScrollDirectionRef.current === direction) return;
    stopAutoScroll();
    autoScrollDirectionRef.current = direction;
    const crawl = () => {
      const rail = railRef.current;
      const activeDirection = autoScrollDirectionRef.current;
      if (!rail || !activeDirection) return;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const remaining = activeDirection > 0 ? maxScroll - rail.scrollLeft : rail.scrollLeft;
      if (remaining <= 2) {
        stopAutoScroll();
        return;
      }
      rail.scrollBy({ left: activeDirection * Math.min(220, remaining), behavior: 'smooth' });
    };
    crawl();
    autoScrollTimerRef.current = window.setInterval(crawl, 650);
  }, [stopAutoScroll]);
  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  return (
  <section className="bg-[#f1f5f9] py-10 sm:py-14" aria-labelledby="creator-videos-title">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087481]">Featured by creators</p>
          <h2 id="creator-videos-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">See TheFutureX in action</h2>
        </div>
        <a href="https://www.youtube.com/@TheFutureXdotin" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:border-[#087481] hover:text-[#087481]">Visit our YouTube channel <span className="ml-1" aria-hidden="true">↗</span></a>
      </div>
      <p className="mb-3 text-sm font-medium text-slate-600">Scroll sideways to watch more creator videos.</p>
      <div className="group/creator relative">
        <div ref={railRef} className="flex snap-x gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {INFLUENCER_SHORT_IDS.map((videoId, index) => (
          <InfluencerVideoCard key={videoId} videoId={videoId} index={index} />
        ))}
        </div>
        <div aria-hidden="true" onMouseEnter={() => startAutoScroll(-1)} onMouseLeave={stopAutoScroll} className="creator-rail-edge absolute inset-y-0 left-0 z-10 w-12 cursor-w-resize bg-gradient-to-r from-[#f1f5f9] via-[#f1f5f9]/75 to-transparent opacity-0 transition group-hover/creator:opacity-100" />
        <div aria-hidden="true" onMouseEnter={() => startAutoScroll(1)} onMouseLeave={stopAutoScroll} className="creator-rail-edge absolute inset-y-0 right-0 z-10 w-16 cursor-e-resize bg-gradient-to-l from-[#f1f5f9] via-[#f1f5f9]/75 to-transparent opacity-0 transition group-hover/creator:opacity-100" />
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

const isMegaPriceDropBand = isMegaPriceDropProduct;

const getHomeCatalogHref = (product: Product): string => {
  return `/product/${getProductSlug(product)}`;
};

const getProductImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || getProductFallbackImage(product);

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

/** Up to 4 round color-swatch dots, cropped from each color variant's image. */
const getColorSwatches = (product: Product): { image: string; label: string }[] => {
  const colors = product.colors || [];
  return colors
    .filter((color) => color.images?.[0])
    .slice(0, 4)
    .map((color, index) => ({ image: color.images![0] as string, label: `Color ${index + 1}` }));
};

/**
 * Colored feature strip that sits above the Add To Cart button, e.g.
 * "BT Calling" (yellow), "GPS Tracking" (green), "Real-Time GPS Tracking"
 * (orange). Picks the most relevant keyword out of the product's own
 * features/category text so it works without a dedicated backend field.
 */
const HomeCatalogProductImage: React.FC<{ product: Product; loading: 'eager' | 'lazy' }> = ({ product, loading }) => {
  const [hovering, setHovering] = useState(false);
  const [variantIndex, setVariantIndex] = useState(0);
  const isBand = /smart\s*bands?/i.test(product.category || '');
  const variantImages = isBand ? (product.colors || []).map((color) => color.images?.[0]).filter((image): image is string => Boolean(image)) : [];

  useEffect(() => {
    if (!hovering || variantImages.length < 2) return;
    const timer = window.setInterval(() => setVariantIndex((index) => (index + 1) % variantImages.length), 900);
    return () => window.clearInterval(timer);
  }, [hovering, variantImages.length]);

  return (
    <Link to={getHomeCatalogHref(product)} className="mx-auto block w-[85%] max-w-[620px]" onMouseEnter={() => setHovering(true)} onMouseLeave={() => { setHovering(false); setVariantIndex(0); }}>
      <img src={variantImages.length > 1 ? variantImages[variantIndex] : getProductImage(product)} alt={product.name} width={800} height={800} className="block h-auto w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading={loading} decoding="async" onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = 'true';
        image.src = getProductFallbackImage(product);
      }} />
    </Link>
  );
};
const getFeatureStrip = (product: Product): { label: string; className: string } | null => {
  const haystack = `${product.category || ''} ${(product.features || []).join(' ')} ${product.name || ''}`.toLowerCase();

  if (/\bgps\b/.test(haystack) && /real[\s-]?time/.test(haystack)) {
    return { label: 'Real-Time GPS Tracking', className: 'bg-[#f59e0b] text-slate-950' };
  }
  if (/\bgps\b/.test(haystack)) {
    return { label: 'GPS Tracking', className: 'bg-emerald-400 text-slate-950' };
  }
  if (/\b(bt|bluetooth)\b.*call|call.*\b(bt|bluetooth)\b|bluetooth calling/.test(haystack)) {
    return { label: 'BT Calling', className: 'bg-amber-400 text-slate-950' };
  }
  if (/voice|video/.test(haystack)) {
    return { label: 'Voice & Video Calls', className: 'bg-sky-400 text-slate-950' };
  }
  if (/\bamoled\b/.test(haystack)) {
    return { label: 'AMOLED Display', className: 'bg-violet-400 text-white' };
  }

  return null;
};

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showSmartBandReel, setShowSmartBandReel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [offerName, setOfferName] = useState('');
  const [offerPhone, setOfferPhone] = useState('');
  const [offerConsent, setOfferConsent] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerUnlocked, setOfferUnlocked] = useState(false);
  const [copiedOfferCode, setCopiedOfferCode] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!showSmartBandReel) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSmartBandReel(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showSmartBandReel]);

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
    if (!showOfferPopup) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const dialog = document.getElementById('first-order-offer');
    const elements = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, input, a[href]') || []).filter(element => !element.hasAttribute('disabled'));
    elements()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowOfferPopup(false);
      if (event.key === 'Tab') {
        const focusable = elements();
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [showOfferPopup]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

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

    if (offerSaving) return;
    setOfferSaving(true);
    try {
      await addOfferLead({
      name: offerName.trim(),
      phone: normalizedPhone,
      source: 'home_popup',
      couponCodes: [],
      message: 'Direct offer: 10% off fans, 5% off rings and eligible bands',
      marketingConsent: true,
      consentAt: new Date().toISOString(),
    });
    window.localStorage.setItem('tfx_surprise_coupon_phone', normalizedPhone);
    window.localStorage.setItem('tfx_surprise_coupon_name', offerName.trim());
    setOfferMessage('');
    setOfferUnlocked(true);
    } catch { setOfferMessage('Unable to save your details. Please try again.'); }
    finally { setOfferSaving(false); }
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
    // Keep the homepage launch spotlight focused on the current TFX5 offer.
    return products.filter(isMegaPriceDropBand).slice(0, 1);
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
      {showSmartBandReel && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="TheFutureX smart band pairing guide"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSmartBandReel(false);
          }}
        >
          <div className="relative my-auto flex max-w-[calc(100vw-1.5rem)] shrink-0 flex-col overflow-hidden rounded-2xl bg-black shadow-[0_24px_90px_rgba(0,0,0,0.55)]" style={{ width: 'min(calc(100vw - 1.5rem), max(200px, calc((100svh - 8rem) * 9 / 16)), 438px)' }}>
            <button
              type="button"
              onClick={() => setShowSmartBandReel(false)}
              aria-label="Close video"
              className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/65 text-2xl leading-none text-white ring-1 ring-white/30 transition hover:bg-black"
            >
              ×
            </button>
            <iframe
              className="block aspect-[9/16] w-full border-0 bg-black"
              src={`https://www.youtube-nocookie.com/embed/${HOME_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${HOME_VIDEO_ID}&playsinline=1&controls=1&rel=0`}
              title="TheFutureX Smart Band: Bluetooth pairing guide"
              loading="eager"
              width={438}
              height={778}
              style={{ height: 'auto', aspectRatio: '9 / 16' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <div className="flex flex-col bg-slate-950 px-4 py-2 text-center text-white">
              <Link to="/product/tfx-smart-band" className="flex min-h-11 items-center justify-center text-sm font-bold text-white transition hover:text-amber-200">
                Shop the TFX Smart Band <span className="ml-1" aria-hidden="true">→</span>
              </Link>
              <a href={`https://www.youtube.com/shorts/${HOME_VIDEO_ID}`} target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center justify-center text-xs text-white/80 underline underline-offset-4 hover:text-white">
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}


      <ScrollToTopButton />

      {showOfferPopup && createPortal((
        <div
          id="first-order-offer"
          role="dialog"
          aria-modal="true"
          aria-label="First order offer"
          className="fixed inset-0 flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/85 px-3 py-5 sm:px-4 sm:py-8"
          style={{ zIndex: 2147483647 }}
        >
          <div
            className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[390px] overflow-y-auto rounded-2xl bg-[#050505] px-4 pb-5 pt-8 text-center shadow-2xl ring-1 ring-white/10 sm:max-w-[460px] sm:px-8 sm:pb-8 sm:pt-9"
          >
            <button
              type="button"
              onClick={() => setShowOfferPopup(false)}
              className="absolute right-2 top-2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl font-black leading-none text-white transition hover:bg-white/15 hover:text-[#df0b16] focus:outline-none focus:ring-2 focus:ring-[#df0b16] sm:right-3 sm:top-3"
              aria-label="Close offer"
            >
              {'\u00d7'}
            </button>

            <img src="/images/tfx-offer-logo.png" alt="TheFutureX" width={512} height={256} className="mx-auto h-20 w-auto max-w-[70%] object-contain sm:h-32 sm:max-w-[78%]" />

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
                aria-label="Your name"
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
                  aria-label="WhatsApp mobile number"
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
                disabled={offerSaving}
                className="mt-2 h-11 w-full rounded-xl bg-[#df0b16] text-sm font-black text-white shadow-[0_16px_28px_rgba(223,11,22,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#c70712] hover:shadow-[0_20px_34px_rgba(223,11,22,0.32)] active:translate-y-0 active:scale-[0.97] sm:h-12 sm:text-base"
              >
                {offerSaving ? 'Saving…' : 'Unlock Offer Now'}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      ), document.body)}

      <h1 className="sr-only">TheFutureX Smart Wearables and Connected Lifestyle Products</h1>
      <HomeBanner />

      <section id="explore-collection" className="relative z-10 bg-[#fbfbfc] px-0 pb-4 pt-6 sm:pb-12 sm:pt-12">
        <div className="mx-auto w-full max-w-7xl">
          <RevealOnScroll variant="blur">
            <h2 className="mx-auto block w-fit rounded-xl border-2 border-slate-950 bg-slate-950 px-5 py-2 text-center font-display text-3xl font-black leading-tight tracking-tight !text-white [-webkit-text-fill-color:#fff] shadow-[0_5px_14px_rgba(15,23,42,0.15)] sm:text-5xl">
              Explore Collection
            </h2>
            <div className="tfx-divider mx-auto mt-3 h-1 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#df0b16]" />
          </RevealOnScroll>

          <div className="mt-6 grid w-full grid-cols-1 overflow-hidden bg-white sm:mt-8">
            {HOME_COLLECTION_CARDS.map((card, index) => (
              <RevealOnScroll key={card.title} delayMs={index * 90} variant="up" className="w-full min-w-0 border-b border-slate-200 last:border-b-0">
                <Link
                  to={card.href}
                  className="collection-card group flex w-full flex-col items-center overflow-hidden bg-white text-center transition-colors duration-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                >
                  <h3 className="flex min-h-14 w-full items-center justify-center px-3 py-3 text-base font-extrabold tracking-wide text-slate-950 sm:min-h-16 sm:text-xl lg:text-2xl">
                    {card.title}
                  </h3>
                  <div className="relative flex aspect-[2/1] w-full items-center justify-center overflow-hidden bg-white">
                    <img
                      src={card.image}
                      srcSet={homeImageSrcSet(['home-collection-bands-banner', 'home-collection-rings-banner', 'home-collection-fans-banner'][index])}
                      sizes="(min-width: 1280px) 1280px, 100vw"
                      alt={card.alt}
                      width={800}
                      height={400}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="models" className="bg-white px-4 pb-8 pt-5 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div
            className="relative left-1/2 mb-5 flex w-screen max-w-none -translate-x-1/2 flex-col items-center justify-between gap-2 rounded-none bg-slate-950 px-5 pb-4 pt-7 text-center text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] sm:mb-8 sm:gap-3 sm:px-7 sm:pb-5 sm:pt-8"
            style={{ border: '2px solid #111827' }}
          >
            <RevealOnScroll variant="left">
              <h2 className="font-display text-3xl font-black leading-tight text-white [-webkit-text-fill-color:#fff] sm:text-4xl">
                New Launches
              </h2>
              <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-gradient-to-r from-[#fbbf24] via-[#f97316] to-[#dc2626]" />
            </RevealOnScroll>
            <Link
              to="/new-arrivals"
              style={{ color: '#020617', WebkitTextFillColor: '#020617', background: '#fff', borderColor: '#fff' }}
              className="group inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-[0_3px_8px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:bg-amber-100"
            >
              <span>View All</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-1">
                <polyline points="9 18 15 12 9 6" />
              </svg>
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
            <div className="mx-auto grid max-w-xl grid-cols-1 gap-5">
              {Array.from({ length: 1 }).map((_, item) => (
                <div key={item} className="flex min-h-[460px] flex-col overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.07)]">
                  <div className="tfx-shimmer aspect-[4/3] w-full rounded-xl" />
                  <div className="flex flex-1 flex-col gap-2 px-1 pb-1 pt-4">
                    <div className="tfx-shimmer h-4 w-3/4 rounded" />
                    <div className="tfx-shimmer h-3 w-1/2 rounded" />
                    <div className="tfx-shimmer mt-auto h-8 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : catalogProducts.length > 0 ? (
            <>
            <div className={`phone-product-grid mx-auto grid gap-5 ${paginatedCatalogProducts.length === 1 ? 'phone-product-grid--single max-w-xl grid-cols-1' : 'max-w-7xl grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
              {paginatedCatalogProducts.map((product, index) => {
                const catalogHref = getHomeCatalogHref(product);
                const salePrice = Number(product.salePrice || product.price || 0);
                const mrp = getCatalogMrp(product);
                const offerPricing = getAutomaticOfferItemPricing(product);
                const detailLine = getCatalogBullets(product).slice(0, 2).join(' | ');
                const showMegaPriceDrop = isMegaPriceDropBand(product);
                const swatches = getColorSwatches(product);
                const extraSwatchCount = Math.max(0, (product.colors?.length || 0) - swatches.length);
                const featureStrip = getFeatureStrip(product);
                const hasDiscount = offerPricing.rate > 0 || mrp > salePrice;
                const strikeThroughPrice = mrp;
                const discountLabel =
                  offerPricing.rate > 0
                    ? offerPricing.rateLabel
                    : mrp > 0 && salePrice > 0
                      ? `${Math.round(((mrp - salePrice) / mrp) * 100)}%`
                      : '';

                // Give the strongest promotion priority over launch and featured tags.
                const topLeftTag = showMegaPriceDrop
                  ? { label: 'MEGA PRICE DROP', className: 'tfx-badge-pulse bg-[#540000] shadow-[0_4px_14px_rgba(84,0,0,0.3)]' }
                  : hasDiscount && discountLabel
                    ? { label: `Extra ${discountLabel} Off`, className: 'bg-emerald-600' }
                    : product.isNewArrival
                      ? { label: 'Just Launched', className: 'bg-slate-950' }
                      : product.isFeatured
                        ? { label: 'Featured', className: 'bg-[#86d8d2]' }
                        : null;

                return (
                  <RevealOnScroll key={product.id} delayMs={(index % CATALOG_PAGE_SIZE) * 70} variant="up" className="h-full">
                    <article className="home-catalog-card group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.07)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_44px_rgba(15,63,70,0.13)]">
                      <div className="home-catalog-media relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-white to-[#f1f5f7]">
                        {topLeftTag && (
                          <span className={`home-catalog-badge absolute left-3 top-3 z-10 inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white ${topLeftTag.className}`}>
                            {topLeftTag.label}
                          </span>
                        )}
                        <HomeCatalogProductImage product={product} loading="lazy" />
                      </div>
                      <div className="home-catalog-body flex flex-1 flex-col px-2 pb-2 pt-4">
                        <Link to={catalogHref} className="home-catalog-title line-clamp-2 min-h-12 text-base font-bold leading-6 text-slate-950 transition hover:text-[#1ca9a4]">
                          {product.name}
                        </Link>
                        <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{detailLine}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="home-catalog-price text-xl font-black leading-none tracking-tight text-slate-950">{formatInrAmount(offerPricing.unitOfferPrice)}</span>
                          {strikeThroughPrice > offerPricing.unitOfferPrice && (
                            <span className="text-sm font-semibold leading-none text-slate-400 line-through">{formatInrAmount(strikeThroughPrice)}</span>
                          )}
                          {discountLabel && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">{discountLabel} off</span>}
                        </div>
                        {swatches.length > 0 && (
                          <div className="mt-3 flex items-center gap-1.5">
                            {swatches.map((swatch, swatchIndex) => (
                              <span key={`${swatch.label}-${swatchIndex}`} className="h-5 w-5 overflow-hidden rounded-full border border-slate-200 bg-white" title={swatch.label}>
                                <img src={swatch.image} alt={swatch.label} width={40} height={40} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                              </span>
                            ))}
                            {extraSwatchCount > 0 && <span className="text-[10px] font-bold text-slate-500">+{extraSwatchCount}</span>}
                          </div>
                        )}
                        {featureStrip && (
                          <p className={`mt-3 rounded-lg py-2 text-center text-[10px] font-black uppercase tracking-wide ${featureStrip.className}`}>
                            {featureStrip.label}
                          </p>
                        )}
                        <div className="product-card-actions mt-auto grid grid-cols-2 gap-2 pt-4">
                          <button type="button" onClick={() => handleHomeAddToCart(product)} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-900 bg-white px-2 text-xs font-extrabold text-slate-900 transition hover:bg-slate-100 sm:text-sm">
                            Add to Cart
                          </button>
                          <button type="button" onClick={() => handleHomeBuyNow(product)} className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#a9812f] to-[#c29b52] px-2 text-xs font-extrabold text-white shadow-sm transition hover:brightness-105 sm:text-sm">
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

      <InfluencerVideos />

      <WearableFinder />
      <section className="store-guides-section px-4 text-slate-950" aria-labelledby="home-guides-heading">
        <div className="store-guides-card">
          <div>
            <p className="store-section-eyebrow">TheFutureX journal</p>
            <h2 id="home-guides-heading" className="store-section-heading">Find the right fit for your everyday life</h2>
            <p className="store-section-description">Buying guides, product comparisons and practical tips, all in one place.</p>
          </div>
          <Link to="/blog" className="store-guides-link">Read our guides <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="store-home-faq bg-slate-50 px-4 py-14 sm:py-20" aria-labelledby="home-faq-heading">
        <div className="mx-auto max-w-4xl">
          <RevealOnScroll variant="blur">
            <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-700">TheFutureX help centre</p>
            <h2 id="home-faq-heading" className="store-section-heading mt-3 text-center">Frequently asked questions</h2>
            <p className="store-section-description text-center">A little help with choosing, ordering and caring for your product.</p>
            <div className="tfx-divider mx-auto mt-3 h-1 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#df0b16]" />
          </RevealOnScroll>
          <div className="mt-8 space-y-3">
            {homepageFaqs.map((item, index) => (
              <RevealOnScroll key={item.question} delayMs={Math.min(index, 6) * 60} variant="up">
                <details className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-300 open:border-[#0ea5e9]/40 open:shadow-[0_14px_30px_rgba(14,165,233,0.12)] hover:border-slate-300">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-bold text-slate-900 marker:hidden">
                    {item.question}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#0ea5e9] transition-transform duration-300 group-open:rotate-45">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{item.answer}</p>
                </details>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
