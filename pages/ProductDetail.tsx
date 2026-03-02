import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ProductPublicReview, ProductVariantOption } from '../types';
import { getProductById, getProducts } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { ProductImageCarousel } from '../components/ProductImageCarousel';
import { Button } from '../components/ui/Button';

interface ProductReviewStorageItem {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

interface DisplayReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
}

interface DisplayVariant {
  color: string;
  price: number;
  images: string[];
  sizes: string[];
  videoUrl?: string;
  hex?: string;
}

const VIDEO_REGEX = /\.(mp4|webm|ogg|mov|m4v)$/i;
const REVIEW_WORD_THRESHOLD = 200;
const REVIEW_CHAR_THRESHOLD = 220;

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [visibleReviewCount, setVisibleReviewCount] = useState(4);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'description' | 'features' | 'specs' | 'faq' | 'reviews'>('description');

  const [storedReviews, setStoredReviews] = useState<ProductReviewStorageItem[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
  const [expandedReviewIds, setExpandedReviewIds] = useState<string[]>([]);

  const isVideoUrl = useCallback((url: string) => VIDEO_REGEX.test(url), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getProductById(id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!product?.id) {
      setStoredReviews([]);
      return;
    }
    const raw = localStorage.getItem(`product_reviews_${product.id}`);
    setStoredReviews(raw ? (JSON.parse(raw) as ProductReviewStorageItem[]) : []);
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    getProducts()
      .then((all) => {
        const next = all
          .filter((p) => p.id !== product.id)
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 4);
        setRecommendedProducts(next);
      })
      .catch(() => setRecommendedProducts([]));
  }, [product?.id]);

  const allVariants = useMemo<DisplayVariant[]>(() => {
    if (!product) return [];

    const normalizeSizes = (sizes: string[]) => Array.from(new Set(sizes.filter(Boolean)));
    const allVariationSizes = normalizeSizes((product.variations || []).map((v) => String(v.size || '')).filter(Boolean));
    const basePrice = Number(product.salePrice || product.price || 0);

    const getSizesForColor = (colorName: string) => {
      const exact = normalizeSizes(
        (product.variations || [])
          .filter((v) => (v.color || '').toLowerCase() === colorName.toLowerCase())
          .map((v) => String(v.size || ''))
          .filter(Boolean)
      );
      if (exact.length) return exact;
      if (allVariationSizes.length) return allVariationSizes;
      return ['Standard'];
    };

    if (product.variants?.length) {
      return product.variants.map((variant: ProductVariantOption) => ({
        color: variant.color,
        price: Number(variant.price || basePrice),
        images: variant.images?.length ? variant.images : product.images,
        sizes: variant.sizes?.length ? normalizeSizes(variant.sizes) : getSizesForColor(variant.color),
        videoUrl: variant.videoUrl || product.videoByColor?.[variant.color] || '',
        hex: variant.hex || product.colors?.find((c) => c.name === variant.color)?.hex,
      }));
    }

    if (product.colors?.length) {
      return product.colors.map((color) => ({
        color: color.name,
        price: Number(product.prices?.[color.name] || basePrice),
        images: color.images?.length ? color.images : product.imagesByColor?.[color.name] || product.images,
        sizes: getSizesForColor(color.name),
        videoUrl: product.videoByColor?.[color.name] || '',
        hex: color.hex,
      }));
    }

    return [
      {
        color: 'Default',
        price: basePrice,
        images: product.images?.length ? product.images : ['https://picsum.photos/700'],
        sizes: allVariationSizes.length ? allVariationSizes : ['Standard'],
        videoUrl: product.videoUrl || '',
        hex: '#9CA3AF',
      },
    ];
  }, [product]);

  const normalizedCategory = (product?.category || '').toLowerCase();
  const isRingProduct = normalizedCategory.includes('ring');
  const isBandProduct = normalizedCategory.includes('band');
  const isFanProduct = normalizedCategory.includes('fan');
  const isMonitoringProduct = normalizedCategory.includes('monitor');

  const selectedVariant = useMemo(() => {
    if (!allVariants.length) return undefined;
    return allVariants.find((variant) => variant.color === selectedColor) || allVariants[0];
  }, [allVariants, selectedColor]);

  const mediaItems = useMemo(() => {
    if (!selectedVariant) return [] as { url: string; type: 'image' | 'video' }[];
    const urls = [...(selectedVariant.images || []), ...(selectedVariant.videoUrl ? [selectedVariant.videoUrl] : [])];
    const deduped = Array.from(new Set(urls.filter(Boolean)));
    return deduped.map((url) => ({ url, type: isVideoUrl(url) ? 'video' : 'image' as const }));
  }, [selectedVariant, isVideoUrl]);

  useEffect(() => {
    if (!allVariants.length) return;
    const initial = allVariants[0];
    setSelectedColor(initial.color);
    setSelectedSize(initial.sizes[0] || '');
    setCurrentPrice(initial.price);
    setVisibleReviewCount(4);
    setIsDescriptionExpanded(false);
    setActiveDetailTab('description');
  }, [product?.id, allVariants]);

  useEffect(() => {
    if (!selectedVariant) return;
    if (selectedVariant.sizes.length > 0 && !selectedVariant.sizes.includes(selectedSize)) {
      setSelectedSize(selectedVariant.sizes[0]);
    }
  }, [selectedVariant, selectedSize]);

  useEffect(() => {
    if (!selectedVariant || !product) return;
    let nextPrice = Number(selectedVariant.price || product.salePrice || product.price || 0);
    if (selectedSize && product.variations?.length) {
      const strictMatch =
        product.variations.find(
          (variation) =>
            String(variation.size || '') === selectedSize &&
            (!variation.color || variation.color.toLowerCase() === selectedVariant.color.toLowerCase())
        ) || product.variations.find((variation) => String(variation.size || '') === selectedSize);
      if (strictMatch?.price) nextPrice = Number(strictMatch.price);
    }
    setCurrentPrice(nextPrice);
  }, [product, selectedVariant, selectedSize]);

  const reviews = useMemo<DisplayReview[]>(() => {
    const fromProduct = (product?.reviews || []).map((review: ProductPublicReview) => ({
      id: `seed_${review.name}_${review.date || 'recent'}`,
      name: review.name,
      rating: Number(review.rating || 0),
      date: review.date || 'Recent',
      comment: review.comment || '',
      images: [],
    }));
    const fromStorage = storedReviews.map((review) => ({
      id: review.id,
      name: review.userName,
      rating: Number(review.rating || 0),
      date: new Date(review.createdAt).toLocaleDateString(),
      comment: review.comment || '',
      images: review.images || [],
    }));
    return [...fromStorage, ...fromProduct];
  }, [product?.reviews, storedReviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const displayedReviews = useMemo(() => reviews.slice(0, visibleReviewCount), [reviews, visibleReviewCount]);

  const descriptionText = useMemo(
    () => (product?.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    [product?.description]
  );

  const canAddMoreReviews = visibleReviewCount < reviews.length;
  const canShowLessReviews = reviews.length > 4 && visibleReviewCount >= reviews.length;
  const isLongReview = useCallback((comment: string) => {
    const wordCount = comment.trim().split(/\s+/).filter(Boolean).length;
    return wordCount >= REVIEW_WORD_THRESHOLD || comment.trim().length >= REVIEW_CHAR_THRESHOLD;
  }, []);

  const stockByColor = useMemo(() => {
    if (!product || !selectedVariant) return 0;
    const match = product.colors?.find((c) => c.name === selectedVariant.color);
    if (!match) return Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
    return Math.max(0, Number(match.stock || 0) - Number(match.reservedStock || 0));
  }, [product, selectedVariant]);

  const stockBySize = useMemo(() => {
    if (!product?.variations?.length || !selectedSize) return stockByColor;
    const variation =
      product.variations.find(
        (v) =>
          String(v.size || '') === selectedSize &&
          (!v.color || v.color.toLowerCase() === (selectedVariant?.color || '').toLowerCase())
      ) || product.variations.find((v) => String(v.size || '') === selectedSize);
    if (!variation) return stockByColor;
    return Math.max(0, Number(variation.stock || 0));
  }, [product, selectedSize, selectedVariant, stockByColor]);

  const getColorStock = useCallback(
    (colorName: string) => {
      if (!product) return 0;

      const normalizedColor = colorName.toLowerCase();
      const matchingVariations = (product.variations || []).filter(
        (variation) => (variation.color || '').toLowerCase() === normalizedColor
      );

      if (matchingVariations.length > 0) {
        if (isRingProduct && selectedSize) {
          const exactBySize = matchingVariations.find((variation) => String(variation.size || '') === selectedSize);
          return Math.max(0, Number(exactBySize?.stock || 0));
        }
        return Math.max(
          0,
          matchingVariations.reduce((sum, variation) => sum + Number(variation.stock || 0), 0)
        );
      }

      const color = (product.colors || []).find((item) => item.name.toLowerCase() === normalizedColor);
      if (color) return Math.max(0, Number(color.stock || 0) - Number(color.reservedStock || 0));

      return Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
    },
    [product, isRingProduct, selectedSize]
  );

  const getColorPrice = useCallback(
    (colorName: string, fallbackPrice: number) => {
      if (!product) return fallbackPrice;

      const normalizedColor = colorName.toLowerCase();
      const matchingVariations = (product.variations || []).filter(
        (variation) => (variation.color || '').toLowerCase() === normalizedColor
      );

      if (matchingVariations.length > 0) {
        if (selectedSize) {
          const exactBySize = matchingVariations.find((variation) => String(variation.size || '') === selectedSize);
          if (exactBySize?.price) return Number(exactBySize.price);
        }
        if (matchingVariations[0]?.price) return Number(matchingVariations[0].price);
      }

      return fallbackPrice;
    },
    [product, selectedSize]
  );

  const available = selectedVariant ? getColorStock(selectedVariant.color) : Math.min(stockByColor, stockBySize);
  const canPurchase = available > 0;
  const showRingSizeSelector =
    isRingProduct &&
    !isFanProduct &&
    !isMonitoringProduct &&
    !isBandProduct &&
    Boolean(selectedVariant?.sizes?.length);

  const handleColorChange = (variant: DisplayVariant) => {
    setSelectedColor(variant.color);
    setSelectedSize(variant.sizes[0] || '');
    setCurrentPrice(variant.price);
  };

  const handleReviewImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setReviewImageFiles((prev) => [...prev, ...files].slice(0, 4));
    e.target.value = '';
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user) {
      openLogin(`/product/${product.id}`);
      return;
    }
    const comment = reviewText.trim();
    if (!comment) return;

    const imageDataUrls = await Promise.all(
      reviewImageFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          })
      )
    );

    const nextEntry: ProductReviewStorageItem = {
      id: `rv_${Date.now()}`,
      userName: user.name || user.email,
      rating: Number(reviewRating || 0),
      comment,
      createdAt: new Date().toISOString(),
      images: imageDataUrls.filter(Boolean),
    };

    const nextReviews = [nextEntry, ...storedReviews];
    setStoredReviews(nextReviews);
    localStorage.setItem(`product_reviews_${product.id}`, JSON.stringify(nextReviews));
    setReviewText('');
    setReviewRating(5);
    setReviewImageFiles([]);
    setExpandedReviewIds([]);
    setActiveDetailTab('reviews');
  };

  const buildConfiguredProduct = () => {
    if (!product) return undefined;
    const configuredNameParts = [selectedVariant?.color, selectedSize].filter(Boolean);
    return {
      ...product,
      name: configuredNameParts.length ? `${product.name} (${configuredNameParts.join(' | ')})` : product.name,
      price: currentPrice,
      salePrice: currentPrice,
      selectedColorName: selectedVariant?.color,
      selectedColorHex: selectedVariant?.hex,
      images: selectedVariant?.images?.length ? selectedVariant.images : product.images,
    };
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      openLogin(`/product/${product.id}`);
      return;
    }
    const configured = buildConfiguredProduct();
    if (configured) addToCart(configured);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!user) {
      openLogin(`/product/${product.id}`);
      return;
    }
    const configured = buildConfiguredProduct();
    if (!configured) return;
    addToCart(configured);
    navigate('/checkout');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <ProductImageCarousel
              images={
                mediaItems.filter((media) => media.type === 'image').map((media) => media.url).length
                  ? mediaItems.filter((media) => media.type === 'image').map((media) => media.url)
                  : [product.images?.[0] || 'https://picsum.photos/700']
              }
              alt={product.name}
            />
            {selectedVariant?.videoUrl && isVideoUrl(selectedVariant.videoUrl) && (
              <div className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2">
                <video src={selectedVariant.videoUrl} controls className="w-full rounded-xl object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{product.category}</p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="text-amber-500">{'★'.repeat(Math.round(averageRating || 0))}{'☆'.repeat(5 - Math.round(averageRating || 0))}</span>
              <span>{averageRating || '0.0'} ({reviews.length} reviews)</span>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white">Rs {currentPrice.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Color {selectedVariant?.color ? `- ${selectedVariant.color}` : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allVariants.map((variant) => (
                  <button
                    key={variant.color}
                    type="button"
                    onClick={() => {
                      if (getColorStock(variant.color) <= 0) return;
                      handleColorChange(variant);
                    }}
                    disabled={getColorStock(variant.color) <= 0}
                    className={`text-left rounded-xl border p-3 transition-all duration-200 ${
                      selectedColor === variant.color
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                        : 'border-gray-300 dark:border-white/20 hover:border-primary-400'
                    } ${getColorStock(variant.color) <= 0 ? 'opacity-50 cursor-not-allowed hover:border-gray-300 dark:hover:border-white/20' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20"
                        style={{ backgroundColor: variant.hex || '#9CA3AF' }}
                      />
                      <p className="font-semibold text-sm">{variant.color}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Rs {getColorPrice(variant.color, variant.price).toLocaleString()}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${getColorStock(variant.color) > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                      {getColorStock(variant.color) > 0 ? `Stock: ${getColorStock(variant.color)} left` : 'Out of Stock'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {showRingSizeSelector ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Ring Size</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] px-4 py-2 rounded-lg border text-sm font-medium transition ${
                        selectedSize === size
                          ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white'
                          : 'border-gray-300 dark:border-white/20 hover:border-primary-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Stock Info</p>
              <p className={`text-sm font-medium ${canPurchase ? 'text-green-600' : 'text-red-600'}`}>
                {canPurchase ? `In Stock (${available} available)` : 'Out of Stock'}
              </p>
              {product.weight && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Weight</span> {product.weight}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button size="lg" className="h-12 rounded-xl" onClick={handleAddToCart} disabled={!canPurchase}>
                Add to Cart
              </Button>
              <Button size="lg" variant="secondary" className="h-12 rounded-xl" onClick={handleBuyNow} disabled={!canPurchase}>
                Buy Now
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-11 rounded-xl"
              onClick={() => {
                const event = new CustomEvent('support-assistant:ask-product', {
                  detail: {
                    prompt: `${product.name} price stock warranty`,
                  },
                });
                window.dispatchEvent(event);
              }}
            >
              Ask About This Product
            </Button>
          </div>
        </div>

        <section className="mt-14 border-t border-gray-200 dark:border-white/10 pt-8">
          <h2 className="text-2xl font-bold mb-4">Product Details</h2>
          <div className="mb-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-2 flex flex-wrap gap-2">
            {[
              { key: 'description', label: 'Description' },
              { key: 'features', label: 'Key Features' },
              { key: 'specs', label: 'Specs' },
              { key: 'faq', label: 'FAQ' },
              { key: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveDetailTab(tab.key as typeof activeDetailTab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeDetailTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeDetailTab === 'description' && (
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">
                {isDescriptionExpanded || descriptionText.length <= 400
                  ? descriptionText
                  : `${descriptionText.slice(0, 400).trim()}...`}
              </p>
              {descriptionText.length > 400 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                  className="mt-2 text-sm font-semibold text-primary-600 dark:text-primary-400"
                >
                  {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>
          )}

          {activeDetailTab === 'features' && (
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
              {(product.features || []).length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  {(product.features || []).map((feature, idx) => (
                    <li key={`${feature}_${idx}`}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No key features added.</p>
              )}
            </div>
          )}

          {activeDetailTab === 'specs' && (
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
              {Object.keys(product.specs || {}).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(product.specs || {}).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-gray-200 dark:border-white/10 p-3 bg-white dark:bg-white/5">
                      <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{key}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No specifications added.</p>
              )}
            </div>
          )}

          {activeDetailTab === 'faq' && (
            <div className="space-y-3">
              <details className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                <summary className="cursor-pointer font-medium">What is the delivery timeline?</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Orders are typically delivered within 3 to 7 business days.</p>
              </details>
              <details className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                <summary className="cursor-pointer font-medium">Is there a replacement policy?</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Eligible products can be replaced within policy terms for manufacturing defects.</p>
              </details>
              <details className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                <summary className="cursor-pointer font-medium">How do I claim warranty?</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Contact support with your order ID and product details.</p>
              </details>
            </div>
          )}

          {activeDetailTab === 'reviews' && (
            <div>
              <form onSubmit={handleSubmitReview} className="mb-6 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 space-y-3">
                <h3 className="text-base font-semibold">Write a Review</h3>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{r} star</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write your review..."
                  className="w-full rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 p-3 text-sm min-h-[100px]"
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReviewImageSelect}
                    className="block w-full text-sm text-gray-600 dark:text-gray-300"
                  />
                  {reviewImageFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {reviewImageFiles.map((file, idx) => (
                        <span key={`${file.name}_${idx}`} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" size="sm">Submit Review</Button>
              </form>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {averageRating || '0.0'} average rating from {reviews.length} reviews
                </p>
              </div>
              {displayedReviews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {displayedReviews.map((review, idx) => (
                    <article key={review.id || `${review.name}_${idx}`} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                      {(() => {
                        const longReview = isLongReview(review.comment);
                        const isExpanded = expandedReviewIds.includes(review.id);
                        return (
                          <>
                      <p className="text-amber-500 text-sm">{'★'.repeat(Math.round(review.rating || 0))}{'☆'.repeat(5 - Math.round(review.rating || 0))}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{review.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.date}</p>
                      </div>
                      <p
                        className="mt-2 text-sm text-gray-600 dark:text-gray-300 break-words [overflow-wrap:anywhere]"
                        style={
                          longReview && !isExpanded
                            ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                            : undefined
                        }
                      >
                        {review.comment}
                      </p>
                      {longReview && (
                        <button
                          type="button"
                          className="mt-1 text-xs font-semibold text-primary-600 dark:text-primary-400"
                          onClick={() =>
                            setExpandedReviewIds((prev) =>
                              prev.includes(review.id) ? prev.filter((id) => id !== review.id) : [...prev, review.id]
                            )
                          }
                        >
                          {isExpanded ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                      {!!review.images?.length && (
                        <div className="mt-3 grid grid-cols-3 gap-2 overflow-hidden">
                          {review.images.slice(0, 3).map((img, imgIdx) => (
                            <img
                              key={`${review.id}_${imgIdx}`}
                              src={img}
                              alt="review attachment"
                              className="h-16 w-full rounded-md object-cover border border-gray-200 dark:border-white/10"
                            />
                          ))}
                        </div>
                      )}
                          </>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet.</p>
              )}

              {reviews.length > 4 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleReviewCount((prev) => {
                        if (prev < reviews.length) return Math.min(prev + 4, reviews.length);
                        return 4;
                      })
                    }
                    className="rounded-lg border border-gray-300 dark:border-white/20 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition"
                  >
                    {canAddMoreReviews ? 'Show More Reviews' : canShowLessReviews ? 'Show Less' : 'Show More Reviews'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-12 border-t border-gray-200 dark:border-white/10 pt-8">
          <h2 className="text-2xl font-semibold mb-5">Recommended Products</h2>
          {recommendedProducts.length > 0 ? (
            <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto lg:overflow-visible pb-2 snap-x snap-mandatory">
              {recommendedProducts.map((recommended) => (
                <div key={recommended.id} className="w-[78vw] sm:w-[46vw] lg:w-auto min-w-[230px] lg:min-w-0 shrink-0 snap-start">
                  <ProductCard product={recommended} compact imageAspectClassName="aspect-[4/3]" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recommendations available right now.</p>
          )}
        </section>
      </div>
    </div>
  );
};
