import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';

interface CategoryTemplateProps {
  category: string;
  title: string;
  subtitle: string;
  heroGradient: string; // CSS class for gradient
  heroImage?: string; // Optional custom image
  accentColor: string; // text-color class
}

export const CategoryTemplate: React.FC<CategoryTemplateProps> = ({ 
  category, 
  title, 
  subtitle, 
  heroGradient,
  accentColor
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    setLoading(true);
    getProducts().then(data => {
      // Filter by category immediately
      const categoryProducts = data.filter(p => p.category === category);
      setProducts(categoryProducts);
      setLoading(false);
    });
  }, [category]);

  useEffect(() => {
    let result = [...products];
    
    // Sort Logic
    if (sortBy === 'low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Featured
      result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
    }

    setFilteredProducts(result);
  }, [products, sortBy]);

  return (
    <div className="min-h-screen">
      {/* Unique Hero Section per Category */}
      <div className={`relative py-20 px-4 overflow-hidden ${heroGradient}`}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="md:w-2/3">
                <span className={`inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-4 font-display`}>
                    {category} Collection
                </span>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-display tracking-tight">
                    {title}
                </h1>
                <p className="text-lg text-white/80 max-w-xl leading-relaxed">
                    {subtitle}
                </p>
            </div>
        </div>
      </div>

      {/* Filter Bar & Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
                Showing <span className={`font-bold ${accentColor}`}>{filteredProducts.length}</span> results
            </p>
            
            <div className="flex items-center space-x-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sort</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="rating">Top Rated</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current text-gray-400"></div>
            </div>
        ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                <p className="text-xl font-bold text-gray-400">No products found in this category.</p>
            </div>
        )}
      </div>
    </div>
  );
};