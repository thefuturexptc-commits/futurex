import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Star, Truck, ShieldCheck, RefreshCw, ArrowLeft, Heart, Share2 } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen pt-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to Home</Link>
      </div>
    );
  }

  const images = product.images || [product.image];

  const handleAction = (action: 'add' | 'buy') => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    addToCart(product);
    if (action === 'buy') {
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-slate-500 mb-8">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to={`/products/${product.category}`} className="hover:text-primary capitalize">{product.category}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
            <img 
              src={selectedImage} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {product.isNew && <span className="absolute top-4 left-4 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full">NEW</span>}
            {product.isBestSeller && <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">BEST SELLER</span>}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${selectedImage === img ? 'border-primary shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-display font-bold text-slate-900">{product.name}</h1>
            <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-full transition-colors">
                    <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-primary bg-white border border-slate-200 rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center text-yellow-400">
               <Star className="w-5 h-5 fill-current" />
               <span className="text-slate-900 font-bold ml-1">{product.rating}</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{product.reviews} Reviews</span>
            <span className="text-slate-400">|</span>
            <span className="text-green-600 font-medium">In Stock</span>
          </div>

          <p className="text-3xl font-display font-bold text-slate-900 mb-6">
            ₹{product.price.toLocaleString()}
            <span className="text-lg text-slate-400 font-sans font-normal ml-2 line-through">₹{(product.price * 1.2).toLocaleString()}</span>
            <span className="text-sm text-green-600 font-sans font-medium ml-2">20% OFF</span>
          </p>

          <p className="text-slate-600 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button size="lg" onClick={() => handleAction('add')} variant="outline" className="flex-1">
              Add to Cart
            </Button>
            <Button size="lg" onClick={() => handleAction('buy')} className="flex-1 shadow-xl shadow-cyan-500/20">
              Buy Now
            </Button>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-200 py-6 mb-8">
            <div className="text-center">
              <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">Free Shipping</p>
              <p className="text-[10px] text-slate-500">On all orders</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <ShieldCheck className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">2 Year Warranty</p>
              <p className="text-[10px] text-slate-500">Full coverage</p>
            </div>
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-900">30 Day Return</p>
              <p className="text-[10px] text-slate-500">No questions asked</p>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-slate-50 rounded-xl p-6">
             <h3 className="font-bold text-slate-900 mb-4">Key Features</h3>
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {product.features.map((feature, i) => (
                     <li key={i} className="flex items-center text-sm text-slate-700">
                         <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                         {feature}
                     </li>
                 ))}
             </ul>
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <div className="mt-20">
        <div className="flex gap-8 border-b border-slate-200 mb-8">
            {['desc', 'specs', 'reviews'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 text-lg font-medium capitalize transition-colors ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {tab === 'desc' ? 'Description' : tab === 'specs' ? 'Specifications' : 'Reviews'}
                </button>
            ))}
        </div>

        <div>
            {activeTab === 'desc' && (
                <div className="prose max-w-none text-slate-600">
                    <p>Experience the pinnacle of wearable technology with the {product.name}. Designed for the modern individual who demands both style and substance, this device integrates seamlessly into your life.</p>
                    <p className="mt-4">Whether you are tracking your fitness goals, monitoring your health stats in real-time, or staying connected with smart notifications, the {product.name} delivers exceptional performance with its advanced processor and long-lasting battery.</p>
                </div>
            )}
            {activeTab === 'specs' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-100">
                            {Object.entries(product.specs).map(([key, value], i) => (
                                <tr key={key} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                                    <td className="p-4 font-medium text-slate-900 w-1/3">{key}</td>
                                    <td className="p-4 text-slate-600">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">JD</div>
                                <div>
                                    <p className="font-bold text-slate-900">John Doe</p>
                                    <div className="flex text-yellow-400 text-xs">
                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm text-slate-400">2 days ago</span>
                        </div>
                        <p className="text-slate-600">Absolutely love this product! The battery life is amazing and the design is super sleek.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">AS</div>
                                <div>
                                    <p className="font-bold text-slate-900">Alice Smith</p>
                                    <div className="flex text-yellow-400 text-xs">
                                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm text-slate-400">1 week ago</span>
                        </div>
                        <p className="text-slate-600">Great value for money. The tracking features are spot on compared to medical devices.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};