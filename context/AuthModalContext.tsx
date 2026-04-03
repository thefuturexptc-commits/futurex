import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthModalContextType {
  openLogin: (redirectPath?: string) => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  openLogin: () => {},
});

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const openLogin = (redirectPath?: string) => {
    const path = redirectPath
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : '/login';
    navigate(path);
  };

  return (
    <AuthModalContext.Provider value={{ openLogin }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalContext);