import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, WebsiteSettings } from '../types';
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
const DEFAULT_SOCIAL_LINKS: NonNullable<WebsiteSettings['socialLinks']> = {
  email: 'thefuturex.ptc@gmail.com',
  twitter: '',
  facebook: '',
  instagram: '',
  youtube: '',
  linkedin: '',
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  logoUrl: string;
  updateLogoUrl: (url: string) => void;
  socialLinks: NonNullable<WebsiteSettings['socialLinks']>;
  updateSocialLinks: (links: NonNullable<WebsiteSettings['socialLinks']>) => void;
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
  const [socialLinks, setSocialLinks] = useState<NonNullable<WebsiteSettings['socialLinks']>>(DEFAULT_SOCIAL_LINKS);
  const [footerSections, setFooterSections] = useState(DEFAULT_FOOTER_SECTIONS);
  const [pageContent, setPageContent] = useState<Record<string, string>>(DEFAULT_PAGE_CONTENT);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '14 165 233';
  };

  const applyWebsiteSettings = (settings: Partial<WebsiteSettings>) => {
    if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
    if (typeof settings.logoUrl === 'string') setLogoUrl(settings.logoUrl);
    if (settings.footerSections?.length) setFooterSections(settings.footerSections);
    if (settings.pageContent) setPageContent((prev) => ({ ...prev, ...settings.pageContent }));
    if (settings.socialLinks) setSocialLinks((prev) => ({ ...prev, ...settings.socialLinks }));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    localStorage.setItem('aura_theme', 'dark');

    getWebsiteSettings().then((settings) => applyWebsiteSettings(settings)).catch(() => {});

    const onSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<WebsiteSettings>>;
      applyWebsiteSettings(customEvent.detail || {});
    };

    window.addEventListener('website-settings-updated', onSettingsUpdated as EventListener);
    return () => {
      window.removeEventListener('website-settings-updated', onSettingsUpdated as EventListener);
    };
  }, []);

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

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        primaryColor,
        updatePrimaryColor: setPrimaryColor,
        logoUrl,
        updateLogoUrl: setLogoUrl,
        socialLinks,
        updateSocialLinks: setSocialLinks,
        footerSections,
        updateFooterSections: setFooterSections,
        pageContent,
        updatePageContent: setPageContent,
      }}
    >
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
      socialLinks: DEFAULT_SOCIAL_LINKS,
      updateSocialLinks: () => {},
      footerSections: DEFAULT_FOOTER_SECTIONS,
      updateFooterSections: () => {},
      pageContent: DEFAULT_PAGE_CONTENT,
      updatePageContent: () => {},
    };
  }
  return context;
};
