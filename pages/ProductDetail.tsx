import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductById, getProducts, updateProduct } from '../services/backend';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';

interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

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
    if (!product) return;
    setSelectedColorIndex(0);
    setSelectedVariationId(product.variations?.[0]?.id || '');
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const stored = localStorage.getItem(`product_reviews_${product.id}`);
    setReviews(stored ? (JSON.parse(stored) as ProductReview[]) : []);
  }, [product]);

  const selectedVariation = useMemo(
    () => product?.variations?.find((v) => v.id === selectedVariationId),
    [product, selectedVariationId]
  );

  const selectedColor = useMemo(() => {
    if (!product?.colors?.length) return undefined;
    return product.colors[selectedColorIndex] || product.colors[0];
  }, [product, selectedColorIndex]);

  const activeImages = useMemo(() => {
    if (!product) return [] as string[];
    return selectedColor?.images && selectedColor.images.length > 0 ? selectedColor.images : product.images;
  }, [product, selectedColor]);
  const descriptionText = useMemo(
    () => (product?.description || '').replace(/<[^>]*>/g, '').trim(),
    [product?.description]
  );
  const isLongDescription = descriptionText.length > 260;

  useEffect(() => {
    if (!activeImages.length) {
      setSelectedImage('');
      return;
    }
    setSelectedImage(activeImages[0]);
  }, [activeImages]);

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return;
    getProducts()
      .then((all) => {
        const recommended = all
          .filter((p) => p.id !== product.id)
          .sort((a, b) => {
            const sameCategoryScore = (b.category === product.category ? 1 : 0) - (a.category === product.category ? 1 : 0);
            if (sameCategoryScore !== 0) return sameCategoryScore;
            return Number(b.rating || 0) - Number(a.rating || 0);
          })
          .slice(0, 4);
        setRecommendedProducts(recommended);
      })
      .catch(() => setRecommendedProducts([]));
  }, [product?.id, product?.category]);

  const averageReviewScore = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const ratingBreakdown = useMemo(() => {
    const buckets = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((review) => review.rating === star).length,
    }));
    return buckets.map((bucket) => ({
      ...bucket,
      percentage: reviews.length > 0 ? Math.round((bucket.count / reviews.length) * 100) : 0,
    }));
  }, [reviews]);

  const buildConfiguredProduct = () => {
    if (!product) return undefined;
    const variation = product.variations?.find((v) => v.id === selectedVariationId);
    const effectivePrice = Number(variation?.price || product.salePrice || product.price);
    const optionLabel = [variation?.size ? `Size ${variation.size}` : '', selectedColor?.name || '']
      .filter(Boolean)
      .join(' | ');

    return {
      ...product,
      price: effectivePrice,
      salePrice: effectivePrice,
      selectedColorName: selectedColor?.name || undefined,
      selectedColorHex: selectedColor?.hex,
      name: optionLabel ? `${product.name} (${optionLabel})` : product.name,
    };
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!user) {
      openLogin(`/product/${product.id}`);
      return;
    }
    const configuredProduct = buildConfiguredProduct();
    if (!configuredProduct) return;
    addToCart(configuredProduct);
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!user) {
      openLogin(product ? `/product/${product.id}` : '/shop/all');
      return;
    }
    const configuredProduct = buildConfiguredProduct();
    if (configuredProduct) addToCart(configuredProduct);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-500">Product not found</div>;

  const normalizedCategory = (product.category || '').toLowerCase();
  const isSmartRings = normalizedCategory === 'smart rings';
  const isSmartBands = normalizedCategory === 'smart bands';
  const hasSizeOptions = Boolean(product.variations?.length);

  const effectivePrice = Number(selectedVariation?.price || product.salePrice || product.price || 0);
  const mrp = Number(product.mrp || product.price || 0);
  const savings = Math.max(0, mrp - effectivePrice);
  const percentOff = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;

  const baseAvailable = selectedColor
    ? Math.max(0, Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0))
    : Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
  const variationAvailable = selectedVariation ? Math.max(0, Number(selectedVariation.stock || 0)) : baseAvailable;
  const available = Math.min(baseAvailable, variationAvailable);
  const canPurchase = available > 0;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openLogin(`/product/${product.id}`);
      return;
    }
    const comment = reviewText.trim();
    if (!comment) return;

    const reviewImages = await Promise.all(
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

    const nextReviews = [
      {
        id: `rv_${Date.now()}`,
        userName: user.name,
        rating: reviewRating,
        comment,
        createdAt: new Date().toISOString(),
        images: reviewImages.filter(Boolean),
      },
      ...reviews,
    ];

    setReviews(nextReviews);
    localStorage.setItem(`product_reviews_${product.id}`, JSON.stringify(nextReviews));
    setReviewText('');
    setReviewRating(5);
    setReviewImageFiles([]);

    const avg = Number((nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextReviews.length).toFixed(1));
    const updatedProduct = { ...product, rating: avg, reviewCount: nextReviews.length };
    setProduct(updatedProduct);
    try {
      await updateProduct(updatedProduct);
    } catch (err) {
      void err;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div>
            <div className="w-full aspect-square bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center p-4 sm:p-6">
              <img src={selectedImage || activeImages[0] || 'https://picsum.photos/700'} alt={product.name} className="max-h-full w-full object-contain" />
            </div>

            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {activeImages.map((img, index) => (
                <button
                  key={`${img}_${index}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-lg border p-1 shrink-0 ${
                    selectedImage === img ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-white/20'
                  }`}
                >
                  <img src={img} alt={`thumbnail-${index + 1}`} className="w-full h-full object-contain rounded" />
                </button>
              ))}
            </div>

          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400">{product.category}</p>
              <h1 className="text-3xl sm:text-4xl font-semibold mt-3">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span>{'*'.repeat(Math.max(0, Math.min(5, Math.floor(product.rating || 0))))}</span>
              <span>{product.reviewCount || 0} reviews</span>
            </div>

            <div>
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold">Rs {effectivePrice.toLocaleString()}</span>
                <span className="line-through text-gray-400">Rs {mrp.toLocaleString()}</span>
                {percentOff > 0 && <span className="text-green-600 font-medium text-sm">{percentOff}% OFF</span>}
              </div>
              {savings > 0 && <p className="text-sm text-green-600 mt-1">You save Rs {savings.toLocaleString()}</p>}
              <p className={`text-sm mt-2 font-medium ${canPurchase ? 'text-green-600' : 'text-red-600'}`}>
                {canPurchase ? `In Stock (${available} available)` : 'Out of Stock'}
              </p>
            </div>

            {hasSizeOptions && (
              <div className="space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                {isSmartRings && !!product.variations?.length && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Select Ring Size</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variations.map((variation) => (
                        <button
                          key={variation.id}
                          type="button"
                          disabled={variation.stock === 0}
                          onClick={() => setSelectedVariationId(variation.id)}
                          className={`px-3 py-1.5 rounded-full border text-sm ${
                            selectedVariation?.id === variation.id
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent'
                              : 'border-gray-300 dark:border-white/20'
                          } ${variation.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          Size {variation.size || 'Standard'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isSmartBands && !!product.variations?.length && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Choose Model</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.variations.map((variation) => (
                        <button
                          key={variation.id}
                          type="button"
                          onClick={() => setSelectedVariationId(variation.id)}
                          className={`rounded-lg border p-2 text-left ${
                            selectedVariationId === variation.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-300 dark:border-white/20'
                          }`}
                        >
                          <p className="text-sm font-semibold">{variation.size || 'Standard'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{variation.weight || 'Wearable edition'}</p>
                          <p className="text-sm font-bold mt-1">Rs {variation.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isSmartRings && !isSmartBands && !!product.variations?.length && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Select Size / Variant</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variations.map((variation) => (
                        <button
                          key={variation.id}
                          type="button"
                          disabled={variation.stock === 0}
                          onClick={() => setSelectedVariationId(variation.id)}
                          className={`px-3 py-1.5 rounded-full border text-sm ${
                            selectedVariation?.id === variation.id
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent'
                              : 'border-gray-300 dark:border-white/20'
                          } ${variation.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {variation.size || variation.color || 'Standard'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!!product.colors?.length && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Select Color {selectedColor?.name ? `- ${selectedColor.name}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, colorIdx) => (
                    <button
                      key={`${color.name}_${colorIdx}`}
                      type="button"
                      onClick={() => setSelectedColorIndex(colorIdx)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        selectedColorIndex === colorIdx
                          ? 'border-gray-900 dark:border-white'
                          : 'border-gray-300 dark:border-white/20'
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 dark:border-white/20"
                        style={{ backgroundColor: color.hex || '#9CA3AF' }}
                      />
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(product.specs || {}).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-gray-200 dark:border-white/10 p-3 bg-white dark:bg-white/5">
                  <span className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{key}</span>
                  <span className="block text-sm font-semibold mt-1">{val}</span>
                </div>
              ))}
              {product.warranty && (
                <div className="rounded-lg border border-purple-200 dark:border-purple-500/20 p-3 bg-purple-50 dark:bg-purple-900/10">
                  <span className="block text-xs uppercase tracking-wider text-purple-600 dark:text-purple-300">Warranty</span>
                  <span className="block text-sm font-semibold mt-1 text-purple-800 dark:text-purple-200">{product.warranty}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={handleAddToCart} disabled={!canPurchase} className="flex-1 h-12 rounded-lg">
                Add to Cart
              </Button>
              <Button size="lg" variant="secondary" onClick={handleBuyNow} disabled={!canPurchase} className="flex-1 h-12 rounded-lg">
                Buy Now
              </Button>
            </div>
          </div>
        </div>

        <section className="border-t border-gray-200 dark:border-white/10 mt-12 pt-8">
          <h2 className="text-2xl font-semibold mb-5">Description / Key Features / Specs</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div
                className={`text-gray-600 dark:text-gray-300 leading-relaxed ${
                  !descriptionExpanded && isLongDescription ? 'max-h-28 overflow-hidden' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: product.description || '<p></p>' }}
              />
              {isLongDescription && (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-400"
                  onClick={() => setDescriptionExpanded((prev) => !prev)}
                >
                  {descriptionExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
              <h3 className="text-lg font-semibold mb-2">Key Features</h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-2">
                {(product.features || []).map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
              <h3 className="text-lg font-semibold mb-2">Specifications</h3>
              <div className="space-y-2">
                {Object.entries(product.specs || {}).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-white/10 pb-1 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{key}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                ))}
                {product.warranty && (
                  <div className="flex items-center justify-between gap-3 pt-1 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Warranty</span>
                    <span className="font-semibold">{product.warranty}</span>
                  </div>
                )}
                {product.bandType && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Band Type</span>
                    <span className="font-semibold">{product.bandType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-white/10 mt-10 pt-8">
          <h2 className="text-2xl font-semibold mb-5">FAQ</h2>
          <div className="space-y-3">
            <details className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
              <summary className="cursor-pointer font-medium">What is the delivery timeline?</summary>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Orders are typically delivered within 3 to 7 business days depending on your location.</p>
            </details>
            <details className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
              <summary className="cursor-pointer font-medium">Is there a replacement policy?</summary>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Yes, eligible products can be replaced within policy terms if there is a manufacturing defect.</p>
            </details>
            <details className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
              <summary className="cursor-pointer font-medium">How do I claim warranty?</summary>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Contact support with your order ID and product details to initiate a warranty request.</p>
            </details>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-white/10 mt-10 pt-8">
          <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
          <div className="mb-6 rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overall Rating</p>
              <p className="text-4xl font-bold mt-1">{averageReviewScore || '0.0'}</p>
              <p className="text-amber-500 mt-2">{'★'.repeat(Math.round(averageReviewScore))}{'☆'.repeat(5 - Math.round(averageReviewScore))}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reviews.length} total reviews</p>
            </div>
            <div className="space-y-2">
              {ratingBreakdown.map((item) => (
                <div key={item.star} className="flex items-center gap-2 text-sm">
                  <span className="w-10 text-gray-600 dark:text-gray-300">{item.star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <span className="w-10 text-right text-gray-500 dark:text-gray-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmitReview} className="space-y-3 mb-6">
            <div className="flex gap-3 items-center flex-wrap">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating</label>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="p-2 border rounded bg-white dark:bg-white/5 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white"
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
              className="w-full p-3 border rounded-lg bg-white dark:bg-white/5 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white min-h-[110px]"
            />

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setReviewImageFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-gray-600 dark:text-gray-300"
            />

            {reviewImageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {reviewImageFiles.map((file, idx) => (
                  <span key={`${file.name}_${idx}`} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                    {file.name}
                  </span>
                ))}
              </div>
            )}

            <Button type="submit" size="sm">Submit Review</Button>
          </form>

          <div className="space-y-4">
            {reviews.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet.</p>}

            {reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-semibold">{review.userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-amber-500 text-sm mb-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>

                {!!review.images?.length && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {review.images.map((image, idx) => (
                      <img
                        key={`${review.id}_${idx}`}
                        src={image}
                        alt="Review upload"
                        className="w-full h-24 object-cover rounded-md border border-gray-200 dark:border-white/10"
                        loading="lazy"
                        width={160}
                        height={96}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-white/10 mt-10 pt-8">
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

