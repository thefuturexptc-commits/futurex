import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { LoginModal } from './components/LoginModal';
import { SupportAssistant } from './components/SupportAssistant';
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext';
import { SiteFooter } from './components/SiteFooter';

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

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthReady } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();
  const promptedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (isAuthReady && !user && promptedPathRef.current !== location.pathname) {
      openLogin(location.pathname);
      promptedPathRef.current = location.pathname;
    }
    if (user) {
      promptedPathRef.current = null;
    }
  }, [isAuthReady, user, location.pathname, openLogin]);

  if (!isAuthReady) {
    return <div className="min-h-[40vh] flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-[40vh] flex items-center justify-center text-gray-400">Login required...</div>;
  }

  return children;
};

const App: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRedirectPath, setLoginRedirectPath] = useState('/profile');

  const openLogin = (redirectPath = '/profile') => {
    setLoginRedirectPath(redirectPath);
    setIsLoginOpen(true);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AuthModalProvider value={{ openLogin }}>
              <ScrollToTop />
              <div className="holi-lite flex flex-col min-h-screen text-gray-100 bg-dark-bg transition-colors duration-300 relative overflow-x-hidden">
                <Header />
                <CartDrawer /> {/* Global Drawer Overlay */}
                <LoginModal
                  isOpen={isLoginOpen}
                  onClose={() => setIsLoginOpen(false)}
                  redirectPath={loginRedirectPath}
                />
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
                    <Route path="/shop/:category" element={<Navigate to="/shop/all" replace />} /> {/* Redirect old category links just in case */}

                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
                    <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                    <Route path="/verify-phone" element={<RequireAuth><VerifyPhone /></RequireAuth>} />
                    <Route path="/payment" element={<RequireAuth><Payment /></RequireAuth>} />
                    <Route path="/order-success" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/info/:slug" element={<InfoPage />} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                    <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
                    <Route path="/admin/edit-product" element={<RequireAuth><AdminEditProductPage /></RequireAuth>} />
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
