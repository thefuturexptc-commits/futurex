import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, ProductColor, ProductPublicReview } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { addProductNotifyRequest, addProductReview, getProductById, getProductReviews, getProducts, getUserOrders, toProductSlug, uploadFile } from '../services/backend';
import { ProductImageCarousel } from '../components/ProductImageCarousel';
import { ProductCard } from '../components/ProductCard';
import { absoluteUrl, removeJsonLd, setJsonLd, setSeoMetadata, stripHtml } from '../services/seo';

const featureMarkerPattern = /^\s*(?:[-*\u2022]\s*|\d+[.)]\s*)/;
const numberedFeaturePattern = /^\s*\d+[.)]\s*/;
const cleanFeatureText = (feature: string) => feature.replace(featureMarkerPattern, '').trim();
const formatSpecLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

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

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const [activeDetailTab, setActiveDetailTab] = useState<'description' | 'features' | 'specs' | 'faq' | 'reviews'>('description');
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
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);
  const mobileCtaAnchorRef = useRef<HTMLDivElement | null>(null);
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
    if (selectedColor?.images?.length) return selectedColor.images;
    return product?.images ?? [];
  }, [selectedColor, product]);

  const salePrice = Number(product?.salePrice || product?.price || 0);
  const mrp = Number(product?.mrp || product?.price || 0);
  const savings = Math.max(0, mrp - salePrice);
  const percent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;

  const stockCount = useMemo(() => {
    if (selectedColor) {
      return Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0);
    }
    return Number(product?.stock || 0) - Number(product?.reservedStock || 0);
  }, [selectedColor, product]);

  const canAdd = stockCount > 0;
  const productSlug = toProductSlug(product?.name || '');
  const featureBannerSrc =
    productSlug === 'the-future-x-tp02-3-in-1-bladeless-tower-fan-air-cooler-plasma-purifier-led-light-for-home-office-use'
      ? '/images/fan-banner-tp-3-in-1.webp'
      : productSlug === 'the-future-x-tp-09-pro-heating-cooling-air-safe-for-kids-pets'
        ? '/images/tp-09-benefits-banner.webp'
        : '';
  const specEntries = useMemo(
    () => Object.entries(product?.specs || {}).filter(([, value]) => String(value || '').trim().length > 0),
    [product?.specs]
  );
  const topSpecEntries = useMemo(() => specEntries.slice(0, 6), [specEntries]);
  const selectedColorStock = selectedColor
    ? Math.max(0, Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0))
    : stockCount;
  const infoBadges = useMemo(
    () => [
      { title: 'Free Delivery', text: 'Fast dispatch on prepaid orders', icon: 'delivery' as const },
      { title: 'Secure Payment', text: 'Trusted checkout and support', icon: 'payment' as const },
      { title: 'Warranty', text: product?.warranty || 'Standard product warranty', icon: 'shield' as const },
      { title: 'Easy Support', text: 'Help available after purchase', icon: 'support' as const },
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

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, selectedColor, activeImages, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd);
    if (!user) {
      openLogin('/checkout');
      return;
    }
    navigate('/checkout');
  }, [product, user, openLogin, selectedColor, activeImages, addToCart, navigate]);

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
  const detailTabs = [
    { key: 'description', label: 'Description' },
    { key: 'features', label: 'Key Features' },
    { key: 'specs', label: 'Specs' },
    { key: 'faq', label: 'FAQ' },
    { key: 'reviews', label: 'Reviews' },
  ] as const;

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
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-12">

          {/* Left: Image Carousel + Thumbnails */}
          <div className="w-full self-start space-y-4">
            <ProductImageCarousel
              images={displayedImages}
              alt={product.name}
              selectedIndex={selectedImageIndex}
              onSelectIndex={setSelectedImageIndex}
            />
            {displayedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
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
                    className={`h-16 w-16 rounded-lg bg-black/70 object-contain p-1.5 border shrink-0 snap-start cursor-pointer transition-all duration-150 ${selectedImageIndex === imgIdx
                      ? 'border-primary-500 ring-2 ring-primary-400'
                      : 'border-white/10 hover:border-white/40'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col justify-center gap-4 self-start">

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

                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor?.name === color.name;
                      const colorStock = Number(color.stock || 0) - Number(color.reservedStock || 0);

                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            if (colorStock <= 0) return;
                            setSelectedColor(color);
                            setSelectedImageIndex(0);
                          }}
                          disabled={colorStock <= 0}
                          aria-label={color.name + (colorStock <= 0 ? ' — Out of stock' : '')}
                          className={`shrink-0 rounded-md border px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg ${
                            isSelected ? 'border-white bg-white/10' : 'border-white/20'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-white/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-xs text-white">{color.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-1 text-xs text-gray-400">
                    {selectedColor ? `${selectedColorStock} left` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="w-full text-[1.42rem] font-medium font-display leading-[1.18] tracking-normal text-white/95 sm:text-[1.95rem] lg:text-[2.35rem] lg:leading-[1.12]">
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
                          onClick={() => {
                            if (colorStock <= 0) return;
                            setSelectedColor(color);
                            setSelectedImageIndex(0);
                          }}
                          disabled={colorStock <= 0}
                          aria-label={color.name + (colorStock <= 0 ? ' — Out of stock' : '')}
                          className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg ${
                            isSelected ? 'border-primary-500 bg-primary-900/20' : 'border-white/20'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-white/50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-white/20"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-sm text-white">{color.name}</span>
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

            {/* Price */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold font-display text-white">
                &#8377;{salePrice.toLocaleString('en-IN')}
              </span>
              {mrp > salePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">&#8377;{mrp.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
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
                onClick={canAdd ? handleAddToCart : handleOpenNotify}
                className={[
                  'product-detail-add-cart-btn w-full rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'border border-violet-300/40 bg-white text-black'
                    : addedToCart
                      ? 'bg-green-500 text-white'
                      : 'border border-cyan-800/40 bg-gradient-to-r from-[#0b1224] to-[#122342] text-cyan-100 shadow-lg shadow-black/35',
                ].join(' ')}
              >
                {notifySubmitting ? 'Saving...' : addedToCart ? 'Added to Cart' : canAdd ? 'Add to Cart' : 'Notify me'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className={[
                  'product-detail-buy-now-btn w-full rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'border border-cyan-400/30 bg-gradient-to-r from-[#0b2a6e] via-[#0d3f9f] to-[#1167c7] text-white shadow-lg shadow-cyan-700/30',
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
            <div className="hidden gap-3 sm:flex sm:flex-row sm:mt-2">
              <button
                type="button"
                onClick={canAdd ? handleAddToCart : handleOpenNotify}
                className={[
                  'product-detail-add-cart-btn flex-1 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200',
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
                  'product-detail-buy-now-btn flex-1 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'border border-cyan-400/30 bg-gradient-to-r from-[#0b2a6e] via-[#0d3f9f] to-[#1167c7] text-white shadow-lg shadow-cyan-700/30 hover:from-[#0f3384] hover:via-[#1552be] hover:to-[#1678e6] active:scale-[0.98]',
                ].join(' ')}
              >
                Buy Now
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
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
        <section className="mt-12 border-t border-white/10 pt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-300">Product Highlights</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">All details</h2>
          </div>

          {featureBannerSrc && (
            <div className="-mx-1 mb-6 overflow-hidden rounded-[22px] border border-white/10 bg-black sm:mx-0 sm:rounded-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Performance Banner</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {productSlug === 'the-future-x-tp-09-pro-heating-cooling-air-safe-for-kids-pets'
                      ? 'Heating, cooling, and safety benefits at a glance'
                      : 'Cooling, control, and support at a glance'}
                  </p>
                </div>
              </div>
              <img
                src={featureBannerSrc}
                alt={`${product.name} feature banner`}
                loading="lazy"
                decoding="async"
                className="block w-full object-cover"
              />
            </div>
          )}

          {/* Tab Bar */}
          <div className="mb-4 sm:hidden">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Browse Details
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.key)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      activeDetailTab === tab.key
                        ? 'border-primary-500 bg-primary-600 text-white shadow shadow-primary-500/20'
                        : 'border-white/10 bg-[#0b1020] text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-5 hidden gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-2 sm:flex">
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveDetailTab(tab.key)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeDetailTab === tab.key
                  ? 'bg-primary-600 text-white shadow shadow-primary-500/30'
                  : 'text-gray-300 hover:bg-white/10'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Description Tab */}
          {activeDetailTab === 'description' && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
              {product.description ? (
                <>
                  <div className="relative">
                    <div
                      className={`text-sm text-gray-300 leading-6 space-y-3 overflow-hidden transition-all duration-300
      ${!isDescriptionExpanded ? 'max-h-[88px] sm:max-h-[132px]' : 'max-h-[1000px]'}`}
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
                      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent pointer-events-none sm:h-14" />
                    )}
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
                        className={`grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 px-4 py-3 ${
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
            <div className="space-y-3">
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
          className={`fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-[#050816]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 sm:hidden ${
            showMobileStickyCta ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-2">
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
              onClick={canAdd ? handleAddToCart : handleOpenNotify}
              className={[
                'min-w-[100px] rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200',
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
                'min-w-[100px] rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                !canAdd
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'border border-cyan-400/30 bg-gradient-to-r from-[#0b2a6e] via-[#0d3f9f] to-[#1167c7] text-white shadow-lg shadow-cyan-700/30',
              ].join(' ')}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

