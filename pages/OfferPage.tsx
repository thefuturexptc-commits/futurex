import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { ProductComparisonSection } from '../components/ProductComparisonSection';
import { getProducts } from '../services/backend';
import type { Product } from '../types';
import bandOfferBanner from '../assets/images/band-offer-banner.webp';
import ringOfferBanner from '../assets/images/ring-offer-banner.webp';
import fanOfferBanner from '../assets/images/fan-offer-banner.webp';

const isRingProduct = (product: Product) => {
  const text = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  return text.includes('ring');
};

const isBandProduct = (product: Product) => {
  const text = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  return text.includes('band');
};

const isFanProduct = (product: Product) => {
  const text = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  return text.includes('fan') || text.includes('airwall') || text.includes('bladeless');
};

const sortOfferProducts = (items: Product[]) =>
  [...items].sort((a, b) => {
    const aFeatured = Number(Boolean(a.isFeatured || a.isBestSeller || a.isNewArrival));
    const bFeatured = Number(Boolean(b.isFeatured || b.isBestSeller || b.isNewArrival));
    return bFeatured - aFeatured || a.name.localeCompare(b.name);
  });

export const OfferPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load offer products right now.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const onProductsUpdated = () => void loadProducts();
    window.addEventListener('products-updated', onProductsUpdated);
    return () => window.removeEventListener('products-updated', onProductsUpdated);
  }, [loadProducts]);

  const bandProducts = useMemo(() => sortOfferProducts(products.filter(isBandProduct)), [products]);

  const ringProducts = useMemo(() => {
    return sortOfferProducts(products.filter(isRingProduct));
  }, [products]);

  const fanProducts = useMemo(() => sortOfferProducts(products.filter(isFanProduct)), [products]);

  const offerSections = [
    {
      id: 'band-offer',
      title: 'Band Offers',
      eyebrow: 'TFX5 AI Smart Band',
      description: 'Mega price drop on eligible smart bands. Explore the band collection below.',
      banner: bandOfferBanner,
      bannerAlt: 'TFX5 AI Smart Band mega price drop offer at ₹9,999',
      products: bandProducts,
      fallbackHref: '/product/tfx5-ai-smart-band',
      fallbackLabel: 'View TFX5 Band',
      accent: 'from-sky-500 to-cyan-400',
      badge: 'Mega Drop',
    },
    {
      id: 'ring-offer',
      title: 'Ring Offers',
      eyebrow: 'TFX Fitness Rings Collection',
      description: 'Explore smart rings with the direct 5% offer already included in the displayed price.',
      banner: ringOfferBanner,
      bannerAlt: 'TFX fitness rings collection offer banner',
      products: ringProducts,
      fallbackHref: '/product/tfx-display-pro-smart-ring',
      fallbackLabel: 'View Smart Ring',
      accent: 'from-violet-500 to-fuchsia-400',
      badge: '5% Direct Off',
    },
    {
      id: 'fan-offer',
      title: 'Fan Offers',
      eyebrow: 'Premium Bladeless Fans',
      description: 'Comfort-focused fan offers with the direct 10% offer already included in the displayed price.',
      banner: fanOfferBanner,
      bannerAlt: 'Premium bladeless fans 10 percent off offer banner',
      products: fanProducts,
      fallbackHref: '/product/tfx-advance',
      fallbackLabel: 'View Smart Fan',
      accent: 'from-rose-500 to-orange-400',
      badge: '10% Direct Off',
    },
  ];

  const offerStats = [
    ['3', 'curated deal zones'],
    [`${bandProducts.length + ringProducts.length + fanProducts.length}`, 'eligible products'],
    ['5%', 'rings and eligible bands'],
    ['10%', 'fan savings'],
  ];
  const offerComparisonProducts = useMemo(
    () => [...bandProducts, ...ringProducts, ...fanProducts],
    [bandProducts, fanProducts, ringProducts]
  );

  return (
    <div className="min-h-screen scroll-smooth bg-[#f4f7f8] text-slate-950">
      <header className="relative overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-8 sm:py-14 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(14,165,233,0.24),transparent_28%),radial-gradient(circle_at_88%_16%,rgba(244,63,94,0.18),transparent_26%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">TheFutureX Offers</p>
            <h1 className="mt-3 font-display text-4xl font-black leading-none text-white sm:text-6xl lg:text-7xl">
              Current Deals
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Premium offers across eligible smart bands, fitness rings, and bladeless fans. No coupon needed, prices already include the direct product offer.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#ring-offer" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-50">
                Shop 5% Offers
              </a>
              <a href="#fan-offer" className="inline-flex h-11 items-center rounded-full border border-white/25 px-5 text-sm font-black text-white transition hover:bg-white/10">
                Shop 10% Offers
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {offerStats.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/10 backdrop-blur">
                <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase leading-4 tracking-[0.12em] text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="sticky top-[64px] z-30 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:top-[80px]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-black text-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-slate-950">Live offers are grouped by product family</span>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {offerSections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="inline-flex h-9 shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-700 transition hover:border-slate-950 hover:bg-white hover:text-slate-950">
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mx-auto mt-5 max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {loadError}
          </div>
        </div>
      )}

      <main className="px-4 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-7xl space-y-14">
          {offerSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <Link to={section.fallbackHref} className="group relative block overflow-hidden bg-slate-950">
                <img
                  src={section.banner}
                  alt={section.bannerAlt}
                  className="block aspect-[2048/819] w-full object-contain transition duration-500 group-hover:scale-[1.015] sm:object-cover"
                  loading={section.id === 'band-offer' ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden="true" />
                <span className={`absolute left-4 top-4 rounded-full bg-gradient-to-r ${section.accent} px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg sm:left-6 sm:top-6`}>
                  {section.badge}
                </span>
              </Link>

              <div className="flex flex-col gap-5 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0369a1]">{section.eyebrow}</p>
                  <h2 className="mt-2 font-display text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                    {section.description}
                  </p>
                </div>
                <Link to={section.fallbackHref} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-950 transition hover:border-slate-950 sm:w-auto">
                  {section.fallbackLabel}
                </Link>
              </div>

              {loading ? (
                <div className="grid gap-5 px-4 pb-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-[380px] animate-pulse rounded-lg bg-white shadow-sm" />
                  ))}
                </div>
              ) : section.products.length > 0 ? (
                <div className="grid gap-5 bg-slate-50/70 px-4 pb-7 pt-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                  {section.products.slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} compact imageAspectClassName="aspect-[4/3]" />
                  ))}
                </div>
              ) : (
                <div className="mx-4 mb-7 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm sm:mx-6 lg:mx-8">
                  <p className="text-lg font-black text-slate-950">{section.title} are being refreshed.</p>
                  <Link to={section.fallbackHref} className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-black text-white">
                    {section.fallbackLabel}
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
      {!loading && offerComparisonProducts.length > 0 && (
        <ProductComparisonSection
          products={offerComparisonProducts}
          eyebrow="Offer comparison"
          title="Compare Eligible Deals"
          subtitle="Compare the products in the current deal zones by savings context, price, availability, and everyday fit."
          className="bg-white"
        />
      )}
    </div>
  );
};
