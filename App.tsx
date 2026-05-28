<<<<<<< HEAD
import React, { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { Routes, Route, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { AuthModalProvider } from './context/AuthModalContext';
import { SiteFooter } from './components/SiteFooter';
import { FloatingContactRail } from './components/FloatingContactRail';
import { LoadingFallback } from './components/LoadingFallback';
import { Home } from './pages/Home';
import { pushPageView } from './services/analytics';
import { removeJsonLd, setSeoMetadata } from './services/seo';

// ✅ META PIXEL

const Shop = React.lazy(() => import('./pages/Shop').then(module => ({ default: module.Shop })));
const SmartBands = React.lazy(() => import('./pages/SmartBands').then(module => ({ default: module.SmartBands })));
const SmartRings = React.lazy(() => import('./pages/SmartRings').then(module => ({ default: module.SmartRings })));
const SmartFans = React.lazy(() => import('./pages/SmartFans').then(module => ({ default: module.SmartFans })));
const SmartMonitoring = React.lazy(() => import('./pages/SmartMonitoring').then(module => ({ default: module.SmartMonitoring })));
const NewArrivals = React.lazy(() => import('./pages/NewArrivals').then(module => ({ default: module.NewArrivals })));
const BestSellers = React.lazy(() => import('./pages/BestSellers').then(module => ({ default: module.BestSellers })));
const Cart = React.lazy(() => import('./pages/Cart').then(module => ({ default: module.Cart })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const VerifyPhone = React.lazy(() => import('./pages/VerifyPhone').then(module => ({ default: module.VerifyPhone })));
const Payment = React.lazy(() => import('./pages/Payment').then(module => ({ default: module.Payment })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess').then(module => ({ default: module.OrderSuccess })));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder').then(module => ({ default: module.TrackOrder })));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const SupportAssistant = React.lazy(() => import('./components/SupportAssistant').then(module => ({ default: module.SupportAssistant })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminEditProductPage = React.lazy(() => import('./pages/AdminEditProductPage').then(module => ({ default: module.AdminEditProductPage })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = React.lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const InfoPage = React.lazy(() => import('./pages/InfoPage').then(module => ({ default: module.InfoPage })));
const OfferPage = React.lazy(() => import('./pages/OfferPage').then(module => ({ default: module.OfferPage })));
const DeleteAccount = React.lazy(() => import('./pages/DeleteAccount').then(module => ({ default: module.DeleteAccount })));
const PrivacyPolicyHealthSection = React.lazy(() => import('./pages/PrivacyPolicyHealthSection').then(module => ({ default: module.PrivacyPolicyHealthSection })));

const runAfterPageSettles = (work: () => void, timeout = 8000): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let cleanup = () => {};
  const timeoutId = window.setTimeout(() => {
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

    const fallbackId = window.setTimeout(work, 1200);
    cleanup = () => window.clearTimeout(fallbackId);
  }, timeout);

  return () => {
    window.clearTimeout(timeoutId);
    cleanup();
  };
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

// ✅ Fires PageView on every route change
const getRouteSeo = (pathname: string) => {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath.startsWith('/product/')) return null;

  const routeSeo: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'TheFutureX | Future of Wearables',
      description: 'Shop smart bands, smart rings, smart fans, and health monitoring wearables from TheFutureX.',
    },
    '/smart-bands': {
      title: 'Smart Bands',
      description: 'Explore TheFutureX smart bands for activity tracking, everyday health insights, and connected living.',
    },
    '/smart-rings': {
      title: 'Smart Rings',
      description: 'Explore TheFutureX smart rings for compact wellness tracking, modern style, and everyday comfort.',
    },
    '/bladeless-fan': {
      title: 'Bladeless Fan',
      description: 'Shop TheFutureX bladeless fans built for connected comfort, energy-conscious cooling, and modern homes.',
    },
    '/smart-monitoring': {
      title: 'Smart Monitoring',
      description: 'Discover TheFutureX smart monitoring devices for health, wellness, and daily care.',
    },
    '/shop': {
      title: 'Shop All Products',
      description: 'Browse all TheFutureX smart wearables, smart fans, and health monitoring products.',
    },
    '/shop/all': {
      title: 'Shop All Products',
      description: 'Browse all TheFutureX smart wearables, smart fans, and health monitoring products.',
    },
    '/new-arrivals': {
      title: 'New Arrivals',
      description: 'Shop the latest TheFutureX smart bands, rings, fans, and monitoring products.',
    },
    '/best-sellers': {
      title: 'Best Sellers',
      description: 'Shop popular TheFutureX smart bands, rings, fans, and monitoring products.',
    },
    '/cart': {
      title: 'Shopping Cart',
      description: 'Review your selected TheFutureX products before checkout.',
    },
    '/checkout': {
      title: 'Checkout',
      description: 'Complete your TheFutureX order securely.',
    },
    '/login': {
      title: 'Login',
      description: 'Sign in to your TheFutureX account.',
    },
    '/signup': {
      title: 'Sign Up',
      description: 'Create your TheFutureX account.',
    },
    '/delete-account': {
      title: 'Delete Your TheFutureX Account',
      description: 'Request deletion of your TheFutureX account and associated personal data.',
    },
    '/privacy-policy-health-section': {
      title: 'Privacy Policy Health Section',
      description: 'Health and wellness data disclaimer for TheFutureX app and wearable integrations.',
    },
  };

  if (cleanPath.startsWith('/shop/')) {
    const category = cleanPath.split('/').pop()?.replace(/-/g, ' ') || 'products';
    const label = category.replace(/\b\w/g, (char) => char.toUpperCase());
    return {
      title: `${label} Products`,
      description: `Browse ${label.toLowerCase()} from TheFutureX.`,
      path: cleanPath,
    };
  }

  if (cleanPath.startsWith('/info/')) {
    const page = cleanPath.split('/').pop()?.replace(/-/g, ' ') || 'information';
    const label = page.replace(/\b\w/g, (char) => char.toUpperCase());
    return {
      title: label,
      description: `${label} information for TheFutureX customers.`,
      path: cleanPath,
    };
  }

  return { ...(routeSeo[cleanPath] || routeSeo['/']), path: cleanPath };
};

const RouteSeo: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getRouteSeo(pathname);
    if (!seo) return;
    removeJsonLd('product-json-ld');
    setSeoMetadata(seo);
  }, [pathname]);

  return null;
};

const RouteAnalytics: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    pushPageView(`${pathname}${search}`, document.title);
  }, [pathname, search]);

  return null;
};

