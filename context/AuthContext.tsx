import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const sanitizeUserForStorage = (userData: User): User => {
    const { password: _password, ...rest } = userData;
    return rest as User;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('aura_active_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        const isLegacyDemoUser =
          parsed?.email?.toLowerCase?.() === 'demo@gmail.com' ||
          String(parsed?.id || '').startsWith('google_');
        if (isLegacyDemoUser) {
          localStorage.removeItem('aura_active_user');
        } else {
          setUser(sanitizeUserForStorage(parsed));
        }
      } catch {
        localStorage.removeItem('aura_active_user');
      }
    }
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) return;
      const storedUser = localStorage.getItem('aura_active_user');
      if (storedUser) {
        setUser(null);
        localStorage.removeItem('aura_active_user');
      }
    });
    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    const sanitized = sanitizeUserForStorage(userData);
    setUser(sanitized);
    localStorage.setItem('aura_active_user', JSON.stringify(sanitized));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aura_active_user');
    void signOut(auth).catch(() => {
      // Ignore signout failures and still clear local session.
    });
  };

  // Allow components to update user state (e.g., after adding an address)
  const updateUser = (userData: User) => {
      const sanitized = sanitizeUserForStorage(userData);
      setUser(sanitized);
      localStorage.setItem('aura_active_user', JSON.stringify(sanitized));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthReady,
      login, 
      logout, 
      updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
      isSuperAdmin: user?.role === 'superadmin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
