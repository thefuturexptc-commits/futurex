import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme, logoUrl } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Bands', path: '/shop/Smart Bands' },
    { name: 'Rings', path: '/shop/Smart Rings' },
    { name: 'Fans', path: '/shop/Smart Fans' },
    { name: 'Monitoring', path: '/shop/Smart Monitoring' },
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

            <Link to="/cart" className="relative p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full shadow-md">
                  {totalItems}
                </span>
              )}
            </Link>

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