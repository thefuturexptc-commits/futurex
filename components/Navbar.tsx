<<<<<<< HEAD
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
=======
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
<<<<<<< HEAD
import defaultBrandLogo from '../assets/images/thefuturex-logo-white.png';
import fanShowcaseImage from '../assets/images/fan-hero-q8pro-cutout.webp';
import bandHomeImage from '../assets/images/band-hero-cutout.webp';
import ringHomeImage from '../assets/images/smart-ring-rotating.gif';
import monitoringPhoneImage from '../assets/images/monitoring-phone-cutout.webp';
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
  const { logoUrl, theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsMegaOpen, setProductsMegaOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState('Smart Bands');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([
    'Smart Bands',
    'Smart Rings',
    'Smart Fans',
    'Smart Monitoring',
  ]);
=======

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, openCart } = useCart();
  const { theme, toggleTheme, logoUrl } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b

  const handleLogout = () => {
    logout();
    navigate('/');
<<<<<<< HEAD
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
    if (normalized === 'smart fans') return '/bladeless-fan';
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
      const preferredOrder = ['smart bands', 'smart rings', 'smart fans', 'smart monitoring'];
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

  const infoLinks = [
    { name: 'About Us', path: '/info/about-us' },
    { name: 'Contact Us', path: '/info/contact' },
  ];
  const navLinks = [
    { name: 'Home', path: '/' },
    ...categoryLinks,
    { name: 'New Arrivals', path: '/new-arrivals' },
    { name: 'Best Sellers', path: '/best-sellers' },
    ...infoLinks,
  ];
  const mobileNavLinks = navLinks;

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

  const searchCategoryTiles = useMemo(() => {
    const categoryImages: Record<string, string> = {
      'Smart Fans': fanShowcaseImage,
      'Smart Rings': ringHomeImage,
      'Smart Bands': bandHomeImage,
      'Smart Monitoring': monitoringPhoneImage,
      Fans: fanShowcaseImage,
      Rings: ringHomeImage,
      Bands: bandHomeImage,
      Monitoring: monitoringPhoneImage,
    };

    return categoryLinks.slice(0, 4).map((link) => ({
      ...link,
      image: categoryImages[link.name] || categoryImages[`Smart ${link.name}`] || monitoringPhoneImage,
    }));
  }, [categoryLinks]);

  const featuredSearchProducts = useMemo(() => {
    const preferred = allProducts.filter((product) => product.isFeatured || product.isBestSeller);
    return (preferred.length ? preferred : allProducts).slice(0, 6);
  }, [allProducts]);

  const getProductImage = (product: Product) => product.images?.[0] || product.colors?.[0]?.images?.[0] || '';
  const megaCategories = useMemo(() => {
    const categoryImages: Record<string, string> = {
      Fans: fanShowcaseImage,
      Rings: ringHomeImage,
      Bands: bandHomeImage,
      Monitoring: monitoringPhoneImage,
    };

    return categoryLinks.map((link) => ({
      ...link,
      image: categoryImages[link.name] || monitoringPhoneImage,
    }));
  }, [categoryLinks]);
  /* const megaProductItems = useMemo<Record<string, Array<[string, boolean]>>>(
    () => ({
      'Smart Fans': [
        ['The Future X TP02 3-in-1 Bladeless Tower Fan', true],
        ['The Future X TP-09 Pro Heating Cooling Air', true],
        ['Bladeless Tower Fan Air Cooler Purifier', false],
      ],
      'Smart Rings': [
        ['JCRing X6 Women’s Smart Ring', true],
        ['JCRing X5 Touch Control Smart Ring', false],
        ['JCRing X3 Medical-Grade Smart Ring', true],
        ['JCRing X2 Sleep Tracking Smart Ring', false],
        ['JCRing X1 Smart Health Ring', false],
        ['JCRing 2301B Fitness Tracker Smart Ring', false],
      ],
      'Smart Bands': [
        ['JCVital Aura V10 Smart Bracelet', true],
        ['JCVital V8 ECG Smart Band', true],
        ['JCVital V6 4G Health Smart Bracelet', false],
        ['JCVital V5 AI Health Smart Band', true],
        ['JCVital V4 Sport HRV Smart Band', true],
        ['JCVital 2208 Fitness Tracker Band', false],
      ],
      'Smart Monitoring': [
        ['MFA-1 Chronic Disease Monitoring Instrument', false],
        ['Smart Sleep Monitor Belt 1657B', false],
        ['Smart Sleep Monitor Belt Device 1657B', false],
      ],
    }),
    []
  ); */
  const activeMega = megaCategories.find((item) => item.name === activeMegaCategory) || megaCategories[0];
  const activeMegaProducts = useMemo(() => {
    if (!activeMega) return [];
    const normalizedActive = activeMega.name.trim().toLowerCase();
    return allProducts
      .filter((product) => getCategoryLabel(product.category).trim().toLowerCase() === normalizedActive)
      .sort((a, b) => {
        const aScore = Number(Boolean(a.isNewArrival)) + Number(Boolean(a.isFeatured)) + Number(Boolean(a.isBestSeller));
        const bScore = Number(Boolean(b.isNewArrival)) + Number(Boolean(b.isFeatured)) + Number(Boolean(b.isBestSeller));
        return bScore - aScore || a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [activeMega, allProducts]);

  return (
    <>
      {/* ─── Top Sticky Navbar ─────────────────────────────────────── */}
      <nav
        className="site-navbar sticky top-0 z-50 w-full glass-nav transition-all duration-300"
        onMouseLeave={() => setProductsMegaOpen(false)}
      >
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-6">
          <div className="flex h-16 items-center justify-between sm:h-16 xl:h-[72px]">

            {/* Logo */}
            <Link to="/" className="brand-logo-link flex-shrink-0 flex items-center group">
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
                className="mobile-brand-logo h-14 w-auto max-w-[160px] object-contain transition-transform duration-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] group-hover:scale-[1.03] sm:h-[64px] sm:max-w-[170px] md:h-[68px] md:max-w-[190px] lg:h-[72px] lg:max-w-[205px] xl:h-[76px] xl:max-w-[215px]"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 2xl:gap-3">
              {navLinks.map(({ name, path }) => {
                const active = path === '/' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);
                return (
                  <button
                    key={name}
                    type="button"
                    onMouseEnter={() => setProductsMegaOpen(false)}
                    onClick={() => openCategory(path)}
                    className={`navbar-link inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium tracking-wide transition-colors ${
                      active ? 'navbar-link-active' : ''
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="mobile-nav-actions flex min-w-0 items-center gap-1 xl:gap-1.5">

              {/* Search Button */}
              <button
                onClick={() => {
                  setSearchOpen((o) => !o);
                  loadSearchProductsNow();
                }}
                aria-label="Search products"
                className="mobile-nav-control relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors outline-none"
              >
                {searchOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                )}
                <span className="hidden 2xl:inline text-xs font-semibold uppercase tracking-wide">Search</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="mobile-nav-control relative p-1.5 transition-colors outline-none"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full shadow-md animate-bounce-slow">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* User Menu — Desktop */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                className="mobile-nav-control relative p-1.5 transition-colors outline-none"
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
                  </svg>
                )}
              </button>

              {!isAuthReady ? null : user ? (
                <div className="relative group hidden lg:block">
                  <button
                    type="button"
                    className="navbar-account-pill flex items-center rounded-full border border-white/35 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-white/15"
                    aria-label="Open account menu"
                  >
                    <span>Account</span>
                  </button>

                  <div className="navbar-account-menu absolute right-0 mt-4 w-52 rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right transform translate-y-2 group-hover:translate-y-0">
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 mb-1">
                      <p className="text-sm font-bold truncate">{user.name}</p>
                      <p className="text-xs truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="navbar-account-menu-item block px-4 py-2 text-sm">
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="navbar-account-menu-item block px-4 py-2 text-sm font-medium">
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="navbar-account-menu-item navbar-account-menu-danger block w-full text-left px-4 py-2 text-sm"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-2">
                  <button
                    type="button"
                    className="navbar-auth-link"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="navbar-auth-primary"
                    onClick={() => navigate('/signup')}
                  >
                    Sign up
                  </button>
                </div>
              )}

              {!isAuthReady ? null : user ? (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="mobile-auth-pill lg:hidden inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-white/15"
                  aria-label="Open profile"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[9px] font-bold">
                    {user.name[0]}
                  </span>
                  <span>Account</span>
                </button>
              ) : null}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                className="mobile-nav-control lg:hidden p-2 rounded-md transition-colors"
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
        {false && productsMegaOpen && (
          <div
            className="mega-products-panel hidden border-t border-slate-200 bg-[#f6f9fb] shadow-[0_22px_45px_rgba(15,23,42,0.12)] lg:block"
            onMouseEnter={() => setProductsMegaOpen(true)}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[0.86fr_1.26fr_1fr] px-4 sm:px-6 lg:px-8">
              <div className="border-r border-slate-200 py-8 pr-8">
                <div className="space-y-2">
                  {megaCategories.map((item) => {
                    const active = item.name === activeMega.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onMouseEnter={() => setActiveMegaCategory(item.name)}
                        onFocus={() => setActiveMegaCategory(item.name)}
                        onClick={() => {
                          openCategory(item.path);
                          setProductsMegaOpen(false);
                        }}
                        className={`flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left text-base transition ${
                          active ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-cyan-700'
                        }`}
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-cyan-500 text-cyan-600' : 'border-slate-300 text-slate-500'}`}>
                          {item.name === 'Smart Rings' ? (
                            <span className="h-3 w-3 rounded-full border-2 border-current" />
                          ) : item.name === 'Smart Bands' ? (
                            <span className="h-4 w-2 rounded-sm border-2 border-current" />
                          ) : item.name === 'Smart Monitoring' ? (
                            <span className="h-3 w-4 rounded-sm border-2 border-current" />
                          ) : (
                            <span className="h-4 w-3 rounded-sm border-2 border-current" />
                          )}
                        </span>
                        <span className="font-semibold">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-r border-slate-200 py-8 pl-10 pr-8">
                <div className="space-y-6">
                  {searchLoading && activeMegaProducts.length === 0 && (
                    <p className="text-sm font-medium text-slate-500">Loading inventory products...</p>
                  )}
                  {!searchLoading && activeMegaProducts.length === 0 && (
                    <p className="text-sm font-medium text-slate-500">No inventory products found in this category.</p>
                  )}
                  {activeMegaProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        navigate(`/product/${toProductSlug(product.name)}`);
                        setProductsMegaOpen(false);
                      }}
                      className="group block w-full text-left text-lg font-medium leading-snug text-slate-700 transition hover:text-cyan-700"
                    >
                      <span>{product.name}</span>
                      {product.isNewArrival && (
                        <span className="ml-2 inline-flex rounded-full bg-red-500 px-2 py-0.5 align-middle text-[11px] font-bold uppercase italic leading-none text-white">
                          New
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center py-7 pl-10">
                <button
                  type="button"
                  onClick={() => {
                    openCategory(activeMega.path);
                    setProductsMegaOpen(false);
                  }}
                  className="group flex h-[310px] w-full items-center justify-center overflow-hidden rounded-lg bg-white p-8 text-left"
                >
                  <img
                    src={activeMega.image}
                    alt={activeMega.name}
                    width={520}
                    height={360}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {searchOpen && (
          <div className="search-discovery-panel border-t border-slate-200 bg-white animate-slide-down">
            <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-slate-950 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>

              {!searchQuery.trim() && (
                <div className="mt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Browse product lines</p>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {searchCategoryTiles.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => openCategory(item.path)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        {item.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => openCategory('/shop/all')}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-cyan-300 hover:bg-white hover:text-cyan-700"
                    >
                      View all
                    </button>
                  </div>
                </div>
              )}

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
                        className="flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
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
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.category} - Rs {Number(p.salePrice || p.price || 0).toLocaleString()}</p>
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
          <div className="mobile-menu-panel lg:hidden animate-slide-down">
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
                    const isCollectionHighlight = link.path === '/new-arrivals' || link.path === '/best-sellers';
                    return (
                      <button
                        key={link.name}
                        onClick={() => openCategory(link.path)}
                        className={`mobile-menu-link ${
                          isCollectionHighlight
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
                        {!active && isCollectionHighlight && (
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
=======
  };

  // Updated to point to specific routes
  const navLinks = [
    { name: 'Bands', path: '/smart-bands' },
    { name: 'Rings', path: '/smart-rings' },
    { name: 'Fans', path: '/smart-fans' },
    { name: 'Monitoring', path: '/smart-monitoring' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
            {logoUrl ? (
                <img src={logoUrl} alt="TheFutureX" className="h-10 w-auto object-contain" />
            ) : (
                <>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300 font-display">X</div>
                <span className="font-bold text-2xl tracking-tighter text-gray-900 dark:text-white font-display">TheFutureX</span>
                </>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm font-semibold tracking-wide uppercase transition-colors font-display"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-6">
            <button 
                onClick={toggleTheme} 
                className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
            >
              {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
              ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
              )}
            </button>

            <button 
                onClick={openCart}
                className="relative p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full shadow-md animate-bounce-slow">
                  {totalItems}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative group">
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
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Profile</Link>
                  {isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 font-medium transition-colors">Admin Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Sign out</button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex space-x-2">
                 <Link to="/login">
                   <Button variant="outline" size="sm" className="rounded-full px-6 border-gray-300 dark:border-gray-600">Login</Button>
                 </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="bg-gray-100 dark:bg-white/10 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-200 dark:hover:bg-white/20 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 absolute w-full z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 block px-3 py-3 rounded-lg text-base font-bold font-display uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {!user && (
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full justify-center">Login</Button>
                    </Link>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
