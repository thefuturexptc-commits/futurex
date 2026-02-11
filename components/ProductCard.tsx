import React from 'react';
import { Product } from '../types';
import { Button } from './ui/Button';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="group relative glass-card rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-transparent border border-white/50 dark:border-white/5">
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-white/5">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply dark:mix-blend-normal"
        />
        
        {/* Overlay Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {product.isFeatured && (
            <span className="bg-white/90 dark:bg-purple-600/90 backdrop-blur text-purple-700 dark:text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm font-display">
                New
            </span>
            )}
            {product.isBestSeller && (
            <span className="bg-white/90 dark:bg-primary-500/90 backdrop-blur text-primary-700 dark:text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm font-display">
                Hot
            </span>
            )}
        </div>
      </Link>
      
      {/* Content */}
      <div className="p-6 relative">
        <div className="mb-3 flex justify-between items-start">
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest font-display bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-md">{product.category}</span>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold px-2 py-0.5">
              <span>★</span> {product.rating}
          </div>
        </div>
        
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors font-display">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-5">
          <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900 dark:text-white font-display">₹{product.price}</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(e) => {
                e.preventDefault(); 
                addToCart(product);
            }}
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center border-gray-200 dark:border-white/20 hover:border-primary-500 hover:bg-primary-500 hover:text-white dark:hover:border-primary-500 transition-all duration-300 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </Button>
        </div>
      </div>
    </div>
  );
};