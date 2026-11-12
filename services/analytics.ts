import type { CartItem } from '../types';
import type { Product } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { isAdminPath } from '../utils/analyticsPolicy.js';
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
  if (!analyticsReady || isTrackingExcluded()) return;
  void fetchAndStoreVisitorGeo({ forceRefresh: true }).then((ipGeo) => {
    if (hasGeoValue(ipGeo)) {
      pushDataLayerEvent('location_update', { locationSource: ipGeo.locationSource || 'lookup' });
    }
  });
};

const getStoredActiveUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('aura_active_user');
    return raw ? (JSON.parse(raw) as { email?: string; phone?: string; role?: string }) : null;
  } catch {
    return null;
  }
};

let analyticsReady = false;
let analyticsAdmin = false;
let gtmInitialized = false;
let memorySession: { id: string; lastSeen: number } | null = null;
const markedAdminSessions = new Set<string>();
const pendingEvents: Array<() => void> = [];
export const setAnalyticsIdentity = (ready: boolean, admin: boolean) => {
  analyticsReady = ready;
  analyticsAdmin = admin;
  if (typeof window !== 'undefined') {
    const target = window as unknown as Record<string, unknown>;
    target.tfxAnalyticsExcluded = !ready || admin || isAdminPath(window.location.pathname);
    const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    if (measurementId) target[`ga-disable-${measurementId}`] = target.tfxAnalyticsExcluded;
  }
  if (ready) pendingEvents.splice(0).forEach(work => { if (!admin) work(); });
  if (ready && admin && auth.currentUser) {
    const sessions = [getAnalyticsSessionId()];
    try {
      const legacy = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
      if (legacy) sessions.push(legacy);
    } catch { /* Optional legacy attribution. */ }
    sessions.forEach(sessionId => {
      if (markedAdminSessions.has(sessionId)) return;
      markedAdminSessions.add(sessionId);
      // This is an exclusion marker, never a visitor or conversion event.
      void setDoc(doc(db, 'analytics_excluded_sessions', sessionId), { userId: auth.currentUser!.uid, timestamp: new Date().toISOString() }).catch(() => markedAdminSessions.delete(sessionId));
    });
  }
};
export const isTrackingExcluded = (path?: string) => {
  const stored = getStoredActiveUser();
  return typeof window === 'undefined' || analyticsAdmin ||
    isAdminPath(path || window.location.pathname) || isAdminPath(window.location.pathname) ||
    ['admin', 'superadmin'].includes(stored?.role || '') ||
    stored?.email?.toLowerCase() === 'thefuturex.ptc@gmail.com';
};

const getAnalyticsSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  const next = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    const existing = JSON.parse(window.sessionStorage.getItem(ANALYTICS_SESSION_KEY) || 'null');
    const active = existing && Date.now() - existing.lastSeen < 30 * 60 * 1000;
    const id = active ? existing.id : next;
    window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify({ id, lastSeen: Date.now() }));
    return id;
  } catch {
    const id = memorySession && Date.now() - memorySession.lastSeen < 30 * 60 * 1000 ? memorySession.id : next;
    memorySession = { id, lastSeen: Date.now() };
    return id;
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
    isLoggedIn: Boolean((auth.currentUser && !auth.currentUser.isAnonymous) || storedUser),
    userRole: storedUser?.role || 'visitor',
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
    if (isTrackingExcluded(String(payload.page_path || ''))) return;
    const analyticsEvent = toSiteAnalyticsEvent(event as SiteAnalyticsEventName, payload);
    if (event === 'purchase' && analyticsEvent.orderId) analyticsEvent.id = `purchase_${analyticsEvent.orderId}`;
    // Firestore rejects undefined values. Keep the event's original page and time.
    const cleanEvent = JSON.parse(JSON.stringify(analyticsEvent));
    writeLocalAnalyticsEvent(analyticsEvent);
    setDoc(doc(db, 'site_analytics', analyticsEvent.id), cleanEvent).catch(() => {
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
  if (isTrackingExcluded(String(payload.page_path || ''))) return;
  if (!analyticsReady) {
    const snapshot = { page_path: window.location.pathname, page_location: window.location.href, page_title: document.title, ...payload };
    pendingEvents.push(() => pushDataLayerEvent(event, snapshot));
    return;
  }
  if (event === 'purchase') {
    const orderId = firstAnalyticsItem(payload).ecommerce?.transaction_id;
    if (!orderId) return;
    try {
      const key = `tfx_purchase_tracked_${orderId}`;
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, '1');
    } catch { /* Tracking still works without storage. */ }
  }
  const dataLayer = getDataLayer();
  if (!gtmInitialized && dataLayer) {
    gtmInitialized = true;
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-MFP4VCPQ';
    document.head.appendChild(script);
  }
  if (dataLayer) {
    dataLayer.push({ ecommerce: null });
    dataLayer.push({ event, ...payload });
  }
  void recordSiteAnalyticsEvent(event, payload);
  pushMetaEvent(event, payload);
  if (event === 'page_view') trackMetaEvent('PageView');
};

export const pushPageView = (path: string, title: string) => {
  if (isTrackingExcluded(path)) return;
  pushDataLayerEvent('page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: title,
      referrer: document.referrer,
    });
  pushDataLayerEvent('virtual_page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  // Route Meta events pass through the same auth-ready gate.
};
