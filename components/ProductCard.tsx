import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Button } from './ui/Button';
import { addProductNotifyRequest, getProductSlug } from '../services/backend';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  imageAspectClassName?: string;
  disableHoverEffects?: boolean;
  monochrome?: boolean;
  imageFit?: 'cover' | 'contain';
}

const imageTintCache = new Map<string, string>();
const DEFAULT_TINT = 'rgba(15, 23, 42, 0.96)';

interface CardPalette {
  tint: string;
  deepTint: string;
  isLight: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const scheduleIdleWork = (work: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let cancelled = false;
  const run = () => {
    if (!cancelled) work();
  };
  const requestIdle = (window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  }).requestIdleCallback;
  const cancelIdle = (window as Window & {
    cancelIdleCallback?: (id: number) => void;
  }).cancelIdleCallback;

  if (requestIdle) {
    const id = requestIdle(run, { timeout: 700 });
    return () => {
      cancelled = true;
      cancelIdle?.(id);
    };
  }

  const id = window.setTimeout(run, 90);
  return () => {
    cancelled = true;
    window.clearTimeout(id);
  };
};

const getImageTint = async (src: string): Promise<CardPalette> => {
  if (!src) return { tint: DEFAULT_TINT, deepTint: 'rgba(11, 16, 26, 0.98)', isLight: false };
  const cached = imageTintCache.get(src);
  if (cached) {
    const [tint = DEFAULT_TINT, deepTint = 'rgba(11, 16, 26, 0.98)', isLight = 'false'] = cached.split('|');
    return { tint, deepTint, isLight: isLight === 'true' };
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = src;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { tint: DEFAULT_TINT, deepTint: 'rgba(11, 16, 26, 0.98)', isLight: false };

    const sampleWidth = 24;
    const sampleHeight = 24;
    canvas.width = sampleWidth; 
    canvas.height = sampleHeight;
    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);

    const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const samplePoints = [
      [1, 1],
      [sampleWidth - 2, 1],
      [1, sampleHeight - 2],
      [sampleWidth - 2, sampleHeight - 2],
      [Math.floor(sampleWidth / 2), 1],
      [Math.floor(sampleWidth / 2), sampleHeight - 2],
      [1, Math.floor(sampleHeight / 2)],
      [sampleWidth - 2, Math.floor(sampleHeight / 2)],
    ];

    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    let count = 0;

    for (const [x, y] of samplePoints) {
      const idx = (y * sampleWidth + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 20) continue;
      rTotal += data[idx];
      gTotal += data[idx + 1];
      bTotal += data[idx + 2];
      count += 1;
    }

    if (count === 0) {
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 20) continue;
        rTotal += data[i];
        gTotal += data[i + 1];
        bTotal += data[i + 2];
        count += 1;
      }
    }

    const avgR = clamp(Math.round(rTotal / Math.max(1, count)), 8, 248);
    const avgG = clamp(Math.round(gTotal / Math.max(1, count)), 8, 248);
    const avgB = clamp(Math.round(bTotal / Math.max(1, count)), 8, 248);
    const brightness = (avgR * 299 + avgG * 587 + avgB * 114) / 1000;
    const isLight = brightness >= 168;

    const tint = isLight
      ? `rgba(${clamp(avgR, 232, 252)}, ${clamp(avgG, 232, 252)}, ${clamp(avgB, 232, 252)}, 0.98)`
      : `rgba(${clamp(avgR, 8, 60)}, ${clamp(avgG, 8, 60)}, ${clamp(avgB, 8, 60)}, 0.98)`;
    const deepTint = isLight
      ? `rgba(${clamp(avgR - 10, 220, 248)}, ${clamp(avgG - 10, 220, 248)}, ${clamp(avgB - 10, 220, 248)}, 1)`
      : `rgba(${clamp(avgR - 6, 6, 54)}, ${clamp(avgG - 6, 6, 54)}, ${clamp(avgB - 6, 6, 54)}, 1)`;
    imageTintCache.set(src, `${tint}|${deepTint}|${String(isLight)}`);
    return { tint, deepTint, isLight };
  } catch {
    return { tint: DEFAULT_TINT, deepTint: 'rgba(11, 16, 26, 0.98)', isLight: false };
  }
};

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  imageAspectClassName,
  disableHoverEffects = false,
  monochrome = true,
  imageFit = 'contain',
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();
  const [imageTint, setImageTint] = useState(DEFAULT_TINT);
  const [imageDeepTint, setImageDeepTint] = useState('rgba(11, 16, 26, 0.96)');
  const [isLightCard, setIsLightCard] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubmitting, setNotifySubmitting] = useState(false);   
  const [notifyMessage, setNotifyMessage] = useState('');
  const supportsHover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    []
  );
  const enableHoverEffects = !disableHoverEffects && supportsHover;

  const salePrice = Number(product.salePrice || product.price || 0);
  const mrp = salePrice > 0 ? salePrice + 2000 : 0;
  const offerPricing = getAutomaticOfferItemPricing(product);

  const selectedColorStock = useMemo(() => {
    const firstColor = product.colors?.[0];
    if (!firstColor) return Number(product.stock || 0) - Number(product.reservedStock || 0);
    return Number(firstColor.stock || 0) - Number(firstColor.reservedStock || 0);
  }, [product.colors, product.stock, product.reservedStock]);
  const canAdd = selectedColorStock > 0;

  const defaultImage = useMemo(() => {
    return product.colors?.[0]?.images?.[0] || product.images?.[0] || 'https://picsum.photos/400';
  }, [product.colors, product.images, product.variants]);
  const activeImage = defaultImage;
  const productPreviewImages = useMemo(() => {
    const colorImages = (product.colors || []).map((color) => color.images?.[0]).filter(Boolean);
    const variantImages = (product.variants || []).map((variant) => variant.images?.[0]).filter(Boolean);
    const productImages = (product.images || []).filter(Boolean);
    const images = colorImages.length ? colorImages : variantImages.length ? variantImages : productImages;
    return Array.from(new Set(images));
  }, [product.colors, product.images]);
  const previewImages = productPreviewImages.slice(0, 2);
  const extraPreviewCount = Math.max(0, productPreviewImages.length - previewImages.length);

  useEffect(() => {
    if (monochrome) return;
    let cancelled = false;
    const cancelIdle = scheduleIdleWork(() => {
      void getImageTint(activeImage).then(({ tint, deepTint, isLight }) => {
        if (cancelled) return;
        setImageTint(tint);
        setImageDeepTint(deepTint);
        setIsLightCard(isLight);
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [activeImage, monochrome]);

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleBuyNow = () => {
    addToCart(product, 1, { openCart: false });
    if (!user) {
      openLogin('/checkout');
      return;
    }
    navigate('/checkout');
  };

  const handleOpenNotify = async () => {
    if (!user) {
      openLogin(`/product/${getProductSlug(product)}`);
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
        selectedColorName: product.colors?.[0]?.name,
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
  };

  const cardTextClass = monochrome ? 'text-slate-950' : isLightCard ? 'text-gray-900' : 'text-slate-950';
  const mutedTextClass = monochrome ? 'text-slate-500' : isLightCard ? 'text-gray-500' : 'text-slate-500';
  const categoryChipClass = monochrome ? 'border border-cyan-200 bg-cyan-50 text-cyan-700' : isLightCard ? 'text-cyan-700 bg-cyan-100/90' : 'text-cyan-700 bg-cyan-50';
  const ratingClass = monochrome ? 'text-amber-500' : isLightCard ? 'text-amber-500' : 'text-amber-500';
  const hoverTextClass = enableHoverEffects ? 'group-hover:text-cyan-700' : '';
  const cardBackground = monochrome
    ? 'linear-gradient(180deg, #ffffff 0%, #f7fbfb 100%)'
    : `linear-gradient(165deg, ${imageTint} 0%, ${imageDeepTint} 68%)`;
  return (
    <>
    <div
      className={`product-card-dark group relative h-full overflow-hidden transition-all duration-300 ease-out flex flex-col ${compact
          ? `rounded-lg ${enableHoverEffects ? 'sm:hover:-translate-y-1 sm:hover:shadow-xl' : ''} shadow-sm`
          : `rounded-lg ${enableHoverEffects ? 'sm:hover:-translate-y-2 sm:hover:shadow-xl' : ''} shadow-sm`
        }`}
      style={{ background: cardBackground }}
    >
      <div
        className={`pointer-events-none absolute inset-[1px] ${monochrome ? 'bg-gradient-to-b from-white/12 via-white/[0.03] to-transparent' : isLightCard ? 'bg-gradient-to-b from-white/55 via-white/20 to-transparent' : 'bg-gradient-to-b from-white/8 via-white/[0.02] to-transparent sm:from-white/12 sm:via-white/[0.03]'
          } ${compact ? 'rounded-lg' : 'rounded-lg'
          }`}
      />
      <div
        className={`pointer-events-none absolute -inset-[1px] transition-opacity duration-500 ${monochrome ? 'bg-gradient-to-br from-white/25 via-transparent to-white/10' : 'bg-gradient-to-br from-rose-400/20 via-transparent to-cyan-400/20'} ${compact ? 'rounded-3xl' : 'rounded-[2rem]'
          } ${enableHoverEffects ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
      />
      <div className={`pointer-events-none absolute inset-0 ${monochrome ? 'bg-gradient-to-b from-white/5 via-transparent to-black/30 opacity-80' : isLightCard ? 'bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-70' : 'bg-gradient-to-b from-white/4 via-transparent to-transparent opacity-45 sm:opacity-60'}`} />
      {product.isBestSeller && (
        <div className="product-best-seller-badge absolute right-3 top-3 z-20 rounded-full border border-white/25 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_10px_22px_-14px_rgba(255,255,255,0.9)]">
          Best Seller
        </div>
      )}
      {!product.isBestSeller && product.isNewArrival && (
        <div className="product-new-arrival-badge absolute right-3 top-3 z-20 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] shadow-[0_10px_22px_-14px_rgba(14,165,233,0.9)]">
          New Arrival
        </div>
      )}
      <Link to={`/product/${getProductSlug(product)}`} className={`product-card-media relative flex items-center justify-center overflow-hidden bg-transparent ${compact ? 'min-h-[190px] sm:min-h-[230px]' : ''} ${imageAspectClassName || (compact ? 'aspect-[4/3]' : 'aspect-[4/5]')}`}>
        <img
          src={activeImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          sizes={compact ? "(max-width: 640px) 45vw, 25vw" : "(max-width: 640px) 80vw, 35vw"}
          width={640}
          height={800}
          className={`product-card-first-image h-full w-full ${imageFit === 'cover' ? 'object-cover' : 'object-contain'} object-center transition-all duration-300 ease-out ${enableHoverEffects ? 'group-hover:scale-[1.025]' : ''
            }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${enableHoverEffects ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
            }`}
        />
      </Link>

      <div className={`${compact ? 'p-2.5 sm:p-3.5' : 'p-4 sm:p-6'} flex flex-col flex-1`}>
        {previewImages.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            {previewImages.map((image, index) => (
              <Link
                key={`${image}-${index}`}
                to={`/product/${getProductSlug(product)}`}
                className="grid h-11 w-11 place-items-center rounded-md border border-[#0ea5e9] bg-white p-1 shadow-sm sm:h-12 sm:w-12"
                aria-label={`View ${product.name} preview ${index + 1}`}
              >
                <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" aria-hidden="true" />
              </Link>
            ))}
            {extraPreviewCount > 0 && (
              <Link
                to={`/product/${getProductSlug(product)}`}
                className="grid h-11 w-11 place-items-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-500 shadow-sm sm:h-12 sm:w-12"
                aria-label={`View ${extraPreviewCount} more ${product.name} previews`}
              >
                +{extraPreviewCount}
              </Link>
            )}
          </div>
        )}
        <Link to={`/product/${getProductSlug(product)}`}>
          <h3
            className={`${compact ? 'truncate text-[13px] sm:text-sm' : 'truncate text-sm sm:text-base'} font-semibold ${cardTextClass} leading-tight transition-colors [font-family:Arial,Helvetica,sans-serif] ${hoverTextClass}`}
          >
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-black text-[#ff9f43] sm:text-xs">
          <span aria-hidden="true">{'\u2605\u2605\u2605\u2605\u2605'}</span>
          <span className={cardTextClass}>{Number(product.rating || 4.8).toFixed(1)}</span>
          <span className={mutedTextClass}>({product.reviewCount || product.reviews?.length || 48})</span>
        </div>

        <div className="product-card-price-row mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {offerPricing.rate <= 0 && mrp > salePrice && (
            <span className="product-card-mrp text-[11px] font-bold leading-none line-through sm:text-xs">
              &#8377;{mrp.toLocaleString('en-IN')}
            </span>
          )}
          {offerPricing.rate > 0 && (
            <span className="product-card-mrp text-[11px] font-bold leading-none line-through sm:text-xs">
              {formatInrAmount(salePrice)}
            </span>
          )}
          <span className={`product-card-price text-sm font-black leading-none sm:text-base ${offerPricing.rate > 0 ? 'text-emerald-600' : ''}`}>
            {formatInrAmount(offerPricing.unitOfferPrice)}
          </span>
        </div>
        {offerPricing.rate > 0 && (
          <p className="mt-1 text-[11px] font-bold leading-tight text-emerald-600 sm:text-xs">
            Save {formatInrAmount(offerPricing.unitDiscount)} ({offerPricing.rateLabel} off)
          </p>
        )}

        <div className={compact ? 'mt-auto grid grid-cols-2 gap-2 pt-3' : 'mt-auto grid gap-2 pt-4 sm:pt-5'}>
          <Button
            size="sm"
            variant={compact ? 'primary' : 'primary'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (canAdd) {
                handleAddToCart();
              } else {
                handleOpenNotify();
              }
            }}
            className={
              compact
                ? 'product-card-add-cart-btn h-8 w-full !rounded-md !border-black !bg-black px-2 text-[10px] font-black !text-white !shadow-none hover:!bg-slate-800 sm:text-[11px]'
                : 'product-card-add-cart-btn h-10 w-full !rounded-lg !border-black !bg-black px-4 text-xs font-black !text-white !shadow-none hover:!bg-slate-800'
            }
          >
            {notifySubmitting ? 'Saving...' : canAdd ? 'Add to Cart' : 'Notify me'}
          </Button>
          {canAdd && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBuyNow();
              }}
              className={compact
                ? 'product-card-action-maroon product-card-buy-now-btn h-8 w-full !rounded-md !border-[#540000] !bg-[#540000] px-2 text-[10px] font-black !text-white !shadow-none hover:!bg-[#3f0000] sm:text-[11px]'
                : 'product-card-action-maroon product-card-buy-now-btn h-10 w-full !rounded-lg !border-[#540000] !bg-[#540000] px-4 text-xs font-black !text-white !shadow-none hover:!bg-[#3f0000]'
              }
            >
              Buy Now
            </Button>
          )}
        </div>
      </div>
    </div>
    {showNotifyModal && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#080910] p-5 text-white shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">Out of stock</p>
              <h3 className="mt-2 text-xl font-bold">Notify me</h3>
              <p className="mt-1 text-sm text-gray-300">{product.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNotifyModal(false)}
              className="rounded-full border border-white/10 px-2 py-1 text-sm text-gray-300 hover:bg-white/10"
              aria-label="Close notify me popup"
            >
              X
            </button>
          </div>
          {notifyMessage && (
            <p className={`mt-3 text-sm ${notifyMessage.startsWith('Done') ? 'text-green-300' : 'text-rose-300'}`}>
              {notifyMessage}
            </p>
          )}
          <Button type="button" size="sm" className="mt-5 w-full rounded-xl" onClick={() => setShowNotifyModal(false)}>
            Close
          </Button>
        </div>
      </div>
    )}
    </>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
