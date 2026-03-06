import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, WebsiteSettings } from '../types';
import { getWebsiteSettings, subscribeWebsiteSettings } from '../services/backend';

const DEFAULT_FOOTER_SECTIONS = [
  { title: 'COMPANY', items: ['About Us', 'Contact'] },
  { title: 'SUPPORT', items: ['Shipping', 'Returns', 'FAQ', 'Track Order'] },
  { title: 'LEGAL', items: ['Privacy', 'Terms', 'Refund', 'Cookies'] },
];
const DEFAULT_PAGE_CONTENT: Record<string, string> = {
  'about-us': `Welcome to TheFutureX, your trusted destination for innovative and high-quality electronic products designed for modern lifestyles.

At TheFutureX, we believe technology should make life easier, smarter, and more convenient. Our goal is to provide reliable gadgets and smart devices that enhance everyday living while maintaining excellent quality and affordability.

Our Mission

Our mission is to bring the latest and most useful technology products to customers across India while ensuring great customer service and a smooth shopping experience.

We focus on offering products that combine innovation, durability, and value for money.

What We Offer

At TheFutureX, we specialize in a range of modern electronic products, including smart wearable devices, smart home solutions, and daily-use electronic accessories designed for convenience and performance.`,
  contact: `We are here to help. If you have any questions about our products, orders, shipping, or returns, please feel free to contact us. Our support team will be happy to assist you.

Customer Support

Email: support@thefuturex.in

For order-related queries, please include your Order ID in the email so we can assist you faster.

Business Address

TheFutureX
Office No. 310, Padmi Bai Tower
Virar East, Maharashtra
India

Working Hours

Monday - Saturday: 10:00 AM - 6:00 PM
Sunday: Closed`,
  shipping: `At TheFutureX, we aim to deliver your orders quickly and safely. This Shipping Policy explains how we process and ship your orders.

1. Order Processing

All orders placed on TheFutureX.in are processed within 1-2 business days after successful payment confirmation.

Orders are not processed or shipped on Sundays or public holidays.

If we experience a high volume of orders, shipments may be delayed slightly. In such cases, customers will be notified.

2. Shipping Time

Estimated delivery time depends on the customer's location.
Metro Cities: 3-5 business days
Other Cities: 4-7 business days

Delivery timelines may vary depending on courier availability and unforeseen circumstances.

3. Shipping Charges

Shipping charges may vary depending on the product and delivery location.

In some cases, free shipping may be offered during promotional offers or on selected products.

The final shipping cost will be shown at the checkout page before payment.

4. Order Tracking

Once your order is shipped, you will receive a tracking ID via email or SMS.

You can track your order using the tracking link provided.

5. Delivery Issues

If you face any issues with delivery, such as delayed shipment, package not delivered, or incorrect delivery address, please contact our support team immediately.

6. Incorrect Address

Customers must ensure that the shipping address provided during checkout is accurate.

TheFutureX will not be responsible for orders delivered to an incorrect address provided by the customer.

7. Damaged Packages

If your package arrives damaged or tampered, please take photos or videos while opening the package and contact our support team within 24 hours of delivery.

8. Contact Us

For any shipping-related questions, please contact us:
Email: support@thefuturex.in
Address: Virar East, Maharashtra, India
Website: https://thefuturex.in`,
  returns: 'Add your return policy details from Admin Settings.',
  faq: 'Add frequently asked questions from Admin Settings.',
  'track-order': 'Add order tracking instructions from Admin Settings.',
  privacy: 'Add your privacy policy from Admin Settings.',
  terms: 'Add your terms and conditions from Admin Settings.',
  refund: `At TheFutureX, customer satisfaction is our priority. If you are not completely satisfied with your purchase, you may request a return or refund under the conditions mentioned below.

1. Return Eligibility

You may request a return if:
- The product is damaged, defective, or received in incorrect condition.
- The wrong product was delivered.
- The product is unused and in original packaging (for eligible return cases).

To process your request quickly, contact support within the return window with order details and proof photos/videos.

For refund and return support:
Email: support@thefuturex.in`,
  cookies: 'Add your cookie policy from Admin Settings.',
};
const DEFAULT_SOCIAL_LINKS: NonNullable<WebsiteSettings['socialLinks']> = {
  email: 'support@thefuturex.in',
  twitter: '',
  facebook: '',
  instagram: '',
  youtube: '',
  linkedin: '',
};
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
