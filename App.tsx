import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <HashRouter>
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
          </HashRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

 export default App;