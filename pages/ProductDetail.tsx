import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductById, updateProduct } from '../services/backend';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Button } from '../components/ui/Button';
import { ProductImageSlider } from '../src/components/ProductImageSlider';

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
  
  const [selectedColorName, setSelectedColorName] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
  
  useEffect(() => {
    if (id) {
      getProductById(id).then(p => {
        setProduct(p);
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
      if (!product) return;
      setSelectedColorName(product.colors?.[0]?.name || '');
      setSelectedVariationId(product.variations?.[0]?.id || '');
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const stored = localStorage.getItem(`product_reviews_${product.id}`);
    setReviews(stored ? (JSON.parse(stored) as ProductReview[]) : []);
  }, [product]);

  const buildConfiguredProduct = () => {
    if (!product) return undefined;
    const variation = product.variations?.find(v => v.id === selectedVariationId);
    const effectivePrice = Number(variation?.price || product.salePrice || product.price);
    const selectedColor = product.colors?.find((c) => c.name === selectedColorName);
    const optionLabel = [
      variation?.size ? `Size ${variation.size}` : '',
      selectedColorName || ''
    ].filter(Boolean).join(' | ');

    return {
      ...product,
      price: effectivePrice,
      salePrice: effectivePrice,
      selectedColorName: selectedColorName || undefined,
      selectedColorHex: selectedColor?.hex,
      name: optionLabel ? `${product.name} (${optionLabel})` : product.name
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
      if(!user) {
          openLogin(product ? `/product/${product.id}` : '/shop/all');
          return;
      }
      const configuredProduct = buildConfiguredProduct();
      if (configuredProduct) addToCart(configuredProduct);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-200">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-200">Product not found</div>;

  const selectedVariation = product.variations?.find(v => v.id === selectedVariationId);
  const isSmartRings = product.category.toLowerCase() === 'smart rings';
  const isSmartBands = product.category.toLowerCase() === 'smart bands';
  const isWearableConfigurator = isSmartRings || isSmartBands;
  const selectedColor = product.colors?.find((c) => c.name === selectedColorName);

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
        images: reviewImages.filter(Boolean)
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
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12 bg-dark-bg text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Media Gallery */}
        <div className="space-y-6">
          <ProductImageSlider images={selectedColor?.images || product.images} />
          {product.videoUrl && (
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 shadow-xl">
              {(product.videoUrl.includes('youtube') || product.videoUrl.includes('youtu.be') || product.videoUrl.includes('vimeo')) ? (
                <iframe
                  className="aspect-video w-full"
                  src={getEmbedUrl(product.videoUrl)}
                  title="Product Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  className="aspect-video w-full object-cover"
                  src={product.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col pt-4 lg:sticky lg:top-24 self-start">
           <span className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-[0.2em] text-sm mb-4 font-display block">{product.category}</span>
           <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 font-display leading-tight">{product.name}</h1>
           
           <div className="flex items-center mb-8">
             <div className="flex text-amber-400 mr-3 gap-1">
               {[...Array(5)].map((_, i) => (
                 <span key={i} className="text-xl">{i < Math.floor(product.rating || 0) ? '★' : '☆'}</span>
               ))}
             </div>
             <span className="text-gray-500 dark:text-gray-400 font-medium text-sm border-l border-gray-300 dark:border-gray-700 pl-3">{product.reviewCount || 0} verified reviews</span>
           </div>

           <p className="text-gray-600 dark:text-gray-300 text-lg mb-10 leading-relaxed font-light">
             <span dangerouslySetInnerHTML={{ __html: product.description || '<p></p>' }} />
           </p>

           {product.bandType && (
             <p className="text-sm text-gray-500 mt-2 mb-8">
               Band Type: {product.bandType}
             </p>
           )}

           <div className="mb-8">
             <div className="flex items-end gap-3">
               <span className="text-4xl font-bold text-gray-900 dark:text-white font-display">₹{effectivePrice.toLocaleString()}</span>
               <span className="line-through text-gray-500 dark:text-gray-400 text-lg">₹{mrp.toLocaleString()}</span>
               {percentOff > 0 && (
                <span className="text-green-600 text-sm font-semibold">{percentOff}% off</span>
               )}
             </div>
             {savings > 0 && <p className="text-sm text-green-600 font-medium mt-1">You save ₹{savings.toLocaleString()}</p>}
             <p className={`text-sm font-semibold mt-2 ${canPurchase ? 'text-green-600' : 'text-red-600'}`}>
               {canPurchase ? `In Stock (${available} available)` : 'Out of Stock'}
             </p>
           </div>

           {isWearableConfigurator && (
            <div className="space-y-6 mb-10 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                            {isSmartRings && !!product.variations?.length && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Select Ring Size</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {product.variations.map((variation) => (
                      <button
                        key={variation.id}
                        disabled={variation.stock === 0}
                        className={`px-4 py-2 rounded-full border transition-all duration-300 ${
                          selectedVariation?.id === variation.id
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'hover:border-black dark:hover:border-white'
                        } ${variation.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                        onClick={() => setSelectedVariationId(variation.id)}
                      >
                        Size {variation.size || 'Standard'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSmartBands && !!product.variations?.length && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Choose Model</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.variations.map((variation) => (
                      <button
                        key={variation.id}
                        onClick={() => setSelectedVariationId(variation.id)}
                        className={`text-left rounded-xl border p-3 transition-colors ${
                          selectedVariationId === variation.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-white/10 hover:border-primary-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {variation.size ? `${variation.size}` : 'Standard'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {variation.weight ? `${variation.weight}` : 'Wearable edition'}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">Rs {variation.price.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!!product.colors?.length && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Select Color {selectedColorName ? `- ${selectedColorName}` : ''}
                  </p>
                  <div className="flex gap-4 mt-2">
                    {product.colors.map((color) => {
                      return (
                        <button
                          key={color.name}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            selectedColorName === color.name ? 'ring-2 ring-white border-white' : 'border-white/40'
                          }`}
                          style={{ backgroundColor: color.hex || '#9CA3AF' }}
                          onClick={() => {
                            setSelectedColorName(color.name);
                          }}
                          aria-label={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
           )}

           <div className="grid grid-cols-2 gap-4 mb-10">
              {Object.entries(product.specs || {}).map(([key, val]) => (
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
             <Button size="lg" onClick={handleAddToCart} disabled={!canPurchase} className="flex-1 rounded-full h-14 font-display tracking-wide text-lg shadow-xl shadow-primary-500/20">Add to Cart</Button>
             <Button size="lg" variant="secondary" onClick={handleBuyNow} disabled={!canPurchase} className="flex-1 rounded-full h-14 font-display tracking-wide text-lg">Buy Now</Button>
           </div>
           
           <div className="mt-12 pt-10 border-t border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 font-display">Key Features</h3>
              <ul className="space-y-4">
                {(product.features || []).map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600 dark:text-gray-300">
                      <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
           </div>

           <div className="mt-12 pt-10 border-t border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 font-display">Reviews</h3>
              <form onSubmit={handleSubmitReview} className="space-y-3 mb-6">
                <div className="flex gap-3 items-center">
                  <label className="text-sm font-medium dark:text-gray-200">Your Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="p-2 border rounded bg-white/5 border-white/10 text-white"
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
                  className="w-full p-3 border rounded bg-white/5 border-white/10 text-white min-h-[110px]"
                />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setReviewImageFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
                {reviewImageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reviewImageFiles.map((file, idx) => (
                      <span key={`${file.name}_${idx}`} className="text-xs px-2 py-1 rounded bg-white/10 text-gray-200">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
                <Button type="submit" size="sm">Submit Review</Button>
              </form>

              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{review.userName}</p>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-amber-500 text-sm mb-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    <p className="text-sm text-gray-300">{review.comment}</p>
                    {!!review.images?.length && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {review.images.map((image, idx) => (
                          <img
                            key={`${review.id}_${idx}`}
                            src={image}
                            alt="Review upload"
                            className="w-full h-24 object-cover rounded-md border border-white/10"
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
           </div>
        </div>
      </div>
    </div>
  );
};


