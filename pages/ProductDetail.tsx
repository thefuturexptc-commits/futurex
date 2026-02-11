import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProductById } from '../services/backend';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id) {
      getProductById(id).then(p => {
        setProduct(p);
        setLoading(false);
      });
    }
  }, [id]);

  const handleBuyNow = () => {
    if (!product) return;
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(product);
    navigate('/checkout');
  };

  const handleAddToCart = () => {
      if(!user) {
          navigate('/login');
          return;
      }
      if(product) addToCart(product);
  }

  // Simple helper to check if video is a YouTube link
  const getEmbedUrl = (url: string) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.split('v=')[1] || url.split('/').pop();
          return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:text-white">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center dark:text-white">Product not found</div>;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Images */}
        <div className="space-y-6">
          <div className="aspect-square bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative group border border-gray-100 dark:border-white/10">
            <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover p-8 hover:scale-105 transition-transform duration-500" />
            
            {/* Navigation arrows if multiple images */}
            {product.images.length > 1 && (
                <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-800 dark:text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-800 dark:text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                </>
            )}
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-transparent bg-gray-100 dark:bg-white/5'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col pt-4">
           <span className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-[0.2em] text-sm mb-4 font-display block">{product.category}</span>
           <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-display leading-tight">{product.name}</h1>
           
           <div className="flex items-center mb-8">
             <div className="flex text-amber-400 mr-3 gap-1">
               {[...Array(5)].map((_, i) => (
                 <span key={i} className="text-xl">{i < Math.floor(product.rating) ? '★' : '☆'}</span>
               ))}
             </div>
             <span className="text-gray-500 dark:text-gray-400 font-medium text-sm border-l border-gray-300 dark:border-gray-700 pl-3">{product.reviewCount} verified reviews</span>
           </div>

           <p className="text-gray-600 dark:text-gray-300 text-lg mb-10 leading-relaxed font-light">
             {product.description}
           </p>

           <div className="text-5xl font-bold text-gray-900 dark:text-white mb-10 font-display">
             ₹{product.price}
           </div>

           <div className="grid grid-cols-2 gap-4 mb-10">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">{key}</span>
                  <span className="block font-semibold text-gray-900 dark:text-white font-display">{val}</span>
                </div>
              ))}
              {product.warranty && (
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20">
                  <span className="block text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-bold mb-1">Warranty</span>
                  <span className="block font-semibold text-purple-900 dark:text-purple-200 font-display">{product.warranty}</span>
                </div>
              )}
           </div>

           <div className="flex flex-col sm:flex-row gap-4 mt-auto">
             <Button size="lg" onClick={handleAddToCart} className="flex-1 rounded-full h-14 font-display tracking-wide text-lg shadow-xl shadow-primary-500/20">Add to Cart</Button>
             <Button size="lg" variant="secondary" onClick={handleBuyNow} className="flex-1 rounded-full h-14 font-display tracking-wide text-lg">Buy Now</Button>
           </div>
           
           <div className="mt-12 pt-10 border-t border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 font-display">Key Features</h3>
              <ul className="space-y-4">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-gray-600 dark:text-gray-300">
                      <div className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
      
      {/* Video Section */}
      {product.videoUrl && (
          <div className="mt-24">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-display">Experience It In Action</h2>
              </div>
              <div className="relative pt-[56.25%] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-white/10">
                  {product.videoUrl.includes('youtube') ? (
                       <iframe 
                          className="absolute top-0 left-0 w-full h-full"
                          src={getEmbedUrl(product.videoUrl)} 
                          title="Product Video" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                  ) : (
                      <video 
                        className="absolute top-0 left-0 w-full h-full" 
                        controls 
                        src={product.videoUrl}
                      >
                          Your browser does not support the video tag.
                      </video>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};