import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
<<<<<<< HEAD
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { resolveAuthenticatedUser } from '../services/backend';

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
=======

interface AuthContextType {
  user: User | null;
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
<<<<<<< HEAD
  isSuperAdmin: boolean;
=======
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
<<<<<<< HEAD
  const [isAuthReady, setIsAuthReady] = useState(false);
  const sanitizeUserForStorage = (userData: User): User => {
    const { password: _password, ...rest } = userData;
    return rest as User;
  };
=======
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b

  useEffect(() => {
    const storedUser = localStorage.getItem('aura_active_user');
    if (storedUser) {
<<<<<<< HEAD
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
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Professional auth behavior:
      // treat app login as valid only when Firebase has a non-anonymous session.
      if (!firebaseUser || firebaseUser.isAnonymous) {
        setUser(null);
        localStorage.removeItem('aura_active_user');
        setIsAuthReady(true);
        return;
      }

      void resolveAuthenticatedUser(firebaseUser)
        .then((resolvedUser) => {
          const sanitized = sanitizeUserForStorage(resolvedUser);
          setUser(sanitized);
          localStorage.setItem('aura_active_user', JSON.stringify(sanitized));
        })
        .catch(() => {
          // If profile restore fails, keep auth deterministic and logged out.
          setUser(null);
          localStorage.removeItem('aura_active_user');
        })
        .finally(() => {
          setIsAuthReady(true);
        });
    });
    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    const sanitized = sanitizeUserForStorage(userData);
    setUser(sanitized);
    localStorage.setItem('aura_active_user', JSON.stringify(sanitized));
=======
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('aura_active_user', JSON.stringify(userData));
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aura_active_user');
<<<<<<< HEAD
    void signOut(auth).catch(() => {
      // Ignore signout failures and still clear local session.
    });
=======
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  };

  // Allow components to update user state (e.g., after adding an address)
  const updateUser = (userData: User) => {
<<<<<<< HEAD
      const sanitized = sanitizeUserForStorage(userData);
      setUser(sanitized);
      localStorage.setItem('aura_active_user', JSON.stringify(sanitized));
=======
      setUser(userData);
      localStorage.setItem('aura_active_user', JSON.stringify(userData));
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
<<<<<<< HEAD
      isAuthReady,
=======
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
      login, 
      logout, 
      updateUser,
      isAuthenticated: !!user,
<<<<<<< HEAD
      isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
      isSuperAdmin: user?.role === 'superadmin'
=======
      isAdmin: user?.role === 'admin'
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
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
<<<<<<< HEAD
};
=======
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
