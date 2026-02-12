import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { getProducts } from '../services/backend';

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);

  // Helper to get route from category name
  const getCategoryRoute = (cat: string) => {
    const map: Record<string, string> = {
        'Smart Bands': '/smart-bands',
        'Smart Rings': '/smart-rings',
        'Smart Fans': '/smart-fans',
        'Smart Monitoring': '/smart-monitoring'
    };
    return map[cat] || '/shop/all';
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[700px] flex items-center justify-center overflow-hidden bg-white dark:bg-dark-bg">
        
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gray-50 dark:bg-dark-bg transition-colors duration-500">
           {/* Tech Grid Pattern */}
           <div className="absolute inset-0 bg-grid-pattern opacity-60 z-0"></div>
           
           {/* Animated Gradient Orbs */}
           <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-primary-200/40 to-purple-200/40 dark:from-primary-900/20 dark:to-purple-900/20 rounded-full blur-[100px] animate-float-fast opacity-70"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-200/40 to-blue-200/40 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-full blur-[120px] animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="animate-fade-in-up space-y-8 max-w-5xl mx-auto">
            
            {/* Tech Badge */}
            <div className="flex justify-center mb-8">
                <div className="glass-card px-6 py-2 rounded-full border border-primary-100 dark:border-white/10 flex items-center gap-3 shadow-lg">
                   <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                   <span className="text-xs font-bold tracking-[0.25em] uppercase text-gray-800 dark:text-gray-200 font-display">
                      Future Ready · Series X
                   </span>
                </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-gray-900 dark:text-white leading-[0.95] font-display">
              WEAR THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-primary-600 dark:from-primary-400 dark:via-purple-400 dark:to-primary-400 animate-pulse-slow">
                FUTURE
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
              Advanced biometrics. Seamless connectivity. Designed for the visionaries of tomorrow.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
              <Link to="/smart-bands">
                 <Button size="lg" className="w-full sm:w-auto h-16 px-12 text-lg rounded-full shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300 font-display tracking-wide">
                     START EXPLORING
                 </Button>
              </Link>
              <Link to="/shop/all">
                 <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 text-lg rounded-full border-gray-900/10 dark:border-white/20 bg-white/40 dark:bg-black/20 backdrop-blur-md hover:bg-white dark:hover:bg-white/10 hover:border-gray-900 dark:hover:border-white transition-all duration-300 font-display tracking-wide">
                     VIEW COLLECTION
                 </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Abstract Tech Elements */}
        <div className="absolute top-1/3 left-10 hidden lg:block opacity-20 pointer-events-none animate-spin-slow">
           <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="currentColor" className="text-gray-900 dark:text-white">
              <circle cx="100" cy="100" r="90" strokeWidth="1" strokeDasharray="10 10"/>
              <circle cx="100" cy="100" r="70" strokeWidth="1"/>
              <path d="M100 0 L100 200 M0 100 L200 100" strokeWidth="1"/>
           </svg>
        </div>
      </section>

      {/* Floating Category Cards - Overlapping Hero */}
      <section className="relative z-20 -mt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring'].map((cat, idx) => (
                <Link key={cat} to={getCategoryRoute(cat)} className="group relative h-80 rounded-[2rem] overflow-hidden cursor-pointer glass-card transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border-white/50">
                {/* Image */}
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800">
                    <img 
                        src={`https://picsum.photos/seed/${cat}tech/500/700`} 
                        alt={cat} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                    />
                </div>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/10 to-transparent dark:from-black/95 dark:via-black/10 dark:to-transparent opacity-100 transition-opacity"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2 font-display">Series 0{idx + 1}</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight font-display">{cat}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </div>
                    </div>
                </div>
                </Link>
            ))}
            </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-24 relative overflow-hidden bg-white/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
                <span className="text-primary-600 dark:text-primary-400 font-bold tracking-widest uppercase text-xs font-display mb-2 block">Customer Favorites</span>
                <h2 className="text-5xl font-bold text-gray-900 dark:text-white font-display">Best Sellers</h2>
            </div>
            <Link to="/shop/all" className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors font-display tracking-wide">
                VIEW ALL 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-20">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Featured / New Arrivals Section */}
      <section className="py-24 bg-gray-50/50 dark:bg-white/5 relative border-y border-gray-200 dark:border-white/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="text-center mb-16">
                 <span className="inline-block py-1.5 px-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm border border-purple-200/50 dark:border-purple-700/30 font-display">
                    Just Dropped
                 </span>
                 <h2 className="text-5xl font-bold text-gray-900 dark:text-white font-display">New Arrivals</h2>
                 <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light text-lg">
                    Cutting-edge technology designed to seamlessly integrate into your lifestyle.
                 </p>
              </div>

              {loading ? (
                 <div className="flex justify-center py-20">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                 </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
          </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        {/* Background blobs for this section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-primary-100/30 to-purple-100/30 dark:from-primary-900/10 dark:to-purple-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto glass-card rounded-[3rem] p-10 md:p-20 text-center relative border border-white/60 dark:border-white/10 shadow-2xl">
             <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 font-display">Join the Revolution.</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-lg mx-auto leading-relaxed">
                    Be the first to experience the next generation of wearable tech. Exclusive drops for members.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="flex-1 px-6 py-4 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white shadow-inner"
                    />
                    <Button className="rounded-full px-10 py-4 font-display tracking-wide shadow-lg shadow-primary-500/20">SUBSCRIBE</Button>
                </div>
             </div>
        </div>
      </section>
    </div>
  );
};