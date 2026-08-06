import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import giftingCollectionBanner from '../assets/images/tfx-v5-gifting-collection-banner.webp';
import { ProductComparisonSection } from '../components/ProductComparisonSection';
import { getProductSlug, getProducts } from '../services/backend';
import type { Product } from '../types';

type GiftMode = 'her' | 'him' | 'pairs' | 'solo';
type PairGroupKey = 'jcv5-band' | 'display-ring' | 'normal-ring' | 'normal-band';

interface GiftPairSide {
  product: Product;
  imageTerms: string[];
  cardKey: string;
  audience: 'her' | 'him';
  colorName?: string;
  colorHex?: string;
}

interface GiftPair {
  first: GiftPairSide;
  second: GiftPairSide;
  group: PairGroupKey;
  title: string;
  discountRate: number;
  cardKey: string;
}

interface GiftProductCardItem {
  product: Product;
  imageTerms: string[];
  cardKey: string;
}

const giftModes: Array<{
  key: GiftMode;
  title: string;
  heading?: string;
  subtitle: string;
}> = [
  {
    key: 'her',
    title: 'For Her',
    subtitle: 'Rose, pink, gold, silver, blue bands',
  },
  {
    key: 'him',
    title: 'For Him',
    subtitle: 'Black, silver, graphite, white bands',
  },
  {
    key: 'pairs',
    title: 'Perfect Pairs',
    heading: 'Couple Goals, Upgraded',
    subtitle: 'Couple gift sets',
  },
  {
    key: 'solo',
    title: 'Solo Era',
    heading: 'Track What Matters Most - You.',
    subtitle: 'Single gift picks',
  },
];

const giftModeKeys = giftModes.map((mode) => mode.key);

