import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from '../components/ProductCard';

export const Shop: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...products];
    
    // 1. Filter by Category
    if (category && category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        );
    }

    // 3. Sort
    if (sortBy === 'low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'z-a') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else {
        // Default 'featured' sorts Featured items first, then by default order
        result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
    }

    setFilteredProducts(result);
  }, [category, products, sortBy, searchQuery]);

  return (
    <div className="min-h-screen pt-10 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col gap-8 mb-12 animate-fade-in-up">
        
        {/* Title */}
        <div className="text-center md:text-left">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 dark:text-gray-400 font-display mb-2 block">
                {category === 'all' ? 'Catalogue' : 'Collection'}
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white capitalize font-display">
            {category === 'all' ? 'All Products' : category}
            </h1>
        </div>

        {/* Search and Sort Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 p-2 rounded-2xl glass-card items-center border border-gray-100 dark:border-white/10 shadow-sm">
            
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
                    className="block w-full pl-11 pr-4 py-3 border-none rounded-xl leading-5 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition duration-150 ease-in-out sm:text-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-3 w-full md:w-auto px-4 border-l border-gray-200 dark:border-white/10">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider font-display">Sort by</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full md:w-48 pl-2 pr-8 py-2 text-sm border-none focus:outline-none focus:ring-0 rounded-lg bg-transparent text-gray-900 dark:text-white font-bold font-display cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-card rounded-3xl border-dashed border-2 border-gray-200 dark:border-white/10">
           <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white font-display">No products found</h3>
           <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};