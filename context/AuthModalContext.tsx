import React, { createContext, useContext } from 'react';

interface AuthModalContextType {
  openLogin: (redirectPath?: string) => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  openLogin: () => {},
});

export const AuthModalProvider = AuthModalContext.Provider;

export const useAuthModal = () => useContext(AuthModalContext);

