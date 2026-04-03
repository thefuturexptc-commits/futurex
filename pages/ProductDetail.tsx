import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, ProductColor } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getProductById } from '../services/backend';
import { ProductImageCarousel } from '../components/ProductImageCarousel';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getProductById(id)
      .then((p) => {
        if (!p) {
          setError('Product not found');
        } else {
          setProduct(p);
          setSelectedColor(p.colors?.[0] ?? null);
        }
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (!user) {
      openLogin('/product/' + id);
      return;
    }
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, user, openLogin, id, selectedColor, activeImages, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    if (!user) {
      openLogin('/product/' + id);
      return;
    }
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd);
    navigate('/checkout');
  }, [product, user, openLogin, id, selectedColor, activeImages, addToCart, navigate]);

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

  return (
    <div className="min-h-screen bg-dark-bg text-white">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left: Image Carousel */}
          <div className="w-full">
            <ProductImageCarousel
              images={activeImages.length > 0 ? activeImages : ['https://picsum.photos/600']}
              alt={product.name}
              selectedIndex={selectedImageIndex}
              onSelectIndex={setSelectedImageIndex}
            />
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col gap-5">
            {/* Category + Rating */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-300 bg-primary-900/30 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.rating != null && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-sm font-bold">{product.rating}</span>
                  {product.reviewCount != null && (
                    <span className="text-xs text-gray-400">({product.reviewCount} reviews)</span>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display leading-tight">
              {product.name}
            </h1>

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

            {/* Stock */}
            <div>
              {canAdd ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    In Stock{stockCount <= 5 ? ' — Only ' + stockCount + ' left!' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold text-red-400">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-3">
                  Color: <span className="text-white">{selectedColor?.name ?? 'Select a color'}</span>
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor?.name === color.name;
                    const colorStock = Number(color.stock || 0) - Number(color.reservedStock || 0);
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          setSelectedImageIndex(0);
                        }}
                        title={color.name}
                        aria-label={color.name + (colorStock <= 0 ? ' — Out of stock' : '')}
                        className={[
                          'w-10 h-10 rounded-full border-2 transition-all duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                          isSelected ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-white/20 hover:border-white/60 hover:scale-105',
                          colorStock <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}
                        style={{ backgroundColor: color.hex }}
                        disabled={colorStock <= 0}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAdd}
                className={[
                  'flex-1 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : addedToCart
                    ? 'bg-green-500 text-white scale-[0.98]'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-[0.98]',
                ].join(' ')}
              >
                {addedToCart ? '✓ Added to Cart!' : canAdd ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className={[
                  'flex-1 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg',
                  !canAdd
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-500 active:scale-[0.98] shadow-lg shadow-primary-500/30',
                ].join(' ')}
              >
                Buy Now
              </button>
            </div>

            {/* Warranty */}
            {product.warranty && (
              <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <svg className="w-5 h-5 text-primary-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <span><span className="font-semibold text-white">Warranty:</span> {product.warranty}</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-bold mb-2 text-white">About this product</h2>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 text-white">Key Features</h2>
                <ul className="space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 text-white">Specifications</h2>
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  {Object.entries(product.specs).map(([key, value], i) => (
                    <div
                      key={key}
                      className={'flex gap-4 px-4 py-3 text-sm ' + (i % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.02]')}
                    >
                      <span className="text-gray-400 font-medium min-w-[120px] shrink-0">{key}</span>
                      <span className="text-gray-100">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {product.reviews && product.reviews.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 text-white">Customer Reviews</h2>
                <div className="space-y-3">
                  {product.reviews.slice(0, 4).map((review, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <span className="font-semibold text-white text-sm">{review.name}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <svg
                              key={s}
                              className={'w-3.5 h-3.5 ' + (s < review.rating ? 'text-amber-400 fill-current' : 'text-gray-600 fill-current')}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          ))}
                        </div>
                      </div>
                      {review.date && (
                        <p className="text-xs text-gray-500 mb-1">{review.date}</p>
                      )}
                      <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
