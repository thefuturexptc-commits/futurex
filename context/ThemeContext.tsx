import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, WebsiteSettings } from '../types';
import { getWebsiteSettings, subscribeWebsiteSettings } from '../services/backend';
import { DEFAULT_FOOTER_SECTIONS, DEFAULT_PAGE_CONTENT, DEFAULT_SOCIAL_LINKS } from '../services/contentDefaults';
const SETTINGS_DRAFT_KEY = 'aura_settings_draft';

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
  const [theme, setTheme] = useState<Theme>('dark');
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
    if (settings.footerSections?.length) {
      setFooterSections(settings.footerSections);
    } else {
      setFooterSections(DEFAULT_FOOTER_SECTIONS);
    }
    if (settings.pageContent) {
      setPageContent({ ...DEFAULT_PAGE_CONTENT, ...settings.pageContent });
    } else {
      setPageContent(DEFAULT_PAGE_CONTENT);
    }
    if (settings.socialLinks) {
      setSocialLinks({ ...DEFAULT_SOCIAL_LINKS, ...settings.socialLinks });
    } else {
      setSocialLinks(DEFAULT_SOCIAL_LINKS);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const savedTheme = (localStorage.getItem('aura_theme') as Theme) || 'dark';
    setTheme(savedTheme);
    root.classList.remove('light', 'dark');
    root.classList.add(savedTheme);

    let localDraft: Partial<WebsiteSettings> = {};
    try {
      const raw = localStorage.getItem(SETTINGS_DRAFT_KEY);
      if (raw) {
        localDraft = JSON.parse(raw) as Partial<WebsiteSettings>;
        applyWebsiteSettings(localDraft);
      }
    } catch {
      // Ignore malformed local draft and continue with remote settings.
    }

    getWebsiteSettings()
      .then((settings) =>
        applyWebsiteSettings({
          ...localDraft,
          ...settings,
          socialLinks: { ...(localDraft.socialLinks || {}), ...(settings.socialLinks || {}) },
          footerSections: settings.footerSections?.length ? settings.footerSections : localDraft.footerSections,
          pageContent: { ...(localDraft.pageContent || {}), ...(settings.pageContent || {}) },
        })
      )
      .catch(() => {});

    const unsubscribeRealtime = subscribeWebsiteSettings((settings) => {
      applyWebsiteSettings(settings);
    });

    const onSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<WebsiteSettings>>;
      applyWebsiteSettings(customEvent.detail || {});
    };

    window.addEventListener('website-settings-updated', onSettingsUpdated as EventListener);
    return () => {
      window.removeEventListener('website-settings-updated', onSettingsUpdated as EventListener);
      unsubscribeRealtime();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_DRAFT_KEY,
        JSON.stringify({
          primaryColor,
          logoUrl,
          socialLinks,
          footerSections,
          pageContent,
        } as WebsiteSettings)
      );
    } catch {
      // Ignore local storage write issues.
    }
  }, [primaryColor, logoUrl, socialLinks, footerSections, pageContent]);

  useEffect(() => {
    const rgb = hexToRgb(primaryColor);
    const root = document.documentElement;
    root.style.setProperty('--color-primary-500', rgb);
    root.style.setProperty('--color-primary-600', rgb);
    root.style.setProperty('--color-primary-400', rgb);
    root.style.setProperty('--color-primary-700', rgb);
    root.style.setProperty('--color-primary-50', '240 249 255');
  }, [primaryColor]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    localStorage.setItem('aura_theme', newTheme);
  };

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
