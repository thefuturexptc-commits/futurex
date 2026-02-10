import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { firebaseService } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: User) => void;
  logout: () => void;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted session
    const initAuth = async () => {
        try {
            const currentUser = await firebaseService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            }
        } catch (e) {
            console.error("Auth init failed", e);
        } finally {
            setLoading(false);
        }
    };
    initAuth();
  }, []);

  const login = (u: User) => {
    setUser(u);
  };

  const logout = async () => {
    await firebaseService.logout();
    setUser(null);
  };

  const updateUser = (u: User) => {
      setUser(u);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};