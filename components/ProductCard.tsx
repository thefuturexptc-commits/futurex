import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Button } from './ui/Button';
import { toProductSlug } from '../services/backend';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  imageAspectClassName?: string;
  disableHoverEffects?: boolean;
}

const imageTintCache = new Map<string, string>();
const DEFAULT_TINT = 'rgba(15, 23, 42, 0.96)';

interface CardPalette {
  tint: string;
  deepTint: string;
  isLight: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageTint, setImageTint] = useState(DEFAULT_TINT);
  const [imageDeepTint, setImageDeepTint] = useState('rgba(11, 16, 26, 0.96)');
  const [isLightCard, setIsLightCard] = useState(false);
  const supportsHover =
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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
    let cancelled = false;
    void getImageTint(activeImage).then(({ tint, deepTint, isLight }) => {
      if (cancelled) return;
      setImageTint(tint);
      setImageDeepTint(deepTint);
      setIsLightCard(isLight);
    });
    return () => {
      cancelled = true;
    };
  }, [activeImage]);

  const handleAddToCart = () => {
    if (!user) {
      openLogin(`/product/${toProductSlug(product.name)}`);
      return;
    }
    addToCart(product);
  };

  const cardTextClass = isLightCard ? 'text-gray-900' : 'text-white';
  const mutedTextClass = isLightCard ? 'text-gray-500' : 'text-gray-400';
  const categoryChipClass = isLightCard ? 'text-cyan-700 bg-cyan-100/90' : 'text-primary-300 bg-primary-900/30';
  const ratingClass = isLightCard ? 'text-amber-500' : 'text-amber-400';
  const hoverTextClass = enableHoverEffects ? 'group-hover:text-primary-300' : '';

  return (
    <div
      className={`group relative h-full overflow-hidden transition-all duration-500 ease-out border flex flex-col ${
        compact
          ? `rounded-3xl ${enableHoverEffects ? 'sm:hover:-translate-y-1.5 sm:hover:shadow-[0_22px_48px_rgba(0,0,0,0.52)]' : ''} shadow-[0_8px_18px_rgba(0,0,0,0.26)] sm:shadow-[0_12px_28px_rgba(0,0,0,0.34)]`
          : `rounded-[2rem] ${enableHoverEffects ? 'sm:hover:-translate-y-3 sm:hover:shadow-[0_28px_58px_rgba(0,0,0,0.5)] sm:hover:scale-[1.03]' : ''} shadow-[0_10px_22px_rgba(0,0,0,0.28)] sm:shadow-[0_14px_30px_rgba(0,0,0,0.36)]`
      } ${isLightCard ? 'border-gray-200' : 'border-white/10'}`}
      style={{ background: `linear-gradient(165deg, ${imageTint} 0%, ${imageDeepTint} 68%)` }}
    >
      <div
        className={`pointer-events-none absolute inset-[1px] ${
          isLightCard ? 'bg-gradient-to-b from-white/55 via-white/20 to-transparent' : 'bg-gradient-to-b from-white/8 via-white/[0.02] to-transparent sm:from-white/12 sm:via-white/[0.03]'
        } ${
          compact ? 'rounded-3xl' : 'rounded-[2rem]'
        }`}
      />
      <div
        className={`pointer-events-none absolute -inset-[1px] transition-opacity duration-500 bg-gradient-to-br from-rose-400/20 via-transparent to-cyan-400/20 ${
          compact ? 'rounded-3xl' : 'rounded-[2rem]'
        } ${enableHoverEffects ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
      />
      <div className={`pointer-events-none absolute inset-0 ${isLightCard ? 'bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-70' : 'bg-gradient-to-b from-white/4 via-transparent to-transparent opacity-45 sm:opacity-60'}`} />
      <Link to={`/product/${toProductSlug(product.name)}`} className={`block relative overflow-hidden ${imageAspectClassName || (compact ? 'aspect-[4/3]' : 'aspect-[4/5]')}`}>
        <img
          src={activeImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          sizes={compact ? "(max-width: 640px) 45vw, 25vw" : "(max-width: 640px) 80vw, 35vw"}
          width={640}
          height={800}
          className={`w-full h-full object-contain object-center transition-all duration-300 ease-out ${
            enableHoverEffects ? 'group-hover:scale-105' : ''
          } ${compact ? 'p-1.5' : 'p-2'}`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${
            enableHoverEffects ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
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
            {product.colors.slice(0, 5).map((color) => (
              <button
                key={`${product.id}_${color.name}`}
                type="button"
                className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full border ${isLightCard ? 'border-gray-300' : 'border-white/30'} transition-transform ${enableHoverEffects ? 'hover:scale-110' : ''}`}
                style={{ backgroundColor: color.hex }}
                onMouseEnter={() => setPreviewImage(color.images?.[0] || null)}
                onMouseLeave={() => setPreviewImage(null)}
                aria-label={color.name}
              />
            ))}
          </div>
        )}

        <div className={compact ? 'mt-auto pt-2 space-y-2.5' : 'flex items-center justify-between mt-auto pt-3 sm:pt-5'}>
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
            variant={compact ? 'primary' : 'outline'}
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            disabled={!canAdd}
            className={
              compact
                ? 'w-full rounded-full px-4 py-2 text-xs font-semibold shadow-sm'
                : `w-10 h-10 rounded-full p-0 flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isLightCard ? 'border-gray-300 text-gray-800' : 'border-white/20 text-white'
                  } ${enableHoverEffects ? 'hover:border-primary-500 hover:bg-primary-500 hover:text-white' : ''}`
            }
          >
            {compact ? 'Add to Cart' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
