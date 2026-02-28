import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

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

  useEffect(() => {
    const storedUser = localStorage.getItem('aura_active_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsAuthReady(true);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('aura_active_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aura_active_user');
  };

  // Allow components to update user state (e.g., after adding an address)
  const updateUser = (userData: User) => {
      setUser(userData);
      localStorage.setItem('aura_active_user', JSON.stringify(userData));
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
