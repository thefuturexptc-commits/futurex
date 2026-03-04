import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Button } from './ui/Button';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  imageAspectClassName?: string;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, compact = false, imageAspectClassName }) => {
  const { addToCart } = useCart();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  return (
    <div className="group relative h-full rounded-[2rem] overflow-hidden text-white transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-2xl hover:scale-[1.03] bg-dark-surface border border-white/10 flex flex-col">
      <div className="pointer-events-none absolute -inset-[1px] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-rose-400/20 via-transparent to-cyan-400/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent opacity-70" />
      <Link to={`/product/${product.id}`} className={`block relative overflow-hidden bg-gray-100 dark:bg-white/5 ${imageAspectClassName || (compact ? 'aspect-[4/3]' : 'aspect-[4/5]')}`}>
        <img
          src={previewImage || defaultImage}
          alt={product.name}
          loading="lazy"
          width={640}
          height={800}
          className="w-full h-full object-contain object-center p-2 group-hover:scale-105 transition-all duration-300 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute left-2 right-2 bottom-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/product/${product.id}`;
              }}
              className="rounded-lg bg-white/90 text-gray-900 text-[11px] font-semibold py-1.5"
            >
              View
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(
                  new CustomEvent('product:compare-add', {
                    detail: { id: product.id, name: product.name },
                  })
                );
              }}
              className="rounded-lg bg-white/90 text-gray-900 text-[11px] font-semibold py-1.5"
            >
              Compare
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                addToCart(product);
              }}
              disabled={!canAdd}
              className="rounded-lg bg-primary-600 text-white text-[11px] font-semibold py-1.5 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </Link>

      <div className={`${compact ? 'p-4' : 'p-6'} flex flex-col flex-1`}>
        <div className={compact ? 'mb-2 flex justify-between items-start' : 'mb-3 flex justify-between items-start'}>
          <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest bg-primary-900/20 px-2 py-1 rounded-md">{product.category}</span>
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
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
            {viewingNow} viewing now
          </span>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3
            className={`${compact ? 'text-sm sm:text-base mb-1 min-h-[2.5rem]' : 'text-base sm:text-lg mb-2 min-h-[3rem]'} font-bold text-white leading-tight group-hover:text-primary-300 transition-colors font-display overflow-hidden`}
            style={{ display: '-webkit-box', WebkitLineClamp: compact ? 2 : 3, WebkitBoxOrient: 'vertical' }}
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
                className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded-full border border-white/30 hover:scale-110 transition-transform`}
                style={{ backgroundColor: color.hex }}
                onMouseEnter={() => setPreviewImage(color.images?.[0] || null)}
                onMouseLeave={() => setPreviewImage(null)}
                aria-label={color.name}
              />
            ))}
          </div>
        )}

        <div className={compact ? 'flex items-center justify-between mt-auto pt-3' : 'flex items-center justify-between mt-auto pt-5'}>
          <div className="flex flex-col">
            <span className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-white font-display`}>Rs {salePrice}</span>
            <div className="flex items-center gap-2">
              <span className="line-through text-xs text-gray-400">Rs {mrp}</span>
              {percent > 0 && <span className="text-xs text-green-500 font-semibold">{percent}% off</span>}
            </div>
            <span className={`text-xs font-semibold mt-1 ${canAdd ? 'text-green-500' : 'text-red-500'}`}>
              {canAdd ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            disabled={!canAdd}
            className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-full p-0 flex items-center justify-center border-white/20 hover:border-primary-500 hover:bg-primary-500 hover:text-white transition-all duration-300 shadow-sm`}
          >
            <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
