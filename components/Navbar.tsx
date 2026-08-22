import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/Button';
import defaultBrandLogo from '../assets/images/thefuturex-logo-header.png';
import fanShowcaseImage from '../assets/images/fan-hero-q8pro-cutout.webp';
import bandHomeImage from '../assets/images/band-hero-cutout.webp';
import ringHomeImage from '../assets/images/smart-ring-rotating.gif';
import monitoringPhoneImage from '../assets/images/monitoring-phone-cutout.webp';
import { getProductSlug } from '../services/backend';
import { scoreProductSearch } from '../utils/productSearch';
import type { Product } from '../types';

const blogMenuGroups = [
  {
    title: 'Blogs',
    links: [
      { name: 'All Blogs', path: '/blog' },
      { name: 'Smart Ring Blog', path: '/blog/what-is-a-smart-ring' },
      { name: 'Smart Band Blog', path: '/blog/what-is-a-smart-band' },
      { name: 'Smart Fan Blog', path: '/blog/what-is-a-bladeless-fan' },
      { name: 'Heart Rate Monitor Blog', path: '/blog/complete-guide-to-fitness-heart-rate-monitoring' },
      { name: 'Sleep Monitoring Blog', path: '/blog/what-is-sleep-monitoring' },
    ],
  },
];

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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsMegaOpen, setProductsMegaOpen] = useState(false);
  const [blogMenuOpen, setBlogMenuOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState('Bands');
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
    setBlogMenuOpen(false);
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
      const sortedCategories = categories.filter((category) => category.trim().toLowerCase() !== 'smart glasses').sort((a, b) => {
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

  const mainNavLinks = [
    { name: 'Smart Band', path: '/smart-bands' },
    { name: 'Smart Ring', path: '/smart-rings' },
    { name: 'Fan', path: '/bladeless-fan' },
    { name: 'Blogs', path: '/blog' },
    { name: 'Gifts', path: '/gifting-store' },
  ];
  const mobileNavRows = [
    { title: 'Shop', links: mainNavLinks },
    { title: 'Support', links: [{ name: 'Track Order', path: '/track-order' }] },
  ];
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
    const q = searchQuery.trim();
    if (!q) return [];
    return allProducts
      .map((p) => {
        return { product: p, score: scoreProductSearch(p, q) };
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
      'Smart Glasses': monitoringPhoneImage,
      Fans: fanShowcaseImage,
      Rings: ringHomeImage,
      Bands: bandHomeImage,
      Monitoring: monitoringPhoneImage,
      Glasses: monitoringPhoneImage,
    };

    return categoryLinks.map((link) => ({
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
      Glasses: monitoringPhoneImage,
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
 ['JCRing X1 Smart Ring', false],
        ['JCRing 2301B Fitness Tracker Smart Ring', false],
      ],
      'Smart Bands': [
        ['JCVital Aura V10 Smart Bracelet', true],
        ['JCVital V8 ECG Smart Band', true],
 ['JCVital V6 4G Smart Bracelet', false],
 ['JCVital V5 AI Smart Band', true],
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
        className="site-navbar fixed left-0 right-0 top-0 z-50 w-full glass-nav transition-all duration-300"
        onMouseLeave={() => {
          setProductsMegaOpen(false);
          setBlogMenuOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/product/tfx5-ai-smart-band')}
          className="tfx-current-offer-bar tfx-current-offer-bar-static"
          aria-label="View current offers"
        >
          <span className="tfx-current-offer-track">
            <span>Free shipping across India</span>
            <span>10% off smart fans — applied automatically</span>
            <span>5% off eligible bands &amp; rings — applied automatically</span>
            <span>COD available on eligible orders</span>
          </span>
        </button>

        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-6">
          <div className="flex h-16 items-center justify-between sm:h-16 xl:h-[72px]">

            {/* Logo */}
            <Link to="/" className="brand-logo-link flex-shrink-0 flex items-center group">
              <img
                src={defaultBrandLogo}
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
                className="mobile-brand-logo h-14 w-auto max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-[64px] sm:max-w-[170px] md:h-[68px] md:max-w-[190px] lg:h-[72px] lg:max-w-[205px] xl:h-[76px] xl:max-w-[215px]"
              />
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-3 2xl:gap-5">
              {mainNavLinks.map(({ name, path }) => {
                const active = path === '/' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);
                if (name === 'Blogs') {
                  const blogActive = location.pathname === '/blog' || location.pathname.startsWith('/blog/');
                  return (
                    <div
                      key={name}
                      className="relative"
                      onMouseEnter={() => {
                        setProductsMegaOpen(false);
                        setBlogMenuOpen(true);
                      }}
                    >
                      <Link
                        to="/blog"
                        onClick={() => setBlogMenuOpen(false)}
                        className={`navbar-link inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium tracking-wide transition-colors ${
                          blogActive ? 'navbar-link-active' : ''
                        }`}
                        aria-haspopup="menu"
                        aria-expanded={blogMenuOpen}
                      >
                        Blogs
                        <svg className={`h-3.5 w-3.5 transition-transform ${blogMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9l6 6 6-6" />
                        </svg>
                      </Link>
                      {blogMenuOpen && (
                        <div
                          className="blog-menu-panel absolute left-1/2 top-full z-50 mt-5 w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_22px_45px_rgba(15,23,42,0.16)]"
                          role="menu"
                        >
                          {blogMenuGroups.map((group) => (
                            <div key={group.title}>
                              <p className="blog-menu-heading mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                                {group.title}
                              </p>
                              <div className="space-y-1">
                                {group.links.map((link) => (
                                  <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setBlogMenuOpen(false)}
                                    className={`blog-menu-item block w-full rounded-lg px-3 py-2 text-left text-xs font-bold leading-snug transition ${
                                      location.pathname === link.path
                                        ? 'is-active bg-cyan-50 text-cyan-700'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-700'
                                    }`}
                                    role="menuitem"
                                  >
                                    {link.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={name}
                    type="button"
                    onMouseEnter={() => {
                      setProductsMegaOpen(false);
                      setBlogMenuOpen(false);
                    }}
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
                type="button"
                onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
                aria-label="Toggle menu"
                aria-controls="mobile-navigation"
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
        <button
          type="button"
          onClick={() => navigate('/product/tfx5-ai-smart-band')}
          className="hidden"
          aria-label="Open TFX5 price drop offer"
        >
          <span className="tfx-current-offer-track">
            <span>Free shipping across India</span>
            <span>COD available on eligible orders</span>
            <span>Brand warranty support</span>
            <span>TFX5 AI Smart Band now at ₹9,999</span>
          </span>
        </button>

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
                          {item.name === 'Rings' ? (
                            <span className="h-3 w-3 rounded-full border-2 border-current" />
                          ) : item.name === 'Bands' ? (
                            <span className="h-4 w-2 rounded-sm border-2 border-current" />
                          ) : item.name === 'Monitoring' ? (
                            <span className="h-3 w-4 rounded-sm border-2 border-current" />
                          ) : item.name === 'Glasses' ? (
                            <span className="h-3 w-5 rounded-full border-2 border-current" />
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
                        navigate(`/product/${getProductSlug(product)}`);
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
                      navigate(`/product/${getProductSlug(searchResults[0])}`);
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
                          navigate(`/product/${getProductSlug(p)}`);
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
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.category} - ₹{Number(p.salePrice || p.price || 0).toLocaleString()}</p>
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
        {createPortal(
          <div className="site-navbar" style={{ display: 'contents' }}>
            <div
              id="mobile-navigation"
              className="mobile-menu-panel lg:hidden animate-slide-down"
              style={{
                position: 'fixed',
                top: 'var(--fx-header-height, 64px)',
                right: '0.75rem',
                left: '0.75rem',
                zIndex: 2147483647,
                display: mobileMenuOpen ? 'block' : 'none',
                maxHeight: 'calc(100dvh - var(--fx-header-height, 64px) - 0.75rem)',
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: '0 0 1rem 1rem',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.2)',
              }}
            >
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
                <div className="space-y-3">
                  {mobileNavRows.map((row) => (
                    <div key={row.title}>
                      <p className="mobile-menu-eyebrow mb-2">{row.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {row.links.map((link) => {
                          const active = link.path === '/' ? location.pathname === link.path : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
                          return (
                            <button
                              key={link.name}
                              onClick={() => openCategory(link.path)}
                              className={`mobile-menu-link ${
                                active ? 'mobile-menu-link-active' : ''
                              }`}
                            >
                              <span>{link.name}</span>
                              {active && (
                                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
          </div>,
          document.body
        )}
      </nav>

    </>
  );
};

export const Navbar = React.memo(NavbarComponent);
