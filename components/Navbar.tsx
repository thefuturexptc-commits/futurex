import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../constants';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('site_logo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    const handleStorageChange = () => {
        setLogoUrl(localStorage.getItem('site_logo'));
    }
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logoUpdated', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('logoUpdated', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Cart Icon Component
  const CartIconBtn = () => (
    <button 
        onClick={openCart} 
        className="relative p-2 text-slate-600 hover:text-primary transition-colors"
    >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full shadow-sm">
            {itemCount}
        </span>
        )}
    </button>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            {logoUrl ? (
                <img src={logoUrl} alt="TheFutureX Logo" className="h-8 md:h-10 object-contain" />
            ) : (
                <span className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  TheFutureX
                </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-slate-600 hover:text-slate-900'}`}>
              Home
            </Link>
            {CATEGORIES.map(cat => (
              <Link 
                key={cat.id} 
                to={cat.path}
                className={`text-sm font-medium transition-colors ${isActive(cat.path) ? 'text-primary' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Desktop Icons & Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <CartIconBtn />

            {user ? (
              <div className="flex items-center space-x-3">
                 {user.role === 'admin' && (
                    <Link to="/admin">
                         <Button variant="outline" size="sm">Admin</Button>
                    </Link>
                )}
                <Link to="/profile" className="flex items-center space-x-2 text-slate-600 hover:text-primary">
                    <UserIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="text-slate-500 hover:text-red-500">
                    <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Section (Cart + Menu) */}
          <div className="flex md:hidden items-center space-x-2">
            <CartIconBtn />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
                to="/" 
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={cat.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            
            {/* Removed "Cart" text link from here as we added icon to top bar */}
            
            {user ? (
               <>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>
                {user.role === 'admin' && <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>}
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-600 hover:bg-slate-100">Logout</button>
               </>
            ) : (
                <div className="grid grid-cols-2 gap-2 p-3">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" fullWidth>Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="primary" fullWidth>Sign Up</Button>
                    </Link>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};