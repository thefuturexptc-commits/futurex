import React from 'react';
import { Product } from '../types';
import { Button } from './Button';
import { Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent, action: 'add' | 'buy') => {
    e.preventDefault(); // Prevent navigating to product detail
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
    <Link to={`/product/${product.id}`} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-cyan-500/5 block">
      {/* Badge */}
      {product.isNew && (
        <div className="absolute top-4 left-4 z-10 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          NEW
        </div>
      )}
      {product.isBestSeller && (
        <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          BEST SELLER
        </div>
      )}

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {product.name}
                </h3>
                <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-slate-600">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviews})</span>
                </div>
            </div>
            <p className="text-xl font-display font-bold text-slate-900">₹{product.price.toLocaleString()}</p>
        </div>
        
        <p className="text-slate-500 text-sm mb-6 line-clamp-2">
          {product.description}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => handleAction(e, 'add')}
          >
            Add to Cart
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={(e) => handleAction(e, 'buy')}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </Link>
  );
};