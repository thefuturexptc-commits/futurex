import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import defaultBrandLogo from '../assets/images/thefuturex-logo.webp';
import type { Product } from '../types';

const toProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const runWhenIdle = (work: () => void, timeout = 1800): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  let cleanup = () => {};
  const delayId = window.setTimeout(() => {
    const requestIdle = (window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    const cancelIdle = (window as Window & {
      cancelIdleCallback?: (id: number) => void;
    }).cancelIdleCallback;

    if (requestIdle) {
      const idleId = requestIdle(work, { timeout: 2500 });
      cleanup = () => cancelIdle?.(idleId);
      return;
    }

    const id = window.setTimeout(work, 300);
    cleanup = () => window.clearTimeout(id);
  }, timeout);

  return () => {
    window.clearTimeout(delayId);
    cleanup();
  };
};

const NavbarComponent: React.FC = () => {
  const { user, logout, isAdmin, isAuthReady } = useAuth();
  const { totalItems, openCart } = useCart();
  const { logoUrl } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([
    'Smart Fans',
    'Smart Rings',
    'Smart Bands',
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
    const cancel = runWhenIdle(() => {
      import('../services/backend')
        .then(({ getCategories }) => getCategories())
        .then((items) => {
          if (!isMounted || !items.length) return;
          setCategories(items);
        })
        .catch(() => {
          // Keep fallback categories when backend fetch is unavailable.
        });
    }, 6500);

    return () => {
      isMounted = false;
      cancel();
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const categoryLinks = useMemo(
    () => {
      const preferredOrder = ['smart fans', 'smart rings', 'smart bands', 'smart monitoring'];
      const sortedCategories = [...categories].sort((a, b) => {
        const aIndex = preferredOrder.indexOf(a.trim().toLowerCase());
        const bIndex = preferredOrder.indexOf(b.trim().toLowerCase());
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      return sortedCategories.map((category) => ({
        name: getCategoryLabel(category),
        path: getCategoryPath(category),
      }));
    },
    [categories]
  );

  const navLinks = [{ name: 'Home', path: '/' }, { name: 'New Arrivals', path: '/new-arrivals' }, ...categoryLinks];
  const mobileNavLinks = [{ name: 'Home', path: '/' }, ...categoryLinks];

  const loadSearchProductsNow = useCallback(() => {
    if (allProducts.length > 0 || searchLoading) return;
    setSearchLoading(true);
    import('../services/backend')
      .then(({ getProducts }) => getProducts())
      .then((items) => setAllProducts(items))
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }, [allProducts.length, searchLoading]);

  // Fetch all products for search
  useEffect(() => {
    let isMounted = true;
    const cancel = runWhenIdle(() => {
      import('../services/backend')
        .then(({ getProducts }) => getProducts())
        .then((items) => {
          if (isMounted) setAllProducts(items);
        })
        .catch(() => {});
    }, 9000);
    return () => {
      isMounted = false;
      cancel();
    };
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
      .map((p) => {
        const name = p.name.toLowerCase();
        const category = p.category.toLowerCase();
        const description = (p.description || '').toLowerCase();
        let score = 0;
        if (name === q) score += 120;
        if (name.startsWith(q)) score += 90;
        if (name.includes(q)) score += 70;
        if (category === q || category === `smart ${q}` || category.includes(q)) score += 100;
        if (description.includes(q)) score += 10;
        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
      .map((item) => item.product)
      .slice(0, 8);
  }, [searchQuery, allProducts]);

  return (
    <>
      {/* ─── Top Sticky Navbar ─────────────────────────────────────── */}
      <nav className="site-navbar sticky top-0 z-50 w-full glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <img
                src={logoUrl || defaultBrandLogo}
                alt="TheFutureX"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = defaultBrandLogo;
                }}
                width={260}
                height={104}
                className="mobile-brand-logo h-15 sm:h-15 md:h-15 lg:h-16 w-auto max-w-[150px] sm:max-w-[190px] md:max-w-[230px] lg:max-w-[260px] object-contain transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] group-hover:scale-[1.03]"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-baseline space-x-6 lg:space-x-8">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                const isNewArrival = link.path === '/new-arrivals';
                return (
                  <button
                    key={link.name}
                    onClick={() => openCategory(link.path)}
                    className={`text-sm font-semibold tracking-wide uppercase transition-colors font-display ${
                      isNewArrival
                        ? active
                          ? 'rounded-full bg-gray-950 px-3 py-1.5 text-white shadow-sm dark:bg-white dark:text-gray-950'
                          : 'rounded-full border border-gray-950/15 bg-gray-950 px-3 py-1.5 text-white shadow-sm hover:bg-black dark:border-white/20 dark:bg-white dark:text-gray-950 dark:hover:bg-cyan-100'
                        : active
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
            <div className="mobile-nav-actions flex items-center gap-1.5">

              {/* Search Button */}
              <button
                onClick={() => {
                  setSearchOpen((o) => !o);
                  loadSearchProductsNow();
                }}
                aria-label="Search products"
                className="mobile-nav-control relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors outline-none"
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
                <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide">Search</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="mobile-nav-control relative p-2 transition-colors outline-none"
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
              {!isAuthReady ? null : user ? (
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

              {!isAuthReady ? null : user ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="mobile-auth-pill md:hidden inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-white/15"
                  aria-label="Open profile"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[9px] font-bold">
                    {user.name[0]}
                  </span>
                  <span>Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="mobile-auth-pill md:hidden inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-300 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-black shadow-sm transition hover:bg-emerald-200"
                  aria-label="Login or sign up"
                >
                  <span>Login</span>
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                className="mobile-nav-control md:hidden p-2 rounded-md transition-colors"
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
                  {searchLoading ? (
                    <p className="text-sm text-gray-400 px-2 py-3 text-center">Loading products...</p>
                  ) : searchResults.length === 0 ? (
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
                          loading="lazy"
                          decoding="async"
                          width={40}
                          height={40}
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
          <div className="mobile-menu-panel md:hidden animate-slide-down">
            <div className="px-3 pb-4 pt-3">
              <div className="mobile-menu-card">
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 px-3 pb-3">
                  <div>
                    <p className="mobile-menu-eyebrow">Browse</p>
                    <p className="mobile-menu-title">TheFutureX Store</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mobile-menu-close"
                    aria-label="Close menu"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Nav Links */}
                <div className="grid grid-cols-2 gap-2">
                  {mobileNavLinks.map((link) => {
                    const active = location.pathname === link.path;
                    const isNewArrival = link.path === '/new-arrivals';
                    return (
                      <button
                        key={link.name}
                        onClick={() => openCategory(link.path)}
                        className={`mobile-menu-link ${
                          isNewArrival
                            ? active
                              ? 'mobile-menu-link-featured mobile-menu-link-active'
                              : 'mobile-menu-link-featured'
                            : active
                              ? 'mobile-menu-link-active'
                              : ''
                        }`}
                      >
                        <span>{link.name}</span>
                        {active && (
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {!active && isNewArrival && (
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="mobile-menu-actions">
                  {!isAuthReady ? null : user ? (
                    <>
                      {/* User Info */}
                      <div className="mobile-menu-user">
                        <div className="mobile-menu-avatar">
                          {user.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="mobile-menu-user-name">{user.name}</p>
                          <p className="mobile-menu-user-email">{user.email}</p>
                        </div>
                      </div>

                      <Button size="sm" className="w-full justify-center" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                        Profile
                      </Button>
                      {isAdmin && (
                        <Button size="sm" variant="outline" className="w-full justify-center text-amber-600 border-amber-300" onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                          Admin Dashboard
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="w-full justify-center text-red-600 border-red-200" onClick={handleLogout}>
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 justify-center" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                        Login
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 justify-center" onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}>
                        Sign up
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </nav>

    </>
  );
};

export const Navbar = React.memo(NavbarComponent);
