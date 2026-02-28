import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { ProductCard } from '../components/ProductCard';

export const Shop: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const normalizedRouteCategory = (category || 'all').trim().toLowerCase();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const shopScrollerRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const handleHorizontalWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.currentTarget.scrollLeft += event.deltaY;
    event.preventDefault();
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...products];
    const getEffectivePrice = (p: Product) => Number(p.salePrice || p.price || 0);
    
    // 1. Filter by Category
    if (normalizedRouteCategory !== 'all') {
      result = result.filter(
        (p) => (p.category || '').trim().toLowerCase() === normalizedRouteCategory
      );
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

  const movingProducts = filteredProducts.length > 1 ? [...filteredProducts, ...filteredProducts] : filteredProducts;

  useEffect(() => {
    if (loading || filteredProducts.length < 2 || isAutoScrollPaused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const scroller = shopScrollerRef.current;
    if (!scroller) return;

    let rafId = 0;
    let lastTs = 0;
    const speedPxPerMs = 0.08;
    const tick = (ts: number) => {
      const current = shopScrollerRef.current;
      if (!current) return;
      if (!lastTs) lastTs = ts;
      const delta = Math.min(ts - lastTs, 32);
      lastTs = ts;
      const maxScroll = current.scrollWidth - current.clientWidth;
      if (maxScroll > 0) {
        const resetPoint = Math.min(current.scrollWidth / 2, maxScroll);
        current.scrollLeft += delta * speedPxPerMs;
        if (current.scrollLeft >= resetPoint) current.scrollLeft = 0;
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [loading, filteredProducts.length, isAutoScrollPaused]);

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
            {normalizedRouteCategory === 'all' ? 'All Products' : category}
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
                className="block w-full md:w-48 pl-2 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 font-bold font-display cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <div
          ref={shopScrollerRef}
          onWheel={handleHorizontalWheel}
          onMouseEnter={() => setIsAutoScrollPaused(true)}
          onMouseLeave={() => setIsAutoScrollPaused(false)}
          onTouchStart={() => setIsAutoScrollPaused(true)}
          onTouchEnd={() => setIsAutoScrollPaused(false)}
          className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing scroll-smooth"
        >
          {movingProducts.map((p, idx) => (
            <div
              key={`${p.id}_${idx}`}
              className="w-[74vw] sm:w-[46vw] lg:w-[29vw] xl:w-[26vw] min-w-[240px] max-w-[360px] shrink-0 snap-start opacity-0 home-product-slide"
              style={{ ['--reveal-delay' as '--reveal-delay']: `${Math.min(idx, 7) * 80}ms` }}
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
           <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white font-display">No products found</h3>
           <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};
