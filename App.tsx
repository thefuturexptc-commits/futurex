import React, { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { Routes, Route, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { SupportAssistant } from './components/SupportAssistant';
import { AuthModalProvider } from './context/AuthModalContext';
import { SiteFooter } from './components/SiteFooter';

// ✅ META PIXEL
import { initMetaPixel, trackPageView } from './services/Metapixel';

const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Shop = React.lazy(() => import('./pages/Shop').then(module => ({ default: module.Shop })));
const SmartBands = React.lazy(() => import('./pages/SmartBands').then(module => ({ default: module.SmartBands })));
const SmartRings = React.lazy(() => import('./pages/SmartRings').then(module => ({ default: module.SmartRings })));
const SmartFans = React.lazy(() => import('./pages/SmartFans').then(module => ({ default: module.SmartFans })));
const SmartMonitoring = React.lazy(() => import('./pages/SmartMonitoring').then(module => ({ default: module.SmartMonitoring })));
const Cart = React.lazy(() => import('./pages/Cart').then(module => ({ default: module.Cart })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const VerifyPhone = React.lazy(() => import('./pages/VerifyPhone').then(module => ({ default: module.VerifyPhone })));
const Payment = React.lazy(() => import('./pages/Payment').then(module => ({ default: module.Payment })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess').then(module => ({ default: module.OrderSuccess })));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminEditProductPage = React.lazy(() => import('./pages/AdminEditProductPage').then(module => ({ default: module.AdminEditProductPage })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = React.lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })));
const InfoPage = React.lazy(() => import('./pages/InfoPage').then(module => ({ default: module.InfoPage })));
const OfferPage = React.lazy(() => import('./pages/OfferPage').then(module => ({ default: module.OfferPage })));

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

// ✅ Fires PageView on every route change
const MetaPixelPageTracker: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView();
  }, [pathname]);
  return null;
};

const ORDER_SOURCE_SESSION_KEY = 'tfx_order_source';

const normalizeOrderSource = (raw: string): string => {
  const value = raw.trim().toLowerCase();
  if (!value) return 'Website';
  if (value.includes('meta ads') || value.includes('meta_ad') || value.includes('metaads')) return 'Meta Ads';
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
    const explicitSource =
      params.get('utm_source') ||
      params.get('utm_platform') ||
      params.get('campaign_source') ||
      params.get('source') ||
      params.get('src') ||
      (params.has('fbclid') ? 'facebook' : '') ||
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
    return <div className="min-h-[40vh] flex items-center justify-center text-gray-400">Loading...</div>;
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
    return <div className="min-h-[40vh] flex items-center justify-center text-gray-400">Loading...</div>;
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

const App: React.FC = () => {
  // ✅ Initialize Meta Pixel once on app mount
  useEffect(() => {
    initMetaPixel();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AuthModalProvider value={{ openLogin: () => {} }}>
              <ScrollToTop />
              <MetaPixelPageTracker />
              <OrderSourceTracker />
              <div className="holi-lite flex flex-col min-h-screen text-gray-100 bg-dark-bg transition-colors duration-300 relative overflow-x-hidden">
                <Header />
                <CartDrawer />
                <main className="flex-grow">
                  <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-gray-400">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Home />} />

                      {/* Dedicated Category Routes */}
                      <Route path="/smart-bands" element={<SmartBands />} />
                      <Route path="/smart-rings" element={<SmartRings />} />
                      <Route path="/smart-fans" element={<SmartFans />} />
                      <Route path="/smart-monitoring" element={<SmartMonitoring />} />

                      {/* Legacy/General Shop Route for Search/View All */}
                      <Route path="/shop/all" element={<Shop />} />
                      <Route path="/shop/:category" element={<Shop />} />

                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
                      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                      <Route path="/verify-phone" element={<RequireAuth><VerifyPhone /></RequireAuth>} />
                      <Route path="/payment" element={<RequireAuth><Payment /></RequireAuth>} />
                      <Route path="/order-success" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/info/:slug" element={<InfoPage />} />
                      <Route path="/offers/:slug" element={<RequireAuth><OfferPage /></RequireAuth>} />
                      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                      <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                      <Route path="/admin/edit-product" element={<RequireAdmin><AdminEditProductPage /></RequireAdmin>} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                <SupportAssistant />
                <SiteFooter />
              </div>
            </AuthModalProvider>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;