import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { Button } from './ui/Button';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  imageAspectClassName?: string;
  disableHoverEffects?: boolean;
}

const imageTintCache = new Map<string, string>();
const DEFAULT_TINT = 'rgba(30, 41, 59, 0.58)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getImageTint = async (src: string): Promise<{ tint: string; deepTint: string }> => {
  if (!src) return { tint: DEFAULT_TINT, deepTint: 'rgba(11, 16, 26, 0.96)' };
  const cached = imageTintCache.get(src);
  if (cached) {
    const [tint = DEFAULT_TINT, deepTint = 'rgba(11, 16, 26, 0.96)'] = cached.split('|');
    return { tint, deepTint };
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
    if (!ctx) return { tint: DEFAULT_TINT, deepTint: 'rgba(11, 16, 26, 0.96)' };

    const sampleWidth = 18;
    const sampleHeight = 18;
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);

    const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    let rWeighted = 0;
    let gWeighted = 0;
    let bWeighted = 0;
    let totalWeight = 0;
    let rFallback = 0;
    let gFallback = 0;
    let bFallback = 0;
    let fallbackCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 20) continue;

      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const saturation = max - min;
      const brightness = (red + green + blue) / 3;

      rFallback += red;
      gFallback += green;
      bFallback += blue;
      fallbackCount += 1;

      const isNearWhiteOrGray = brightness > 222 && saturation < 20;
      const isNearBlackOrGray = brightness < 28 && saturation < 16;
      if (isNearWhiteOrGray || isNearBlackOrGray) continue;

      const weight = Math.max(1, saturation);
      rWeighted += red * weight;
      gWeighted += green * weight;
      bWeighted += blue * weight;
      totalWeight += weight;
    }

    const useFallback = totalWeight <= 0;
    const baseR = useFallback ? Math.round(rFallback / Math.max(1, fallbackCount)) : Math.round(rWeighted / totalWeight);
    const baseG = useFallback ? Math.round(gFallback / Math.max(1, fallbackCount)) : Math.round(gWeighted / totalWeight);
    const baseB = useFallback ? Math.round(bFallback / Math.max(1, fallbackCount)) : Math.round(bWeighted / totalWeight);

    const avgR = clamp(baseR, 25, 235);
    const avgG = clamp(baseG, 25, 235);
    const avgB = clamp(baseB, 25, 235);

    const deepR = clamp(Math.round(avgR * 0.42), 8, 120);
    const deepG = clamp(Math.round(avgG * 0.42), 8, 120);
    const deepB = clamp(Math.round(avgB * 0.42), 8, 120);

    const tint = `rgba(${avgR}, ${avgG}, ${avgB}, 0.48)`;
    const deepTint = `rgba(${deepR}, ${deepG}, ${deepB}, 0.94)`;
    imageTintCache.set(src, `${tint}|${deepTint}`);
    return { tint, deepTint };
  } catch {
    return { tint: DEFAULT_TINT, deepTint: 'rgba(11, 16, 26, 0.96)' };
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
    void getImageTint(activeImage).then(({ tint, deepTint }) => {
      if (cancelled) return;
      setImageTint(tint);
      setImageDeepTint(deepTint);
    });
    return () => {
      cancelled = true;
    };
  }, [activeImage]);

  const handleAddToCart = () => {
    if (!user) {
      openLogin(`/product/${product.id}`);
      return;
    }
    addToCart(product);
  };

  return (
    <div
      className={`group relative h-full overflow-hidden text-white transition-all duration-500 ease-out bg-dark-surface border border-white/10 flex flex-col ${
        compact
          ? `rounded-3xl ${enableHoverEffects ? 'sm:hover:-translate-y-1.5 sm:hover:shadow-[0_22px_48px_rgba(0,0,0,0.52)]' : ''} shadow-[0_8px_18px_rgba(0,0,0,0.26)] sm:shadow-[0_12px_28px_rgba(0,0,0,0.34)]`
          : `rounded-[2rem] ${enableHoverEffects ? 'sm:hover:-translate-y-3 sm:hover:shadow-[0_28px_58px_rgba(0,0,0,0.5)] sm:hover:scale-[1.03]' : ''} shadow-[0_10px_22px_rgba(0,0,0,0.28)] sm:shadow-[0_14px_30px_rgba(0,0,0,0.36)]`
      }`}
      style={{ background: `linear-gradient(165deg, ${imageTint} 0%, ${imageDeepTint} 68%)` }}
    >
      <div
        className={`pointer-events-none absolute inset-[1px] bg-gradient-to-b from-white/8 via-white/[0.02] to-transparent sm:from-white/12 sm:via-white/[0.03] ${
          compact ? 'rounded-3xl' : 'rounded-[2rem]'
        }`}
      />
      <div
        className={`pointer-events-none absolute -inset-[1px] transition-opacity duration-500 bg-gradient-to-br from-rose-400/20 via-transparent to-cyan-400/20 ${
          compact ? 'rounded-3xl' : 'rounded-[2rem]'
        } ${enableHoverEffects ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/4 via-transparent to-transparent opacity-45 sm:opacity-60" />
      <Link to={`/product/${product.id}`} className={`block relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent ${imageAspectClassName || (compact ? 'aspect-[4/3]' : 'aspect-[4/5]')}`}>
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
        <div className={compact ? 'mb-2 flex justify-between items-start' : 'mb-3 flex justify-between items-start'}>
          <span className={`${compact ? 'text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded' : 'text-[9px] sm:text-[10px] px-2 py-1 rounded-md'} font-bold text-primary-300 uppercase tracking-widest bg-primary-900/30`}>{product.category}</span>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold px-2 py-0.5">
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
              {viewingNow} viewing now
            </span>
          )}
        </div>

        <Link to={`/product/${product.id}`}>
          <h3
            className={`${compact ? 'text-[12px] sm:text-sm mb-1 min-h-[1.9rem]' : 'text-sm sm:text-lg mb-1.5 sm:mb-2 min-h-[2.4rem] sm:min-h-[3rem]'} font-bold text-white leading-tight transition-colors font-display overflow-hidden ${enableHoverEffects ? 'group-hover:text-primary-300' : ''}`}
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
                className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full border border-white/30 transition-transform ${enableHoverEffects ? 'hover:scale-110' : ''}`}
                style={{ backgroundColor: color.hex }}
                onMouseEnter={() => setPreviewImage(color.images?.[0] || null)}
                onMouseLeave={() => setPreviewImage(null)}
                aria-label={color.name}
              />
            ))}
          </div>
        )}

        <div className={compact ? 'flex items-center justify-between mt-auto pt-2' : 'flex items-center justify-between mt-auto pt-3 sm:pt-5'}>
          <div className="flex flex-col">
            <span className={`${compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-bold text-white font-display leading-none`}>Rs {salePrice}</span>
            <div className="flex items-center gap-1.5">
              <span className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} line-through text-gray-400`}>Rs {mrp}</span>
              {percent > 0 && <span className="text-xs text-green-500 font-semibold">{percent}% off</span>}
            </div>
            <span className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'} font-semibold mt-0.5 ${canAdd ? 'text-green-500' : 'text-red-500'}`}>
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
                ? 'min-w-[110px] rounded-full px-4 py-2 text-xs font-semibold shadow-sm'
                : `w-10 h-10 rounded-full p-0 flex items-center justify-center border-white/20 transition-all duration-300 shadow-sm ${enableHoverEffects ? 'hover:border-primary-500 hover:bg-primary-500 hover:text-white' : ''}`
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
