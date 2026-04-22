import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Button } from './ui/Button';
import { addProductNotifyRequest } from '../services/backend';

const toProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
  const mrp = Number(product.mrp || product.price || 0);
  const savings = Math.max(0, mrp - salePrice);
  const percent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;

  const selectedColorStock = useMemo(() => {
    const firstColor = product.colors?.[0];
    if (!firstColor) return Number(product.stock || 0) - Number(product.reservedStock || 0);
    return Number(firstColor.stock || 0) - Number(firstColor.reservedStock || 0);
  }, [product.colors, product.stock, product.reservedStock]);
  const canAdd = selectedColorStock > 0;
  const viewingNow = useMemo(() => {
    const seed = String(product.id || product.name)
      .split('')
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return (seed % 17) + 3;
  }, [product.id, product.name]);

  const defaultImage = useMemo(() => {
    return product.colors?.[0]?.images?.[0] || product.images?.[0] || 'https://picsum.photos/400';
  }, [product.colors, product.images]);
  const activeImage = previewImage || defaultImage;

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
    if (!user) {
      openLogin(`/product/${toProductSlug(product.name)}`);
      return;
    }
    addToCart(product);
  };

  const handleOpenNotify = async () => {
    if (!user) {
      openLogin(`/product/${toProductSlug(product.name)}`);
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

  const cardTextClass = monochrome ? 'text-white' : isLightCard ? 'text-gray-900' : 'text-white';
  const mutedTextClass = monochrome ? 'text-gray-400' : isLightCard ? 'text-gray-500' : 'text-gray-400';
  const categoryChipClass = monochrome ? 'border border-cyan-300/30 bg-cyan-300/12 text-cyan-100' : isLightCard ? 'text-cyan-700 bg-cyan-100/90' : 'text-primary-300 bg-primary-900/30';
  const ratingClass = monochrome ? 'text-gray-200' : isLightCard ? 'text-amber-500' : 'text-amber-400';
  const hoverTextClass = enableHoverEffects ? (monochrome ? 'group-hover:text-white' : 'group-hover:text-primary-300') : '';
  const cardBackground = monochrome
    ? 'radial-gradient(540px 260px at 86% 4%, rgba(88, 94, 112, 0.34), transparent 64%), radial-gradient(460px 260px at 54% 26%, rgba(150, 164, 190, 0.14), transparent 54%), linear-gradient(135deg, #03050a 0%, #10141d 42%, #05070d 100%)'
    : `linear-gradient(165deg, ${imageTint} 0%, ${imageDeepTint} 68%)`;
  const cardBorderClass = monochrome ? 'border-white/15' : isLightCard ? 'border-gray-200' : 'border-white/10';

  return (
    <>
    <div
      className={`product-card-dark group relative h-full overflow-hidden transition-all duration-500 ease-out border flex flex-col ${compact
          ? `rounded-3xl ${enableHoverEffects ? 'sm:hover:-translate-y-1.5 sm:hover:shadow-[0_22px_48px_rgba(0,0,0,0.52)]' : ''} shadow-[0_8px_18px_rgba(0,0,0,0.26)] sm:shadow-[0_12px_28px_rgba(0,0,0,0.34)]`
          : `rounded-[2rem] ${enableHoverEffects ? 'sm:hover:-translate-y-3 sm:hover:shadow-[0_28px_58px_rgba(0,0,0,0.5)] sm:hover:scale-[1.03]' : ''} shadow-[0_10px_22px_rgba(0,0,0,0.28)] sm:shadow-[0_14px_30px_rgba(0,0,0,0.36)]`
        } ${cardBorderClass}`}
      style={{ background: cardBackground }}
    >
      <div
        className={`pointer-events-none absolute inset-[1px] ${monochrome ? 'bg-gradient-to-b from-white/12 via-white/[0.03] to-transparent' : isLightCard ? 'bg-gradient-to-b from-white/55 via-white/20 to-transparent' : 'bg-gradient-to-b from-white/8 via-white/[0.02] to-transparent sm:from-white/12 sm:via-white/[0.03]'
          } ${compact ? 'rounded-3xl' : 'rounded-[2rem]'
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
      <Link to={`/product/${toProductSlug(product.name)}`} className={`product-card-media relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.82)_58%,#000_100%)] ${imageAspectClassName || (compact ? 'aspect-[4/3] p-3 sm:p-4' : 'aspect-[4/5] p-4')}`}>
        <img
          src={activeImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          sizes={compact ? "(max-width: 640px) 45vw, 25vw" : "(max-width: 640px) 80vw, 35vw"}
          width={640}
          height={800}
          className={`h-full max-h-full w-full max-w-full ${imageFit === 'cover' ? 'object-cover' : 'object-contain'} object-center transition-all duration-300 ease-out ${enableHoverEffects ? 'group-hover:scale-[1.025]' : ''
            }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${enableHoverEffects ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
            }`}
        />
      </Link>

      <div className={`${compact ? 'p-3 sm:p-3.5' : 'p-4 sm:p-6'} flex flex-col flex-1`}>
        <div className={compact ? 'mb-2 flex justify-between items-start gap-2' : 'mb-3 flex justify-between items-start'}>
          <span className={`${compact ? 'text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded' : 'text-[9px] sm:text-[10px] px-2 py-1 rounded-md'} font-bold uppercase tracking-widest ${categoryChipClass}`}>{product.category}</span>
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 ${ratingClass}`}>
            <span>*</span> {product.rating || 0}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          {canAdd && selectedColorStock <= 5 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
              Only {selectedColorStock} left
            </span>
          )}
          {!compact && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLightCard ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-300'}`}>
              {viewingNow} viewing now
            </span>
          )}
        </div>

        <Link to={`/product/${toProductSlug(product.name)}`}>
          <h3
            className={`${compact ? 'text-[12px] sm:text-sm mb-1 min-h-[1.9rem]' : 'text-sm sm:text-lg mb-1.5 sm:mb-2 min-h-[2.4rem] sm:min-h-[3rem]'} font-bold ${cardTextClass} leading-tight transition-colors font-display overflow-hidden ${hoverTextClass}`}
            style={{ display: '-webkit-box', WebkitLineClamp: compact ? 2 : 2, WebkitBoxOrient: 'vertical' }}
          >
            {product.name}
          </h3>
        </Link>

        {!!product.colors?.length && (
          <div className={compact ? 'flex items-center gap-2 mt-2' : 'flex items-center gap-2 mt-3'}>
            {product.colors.slice(0, 5).map((color) => {
              const isActive = previewImage === (color.images?.[0] || null) || (!previewImage && product.colors![0] === color);
              return (
                <button
                  key={`${product.id}_${color.name}`}
                  type="button"
                  className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full border-2 transition-transform ${
                    isActive
                      ? (isLightCard ? 'border-gray-700 scale-110' : 'border-white scale-110')
                      : (isLightCard ? 'border-gray-300' : 'border-white/30')
                  } ${enableHoverEffects ? 'hover:scale-110' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPreviewImage(color.images?.[0] || null);
                  }}
                  onMouseEnter={() => supportsHover && setPreviewImage(color.images?.[0] || null)}
                  onMouseLeave={() => supportsHover && setPreviewImage(null)}
                  aria-label={color.name}
                />
              );
            })}
          </div>
        )}

        <div className={compact ? 'mt-auto pt-2 space-y-2.5' : 'flex flex-col gap-2 mt-auto pt-3 sm:pt-5'}>
          <div className={`flex flex-col ${compact ? '' : ''}`}>
            <span className={`${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-bold ${cardTextClass} font-display leading-none`}>Rs {salePrice}</span>
            <div className="flex items-center gap-1.5">
              <span className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} line-through ${mutedTextClass}`}>Rs {mrp}</span>
              {percent > 0 && <span className="text-xs text-green-500 font-semibold">{percent}% off</span>}
            </div>
            <span className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} font-semibold mt-0.5 ${canAdd ? (isLightCard ? 'text-emerald-600' : 'text-green-400') : 'text-red-500'}`}>
              {canAdd ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
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
                ? 'h-9 w-full rounded-full px-4 text-xs font-semibold shadow-sm sm:h-10'
                : 'h-10 w-full rounded-full px-4 text-xs font-semibold shadow-sm'
            }
          >
            {notifySubmitting ? 'Saving...' : canAdd ? 'Add to Cart' : 'Notify me'}
          </Button>
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
