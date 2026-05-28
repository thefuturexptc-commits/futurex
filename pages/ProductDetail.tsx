<<<<<<< HEAD
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Product, ProductColor, ProductPublicReview } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { addOfferLead, addProductNotifyRequest, addProductReview, getProductById, getProductReviews, getProducts, getUserOrders, toProductSlug, uploadFile } from '../services/backend';
import { ProductImageCarousel } from '../components/ProductImageCarousel';
import { ProductCard } from '../components/ProductCard';
import { absoluteUrl, removeJsonLd, setJsonLd, setSeoMetadata, stripHtml } from '../services/seo';
import { SURPRISE_COUPON_CODE, getCouponRateForItem, getCouponRateLabel, getOfferCouponCodeForItem } from '../utils/coupons';
import ringLowProfile from '../assets/images/ring-low-profile.webp';
import ringHealth from '../assets/images/ring-health.webp';
import ringDailySync from '../assets/images/ring-daily-sync.webp';
import ringAiHealth from '../assets/images/ring-ai-health.webp';
import ringSleepHero from '../assets/images/ring-sleep-hero.webp';
import ringOverviewCharging from '../assets/images/ring-overview-charging.jpg';
import ringOverviewWaterproof from '../assets/images/ring-overview-waterproof.jpg';
import ringOverviewColors from '../assets/images/ring-overview-colors.jpg';
import displayRingOverviewPhone from '../assets/images/display-ring-overview-phone.jpeg';
import displayRingOverviewTouch from '../assets/images/display-ring-overview-touch.webp';
import displayRingOverviewCharging from '../assets/images/display-ring-overview-charging.webp';
import displayRingOverviewWaterproof from '../assets/images/display-ring-overview-waterproof.jpeg';
import tfxVitalDashboard from '../assets/images/tfxvital-health-dashboard.jpeg';
import tfxVitalAge from '../assets/images/tfxvital-vital-age-estimate.jpg';
import bandProof from '../assets/images/band-proof.webp';
import bandLongBattery from '../assets/images/band-long-battery.webp';
import bandScreenlessComfort from '../assets/images/band-screenless-comfort.webp';
import bandFashionableWear from '../assets/images/band-fashionable-wear.webp';
import bandLifestyle from '../assets/images/band-men-women-lifestyle.webp';
import tfxV5BandColors from '../assets/images/jcvital-v5-band-colors.webp';
import tfxV5BandModel from '../assets/images/tfx-v5-band-model.webp';
import premiumBandModelBanner from '../assets/images/premium-band-model-banner.webp';
import premiumBandIconBanner from '../assets/images/premium-band-icon-banner.webp';
import premiumBandLifestyleHiking from '../assets/images/premium-band-lifestyle-hiking.webp';
import premiumBandWaterproofPool from '../assets/images/premium-band-waterproof-pool.webp';
import premiumBandFashionTravel from '../assets/images/premium-band-fashion-travel.webp';
import bandHeroVideo from '../assets/images/band-hero-video.mp4';
import fanFamilyHero from '../assets/images/fan-family-hero.webp';
import fanSlideOne from '../assets/images/fan-slide-1.webp';
import fanSlideTwo from '../assets/images/fan-slide-2.webp';
import fanSlideThree from '../assets/images/fan-slide-3.webp';
import monitoringHero from '../assets/images/monitoring-proactive-health-hero.webp';
import monitoringHeartRate from '../assets/images/monitoring-hero-heart-rate.webp';
import monitoringPhonePhoto from '../assets/images/monitoring-phone-photo.webp';

const featureMarkerPattern = /^\s*(?:[-*\u2022]\s*|\d+[.)]\s*)/;
const numberedFeaturePattern = /^\s*\d+[.)]\s*/;
const cleanFeatureText = (feature: string) => feature.replace(featureMarkerPattern, '').trim();
const normalizeOptionKey = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const formatSpecLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const FEATURED_BAND_PRODUCT_SLUG = 'ai-v5-smart-band-heart-rate-spo2-fitness-tracker';

type ProductDetailTabKey = 'description' | 'features' | 'more-information' | 'specs' | 'faq' | 'reviews';

const getFeatureVisual = (feature: string) => {
  const text = feature.toLowerCase();
  if (text.includes('thin') || text.includes('light') || text.includes('comfort')) return { kind: 'leaf', color: 'text-emerald-500', bg: 'bg-emerald-50' };
  if (text.includes('temperature') || text.includes('women') || text.includes('cycle') || text.includes('fertility')) return { kind: 'temp', color: 'text-pink-500', bg: 'bg-pink-50' };
  if (text.includes('health') || text.includes('monitor')) return { kind: 'pulse', color: 'text-teal-500', bg: 'bg-teal-50' };
  if (text.includes('ai') || text.includes('insight')) return { kind: 'brain', color: 'text-violet-500', bg: 'bg-violet-50' };
  if (text.includes('glucose') || text.includes('sugar')) return { kind: 'drop', color: 'text-red-500', bg: 'bg-red-50' };
  if (text.includes('sleep')) return { kind: 'moon', color: 'text-sky-500', bg: 'bg-sky-50' };
  if (text.includes('stress') || text.includes('recovery')) return { kind: 'gauge', color: 'text-teal-500', bg: 'bg-teal-50' };
  if (text.includes('spo2') || text.includes('oxygen')) return { kind: 'oxygen', color: 'text-pink-500', bg: 'bg-pink-50' };
  if (text.includes('heart')) return { kind: 'heart', color: 'text-red-500', bg: 'bg-red-50' };
  if (text.includes('family') || text.includes('sharing')) return { kind: 'family', color: 'text-amber-500', bg: 'bg-amber-50' };
  if (text.includes('vo2')) return { kind: 'oxygen', color: 'text-emerald-500', bg: 'bg-emerald-50' };
  if (text.includes('water') || text.includes('5atm')) return { kind: 'umbrella', color: 'text-emerald-500', bg: 'bg-emerald-50' };
  if (text.includes('battery')) return { kind: 'battery', color: 'text-emerald-500', bg: 'bg-emerald-50' };
  if (text.includes('fashion')) return { kind: 'sparkle', color: 'text-violet-500', bg: 'bg-violet-50' };
  if (text.includes('fan') || text.includes('airflow')) return { kind: 'wind', color: 'text-sky-500', bg: 'bg-sky-50' };
  return { kind: 'pulse', color: 'text-teal-500', bg: 'bg-teal-50' };
};

const FeatureLineIcon: React.FC<{ kind: string }> = ({ kind }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true">
      {kind === 'leaf' && <><path {...common} d="M13 13c11 0 20 5 22 20-15-1-22-8-22-20Z" /><path {...common} d="M18 18c5 7 11 12 18 17" /><path {...common} d="M30 14v9" /></>}
      {kind === 'temp' && <><path {...common} d="M24 28V12a5 5 0 0 1 10 0v16a9 9 0 1 1-10 0Z" /><path {...common} d="M29 31V18" /></>}
      {kind === 'pulse' && <><circle {...common} cx="24" cy="24" r="17" /><path {...common} d="M11 25h8l3-8 5 16 3-8h7" /></>}
      {kind === 'brain' && <><path {...common} d="M18 31c-5-1-8-5-7-10 1-4 4-6 8-5 2-6 12-6 14 1 5 1 7 5 6 10-1 5-6 8-12 6" /><path {...common} d="M24 34v-7l-5-4" /><path {...common} d="M25 27l6-5" /></>}
      {kind === 'drop' && <><path {...common} d="M24 8s12 13 12 23a12 12 0 0 1-24 0C12 21 24 8 24 8Z" /><path {...common} d="M19 32c2 3 7 4 10 0" /><circle cx="31" cy="13" r="4" fill="currentColor" /></>}
      {kind === 'moon' && <><path {...common} d="M33 35A16 16 0 0 1 19 11a14 14 0 1 0 18 18 16 16 0 0 1-4 6Z" /><path {...common} d="M35 13h6M38 10v6" /></>}
      {kind === 'gauge' && <><path {...common} d="M10 32a16 16 0 1 1 28 0" /><path {...common} d="M24 28l8-10" /><path {...common} d="M14 25h3M31 25h3M18 17l2 3" /></>}
      {kind === 'oxygen' && <><path {...common} d="M24 8s12 13 12 23a12 12 0 0 1-24 0C12 21 24 8 24 8Z" /><text x="17" y="34" fontSize="12" fontWeight="800" fill="currentColor">O2</text></>}
      {kind === 'heart' && <><path {...common} d="M24 37S10 28 10 18a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 10-14 19-14 19Z" /><path {...common} d="M14 25h7l3-6 4 9 3-5h5" /></>}
      {kind === 'family' && <><circle {...common} cx="24" cy="15" r="5" /><circle {...common} cx="13" cy="20" r="4" /><circle {...common} cx="35" cy="20" r="4" /><path {...common} d="M16 36c1-7 15-7 16 0M6 36c1-6 11-6 13-1M29 35c2-5 12-5 13 1" /></>}
      {kind === 'umbrella' && <><path {...common} d="M8 25c3-9 29-9 32 0-4-3-8-3-12 0-3-3-6-3-9 0-4-3-8-3-11 0Z" /><path {...common} d="M24 12v25a5 5 0 0 0 10 0" /></>}
      {kind === 'battery' && <><rect {...common} x="9" y="17" width="27" height="15" rx="3" /><path {...common} d="M39 22v5M16 24h9" /></>}
      {kind === 'sparkle' && <><path {...common} d="M24 7l4 12 12 5-12 4-4 13-5-13-11-4 11-5 5-12Z" /><path {...common} d="M38 8v8M34 12h8" /></>}
      {kind === 'wind' && <><path {...common} d="M8 18h22a5 5 0 1 0-5-5" /><path {...common} d="M8 26h30" /><path {...common} d="M8 34h20a5 5 0 1 1-5 5" /></>}
    </svg>
  );
};

const REVIEW_NAMES = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Neha', 'Aditya', 'Kavya'];

const buildReviewDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString().slice(0, 10);
};

const buildFallbackReviews = (product: Product) => {
  const featureA = cleanFeatureText(product.features?.[0] || 'overall quality');
  const featureB = cleanFeatureText(product.features?.[1] || 'daily usage');
  const specA = product.specs ? Object.entries(product.specs)[0] : null;
  const specText = specA ? `${formatSpecLabel(specA[0])} is ${specA[1]}` : 'it feels worth the price';

  return REVIEW_NAMES.slice(0, 4).map((name, index) => ({
    id: `fallback_${product.id}_${index}`,
    productId: product.id,
    name,
    rating: [5, 4, 5, 4][index],
    date: buildReviewDate(6 + index * 5),
    verifiedBuyer: index !== 3,
    comment: [
      `${product.name} looks great in hand and ${featureA.toLowerCase()} is the part I noticed most after using it for a few days.`,
      `Bought this mainly for ${featureB.toLowerCase()} and it has been reliable so far. ${specText}.`,
      `The finish, fit, and everyday performance of this ${product.category.slice(0, -1).toLowerCase() || 'product'} feel well balanced. Good value overall.`,
      `Using it daily now and the experience has been smooth. Delivery was fine and the product matches the listing well.`,
    ][index],
    images: [],
  }));
};

const getDisplayReviews = (product: Product, reviews: ProductPublicReview[]) => {
  const uniqueReviews = reviews.filter((review, index, list) => {
    const signature = `${review.name}|${review.date}|${review.comment}`.trim().toLowerCase();
    return list.findIndex((item) => `${item.name}|${item.date}|${item.comment}`.trim().toLowerCase() === signature) === index;
  });

  if (uniqueReviews.length >= 4) return uniqueReviews;

  const usedNames = new Set(uniqueReviews.map((review) => review.name.trim().toLowerCase()));
  const usedComments = new Set(uniqueReviews.map((review) => review.comment.trim().toLowerCase()));
  const fallback = buildFallbackReviews(product).filter(
    (review) => !usedNames.has(review.name.trim().toLowerCase()) && !usedComments.has(review.comment.trim().toLowerCase())
  );

  return [...uniqueReviews, ...fallback].slice(0, Math.max(4, uniqueReviews.length));
};

