import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from '../components/ProductCard';
import { ProductComparisonSection } from '../components/ProductComparisonSection';
import { getEffectivePrice, isSameCollection } from '../utils/productCollections';
import { productMatchesSearch } from '../utils/productSearch';

export const Shop: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const normalizedRouteCategory = (category || 'all').trim().toLowerCase();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = useCallback(() => {
    setLoading(true);
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(() => {
      setProducts([]);
      setLoading(false);
    });
  }, []);

  useEffect(() => loadProducts(), [loadProducts]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProducts);
    return () => window.removeEventListener('products-updated', loadProducts);
  }, [loadProducts]);

  useEffect(() => {
    let result = [...products];
    
    // 1. Filter by Category
    if (normalizedRouteCategory !== 'all') {
      result = result.filter(
        (p) => isSameCollection(p.category, normalizedRouteCategory)
      );
    }

    // 2. Filter by Search Query
    if (searchQuery) {
        result = result.filter(p => productMatchesSearch(p, searchQuery));
    }

    // 3. Sort
    if (sortBy === 'low-high') {
      result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'z-a') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // Default 'featured' sorts Featured items first, then by default order
        result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
    }

    setFilteredProducts(result);
  }, [normalizedRouteCategory, products, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-white px-4 pb-16 pt-8 text-slate-950 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-7xl">
      {/* Header & Controls */}
      <div className="mb-8 flex flex-col gap-6 rounded-xl border border-slate-200 bg-[#fbfdfd] p-5 shadow-[0_18px_55px_rgba(15,63,70,0.08)] animate-fade-in-up sm:mb-12 sm:gap-8 sm:p-8">
        
        {/* Title */}
        <div className="text-center md:text-left">
            <span className="text-xs font-bold tracking-[0.22em] uppercase text-cyan-700 font-display mb-2 block">
                {category === 'all' ? 'Catalogue' : 'Collection'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-slate-950 capitalize font-display break-words">
            {normalizedRouteCategory === 'all' ? 'All Products' : category}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:mx-0">
 Explore smart rings, smart bands, monitoring devices and connected products for everyday wellness and digital programs.
            </p>
        </div>

        {/* Search and Sort Toolbar */}
        <div className="flex flex-col items-stretch gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm md:flex-row md:items-center sm:gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <input 
                    type="text"
                    placeholder="Search for products..."
                    className="block w-full pl-11 pr-4 py-3 border-none rounded-lg leading-5 bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-150 ease-in-out sm:text-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-3 w-full md:w-auto px-1 sm:px-2 md:px-4 pt-1 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200">
              <label className="text-xs font-bold text-slate-500 whitespace-nowrap uppercase tracking-wider font-display">Sort by</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full md:w-48 pl-2 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-950 font-bold font-display cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="featured">New & Featured</option>
                <option value="rating">Top Rated</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="a-z">Name: A - Z</option>
                <option value="z-a">Name: Z - A</option>
              </select>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-500/30 rounded-full animate-ping"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
           </div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p, idx) => (
            <div
              key={p.id}
              className="opacity-0 home-product-slide"
              style={{ ['--reveal-delay' as string]: `${Math.min(idx, 7) * 80}ms` }}
            >
              <ProductCard product={p} compact imageAspectClassName="aspect-[4/3]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-card rounded-3xl border-dashed border-2 border-gray-200 dark:border-white/10">
           <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <h3 className="mt-4 text-xl font-bold text-slate-950 font-display">No products found</h3>
           <p className="mt-2 text-slate-500">Try adjusting your search or filters.</p>
        </div>
      )}
      </div>

      {!loading && filteredProducts.length > 0 && (
        <ProductComparisonSection
          products={filteredProducts}
          eyebrow="Filtered comparison"
          title="Compare Products"
          subtitle="Use the current search and sort results to compare price, features, availability, and everyday fit."
          className="-mx-4 mt-14 bg-[#f8fbfb] sm:-mx-8 lg:-mx-10"
        />
      )}
    </div>
  );
};
