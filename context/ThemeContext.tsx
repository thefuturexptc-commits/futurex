import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../types';
import { getWebsiteSettings } from '../services/backend';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  logoUrl: string;
  updateLogoUrl: (url: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme: Theme = 'dark';
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [logoUrl, setLogoUrl] = useState('');

  // Helper inside component to avoid HMR export issues
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` 
        : '14 165 233'; 
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    localStorage.setItem('aura_theme', 'dark');

    // Load settings from Backend (Mock or Real)
    getWebsiteSettings().then(settings => {
        setPrimaryColor(settings.primaryColor);
        if(settings.logoUrl) setLogoUrl(settings.logoUrl);
    }).catch(() => {});
  }, []);

  // Apply CSS Variables for Color
  useEffect(() => {
    const rgb = hexToRgb(primaryColor);
    const root = document.documentElement;
    root.style.setProperty('--color-primary-500', rgb);
    root.style.setProperty('--color-primary-600', rgb);
    root.style.setProperty('--color-primary-400', rgb); 
    root.style.setProperty('--color-primary-700', rgb); 
    root.style.setProperty('--color-primary-50', '240 249 255'); 
  }, [primaryColor]);

  const toggleTheme = () => {};

  const updatePrimaryColor = (color: string) => {
      setPrimaryColor(color);
  };

  const updateLogoUrl = (url: string) => {
      setLogoUrl(url);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, primaryColor, updatePrimaryColor, logoUrl, updateLogoUrl }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'dark' as Theme,
      toggleTheme: () => {},
      primaryColor: '#0ea5e9',
      updatePrimaryColor: () => {},
      logoUrl: '',
      updateLogoUrl: () => {}
    };
  }
  return context;
};
