import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ProductPublicReview, ProductVariantOption } from '../types';
import { getProductById, getProducts } from '../services/backend';
import { trackViewContent, trackAddToCart } from '../services/Metapixel';
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
  colorName: string;
  colorHex: string;
  price: number;
  images: string[];
  sizes: Array<{ size: string; stock: number }>;
  videoUrl?: string;
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
  const [reviewError, setReviewError] = useState('');

  const isVideoUrl = useCallback((url: string) => VIDEO_REGEX.test(url), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getProductById(id).then((p) => {
      setProduct(p);
      setLoading(false);
      // ✅ META PIXEL: ViewContent
      if (p) {
        trackViewContent({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.salePrice ?? p.price,
        });
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem('aura_recently_viewed_products');
      const current = raw ? (JSON.parse(raw) as string[]) : [];
      const next = [id, ...current.filter((pid) => pid !== id)].slice(0, 12);
      localStorage.setItem('aura_recently_viewed_products', JSON.stringify(next));
    } catch {
      // Ignore storage errors and continue.
    }
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
    const basePrice = Number(product.salePrice || product.price || 0);

    if (product.variants?.length) {
      return product.variants.map((variant: ProductVariantOption) => {
        const colorName = String(variant.colorName || variant.color || '').trim() || 'Default';
        const rawSizes = Array.isArray(variant.sizes) ? variant.sizes : [];
        const sizes =
          rawSizes.length > 0
            ? rawSizes
                .map((sizeRow) => ({
                  size: String(sizeRow.size || '').trim(),
                  stock: Number(sizeRow.stock || 0),
                }))
                .filter((sizeRow) => sizeRow.size !== '')
            : [{ size: String(variant.size || 'Standard').trim() || 'Standard', stock: Number(variant.stock || 0) }];

        return {
          colorName,
          colorHex: String(variant.colorHex || variant.hex || '#9CA3AF'),
          price: Number(variant.price || basePrice),
          images: variant.images?.length ? variant.images : product.images,
          sizes: sizes.length ? sizes : [{ size: 'Standard', stock: 0 }],
          videoUrl: variant.videoUrl || product.videoByColor?.[colorName] || '',
        };
      });
    }

    if (product.colors?.length) {
      return product.colors.map((color) => ({
        colorName: color.name,
        colorHex: color.hex || '#9CA3AF',
        price: Number(product.prices?.[color.name] || basePrice),
        images: color.images?.length ? color.images : product.imagesByColor?.[color.name] || product.images,
        sizes: [{ size: 'Standard', stock: Number(color.stock || 0) }],
        videoUrl: product.videoByColor?.[color.name] || '',
      }));
    }

    return [{
      colorName: 'Default',
      colorHex: '#9CA3AF',
      price: basePrice,
      images: product.images?.length ? product.images : ['https://picsum.photos/700'],
      sizes: [{ size: 'Standard', stock: Number(product.stock || 0) }],
      videoUrl: product.videoUrl || '',
    }];
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!allVariants.length) return undefined;
    return allVariants.find((variant) => variant.colorName === selectedColor) || allVariants[0];
  }, [allVariants, selectedColor]);

  const mediaItems = useMemo(() => {
    if (!selectedVariant) return [] as { url: string; type: 'image' | 'video' }[];
    const urls = [...(selectedVariant.images || []), ...(selectedVariant.videoUrl ? [selectedVariant.videoUrl] : [])];
    const deduped = Array.from(new Set(urls.filter(Boolean)));
    return deduped.map((url) => ({ url, type: isVideoUrl(url) ? 'video' : 'image' as const }));
  }, [selectedVariant, isVideoUrl]);

  const carouselImages = useMemo(() => {
    if (!product) return ['https://picsum.photos/700'];
    const merged = [...(selectedVariant?.images || []), ...(product.images || [])].filter(Boolean);
    const deduped = Array.from(new Set(merged));
    return deduped.length ? deduped : ['https://picsum.photos/700'];
  }, [product, selectedVariant]);

  const pickPreferredSize = useCallback((variant?: DisplayVariant) => {
    if (!variant) return '';
    return variant.sizes.find((entry) => Number(entry.stock || 0) > 0)?.size || variant.sizes[0]?.size || '';
  }, []);

  useEffect(() => {
    if (!allVariants.length) return;
    const initial = allVariants.find((variant) => variant.colorName === product?.defaultVariant) || allVariants[0];
    setSelectedColor(initial.colorName);
    setSelectedSize(pickPreferredSize(initial));
    setCurrentPrice(initial.price);
    setVisibleReviewCount(4);
    setIsDescriptionExpanded(false);
    setActiveDetailTab('description');
  }, [product?.id, product?.defaultVariant, allVariants, pickPreferredSize]);

  useEffect(() => {
    if (!selectedVariant) return;
    const allSizes = selectedVariant.sizes.map((entry) => entry.size);
    if (allSizes.length > 0 && !allSizes.includes(selectedSize)) {
      setSelectedSize(pickPreferredSize(selectedVariant));
    }
  }, [selectedVariant, selectedSize, pickPreferredSize]);

  useEffect(() => {
    if (!selectedVariant || !product) return;
    setCurrentPrice(Number(selectedVariant.price || product.salePrice || product.price || 0));
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
    const fromStorage = storedReviews
      .filter((review) => Number(review.rating || 0) >= 4)
      .map((review) => ({
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

  const getVariantTotalStock = useCallback(
    (variant: DisplayVariant) => (variant.sizes || []).reduce((sum, sizeRow) => sum + Number(sizeRow.stock || 0), 0),
    []
  );

  const selectedSizeStock = useMemo(() => {
    if (!selectedVariant) return 0;
    const match = (selectedVariant.sizes || []).find((sizeRow) => sizeRow.size === selectedSize);
    if (match) return Number(match.stock || 0);
    return getVariantTotalStock(selectedVariant);
  }, [selectedVariant, selectedSize, getVariantTotalStock]);

  const available = selectedVariant ? selectedSizeStock : 0;
  const canPurchase = available > 0;
  const showSizeSelector = Boolean(selectedVariant?.sizes?.length);

  const handleColorChange = (variant: DisplayVariant) => {
    setSelectedColor(variant.colorName);
    setSelectedSize(pickPreferredSize(variant));
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
    if (Number(reviewRating || 0) < 4) {
      setReviewError('Only 4-star and 5-star reviews are accepted right now.');
      return;
    }
    const comment = reviewText.trim();
    if (!comment) return;
    setReviewError('');

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
    const configuredNameParts = [selectedVariant?.colorName, selectedSize].filter(Boolean);
    return {
      ...product,
      name: configuredNameParts.length ? `${product.name} (${configuredNameParts.join(' | ')})` : product.name,
      price: currentPrice,
      salePrice: currentPrice,
      selectedColorName: selectedVariant?.colorName,
      selectedColorHex: selectedVariant?.colorHex,
      selectedSize,
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
    if (configured) {
      addToCart(configured);
      // ✅ META PIXEL: AddToCart
      trackAddToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.salePrice ?? product.price,
        quantity: configured.quantity ?? 1,
      });
    }
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
    // ✅ META PIXEL: AddToCart (Buy Now path)
    trackAddToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.salePrice ?? product.price,
      quantity: configured.quantity ?? 1,
    });
    navigate('/checkout');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-white pb-40 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <ProductImageCarousel
              key={`${selectedVariant?.colorName || 'default'}_${carouselImages.length}`}
              images={carouselImages}
              alt={product.name}
            />
            {carouselImages.length ? (
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                {carouselImages.map((imageUrl, imageIdx) => (
                  <img
                    key={`${selectedVariant?.colorName || 'default'}_${imageIdx}`}
                    src={imageUrl}
                    alt={`${product.name} ${selectedVariant?.colorName || 'Default'} ${imageIdx + 1}`}
                    loading="lazy"
                    className="h-16 w-16 sm:h-16 sm:w-16 rounded-lg object-cover border border-gray-200 dark:border-white/10 shrink-0 snap-start"
                  />
                ))}
              </div>
            ) : null}
            {selectedVariant?.videoUrl && isVideoUrl(selectedVariant.videoUrl) && (
              <div className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2">
                <video src={selectedVariant.videoUrl} controls className="w-full rounded-xl object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{product.category}</p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="text-amber-500">{'★'.repeat(Math.round(averageRating || 0))}{'☆'.repeat(5 - Math.round(averageRating || 0))}</span>
              <span>{averageRating || '0.0'} ({reviews.length} reviews)</span>
            </div>

            <div className="flex items-end gap-3">
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">Rs {currentPrice.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Select Color {selectedVariant?.colorName ? `- ${selectedVariant.colorName}` : ''}
              </p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                {allVariants.map((variant) => (
                  <button
                    key={variant.colorName}
                    type="button"
                    onClick={() => {
                      if (getVariantTotalStock(variant) <= 0) return;
                      handleColorChange(variant);
                    }}
                    disabled={getVariantTotalStock(variant) <= 0}
                    className={`text-left rounded-xl border p-2.5 sm:p-3 transition-all duration-200 w-full sm:w-[170px] min-w-0 ${
                      selectedColor === variant.colorName
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                        : 'border-gray-300 dark:border-white/20 hover:border-primary-400'
                    } ${getVariantTotalStock(variant) <= 0 ? 'opacity-50 cursor-not-allowed hover:border-gray-300 dark:hover:border-white/20' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20"
                        style={{ backgroundColor: variant.colorHex || '#9CA3AF' }}
                      />
                      <p className="font-semibold text-sm">{variant.colorName}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Rs {variant.price.toLocaleString()}
                    </p>
                    <p className={`mt-1 text-xs font-medium ${getVariantTotalStock(variant) > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
                      {getVariantTotalStock(variant) > 0 ? `Stock: ${getVariantTotalStock(variant)} left` : 'Out of Stock'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {showSizeSelector ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Select Size</p>
                <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 snap-x snap-mandatory">
                  {selectedVariant.sizes.map((sizeRow) => (
                    <button
                      key={`${selectedVariant.colorName}_${sizeRow.size}`}
                      type="button"
                      onClick={() => setSelectedSize(sizeRow.size)}
                      disabled={Number(sizeRow.stock || 0) <= 0}
                      className={`min-w-[84px] px-4 py-2 rounded-lg border text-sm font-medium transition shrink-0 snap-start ${
                        selectedSize === sizeRow.size
                          ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white'
                          : 'border-gray-300 dark:border-white/20 hover:border-primary-400'
                      } ${Number(sizeRow.stock || 0) <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {sizeRow.size} ({Number(sizeRow.stock || 0)})
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

            <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Product Details</h2>
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
              <p className="text-sm leading-7 sm:leading-8 text-gray-700 dark:text-gray-300">
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
                    onChange={(e) => {
                      setReviewRating(Number(e.target.value));
                      setReviewError('');
                    }}
                    className="rounded-lg border border-gray-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{r} star</option>
                    ))}
                  </select>
                </div>
                {reviewError && <p className="text-xs text-red-600 dark:text-red-400">{reviewError}</p>}
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
                              loading="lazy"
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
          <h2 className="text-xl sm:text-2xl font-semibold mb-5">Recommended Products</h2>
          {recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {recommendedProducts.map((recommended) => (
                <div key={recommended.id} className="min-w-0">
                  <ProductCard product={recommended} compact imageAspectClassName="aspect-[4/3]" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recommendations available right now.</p>
          )}
        </section>
      </div>
      <div
        className="sm:hidden fixed left-0 right-0 bottom-0 z-40 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-dark-bg/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/90 dark:bg-white/5 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Ready to Order
              </p>
              <p className="mt-1 truncate text-lg font-bold text-gray-900 dark:text-white">
                Rs {currentPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${canPurchase ? 'text-green-600' : 'text-red-600'}`}>
                {canPurchase ? `${available} in stock` : 'Out of stock'}
              </p>
              {selectedVariant?.colorName ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedVariant.colorName}{selectedSize ? ` | ${selectedSize}` : ''}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <Button className="h-12 w-full rounded-xl text-base" onClick={handleAddToCart} disabled={!canPurchase}>
              Add to Cart
            </Button>
            <Button variant="secondary" className="h-12 w-full rounded-xl text-base" onClick={handleBuyNow} disabled={!canPurchase}>
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
