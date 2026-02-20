import React, { useEffect, useState, useRef } from 'react';
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
  
  // Renamed to activeIndex to reflect that it can be an image or video
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Error state and Fallback state
  const [videoError, setVideoError] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  
  // Ref for video element to control playback
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      getProductById(id).then(p => {
        setProduct(p);
        setLoading(false);
      });
    }
  }, [id]);

  // Reset states when product changes
  useEffect(() => {
      setVideoError(false);
      setUseIframeFallback(false);
  }, [product]);

  // Effect to manage video playback based on visibility
  useEffect(() => {
      // Check if we should try to play the native video
      const shouldPlayNative = product?.videoUrl && !useIframeFallback && !videoError;
      
      if (shouldPlayNative && videoRef.current) {
          const videoIndex = product!.images.length;
          
          if (activeIndex === videoIndex) {
              // Video is active: Play it
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                  playPromise.then(() => {
                      setIsPlaying(true);
                  }).catch(error => {
                      // Autoplay often fails if not muted, or if user hasn't interacted. This is normal.
                      console.log("Autoplay prevented/paused:", error);
                      setIsPlaying(false);
                  });
              }
          } else {
              // Video is hidden: Pause it
              videoRef.current.pause();
              setIsPlaying(false);
          }
      }
  }, [activeIndex, product, videoError, useIframeFallback]);

  const handleManualPlay = () => {
      if (videoRef.current) {
          videoRef.current.play().catch(e => console.error("Play failed", e));
          setIsPlaying(true);
      }
  };

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

  // Robust helper to convert various URL formats to embeddable versions
  const getEmbedUrl = (url: string) => {
      if (!url) return '';
      
      // YouTube Standard
      if (url.includes('youtube.com/watch?v=')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`;
      } 
      // YouTube Short
      else if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`;
      }
      // YouTube Shorts URL
      else if (url.includes('youtube.com/shorts/')) {
          const videoId = url.split('shorts/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0`;
      }
      // Vimeo
      else if (url.includes('vimeo.com/')) {
          // Extract ID (handles vimeo.com/123456)
          const match = url.match(/vimeo\.com\/(\d+)/);
          if (match && match[1]) {
             return `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`;
          }
      }
      
      return url;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:text-white">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center dark:text-white">Product not found</div>;

  const hasVideo = !!product.videoUrl;
  const mediaCount = product.images.length + (hasVideo ? 1 : 0);
  
  // Initial check: is it obviously an external link?
  const isObviousEmbed = product.videoUrl && (
      product.videoUrl.includes('youtube') || 
      product.videoUrl.includes('youtu.be') || 
      product.videoUrl.includes('vimeo')
  );

  // Determine if we show Iframe or Native Video
  const showIframe = isObviousEmbed || useIframeFallback;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev === mediaCount - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev === 0 ? mediaCount - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Media Gallery (Images + Video) */}
        <div className="space-y-6">
          <div className="aspect-square bg-white dark:bg-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative group border border-gray-100 dark:border-white/10 flex items-center justify-center bg-gray-100 dark:bg-gray-900 z-0">
            
            {/* Image Layer */}
            {/* When active, Image is z-10. When inactive, z-0 and opacity-0 */}
            <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 pointer-events-none ${activeIndex < product.images.length ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                {activeIndex < product.images.length && (
                    <img 
                        src={product.images[activeIndex]} 
                        alt={product.name} 
                        className="w-full h-full object-cover p-8 hover:scale-105 transition-transform duration-500" 
                    />
                )}
            </div>

            {/* Video Layer */}
            {hasVideo && (
                <div 
                    className={`absolute inset-0 w-full h-full bg-black flex items-center justify-center transition-all duration-300
                    ${activeIndex === product.images.length ? 'opacity-100 z-30 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
                >
                    {showIframe ? (
                         activeIndex === product.images.length && (
                            <iframe 
                                className="w-full h-full"
                                src={getEmbedUrl(product.videoUrl!)} 
                                title="Product Video" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                         )
                    ) : (
                        <div className="relative w-full h-full">
                            {videoError ? (
                                /* Fallback View when Video Fails (Final Error State) */
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-50 p-6 text-center">
                                     {product.images[0] && (
                                         <img src={product.images[0]} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" alt="" />
                                     )}
                                     <div className="relative z-10 flex flex-col items-center p-6 bg-white/90 dark:bg-black/80 backdrop-blur rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
                                         <svg className="w-12 h-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                         <p className="font-bold text-gray-900 dark:text-white text-lg">
                                             {product.videoUrl?.startsWith('blob:') ? "Session Video Expired" : "Video Unavailable"}
                                         </p>
                                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[200px]">
                                             {product.videoUrl?.startsWith('blob:') 
                                                ? "This temporary video was lost on refresh. Please re-upload it in Admin."
                                                : "The video link could not be loaded."
                                             }
                                         </p>
                                         {!product.videoUrl?.startsWith('blob:') && (
                                             <a 
                                                href={product.videoUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="mt-4 text-xs text-primary-500 hover:underline"
                                             >
                                                 Try Direct Link
                                             </a>
                                         )}
                                     </div>
                                </div>
                            ) : (
                                <>
                                <video 
                                    ref={videoRef}
                                    key={product.videoUrl} // Forces re-render if URL changes
                                    className="w-full h-full object-contain" 
                                    controls={activeIndex === product.images.length}
                                    src={product.videoUrl}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    poster={product.images[0]}
                                    // Error Handler
                                    onError={(e) => {
                                        console.error("Video Tag Error Event:", e.currentTarget.error);
                                        // If it's a blob, it's definitely expired/dead.
                                        if (product.videoUrl?.startsWith('blob:')) {
                                            setVideoError(true);
                                        } 
                                        // If it looks like a YouTube/Vimeo link that was pasted as a direct URL, try iframe
                                        else if (product.videoUrl?.includes('youtube') || product.videoUrl?.includes('vimeo')) {
                                            console.warn("Attempting iframe fallback for video...");
                                            setUseIframeFallback(true);
                                        }
                                        // Otherwise, it's likely a CORS or 403 error on a direct file
                                        else {
                                            setVideoError(true);
                                        }
                                    }}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                >
                                    Your browser does not support the video tag.
                                </video>
                                
                                {/* Manual Play Button Overlay */}
                                {activeIndex === product.images.length && !isPlaying && !videoError && !useIframeFallback && (
                                    <div 
                                        className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-40 group/play"
                                        onClick={handleManualPlay}
                                    >
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover/play:scale-110 transition-transform shadow-xl border border-white/30">
                                            <svg className="w-10 h-10 text-white fill-current ml-1" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Navigation arrows - z-index 40 to stay above video */}
            {mediaCount > 1 && (
                <>
                <button 
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-800 dark:text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-40"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button 
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 text-gray-800 dark:text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-40"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
                </>
            )}
          </div>

          {/* Thumbnails Strip */}
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Image Thumbnails */}
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all relative ${activeIndex === idx ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-transparent bg-gray-100 dark:bg-white/5'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}

            {/* Video Thumbnail */}
            {hasVideo && (
                <button 
                  onClick={() => setActiveIndex(product.images.length)}
                  className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all relative flex items-center justify-center bg-gray-900 ${activeIndex === product.images.length ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-transparent'}`}
                >
                   {/* Use first image as background for video thumbnail with overlay */}
                   <img src={product.images[0] || 'https://picsum.photos/400'} alt="Video" className="w-full h-full object-cover opacity-50" />
                   <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                           <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                               <path d="M8 5v14l11-7z" />
                           </svg>
                       </div>
                   </div>
                   <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                       VIDEO
                   </div>
                </button>
            )}
          </div>
        </div>

        {/* Info Column */}
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
    </div>
  );
};