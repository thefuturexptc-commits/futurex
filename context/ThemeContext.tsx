import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../types';
import { getWebsiteSettings } from '../services/backend';

const DEFAULT_FOOTER_SECTIONS = [
  { title: 'COMPANY', items: ['About Us', 'Contact'] },
  { title: 'SUPPORT', items: ['Shipping', 'Returns', 'FAQ', 'Track Order'] },
  { title: 'LEGAL', items: ['Privacy', 'Terms', 'Refund', 'Cookies'] },
];
const DEFAULT_PAGE_CONTENT: Record<string, string> = {
  'about-us': 'Write your About Us content from Admin Settings.',
  contact: 'Add your contact details from Admin Settings.',
  shipping: 'Add your shipping policy details from Admin Settings.',
  returns: 'Add your return policy details from Admin Settings.',
  faq: 'Add frequently asked questions from Admin Settings.',
  'track-order': 'Add order tracking instructions from Admin Settings.',
  privacy: 'Add your privacy policy from Admin Settings.',
  terms: 'Add your terms and conditions from Admin Settings.',
  refund: 'Add your refund policy from Admin Settings.',
  cookies: 'Add your cookie policy from Admin Settings.',
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  logoUrl: string;
  updateLogoUrl: (url: string) => void;
  footerSections: Array<{ title: string; items: string[] }>;
  updateFooterSections: (sections: Array<{ title: string; items: string[] }>) => void;
  pageContent: Record<string, string>;
  updatePageContent: (content: Record<string, string>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme: Theme = 'dark';
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [logoUrl, setLogoUrl] = useState('');
  const [footerSections, setFooterSections] = useState(DEFAULT_FOOTER_SECTIONS);
  const [pageContent, setPageContent] = useState<Record<string, string>>(DEFAULT_PAGE_CONTENT);

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
        if (settings.footerSections?.length) setFooterSections(settings.footerSections);
        if (settings.pageContent) setPageContent(settings.pageContent);
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

  const updateFooterSections = (sections: Array<{ title: string; items: string[] }>) => {
      setFooterSections(sections);
  };

  const updatePageContent = (content: Record<string, string>) => {
      setPageContent(content);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, primaryColor, updatePrimaryColor, logoUrl, updateLogoUrl, footerSections, updateFooterSections, pageContent, updatePageContent }}>
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
      updateLogoUrl: () => {},
      footerSections: DEFAULT_FOOTER_SECTIONS,
      updateFooterSections: () => {},
      pageContent: DEFAULT_PAGE_CONTENT,
      updatePageContent: () => {}
    };
  }
  return context;
};
