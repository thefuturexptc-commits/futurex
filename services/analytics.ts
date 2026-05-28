import type { CartItem } from '../types';
import type { Product } from '../types';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import type { SiteAnalyticsEvent, SiteAnalyticsEventName } from '../types';

type DataLayerEvent = Record<string, unknown>;

type MetaEventPayload = Record<string, string | number | boolean | Array<string | number> | Array<Record<string, string | number>>>;

type MetaFbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: MetaFbq;
};

const META_PIXEL_IDS = ['25329725483315135', '1194647876030900'];
const initializedMetaPixelIds = new Set<string>();
const ANALYTICS_STORAGE_KEY = 'tfx_site_analytics_events';
const ANALYTICS_SESSION_KEY = 'tfx_analytics_session_id';
const ORDER_SOURCE_SESSION_KEY = 'tfx_order_source';
const TRACKED_SITE_EVENTS = new Set<SiteAnalyticsEventName>([
  'page_view',
  'add_to_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
]);

const getMetaWindow = () =>
  typeof window === 'undefined'
    ? null
    : (window as Window & {
        fbq?: MetaFbq;
        _fbq?: MetaFbq;
      });

const getDataLayer = (): DataLayerEvent[] | null => {
  if (typeof window === 'undefined') return null;
  const targetWindow = window as Window & { dataLayer?: DataLayerEvent[] };
  targetWindow.dataLayer = targetWindow.dataLayer || [];
  return targetWindow.dataLayer;
};

const createId = () => `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const getAnalyticsSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  const next = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    const existing = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
    if (existing) return existing;
    window.localStorage.setItem(ANALYTICS_SESSION_KEY, next);
  } catch {
    return next;
  }
  return next;
};

const readLocalAnalyticsEvents = (): SiteAnalyticsEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SiteAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
};

const writeLocalAnalyticsEvent = (event: SiteAnalyticsEvent) => {
  if (typeof window === 'undefined') return;
  try {
    const next = [event, ...readLocalAnalyticsEvents()].slice(0, 800);
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // local analytics should never block the customer flow
  }
};

const getTrafficSource = () => {
  if (typeof window === 'undefined') return 'Website';
  try {
    return window.sessionStorage.getItem(ORDER_SOURCE_SESSION_KEY) || 'Website';
  } catch {
    return 'Website';
  }
};

const firstAnalyticsItem = (payload: DataLayerEvent) => {
  const ecommerce = payload.ecommerce as
    | {
        value?: number;
        transaction_id?: string;
        items?: Array<{
          item_id?: string | number;
          item_name?: string;
          item_category?: string;
          quantity?: number;
        }>;
      }
    | undefined;
  return { ecommerce, item: ecommerce?.items?.[0] };
};

const toSiteAnalyticsEvent = (event: SiteAnalyticsEventName, payload: DataLayerEvent): SiteAnalyticsEvent => {
  const { ecommerce, item } = firstAnalyticsItem(payload);
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pageLocation = typeof window !== 'undefined' ? window.location.href : '';
  const pageTitle = typeof document !== 'undefined' ? document.title : '';
  return {
    id: createId(),
    event,
    timestamp: new Date().toISOString(),
    sessionId: getAnalyticsSessionId(),
    userId: auth.currentUser?.uid,
    pagePath: String(payload.page_path || pagePath || '/'),
    pageTitle: String(payload.page_title || pageTitle || ''),
    pageLocation: String(payload.page_location || pageLocation || ''),
    productId: item?.item_id !== undefined ? String(item.item_id) : undefined,
    productName: item?.item_name,
    productCategory: item?.item_category,
    value: Number(ecommerce?.value || 0) || undefined,
    quantity: Number(item?.quantity || 0) || undefined,
    orderId: ecommerce?.transaction_id,
    source: getTrafficSource(),
  };
};

const recordSiteAnalyticsEvent = (event: string, payload: DataLayerEvent) => {
  if (typeof window === 'undefined' || !TRACKED_SITE_EVENTS.has(event as SiteAnalyticsEventName)) return;
  try {
    const analyticsEvent = toSiteAnalyticsEvent(event as SiteAnalyticsEventName, payload);
    writeLocalAnalyticsEvent(analyticsEvent);
    addDoc(collection(db, 'site_analytics'), analyticsEvent).catch(() => {
      // local fallback is already saved
    });
  } catch {
    // analytics should never break the website
  }
};

export const cartItemsToAnalyticsItems = (items: CartItem[]) =>
  items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    item_variant: [item.selectedColorName, item.selectedSize].filter(Boolean).join(' / ') || undefined,
    price: Number(item.price || item.salePrice || 0),
    quantity: Number(item.quantity || 1),
  }));

export const productToAnalyticsItem = (product: Product, quantity = 1) => ({
  item_id: product.id,
  item_name: product.name,
  item_category: product.category,
  item_variant: [product.selectedColorName, product.selectedSize].filter(Boolean).join(' / ') || undefined,
  price: Number(product.price || product.salePrice || 0),
  quantity: Number(quantity || 1),
});

const ensureMetaPixel = () => {
  const targetWindow = getMetaWindow();
  if (!targetWindow) return null;

  if (!targetWindow.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
        return;
      }
      fbq.queue?.push(args);
    } as MetaFbq;

    targetWindow.fbq = fbq;
    targetWindow._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }

  META_PIXEL_IDS.forEach((pixelId) => {
    if (initializedMetaPixelIds.has(pixelId)) return;
    targetWindow.fbq?.('init', pixelId);
    initializedMetaPixelIds.add(pixelId);
  });
  return targetWindow.fbq;
};

const toMetaPayload = (payload: DataLayerEvent): MetaEventPayload => {
  const ecommerce = payload.ecommerce as
    | {
        currency?: string;
        value?: number;
        transaction_id?: string;
        items?: Array<{
          item_id?: string | number;
          item_name?: string;
          item_category?: string;
          price?: number;
          quantity?: number;
        }>;
      }
    | undefined;

  if (!ecommerce) return {};

  const items = ecommerce.items || [];
  return {
    currency: ecommerce.currency || 'INR',
    value: Number(ecommerce.value || 0),
    content_ids: items.map((item) => item.item_id).filter((id): id is string | number => id !== undefined),
    content_type: 'product',
    contents: items.map((item) => ({
      id: String(item.item_id || ''),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || 0),
    })),
    num_items: items.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    ...(ecommerce.transaction_id ? { order_id: ecommerce.transaction_id } : {}),
  };
};

const trackMetaEvent = (event: string, payload: MetaEventPayload = {}) => {
  const fbq = ensureMetaPixel();
  if (!fbq) return;
  fbq('track', event, payload);
};

const pushMetaEvent = (event: string, payload: DataLayerEvent) => {
  const metaEventMap: Record<string, string> = {
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    add_payment_info: 'AddPaymentInfo',
    purchase: 'Purchase',
  };

  const metaEvent = metaEventMap[event];
  if (!metaEvent) return;
  trackMetaEvent(metaEvent, toMetaPayload(payload));
};

export const pushDataLayerEvent = (event: string, payload: DataLayerEvent = {}) => {
  const dataLayer = getDataLayer();
  if (dataLayer) {
    dataLayer.push({ ecommerce: null });
    dataLayer.push({ event, ...payload });
  }
  recordSiteAnalyticsEvent(event, payload);
  pushMetaEvent(event, payload);
};

export const pushPageView = (path: string, title: string) => {
  pushDataLayerEvent('page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  pushDataLayerEvent('virtual_page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  trackMetaEvent('PageView');
};
