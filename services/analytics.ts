import type { CartItem } from '../types';
import type { Product } from '../types';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import type { SiteAnalyticsEvent, SiteAnalyticsEventName } from '../types';

type DataLayerEvent = Record<string, unknown>;

type MetaEventPayload = Record<string, string | number | boolean | Array<string | number> | Array<Record<string, string | number>>>;

export type VisitorGeo = {
  ipAddress?: string;
  city?: string;
  region?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: 'detected' | 'lookup' | 'checkout' | 'precise';
  userAgent?: string;
};

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
const VISITOR_GEO_STORAGE_KEY = 'userLocation';
const VISITOR_GEO_LEGACY_STORAGE_KEY = 'tfx_visitor_geo';
const VISITOR_GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_VISITOR_LOCATION_ENDPOINT =
  'https://asia-south1-futurexweb-ae46b.cloudfunctions.net/getUserLocation';
const VISITOR_LOCATION_ENDPOINT =
  import.meta.env.VITE_USER_LOCATION_ENDPOINT || DEFAULT_VISITOR_LOCATION_ENDPOINT || '/api/visitor-geo';
const TRACKED_SITE_EVENTS = new Set<SiteAnalyticsEventName>([
  'page_view',
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
  'login',
  'location_update',
]);
let visitorGeoCache: VisitorGeo | null = null;
let visitorGeoRequest: Promise<VisitorGeo> | null = null;

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

const hasGeoValue = (geo: VisitorGeo) =>
  Boolean(geo.ipAddress || geo.city || geo.region || geo.country || geo.pincode || geo.latitude || geo.longitude);

const normalizeVisitorGeo = (data: Record<string, unknown>): VisitorGeo => {
  const cleanString = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;
  const region = cleanString(data.region) || cleanString(data.state);

  return {
    ipAddress: cleanString(data.ipAddress),
    city: cleanString(data.city),
    region,
    country: cleanString(data.country),
    pincode: cleanString(data.pincode || data.postal),
    locationSource:
      data.locationSource === 'detected' || data.locationSource === 'lookup'
        ? data.locationSource
        : undefined,
    userAgent: cleanString(data.userAgent),
  };
};

const readCachedVisitorGeo = (): VisitorGeo | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VISITOR_GEO_STORAGE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as { fetchedAt?: number; location?: VisitorGeo } & VisitorGeo;
    const fetchedAt = Number(cached.fetchedAt || 0);
    const location = cached.location || cached;
    if (!fetchedAt || Date.now() - fetchedAt > VISITOR_GEO_CACHE_TTL_MS || !hasGeoValue(location)) {
      window.localStorage.removeItem(VISITOR_GEO_STORAGE_KEY);
      return null;
    }
    return location;
  } catch {
    return null;
  }
};

const fetchVisitorGeo = async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<VisitorGeo> => {
  if (typeof window === 'undefined') return {};
  if (!forceRefresh) {
    if (visitorGeoCache) return visitorGeoCache;
    const cachedGeo = readCachedVisitorGeo();
    if (cachedGeo) {
      visitorGeoCache = cachedGeo;
      return cachedGeo;
    }
  }
  if (forceRefresh) {
    visitorGeoRequest = null;
  }
  if (!visitorGeoRequest) {
    visitorGeoRequest = fetch(VISITOR_LOCATION_ENDPOINT, {
      method: 'GET',
      credentials: VISITOR_LOCATION_ENDPOINT.startsWith('/') ? 'same-origin' : 'omit',
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : {}))
      .then((data) => {
        const nextGeo = normalizeVisitorGeo(data);
        visitorGeoCache = hasGeoValue(nextGeo) ? nextGeo : null;
        visitorGeoRequest = visitorGeoCache ? visitorGeoRequest : null;
        return nextGeo;
      })
      .catch(() => {
        visitorGeoRequest = null;
        return {};
      });
  }
  return visitorGeoRequest;
};

const getVisitorGeoSnapshot = (): VisitorGeo => {
  if (visitorGeoCache) return visitorGeoCache;
  if (typeof window === 'undefined') return {};
  try {
    return readCachedVisitorGeo() || {};
  } catch {
    return {};
  }
};

const storeVisitorGeoSnapshot = (geo: VisitorGeo) => {
  if (typeof window === 'undefined' || !hasGeoValue(geo)) return;
  try {
    window.localStorage.setItem(
      VISITOR_GEO_STORAGE_KEY,
      JSON.stringify({
        fetchedAt: Date.now(),
        location: geo,
      })
    );
    window.sessionStorage.setItem(VISITOR_GEO_LEGACY_STORAGE_KEY, JSON.stringify(geo));
  } catch {
    // Analytics should keep working even when storage is unavailable.
  }
};

const fetchAndStoreVisitorGeo = async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<VisitorGeo> =>
  fetchVisitorGeo({ forceRefresh }).then((geo) => {
    storeVisitorGeoSnapshot(geo);
    return geo;
  });

export const getApproxVisitorGeo = (): Promise<VisitorGeo> => fetchAndStoreVisitorGeo();

export const preloadVisitorGeo = () => {
  void fetchAndStoreVisitorGeo();
};

const getStoredActiveUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('aura_active_user');
    return raw ? (JSON.parse(raw) as { email?: string; phone?: string }) : null;
  } catch {
    return null;
  }
};

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
  const storedUser = getStoredActiveUser();
  const geo = getVisitorGeoSnapshot();
  return {
    id: createId(),
    event,
    timestamp: new Date().toISOString(),
    sessionId: getAnalyticsSessionId(),
    userId: auth.currentUser?.uid,
    isLoggedIn: Boolean(auth.currentUser?.uid || storedUser),
    userEmail: auth.currentUser?.email || storedUser?.email || undefined,
    userPhone: typeof payload.phone === 'string' ? payload.phone : storedUser?.phone || undefined,
    referrer: String(payload.referrer || (typeof document !== 'undefined' ? document.referrer : '') || ''),
    ipAddress: geo.ipAddress,
    userAgent: geo.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
    city: typeof payload.city === 'string' ? payload.city : geo.city,
    region: typeof payload.region === 'string' ? payload.region : geo.region,
    country: typeof payload.country === 'string' ? payload.country : geo.country,
    pincode: typeof payload.pincode === 'string' ? payload.pincode : geo.pincode,
    latitude: typeof payload.latitude === 'number' ? payload.latitude : geo.latitude,
    longitude: typeof payload.longitude === 'number' ? payload.longitude : geo.longitude,
    locationAccuracy: typeof payload.locationAccuracy === 'number' ? payload.locationAccuracy : geo.locationAccuracy,
    locationSource:
      payload.locationSource === 'checkout' ||
      payload.locationSource === 'detected' ||
      payload.locationSource === 'lookup' ||
      payload.locationSource === 'precise'
        ? payload.locationSource
        : geo.locationSource,
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

const recordSiteAnalyticsEvent = async (event: string, payload: DataLayerEvent) => {
  if (typeof window === 'undefined' || !TRACKED_SITE_EVENTS.has(event as SiteAnalyticsEventName)) return;
  try {
    await fetchAndStoreVisitorGeo({ forceRefresh: true });
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
  void recordSiteAnalyticsEvent(event, payload);
  pushMetaEvent(event, payload);
};

export const pushPageView = (path: string, title: string) => {
  void fetchAndStoreVisitorGeo().finally(() => {
    pushDataLayerEvent('page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: title,
      referrer: document.referrer,
    });
  });
  pushDataLayerEvent('virtual_page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  trackMetaEvent('PageView');
};