const colorText = (product: Product) =>
  [
    product.name,
    product.category,
    product.description,
    product.defaultVariant,
    product.selectedColorName,
    product.bandType,
    ...(product.colors || []).flatMap((color) => [color.name, color.hex]),
    ...(product.variants || []).flatMap((variant) => [variant.colorName, variant.color, variant.colorHex, variant.hex]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const isRingProduct = (product: Product) => /\bring\b/i.test(`${product.category} ${product.name}`);
const isBandProduct = (product: Product) => /\b(band|bracelet)\b/i.test(`${product.category} ${product.name}`);
const isGiftWearable = (product: Product) => isRingProduct(product) || isBandProduct(product);
const isHerProduct = (product: Product) => /(pink|rose|rose gold|gold|champagne|silver|women|female|her)/i.test(colorText(product)) || (isBandProduct(product) && /\bblue\b/i.test(colorText(product)));
const isHimProduct = (product: Product) => /(black|silver|graphite|grey|gray|steel|men|male|him)/i.test(colorText(product)) || (isBandProduct(product) && /\bwhite\b/i.test(colorText(product)));
const isJcv5BandProduct = (product: Product) => isBandProduct(product) && /\b(jc\s*v?5|jcv5|tfx\s*v?5|ai\s*v5|v5)\b/i.test(`${product.name} ${product.category}`);
const isDisplayRingProduct = (product: Product) => isRingProduct(product) && /\b(display|screen|touch)\b/i.test(`${product.name} ${product.description}`);
const isNormalRingProduct = (product: Product) => isRingProduct(product) && !isDisplayRingProduct(product);
const isNormalBandProduct = (product: Product) => isBandProduct(product) && !isJcv5BandProduct(product);

const sortProducts = (items: Product[]) =>
  [...items].sort((a, b) => {
    const aScore = Number(Boolean(a.isFeatured || a.isNewArrival)) + Number(Boolean(a.isBestSeller));
    const bScore = Number(Boolean(b.isFeatured || b.isNewArrival)) + Number(Boolean(b.isBestSeller));
    return bScore - aScore || a.name.localeCompare(b.name);
  });

const scoreByTerms = (product: Product, terms: string[]) => {
  const text = colorText(product);
  return terms.reduce((score, term, index) => (text.includes(term) ? score + terms.length - index : score), 0);
};

const sortForHer = (items: Product[]) =>
  [...items].sort((a, b) => {
    const aScore = scoreByTerms(a, ['rose gold', 'rose', 'pink', 'gold', 'champagne', 'silver', 'blue']);
    const bScore = scoreByTerms(b, ['rose gold', 'rose', 'pink', 'gold', 'champagne', 'silver', 'blue']);
    return bScore - aScore || Number(isRingProduct(b)) - Number(isRingProduct(a)) || a.name.localeCompare(b.name);
  });

const sortForHim = (items: Product[]) =>
  [...items].sort((a, b) => {
    const aScore = scoreByTerms(a, ['black', 'silver', 'graphite', 'steel', 'grey', 'gray', 'white']);
    const bScore = scoreByTerms(b, ['black', 'silver', 'graphite', 'steel', 'grey', 'gray', 'white']);
    return bScore - aScore || Number(isRingProduct(b)) - Number(isRingProduct(a)) || a.name.localeCompare(b.name);
  });

const getColorName = (color: NonNullable<Product['colors']>[number]) => `${color.name} ${color.hex}`.toLowerCase();
const normalizeOptionKey = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getPreferredColor = (product: Product, preferredTerms: string[] = []) =>
  preferredTerms.length
    ? product.colors?.find((color) => preferredTerms.some((term) => getColorName(color).includes(term.toLowerCase())) && color.images?.[0])
    : undefined;

const getProductPath = (product: Product, preferredTerms: string[] = []) => {
  const color = getPreferredColor(product, preferredTerms);
  const colorParam = color?.name ? `?color=${normalizeOptionKey(color.name)}` : '';
  return `/product/${getProductSlug(product)}${colorParam}`;
};

const getProductImage = (product: Product, preferredTerms: string[] = []) => {
  const preferredColor = getPreferredColor(product, preferredTerms);
  return preferredColor?.images?.[0] || product.colors?.[0]?.images?.[0] || product.images?.[0] || '';
};

const buildColorProductCards = (items: Product[], preferredTerms: string[]): GiftProductCardItem[] =>
  items.flatMap((product) => {
    const matchingColors = (product.colors || []).filter((color) =>
      preferredTerms.some((term) => getColorName(color).includes(term.toLowerCase()))
    );

    if (!matchingColors.length) {
      return [
        {
          product,
          imageTerms: preferredTerms,
          cardKey: product.id,
        },
      ];
    }

    return matchingColors.map((color) => ({
      product,
      imageTerms: [color.name],
      cardKey: `${product.id}-${normalizeOptionKey(color.name)}`,
    }));
  });

const getPairSecondColor = (product: Product, preferredTerms: string[] = []) => {
  const firstImage = getProductImage(product, preferredTerms);
  return product.colors?.find((color) => color.images?.[0] && color.images[0] !== firstImage);
};

const getPairSecondPath = (product: Product, preferredTerms: string[] = []) => {
  const color = getPairSecondColor(product, preferredTerms);
  const colorParam = color?.name ? `?color=${normalizeOptionKey(color.name)}` : '';
  return `/product/${getProductSlug(product)}${colorParam}`;
};

const getPairSecondImage = (product: Product, preferredTerms: string[] = []) => {
  const firstImage = getProductImage(product, preferredTerms);
  const alternateColor = getPairSecondColor(product, preferredTerms);
  return alternateColor?.images?.[0] || product.images?.find((image) => image !== firstImage) || firstImage;
};

const getPrice = (product: Product) => Number(product.salePrice || product.price || 0);
const getMrp = (product: Product) => {
  const price = getPrice(product);
  return price > 0 ? price + 2000 : 0;
};

const formatPrice = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const sideColorText = (side: GiftPairSide) => `${side.colorName || ''} ${side.imageTerms.join(' ')}`.toLowerCase();

const buildPairSides = (product: Product, preferredTerms: string[], groupKey: PairGroupKey, audience: GiftPairSide['audience']): GiftPairSide[] => {
  const matchingColors = (product.colors || [])
    .filter((color) => preferredTerms.some((term) => getColorName(color).includes(term.toLowerCase())))
    .sort((a, b) => {
      const aText = getColorName(a);
      const bText = getColorName(b);
      const aIndex = preferredTerms.findIndex((term) => aText.includes(term.toLowerCase()));
      const bIndex = preferredTerms.findIndex((term) => bText.includes(term.toLowerCase()));
      return (aIndex < 0 ? preferredTerms.length : aIndex) - (bIndex < 0 ? preferredTerms.length : bIndex);
    });

  if (!matchingColors.length) {
    return [
      {
        product,
        imageTerms: preferredTerms,
        audience,
        cardKey: `${groupKey}-${product.id}`,
      },
    ];
  }

  return matchingColors.map((color) => ({
    product,
    imageTerms: [color.name],
    audience,
    cardKey: `${groupKey}-${product.id}-${normalizeOptionKey(color.name)}`,
    colorName: color.name,
    colorHex: color.hex,
  }));
};

const pairDifferentSides = (herSides: GiftPairSide[], himSides: GiftPairSide[]) => {
  const remainingHer = [...herSides];
  const remainingHim = [...himSides];
  const pairs: Array<[GiftPairSide, GiftPairSide]> = [];

  while (remainingHer.length && remainingHim.length) {
    const first = remainingHer.shift() as GiftPairSide;
    const firstColor = normalizeOptionKey(first.colorName);
    const blackIndex = remainingHim.findIndex(
      (side) => sideColorText(side).includes('black') && normalizeOptionKey(side.colorName) !== firstColor
    );
    const bestIndex = blackIndex >= 0
      ? blackIndex
      : remainingHim.findIndex(
        (side) => side.product.id !== first.product.id && normalizeOptionKey(side.colorName) !== firstColor
      );
    const colorFallbackIndex = remainingHim.findIndex((side) => normalizeOptionKey(side.colorName) !== firstColor);
    const fallbackIndex = bestIndex >= 0
      ? bestIndex
      : colorFallbackIndex >= 0
        ? colorFallbackIndex
        : remainingHim.findIndex((side) => side.product.id !== first.product.id);
    const secondIndex = fallbackIndex >= 0 ? fallbackIndex : 0;
    const [second] = remainingHim.splice(secondIndex, 1);
    pairs.push([first, second]);
  }

  return pairs;
};

const buildPairGroups = (items: Product[]): GiftPair[] => {
  const groups: Array<{
    key: PairGroupKey;
    title: string;
    filter: (product: Product) => boolean;
    sort: (items: Product[]) => Product[];
    discountRate: number;
    imageTerms: string[];
  }> = [
    {
      key: 'jcv5-band',
      title: 'JCV5 Band Pair',
      filter: isJcv5BandProduct,
      sort: sortForHer,
      discountRate: 0,
      imageTerms: ['pink', 'rose', 'rose gold', 'silver', 'black', 'white', 'blue', 'gold', 'graphite', 'grey', 'gray'],
    },
    {
      key: 'display-ring',
      title: 'Display Ring Pair',
      filter: isDisplayRingProduct,
      sort: sortForHer,
      discountRate: 0.07,
      imageTerms: ['rose gold', 'rose', 'gold', 'silver', 'black', 'white', 'blue', 'graphite', 'grey', 'gray'],
    },
    {
      key: 'normal-ring',
      title: 'Smart Ring Pair',
      filter: isNormalRingProduct,
      sort: sortForHer,
      discountRate: 0.07,
      imageTerms: ['rose gold', 'rose', 'pink', 'gold', 'silver', 'black', 'white', 'blue', 'graphite', 'grey', 'gray'],
    },
    {
      key: 'normal-band',
      title: 'Smart Band Pair',
      filter: isNormalBandProduct,
      sort: sortForHer,
      discountRate: 0,
      imageTerms: ['pink', 'rose', 'silver', 'black', 'white', 'blue', 'gold', 'graphite', 'grey', 'gray'],
    },
  ];

  return groups.flatMap((group) => {
    const products = group.sort(items.filter(group.filter));
    const herSides = products.flatMap((product) => buildPairSides(product, herImageTerms, group.key, 'her'));
    const himSides = products.flatMap((product) => buildPairSides(product, himImageTerms, group.key, 'him'));

    return pairDifferentSides(herSides, himSides).map(([first, second]) => ({
      first,
      second,
      group: group.key,
      title: group.title,
      discountRate: group.discountRate,
      cardKey: `${group.key}-${first.cardKey}-${second.cardKey}`,
    }));
  });
};

const GiftProductCard: React.FC<{ product: Product; badge?: string; imageTerms?: string[] }> = ({ product, badge, imageTerms = [] }) => (
  <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
    <Link to={getProductPath(product, imageTerms)} className="relative flex aspect-[4/3] items-center justify-center bg-[#f8fafc] p-4">
      {badge && (
        <span className="absolute left-3 top-3 rounded-full bg-[#b20c16] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
          {badge}
        </span>
      )}
      <img src={getProductImage(product, imageTerms)} alt={product.name} className="h-full w-full object-contain transition group-hover:scale-[1.04]" loading="lazy" decoding="async" />
    </Link>
    <div className="p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#b20c16]">{product.category}</p>
      <Link to={getProductPath(product, imageTerms)}>
        <h3 className="mt-2 line-clamp-2 min-h-[2.65rem] text-base font-medium leading-[1.16] tracking-normal text-slate-950 transition hover:text-[#b20c16] [font-family:Arial,Helvetica,sans-serif]">
          {product.name}
        </h3>
      </Link>
      <div className="mt-4 flex items-center gap-2">
        {getMrp(product) > getPrice(product) && (
          <span className="text-xs font-bold text-slate-400 line-through">{formatPrice(getMrp(product))}</span>
        )}
        <span className="text-base font-black text-slate-950">{formatPrice(getPrice(product))}</span>
      </div>
      <Link to={getProductPath(product, imageTerms)} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-[#b20c16]">
        View Gift
      </Link>
    </div>
  </article>
);

const getPairSideStyle = (side: GiftPairSide): React.CSSProperties =>
  side.audience === 'him'
    ? {
        background: 'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.18), rgba(20,20,20,0.9) 42%, #050505 100%)',
      }
    : {
        background: 'radial-gradient(circle at 50% 18%, #ffffff 0%, #f8fafc 54%, #e5e7eb 100%)',
      };

const GiftPairProductTile: React.FC<{ side: GiftPairSide }> = ({ side }) => (
  <Link
    to={getProductPath(side.product, side.imageTerms)}
    className="group/tile relative overflow-hidden rounded-lg p-3"
    style={getPairSideStyle(side)}
  >
    <span
      className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
        side.audience === 'him' ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
      }`}
    >
      {side.audience === 'him' ? 'Him' : 'Her'}
    </span>
    <img
      src={getProductImage(side.product, side.imageTerms)}
      alt={side.product.name}
      className="aspect-square w-full object-contain transition group-hover/tile:scale-[1.04]"
      loading="lazy"
      decoding="async"
    />
    <p className={`mt-2 line-clamp-2 text-center text-[11px] font-medium leading-[1.18] tracking-normal [font-family:Arial,Helvetica,sans-serif] ${side.audience === 'him' ? 'text-white' : 'text-slate-950'}`}>
      {side.colorName || side.product.name}
    </p>
  </Link>
);

const GiftPairCard: React.FC<{ pair: GiftPair }> = ({ pair }) => {
  const { first, second, discountRate } = pair;
  const total = getPrice(first.product) + getPrice(second.product);
  const offerTotal = Math.round(total * (1 - discountRate));

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#b20c16] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
          {discountRate > 0 ? `${Math.round(discountRate * 100)}% off pair` : 'Pair price'}
        </span>
        <span className="text-sm font-black text-slate-950">2 pcs</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <GiftPairProductTile side={first} />
        <GiftPairProductTile side={second} />
      </div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#b20c16]">
        {pair.title}
      </p>
      <Link to={getProductPath(first.product, first.imageTerms)}>
        <h3 className="mt-2 line-clamp-2 min-h-[2.65rem] text-base font-medium leading-[1.16] tracking-normal text-slate-950 transition hover:text-[#b20c16] [font-family:Arial,Helvetica,sans-serif]">
          {first.product.name} + {second.product.name}
        </h3>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-lg font-black text-slate-950">{formatPrice(offerTotal)}</span>
        {discountRate > 0 && <span className="text-sm font-bold text-slate-400 line-through">{formatPrice(total)}</span>}
        {discountRate > 0 && <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-700">Save {Math.round(discountRate * 100)}%</span>}
      </div>
      <p className="mt-1 text-[11px] font-bold text-slate-500">
        Real cost: {formatPrice(getPrice(first.product))} + {formatPrice(getPrice(second.product))}
      </p>
      <Link to={getProductPath(first.product, first.imageTerms)} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-[#b20c16]">
        View First Product
      </Link>
    </article>
  );
};

const herImageTerms = ['rose gold', 'rose', 'pink', 'gold', 'champagne', 'silver', 'blue'];
const himImageTerms = ['black', 'silver', 'graphite', 'steel', 'grey', 'gray', 'white'];

export const GiftingStore: React.FC = () => {
  const { giftMode } = useParams<{ giftMode?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const activeMode = giftModeKeys.includes(giftMode as GiftMode) ? (giftMode as GiftMode) : undefined;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getProducts();
      setProducts(data.filter(isGiftWearable));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load gifting products right now.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

  const sortedProducts = useMemo(() => sortProducts(products), [products]);
  const herProducts = useMemo(() => {
    const matches = sortedProducts.filter(isHerProduct);
    return sortForHer(matches.length ? matches : sortedProducts.filter(isRingProduct));
  }, [sortedProducts]);
  const himProducts = useMemo(() => {
    const matches = sortedProducts.filter(isHimProduct);
    return sortForHim(matches.length ? matches : sortedProducts.filter(isBandProduct));
  }, [sortedProducts]);
  const soloProducts = useMemo(() => sortedProducts, [sortedProducts]);
  const herProductCards = useMemo(() => buildColorProductCards(herProducts, herImageTerms), [herProducts]);
  const himProductCards = useMemo(() => buildColorProductCards(himProducts, himImageTerms), [himProducts]);
  const soloProductCards = useMemo(() => soloProducts.map((product) => ({ product, imageTerms: [], cardKey: product.id })), [soloProducts]);
  const pairGroups = useMemo(() => buildPairGroups(sortedProducts), [sortedProducts]);
  const activeGiftComparisonProducts = useMemo(() => {
    if (activeMode === 'pairs') {
      return pairGroups.flatMap((pair) => [pair.first.product, pair.second.product]);
    }
    if (activeMode === 'her') return herProducts;
    if (activeMode === 'him') return himProducts;
    if (activeMode === 'solo') return soloProducts;
    return [];
  }, [activeMode, herProducts, himProducts, pairGroups, soloProducts]);
  const currentMode = giftModes.find((mode) => mode.key === activeMode);

  if (currentMode) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] px-4 py-12 text-slate-950 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl pt-16 sm:pt-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#b20c16]">{currentMode.subtitle}</p>
              <h1 className="mt-2 text-3xl font-medium leading-[1.16] tracking-normal text-slate-950 [font-family:Arial,Helvetica,sans-serif] sm:text-5xl">
                {currentMode.heading || currentMode.title}
              </h1>
            </div>
            <Link to="/gifting-store" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-black text-slate-950 transition hover:border-[#b20c16] hover:text-[#b20c16]">
              Back to gifting
            </Link>
          </div>

          {loadError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[360px] animate-pulse rounded-lg bg-white shadow-sm" />
              ))}
            </div>
          ) : activeMode === 'pairs' ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pairGroups.map((pair) => (
                <GiftPairCard key={pair.cardKey} pair={pair} />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(activeMode === 'her' ? herProductCards : activeMode === 'him' ? himProductCards : soloProductCards).map(({ product, imageTerms, cardKey }) => (
                <GiftProductCard
                  key={cardKey}
                  product={product}
                  badge={activeMode === 'solo' && isRingProduct(product) ? '5% off' : undefined}
                  imageTerms={imageTerms}
                />
              ))}
            </div>
          )}

          {!loading && activeMode === 'pairs' && pairGroups.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-black text-slate-950">Pair gifting products are being refreshed.</p>
            </div>
          )}
          {!loading && activeMode !== 'pairs' && (activeMode === 'her' ? herProductCards : activeMode === 'him' ? himProductCards : soloProductCards).length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-black text-slate-950">Gift products are being refreshed.</p>
            </div>
          )}
          {!loading && activeGiftComparisonProducts.length > 0 && (
            <ProductComparisonSection
              products={activeGiftComparisonProducts}
              eyebrow="Gift comparison"
              title="Compare Gift Picks"
              subtitle="Compare gift-ready products by price, availability, features, and the kind of person or routine they suit best."
              className="mt-14 rounded-xl bg-white"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <section className="bg-white px-4 pb-10 pt-4 sm:px-8 sm:pb-14 sm:pt-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-lg shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
            <img
              src={giftingCollectionBanner}
              alt="TFX explore collection featuring gift ideas for her, him, pairs, and solo gifting"
              className="block w-full object-contain sm:object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {giftModes.map((mode, index) => (
              <Link
                key={mode.key}
                to={`/gifting-store/${mode.key}`}
                aria-label={`Open ${mode.title} gifting products`}
                title={mode.title}
                className="absolute inset-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b20c16]/70"
                style={{
                  left: `${index * 25}%`,
                  width: '25%',
                }}
              >
                <span className="sr-only">{mode.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
