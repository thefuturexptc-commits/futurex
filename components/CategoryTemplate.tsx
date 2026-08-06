import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductSlug, getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';
import { ProductComparisonSection } from './ProductComparisonSection';
import { isSameCollection } from '../utils/productCollections';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ShowcaseImage {
  src: string;
  alt: string;
}

interface CategoryTemplateProps {
  category: string;
  title: string;
  subtitle: string;
  heroGradient: string;
  heroImage: string;
  mobileHeroImage?: string;
  heroVideo?: string;
  heroBackgroundImage?: string;
  heroOverlayClassName?: string;
  heroTintClassName?: string;
  heroSideOverlayClassName?: string;
  showHeroGridPattern?: boolean;
  heroAsFullBanner?: boolean;
  heroHref?: string;
  overviewImage?: string;
  accentColor: string;
  features: Feature[];
  showcaseImages?: ShowcaseImage[];
  autoSlideModels?: boolean;
  modelCardClassName?: string;
  modelCardSkeletonClassName?: string;
  modelCardImageAspectClassName?: string;
  catalogLayout?: 'grid' | 'horizontal';
  showComparisonSection?: boolean;
}

const CategoryTemplateComponent: React.FC<CategoryTemplateProps> = ({
  category,
  title,
  subtitle,
  heroImage,
  mobileHeroImage,
  heroVideo,
  heroAsFullBanner = false,
  heroHref,
  overviewImage,
  features,
  showcaseImages = [],
  modelCardSkeletonClassName,
  modelCardImageAspectClassName,
  catalogLayout = 'grid',
  showComparisonSection = true,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sortBy, setSortBy] = useState('featured');
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
        setProducts(data.filter((product) => isSameCollection(product.category, category)));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load products right now.');
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
    const getEffectivePrice = (product: Product) => Number(product.salePrice || product.price || 0);

    if (sortBy === 'low-high') {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      result.sort((a, b) => {
        const aScore = Number(Boolean(a.isNewArrival || a.isFeatured)) + Number(Boolean(a.isBestSeller));
        const bScore = Number(Boolean(b.isNewArrival || b.isFeatured)) + Number(Boolean(b.isBestSeller));
        return bScore - aScore || a.name.localeCompare(b.name);
      });
    }

    return result;
  }, [products, sortBy]);

  const skeletonClassName = modelCardSkeletonClassName || 'h-[430px]';
  const imageAspectClassName = modelCardImageAspectClassName || 'aspect-[4/3]';
  const useVideoBanner = Boolean(heroAsFullBanner && heroVideo);
  const showHorizontalCatalog = catalogLayout === 'horizontal';
  const isFanCatalog = isSameCollection(category, 'Smart Fans');
  const promoBadgeLabel = isFanCatalog ? '10% OFF' : '';
  const visibleCatalogProducts = filteredProducts;

  const getProductImage = (product: Product): string =>
    product.colors?.[0]?.images?.[0] || product.images?.[0] || overviewImage || heroImage;

  const getProductPreviewImages = (product: Product): string[] => {
    const colorImages = (product.colors || []).map((color) => color.images?.[0]).filter(Boolean);
    const variantImages = (product.variants || []).map((variant) => variant.images?.[0]).filter(Boolean);
    const productImages = (product.images || []).filter(Boolean);
    const images = colorImages.length ? colorImages : variantImages.length ? variantImages : productImages;
    return Array.from(new Set(images));
  };

  const getProductLine = (product: Product): string => {
    const featureLine = product.features?.filter(Boolean).slice(0, 2).join(' | ');
    if (featureLine) return featureLine;

    const specLine = Object.values(product.specs || {}).filter(Boolean).slice(0, 2).join(' | ');
    if (specLine) return specLine;

    return product.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Smart comfort for modern spaces';
  };

  const getProductStock = (product: Product): number => {
    const firstColor = product.colors?.[0];
    if (firstColor) return Number(firstColor.stock || 0) - Number(firstColor.reservedStock || 0);
    return Number(product.stock || 0) - Number(product.reservedStock || 0);
  };

  const handleAddToCart = (product: Product) => {
    if (getProductStock(product) <= 0) return;
    addToCart(product, 1);
  };

  const handleBuyNow = (product: Product) => {
    if (getProductStock(product) <= 0) return;
    addToCart(product, 1, { openCart: false });
    navigate(user ? '/checkout' : '/login?redirect=%2Fcheckout');
  };

  const scrollCatalogBy = (direction: -1 | 1) => {
    const scroller = catalogScrollerRef.current;
    if (!scroller) return;
    const firstCard = scroller.querySelector<HTMLElement>('article');
    const cardStep = (firstCard?.offsetWidth || scroller.clientWidth * 0.82) + 20;
    scroller.scrollBy({ left: direction * cardStep, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showHorizontalCatalog || loading || filteredProducts.length < 2) return;
    const scroller = catalogScrollerRef.current;
    if (!scroller) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const scrollNextProduct = () => {
      if (document.hidden) return;
      const firstCard = scroller.querySelector<HTMLElement>('article');
      const cardStep = (firstCard?.offsetWidth || scroller.clientWidth * 0.82) + 20;
      const isNearEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - cardStep * 0.5;

      scroller.scrollTo({
        left: isNearEnd ? 0 : scroller.scrollLeft + cardStep,
        behavior: 'smooth',
      });
    };

    const intervalId = window.setInterval(scrollNextProduct, 3400);
    return () => window.clearInterval(intervalId);
  }, [filteredProducts.length, loading, showHorizontalCatalog]);

  return (
    <div className="category-crescent-page min-h-screen bg-white text-slate-950 transition-colors duration-500">
      <section
        className={`category-template-hero relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-slate-950 text-white ${
          useVideoBanner ? 'min-h-[360px] sm:min-h-[500px]' : 'min-h-[520px] sm:min-h-[620px]'
        }`}
      >
        {heroAsFullBanner && (
          <>
            {heroVideo ? (
              <div className="category-template-video-frame absolute inset-x-0 top-0 h-[360px] w-full overflow-hidden bg-slate-950 sm:h-[500px]">
                <video
                  src={heroVideo}
                  className="site-hero-media absolute inset-0 h-full w-full object-cover object-center"
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
                  aria-label={`${category} video banner`}
                />
              </div>
            ) : (
              <img
                src={heroImage}
                alt=""
                className={`site-hero-media absolute inset-0 h-full w-full object-contain object-center sm:object-cover sm:object-[center_58%] ${mobileHeroImage ? 'hidden sm:block' : ''}`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                aria-hidden="true"
              />
            )}
            {!heroVideo && mobileHeroImage && (
              <img
                src={mobileHeroImage}
                alt=""
                className="site-hero-media absolute inset-0 h-full w-full object-contain object-center sm:hidden"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                aria-hidden="true"
              />
            )}
          </>
        )}
        <div className={`absolute inset-0 ${
          useVideoBanner
            ? 'bg-[linear-gradient(90deg,rgba(2,6,23,0.52),rgba(2,6,23,0.18)_42%,rgba(2,6,23,0.04)_100%)]'
            : 'bg-[linear-gradient(180deg,rgba(2,6,23,0.22),rgba(2,6,23,0.32)_45%,rgba(2,6,23,0.76))] sm:bg-[linear-gradient(90deg,rgba(2,6,23,0.72),rgba(2,6,23,0.38),rgba(2,6,23,0.08))]'
        }`} aria-hidden="true" />
        {heroHref && (
          <Link to={heroHref} className="absolute inset-0 z-[5]" aria-label={`View featured ${category} product`}>
            <span className="sr-only">View featured {category} product</span>
          </Link>
        )}
        <div
          className={`relative z-10 mx-auto grid max-w-7xl items-end gap-8 px-4 pb-6 pt-28 sm:items-center sm:px-8 sm:pb-12 sm:pt-24 lg:px-10 ${
            useVideoBanner ? 'min-h-[360px] sm:min-h-[500px]' : 'min-h-[520px] sm:min-h-[620px]'
          } ${heroAsFullBanner ? 'lg:grid-cols-[0.8fr_1.2fr]' : 'lg:grid-cols-[0.95fr_1.05fr]'}`}
        >
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#67e8f9] drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)] sm:text-xs">{category}</p>
            <h1 className="max-w-3xl font-display text-3xl font-black leading-[1.04] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.62)] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-white/92 drop-shadow-[0_2px_14px_rgba(0,0,0,0.62)] sm:text-lg sm:leading-8">{subtitle}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <a href="#catalog" className="site-hero-cta site-hero-cta-primary">
                Buy Now
              </a>
              <a href="#overview" className="site-hero-cta site-hero-cta-secondary">
                Learn More
              </a>
            </div>
          </div>
          <div className={`flex justify-center lg:justify-end ${heroAsFullBanner ? 'hidden' : ''}`}>
            {heroVideo ? (
              <video
                src={heroVideo}
                className="max-h-[430px] w-full max-w-[560px] object-contain drop-shadow-[0_30px_90px_rgba(34,211,238,0.18)]"
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
                aria-label={`${category} animation`}
              />
            ) : (
              <img
                src={heroImage}
                alt={category}
                className="max-h-[430px] w-full max-w-[560px] object-contain drop-shadow-[0_30px_90px_rgba(34,211,238,0.18)]"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            )}
          </div>
        </div>
      </section>

      <section id="overview" className="bg-white px-5 py-12 text-slate-950 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">
            Product Line Overview
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="overflow-hidden rounded-[1.5rem] bg-[#eff8f8] sm:rounded-[2rem]">
              <img src={overviewImage || heroImage} alt={`${category} overview`} className="h-full min-h-[260px] w-full object-contain p-6 sm:min-h-[380px] sm:p-8" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">Product Overview</p>
              <h3 className="mt-4 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                Premium {category} for Everyday Confidence
              </h3>
              <p className="mt-5 text-lg font-bold leading-8 text-slate-950 sm:text-xl">Smart hardware, clean design, and useful data in one refined experience.</p>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">{subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-[#f2fbfb] px-4 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {loadError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="mb-8 flex flex-col items-center justify-between gap-5 text-center lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">{category}</p>
              <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-6xl">Product Catalog</h2>
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-950 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`rounded-[1.5rem] bg-white shadow-sm ${skeletonClassName} animate-pulse max-sm:h-[330px]`} />
              ))}
            </div>
          ) : visibleCatalogProducts.length > 0 ? (
            showHorizontalCatalog ? (
              <div className="relative">
                {visibleCatalogProducts.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollCatalogBy(-1)}
                      className="absolute left-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-2xl font-black leading-none text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-[#0ea5e9] hover:text-white sm:-left-5"
                      aria-label="Previous products"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCatalogBy(1)}
                      className="absolute right-1 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-2xl font-black leading-none text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition hover:bg-[#0ea5e9] hover:text-white sm:-right-5"
                      aria-label="Next products"
                    >
                      ›
                    </button>
                  </>
                )}
                <div ref={catalogScrollerRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {visibleCatalogProducts.map((product, index) => {
                  const salePrice = Number(product.salePrice || product.price || 0);
                  const mrp = salePrice > 0 ? salePrice + 2000 : 0;
                  const offerPricing = getAutomaticOfferItemPricing(product);
                  const canAdd = getProductStock(product) > 0;
                  const allPreviewImages = getProductPreviewImages(product);
                  const previewImages = allPreviewImages.slice(0, 2);
                  const extraPreviewCount = Math.max(0, allPreviewImages.length - previewImages.length);

                  return (
                    <article
                      key={product.id}
                      className={`group relative flex shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-slate-100 bg-white p-2.5 shadow-[0_10px_26px_rgba(15,63,70,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(15,63,70,0.13)] ${
                        isFanCatalog
                          ? 'min-h-[470px] w-[min(90vw,390px)] min-[420px]:w-[360px] sm:min-h-[500px] sm:w-[390px] lg:w-[calc((100%_-_2.5rem)/3)]'
                          : 'min-h-[394px] w-[min(82vw,286px)] min-[420px]:w-[280px] sm:min-h-[420px] sm:w-[292px]'
                      }`}
                    >
                      {(promoBadgeLabel || product.isNewArrival || product.isBestSeller || product.isFeatured) && (
                        <div className={`absolute left-2.5 top-2.5 z-10 rounded-r-full px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white ${
                          promoBadgeLabel ? 'bg-[#df0b16] shadow-[0_8px_18px_rgba(223,11,22,0.18)]' : 'bg-[#86d8d2]'
                        }`}>
                          {promoBadgeLabel || (product.isBestSeller ? 'Best Seller' : product.isNewArrival ? 'New Launch' : 'Featured')}
                        </div>
                      )}
                      <Link to={`/product/${getProductSlug(product)}`} className={`flex items-center justify-center overflow-hidden rounded-md bg-white ${
                        isFanCatalog ? 'h-80 sm:h-96' : 'h-60 sm:h-64'
                      }`}>
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className={`h-full w-full object-contain transition duration-300 group-hover:scale-[1.035] ${
                            isFanCatalog ? 'scale-[1.08] group-hover:scale-[1.12]' : ''
                          }`}
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
                        <p className="mt-2 truncate text-xs font-medium leading-5 text-slate-600">
                          {getProductLine(product)}
                        </p>
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
                            disabled={!canAdd}
                            className="inline-flex h-8 items-center justify-center rounded-md bg-black px-2 text-[10px] font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-[11px]"
                          >
                            {canAdd ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBuyNow(product)}
                            disabled={!canAdd}
                            className="inline-flex h-8 items-center justify-center rounded-md bg-[#540000] px-2 text-[10px] font-black text-white transition hover:bg-[#3f0000] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-[11px]"
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
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} compact imageAspectClassName={imageAspectClassName} />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-14 text-center sm:py-20">
              <p className="text-xl font-bold">Coming Soon</p>
            </div>
          )}
        </div>
      </section>

      {showComparisonSection && (
        <ProductComparisonSection
          products={filteredProducts}
          eyebrow={`${category} comparison`}
          title={`Compare ${category} Models`}
          subtitle="Review the strongest options side by side before choosing the model that fits your space, style, and daily routine."
          className="bg-white"
        />
      )}

      {showcaseImages.length > 0 && (
        <section className="bg-white px-0 py-10 sm:px-0 lg:py-14">
          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
            {showcaseImages.map((image) => (
              <article key={image.src} className="min-h-[280px] overflow-hidden bg-slate-950 sm:min-h-[360px] xl:min-h-[420px]">
                <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <h2 className="text-center font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
 Scenarios & Solutions
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,63,70,0.08)]">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#f0f9ff] text-[#0284c7]">{feature.icon}</div>
              <h3 className="text-xl font-black text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export const CategoryTemplate = React.memo(CategoryTemplateComponent);
