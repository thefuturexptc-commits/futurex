import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { getCategories, getProducts, toProductSlug } from '../services/backend';
import { Button } from './ui/Button';
import defaultBrandLogo from '../assets/images/untitled-design-51.webp';
import { Product } from '../types';

const NavbarComponent: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, openCart } = useCart();
  const { logoUrl } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([
    'Smart Bands',
    'Smart Rings',
    'Smart Fans',
    'Smart Monitoring',
  ]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const openCategory = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const getCategoryPath = (category: string) => {
    const normalized = category.trim().toLowerCase();
    if (normalized === 'smart bands') return '/smart-bands';
    if (normalized === 'smart rings') return '/smart-rings';
    if (normalized === 'smart fans') return '/smart-fans';
    if (normalized === 'smart monitoring') return '/smart-monitoring';
    return `/shop/${encodeURIComponent(category)}`;
  };

  const getCategoryLabel = (category: string) => {
    const normalized = category.trim().toLowerCase();
    if (normalized === 'smart bands') return 'Bands';
    if (normalized === 'smart rings') return 'Rings';
    if (normalized === 'smart fans') return 'Fans';
    if (normalized === 'smart monitoring') return 'Monitoring';
    return category.trim();
  };

  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((items) => {
        if (!isMounted || !items.length) return;
        setCategories(items);
      })
      .catch(() => {
        // Keep fallback categories when backend fetch is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const categoryLinks = useMemo(
    () =>
      categories.map((category) => ({
        name: getCategoryLabel(category),
        path: getCategoryPath(category),
      })),
    [categories]
  );

  const navLinks = [{ name: 'Home', path: '/' }, ...categoryLinks];

  // Fetch all products for search
  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery, allProducts]);

  return (
    <>
      {/* ─── Top Sticky Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img
                src={logoUrl || defaultBrandLogo}
                alt="TheFutureX"
                className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto max-w-[130px] sm:max-w-[160px] md:max-w-[200px] object-contain transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] group-hover:scale-[1.03]"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-baseline space-x-6 lg:space-x-8">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => openCategory(link.path)}
                    className={`text-sm font-semibold tracking-wide uppercase transition-colors font-display ${
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen((o) => !o)}
                aria-label="Search products"
                className="relative p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors outline-none"
              >
                {searchOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="relative p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full shadow-md animate-bounce-slow">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* User Menu — Desktop */}
              {user ? (
                <div className="relative group hidden md:block">
                  <button className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-white">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center border border-primary-200 dark:border-primary-700 shadow-sm font-bold font-display">
                      {user.name[0]}
                    </div>
                  </button>

                  <div className="absolute right-0 mt-4 w-48 bg-white dark:bg-dark-surface rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform translate-y-2 group-hover:translate-y-0 border border-gray-100 dark:border-white/10">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 font-medium">
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4 lg:px-6 border-gray-300 dark:border-gray-600 text-sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full px-4 lg:px-6 text-sm"
                    onClick={() => navigate('/signup')}
                  >
                    Sign up
                  </Button>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                className="md:hidden p-2 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* ─── Search Overlay ──────────────────────────────────────── */}
        {searchOpen && (
          <div className="border-t border-gray-200 dark:border-white/10 bg-white/98 dark:bg-dark-surface/98 backdrop-blur-md animate-slide-down">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false);
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      navigate(`/product/${toProductSlug(searchResults[0].name)}`);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              {searchQuery.trim() && (
                <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-2 py-3 text-center">No products found for "{searchQuery}"</p>
                  ) : (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          navigate(`/product/${toProductSlug(p.name)}`);
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-left"
                      >
                        <img
                          src={p.images?.[0] || p.colors?.[0]?.images?.[0] || ''}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-contain bg-gray-100 dark:bg-white/5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{p.category} · Rs {Number(p.salePrice || p.price || 0).toLocaleString()}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Mobile Dropdown Menu ──────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md animate-slide-down">
            <div className="px-4 py-4 space-y-1">
              {/* Nav Links */}
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => openCategory(link.path)}
                    className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}

              {/* Divider */}
              <div className="border-t border-gray-100 dark:border-white/5 pt-3 mt-3 space-y-2">
                {user ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center border border-primary-200 dark:border-primary-700 shadow-sm font-bold font-display shrink-0">
                        {user.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <Button className="w-full justify-center" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                      Profile
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" className="w-full justify-center text-amber-600 border-amber-300" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                        Admin Dashboard
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-center text-red-600 border-red-200" onClick={handleLogout}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button className="flex-1 justify-center" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                      Login
                    </Button>
                    <Button variant="outline" className="flex-1 justify-center" onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}>
                      Sign up
                    </Button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </nav>

    </>
  );
};

export const Navbar = React.memo(NavbarComponent);