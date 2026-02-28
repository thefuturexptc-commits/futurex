import React, { createContext, useContext, useMemo, useState } from 'react';

interface OpenLoginModalOptions {
  redirectPath?: string;
  title?: string;
  description?: string;
}

interface LoginModalContextType {
  isOpen: boolean;
  redirectPath: string;
  title: string;
  description: string;
  openLoginModal: (options?: OpenLoginModalOptions) => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export const LoginModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/shop/all');
  const [title, setTitle] = useState('Login To Continue');
  const [description, setDescription] = useState('Please login or register to continue.');

  const openLoginModal = (options?: OpenLoginModalOptions) => {
    setRedirectPath(options?.redirectPath || '/shop/all');
    setTitle(options?.title || 'Login To Continue');
    setDescription(options?.description || 'Please login or register to continue.');
    setIsOpen(true);
  };

  const closeLoginModal = () => {
    setIsOpen(false);
  };

  const value = useMemo(
    () => ({ isOpen, redirectPath, title, description, openLoginModal, closeLoginModal }),
    [isOpen, redirectPath, title, description]
  );

  return <LoginModalContext.Provider value={value}>{children}</LoginModalContext.Provider>;
};

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error('useLoginModal must be used within LoginModalProvider');
  }
  return context;
};
