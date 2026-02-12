import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from './ProductCard';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CategoryTemplateProps {
  category: string;
  title: string;
  subtitle: string;
  heroGradient: string; // CSS class for gradient background
  heroImage: string; // URL for the hero image
  accentColor: string; // text-color class for accents
  features: Feature[];
}

export const CategoryTemplate: React.FC<CategoryTemplateProps> = ({ 
  category, 
  title, 
  subtitle, 
  heroGradient,
  heroImage,
  accentColor,
  features
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    setLoading(true);
    getProducts().then(data => {
      const categoryProducts = data.filter(p => p.category === category);
      setProducts(categoryProducts);
      setLoading(false);
    });
  }, [category]);

  useEffect(() => {
    let result = [...products];
    
    if (sortBy === 'low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
    }

    setFilteredProducts(result);
  }, [products, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500">
      
      {/* Immersive Hero Section */}
      <div className={`relative ${heroGradient} min-h-[60vh] flex items-center overflow-hidden`}>
        {/* Abstract Background Patterns */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/20 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 text-xs font-bold tracking-[0.2em] uppercase mb-6 font-display">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    {category} Series
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-display tracking-tight leading-none">
                    {title}
                </h1>
                <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                    {subtitle}
                </p>
            </div>

            {/* Hero Image */}
            <div className="relative flex justify-center lg:justify-end animate-float">
                <div className="relative z-10 w-full max-w-md aspect-square rounded-[3rem] overflow-hidden glass-card border-0 shadow-2xl shadow-black/30">
                     <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent z-10"></div>
                     <img 
                        src={heroImage} 
                        alt={category} 
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                     />
                </div>
                {/* Decorative Blur Behind Image */}
                <div className="absolute inset-0 bg-white/20 blur-[100px] rounded-full transform scale-75"></div>
            </div>
        </div>
      </div>

      {/* Feature Highlights Strip (Overlapping Hero) */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                  <div key={idx} className="glass-card bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300">
                      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gray-50 dark:bg-white/5 ${accentColor}`}>
                          {feature.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Available Models</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Explore the latest generation of {category}.</p>
            </div>
            
            <div className="flex items-center gap-4">
               <span className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap hidden sm:inline">Sort by:</span>
               <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white py-2.5 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[160px]"
                  >
                    <option value="featured">Featured</option>
                    <option value="rating">Top Rated</option>
                    <option value="low-high">Price: Low to High</option>
                    <option value="high-low">Price: High to Low</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
               </div>
            </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => (
                    <div key={i} className="bg-white dark:bg-white/5 rounded-[2rem] h-96 animate-pulse"></div>
                ))}
            </div>
        ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 12H4M12 20V4" /></svg>
                <p className="text-xl font-bold text-gray-900 dark:text-white font-display">Coming Soon</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">New {category} are being manufactured in our labs.</p>
            </div>
        )}
      </div>
    </div>
  );
};