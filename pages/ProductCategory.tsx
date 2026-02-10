import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_PRODUCTS, CATEGORIES } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const ProductCategory: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [priceRange, setPriceRange] = useState<number>(30000);
  const [sortBy, setSortBy] = useState<string>('featured');

  const categoryName = CATEGORIES.find(c => c.id === categoryId)?.name || 'Products';

  const filteredProducts = useMemo(() => {
    let products = MOCK_PRODUCTS.filter(p => p.category === categoryId);
    
    // Price Filter
    products = products.filter(p => p.price <= priceRange);

    // Sorting
    if (sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
    }

    return products;
  }, [categoryId, priceRange, sortBy]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">{categoryName}</h1>
          <p className="text-slate-500">Found {filteredProducts.length} items</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-6">
              <Filter className="w-5 h-5" /> Filters
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Price: ₹{priceRange.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sort By
                </label>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">
              No products found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};