const DetailIcon: React.FC<{ kind: 'delivery' | 'shield' | 'support' | 'payment' | 'location' }> = ({ kind }) => {
  const shared = 'h-4 w-4 stroke-current drop-shadow-[0_1px_6px_rgba(255,255,255,0.08)]';
  if (kind === 'delivery') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5h10.5v6.5H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 11h3.2l3.3 3v1H13.5z" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    );
  }
  if (kind === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3.2v5.9c0 4.4-2.9 7.3-7 8.9-4.1-1.6-7-4.5-7-8.9V6.2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.2 12.3l1.8 1.8 3.8-4" />
      </svg>
    );
  }
  if (kind === 'support') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.8a7.5 7.5 0 0115 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 12.8v4h2.8v-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.7 12.8v4h2.8v-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5h2.2" />
      </svg>
    );
  }
  if (kind === 'payment') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="12" rx="2.5" />
        <path strokeLinecap="round" d="M3 10h18" />
        <path strokeLinecap="round" d="M7 15h3.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
};
=======
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductById } from '../services/backend';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
<<<<<<< HEAD
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, applyCoupon, couponCode } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const [activeDetailTab, setActiveDetailTab] = useState<ProductDetailTabKey>('features');
  const [activeFeaturePage, setActiveFeaturePage] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [visibleReviewCount, setVisibleReviewCount] = useState(4);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [surprisePhone, setSurprisePhone] = useState('');
  const [surprisePriceRevealed, setSurprisePriceRevealed] = useState(false);
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);
  const [detailTabsFixed, setDetailTabsFixed] = useState(false);
  const [detailTabsHeight, setDetailTabsHeight] = useState(48);
  const mobileCtaAnchorRef = useRef<HTMLDivElement | null>(null);
  const productGalleryRef = useRef<HTMLDivElement | null>(null);
  const detailTabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const detailTabsBarRef = useRef<HTMLElement | HTMLDivElement | null>(null);
  const reviewImagePreviews = useMemo(
    () => reviewImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [reviewImages]
  );

  const loadProduct = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getProductById(id)
      .then(async (p) => {
        if (!p) {
          setError('Product not found');
        } else {
          const publicReviews = await getProductReviews(p.id);
          const embeddedReviews = p.reviews || [];
          const mergedReviews = [
            ...publicReviews,
            ...embeddedReviews.filter((embedded) => !publicReviews.some((review) => review.id && review.id === embedded.id)),
          ];
          const displayReviews = getDisplayReviews(p, mergedReviews);
          const nextReviewCount = displayReviews.length;
          const nextRating = nextReviewCount
            ? Number((displayReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviewCount).toFixed(1))
            : Number(p.rating || 0);
          setProduct({ ...p, reviews: displayReviews, reviewCount: nextReviewCount, rating: nextRating });
          setSelectedColor(p.colors?.[0] ?? null);
        }
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => loadProduct(), [loadProduct]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProduct);
    return () => window.removeEventListener('products-updated', loadProduct);
  }, [loadProduct]);

  useEffect(() => {
    if (!product) return;

    let cancelled = false;
    getProducts()
      .then((products) => {
        if (cancelled) return;
        const sameCategory = products.filter((item) => item.id !== product.id && item.category === product.category);
        const fallback = products.filter((item) => item.id !== product.id && item.category !== product.category);
        setRelatedProducts([...sameCategory, ...fallback].slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setRelatedProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  const activeImages = useMemo(() => {
    if (!product) return [];
    const selectedColorKey = normalizeOptionKey(selectedColor?.name);
    if (selectedColor?.images?.length) return selectedColor.images;
    if (selectedColorKey && product.imagesByColor) {
      const colorImages =
        product.imagesByColor[selectedColor?.name || ''] ||
        Object.entries(product.imagesByColor).find(([key]) => normalizeOptionKey(key) === selectedColorKey)?.[1];
      if (colorImages?.length) return colorImages;
    }
    const variantImages = product.variants?.find((variant) => normalizeOptionKey(variant.colorName || variant.color) === selectedColorKey)?.images;
    if (variantImages?.length) return variantImages;
    return product?.images ?? [];
  }, [selectedColor, product]);

  const handleSelectColor = useCallback(
    (color: ProductColor, colorStock: number) => {
      if (colorStock <= 0) return;
      setSelectedColor(color);
      setSelectedSize('');
      setSizeError('');
      setSelectedImageIndex(0);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('color', normalizeOptionKey(color.name));
        return next;
      }, { replace: true });
      window.setTimeout(() => {
        productGalleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    },
    [setSearchParams]
  );

  const salePrice = Number(product?.salePrice || product?.price || 0);
  const mrp = Number(product?.mrp || product?.price || 0);
  const savings = Math.max(0, mrp - salePrice);
  const percent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  const couponRate = product ? getCouponRateForItem(product, SURPRISE_COUPON_CODE) : 0;
  const couponDiscount = Number((salePrice * couponRate).toFixed(2));
  const couponPrice = Number(Math.max(0, salePrice - couponDiscount).toFixed(2));
  const isProductCouponApplied = couponRate > 0 && couponCode === SURPRISE_COUPON_CODE;
  const couponRateLabel = getCouponRateLabel(couponRate);
  const productOfferCode = product ? getOfferCouponCodeForItem(product) : '';
  const displayedPrice = isProductCouponApplied ? couponPrice : salePrice;
  const displayedSavings = Math.max(0, mrp - displayedPrice);
  const displayedPercent = mrp > 0 ? Math.round((displayedSavings / mrp) * 100) : 0;
  const isFeaturedBandProduct = Boolean(product && (id === FEATURED_BAND_PRODUCT_SLUG || toProductSlug(product.name) === FEATURED_BAND_PRODUCT_SLUG));

  useEffect(() => {
    if (couponCode === SURPRISE_COUPON_CODE && couponRate > 0) {
      setSurprisePriceRevealed(true);
      setCouponMessage(`Code ${productOfferCode} applied. Your ${couponRateLabel} off price is ready.`);
    }
  }, [couponCode, couponRate, couponRateLabel, productOfferCode]);

  const stockCount = useMemo(() => {
    if (selectedColor) {
      return Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0);
    }
    return Number(product?.stock || 0) - Number(product?.reservedStock || 0);
  }, [selectedColor, product]);

  const canAdd = stockCount > 0;
  const specEntries = useMemo(
    () => Object.entries(product?.specs || {}).filter(([, value]) => String(value || '').trim().length > 0),
    [product?.specs]
  );
  const topSpecEntries = useMemo(() => specEntries.slice(0, 6), [specEntries]);
  const selectedColorStock = selectedColor
    ? Math.max(0, Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0))
    : stockCount;

  useEffect(() => {
    if (!product?.colors?.length) return;
    const queryColor = normalizeOptionKey(searchParams.get('color') || '');
    if (!queryColor) return;
    const matchingColor = product.colors.find((color) => normalizeOptionKey(color.name) === queryColor);
    if (!matchingColor || selectedColor?.name === matchingColor.name) return;
    setSelectedColor(matchingColor);
    setSelectedImageIndex(0);
  }, [product?.colors, searchParams, selectedColor?.name]);

  const normalizedCategory = String(product?.category || '').trim().toLowerCase();
  const isRingProduct = normalizedCategory === 'smart rings' || /\bsmart\s+rings?\b/.test(normalizedCategory);
  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    const selectedColorKey = normalizeOptionKey(selectedColor?.name);
    return (
      product.variants.find((variant) => normalizeOptionKey(variant.colorName || variant.color) === selectedColorKey) ||
      product.variants[0]
    );
  }, [product?.variants, selectedColor?.name]);
  const availableSizes = useMemo(
    () =>
      (selectedVariant?.sizes || [])
        .map((item) => ({ ...item, stock: Number(item.stock || 0) }))
        .filter((item) => String(item.size || '').trim().length > 0),
    [selectedVariant?.sizes]
  );
  const requiresRingSize = isRingProduct && availableSizes.length > 0;
  const infoBadges = useMemo(
    () => [
      { title: 'Secure Payment', text: 'Trusted checkout and support', icon: 'payment' as const },
      { title: 'Warranty', text: product?.warranty || 'Standard product warranty', icon: 'shield' as const },
      { 
  title: 'Cash on Delivery', 
  text: 'COD available on eligible orders.', 
  icon: 'support' as const 
},
    ],
    [product?.warranty]
  );
  const visibleSpecEntries = useMemo(() => (showAllSpecs ? specEntries : specEntries.slice(0, 8)), [showAllSpecs, specEntries]);

  useEffect(() => {
    if (!product) return;

    const productPath = `/product/${toProductSlug(product.name)}`;
    const image = product.images?.[0] || product.colors?.[0]?.images?.[0] || '/images/fav.webp';
    const description =
      stripHtml(product.description).slice(0, 155) ||
      product.features?.slice(0, 3).join(', ') ||
      `Shop ${product.name} from TheFutureX.`;
    const price = Number(product.salePrice || product.price || 0);
    const productImages = product.images?.length ? product.images : [image];

    setSeoMetadata({
      title: product.name,
      description,
      path: productPath,
      image,
      type: 'product',
    });

    setJsonLd('product-json-ld', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: productImages.map((item) => absoluteUrl(item)),
      brand: {
        '@type': 'Brand',
        name: 'TheFutureX',
      },
      sku: product.id,
      category: product.category,
      aggregateRating: product.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating),
            reviewCount: Number(product.reviewCount || product.reviews?.length || 1),
          }
        : undefined,
      offers: {
        '@type': 'Offer',
        url: absoluteUrl(productPath),
        priceCurrency: 'INR',
        price,
        availability: canAdd ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    });

    return () => removeJsonLd('product-json-ld');
  }, [canAdd, product]);

  useEffect(() => {
    if (user?.name && !reviewName) {
      setReviewName(user.name);
    }
  }, [reviewName, user]);

  useEffect(() => {
    return () => {
      reviewImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [reviewImagePreviews]);

  useEffect(() => {
    const anchor = mobileCtaAnchorRef.current;
    if (!anchor || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyCta(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    if (!requiresRingSize) {
      setSelectedSize('');
      setSizeError('');
      return;
    }
    setSelectedSize((current) => {
      if (!current) return '';
      const stillAvailable = availableSizes.some((item) => item.stock > 0 && item.size === current);
      return stillAvailable ? current : '';
    });
    setSizeError('');
  }, [availableSizes, requiresRingSize]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      selectedSize: selectedSize || undefined,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, selectedColor, selectedSize, activeImages, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    if (requiresRingSize && !selectedSize) {
      setSizeError('Please select a ring size before continuing.');
      return;
    }
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      selectedSize: selectedSize || undefined,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd);
    navigate('/checkout');
  }, [product, requiresRingSize, selectedColor, selectedSize, activeImages, addToCart, navigate]);

  const handleApplyProductCoupon = useCallback(() => {
    const digits = surprisePhone.replace(/\D/g, '');
    const normalizedPhone = digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setCouponMessage('Enter a valid 10-digit mobile number to unlock this offer.');
      return;
    }

    window.localStorage.setItem('tfx_surprise_coupon_phone', normalizedPhone);
    addOfferLead({
      phone: normalizedPhone,
      source: 'product_offer',
      couponCodes: productOfferCode ? [productOfferCode] : [],
      message: productOfferCode ? `${productOfferCode} for ${product?.category || product?.name || 'this product'}` : undefined,
      productId: product?.id,
      productName: product?.name,
    }).catch(() => undefined);
    const result = applyCoupon(SURPRISE_COUPON_CODE);
    if (result.ok) {
      setSurprisePriceRevealed(true);
      setCouponMessage(`Code ${productOfferCode} applied. Your ${couponRateLabel} off price is ready.`);
      return;
    }
    setCouponMessage(result.message);
  }, [applyCoupon, couponRateLabel, product, productOfferCode, surprisePhone]);

  const handleOpenNotify = useCallback(async () => {
    if (!product) return;
    if (!user) {
      openLogin('/product/' + id);
      return;
    }

    const contact = (user.email || user.phone || '').trim();
    if (!contact) {
      setNotifyMessage('Please add an email or phone number to your profile so we can notify you.');
      setShowNotifyModal(true);
      return;
    }

    setNotifySubmitting(true);
    setNotifyMessage('');
    try {
      await addProductNotifyRequest({
        productId: product.id,
        productName: product.name,
        contact,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        selectedColorName: selectedColor?.name,
      });
      setNotifyMessage('Done. We will notify you when this product is back in stock.');
      setShowNotifyModal(true);
      window.setTimeout(() => setShowNotifyModal(false), 1600);
    } catch (error) {
      setNotifyMessage(error instanceof Error ? error.message : 'Unable to save your request.');
      setShowNotifyModal(true);
    } finally {
      setNotifySubmitting(false);
    }
  }, [id, openLogin, product, selectedColor?.name, user]);

  const handleAddButtonClick = useCallback(() => {
    if (!canAdd) {
      handleOpenNotify();
      return;
    }
    if (requiresRingSize && !selectedSize) {
      setSizeError('Please select a ring size before adding to cart.');
      return;
    }
    setSizeError('');
    handleAddToCart();
  }, [canAdd, handleOpenNotify, requiresRingSize, selectedSize, handleAddToCart]);

  const handleReviewImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/')).slice(0, 2);
    setReviewImages(files);
    if ((event.target.files?.length || 0) > 2) {
      setReviewMessage('Only 2 images are allowed for one review.');
    }
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;
    const cleanName = reviewName.trim();
    const cleanComment = reviewComment.trim();
    if (!cleanName || !cleanComment) {
      setReviewMessage('Please enter your name and review.');
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      let verifiedBuyer = false;
      if (user) {
        try {
          const orders = await getUserOrders(user.id);
          verifiedBuyer = orders.some((order) => order.items.some((item) => item.id === product.id));
        } catch {
          verifiedBuyer = false;
        }
      }

      const imageUrls: string[] = [];
      for (const file of reviewImages.slice(0, 2)) {
        const url = await uploadFile(file, `reviews/${product.id}/${Date.now()}_${file.name}`);
        if (url) imageUrls.push(url);
      }

      const savedReview = await addProductReview(product.id, {
        productId: product.id,
        name: cleanName,
        rating: reviewRating,
        comment: cleanComment,
        images: imageUrls,
        userId: user?.id,
        userEmail: user?.email,
        verifiedBuyer,
        date: new Date().toISOString().slice(0, 10),
      });

      setProduct((current) => {
        if (!current) return current;
        const nextReviews = getDisplayReviews(current, [savedReview, ...(current.reviews || [])]);
        return {
          ...current,
          reviews: nextReviews,
          reviewCount: nextReviews.length,
          rating: Number((nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviews.length).toFixed(1)),
        };
      });
      setReviewComment('');
      setReviewImages([]);
      setReviewRating(5);
      setReviewMessage(verifiedBuyer ? 'Review submitted as Genuine Buyer.' : 'Review submitted. Admin can review it.');
    } catch {
      setReviewMessage('Unable to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!product) return;
    const isDisplay = /\bdisplay\b/i.test(product.name);
    const filteredFeatureCount = (product.features?.length ? product.features.map(cleanFeatureText).filter(Boolean) : Array(8).fill(''))
      .filter((feature) => isDisplay || !/\bdisplay\b/i.test(feature)).length;
    const pageCount = Math.max(1, Math.ceil(Math.min(filteredFeatureCount || 8, 12) / 4));

    setActiveFeaturePage(0);
    if (pageCount <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setActiveFeaturePage((page) => (page + 1) % pageCount);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [product]);

  useEffect(() => {
    if (!product) return;

    const familyText = `${product.category || ''} ${product.name || ''}`.toLowerCase();
    const isFanProduct = /\bfan\b/.test(familyText);
    const sectionIds: ProductDetailTabKey[] = [
      'features',
      ...(isFanProduct ? [] : (['description'] as ProductDetailTabKey[])),
      'specs',
      'faq',
    ];

    const updateActiveTabFromScroll = () => {
      const offset = 64 + detailTabsHeight + 16;
      const currentPosition = window.scrollY + offset;
      let currentTab = sectionIds[0];

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element && element.offsetTop <= currentPosition) {
          currentTab = id;
        }
      }

      setActiveDetailTab((previous) => (previous === currentTab ? previous : currentTab));
    };

    updateActiveTabFromScroll();
    window.addEventListener('scroll', updateActiveTabFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveTabFromScroll);

    return () => {
      window.removeEventListener('scroll', updateActiveTabFromScroll);
      window.removeEventListener('resize', updateActiveTabFromScroll);
    };
  }, [detailTabsHeight, product]);

  useEffect(() => {
    if (!product) return;

    const updateDetailTabsPosition = () => {
      const anchor = detailTabsAnchorRef.current;
      const bar = detailTabsBarRef.current;
      if (!anchor) return;

      if (bar) {
        setDetailTabsHeight(bar.offsetHeight || 48);
      }

      setDetailTabsFixed(anchor.getBoundingClientRect().top <= 64);
    };

    updateDetailTabsPosition();
    window.addEventListener('scroll', updateDetailTabsPosition, { passive: true });
    window.addEventListener('resize', updateDetailTabsPosition);

    return () => {
      window.removeEventListener('scroll', updateDetailTabsPosition);
      window.removeEventListener('resize', updateDetailTabsPosition);
    };
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-2xl font-bold text-white">Product Not Found</p>
        <p className="text-gray-400 text-center">{error || 'This product does not exist or has been removed.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const displayedImages = activeImages.length > 0 ? activeImages : ['https://picsum.photos/600'];
  const selectedColorKeyForVideo = normalizeOptionKey(selectedColor?.name);
  const selectedVariantVideoUrl = selectedVariant?.videoUrl || '';
  const selectedColorVideoUrl =
    selectedColorKeyForVideo && product.videoByColor
      ? product.videoByColor[selectedColor?.name || ''] ||
        Object.entries(product.videoByColor).find(([key]) => normalizeOptionKey(key) === selectedColorKeyForVideo)?.[1] ||
        ''
      : '';
  const productVideoUrl = selectedVariantVideoUrl || selectedColorVideoUrl || product.videoUrl || '';
  const productVideoIndex = displayedImages.length;
  const displayedMediaCount = displayedImages.length + (productVideoUrl ? 1 : 0);
  const shortDescription = stripHtml(product.description);
  const productFamilyText = `${normalizedCategory} ${product.name}`.toLowerCase();
  const productFamily = /\b(band|bracelet)\b/.test(productFamilyText)
    ? 'band'
    : /\bring\b/.test(productFamilyText)
      ? 'ring'
      : /\bfan\b/.test(productFamilyText)
        ? 'fan'
        : /\b(monitor|watch|belt|spo2|ecg|blood\s*pressure|glucose)\b/.test(productFamilyText)
          ? 'monitoring'
          : 'wearable';
  const showProductOverview = productFamily !== 'fan';
  const detailTabs: Array<{ key: ProductDetailTabKey; label: string }> = [
    { key: 'features', label: 'Features' },
    ...(showProductOverview ? [{ key: 'description' as const, label: 'Overview' }] : []),
    { key: 'specs', label: 'Specifications' },
    { key: 'faq', label: 'FAQs' },
  ];
  const getDetailTabLabel = (tab: (typeof detailTabs)[number]) => {
    return tab.label;
  };
  const familyProfiles = {
    band: {
      fallbackFeatures: ['Screenless Comfort', 'Long Battery Life', 'Health Monitoring', 'Sleep Tracking', 'Fitness Tracking', 'Stress and Recovery', 'SpO2', 'Heart Rate', 'Fashionable Wear'],
      images: [bandLifestyle, bandScreenlessComfort, bandProof, bandLongBattery, bandFashionableWear, tfxVitalDashboard, tfxVitalAge],
      sections: [
        ['Screenless Comfort for Everyday Wear', 'A quiet, lightweight band form keeps tracking comfortable through sleep, work, training, and daily movement.'],
        ['Long Battery Life for Steady Monitoring', 'Extended battery support helps keep biometric tracking consistent between charges, making the wearable easier to trust every day.'],
        ['Reliable Wellness Signals at a Glance', 'App-based summaries turn sleep, recovery, heart rate, activity, and wellness data into simple daily insights.'],
        ['Fashionable Wear for Work and Training', 'Minimal band finishes are designed to feel polished with training wear, daily outfits, and wellness routines.'],
        ['Connected App Flow for Better Health Habits', 'The companion app helps users review trends, reports, and recovery cues without needing another distracting screen on the wrist.'],
        ['7x24 Health Monitoring, Always On', 'Continuous monitoring keeps heart rate, blood oxygen, sleep, activity, stress, and recovery signals available across the day.'],
      ],
    },
    ring: {
      fallbackFeatures: ['Ultra-Thin Body', 'Health Monitoring', 'AI Insights', 'Accurate Sleep Monitor', 'Fitness Tracking', 'Stress and Recovery', 'SpO2', 'Heart Rate', '5ATM Waterproof'],
      images: [ringLowProfile, ringHealth, ringAiHealth, ringDailySync, ringSleepHero, tfxVitalDashboard, tfxVitalAge],
      sections: [
        ['Ultra Thin Comfort Health Without Awareness', 'A precision-built ring profile keeps the product comfortable for all-day and overnight use while supporting continuous wellness monitoring.'],
        [`Explore the power of ${product.name}`, 'Daily insights from vital-sign monitoring help users understand routines, recovery, sleep quality, and wellness trends with clear app-based summaries.'],
        ['AI Health Insight, Always Helping You Achieve Better Health', 'AI-assisted reports make health trends easier to review with weekly and monthly comparisons, practical signals, and better visibility into wellness changes.'],
        ['Precise Temperature Monitoring and Wellness Trends', 'Temperature, recovery, and trend-based reporting make it easier to understand body signals and daily health changes over time.'],
        ['Family Health Sharing, Family Care Made Simple', 'Connected app workflows help users review health summaries and support family wellness with a clear, simple, shareable view.'],
      ],
    },
    fan: {
      fallbackFeatures: ['Bladeless Airflow', 'Hot and Cool Modes', 'Air Purification', 'Quiet Operation', 'Remote Control', 'Safe for Home', 'Low Maintenance', 'Modern Design'],
      images: [fanFamilyHero, fanSlideOne, fanSlideTwo, fanSlideThree, fanFamilyHero, fanSlideOne, fanSlideTwo],
      sections: [
        ['Comfortable Airflow for Every Season', 'Bladeless fan engineering supports smooth cooling, warming, and air circulation for daily home comfort.'],
        ['Designed for Safe Family Spaces', 'The bladeless structure keeps airflow comfortable while making the product easier to place around children, pets, and busy rooms.'],
        ['Purification and Fresh-Air Support', 'Selected models combine circulation with purifier-style filtration features for cleaner everyday indoor air.'],
        ['Quiet Operation for Bedrooms and Workspaces', 'Low-noise airflow makes the fan suitable for sleep, work, study, and relaxed home routines.'],
        ['Modern Controls and Flexible Use', 'Remote, touch, and app-ready control flows help users adjust speed, timer, and comfort modes quickly.'],
        ['Reliable Everyday Performance', 'Strong airflow, stable construction, and easy maintenance support long-term household use.'],
      ],
    },
    monitoring: {
      fallbackFeatures: ['Remote Monitoring', 'Health Dashboard', 'Heart Rate Insights', 'SpO2 Tracking', 'ECG Support', 'Risk Assessment', 'Cloud Sync', 'Care Reports'],
      images: [monitoringHero, monitoringHeartRate, monitoringPhonePhoto, tfxVitalDashboard, tfxVitalAge, monitoringHero, monitoringPhonePhoto],
      sections: [
        ['Remote Health Monitoring Made Practical', 'Connected monitoring tools support continuous health review, risk signals, and care workflows for home and professional use.'],
        ['Clinical-Style Signals in a Simple Flow', 'Health readings can be translated into clear summaries for users, caregivers, wellness teams, and digital health platforms.'],
        ['Cloud Dashboard and App-Based Review', 'Data sync and dashboard views help make long-term monitoring easier to understand and act on.'],
        ['Early Insight for Better Care Decisions', 'Trend-based reports can support earlier awareness around sleep, heart, recovery, and risk patterns.'],
        ['Built for Connected Health Programs', 'Monitoring products can support SDK/API integration, custom apps, and enterprise health deployments.'],
        ['Always-On Wellness Visibility', 'Reliable tracking keeps important indicators accessible across daily routines and care plans.'],
      ],
    },
    wearable: {
      fallbackFeatures: ['Health Monitoring', 'App Support', 'Sleep Tracking', 'Fitness Tracking', 'Stress Insights', 'Long Battery Life', 'Comfortable Wear', 'Connected Reports'],
      images: [displayedImages[1] || displayedImages[0], tfxVitalDashboard, tfxVitalAge, ringHealth, bandProof, monitoringPhonePhoto, ringDailySync],
      sections: [
        ['Comfortable Connected Wellness', 'A practical wearable design supports daily health tracking, app summaries, and wellness routines.'],
        ['App-Based Health Insights', 'Connected reports help users review activity, sleep, recovery, and key health signals with less friction.'],
        ['Reliable Signals for Daily Use', 'Biometric monitoring helps make wellness trends easier to understand over time.'],
        ['Built for Modern Health Programs', 'Flexible product support helps brands, wellness teams, and connected health platforms launch faster.'],
        ['Designed for Everyday Routines', 'The product balances comfort, battery, and simple app review for long-term use.'],
        ['Always-On Health Visibility', 'Continuous tracking keeps important wellness indicators available across daily life.'],
      ],
    },
  };
  const familyProfile = familyProfiles[productFamily];
  const allProductImages = [
    ...displayedImages,
    ...(product.images || []),
    ...(product.colors || []).flatMap((color) => color.images || []),
    ...(product.variants || []).flatMap((variant) => variant.images || []),
  ].filter((image) => image && !/picsum\.photos/i.test(image));
  const uniqueProductImages = Array.from(new Set(allProductImages));
  const storyImages = uniqueProductImages.length > 0
    ? Array.from({ length: 8 }, (_, index) => uniqueProductImages[index % uniqueProductImages.length])
    : familyProfile.images;
  const isDisplayProduct = /\bdisplay\b/i.test(product.name);
  const isTfxV5Band = productFamily === 'band' && /\bv5\b|\bai\s*v5\b/i.test(product.name);
  const isPremiumSmartBand = productFamily === 'band' && /premium|modern\s+fitness|smart\s+band/i.test(product.name) && !isTfxV5Band;
  const productFlipkartLink = product.marketplaceLinks?.find((link) => /flipkart/i.test(link.label) || /flipkart\.com/i.test(link.url));
  const fallbackFlipkartListings: Array<{
    family: typeof productFamily;
    match: RegExp;
    product: string;
    code: string;
    url: string;
  }> = [
    {
      family: 'band',
      match: /\bv5\b|\bai\s*v5\b/i,
      product: 'AI Smart Band V5',
      code: 'SBNHJY8KNNW3KWY4',
      url: 'https://www.flipkart.com/futurex-ai-smart-band-v5-wireless-charging-screenless-men-women/p/itmd2cf34f0308e8?pid=SBNHJY8KNNW3KWY4',
    },
    {
      family: 'band',
      match: /smart\s+fitness\s+band|premium|modern\s+fitness|smart\s+band/i,
      product: 'Smart Fitness Band',
      code: 'SBNHFR5GBADVKQ8U',
      url: 'https://www.flipkart.com/futurex-smart-fitness-band-men-women-sleep-tracking-3-5-days-battery-backup/p/itm48e5e6f8736fc?pid=SBNHFR5GBADVKQ8U',
    },
    {
      family: 'ring',
      match: /\brq11\b.*display|display.*\brq11\b/i,
      product: 'TFX RQ11 Smart Ring Display',
      code: 'STNHJKY3URWEFBBV',
      url: 'https://www.flipkart.com/futurex-tfx-rq11-smart-ring-display/p/itm0b66b77950f87?pid=STNHJKY3URWEFBBV',
    },
    {
      family: 'ring',
      match: /\brq11\b/i,
      product: 'TFX RQ11 Smart Ring',
      code: 'STNHGXDFAFGRMNFF',
      url: 'https://www.flipkart.com/futurex-tfx-rq11-smart-ring/p/itm71a8a8da3869e?pid=STNHGXDFAFGRMNFF',
    },
    {
      family: 'ring',
      match: /\bsrq11\b/i,
      product: 'TFX SRQ11 Smart Ring',
      code: 'STNHFUJZEMQPGBBK',
      url: 'https://www.flipkart.com/futurex-tfx-srq11-smart-ring/p/itmfd3d19e1e6110?pid=STNHFUJZEMQPGBBK',
    },
    {
      family: 'ring',
      match: /\bq11\b|tfxq11/i,
      product: 'TFX Q11 Smart Ring',
      code: 'STNHHGRGPGZFJG4J',
      url: 'https://www.flipkart.com/futurex-tfxq11-smart-ring/p/itmc14673293d022?pid=STNHHGRGPGZFJG4J',
    },
    {
      family: 'ring',
      match: /\bsr8\b/i,
      product: 'TFX SR8 Smart Ring',
      code: 'STNHEWD6C7FYEBGT',
      url: 'https://www.flipkart.com/futurex-tfx-sr8-smart-ring/p/itm325cbdf5b55fa?pid=STNHEWD6C7FYEBGT',
    },
    {
      family: 'ring',
      match: /\bq10\b|tfxq10/i,
      product: 'TFX Q10 Smart Ring',
      code: 'STNHGC9MUBNWSPXX',
      url: 'https://www.flipkart.com/futurex-tfxq10-smart-ring/p/itm51deb48effded?pid=STNHGC9MUBNWSPXX',
    },
    {
      family: 'ring',
      match: /display.*heart|heart.*display|water\s*resistant/i,
      product: 'Display Smart Ring Heart Rate Monitor',
      code: 'STNHHGJPPSZURFZP',
      url: 'https://www.flipkart.com/futurex-smart-ring-display-heart-rate-monitor-water-resistant/p/itmb6e4d35a87a86?pid=STNHHGJPPSZURFZP',
    },
    {
      family: 'ring',
      match: /display|fitness\s+tracker.*ring|ring.*fitness\s+tracker/i,
      product: 'Display Smart Ring',
      code: 'STNHE5HHE3RNR7PD',
      url: 'https://www.flipkart.com/futurex-display-smart-ring/p/itmc98b789a01bad?pid=STNHE5HHE3RNR7PD',
    },
    {
      family: 'ring',
      match: /ip68|touch\s+control|health\s+fitness/i,
      product: 'IP68 Waterproof Smart Ring',
      code: 'STNHFTPCFRWVPURC',
      url: 'https://www.flipkart.com/futurex-smart-ring-ip68-waterproof-health-fitness-touch-control/p/itm1e23c316ef1ea?pid=STNHFTPCFRWVPURC',
    },
    {
      family: 'ring',
      match: /stainless|5atm|gesture|smart\s+ring/i,
      product: 'Smart Ring Stainless Steel Build',
      code: 'STNHE5EHC9TW3QZN',
      url: 'https://www.flipkart.com/futurex-smart-ring-stainless-steel-build-5atm-waterproof-app-gesture-control/p/itme30f0c5daa85c?pid=STNHE5EHC9TW3QZN',
    },
    {
      family: 'fan',
      match: /tp\s*-?\s*02|tp02|3\s*-?\s*in\s*-?\s*1/i,
      product: 'TFX TP02 3-in-1 Tower Fan',
      code: 'FANHGFHRP7AZWWX7',
      url: 'https://www.flipkart.com/futurex-tfx-tp02-3-1-year-warranty-bldc-motor-tower-fan/p/itm40fc888dfc521?pid=FANHGFHRP7AZWWX7',
    },
    {
      family: 'fan',
      match: /q8\s*pro|q8/i,
      product: 'Q8 Pro Tower Fan',
      code: 'FANHE6R3DGEPYU6S',
      url: 'https://www.flipkart.com/futurex-q8-pro-6-months-warranty-tower-fan/p/itm0e517add10d0c?pid=FANHE6R3DGEPYU6S',
    },
    {
      family: 'fan',
      match: /tp\s*-?\s*09|tp09/i,
      product: 'TP09 Pro Tower Fan',
      code: 'FANHE8ZUUMNZEMYS',
      url: 'https://www.flipkart.com/futurex-tp09-pro-12-months-warranty-remote-controlled-tower-fan/p/itm63090878457ac?pid=FANHE8ZUUMNZEMYS',
    },
  ];
  const matchedFallbackFlipkartListing =
    fallbackFlipkartListings.find((listing) => listing.family === productFamily && listing.match.test(product.name));
  const flipkartListing = product.flipkartUrl || productFlipkartLink?.url
    ? {
        product: product.name,
        code: '',
        url: product.flipkartUrl || productFlipkartLink?.url || '',
      }
    : matchedFallbackFlipkartListing;
  const heroSpecProfiles = {
    band: [
      ['Battery life', product.specs?.['Battery life'] || product.specs?.Battery || product.specs?.battery || 'Up to 14 Days'],
      ['Waterproof', isPremiumSmartBand ? 'IP68' : product.specs?.Waterproof || product.specs?.WaterResistant || product.specs?.['Water Resistant'] || '5ATM'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android and iOS'],
      ['Weight', product.specs?.Weight || product.weight || 'Lightweight'],
      ['Sensors', product.specs?.Sensors || product.specs?.Hardware || 'Heart rate, SpO2, motion'],
    ],
    ring: [
      ['Battery life', product.specs?.['Battery life'] || product.specs?.Battery || product.specs?.battery || '7 Days'],
      ['Waterproof', product.specs?.Waterproof || product.specs?.WaterResistant || product.specs?.['Water Resistant'] || '5ATM'],
      ['OTA Support', product.specs?.['OTA Support'] || product.specs?.OTA || 'Support OTA via BT'],
      ['Size', product.specs?.Size || product.specs?.Width || product.weight || 'Width 8.0mm, Thickness 2.2mm (Min)'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android 5.0 or above, iOS 10.0 or above'],
    ],
    fan: [
      ['Airflow', product.specs?.Airflow || product.specs?.Speed || 'Multi-speed airflow'],
      ['Modes', product.specs?.Modes || product.specs?.Mode || 'Cool and warm'],
      ['Control', product.specs?.Control || product.specs?.Connectivity || 'Remote control'],
      ['Noise', product.specs?.Noise || 'Quiet operation'],
      ['Warranty', product.warranty || product.specs?.Warranty || 'Brand warranty'],
    ],
    monitoring: [
      ['Accuracy', product.specs?.Accuracy || product.specs?.Sensor || 'Clinical-style insights'],
      ['Connectivity', product.specs?.Connectivity || product.specs?.Bluetooth || 'Bluetooth/WiFi'],
      ['Memory', product.specs?.Memory || product.specs?.Storage || 'Long-term reports'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android and iOS'],
      ['Use Case', product.specs?.['Use Case'] || product.category || 'Health monitoring'],
    ],
    wearable: [
      ['Battery life', product.specs?.['Battery life'] || product.specs?.Battery || product.specs?.battery || 'Long battery life'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android and iOS'],
      ['Sensors', product.specs?.Sensors || product.specs?.Hardware || 'Health tracking'],
      ['Weight', product.specs?.Weight || product.weight || 'Comfortable wear'],
      ['Warranty', product.warranty || product.specs?.Warranty || 'Brand warranty'],
    ],
  } as const;
  const heroSpecs = heroSpecProfiles[productFamily].filter(([, value]) => String(value || '').trim().length > 0);
  const featureList = (product.features?.length
    ? product.features.map(cleanFeatureText).filter(Boolean)
    : familyProfile.fallbackFeatures
  ).filter((feature) => isDisplayProduct || !/\bdisplay\b/i.test(feature));
  const featurePageSize = 4;
  const visibleFeatures = featureList.slice(0, 12);
  const featurePages = Array.from(
    { length: Math.max(1, Math.ceil(visibleFeatures.length / featurePageSize)) },
    (_, index) => visibleFeatures.slice(index * featurePageSize, index * featurePageSize + featurePageSize)
  );
  const currentFeaturePage = Math.min(activeFeaturePage, featurePages.length - 1);
  const ringOverviewSections = [
    {
      title: 'Health Management and Touch Control Smart Health Ring',
      copy:
        'A compact smart ring form supports daily health management with sleep, heart rate, recovery, activity, and wellness signals in a low-profile wearable that stays comfortable through work, workouts, and overnight tracking.',
      image: ringOverviewCharging,
    },
    {
      title: '5ATM Waterproof for Daily Confidence',
      copy:
        'Waterproof protection helps the ring stay ready for sweat, splashes, rain, and daily routines while the inner sensors continue to support reliable wellness monitoring.',
      image: ringOverviewWaterproof,
    },
    {
      title: 'Multiple Finishes for Personal Style',
      copy:
        'Silver, black, and rose-gold style options make the ring easier to match with everyday wear while keeping the sensor placement focused on steady biometric signals.',
      image: ringOverviewColors,
    },
    {
      title: 'Automatic Sleep and Fitness Tracking',
      copy:
        'The ring quietly monitors sleep and activity trends, supports sport and recovery review, and turns long-term signals into practical app-based summaries for everyday decisions.',
      image: ringOverviewCharging,
    },
  ];
  const displayRingOverviewSections = [
    {
      title: 'Compact Smart Ring Watch for Modern Lifestyles',
      copy:
        'TheFutureX R11 Smart Ring Watch combines a sleek round ring design, durable alloy case, stylish steel band, and vibrant IPS color display for clear visuals and smooth touch interaction in a compact wearable.',
      image: displayRingOverviewPhone,
    },
    {
      title: 'Touch Display Control at Your Fingertips',
      copy:
        'The display ring keeps everyday controls close, helping users review key signals, manage simple tasks, and stay connected without reaching for another device every time.',
      image: displayRingOverviewTouch,
    },
    {
      title: 'Magnetic Charging and 3-5 Day Battery Life',
      copy:
        'A long-lasting battery supports up to 3 to 5 days of usage, while the magnetic charging system makes recharging simple and hassle-free for daily routines.',
      image: displayRingOverviewCharging,
    },
    {
      title: 'Everyday Health, Activity, and 1ATM Protection',
      copy:
        'Built for both men and women, the R11 supports heart-rate monitoring, sleep tracking, activity monitoring, call answering, and everyday 1ATM water resistance.',
      image: displayRingOverviewWaterproof,
    },
  ];
  const tfxV5OverviewSections = [
    {
      title: 'Vibrant Colors - Minimal Screenless Design - Stylish and Personal',
      copy:
        'TFX V5 offers stylish, vibrant bands for personalized expression. Its minimal screenless design creates an effortless wearing experience focused on precise health tracking, with heart rate, sleep, exercise intensity, and AI-driven guidance for smarter daily wellness.',
      image: tfxV5BandColors,
    },
    {
      title: 'Accurate 24/7 Multi Vital Monitoring - AI Health Protection',
      copy:
        'TFX V5 integrates professional-grade sensors with advanced AI algorithms for seamless 24/7 multi-dimensional health tracking. It monitors heart rate, blood oxygen, sleep, HRV, blood pressure insights, temperature trends, BGEM blood glucose risk, stress and mood, and women health signals with personalized guidance.',
      image: tfxV5BandModel,
    },
    {
      title: 'Waterproof Build - Daily Wear Confidence',
      copy:
        'Water-ready protection keeps TFX V5 dependable through workouts, sweat, splashes, sleep, and routine daily wear. It is designed to stay comfortable and reliable while continuously tracking the health signals that matter most.',
      image: bandProof,
    },
    {
      title: 'Long Battery Life - Steady 24/7 Monitoring',
      copy:
        'Long battery support helps TFX V5 keep wellness tracking consistent between charges, making all-day and overnight monitoring easier to trust during work, workouts, travel, and rest.',
      image: bandLongBattery,
    },
    {
      title: 'Multi-Sport Mode Monitoring and AI Coach - Smart Training Management',
      copy:
        'TFX V5 supports multi-sport monitoring with real-time exercise heart-rate zone guidance. It assesses exercise intensity, METS, strain, VO2 Max estimates, recovery status, and personalized AI training recommendations so users can manage every session scientifically.',
      image: bandScreenlessComfort,
      video: bandHeroVideo,
    },
  ];
  const premiumBandOverviewCopy =
    'Premium smart band with modern fitness tracking from The Future X, your trusted destination for innovative gadgets and modern lifestyle accessories designed for everyday convenience. The FutureX Smart Band features a sleek, lightweight, waterproof fashion-wear design with health tracking functions to support your active lifestyle. Built for daily use, it helps you stay connected with heart-rate monitoring, SpO2 tracking, sleep analysis, motion tracking, and activity insights in a comfortable wearable design. Crafted with durable materials and an elegant finish, the band is suitable for workouts, travel, office use, and everyday wear. Its IP68 waterproof protection offers resistance against sweat and splashes, while Bluetooth connectivity ensures smooth pairing with Android and iOS devices. With a rechargeable 90mAh battery that supports up to 5 to 7 days of use, smart sensors, and a user-friendly experience, this smart band combines style, comfort, health, and technology in one compact device.';
  const premiumBandOverviewSections = [
    {
      title: 'Sleek Fitness Band for Everyday Health',
      copy:
        'A sleek, lightweight smart band built for daily fitness, wellness, and lifestyle use. It supports heart-rate monitoring, SpO2 tracking, sleep analysis, activity insights, and comfortable all-day wear.',
      image: premiumBandModelBanner,
    },
    {
      title: 'Travel-Ready Comfort for Active Days',
      copy:
        'Made for active days, walks, travel, office routines, and everyday wear, the band keeps health and activity tracking comfortable without feeling bulky on the wrist.',
      image: premiumBandFashionTravel,
    },
    {
      title: 'Fashionable Unisex Style with 5-7 Day Battery',
      copy:
        'A clean unisex design pairs easily with casual, travel, workout, and office looks, while the rechargeable 90mAh battery delivers up to 5 to 7 days of dependable use between charges.',
      image: premiumBandWaterproofPool,
    },
    {
      title: 'IP68 Waterproof Wear for Poolside Moments',
      copy:
        'The waterproof build is ready for sweat, splashes, poolside moments, and active routines, helping the band stay practical for workouts, outdoor use, and daily life.',
      image: premiumBandLifestyleHiking,
    },
    {
      title: 'Smart App Health Insights',
      copy:
        'Built for practical monitoring, the band keeps health tracking simple with smart sensors, Bluetooth app connectivity, frequent measurement, cloud-based review, and smooth pairing with Android and iOS devices.',
      image: premiumBandIconBanner,
      video: bandHeroVideo,
    },
  ];
  const overviewSections: Array<{ title: string; copy: string; image?: string; video?: string }> = [
    {
      title: 'Product Overview',
      copy:
        isPremiumSmartBand
          ? premiumBandOverviewCopy
          : shortDescription || `${product.name} is designed for proactive wellness management with continuous biometric insights, everyday comfort, and connected app support.`,
    },
    ...(isTfxV5Band
      ? tfxV5OverviewSections
      : isPremiumSmartBand
        ? premiumBandOverviewSections
      : productFamily === 'ring'
        ? isDisplayProduct
          ? displayRingOverviewSections
          : ringOverviewSections
        : familyProfile.sections.map(([title, copy], index) => ({
            title,
            copy,
            image: storyImages[index + 1] || storyImages[0],
          }))),
  ];
  const productFaqs = [
    { q: 'What is the delivery timeline?', a: 'Orders are typically delivered within 3 to 7 business days.' },
    { q: 'Does this product support app sync?', a: 'Yes. Compatible products sync with the supported mobile app for reports, summaries, and wellness insights.' },
    { q: 'How do I claim warranty?', a: 'Contact support with your order ID and product details. Our team will guide you through eligible warranty support.' },
  ];
  const scrollToDetailSection = (key: ProductDetailTabKey) => {
    setActiveDetailTab(key);
    window.setTimeout(() => {
      const element = document.getElementById(key);
      if (!element) return;
      const offset = 64 + detailTabsHeight + 12;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-[#f5fbfb]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
            <Link to="/" className="hover:text-[#159c98]">Home</Link>
            <span>/</span>
            <Link to={'/shop/' + product.category?.toLowerCase()} className="capitalize hover:text-[#159c98]">{product.category}</Link>
            <span>/</span>
            <span className="max-w-[260px] truncate text-slate-900">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="bg-white px-3 py-6 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto grid w-full max-w-md gap-7 sm:max-w-2xl lg:max-w-7xl lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:items-start lg:gap-14">
          <div ref={productGalleryRef} className="scroll-mt-28 space-y-4 sm:space-y-6">
            <ProductImageCarousel
              images={displayedImages}
              videoUrl={productVideoUrl}
              alt={product.name}
              selectedIndex={selectedImageIndex}
              onSelectIndex={setSelectedImageIndex}
            />
            {displayedMediaCount > 1 && (
              <div className="mx-auto flex max-w-full snap-x justify-start gap-2 overflow-x-auto bg-white py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-3 [&::-webkit-scrollbar]:hidden">
                {displayedImages.map((imgUrl, imgIdx) => (
                  <button
                    key={imgUrl + imgIdx}
                    type="button"
                    onClick={() => setSelectedImageIndex(imgIdx)}
                    className={`h-14 w-14 shrink-0 snap-start overflow-hidden bg-white p-1.5 transition duration-200 min-[360px]:h-16 min-[360px]:w-16 sm:h-20 sm:w-20 ${
                      selectedImageIndex === imgIdx ? 'opacity-100 ring-2 ring-[#22b8b4]/45' : 'opacity-55 hover:opacity-90'
                    }`}
                  >
                    <img src={imgUrl} alt={`${product.name} ${imgIdx + 1}`} className="h-full w-full object-contain transition duration-200 hover:scale-105" loading="lazy" decoding="async" />
                  </button>
                ))}
                {productVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(productVideoIndex)}
                    className={`relative h-14 w-14 shrink-0 snap-start overflow-hidden bg-slate-950 p-0 transition duration-200 min-[360px]:h-16 min-[360px]:w-16 sm:h-20 sm:w-20 ${
                      selectedImageIndex === productVideoIndex ? 'opacity-100 ring-2 ring-[#22b8b4]/45' : 'opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`Play ${product.name} video`}
                  >
                    <video
                      src={productVideoUrl}
                      className="h-full w-full object-contain"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/20">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg min-[360px]:h-7 min-[360px]:w-7 sm:h-8 sm:w-8">
                        <svg className="ml-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 text-center lg:sticky lg:top-24 lg:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#159c98] sm:text-xs">{product.category}</p>
            <div className="mt-4 space-y-4">
              {product.colors && product.colors.length > 0 && (
                <div className="rounded-xl bg-[#f5fbfb] p-3 text-left sm:p-4">
                  <p className="mb-3 text-xs font-black text-slate-950 sm:text-sm">Select Color{selectedColor?.name ? ` - ${selectedColor.name}` : ''}</p>
                  <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name;
                      const colorStock = Number(color.stock || 0) - Number(color.reservedStock || 0);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleSelectColor(color, colorStock)}
                          disabled={colorStock <= 0}
                          className={`min-w-[112px] shrink-0 snap-start rounded-lg px-2.5 py-2 text-left transition sm:min-w-[132px] sm:px-3 ${
                            isSelected ? 'bg-[#ecfbfb] shadow-[0_8px_20px_rgba(34,184,180,0.12)] ring-2 ring-[#22b8b4]/35' : 'bg-white ring-1 ring-slate-100 hover:bg-[#f8ffff] hover:ring-[#22b8b4]/30'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: color.hex }} />
                            <span className="min-w-0 truncate text-[11px] font-bold text-slate-950 sm:text-sm">{color.name}</span>
                          </span>
                          <span className="mt-1 block text-[10px] text-slate-500 sm:text-xs">{colorStock > 0 ? `${colorStock} left` : 'Out of Stock'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresRingSize && (
                <div className="rounded-xl bg-[#f5fbfb] p-3 text-left sm:p-4">
                  <p className="mb-3 text-xs font-black text-slate-950 sm:text-sm">Select Ring Size{selectedSize ? ` - ${selectedSize}` : ' *'}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSizes.map((sizeRow) => {
                      const sizeLabel = String(sizeRow.size).trim();
                      const outOfStock = sizeRow.stock <= 0;
                      return (
                        <button
                          key={sizeLabel}
                          type="button"
                          onClick={() => {
                            if (outOfStock) return;
                            setSelectedSize(sizeLabel);
                            setSizeError('');
                          }}
                          disabled={outOfStock}
                          className={`min-w-0 rounded-lg px-2 py-2 text-center text-[10px] font-black transition sm:px-3 sm:text-sm ${
                            selectedSize === sizeLabel ? 'bg-[#ecfbfb] text-[#128b87] ring-2 ring-[#22b8b4]/35' : 'bg-white text-slate-800 ring-1 ring-slate-100 hover:ring-[#22b8b4]/30'
                          } ${outOfStock ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          {sizeLabel}
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && <p className="mt-2 text-xs font-semibold text-red-600">{sizeError}</p>}
                </div>
              )}
            </div>
            {isFeaturedBandProduct && (
              <div className="mt-4 inline-flex w-fit rounded-full bg-[#df0b16] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_22px_rgba(223,11,22,0.24)] sm:px-4 sm:text-xs">
                Limited Time Offer
              </div>
            )}
            <h1 className={`${isFeaturedBandProduct ? 'mt-3' : 'mt-4'} max-w-none text-left text-[1.55rem] font-semibold leading-[1.18] text-slate-950 [font-family:Arial,Helvetica,sans-serif] sm:text-4xl lg:text-[2.65rem]`}>
              {product.name}
            </h1>
            <p className="mt-3 max-w-none text-left text-sm font-bold leading-6 text-slate-800 sm:text-xl sm:leading-8">
              {product.features?.[0] ? cleanFeatureText(product.features[0]) : 'Ultra-Thin Wellness Wearable for Sleep, Stress & Health Tracking'}
            </p>

            <div className="mt-6 flex flex-wrap items-end justify-center gap-3 lg:justify-start">
              <span className="font-display text-3xl font-black text-slate-950 sm:text-4xl">&#8377;{salePrice.toLocaleString('en-IN')}</span>
              {mrp > salePrice && (
                <>
                  <span className="text-sm font-semibold text-slate-400 line-through sm:text-lg">&#8377;{mrp.toLocaleString('en-IN')}</span>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 sm:text-sm">{percent}% off</span>
                </>
              )}
              {isProductCouponApplied && (
                <span className="rounded-full bg-[#df0b16]/10 px-3 py-1 text-xs font-black text-[#df0b16] sm:text-sm">{productOfferCode} applied</span>
              )}
            </div>

            {couponRate > 0 && (
              <div className="mx-auto mt-4 w-full max-w-sm overflow-hidden rounded-xl border border-[#df0b16]/25 bg-white text-left shadow-[0_10px_22px_rgba(15,23,42,0.06)] sm:max-w-none lg:mx-0">
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-[#df0b16]/10 bg-[#fff8f8] px-3 py-2.5 sm:justify-start">
                  <span className="font-display text-xl font-black leading-none text-slate-950 sm:text-2xl">
                    &#8377;{displayedPrice.toLocaleString('en-IN')}
                  </span>
                  {mrp > displayedPrice && (
                    <>
                      <span className="text-xs font-bold text-slate-400 line-through sm:text-sm">&#8377;{mrp.toLocaleString('en-IN')}</span>
                      <span className="rounded-full bg-[#df0b16]/10 px-2 py-0.5 text-[10px] font-black text-[#df0b16] sm:text-xs">{displayedPercent}% off</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 bg-[#fff3f3] px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{productOfferCode}</p>
                  </div>
                  <div className="shrink-0 rounded-full bg-[#df0b16] px-2.5 py-1 text-[11px] font-black text-white">
                    {couponRateLabel} OFF
                  </div>
                </div>

                {!isProductCouponApplied ? (
                  <div className="grid border-t border-[#df0b16]/10 bg-white sm:grid-cols-[minmax(0,1fr)_112px]">
                    <div className="flex min-w-0 flex-1 bg-white px-3 py-2">
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={surprisePhone}
                        onChange={(event) => setSurprisePhone(event.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder="Enter phone number"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyProductCoupon}
                      className="bg-[#22b8b4] px-4 py-2 text-xs font-black text-white transition hover:bg-[#159c98] sm:text-sm"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-[#df0b16]/10 bg-[#fff8f8] px-3 py-2">
                    <p className="text-xs font-black text-[#df0b16] sm:text-sm">{productOfferCode} applied</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-600 sm:text-xs">Saved Rs {couponDiscount.toLocaleString('en-IN')}</p>
                  </div>
                )}
                {couponMessage && <p className={`px-3 pb-2 text-[11px] font-semibold sm:text-xs ${isProductCouponApplied ? 'text-emerald-700' : 'text-red-600'}`}>{couponMessage}</p>}
              </div>
            )}

            <div ref={mobileCtaAnchorRef} className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <button
                type="button"
                onClick={handleAddButtonClick}
                className={`min-h-12 min-w-0 rounded-lg px-4 py-3 text-center text-xs font-black leading-tight transition sm:min-h-14 sm:px-6 sm:py-4 sm:text-sm ${
                  addedToCart ? 'bg-green-600 text-white' : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {notifySubmitting ? 'Saving...' : addedToCart ? 'Added to Cart' : canAdd ? 'Add to Cart' : 'Notify me'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className="product-detail-buy-now-btn min-h-12 min-w-0 rounded-lg px-4 py-3 text-center text-xs font-black leading-tight sm:min-h-14 sm:px-6 sm:py-4 sm:text-sm"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
              {[
                ['COD Available', 'Pay on delivery'],
                ['Secure Payment', 'Trusted checkout'],
                ['Easy Return', 'Hassle-free returns'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-[#bdebea] bg-[#ecfbfb] px-3 py-3 shadow-[0_10px_24px_rgba(34,184,180,0.10)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#128b87] sm:text-xs">{title}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600 sm:text-xs">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${canAdd ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className={`text-xs font-black sm:text-sm ${canAdd ? 'text-green-700' : 'text-red-600'}`}>
                {canAdd ? `In Stock${stockCount <= 5 ? ` - Only ${stockCount} left` : ''}` : 'Out of Stock'}
              </p>
            </div>

            {flipkartListing && (
              <a
                href={flipkartListing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[#2874f0]/25 bg-[#f3f8ff] p-4 shadow-[0_14px_34px_rgba(40,116,240,0.12)] transition hover:border-[#2874f0] hover:shadow-[0_16px_38px_rgba(40,116,240,0.18)] sm:p-5"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-yellow-500">Available on Flipkart</span>
                  <span className="mt-1 block truncate text-sm font-bold text-slate-950 sm:text-base">{flipkartListing.product}</span>
                  {flipkartListing.code && (
                    <span className="mt-0.5 block text-[10px] font-semibold text-slate-500 sm:text-xs">PID: {flipkartListing.code}</span>
                  )}
                </span>
                <span className="shrink-0 rounded-xl bg-[#ffe500] px-3 py-2 text-[11px] font-black text-slate-950 transition hover:bg-[#ffd814] sm:px-4 sm:text-xs">
                  View
                </span>
              </a>
            )}

          </div>
        </div>
      </section>

      <div ref={detailTabsAnchorRef} />
      {detailTabsFixed && <div aria-hidden="true" style={{ height: detailTabsHeight }} />}
      <nav
        ref={detailTabsBarRef as React.RefObject<HTMLElement>}
        className={`product-detail-sticky-tabs border-y border-[#bdebea] bg-[#d8f5f2]/95 shadow-[0_8px_24px_rgba(15,63,70,0.08)] backdrop-blur ${
          detailTabsFixed ? 'fixed inset-x-0 top-16 z-[70]' : 'relative z-[55]'
        }`}
      >
        <div className="mx-auto flex max-w-7xl snap-x items-center justify-start overflow-x-auto px-3 text-center [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:px-6 [&::-webkit-scrollbar]:hidden">
          {detailTabs.map((tab) => (
            <a
              key={tab.key}
              href={`#${tab.key}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToDetailSection(tab.key);
              }}
              className={`product-detail-sticky-tab snap-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold tracking-wide transition sm:px-5 sm:text-base ${
                activeDetailTab === tab.key ? 'is-active border-[#16b8b0]' : 'border-transparent'
              }`}
            >
              {getDetailTabLabel(tab)}
            </a>
          ))}
        </div>
      </nav>

      <section id="features" className="scroll-mt-32 bg-white px-4 py-7 sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="sr-only">Features</h2>

          <div className="overflow-hidden lg:hidden">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentFeaturePage * 100}%)` }}>
              {featurePages.map((page, pageIndex) => (
                <div key={`feature-page-${pageIndex}`} className="grid min-w-full grid-cols-2 gap-x-8 gap-y-9 px-2">
                  {page.map((feature, index) => {
                    const visual = getFeatureVisual(feature);
                    return (
                      <article key={feature} className="text-center">
                        <div
                          className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${visual.bg} ${visual.color} animate-[featureFloat_2.6s_ease-in-out_infinite]`}
                          style={{ animationDelay: `${(pageIndex * featurePageSize + index) * 90}ms` }}
                        >
                          <div className="animate-[featurePulse_2.2s_ease-in-out_infinite]">
                            <FeatureLineIcon kind={visual.kind} />
                          </div>
                        </div>
                        <h3 className="mx-auto mt-2 max-w-[9rem] text-xs font-semibold leading-snug text-slate-700">{feature}</h3>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
            {featurePages.length > 1 && (
              <div className="mt-7 flex items-center justify-center gap-2">
                {featurePages.map((_, index) => (
                  <button
                    key={`feature-dot-${index}`}
                    type="button"
                    aria-label={`Show feature page ${index + 1}`}
                    onClick={() => setActiveFeaturePage(index)}
                    className={`h-2.5 rounded-full transition-all ${currentFeaturePage === index ? 'w-6 bg-[#22b8b4]' : 'w-2.5 bg-[#dff4f4] hover:bg-[#9de4e1]'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden grid-cols-4 gap-x-10 gap-y-14 lg:grid xl:grid-cols-6">
            {visibleFeatures.map((feature, index) => {
              const visual = getFeatureVisual(feature);
              return (
                <article key={feature} className="text-center">
                  <div
                    className={`mx-auto grid h-20 w-20 place-items-center rounded-[1.4rem] ${visual.bg} ${visual.color} animate-[featureFloat_2.6s_ease-in-out_infinite]`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="animate-[featurePulse_2.2s_ease-in-out_infinite]">
                      <FeatureLineIcon kind={visual.kind} />
                    </div>
                  </div>
                  <h3 className="mx-auto mt-4 max-w-[12rem] text-base font-semibold leading-snug text-slate-800">{feature}</h3>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {showProductOverview && (
        <>
          <section id="description" className="scroll-mt-32 bg-white px-4 py-10 sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
            <div className="mx-auto max-w-5xl">
              <article className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
                <h2 className="font-display text-2xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">Product Overview</h2>
                <div>
                  <p className={`text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 ${!isDescriptionExpanded ? 'line-clamp-6' : ''}`}>
                    {overviewSections[0].copy}
                  </p>
                  {shortDescription.length > 260 && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                      className="mt-4 text-sm font-black text-[#159c98] hover:text-slate-950"
                    >
                      {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </article>
            </div>
          </section>

          <section id="more-information" className="scroll-mt-32 bg-white px-4 pb-10 sm:scroll-mt-36 sm:px-6 lg:px-8 lg:pb-14">
            <div className="mx-auto max-w-5xl space-y-8">
              {overviewSections.slice(1).map((section, index) => (
                <article key={section.title} className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_60px_rgba(15,63,70,0.08)]">
                  {section.video ? (
                    <div className="aspect-[16/9] overflow-hidden bg-slate-950 sm:aspect-[16/7]">
                      <video
                        className="band-hero-video h-full w-full object-contain"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={section.image}
                        aria-label={section.title}
                      >
                        <source src={section.video} type="video/mp4" />
                      </video>
                    </div>
                  ) : section.image && (
                    <div className="aspect-[16/9] overflow-hidden bg-[#f8fbfb] sm:aspect-[16/7]">
                      <img src={section.image} alt={section.title} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                    </div>
                  )}
                  <div className="p-4 sm:p-7 lg:p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#159c98] sm:text-xs">0{index + 1}</p>
                    <h2 className="mt-2 font-display text-xl font-black leading-tight text-slate-950 sm:text-3xl lg:text-4xl">{section.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{section.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <section id="specs" className="scroll-mt-32 bg-[#f8fbfb] px-4 py-10 sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-black text-slate-950 sm:text-4xl lg:text-5xl">Specifications</h2>
          {specEntries.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
              {(showAllSpecs ? specEntries : specEntries.slice(0, 12)).map(([key, value]) => (
                <div key={key} className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[0.32fr_0.68fr]">
                  <p className="bg-slate-50 px-4 py-3 text-xs font-black text-slate-700 sm:px-5 sm:py-4 sm:text-sm">{formatSpecLabel(key)}</p>
                  <p className="px-4 py-3 text-xs font-semibold leading-6 text-slate-600 sm:px-5 sm:py-4 sm:text-sm">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-500">No specifications added.</p>
          )}
          {specEntries.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllSpecs((prev) => !prev)}
              className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-950 hover:border-[#22b8b4] hover:text-[#128b87] sm:px-5 sm:py-3 sm:text-sm"
            >
              {showAllSpecs ? 'See Less' : 'See More'}
            </button>
          )}
        </div>
      </section>

      <section id="faq" className="scroll-mt-32 bg-white px-4 py-10 sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl font-black text-slate-950 sm:text-4xl lg:text-5xl">FAQs</h2>
          <div className="mt-6 space-y-3">
            {productFaqs.map((item) => (
              <details key={item.q} className="rounded-[1rem] border border-slate-200 bg-[#f8fbfb] p-4 sm:p-5">
                <summary className="cursor-pointer text-sm font-black text-slate-950 sm:text-base">{item.q}</summary>
                <p className="mt-3 text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {showNotifyModal && product && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-[1.25rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Stock Alert</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Notify me</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{product.name}{selectedColor?.name ? ` - ${selectedColor.name}` : ''}</p>
              </div>
              <button type="button" onClick={() => setShowNotifyModal(false)} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black">X</button>
            </div>
            {notifyMessage && <p className={`mt-4 text-sm font-semibold ${notifyMessage.startsWith('Done') ? 'text-green-700' : 'text-red-600'}`}>{notifyMessage}</p>}
            <button type="button" onClick={() => setShowNotifyModal(false)} className="mt-5 w-full rounded-lg bg-[#22b8b4] px-4 py-3 text-sm font-black text-white">
              Close
            </button>
          </div>
        </div>
      )}

      <div className={`fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur transition-transform duration-300 sm:hidden ${showMobileStickyCta ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#159c98]">Price</p>
            <p className="truncate text-base font-black text-slate-950">&#8377;{salePrice.toLocaleString('en-IN')}</p>
            {couponRate > 0 && (surprisePriceRevealed || isProductCouponApplied) && (
              <p className="truncate text-[10px] font-bold text-emerald-700">
                Offer price: Rs {couponPrice.toLocaleString('en-IN')}
              </p>
            )}
          </div>
          <button type="button" onClick={handleAddButtonClick} className="min-h-10 min-w-[86px] rounded-lg bg-[#22b8b4] px-2.5 py-2 text-center text-[11px] font-black leading-tight text-white min-[360px]:min-w-[104px] min-[360px]:text-xs">
            {notifySubmitting ? 'Saving...' : addedToCart ? 'Added' : canAdd ? 'Add to Cart' : 'Notify me'}
          </button>
          <button type="button" onClick={handleBuyNow} disabled={!canAdd} className="product-detail-buy-now-btn min-h-10 min-w-[76px] rounded-lg px-2.5 py-2 text-center text-[11px] font-black leading-tight min-[360px]:min-w-[88px] min-[360px]:text-xs">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="product-detail-dark min-h-screen bg-dark-bg text-white">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to={'/shop/' + product.category?.toLowerCase()} className="hover:text-white transition-colors capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-200 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-28 sm:px-6 sm:pb-8 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">

          {/* Left: Image Carousel + Thumbnails */}
          <div className="w-full self-start space-y-4">
            <ProductImageCarousel
              images={displayedImages}
              videoUrl={productVideoUrl}
              alt={product.name}
              selectedIndex={selectedImageIndex}
              onSelectIndex={setSelectedImageIndex}
            />
            {displayedMediaCount > 1 && (
              <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {displayedImages.map((imgUrl, imgIdx) => (
                  <img
                    key={imgIdx}
                    src={imgUrl}
                    alt={`${product.name} ${imgIdx + 1}`}
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                    onClick={() => setSelectedImageIndex(imgIdx)}
                    className={`h-14 w-14 rounded-lg bg-black/70 object-contain p-1.5 border shrink-0 snap-start cursor-pointer transition-all duration-150 min-[360px]:h-16 min-[360px]:w-16 ${selectedImageIndex === imgIdx
                      ? 'border-primary-500 ring-2 ring-primary-400'
                      : 'border-white/10 hover:border-white/40'
                      }`}
                  />
                ))}
                {productVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(productVideoIndex)}
                    className={`relative h-14 w-14 shrink-0 snap-start overflow-hidden rounded-lg border bg-black/80 p-0 transition-all duration-150 min-[360px]:h-16 min-[360px]:w-16 ${
                      selectedImageIndex === productVideoIndex ? 'border-primary-500 ring-2 ring-primary-400' : 'border-white/10 hover:border-white/40'
                    }`}
                    aria-label={`Play ${product.name} video`}
                  >
                    <video
                      src={productVideoUrl}
                      className="h-full w-full object-contain"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg min-[360px]:h-7 min-[360px]:w-7">
                        <svg className="ml-0.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
            <div className="flex min-w-0 flex-col justify-center gap-4 self-start">

            {/* Category + Rating */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-300 bg-primary-900/30 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.rating != null && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="text-sm">
                    {'★'.repeat(Math.round(Number(product.rating || 0)))}
                    {'☆'.repeat(5 - Math.round(Number(product.rating || 0)))}
                  </span>
                  <span className="text-sm font-bold">{product.rating}</span>
                  {product.reviewCount != null && (
                    <span className="text-xs text-gray-400">({product.reviewCount} reviews)</span>
                  )}
                </div>
              )}
            </div>


            {/* Mobile: Color before title */}
            <div className="block sm:hidden">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-300">
                    Select Color{selectedColor?.name ? ` — ${selectedColor.name}` : ''}
                  </p>

                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name;
                      const colorStock = Number(color.stock || 0) - Number(color.reservedStock || 0);

                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleSelectColor(color, colorStock)}
                          disabled={colorStock <= 0}
                          aria-label={color.name + (colorStock <= 0 ? ' — Out of stock' : '')}
                          className={`min-w-[118px] shrink-0 rounded-xl border px-3 py-2.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg ${
                            isSelected ? 'border-primary-400 bg-primary-400/15 ring-1 ring-primary-300/50' : 'border-white/20 bg-white/[0.03]'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-white/50'}`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-4 w-4 shrink-0 rounded-full border border-white/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="min-w-0 truncate text-xs text-white">{color.name}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            {colorStock > 0 ? `${colorStock} left` : 'Out of Stock'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="w-full text-[1.35rem] font-medium font-display leading-[1.18] tracking-normal text-white/95 min-[360px]:text-[1.42rem] sm:text-[1.95rem] lg:text-[2.35rem] lg:leading-[1.12]">
              {product.name}
            </h1>

            {/* Desktop: Color after title */}
            <div className="hidden sm:block">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-gray-300">
                    Select Color{selectedColor?.name ? ` — ${selectedColor.name}` : ''}
                  </p>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name;
                      const colorStock = Number(color.stock || 0) - Number(color.reservedStock || 0);

                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleSelectColor(color, colorStock)}
                          disabled={colorStock <= 0}
                          aria-label={color.name + (colorStock <= 0 ? ' — Out of stock' : '')}
                          className={`min-w-[128px] flex-1 rounded-xl border px-3 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg sm:flex-none sm:px-4 ${
                            isSelected ? 'border-primary-500 bg-primary-900/20' : 'border-white/20'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-white/50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-white/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="min-w-0 truncate text-sm text-white">{color.name}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            {colorStock > 0 ? `${colorStock} left` : 'Out of Stock'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {requiresRingSize && (
              <div>
                <p className="mb-3 text-sm font-semibold text-gray-300">
                  Select Ring Size{selectedSize ? ` - ${selectedSize}` : ' *'}
                </p>
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-3">
                  {availableSizes.map((sizeRow) => {
                    const sizeLabel = String(sizeRow.size).trim();
                    const isSelected = selectedSize === sizeLabel;
                    const outOfStock = sizeRow.stock <= 0;
                    return (
                      <button
                        key={sizeLabel}
                        type="button"
                        onClick={() => {
                          if (outOfStock) return;
                          setSelectedSize(sizeLabel);
                          setSizeError('');
                        }}
                        disabled={outOfStock}
                        className={`min-w-0 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg sm:px-4 ${
                          isSelected ? 'border-primary-500 bg-primary-900/20' : 'border-white/20'
                        } ${outOfStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-white/50'}`}
                        aria-label={`Size ${sizeLabel}${outOfStock ? ' - Out of stock' : ''}`}
                      >
                        <p className="text-sm font-semibold text-white">{sizeLabel}</p>
                        <p className="text-xs text-gray-400">{outOfStock ? 'Out of Stock' : `${sizeRow.stock} left`}</p>
                      </button>
                    );
                  })}
                </div>
                {sizeError && <p className="mt-2 text-xs text-red-400">{sizeError}</p>}
              </div>
            )}

            {/* Price */}
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <span className="text-2xl font-bold font-display text-white min-[360px]:text-3xl sm:text-4xl">
                &#8377;{salePrice.toLocaleString('en-IN')}
              </span>
              {mrp > salePrice && (
                <>
                  <span className="text-sm text-gray-400 line-through sm:text-lg">&#8377;{mrp.toLocaleString('en-IN')}</span>
                  <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-bold text-green-400 sm:text-sm">
                    {percent}% off
                  </span>
                </>
              )}
            </div>
            {savings > 0 && (
              <p className="text-sm text-green-400 -mt-2">
                You save &#8377;{savings.toLocaleString('en-IN')}
              </p>
            )}

            <div ref={mobileCtaAnchorRef} className="flex flex-col gap-3 sm:hidden">
              <button
                type="button"
                onClick={handleAddButtonClick}
                className={[
                  'product-detail-add-cart-btn min-h-12 w-full rounded-2xl px-4 py-3 text-center text-sm font-bold leading-tight transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'border border-violet-300/40 bg-white text-black'
                    : addedToCart
                      ? 'bg-green-500 text-white'
                      : 'border border-cyan-400/30 bg-gradient-to-r from-[#0b2a6e] via-[#0d3f9f] to-[#1167c7] text-white shadow-lg shadow-cyan-700/30',
                ].join(' ')}
              >
                {notifySubmitting ? 'Saving...' : addedToCart ? 'Added to Cart' : canAdd ? 'Add to Cart' : 'Notify me'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className={[
                  'product-detail-buy-now-btn min-h-12 w-full rounded-2xl px-4 py-3 text-center text-sm font-bold leading-tight transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : '',
                ].join(' ')}
              >
                Buy Now
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-200">Stock Info</p>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${canAdd ? 'bg-green-400' : 'bg-red-500'}`} />
                <p className={`text-sm font-medium ${canAdd ? 'text-green-400' : 'text-red-400'}`}>
                  {canAdd
                    ? `In Stock${stockCount <= 5 ? ' — Only ' + stockCount + ' left!' : stockCount < 999 ? ` (${stockCount} available)` : ''}`
                    : 'Out of Stock'}
                </p>
              </div>
              {product.warranty && (
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Warranty:</span> {product.warranty}
                </p>
              )}
            </div>

            {/* CTA Buttons — kept exactly in Code 1's position */}
            <div className="hidden grid-cols-2 gap-3 sm:mt-2 sm:grid">
              <button
                type="button"
                onClick={handleAddButtonClick}
                className={[
                  'product-detail-add-cart-btn min-h-14 min-w-0 rounded-2xl px-4 py-4 text-center text-sm font-bold leading-tight transition-all duration-200 lg:px-6 lg:text-base',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'border border-violet-300/40 bg-white text-black hover:bg-violet-100 active:scale-[0.98]'
                    : addedToCart
                      ? 'bg-green-500 text-white scale-[0.98]'
                      : 'border border-cyan-800/40 bg-gradient-to-r from-[#0b1224] to-[#122342] text-cyan-100 shadow-lg shadow-black/35 hover:from-[#101a32] hover:to-[#17305a] active:scale-[0.98]',
                ].join(' ')}
              >
                {notifySubmitting ? 'Saving...' : addedToCart ? '✓ Added to Cart!' : canAdd ? 'Add to Cart' : 'Notify me'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className={[
                  'product-detail-buy-now-btn min-h-14 min-w-0 rounded-2xl px-4 py-4 text-center text-sm font-bold leading-tight transition-all duration-200 lg:px-6 lg:text-base',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : '',
                ].join(' ')}
              >
                Buy Now
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-4 sm:gap-2.5">
              {infoBadges.map((badge) => (
                <div
                  key={badge.title}
                  className="rounded-lg border border-white/10 bg-gradient-to-br from-white/7 via-white/4 to-white/[0.02] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)] sm:rounded-xl sm:p-2.5"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-primary-400/20 bg-gradient-to-br from-primary-500/18 via-cyan-400/10 to-violet-500/18 text-primary-200 shadow-[0_6px_18px_rgba(59,130,246,0.14)] sm:h-7 sm:w-7 sm:rounded-lg">
                      <DetailIcon kind={badge.icon} />
                    </span>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-primary-200 sm:text-[10px]">
                      {badge.title}
                    </p>
                  </div>
                  <p className="mt-1 text-[9px] leading-4 text-gray-300 sm:text-[10px] sm:leading-4">
                    {badge.text}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Product Details Tabs (Code 2 style) ── */}
        <section className="mt-8">

          {/* Tab Bar */}
          <div ref={detailTabsAnchorRef} />
          {detailTabsFixed && <div aria-hidden="true" style={{ height: detailTabsHeight }} />}
          <div
            ref={detailTabsBarRef as React.RefObject<HTMLDivElement>}
            className={`product-detail-sticky-tabs mb-5 border-y border-[#bdebea] bg-[#d8f5f2]/95 shadow-[0_8px_24px_rgba(15,63,70,0.08)] backdrop-blur ${
              detailTabsFixed ? 'fixed inset-x-0 top-16 z-[70]' : '-mx-4 relative z-[55] sm:-mx-6 lg:-mx-8'
            }`}
          >
              <div className="mx-auto flex max-w-7xl snap-x overflow-x-auto px-3 text-center [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => scrollToDetailSection(tab.key)}
                    className={`product-detail-sticky-tab shrink-0 snap-center border-b-2 px-4 py-3 text-sm font-semibold transition sm:px-5 ${
                      activeDetailTab === tab.key
                        ? 'is-active border-[#16b8b0]'
                        : 'border-transparent'
                    }`}
                  >
                    {getDetailTabLabel(tab)}
                  </button>
                ))}
              </div>
          </div>

          {/* Description Tab */}
          {activeDetailTab === 'description' && (
            <div id="description" className="scroll-mt-32 rounded-xl border border-white/10 bg-white/5 p-4 sm:scroll-mt-36 sm:p-5">
              {product.description ? (
                <>
                  <div>
                    <div className="relative min-w-0">
                      <div
                        className={`product-detail-description-body text-sm text-gray-300 leading-6 space-y-3 overflow-hidden transition-all duration-300
      ${!isDescriptionExpanded ? 'max-h-[88px] sm:max-h-[132px]' : 'max-h-[5000px]'}`}
                      >
                        <div
                          className="[&_p]:mb-3 
      [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-4
      [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-3
      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
      [&_strong]:text-white"
                          dangerouslySetInnerHTML={{
                            __html: product.description,
                          }}
                        />
                      </div>

                      {/* Fade effect when collapsed */}
                      {!isDescriptionExpanded && (
                        <div className="product-detail-description-fade absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent pointer-events-none sm:h-14" />
                      )}
                    </div>

                  </div>

                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(prev => !prev)}
                    className="mt-2 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-primary-300 transition-colors hover:bg-white/10 hover:text-primary-200 sm:mt-3 sm:py-2 sm:text-xs"
                  >
                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                  </button>

                  {product.reviews && product.reviews.length > 0 && (
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-white">Ratings and reviews</p>
                          <p className="mt-1 text-sm text-gray-400">Latest buyer feedback for this product.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveDetailTab('reviews')}
                          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                        >
                          View all
                        </button>
                      </div>
                      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                        {product.reviews.slice(0, 3).map((review, i) => (
                          <article key={i} className="w-[240px] shrink-0 rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <svg key={s} className={'h-3.5 w-3.5 ' + (s < review.rating ? 'fill-current' : 'text-gray-600 fill-current')} viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <p className="mt-3 text-sm font-semibold text-white">{review.name}</p>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-300">{review.comment}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No description available.</p>
              )}
            </div>
          )}

          {/* Features Tab */}
          {activeDetailTab === 'features' && (
            <div id="features" className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/5 p-5 sm:scroll-mt-36">
              {product.features && product.features.length > 0 ? (
                product.features.some((feature) => numberedFeaturePattern.test(feature)) ? (
                  <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-300 marker:text-primary-400">
                    {product.features.map((feature, i) => (
                      <li key={i} className="pl-1">
                        {cleanFeatureText(feature)}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <ul className="list-disc space-y-3 pl-5 text-sm text-gray-300 marker:text-primary-400">
                    {product.features.map((feature, i) => (
                      <li key={i} className="pl-1">
                        {cleanFeatureText(feature)}
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="text-sm text-gray-500">No key features added.</p>
              )}
            </div>
          )}

          {/* Specs Tab */}
          {activeDetailTab === 'specs' && (
            <div id="specs" className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/5 p-5 sm:scroll-mt-36">
              {specEntries.length > 0 ? (
                <div className="space-y-5">
                  {topSpecEntries.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {topSpecEntries.map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {formatSpecLabel(key)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-100">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {visibleSpecEntries.map(([key, value], index) => (
                      <div
                        key={key}
                        className={`grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-4 ${
                          index !== visibleSpecEntries.length - 1 ? 'border-b border-white/10' : ''
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {formatSpecLabel(key)}
                        </p>
                        <p className="text-sm font-medium leading-6 text-gray-100">{value}</p>
                      </div>
                    ))}
                  </div>

                  {specEntries.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSpecs((prev) => !prev)}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-primary-300 hover:bg-white/10"
                    >
                      {showAllSpecs ? 'See Less' : 'See More'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specifications added.</p>
              )}
            </div>
          )}

          {/* FAQ Tab */}
          {activeDetailTab === 'faq' && (
            <div id="faq" className="scroll-mt-32 space-y-3 sm:scroll-mt-36">
              {[
                { q: 'What is the delivery timeline?', a: 'Orders are typically delivered within 3 to 7 business days.' },
                { q: 'Is there a replacement policy?', a: 'Eligible products can be replaced within policy terms for manufacturing defects.' },
                { q: 'How do I claim warranty?', a: 'Contact support with your order ID and product details.' },
              ].map((item, i) => (
                <details key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 group">
                  <summary className="cursor-pointer font-medium text-sm text-white list-none flex items-center justify-between">
                    {item.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">↓</span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-300 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          )}

          {/* Reviews Tab */}
          {activeDetailTab === 'reviews' && (
            <div>
              <form onSubmit={handleSubmitReview} className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Write a Review</h3>
                    <p className="mt-1 text-sm text-gray-400">Share your experience with this product.</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const star = index + 1;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-2xl leading-none transition hover:scale-110"
                          aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                        >
                          {star <= reviewRating ? '★' : '☆'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Name</span>
                    <input
                      value={reviewName}
                      onChange={(event) => setReviewName(event.target.value)}
                      placeholder="Eg: Rahul Sharma"
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReviewImageSelect}
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1 file:text-sm file:font-semibold file:text-black"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">You can add only 2 images.</p>
                {reviewImagePreviews.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {reviewImagePreviews.map(({ file, url }) => (
                      <img
                        key={`${file.name}_${file.size}`}
                        src={url}
                        alt={file.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                      />
                    ))}
                  </div>
                )}
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Review Description</span>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Eg: The product quality is good, delivery was fast, and it works smoothly."
                    className="min-h-[110px] w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </label>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {reviewMessage ? <p className="text-sm text-cyan-300">{reviewMessage}</p> : <span />}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>

              {product.reviews && product.reviews.length > 0 ? (
                <div className="-mx-5 mb-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
                  {product.reviews.slice(0, visibleReviewCount).map((review, i) => (
                    <article key={i} className="w-[82vw] max-w-[320px] shrink-0 snap-start rounded-xl border border-white/10 bg-white/5 p-4 sm:w-auto sm:max-w-none">
                      {review.verifiedBuyer && (
                        <span className="mb-2 inline-flex rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-300">
                          Genuine Buyer
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-amber-400 text-sm mb-2">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <svg
                            key={s}
                            className={'w-3.5 h-3.5 ' + (s < review.rating ? 'fill-current' : 'text-gray-600 fill-current')}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-white truncate">{review.name}</p>
                        {review.date && <p className="text-xs text-gray-500 shrink-0">{review.date}</p>}
                      </div>
                      <p className="text-sm text-gray-300 break-words leading-relaxed">{review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {review.images.slice(0, 2).map((image) => (
                            <img
                              key={image}
                              src={image}
                              alt={`${review.name} review`}
                              loading="lazy"
                              decoding="async"
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-6">No reviews yet.</p>
              )}

              {product.reviews && product.reviews.length > 4 && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleReviewCount((prev) =>
                      prev < (product.reviews?.length ?? 0)
                        ? Math.min(prev + 4, product.reviews?.length ?? 0)
                        : 4
                    )
                  }
                  className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  {visibleReviewCount < (product.reviews?.length ?? 0) ? 'Show More Reviews' : 'Show Less'}
                </button>
              )}
            </div>
          )}
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-14 border-t border-white/10 pt-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-300">You may also like</p>
                <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">More Products</h2>
              </div>
              <Link
                to="/shop/all"
                className="text-sm font-semibold text-primary-300 transition-colors hover:text-primary-200"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  compact
                  imageAspectClassName="aspect-[4/3]"
                  disableHoverEffects
                />
              ))}
            </div>
          </section>
        )}
        {showNotifyModal && product && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02040a]/75 px-4 backdrop-blur-md">
            <div className="w-full max-w-sm overflow-hidden rounded-[26px] border border-violet-300/20 bg-gradient-to-br from-[#17061f] via-[#0a1020] to-[#071922] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="pointer-events-none absolute" />
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-400/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-violet-200">
                  Stock Alert
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.9)]" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-200">Out of stock</p>
                  <h3 className="mt-2 text-xl font-bold text-white">Notify me</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    {product.name}
                    {selectedColor?.name ? ` - ${selectedColor.name}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-gray-200 transition hover:border-violet-300/30 hover:bg-violet-400/10"
                  aria-label="Close notify me popup"
                >
                  X
                </button>
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-black/20 p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-violet-100">
                    <DetailIcon kind="support" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">We will message you once it is back</p>
                    <p className="mt-1 text-xs leading-5 text-gray-300">Your alert request will be saved for this product variant.</p>
                  </div>
                </div>
              </div>
              {notifyMessage && (
                <p className={`mt-3 text-sm ${notifyMessage.startsWith('Done') ? 'text-green-300' : 'text-rose-300'}`}>
                  {notifyMessage}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="mt-5 w-full rounded-xl border border-violet-200/20 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(168,85,247,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div
          className={`fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-[#050816]/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 sm:hidden ${
            showMobileStickyCta ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-300">Price</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="truncate text-base font-bold text-white">&#8377;{salePrice.toLocaleString('en-IN')}</span>
                {mrp > salePrice && (
                  <span className="truncate text-[10px] text-gray-400 line-through">&#8377;{mrp.toLocaleString('en-IN')}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddButtonClick}
              className={[
                'min-h-10 min-w-[86px] rounded-xl px-2.5 py-2 text-center text-[11px] font-bold leading-tight transition-all duration-200 min-[360px]:min-w-[104px] min-[360px]:text-xs',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                !canAdd
                  ? 'border border-violet-300/40 bg-white text-black'
                  : addedToCart
                    ? 'bg-green-500 text-white'
                    : 'border border-cyan-800/40 bg-gradient-to-r from-[#0b1224] to-[#122342] text-cyan-100 shadow-lg shadow-black/35',
              ].join(' ')}
            >
              {notifySubmitting ? 'Saving...' : addedToCart ? 'Added' : canAdd ? 'Add to Cart' : 'Notify me'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canAdd}
              className={[
                'product-detail-buy-now-btn min-h-10 min-w-[76px] rounded-xl px-2.5 py-2 text-center text-[11px] font-bold leading-tight transition-all duration-200 min-[360px]:min-w-[88px] min-[360px]:text-xs',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                !canAdd
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : '',
              ].join(' ')}
            >
              Buy Now
            </button>
          </div>
=======
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  // Renamed to activeIndex to reflect that it can be an image or video
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Error state and Fallback state
  const [videoError, setVideoError] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  
  // Ref for video element to control playback
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      getProductById(id).then(p => {
        setProduct(p);
        setLoading(false);
      });
    }
  }, [id]);

  // Reset states when product changes
  useEffect(() => {
      setVideoError(false);
      setUseIframeFallback(false);
  }, [product]);

  // Effect to manage video playback based on visibility
  useEffect(() => {
      // Check if we should try to play the native video
      const shouldPlayNative = product?.videoUrl && !useIframeFallback && !videoError;
      
      if (shouldPlayNative && videoRef.current) {
          const videoIndex = product!.images.length;
          
          if (activeIndex === videoIndex) {
              // Video is active: Play it
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.then(() => {
                      setIsPlaying(true);
                  }).catch(error => {
                      // Autoplay often fails if not muted, or if user hasn't interacted. This is normal.
                      console.log("Autoplay prevented/paused:", error);
                      setIsPlaying(false);
                  });
              }
          } else {
              // Video is hidden: Pause it
              videoRef.current.pause();
              setIsPlaying(false);
          }
      }
  }, [activeIndex, product, videoError, useIframeFallback]);

  const handleManualPlay = () => {
      if (videoRef.current) {
          videoRef.current.play().catch(e => console.error("Play failed", e));
          setIsPlaying(true);
      }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(product);
    navigate('/checkout');
  };

  const handleAddToCart = () => {
      if(!user) {
          navigate('/login');
          return;
      }
      if(product) addToCart(product);
  }

  // Robust helper to convert various URL formats to embeddable versions
  const getEmbedUrl = (url: string) => {
      if (!url) return '';
      
      // YouTube Standard
      if (url.includes('youtube.com/watch?v=')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`;
      } 
      // YouTube Short
      else if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`;
      }
      // YouTube Shorts URL
      else if (url.includes('youtube.com/shorts/')) {
          const videoId = url.split('shorts/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`;
      }
      // Vimeo
      else if (url.includes('vimeo.com/')) {
          // Extract ID (handles vimeo.com/123456)
          const match = url.match(/vimeo\.com\/(\d+)/);
          if (match && match[1]) {
             return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`;
          }
      }
      
      return url;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:text-white">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center dark:text-white">Product not found</div>;

  const hasVideo = !!product.videoUrl;
  const mediaCount = product.images.length + (hasVideo ? 1 : 0);
  
  // Initial check: is it obviously an external link?
  const isObviousEmbed = product.videoUrl && (
      product.videoUrl.includes('youtube') || 
      product.videoUrl.includes('youtu.be') || 
      product.videoUrl.includes('vimeo')
  );

  // Determine if we show Iframe or Native Video
  const showIframe = isObviousEmbed || useIframeFallback;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev === mediaCount - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev === 0 ? mediaCount - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Media Gallery (Images + Video) */}
        <div className="space-y-6">
          <div className="aspect-square bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative group border border-gray-100 dark:border-white/10 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-0">
            
            {/* Image Layer */}
            {/* When active, Image is z-10. When inactive, z-0 and opacity-0 */}
            <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${activeIndex < product.images.length ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                {activeIndex < product.images.length && (
                    <img 
                        src={product.images[activeIndex]} 
                        alt={product.name} 
                        className="w-full h-full object-cover p-8 hover:scale-105 transition-transform duration-500" 
                    />
                )}
            </div>

            {/* Video Layer */}
            {hasVideo && (
                <div 
                    className={`absolute inset-0 w-full h-full bg-black flex items-center justify-center transition-all duration-300
                    ${activeIndex === product.images.length ? 'opacity-100 z-30 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                    {showIframe ? (
                         activeIndex === product.images.length && (
                            <iframe 
                                className="w-full h-full"
                                src={getEmbedUrl(product.videoUrl!)} 
                                title="Product Video" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                         )
                    ) : (
                        <div className="relative w-full h-full">
                            {videoError ? (
                                /* Fallback View when Video Fails (Final Error State) */
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-50 p-6 text-center">
                                     {product.images[0] && (
                                         <img src={product.images[0]} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" alt="" />
                                     )}
                                     <div className="relative z-10 flex flex-col items-center p-6 bg-white/90 dark:bg-black/80 backdrop-blur rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
                                         <svg className="w-12 h-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                         <p className="font-bold text-gray-900 dark:text-white text-lg">
                                             {product.videoUrl?.startsWith('blob:') ? "Session Video Expired" : "Video Unavailable"}
                                         </p>
                                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[200px]">
                                             {product.videoUrl?.startsWith('blob:') 
                                                ? "This temporary video was lost on refresh. Please re-upload it in Admin."
                                                : "The video link could not be loaded."
                                             }
                                         </p>
                                         {!product.videoUrl?.startsWith('blob:') && (
                                             <a 
                                                href={product.videoUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="mt-4 text-xs text-primary-500 hover:underline"
                                             >
                                                 Try Direct Link
                                             </a>
                                         )}
                                     </div>
                                </div>
                            ) : (
                                <>
                                <video 
                                    ref={videoRef}
                                    key={product.videoUrl} // Forces re-render if URL changes
                                    className="w-full h-full object-contain" 
                                    controls={activeIndex === product.images.length}
                                    src={product.videoUrl}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    poster={product.images[0]}
                                    // Error Handler
                                    onError={(e) => {
                                        console.error("Video Tag Error Event:", e.currentTarget.error);
                                        // If it's a blob, it's definitely expired/dead.
                                        if (product.videoUrl?.startsWith('blob:')) {
                                            setVideoError(true);
                                        } 
                                        // If it looks like a YouTube/Vimeo link that was pasted as a direct URL, try iframe
                                        else if (product.videoUrl?.includes('youtube') || product.videoUrl?.includes('vimeo')) {
                                            console.warn("Attempting iframe fallback for video...");
                                            setUseIframeFallback(true);
                                        }
                                        // Otherwise, it's likely a CORS or 403 error on a direct file
                                        else {
                                            setVideoError(true);
                                        }
                                    }}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                >
                                    Your browser does not support the video tag.
                                </video>
                                
                                {/* Manual Play Button Overlay */}
                                {activeIndex === product.images.length && !isPlaying && !videoError && !useIframeFallback && (
                                    <div 
                                        className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-40 group/play"
                                        onClick={handleManualPlay}
                                    >
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover/play:scale-110 transition-transform shadow-xl border border-white/30">
                                            <svg className="w-10 h-10 text-white fill-current ml-1" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Navigation arrows - z-index 40 to stay above video */}
            {mediaCount > 1 && (
                <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-800 dark:text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-40"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-800 dark:text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-40"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                </>
            )}
          </div>

          {/* Thumbnails Strip */}
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Image Thumbnails */}
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all relative ${activeIndex === idx ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-transparent bg-gray-100 dark:bg-white/5'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}

            {/* Video Thumbnail */}
            {hasVideo && (
                <button 
                  onClick={() => setActiveIndex(product.images.length)}
                  className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all relative flex items-center justify-center bg-gray-900 ${activeIndex === product.images.length ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-transparent'}`}
                >
                   {/* Use first image as background for video thumbnail with overlay */}
                   <img src={product.images[0] || 'https://picsum.photos/400'} alt="Video" className="w-full h-full object-cover opacity-50" />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                           <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                               <path d="M8 5v14l11-7z" />
                           </svg>
                       </div>
                   </div>
                   <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                       VIDEO
                   </div>
                </button>
            )}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col pt-4">
           <span className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-[0.2em] text-sm mb-4 font-display block">{product.category}</span>
           <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-display leading-tight">{product.name}</h1>
           
           <div className="flex items-center mb-8">
             <div className="flex text-amber-400 mr-3 gap-1">
               {[...Array(5)].map((_, i) => (
                 <span key={i} className="text-xl">{i < Math.floor(product.rating) ? '★' : '☆'}</span>
               ))}
             </div>
             <span className="text-gray-500 dark:text-gray-400 font-medium text-sm border-l border-gray-300 dark:border-gray-700 pl-3">{product.reviewCount} verified reviews</span>
           </div>

           <p className="text-gray-600 dark:text-gray-300 text-lg mb-10 leading-relaxed font-light">
             {product.description}
           </p>

           <div className="text-5xl font-bold text-gray-900 dark:text-white mb-10 font-display">
             ₹{product.price}
           </div>

           <div className="grid grid-cols-2 gap-4 mb-10">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">{key}</span>
                  <span className="block font-semibold text-gray-900 dark:text-white font-display">{val}</span>
                </div>
              ))}
              {product.warranty && (
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20">
                  <span className="block text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-bold mb-1">Warranty</span>
                  <span className="block font-semibold text-purple-900 dark:text-purple-200 font-display">{product.warranty}</span>
                </div>
              )}
           </div>

           <div className="flex flex-col sm:flex-row gap-4 mt-auto">
             <Button size="lg" onClick={handleAddToCart} className="flex-1 rounded-full h-14 font-display tracking-wide text-lg shadow-xl shadow-primary-500/20">Add to Cart</Button>
             <Button size="lg" variant="secondary" onClick={handleBuyNow} className="flex-1 rounded-full h-14 font-display tracking-wide text-lg">Buy Now</Button>
           </div>
           
           <div className="mt-12 pt-10 border-t border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 font-display">Key Features</h3>
              <ul className="space-y-4">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600 dark:text-gray-300">
                      <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
           </div>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