const ORDER_SOURCE_SESSION_KEY = 'tfx_order_source';

const normalizeOrderSource = (raw: string): string => {
  const value = raw.trim().toLowerCase();
  if (!value) return 'Website';
  if (value.includes('meta ads') || value.includes('meta_ad') || value.includes('metaads') || value.includes('paid social')) return 'Meta Ads';
  if (value.includes('google ads') || value.includes('google_ad') || value.includes('googleads') || value.includes('cpc') || value.includes('ppc')) return 'Google Ads';
  if (value.includes('instagram') || value === 'ig') return 'Instagram';
  if (value.includes('facebook') || value === 'fb' || value.includes('meta')) return 'Facebook';
  if (value.includes('whatsapp') || value === 'wa') return 'WhatsApp';
  if (value.includes('youtube') || value === 'yt') return 'YouTube';
  if (value.includes('google')) return 'Google';
  if (value.includes('website') || value.includes('direct')) return 'Website';
  if (value.includes('email')) return 'Email';
  return raw.trim();
};

const OrderSourceTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(location.search);
    const utmSource = params.get('utm_source') || '';
    const utmMedium = params.get('utm_medium') || '';
    const campaignSource = params.get('campaign_source') || params.get('source') || params.get('src') || '';
    const paidSource = `${utmSource} ${utmMedium} ${campaignSource}`;
    const detectedPaidSource =
      params.has('gclid') || params.has('gbraid') || params.has('wbraid')
        ? 'Google Ads'
        : params.has('fbclid')
          ? 'Meta Ads'
          : paidSource.toLowerCase().includes('meta') || paidSource.toLowerCase().includes('facebook') || paidSource.toLowerCase().includes('instagram')
            ? normalizeOrderSource(paidSource.includes('paid') || paidSource.includes('cpc') ? 'Meta Ads' : paidSource)
            : '';
    const explicitSource =
      detectedPaidSource ||
      utmSource ||
      params.get('utm_platform') ||
      campaignSource ||
      (params.has('igshid') ? 'instagram' : '');

    if (explicitSource) {
      window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, normalizeOrderSource(explicitSource));
      return;
    }

    const existing = window.sessionStorage.getItem(ORDER_SOURCE_SESSION_KEY);
    if (existing) return;

    const referrer = document.referrer;
    if (!referrer) {
      window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Website');
      return;
    }

    try {
      const referrerHost = new URL(referrer).hostname.toLowerCase();
      if (referrerHost.includes('instagram')) {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Instagram');
      } else if (referrerHost.includes('facebook') || referrerHost.includes('fb.com')) {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Facebook');
      } else if (referrerHost.includes('whatsapp')) {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'WhatsApp');
      } else if (referrerHost.includes('youtube')) {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'YouTube');
      } else if (referrerHost.includes('google')) {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Google');
      } else if (referrerHost !== window.location.hostname) {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Referral');
      } else {
        window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Website');
      }
    } catch {
      window.sessionStorage.setItem(ORDER_SOURCE_SESSION_KEY, 'Website');
    }
  }, [location.search]);

  return null;
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return <LoadingFallback minHeightClassName="min-h-[40vh]" />;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return <LoadingFallback minHeightClassName="min-h-[40vh]" />;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const hasAdminRole = user.role === 'admin' || user.role === 'superadmin';
  if (!hasAdminRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const DeferredSupportAssistant: React.FC = () => {
  const { isCartOpen } = useCart();
  const { pathname } = useLocation();
  const [shouldLoad, setShouldLoad] = useState(false);
  const shouldHideAssistant =
    isCartOpen ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname === '/verify-phone' ||
    pathname === '/payment' ||
    pathname === '/order-success' ||
    pathname === '/track-order';

  useEffect(() => {
    return runAfterPageSettles(() => setShouldLoad(true), 12000);
  }, []);

  if (!shouldLoad || shouldHideAssistant) return null;

  return (
    <Suspense fallback={null}>
      <SupportAssistant />
    </Suspense>
  );
};

const usePastHeroBanner = () => {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      const threshold = Math.min(window.innerHeight * 0.82, 720);
      setPastHero(window.scrollY > threshold);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return pastHero;
};

const FloatingAfterHero: React.FC = () => {
  const pastHero = usePastHeroBanner();
  if (!pastHero) return null;

  return (
    <>
      <DeferredSupportAssistant />
      <FloatingContactRail />
    </>
  );
};

const App: React.FC = () => {
  // ✅ Initialize Meta Pixel once on app mount
=======
import React from 'react';
import { HashRouter, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { SmartBands } from './pages/SmartBands';
import { SmartRings } from './pages/SmartRings';
import { SmartFans } from './pages/SmartFans';
import { SmartMonitoring } from './pages/SmartMonitoring';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrderSuccess } from './pages/OrderSuccess';
import { CartDrawer } from './components/CartDrawer';

const App: React.FC = () => {
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
<<<<<<< HEAD
            <AuthModalProvider>
              <ScrollToTop />
              <RouteSeo />
              <RouteAnalytics />
              <OrderSourceTracker />
              <div className="holi-lite flex flex-col min-h-screen bg-white text-slate-950 transition-colors duration-300 relative overflow-x-hidden">
                <Header />
                <CartDrawer />
                <main className="flex-grow">
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />

                      {/* Dedicated Category Routes */}
                      <Route path="/smart-bands" element={<SmartBands />} />
                      <Route path="/smart-rings" element={<SmartRings />} />
                      <Route path="/bladeless-fan" element={<SmartFans />} />
                      <Route path="/smart-fans" element={<Navigate to="/bladeless-fan" replace />} />
                      <Route path="/smart-monitoring" element={<SmartMonitoring />} />
                      <Route path="/new-arrivals" element={<NewArrivals />} />
                      <Route path="/best-sellers" element={<BestSellers />} />

                      {/* Legacy/General Shop Route for Search/View All */}
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/shop/all" element={<Shop />} />
                      <Route path="/shop/:category" element={<Shop />} />

                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/verify-phone" element={<VerifyPhone />} />
                      <Route path="/payment" element={<Payment />} />
                      <Route path="/order-success" element={<OrderSuccess />} />
                      <Route path="/track-order" element={<TrackOrder />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/delete-account" element={<DeleteAccount />} />
                      <Route path="/privacy-policy-health-section" element={<PrivacyPolicyHealthSection />} />
                      <Route path="/info/:slug" element={<InfoPage />} />
                      <Route path="/offers/:slug" element={<RequireAuth><OfferPage /></RequireAuth>} />
                      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                      <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                      <Route path="/admin/edit-product" element={<RequireAdmin><AdminEditProductPage /></RequireAdmin>} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <FloatingAfterHero />
                <SiteFooter />
              </div>
            </AuthModalProvider>
=======
            <div className="flex flex-col min-h-screen dark:bg-dark-bg transition-colors duration-300">
              <Navbar />
              <CartDrawer /> {/* Global Drawer Overlay */}
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  
                  {/* Dedicated Category Routes */}
                  <Route path="/smart-bands" element={<SmartBands />} />
                  <Route path="/smart-rings" element={<SmartRings />} />
                  <Route path="/smart-fans" element={<SmartFans />} />
                  <Route path="/smart-monitoring" element={<SmartMonitoring />} />
                  
                  {/* Legacy/General Shop Route for Search/View All */}
                  <Route path="/shop/all" element={<Shop />} />
                  <Route path="/shop/:category" element={<Navigate to="/shop/all" replace />} /> {/* Redirect old category links just in case */}

                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <footer className="bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-white/10 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                <p>&copy; {new Date().getFullYear()} TheFutureX. Premium Smart Technology.</p>
              </footer>
            </div>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

<<<<<<< HEAD
export default App;
=======
 export default App;
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
