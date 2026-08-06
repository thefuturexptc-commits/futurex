import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, WebsiteSettings } from '../types';
import { DEFAULT_FOOTER_SECTIONS, DEFAULT_PAGE_CONTENT, DEFAULT_SOCIAL_LINKS } from '../services/contentDefaults';
const SETTINGS_DRAFT_KEY = 'aura_settings_draft';
const THEME_PREFERENCE_KEY = 'aura_theme_preference';

const DEFAULT_THEME: Theme = 'light';

const applyCurrentContactDetails = (content: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(content).map(([key, value]) => [
      key,
      value
        .replace(/supporttfxvital@gmail\.com/gi, 'thefuturex.ptc@gmail.com')
        .replace(/Hirubhai Residency/g, 'Hirubai Residency')
        .replace(
          /201-202, Hirubai Residency, Besides Vedant Hospital, Near Virar East-West Flyover, Virar West, Maharashtra 401303, India/g,
          'Office No: 201-202, Hirubai Residency, Besides Vedant Hospital, Near Virar East-West Flyover, Virar West'
        )
        .replace(/201-202, Hirubai Residency/g, 'Office No: 201-202, Hirubai Residency')
        .replace(/Virar West, Maharashtra 401303\s*India/g, 'Virar West')
        .replace(/\+91\s*85303\s*40676/g, '8530340676')
        .replace(/\+91\s*8530340676/g, '8530340676'),
    ])
  );

const runWhenIdle = (work: () => void, timeout = 1200): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  let cleanup = () => {};
  const delayId = window.setTimeout(() => {
    const requestIdle = (window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    const cancelIdle = (window as Window & {
      cancelIdleCallback?: (id: number) => void;
    }).cancelIdleCallback;

    if (requestIdle) {
      const idleId = requestIdle(work, { timeout: 2500 });
      cleanup = () => cancelIdle?.(idleId);
      return;
    }

    const id = window.setTimeout(work, 300);
    cleanup = () => window.clearTimeout(id);
  }, timeout);

  return () => {
    window.clearTimeout(delayId);
    cleanup();
  };
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
  const getPreferredTheme = (): Theme => {
    return DEFAULT_THEME;
  };

  const applyThemeClass = () => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(DEFAULT_THEME);
    root.style.colorScheme = DEFAULT_THEME;
  };

  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());
  const [primaryColor, setPrimaryColor] = useState('#ff0033');
  const [logoUrl, setLogoUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<NonNullable<WebsiteSettings['socialLinks']>>(DEFAULT_SOCIAL_LINKS);
  const [footerSections, setFooterSections] = useState(DEFAULT_FOOTER_SECTIONS);
  const [pageContent, setPageContent] = useState<Record<string, string>>(DEFAULT_PAGE_CONTENT);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '255 0 51';
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
      setPageContent(applyCurrentContactDetails({ ...DEFAULT_PAGE_CONTENT, ...settings.pageContent }));
    } else {
      setPageContent(DEFAULT_PAGE_CONTENT);
    }
    if (settings.socialLinks) {
      setSocialLinks({ ...DEFAULT_SOCIAL_LINKS, ...settings.socialLinks, email: DEFAULT_SOCIAL_LINKS.email });
    } else {
      setSocialLinks(DEFAULT_SOCIAL_LINKS);
    }
  };

  useEffect(() => {
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);
    applyThemeClass();

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

    let isMounted = true;
    let unsubscribeRealtime = () => {};
    const cancelSettingsLoad = runWhenIdle(() => {
      import('../services/backend')
        .then(({ getWebsiteSettings, subscribeWebsiteSettings }) => {
          if (!isMounted) return;
          getWebsiteSettings()
            .then((settings) => {
              if (!isMounted) return;
              applyWebsiteSettings({
                ...localDraft,
                ...settings,
                socialLinks: { ...(localDraft.socialLinks || {}), ...(settings.socialLinks || {}) },
                footerSections: settings.footerSections?.length ? settings.footerSections : localDraft.footerSections,
                pageContent: { ...(localDraft.pageContent || {}), ...(settings.pageContent || {}) },
              });
            })
            .catch(() => {});

          unsubscribeRealtime = subscribeWebsiteSettings((settings) => {
            if (isMounted) applyWebsiteSettings(settings);
          });
        })
        .catch(() => {});
    }, 7500);

    const onSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<WebsiteSettings>>;
      applyWebsiteSettings(customEvent.detail || {});
    };

    window.addEventListener('website-settings-updated', onSettingsUpdated as EventListener);

    return () => {
      isMounted = false;
      cancelSettingsLoad();
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
    root.style.setProperty('--color-primary-50', '255 241 244');
  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme(DEFAULT_THEME);
    applyThemeClass();
    localStorage.setItem(THEME_PREFERENCE_KEY, DEFAULT_THEME);
    localStorage.setItem('aura_theme', DEFAULT_THEME);
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
      theme: 'light' as Theme,
      toggleTheme: () => {},
      primaryColor: '#ff0033',
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
