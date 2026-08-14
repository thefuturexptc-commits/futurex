import { 
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, getFirestore
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  UserCredential,
  fetchSignInMethodsForEmail,
  signInWithPopup, 
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  signOut as signOutFromAuth,
  PhoneAuthProvider,
  ConfirmationResult,
  getAuth as getAuthFromApp,
  User as FirebaseAuthUser
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { initializeApp, deleteApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { db, auth, storage, app as mainApp } from './firebaseConfig';
import { Product, ProductColor, ProductNotifyRequest, ProductPublicReview, OfferLead, User, UserPermissions, Order, Address, WebsiteSettings, SupportChatMessage, SupportChatSession, CheckoutShippingDetails, SiteAnalyticsEvent, BlogPost } from '../types';
import { INITIAL_PRODUCTS } from './mockData';
import { DEFAULT_FOOTER_SECTIONS, DEFAULT_PAGE_CONTENT, DEFAULT_SOCIAL_LINKS } from './contentDefaults';
import { TFX5_AI_BAND_PRICE, isTfxV5Band } from '../utils/coupons';

const logDevWarning = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

const logDevError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

// 🔒 ADDED: Production Safe URL Validator
const isValidProductionUrl = (url: string): boolean => {
    if (!url) return false;

    if (
        url.startsWith("blob:") ||
        url.startsWith("data:") ||
        url.includes("localhost") ||
        url.startsWith("http://localhost")
    ) {
        return false;
    }

    return true;
};

const sanitizeImageUrlsForCloud = (urls?: string[]): string[] =>
  (Array.isArray(urls) ? urls : []).filter((url) => typeof url === 'string' && isValidProductionUrl(url));

const sanitizeProductImagesForCloud = (product: Product): Product => ({
  ...product,
  images: sanitizeImageUrlsForCloud(product.images),
  colors: (product.colors || []).map((color) => ({
    ...color,
    images: sanitizeImageUrlsForCloud(color.images),
  })),
  variants: (product.variants || []).map((variant) => ({
    ...variant,
    images: sanitizeImageUrlsForCloud(variant.images),
  })),
});

// --- Helper: Data Sanitization (Crucial for Firestore) ---
const deepSanitize = (obj: any): any => {
    if (obj === undefined) return null; // Firestore doesn't like undefined
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
    }
    
    const res: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (val !== undefined) {
                res[key] = deepSanitize(val);
            }
        }
    }
    return res;
};

// --- Helper: Mock Data Management ---
const memoryStore = new Map<string, unknown>();
const MOCK_STORAGE_PREFIX = 'aura_mock_';

const readFromLocalStorage = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${MOCK_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const getMockData = <T>(key: string, defaultVal: T): T => {
    if (memoryStore.has(key)) return memoryStore.get(key) as T;
    const stored = readFromLocalStorage<T>(key);
    if (stored !== null) {
      memoryStore.set(key, stored);
      return stored;
    }
    return defaultVal;
};

const setMockData = (key: string, data: any) => {
    memoryStore.set(key, data);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`${MOCK_STORAGE_PREFIX}${key}`, JSON.stringify(data));
      } catch {
        // Ignore storage quota / private mode failures and keep in-memory fallback.
      }
    }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

const isAbortLikeError = (error: unknown): boolean => {
  if (!error) return false;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error) {
    const text = `${error.name} ${error.message}`.toLowerCase();
    return text.includes('abort');
  }
  const message = String(error).toLowerCase();
  return message.includes('abort');
};

const isTimeoutLikeError = (error: unknown): boolean => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('timed out') || message.toLowerCase().includes('timeout');
};

const isPermissionDeniedError = (error: unknown): boolean => {
  if (!error) return false;
  const code = (error as { code?: string })?.code || '';
  const message = error instanceof Error ? error.message : String(error);
  const lowered = `${code} ${message}`.toLowerCase();
  return lowered.includes('permission-denied') || lowered.includes('missing or insufficient permissions');
};

const PRODUCTS_CACHE_TTL_MS = 15000;
let productsCache: { data: Product[]; ts: number } | null = null;
let productsInFlight: Promise<Product[]> | null = null;

export const toProductSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const DISPLAY_PRO_LEGACY_SLUG = 'tfx-display-pro-smart-ring-premium-tracking-with-display-and-wireless-charging';
const DISPLAY_PRO_CANONICAL_SLUG = 'tfx-display-pro-smart-ring';
const SMART_SLEEP_MONITOR_SLUG = 'thefuturex-smart-sleep-tracking-monitoring-system';

const resolveKnownProductSlug = (slug: string): string => {
  if (slug === DISPLAY_PRO_LEGACY_SLUG) return DISPLAY_PRO_CANONICAL_SLUG;
  return slug;
};

const isStandardSmartBandProduct = (product: Pick<Product, 'name'> & Partial<Pick<Product, 'slug'>>): boolean => {
  const text = `${product.name || ''} ${product.slug || ''}`.toLowerCase();
  if (!/\btfx\s*smart\s*band\b|\bmodern\s+fitness\s+tracking\b/.test(text)) return false;
  return !/\btfx\s*5\b|\btfx5\b|\bv5\b|\bai\s*v5\b|\bai\s+smart\s+band\b/.test(text);
};

export const generateProductSlug = (title: string): string =>
  toProductSlug(String(title || ''));

const normalizeProductSlug = (product: Pick<Product, 'name'> & Partial<Pick<Product, 'slug'>>): string =>
  isStandardSmartBandProduct(product)
    ? 'tfx-smart-band'
    : resolveKnownProductSlug(toProductSlug(product.slug || product.name));

export const getProductSlug = (product: Pick<Product, 'name'> & Partial<Pick<Product, 'slug'>>): string =>
  normalizeProductSlug(product);

const SMART_SLEEP_MONITOR_PRODUCT: Product = {
  id: SMART_SLEEP_MONITOR_SLUG,
  slug: SMART_SLEEP_MONITOR_SLUG,
  name: 'TheFutureX Smart Sleep Tracking Monitoring System',
  category: 'Smart Monitoring',
  description:
    'TheFutureX Smart Sleep Tracking Monitoring System is designed to help users monitor sleep habits and gain insights into sleep patterns through sleep-tracking technology. It supports sleep awareness, recovery trend review, wireless connectivity, and app-based reports for everyday wellness routines.',
  mrp: 4999,
  salePrice: 2999,
  price: 2999,
  stock: 10,
  reservedStock: 0,
  sold: 0,
  colors: [
    {
      name: 'Black',
      hex: '#111827',
      images: ['/images/aura-vitals-monitor.webp'],
      stock: 10,
      reservedStock: 0,
      sold: 0,
    },
  ],
  inStock: true,
  images: ['/images/aura-vitals-monitor.webp'],
  features: [
    'Sleep monitoring',
    'Sleep pattern analysis',
    'Wellness insights',
    'Compact monitoring design',
    'Wireless connectivity',
    'Long-term sleep tracking',
    'Companion app support',
    'Home monitoring solution',
  ],
  specs: {
    'Product Highlights':
      'Sleep monitoring technology, sleep pattern tracking, wellness insights, wireless connectivity, companion app support, compact design, long-term sleep trend analysis, home monitoring solution',
    'Suitable For': 'Sleep awareness, wellness monitoring, lifestyle tracking, recovery tracking, and daily monitoring',
    'Package Contents': 'Smart sleep monitoring device, charging cable, user manual',
    Tracking: 'Sleep duration, sleep cycle patterns, sleep trends, and historical sleep information',
    Connectivity: 'Wireless connectivity with compatible devices and applications',
    Design: 'Compact monitoring design suitable for bedrooms and personal sleep environments',
    'App Support': 'Connected applications provide detailed sleep reports and trend analysis over time',
  },
  warranty: '1 year warranty',
  rating: 4.8,
  reviewCount: 1,
  reviews: [
    {
      id: 'sleep_monitor_default_review',
      name: 'TheFutureX customer',
      rating: 5,
      date: 'Featured',
      comment: 'Easy to set up and useful for reviewing sleep trends over time.',
      verifiedBuyer: true,
    },
  ],
};

const getKnownProductFallback = (id: string): Product | undefined => {
  const normalized = toProductSlug(id);
  if (normalized === SMART_SLEEP_MONITOR_SLUG) return normalizeProductColors(SMART_SLEEP_MONITOR_PRODUCT);
  return undefined;
};

export const isProductSlugUnique = (products: Product[], slug: string, currentProductId?: string): boolean => {
  const normalizedSlug = toProductSlug(slug);
  if (!normalizedSlug) return false;
  return !products.some((product) => product.id !== currentProductId && getProductSlug(product) === normalizedSlug);
};

const refreshProductsCache = (products?: Product[]) => {
  productsCache = products ? { data: products.map(normalizeProductColors), ts: Date.now() } : null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('products-updated'));
  }
};

const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  analytics: true,
  products: true,
  orders: true,
  inventory: true,
  categories: true,
  support: true,
  admins: false,
  settings: false
};

const DEFAULT_SUPERADMIN_PERMISSIONS: UserPermissions = {
  analytics: true,
  products: true,
  orders: true,
  inventory: true,
  categories: true,
  support: true,
  admins: true,
  settings: true
};

const SUPERADMIN_EMAIL = 'thefuturex.ptc@gmail.com';
const DEFAULT_CATEGORIES = ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring', 'Smart Glasses'];

const normalizeSocialLinks = (raw?: Partial<WebsiteSettings['socialLinks']> | null): NonNullable<WebsiteSettings['socialLinks']> => {
  const entries = Object.entries(DEFAULT_SOCIAL_LINKS).map(([key, defaultValue]) => {
    const rawValue = raw?.[key as keyof NonNullable<WebsiteSettings['socialLinks']>];
    if (typeof rawValue !== 'string') {
      return [key, defaultValue];
    }

    const trimmed = rawValue.trim();
    return [key, trimmed || defaultValue];
  });
  return Object.fromEntries(entries) as NonNullable<WebsiteSettings['socialLinks']>;
};

const normalizeWebsiteSettings = (raw?: Partial<WebsiteSettings> | null): WebsiteSettings => ({
  primaryColor: raw?.primaryColor || '#0ea5e9',
  logoUrl: raw?.logoUrl || '',
  socialLinks: normalizeSocialLinks(raw?.socialLinks),
  footerSections: DEFAULT_FOOTER_SECTIONS,
  pageContent: { ...(raw?.pageContent || {}), ...DEFAULT_PAGE_CONTENT },
});

const applyRoleByEmail = (user: User): User => {
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return {
      ...user,
      email: SUPERADMIN_EMAIL,
      role: 'superadmin',
      permissions: { ...DEFAULT_SUPERADMIN_PERMISSIONS, ...(user.permissions || {}) },
    };
  }
  if (user.role === 'admin') {
    return {
      ...user,
      permissions: { ...DEFAULT_ADMIN_PERMISSIONS, ...(user.permissions || {}) },
    };
  }
  return user;
};

const resolvePreferredUserProfile = (baseUser: User): User => {
  const normalizedBase = applyRoleByEmail(baseUser);
  const normalizedEmail = (normalizedBase.email || '').trim().toLowerCase();
  const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
  const localMatch = localUsers.find(
    (u) => u.id === normalizedBase.id || (u.email || '').trim().toLowerCase() === normalizedEmail
  );

  if (!localMatch) {
    return normalizedBase;
  }

  const normalizedLocal = applyRoleByEmail(localMatch);
  const shouldPreferLocal =
    normalizedLocal.role === 'superadmin' ||
    (normalizedLocal.role === 'admin' && normalizedBase.role !== 'superadmin');

  if (!shouldPreferLocal) {
    return normalizedBase;
  }

  return {
    ...normalizedBase,
    ...normalizedLocal,
    id: normalizedBase.id || normalizedLocal.id,
    email: normalizedBase.email || normalizedLocal.email,
    name: normalizedLocal.name || normalizedBase.name,
    addresses: normalizedBase.addresses || normalizedLocal.addresses || [],
    permissions: { ...(normalizedBase.permissions || {}), ...(normalizedLocal.permissions || {}) },
  };
};

let recaptchaVerifier: RecaptchaVerifier | null = null;
let phoneConfirmationResult: ConfirmationResult | null = null;
let phoneVerificationId: string | null = null;
let recaptchaContainerInUse: string | null = null;
let otpAuthApp: FirebaseApp | null = null;
let otpAuthAppName: string | null = null;
let anonymousAuthAttempted = false;
let anonymousAuthBlocked = false;

const getOtpAuth = () => {
  if (otpAuthApp) {
    return getAuthFromApp(otpAuthApp);
  }
  otpAuthAppName = `otp_auth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  otpAuthApp = initializeApp(mainApp.options, otpAuthAppName);
  return getAuthFromApp(otpAuthApp);
};

const mapFirebaseAuthError = (error: any, fallbackMessage: string): Error => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return new Error('Email already registered');
    case 'auth/invalid-email':
      return new Error('Invalid email address');
    case 'auth/weak-password':
      return new Error('Password is too weak');
    case 'auth/user-not-found':
      return new Error('Account not found. Please sign up first.');
    case 'auth/wrong-password':
      return new Error('Incorrect password.');
    case 'auth/invalid-credential':
      return new Error('Incorrect email or password.');
    case 'auth/operation-not-allowed':
      return new Error('This sign-in method is not enabled in Firebase yet.');
    case 'auth/popup-closed-by-user':
      return new Error('Google login was cancelled.');
    case 'auth/popup-blocked':
      return new Error('Popup was blocked by the browser. Please allow popups and try again.');
    case 'auth/unauthorized-domain':
      return new Error('This domain is not authorized for Google sign-in in Firebase.');
    case 'auth/network-request-failed':
      return new Error('Network error. Please check your internet connection and try again.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please wait a bit and try again.');
    case 'auth/invalid-api-key':
      return new Error('Firebase API key is invalid or missing.');
    default:
      return new Error(fallbackMessage);
  }
};

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const getDefaultReviewRating = (product: Product): number => {
  const price = Number(product.salePrice || product.price || 0);
  if (price >= 3000) return 4.4;
  if (price >= 1500) return 4.2;
  if (price >= 700) return 3.8;
  return 3.4;
};

const getDefaultReviewCount = (product: Product): number => {
  const price = Number(product.salePrice || product.price || 0);
  if (price >= 3000) return 6;
  if (price >= 1500) return 5;
  if (price >= 700) return 4;
  return 3;
};

const getDefaultReviewRatings = (product: Product): number[] => {
  const baseRating = getDefaultReviewRating(product);
  const price = Number(product.salePrice || product.price || 0);
  const offsets = price >= 1500 ? [0, -0.1, 0.1, -0.2, 0, 0.2] : [0, -0.2, 0.1, -0.1];
  return offsets.slice(0, getDefaultReviewCount(product)).map((offset) =>
    Number(clampNumber(baseRating + offset, 3.1, 4.6).toFixed(1))
  );
};

const getDefaultReviewNames = (product: Product): string[] => {
  const category = String(product.category || '').toLowerCase();
  if (category.includes('fan')) return ['Karan M.', 'Priya S.', 'Dev R.', 'Aisha N.', 'Rohit K.', 'Meera P.'];
  if (category.includes('ring')) return ['Arjun K.', 'Ritika S.', 'Nikhil V.', 'Sana P.', 'Kabir A.', 'Isha M.'];
  if (category.includes('band')) return ['Neha P.', 'Aman G.', 'Kriti R.', 'Vivek S.', 'Tanya B.', 'Manav D.'];
  if (category.includes('monitor')) return ['Shalini R.', 'Gaurav M.', 'Pooja K.', 'Harsh V.', 'Anita S.', 'Ramesh P.'];
  return ['Aarav S.', 'Neha K.', 'Rohan M.', 'Ira P.', 'Yash G.', 'Diya R.'];
};

const getDefaultReviewComments = (product: Product): string[] => {
  const category = String(product.category || '').toLowerCase();
  if (category.includes('fan')) {
    return [
      'Cooling feels strong for a bedroom and the bladeless design looks clean.',
      'Airflow is smooth and the noise stays low enough for night use.',
      'The app control is useful for speed changes and timer settings.',
      'Looks premium on the desk and does not take much space.',
      'Good cooling for daily use, especially on medium speed.',
      'Remote and app controls both worked well after setup.',
    ];
  }
  if (category.includes('ring')) {
    return [
      'Comfortable to wear all day and sleep tracking is easy to follow.',
      'Heart rate and wellness data sync properly in the app.',
      'Looks stylish, but checking the ring size before ordering is important.',
      'Charging is simple and the battery lasted well for my routine.',
      'The app gives useful trends without needing a screen on the ring.',
      'Lightweight feel and good finish for the price.',
    ];
  }
  if (category.includes('band')) {
    return [
      'Fitness tracking works well and the app keeps the data easy to check.',
      'Comfortable strap for workouts and daily use.',
 'Good value for basic tracking and notifications.',
      'Battery backup is reliable for regular use.',
      'Steps and workout tracking are useful, though readings can vary a little.',
      'The band feels light and pairs with the phone without much effort.',
    ];
  }
  if (category.includes('monitor')) {
    return [
      'Helpful for checking vitals at home and easy for family members to use.',
      'Readings are clear and syncing works fine after setup.',
      'Good device for regular monitoring, though the manual could be simpler.',
 'Useful for keeping quick checks in one place.',
      'Display is clear and the setup did not take long.',
      'Works well for routine home monitoring.',
    ];
  }
  return [
    'Good quality for the price and works as expected.',
    'Design feels nice and delivery experience was smooth.',
    'Useful product overall with decent performance.',
    'Setup was simple and the product feels reliable.',
    'Build quality is good for daily use.',
    'Happy with the purchase after a few days of use.',
  ];
};

const getProductSeoFamily = (product: Pick<Product, 'name' | 'category'>): 'band' | 'ring' | 'fan' | 'monitoring' | 'glasses' | 'product' => {
  const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
  if (/\b(band|fitness\s*tracker|wristband|smart\s*watch)\b/.test(text)) return 'band';
  if (/\b(ring|smart\s*ring)\b/.test(text)) return 'ring';
  if (/\b(fan|bladeless|tower|air\s*purifier|cooling)\b/.test(text)) return 'fan';
 if (/\b(monitor|vital|bp|blood\s*pressure|\s*monitor)\b/.test(text)) return 'monitoring';
  if (/\b(glass|glasses|eyewear|ai\s*glass)\b/.test(text)) return 'glasses';
  return 'product';
};

const getProductSeoModel = (name: string): string => {
  const cleanName = String(name || '').replace(/\s+/g, ' ').trim();
  return cleanName || 'TheFutureX smart device';
};

const buildSeoProductDescription = (product: Product): string => {
  const model = getProductSeoModel(product.name);
  const family = getProductSeoFamily(product);

  const descriptions: Record<ReturnType<typeof getProductSeoFamily>, string> = {
    band:
 `${model} is a smart fitness band built for everyday tracking, workouts, sleep analysis and connected wellness. It helps you monitor heart rate, SpO2, HRV, stress, activity, calories and daily energy trends through an app-connected wearable design that feels light on the wrist. With waterproof daily-use protection, long battery support, phone sync and practical fitness insights, ${model} is made for users searching for a smart band, fitness tracker, band, activity tracker and wellness wearable in India.`,
    ring:
 `${model} is a compact smart ring designed for tracking, sleep monitoring, heart-rate insights, HRV trends, recovery signals and app-connected wellness data. Its low-profile ring form makes it easy to wear through work, workouts, travel and sleep while still giving useful fitness and lifestyle insights. Built for users looking for a smart ring, sleep tracker ring, fitness ring, recovery tracker and stylish wearable in India, ${model} keeps the focus on comfort, data and everyday convenience.`,
    fan:
      `${model} is a modern bladeless fan for smooth airflow, quiet room cooling, safer everyday comfort, and premium home or office use. Designed for bedrooms, study rooms, living spaces, and work desks, it supports convenient cooling with a clean tower-style look and easy daily operation. If you are looking for a bladeless fan, smart fan, tower fan, quiet cooling fan, air circulation fan, or premium cooling solution in India, ${model} brings comfort, style, and reliable performance together.`,
    monitoring:
 `${model} is a connected monitoring device made for quick wellness checks, vital tracking, family awareness and app-based records. It supports practical monitoring for everyday routines and helps users follow important trends with a simple connected experience. For shoppers searching for a monitor, smart monitoring device, digital vitals monitor, wellness tracker, or home device in India, ${model} offers useful insights in a reliable, easy-to-use format.`,
    glasses:
      `${model} is a smart AI glasses product designed for hands-free connected use, modern style, lightweight daily wear, and intelligent lifestyle utility. Built for users who want smart eyewear, AI glasses, connected glasses, wearable tech, and futuristic accessories in India, ${model} combines practical features with a clean premium look for work, travel, and daily life.`,
    product:
      `${model} is a TheFutureX smart technology product designed for everyday convenience, modern lifestyle use, dependable performance, and connected digital experiences. It is built for shoppers in India looking for reliable smart gadgets, premium electronics, useful accessories, and practical tech products with customer support.`,
  };

  return descriptions[family];
};

const buildSeoProductFeatures = (product: Product): string[] => {
  const model = getProductSeoModel(product.name);
  const lowerName = model.toLowerCase();
  const family = getProductSeoFamily(product);
  const hasDisplay = /\b(display|screen)\b/.test(lowerName);
  const hasAi = /\b(ai|vital)\b/.test(lowerName);

  const featureProfiles: Record<ReturnType<typeof getProductSeoFamily>, string[]> = {
    band: [
 hasAi? 'AI insights': 'Fitness tracking',
      'Heart rate',
      'SpO2 tracking',
      'Sleep analysis',
      'HRV monitor',
      'Stress tracking',
      'Energy tracking',
      'IP68 waterproof',
      'Long battery',
      'App connected',
    ],
    ring: [
      hasDisplay ? 'Built-in display' : 'Smart ring tracking',
      'Sleep insights',
      'Heart rate',
      'HRV trends',
      'Recovery score',
      'Activity tracking',
      'Water resistant',
      'Lightweight fit',
      'App sync',
      'Long battery',
    ],
    fan: [
      'Bladeless airflow',
      'Quiet cooling',
      'Room comfort',
      'Speed control',
      'Remote control',
      'Modern tower design',
      'Safer air output',
      'Low-noise use',
      'Easy cleaning',
      'Home and office',
    ],
    monitoring: [
      'Vital tracking',
 ' reports',
      'App records',
      'Family monitoring',
      'Quick readings',
      'Trend insights',
      'Connected use',
      'Easy setup',
      'Daily wellness',
      'Portable design',
    ],
    glasses: [
      'AI smart eyewear',
      'Hands-free use',
      'Lightweight frame',
      'Connected features',
      'Daily comfort',
      'Modern style',
      'Travel ready',
      'Easy controls',
      'Premium look',
      'Smart utility',
    ],
    product: [
      'Smart design',
      'Daily utility',
      'Connected use',
      'Modern tech',
      'Easy setup',
      'Reliable build',
      'Premium finish',
      'India shipping',
      'Support ready',
      'Value focused',
    ],
  };

  return featureProfiles[family];
};

const toSeedReviewProductId = (product: Product): string =>
  String(product.id || product.name || 'product')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const toSeedReviewDate = (day: number): string => `2026-01-${String(day).padStart(2, '0')}`;

const buildDefaultProductReviews = (product: Product): ProductPublicReview[] => {
  const ratings = getDefaultReviewRatings(product);
  const comments = getDefaultReviewComments(product);
  const names = getDefaultReviewNames(product);
  return comments.slice(0, getDefaultReviewCount(product)).map((comment, index) => ({
    id: `${toSeedReviewProductId(product)}_seed_review_${index + 1}`,
    productId: product.id,
    name: names[index],
    rating: ratings[index],
    date: toSeedReviewDate(11 + index),
    comment,
    images: [],
    verifiedBuyer: true,
  }));
};

const ensureProductReviews = (product: Product): Product => {
  const existingReviews = Array.isArray(product.reviews) ? product.reviews : [];
  const defaultReviews = buildDefaultProductReviews(product);
  const customReviews = existingReviews.filter((review) => !String(review.id || '').includes('_seed_review_'));
  const targetReviewCount = Math.max(getDefaultReviewCount(product), customReviews.length);
  const reviews = [
    ...customReviews,
    ...defaultReviews.filter((review) => !customReviews.some((existing) => existing.id === review.id)),
  ].slice(0, targetReviewCount);
  const rating = Number((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1));

  return {
    ...product,
    reviews,
    reviewCount: reviews.length,
    rating,
  };
};

const stripUnsupportedRingGestureText = (value = ''): string =>
  String(value || '')
    .replace(/\s*(?:&|and)\s*gesture\s+features\b/gi, '')
    .replace(/\bwith\s+gesture\s+features\b/gi, 'with app control')
    .replace(/\bgesture[-\s]*style\s+smart\s+controls\b/gi, 'app-connected wellness features')
    .replace(/\bgesture\s+controls?\b/gi, 'app controls')
    .replace(/\bgesture\s+features\b/gi, 'app-connected features')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

const sanitizeUnsupportedRingGestureClaims = (product: Product): Product => {
  const isRingProduct = /\bring|smart\s*ring/i.test(`${product.name || ''} ${product.category || ''}`);
  if (!isRingProduct) return product;

  return {
    ...product,
    name: stripUnsupportedRingGestureText(product.name),
    description: stripUnsupportedRingGestureText(product.description),
    features: Array.isArray(product.features)
      ? product.features.map(stripUnsupportedRingGestureText)
      : product.features,
    specs: product.specs
      ? Object.fromEntries(
          Object.entries(product.specs).map(([key, value]) => [
            key,
            typeof value === 'string' ? stripUnsupportedRingGestureText(value) : value,
          ])
        )
      : product.specs,
  };
};

export const resolveAuthenticatedUser = async (firebaseUser: FirebaseAuthUser): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const rawUser = userSnap.data() as User;
      const resolvedUser = resolvePreferredUserProfile({
        ...rawUser,
        id: rawUser.id || firebaseUser.uid,
        email: firebaseUser.email || rawUser.email || '',
        name: rawUser.name || firebaseUser.displayName || 'User',
      });

      const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
      const existingIdx = localUsers.findIndex(
        (u) => u.id === resolvedUser.id || (u.email || '').toLowerCase() === (resolvedUser.email || '').toLowerCase()
      );
      if (existingIdx >= 0) {
        localUsers[existingIdx] = { ...localUsers[existingIdx], ...resolvedUser };
      } else {
        localUsers.push(resolvedUser);
      }
      setMockData('users', localUsers);
      return resolvedUser;
    }
  } catch (profileError) {
    if (!isPermissionDeniedError(profileError) && !isTimeoutLikeError(profileError)) {
      throw profileError;
    }
  }

  const fallbackUser = resolvePreferredUserProfile({
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    role: 'user',
    addresses: [],
    permissions: {}
  });

  try {
    await setDoc(userRef, deepSanitize({ ...fallbackUser, createdAt: new Date().toISOString() }), { merge: true });
  } catch (profileWriteError) {
    if (!isPermissionDeniedError(profileWriteError) && !isTimeoutLikeError(profileWriteError)) {
      throw profileWriteError;
    }
  }

  const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
  const existingIdx = localUsers.findIndex(
    (u) => u.id === fallbackUser.id || (u.email || '').toLowerCase() === (fallbackUser.email || '').toLowerCase()
  );
  if (existingIdx >= 0) {
    localUsers[existingIdx] = { ...localUsers[existingIdx], ...fallbackUser };
  } else {
    localUsers.push(fallbackUser);
  }
  setMockData('users', localUsers);

  return fallbackUser;
};

const normalizeProductColors = (product: Product): Product => {
  const slug = normalizeProductSlug(product);
  const displayProduct = sanitizeUnsupportedRingGestureClaims(product);
  const pricedProduct = isTfxV5Band(displayProduct)
    ? {
        ...displayProduct,
        mrp: Math.max(Number(displayProduct.mrp || 0), TFX5_AI_BAND_PRICE + 2000),
        salePrice: TFX5_AI_BAND_PRICE,
        price: TFX5_AI_BAND_PRICE,
      }
    : displayProduct;
  const rawColors = Array.isArray(product.colors) ? product.colors : [];
  const existingColorMap = new Map<string, ProductColor>(
    rawColors
      .map((c: any) => {
        if (typeof c === 'string') return null;
        const normalizedName = String(c?.name || '').trim().toLowerCase();
        if (!normalizedName) return null;
        return [
          normalizedName,
          {
            name: String(c?.name || 'Default'),
            hex: String(c?.hex || '#6b7280'),
            images: Array.isArray(c?.images) && c.images.length > 0 ? c.images : [...(product.images || [])],
            stock: Number(c?.stock ?? 0),
            reservedStock: Number(c?.reservedStock || 0),
            sold: Number(c?.sold || 0),
          } as ProductColor,
        ] as const;
      })
      .filter(Boolean) as Array<readonly [string, ProductColor]>
  );

  const rawVariants = Array.isArray(product.variants) ? product.variants : [];
  const mappedFromVariants: NonNullable<Product['variants']> = rawVariants
    .map((variant: any) => {
      const colorName = String(variant?.colorName || variant?.color || '').trim();
      if (!colorName) return null;

      const rawSizes = Array.isArray(variant?.sizes) ? variant.sizes : [];
      const normalizedSizes = rawSizes
        .map((sizeEntry: any) => {
          if (typeof sizeEntry === 'string') {
            return { size: sizeEntry.trim(), stock: Number(variant?.stock || 0) };
          }
          return {
            size: String(sizeEntry?.size || '').trim(),
            stock: Number(sizeEntry?.stock || 0),
          };
        })
        .filter((entry: { size: string; stock: number }) => entry.size !== '');

      const fallbackStock = Number(variant?.stock || 0);
      const sizes =
        normalizedSizes.length > 0
          ? normalizedSizes
          : [{ size: String(variant?.size || 'Standard').trim() || 'Standard', stock: fallbackStock }];

      return {
        colorName,
        colorHex: String(variant?.colorHex || variant?.hex || '#6b7280'),
        price: Number(isTfxV5Band(pricedProduct) ? TFX5_AI_BAND_PRICE : variant?.price ?? pricedProduct.salePrice ?? pricedProduct.price ?? 0),
        images: Array.isArray(variant?.images) && variant.images.length > 0 ? variant.images : [...(product.images || [])],
        sizes,
        videoUrl: String(variant?.videoUrl || ''),
      };
    })
    .filter(Boolean) as NonNullable<Product['variants']>;

  const mappedVariants: NonNullable<Product['variants']> =
    mappedFromVariants.length > 0
      ? mappedFromVariants
      : rawColors
          .map((color: any) => {
            const colorName = String(typeof color === 'string' ? color : color?.name || '').trim();
            if (!colorName) return null;
            const colorVideoUrl =
              product.videoByColor?.[colorName] ||
              Object.entries(product.videoByColor || {}).find(([key]) => key.trim().toLowerCase() === colorName.toLowerCase())?.[1] ||
              '';
            const stock = Number(typeof color === 'string' ? product.stock || 0 : color?.stock ?? product.stock ?? 0);
            return {
              colorName,
              colorHex: String(typeof color === 'string' ? '#6b7280' : color?.hex || '#6b7280'),
              price: Number(isTfxV5Band(pricedProduct) ? TFX5_AI_BAND_PRICE : pricedProduct.salePrice || pricedProduct.price || 0),
              images:
                typeof color === 'string'
                  ? [...(product.images || [])]
                  : Array.isArray(color?.images) && color.images.length > 0
                  ? color.images
                  : [...(product.images || [])],
              sizes: [{ size: 'Standard', stock }],
              videoUrl: String(colorVideoUrl || ''),
            };
          })
          .filter(Boolean) as NonNullable<Product['variants']>;

  const mappedColors: ProductColor[] = mappedVariants.map((variant) => {
    const normalizedName = String(variant.colorName || '').trim().toLowerCase();
    const existing = existingColorMap.get(normalizedName);
    const computedStock = (variant.sizes || []).reduce((sum, entry) => sum + Number(entry.stock || 0), 0);
    return {
      name: variant.colorName,
      hex: variant.colorHex || '#6b7280',
      images: variant.images?.length ? variant.images : [...(product.images || [])],
      stock: computedStock,
      reservedStock: Number(existing?.reservedStock || 0),
      sold: Number(existing?.sold || 0),
    };
  });

  const mappedVariations = mappedVariants.flatMap((variant, variantIdx) =>
    (variant.sizes || []).map((sizeEntry, sizeIdx) => ({
      id: `v_${variantIdx}_${sizeIdx}`,
      size: sizeEntry.size,
      weight: product.weight || '',
      color: variant.colorName,
      price: Number(isTfxV5Band(pricedProduct) ? TFX5_AI_BAND_PRICE : variant.price || pricedProduct.salePrice || pricedProduct.price || 0),
      stock: Number(sizeEntry.stock || 0),
    }))
  );

  const aggregateStock =
    mappedColors.length > 0
      ? mappedColors.reduce((sum, c) => sum + Number(c.stock || 0), 0)
      : Number(product.stock || 0);
  const aggregateReserved =
    mappedColors.length > 0
      ? mappedColors.reduce((sum, c) => sum + Number(c.reservedStock || 0), 0)
      : Number(product.reservedStock || 0);
  const aggregateSold =
    mappedColors.length > 0
      ? mappedColors.reduce((sum, c) => sum + Number(c.sold || 0), 0)
      : Number(product.sold || 0);
  const defaultVariant =
    mappedVariants.find((variant) => variant.colorName === product.defaultVariant)?.colorName ||
    mappedVariants[0]?.colorName ||
    '';
  const videoByColor = mappedVariants.reduce<Record<string, string>>((acc, variant) => {
    if (variant.videoUrl) acc[variant.colorName] = variant.videoUrl;
    return acc;
  }, { ...(product.videoByColor || {}) });

  return ensureProductReviews({
    ...pricedProduct,
    slug,
    description: buildSeoProductDescription(pricedProduct),
    features: buildSeoProductFeatures(pricedProduct),
    variants: mappedVariants,
    defaultVariant,
    colors: mappedColors,
    videoByColor,
    variations: mappedVariations,
    stock: aggregateStock,
    reservedStock: aggregateReserved,
    sold: aggregateSold,
    inStock: aggregateStock - aggregateReserved > 0,
  });
};

const upsertSuperAdmin = (users: User[]): User[] => {
  const hasSuperAdmin = users.some(
    (u) => u.role === 'superadmin' || (u.email || '').trim().toLowerCase() === SUPERADMIN_EMAIL
  );
  if (hasSuperAdmin) {
    return users.map((u) => applyRoleByEmail(u));
  }

  const superAdmin: User = {
    id: 'superadmin_1',
    name: 'Super Admin',
    email: SUPERADMIN_EMAIL,
    role: 'superadmin',
    phone: '9999999999',
    addresses: [],
    permissions: { ...DEFAULT_SUPERADMIN_PERMISSIONS }
  };

  return [superAdmin, ...users];
};

// --- Helper: Ensure Firebase Connection (Fix for Normal Users) ---
// If a user is "Local" (failed auth) or Admin, they might not have a Firebase Session.
// We force an anonymous sign-in so they can still read/write to Firestore if rules allow.
const ensureFirebaseConnection = async () => {
  if (auth.currentUser || anonymousAuthBlocked || anonymousAuthAttempted) return;
  anonymousAuthAttempted = true;
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 3000));
    await Promise.race([signInAnonymously(auth), timeout]);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code || '';
    const message = e instanceof Error ? e.message : String(e || '');
    const lowered = `${code} ${message}`.toLowerCase();
    if (lowered.includes('admin-restricted-operation')) {
      // Anonymous sign-in is disabled in Firebase; avoid retry spam.
      anonymousAuthBlocked = true;
      return;
    }
    logDevWarning('Anonymous auth failed or timed out (Database might be unreachable):', e);
  }
};

export const addAuditLog = async (entry: {
  action: string;
  actor: string;
  details?: string;
}): Promise<void> => {
  const nextEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action: entry.action,
    actor: entry.actor,
    details: entry.details,
    timestamp: new Date().toISOString(),
  };
  const localLogs = getMockData<Array<{
    id: string;
    action: string;
    actor: string;
    details?: string;
    timestamp: string;
  }>>('admin_audit_logs', []);
  setMockData('admin_audit_logs', [nextEntry, ...localLogs].slice(0, 30));

  try {
    await addDoc(collection(db, 'admin_audit_logs'), {
      action: nextEntry.action,
      actor: nextEntry.actor,
      details: nextEntry.details,
      timestamp: nextEntry.timestamp,
    });
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      logDevWarning('Failed to write admin audit log to Firebase:', error);
    }
  }
};

export const getAuditLogs = async (): Promise<Array<{
  id: string;
  action: string;
  actor: string;
  details?: string;
  timestamp: string;
}>> => {
  const localLogs = getMockData<Array<{
    id: string;
    action: string;
    actor: string;
    details?: string;
    timestamp: string;
  }>>('admin_audit_logs', []);

  try {
    const q = query(
      collection(db, 'admin_audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const remoteLogs = snapshot.docs.map((auditDoc) => {
      const data = auditDoc.data() as {
        action?: string;
        actor?: string;
        details?: string;
        timestamp?: string;
      };
      return {
        id: auditDoc.id,
        action: data.action || '',
        actor: data.actor || 'Unknown',
        details: data.details,
        timestamp: data.timestamp || new Date(0).toISOString(),
      };
    });
    setMockData('admin_audit_logs', remoteLogs);
    return remoteLogs;
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      logDevWarning('Failed to read admin audit logs from Firebase:', error);
    }
    return [...localLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// --- Helper: Seed Database ---
export const seedDatabase = async () => {
    
    // Ensure we have products in local storage
    const currentProducts = getMockData<Product[]>('products', []);
    if (currentProducts.length === 0) {
        setMockData('products', INITIAL_PRODUCTS.map(normalizeProductColors));
    }
    setMockData('categories', DEFAULT_CATEGORIES);
    const seededUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
    setMockData('users', seededUsers);
    
    try {
        await ensureFirebaseConnection();
        const productsColl = collection(db, 'products');
        const snapshot = await getDocs(productsColl);
        if (snapshot.empty) {
            for (const p of INITIAL_PRODUCTS.map(normalizeProductColors)) {
                const cleanP = deepSanitize(p);
                await setDoc(doc(db, 'products', p.id), cleanP);
            }
        }
    } catch (e) {
        logDevWarning("Seed failed (likely permission or offline):", e);
    }
};

// --- Storage Service ---

export const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
        // Video uploads can take longer on a normal mobile/office connection.
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Upload timed out after 2 minutes")), 120000)
        );

        // Try Firebase Storage
        const storageRef = ref(storage, path);
        // Use Promise.race to prevent hanging if Firebase config is invalid
        const snapshot = await Promise.race([
            uploadBytes(storageRef, file),
            timeout
        ]) as any;
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 🔒 ADDED: Prevent invalid URLs from being returned
        if (!isValidProductionUrl(downloadURL)) {
            throw new Error("Invalid storage URL generated");
        }

        return downloadURL;
    } catch (error) {
        logDevError("Firebase Storage Upload Failed or Timed Out:", error);
        const code = (error as { code?: string })?.code || '';
        const message = error instanceof Error ? error.message : 'Unknown Firebase Storage error';
        throw new Error(`Cloud upload failed (${code || message}). Confirm Firebase Storage is enabled, deploy storage.rules, and sign in with an admin account.`);
    }
};

// --- Products Service ---

const isSmartGlassesProduct = (product: Pick<Product, 'name' | 'category'>) =>
  product.category?.trim().toLowerCase() === 'smart glasses' ||
  /\b(?:ai\s*)?smart\s*glasses?\b/i.test(`${product.name || ''} ${product.category || ''}`);

export const getProducts = async (): Promise<Product[]> => {
  const now = Date.now();
  if (productsCache && now - productsCache.ts < PRODUCTS_CACHE_TTL_MS) {
    return [...productsCache.data];
  }

  if (productsInFlight) {
    return productsInFlight.then((data) => [...data]);
  }

  productsInFlight = (async () => {
    try {
      await ensureFirebaseConnection();
      const querySnapshot = await withTimeout(getDocs(collection(db, 'products')), 6000);
      const fbProducts: Product[] = [];
      querySnapshot.forEach((snapshotDoc) => {
        fbProducts.push({ ...(snapshotDoc.data() as Product), id: snapshotDoc.id });
      });
      const normalized = fbProducts.map(normalizeProductColors).filter((product) => !isSmartGlassesProduct(product));
      setMockData('products', normalized);
      productsCache = { data: normalized, ts: Date.now() };
      return normalized;
    } catch (error) {
      if (isAbortLikeError(error) || isPermissionDeniedError(error)) {
        const localProducts = getMockData<Product[]>('products', INITIAL_PRODUCTS)
          .map(normalizeProductColors)
          .filter((product) => !isSmartGlassesProduct(product));
        productsCache = { data: localProducts, ts: Date.now() };
        return localProducts;
      }
      throw error;
    } finally {
      productsInFlight = null;
    }
  })();

  return productsInFlight.then((data) => [...data]);
};

// ─── Slug utility ─────────────────────────────────────────────────────────────
export const getProductById = async (id: string): Promise<Product | undefined> => {
  if (/\b(?:ai-?)?smart-?glasses?\b/i.test(id)) return undefined;
  const knownFallback = getKnownProductFallback(id);
  try {
      const allProducts = await getProducts();
      const remoteFound =
        allProducts.find((p) => p.id === id) ||
        allProducts.find((p) => getProductSlug(p) === id) ||
        allProducts.find((p) => toProductSlug(p.name) === id);
      if (remoteFound) return remoteFound;
  } catch (e) { }

  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);

  try {
      const docRef = doc(db, 'products', id);
      const docSnap = await withTimeout(getDoc(docRef), 4500);
      if (docSnap.exists()) {
        const remoteProduct = normalizeProductColors({ ...(docSnap.data() as Product), id: docSnap.id });
        if (isSmartGlassesProduct(remoteProduct)) return undefined;
        const nextProducts = [remoteProduct, ...products.filter((p) => p.id !== id)];
        setMockData('products', nextProducts);
        refreshProductsCache(nextProducts);
        return remoteProduct;
      }
  } catch (e) { }

  // Support both raw ID (legacy) and slug (new pretty URL)
  const localFound =
    products.find((p) => p.id === id) ||
    products.find((p) => getProductSlug(p) === id) ||
    products.find((p) => toProductSlug(p.name) === id);
  return localFound && !isSmartGlassesProduct(localFound) ? normalizeProductColors(localFound) : knownFallback;
};

export const getProductReviews = async (productId: string): Promise<ProductPublicReview[]> => {
  const localReviews = getMockData<ProductPublicReview[]>(`product_reviews_${productId}`, []);
  let remoteReviews: ProductPublicReview[] = [];

  try {
    await ensureFirebaseConnection();
    const q = query(collection(db, 'product_reviews'), where('productId', '==', productId));
    const snapshot = await withTimeout(getDocs(q), 4500);
    snapshot.forEach((reviewDoc) => {
      remoteReviews.push({ ...(reviewDoc.data() as ProductPublicReview), id: reviewDoc.id });
    });
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
      logDevWarning('Failed to fetch product reviews:', error);
    }
  }

  const combined = [...remoteReviews];
  localReviews.forEach((localReview) => {
    if (!combined.some((review) => review.id === localReview.id)) {
      combined.push(localReview);
    }
  });

  return combined.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
};

export const addProductReview = async (productId: string, review: ProductPublicReview): Promise<ProductPublicReview> => {
  const reviewId = review.id || `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const cleanReview = deepSanitize({
    ...review,
    id: reviewId,
    productId,
    images: (review.images || []).slice(0, 2),
    rating: Math.max(1, Math.min(5, Number(review.rating || 0))),
  }) as ProductPublicReview;

  const localReviews = getMockData<ProductPublicReview[]>(`product_reviews_${productId}`, []);
  setMockData(`product_reviews_${productId}`, [cleanReview, ...localReviews.filter((item) => item.id !== reviewId)]);

  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const productIndex = products.findIndex((product) => product.id === productId);
  if (productIndex >= 0) {
    const existingReviews = products[productIndex].reviews || [];
    const nextReviews = [cleanReview, ...existingReviews.filter((item) => item.id !== reviewId)];
    products[productIndex] = normalizeProductColors({
      ...products[productIndex],
      reviews: nextReviews,
      reviewCount: nextReviews.length,
      rating: Number((nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviews.length).toFixed(1)),
    });
    setMockData('products', products);
    refreshProductsCache(products);
  }

  try {
    await ensureFirebaseConnection();
    await setDoc(doc(db, 'product_reviews', reviewId), cleanReview, { merge: true });
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
      logDevWarning('Failed to sync product review:', error);
    }
  }

  return cleanReview;
};

export const deleteProductReview = async (productId: string, reviewId: string): Promise<void> => {
  const localReviews = getMockData<ProductPublicReview[]>(`product_reviews_${productId}`, []);
  setMockData(`product_reviews_${productId}`, localReviews.filter((review) => review.id !== reviewId));

  try {
    await ensureFirebaseConnection();
    await deleteDoc(doc(db, 'product_reviews', reviewId));
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
      logDevWarning('Failed to delete product review:', error);
    }
  }
};

const normalizeNotifyContactType = (contact: string): ProductNotifyRequest['contactType'] =>
  contact.includes('@') ? 'email' : 'phone';

export const addProductNotifyRequest = async (
  request: Omit<ProductNotifyRequest, 'id' | 'contactType' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<ProductNotifyRequest> => {
  const contact = request.contact.trim();
  if (!contact) {
    throw new Error('Please enter your email or phone number.');
  }

  const notifyRequest: ProductNotifyRequest = {
    ...request,
    id: request.id || `notify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    contact,
    contactType: normalizeNotifyContactType(contact),
    createdAt: request.createdAt || new Date().toISOString(),
  };

  const localRequests = getMockData<ProductNotifyRequest[]>('product_notify_requests', []);
  const nextLocal = [
    notifyRequest,
    ...localRequests.filter(
      (item) => !(item.productId === notifyRequest.productId && item.contact.toLowerCase() === notifyRequest.contact.toLowerCase())
    ),
  ];
  setMockData('product_notify_requests', nextLocal);

  try {
    await ensureFirebaseConnection();
    await setDoc(doc(db, 'product_notify_requests', notifyRequest.id), deepSanitize(notifyRequest), { merge: true });
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error) && !isTimeoutLikeError(error)) {
      logDevWarning('Failed to sync notify request:', error);
    }
  }

  return notifyRequest;
};

export const getProductNotifyRequests = async (): Promise<ProductNotifyRequest[]> => {
  const localRequests = getMockData<ProductNotifyRequest[]>('product_notify_requests', []);

  try {
    await ensureFirebaseConnection();
    const snapshot = await withTimeout(
      getDocs(query(collection(db, 'product_notify_requests'), orderBy('createdAt', 'desc'))),
      4500
    );
    const remoteRequests = snapshot.docs.map((notifyDoc) => ({
      ...(notifyDoc.data() as ProductNotifyRequest),
      id: notifyDoc.id,
    }));
    setMockData('product_notify_requests', remoteRequests);
    return remoteRequests;
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error) && !isTimeoutLikeError(error)) {
      logDevWarning('Failed to fetch notify requests:', error);
    }
    return [...localRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

const getLocalSiteAnalyticsEvents = (): SiteAnalyticsEvent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('tfx_site_analytics_events');
    return raw ? (JSON.parse(raw) as SiteAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
};

export const addOfferLead = async (
  lead: Omit<OfferLead, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<OfferLead> => {
  const phone = lead.phone.trim();
  if (!phone) {
    throw new Error('Please enter a valid phone number.');
  }

  const offerLead: OfferLead = {
    ...lead,
    id: lead.id || `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    phone,
    couponCodes: lead.couponCodes.length > 0 ? lead.couponCodes : ['NEW10', 'NEW5'],
    createdAt: lead.createdAt || new Date().toISOString(),
  };

  const localLeads = getMockData<OfferLead[]>('offer_leads', []);
  const nextLocal = [
    offerLead,
    ...localLeads.filter(
      (item) => !(item.phone === offerLead.phone && item.source === offerLead.source && (item.productId || '') === (offerLead.productId || ''))
    ),
  ];
  setMockData('offer_leads', nextLocal);

  try {
    await ensureFirebaseConnection();
    await setDoc(doc(db, 'offer_leads', offerLead.id), deepSanitize(offerLead), { merge: true });
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error) && !isTimeoutLikeError(error)) {
      logDevWarning('Failed to sync offer lead:', error);
    }
  }

  return offerLead;
};

export const getOfferLeads = async (): Promise<OfferLead[]> => {
  const localLeads = getMockData<OfferLead[]>('offer_leads', []);

  try {
    await ensureFirebaseConnection();
    const snapshot = await withTimeout(
      getDocs(query(collection(db, 'offer_leads'), orderBy('createdAt', 'desc'))),
      4500
    );
    const remoteLeads = snapshot.docs.map((leadDoc) => ({
      ...(leadDoc.data() as OfferLead),
      id: leadDoc.id,
    }));
    setMockData('offer_leads', remoteLeads);
    return remoteLeads;
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error) && !isTimeoutLikeError(error)) {
      logDevWarning('Failed to fetch offer leads:', error);
    }
    return [...localLeads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

export const addProduct = async (product: Product): Promise<void> => {
  const cleanProduct = deepSanitize(normalizeProductColors(product));
  const cloudProduct = deepSanitize(sanitizeProductImagesForCloud(cleanProduct));
  
  // Local - SAVE HERE FIRST (Source of truth for immediate UI update)
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  // Ensure ID
  const newId = cleanProduct.id || `p_${Date.now()}`;
  cleanProduct.id = newId;

  if (!isProductSlugUnique(products.map(normalizeProductColors), cleanProduct.slug, newId)) {
    throw new Error(`The URL slug "${cleanProduct.slug}" is already used by another product.`);
  }
  
  products.push(cleanProduct);
  setMockData('products', products);
  refreshProductsCache(products);

  // Firebase
  try {
      await ensureFirebaseConnection();
      if (newId) {

   // 🔒 ADDED: Prevent corrupted image URLs from reaching Firestore
   if ((cleanProduct as any).imageUrl && !isValidProductionUrl((cleanProduct as any).imageUrl)) {
       logDevWarning("Blocked invalid image URL from Firestore save.");
       delete (cleanProduct as any).imageUrl;
   }

    await withTimeout(setDoc(doc(db, 'products', newId), cloudProduct, { merge: true }), 4500);
} else {

   if ((cleanProduct as any).imageUrl && !isValidProductionUrl((cleanProduct as any).imageUrl)) {
       logDevWarning("Blocked invalid image URL from Firestore save.");
       delete (cleanProduct as any).imageUrl;
   }

   await withTimeout(addDoc(collection(db, 'products'), cloudProduct), 4500);
}
  } catch (e: any) { 
      logDevWarning("Firebase save failed:", e);
      if (e.code === 'resource-exhausted' || e.message?.includes('exceeds the maximum allowed size')) {
          alert("Database Error: Product data size is too large (likely due to offline images/videos). Product saved locally only.");
      }
  }
};

export const updateProduct = async (product: Product): Promise<void> => {
  const cleanProduct = deepSanitize(normalizeProductColors(product));
  const cloudProduct = deepSanitize(sanitizeProductImagesForCloud(cleanProduct));
  
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const idx = products.findIndex(p => p.id === cleanProduct.id);
  if (!isProductSlugUnique(products.map(normalizeProductColors), cleanProduct.slug, cleanProduct.id)) {
    throw new Error(`The URL slug "${cleanProduct.slug}" is already used by another product.`);
  }
  if (idx !== -1) {
      products[idx] = cleanProduct;
      setMockData('products', products);
      refreshProductsCache(products);
  }

  // Firebase
  try {
      await ensureFirebaseConnection();
      const docRef = doc(db, 'products', cleanProduct.id);
     // 🔒 ADDED: Prevent corrupted image URLs from Firestore update
if ((cleanProduct as any).imageUrl && !isValidProductionUrl((cleanProduct as any).imageUrl)) {
    logDevWarning("Blocked invalid image URL from Firestore update.");
    delete (cleanProduct as any).imageUrl;
}
 
await withTimeout(setDoc(docRef, { ...cloudProduct }, { merge: true }), 4500);
  } catch (e: any) {
      logDevWarning("Firebase update failed:", e);
      if (e.code === 'resource-exhausted' || e.message?.includes('exceeds the maximum allowed size')) {
           alert("Database Error: Product data size is too large. Product updated locally only.");
      }
      if (isPermissionDeniedError(e)) {
        throw new Error('Saved locally, but backend sync failed. Log in again with an admin account and retry.');
      }
      if (isAbortLikeError(e) || isTimeoutLikeError(e)) {
        logDevWarning('Product updated locally; backend sync is still slow or timed out:', e);
        return;
      }
      throw e instanceof Error ? e : new Error('Product updated locally, but backend sync failed.');
  }
};

export const updateProductContentFields = async (
  productId: string,
  fields: Pick<Product, 'features' | 'specs'> & Partial<Pick<Product, 'description'>>
): Promise<void> => {
  const cleanFields = deepSanitize({
    features: Array.isArray(fields.features) ? fields.features : [],
    specs: fields.specs && typeof fields.specs === 'object' ? fields.specs : {},
    ...(fields.description !== undefined ? { description: fields.description } : {}),
  }) as Partial<Product>;

  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const idx = products.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    products[idx] = normalizeProductColors({ ...products[idx], ...cleanFields } as Product);
    setMockData('products', products);
    refreshProductsCache(products);
  }

  try {
    await ensureFirebaseConnection();
    const productRef = doc(db, 'products', productId);
    const productSnap = await withTimeout(getDoc(productRef), 8000);
    if (productSnap.exists()) {
      await withTimeout(updateDoc(productRef, cleanFields), 8000);
    } else {
      await withTimeout(setDoc(productRef, cleanFields, { merge: true }), 8000);
    }
  } catch (e: any) {
    logDevWarning('Product content fields sync failed:', e);
    if (isPermissionDeniedError(e)) {
      throw new Error('Specifications/key features were saved locally, but Firebase rejected the update. Deploy the Firestore rules and log in again as admin.');
    }
    if (isAbortLikeError(e) || isTimeoutLikeError(e)) {
      throw new Error('Specifications/key features were saved locally, but cloud sync timed out. Please retry once.');
    }
    throw e instanceof Error ? e : new Error('Specifications/key features cloud sync failed.');
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  setMockData('products', products.filter(p => p.id !== id));
  refreshProductsCache();

  // Firebase
  try {
      await ensureFirebaseConnection();
      await deleteDoc(doc(db, 'products', id));
  } catch (e) { }
};

// --- Category Service ---
export const getCategories = async (): Promise<string[]> => {
  const withDefaultCategories = (categories: string[]) => {
    const merged = [...categories];
    DEFAULT_CATEGORIES.forEach((defaultCategory) => {
      if (!merged.some((category) => category.trim().toLowerCase() === defaultCategory.toLowerCase())) {
        merged.push(defaultCategory);
      }
    });
    return merged;
  };
  const localCats = withDefaultCategories(getMockData<string[]>('categories', DEFAULT_CATEGORIES));
  try {
    await ensureFirebaseConnection();
    const querySnapshot = await withTimeout(getDocs(collection(db, 'categories')), 1200);
    const cats: string[] = [];
    querySnapshot.forEach((categoryDoc) => cats.push(categoryDoc.data().name));
    if (cats.length > 0) {
      const mergedCats = withDefaultCategories(cats);
      setMockData('categories', mergedCats);
      return mergedCats;
    }
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
      logDevWarning('Failed to fetch categories from Firebase:', error);
    }
  }
  return localCats;
};

export const addCategory = async (category: string): Promise<void> => {
  const normalizedCategory = category.trim();
  if (!normalizedCategory) {
    throw new Error('Category name is required');
  }

  const previousCats = getMockData<string[]>('categories', []);
  const existsLocally = previousCats.some((cat) => cat.trim().toLowerCase() === normalizedCategory.toLowerCase());
  const nextCats = existsLocally ? previousCats : [...previousCats, normalizedCategory];
  setMockData('categories', nextCats);

  try {
    await ensureFirebaseConnection();

    const catCol = collection(db, 'categories');
    const snapshot = await getDocs(catCol);

    if (snapshot.empty) {
      for (const def of DEFAULT_CATEGORIES) {
        if (def.trim().toLowerCase() !== normalizedCategory.toLowerCase()) {
          await addDoc(catCol, { name: def });
        }
      }
    }

    let existsRemotely = false;
    snapshot.forEach((categoryDoc) => {
      const remoteName = String(categoryDoc.data().name || '').trim().toLowerCase();
      if (remoteName === normalizedCategory.toLowerCase()) existsRemotely = true;
    });

    if (!existsRemotely) {
      await addDoc(catCol, { name: normalizedCategory });
    }
  } catch (error) {
    setMockData('categories', previousCats);
    if (isPermissionDeniedError(error)) {
      throw new Error('Missing backend permission to add category. Log in again with an admin account and retry.');
    }
    if (isAbortLikeError(error)) {
      throw new Error('Category sync timed out. Please retry.');
    }
    throw error instanceof Error ? error : new Error('Failed to add category');
  }
};

export const deleteCategory = async (category: string): Promise<void> => {
  const normalizedCategory = category.trim();
  if (!normalizedCategory) {
    throw new Error('Category name is required');
  }

  const previousCats = getMockData<string[]>('categories', []);
  setMockData(
    'categories',
    previousCats.filter((cat) => cat.trim().toLowerCase() !== normalizedCategory.toLowerCase())
  );

  try {
    await ensureFirebaseConnection();
    const q = query(collection(db, 'categories'), where('name', '==', normalizedCategory));
    const querySnapshot = await getDocs(q);
    await Promise.all(querySnapshot.docs.map((categoryDoc) => deleteDoc(doc(db, 'categories', categoryDoc.id))));
  } catch (error) {
    setMockData('categories', previousCats);
    if (isPermissionDeniedError(error)) {
      throw new Error('Missing backend permission to delete category. Log in again with an admin account and retry.');
    }
    if (isAbortLikeError(error)) {
      throw new Error('Category delete timed out. Please retry.');
    }
    throw error instanceof Error ? error : new Error('Failed to delete category');
  }
};

// --- Auth Service ---

export const registerUser = async (email: string, password: string, phone: string, name?: string): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizeIndianPhone(phone);
    const nationalPhone = getIndianNationalPhone(phone);
    const users = upsertSuperAdmin(getMockData<User[]>('users', []));
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error('Email already registered');
    }
    const duplicateLocalPhone = users.some((u) => {
      if (!u.phone) return false;
      try {
        return normalizeIndianPhone(u.phone) === normalizedPhone || getIndianNationalPhone(u.phone) === nationalPhone;
      } catch {
        return false;
      }
    });
    if (duplicateLocalPhone) {
      throw new Error('Phone number already registered');
    }

    try {
      const qPhone = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
      const phoneSnap = await getDocs(qPhone);
      if (!phoneSnap.empty) throw new Error('Phone number already registered');

      const qLegacyPhone = query(collection(db, 'users'), where('phone', '==', nationalPhone));
      const legacyPhoneSnap = await getDocs(qLegacyPhone);
      if (!legacyPhoneSnap.empty) throw new Error('Phone number already registered');
    } catch (error) {
      if (error instanceof Error && error.message === 'Phone number already registered') {
        throw error;
      }
      // If Firestore read fails due network/permissions, continue with local checks.
    }

    const newUser: User & { createdAt?: string } = {
      id: `user_${Date.now()}`,
      name: (name && name.trim()) ? name.trim() : (normalizedEmail.split('@')[0] || 'User'),
      email: normalizedEmail,
      phone: normalizedPhone,
      role: 'user',
      addresses: [],
      permissions: {},
      createdAt: new Date().toISOString(),
    };
    const cleanUser = deepSanitize(newUser);

    // Firebase auth + profile bootstrap. If profile doc write fails because of
    // permissions/network, keep the authenticated account usable and fall back
    // to local cache for app session continuity.
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) {
        throw new Error('Unable to create account right now.');
      }
      cleanUser.id = firebaseUser.uid; // Update ID to match Firebase
      const registeredAt = new Date().toISOString();
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), deepSanitize({
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          name: cleanUser.name,
          email: normalizedEmail,
          phone: normalizedPhone,
          role: 'user',
          addresses: [],
          permissions: {},
          createdAt: registeredAt,
          offersSubscribed: true
        }));
      } catch (profileError) {
        if (!isPermissionDeniedError(profileError) && !isTimeoutLikeError(profileError)) {
          throw profileError;
        }
      }
      cleanUser.createdAt = registeredAt;
    } catch (e: any) {
      throw mapFirebaseAuthError(e, 'Registration failed. Please try again.');
    }

    // Local cache/store persistence
    users.push(cleanUser);
    setMockData('users', users);
    
    return cleanUser;
};

export const isPhoneRegistered = async (phone: string): Promise<boolean> => {
  const normalizedPhone = normalizeIndianPhone(phone);
  const nationalPhone = getIndianNationalPhone(phone);

  const users = upsertSuperAdmin(getMockData<User[]>('users', []));
  const existsLocal = users.some((u) => {
    if (!u.phone) return false;
    try {
      return normalizeIndianPhone(u.phone) === normalizedPhone || getIndianNationalPhone(u.phone) === nationalPhone;
    } catch {
      return false;
    }
  });
  if (existsLocal) return true;

  try {
    const qPhone = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const phoneSnap = await getDocs(qPhone);
    if (!phoneSnap.empty) return true;

    const qLegacyPhone = query(collection(db, 'users'), where('phone', '==', nationalPhone));
    const legacyPhoneSnap = await getDocs(qLegacyPhone);
    if (!legacyPhoneSnap.empty) return true;
  } catch {
    // Ignore remote read failures and rely on local fallback.
  }

  return false;
};

export const loginUser = async (email: string, password: string, phone?: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? normalizeIndianPhone(phone) : undefined;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const firebaseUser = userCredential.user;
    if (!firebaseUser) throw new Error('Login failed.');

    const docRef = doc(db, 'users', firebaseUser.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const rawRemoteUser = docSnap.data() as User;
        const remoteUser = resolvePreferredUserProfile({
          ...rawRemoteUser,
          id: rawRemoteUser.id || firebaseUser.uid,
          email: firebaseUser.email || rawRemoteUser.email || normalizedEmail,
        });
        const remotePhone = remoteUser.phone ? normalizeIndianPhone(remoteUser.phone) : undefined;
        if (normalizedPhone && remotePhone && remotePhone !== normalizedPhone) {
          throw new Error('Phone number does not match this account');
        }
        const permissionsChanged =
          JSON.stringify(rawRemoteUser.permissions || {}) !== JSON.stringify(remoteUser.permissions || {});
        const identityChanged =
          (rawRemoteUser.id || firebaseUser.uid) !== remoteUser.id ||
          (rawRemoteUser.email || '') !== (remoteUser.email || '') ||
          (rawRemoteUser.name || '') !== (remoteUser.name || '');
        if (rawRemoteUser.role !== remoteUser.role || permissionsChanged || identityChanged) {
          try {
            await setDoc(
              docRef,
              deepSanitize({
                id: remoteUser.id,
                email: remoteUser.email,
                name: remoteUser.name,
                role: remoteUser.role,
                permissions: remoteUser.permissions || {},
              }),
              { merge: true }
            );
          } catch {
            // If role sync fails, continue with in-app role to avoid blocking login.
          }
        }
        const localUsers1 = upsertSuperAdmin(getMockData<User[]>('users', []));
        const idx1 = localUsers1.findIndex(u => u.id === remoteUser.id || (u.email || '').toLowerCase() === (remoteUser.email || '').toLowerCase());
        if (idx1 >= 0) { localUsers1[idx1] = { ...localUsers1[idx1], ...remoteUser }; } else { localUsers1.push(remoteUser); }
        setMockData('users', localUsers1);
        return remoteUser;
      }
    } catch (profileReadError) {
      if (!isPermissionDeniedError(profileReadError) && !isTimeoutLikeError(profileReadError)) {
        throw profileReadError;
      }
    }

    const fallbackUser = resolvePreferredUserProfile({
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || normalizedEmail,
      role: 'user',
      addresses: [],
      permissions: {}
    });

    if (fallbackUser.role !== 'user') {
      try {
        await setDoc(
          docRef,
          deepSanitize({
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            role: fallbackUser.role,
            permissions: fallbackUser.permissions || {},
          }),
          { merge: true }
        );
      } catch {
        // Ignore role sync failures during fallback user bootstrap.
      }
    }

    // Sync into local cache
    const localUsers2 = upsertSuperAdmin(getMockData<User[]>('users', []));
    const idx2 = localUsers2.findIndex(u => u.id === fallbackUser.id || (u.email || '').toLowerCase() === (fallbackUser.email || '').toLowerCase());
    if (idx2 >= 0) { localUsers2[idx2] = { ...localUsers2[idx2], ...fallbackUser }; } else { localUsers2.push(fallbackUser); }
    setMockData('users', localUsers2);
    return fallbackUser;
  } catch (e: any) {
    const firebaseErrorCode = e?.code || '';
    if (firebaseErrorCode === 'auth/user-not-found') {
      throw new Error('Account not found. Please sign up first.');
    }
    if (firebaseErrorCode === 'auth/wrong-password') {
      throw new Error('Incorrect password.');
    }
    if (firebaseErrorCode === 'auth/invalid-credential') {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        if (!methods || methods.length === 0) {
          throw new Error('Account not found. Please sign up first.');
        }
        throw new Error('Incorrect password.');
      } catch (lookupErr: any) {
        const lookupMessage = String(lookupErr?.message || '');
        if (lookupMessage.includes('Account not found') || lookupMessage.includes('Incorrect password')) {
          throw lookupErr;
        }
        throw new Error('Login failed. Please try again.');
      }
    }
    if (firebaseErrorCode === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw mapFirebaseAuthError(e, 'Login failed. Please use a registered email.');
  }
};

export const loginUserWithPhone = async (phone: string, password: string): Promise<User> => {
  const normalizedPhone = normalizeIndianPhone(phone);
  const nationalPhone = getIndianNationalPhone(phone);
  let accountEmail = '';

  const resolveEmailFromPhone = async (): Promise<string> => {
    const byPhoneQuery = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const byPhoneSnap = await getDocs(byPhoneQuery);
    if (!byPhoneSnap.empty) {
      const first = byPhoneSnap.docs[0].data() as User;
      if (first?.email) return first.email;
    }

    const byLegacyPhoneQuery = query(collection(db, 'users'), where('phone', '==', nationalPhone));
    const byLegacyPhoneSnap = await getDocs(byLegacyPhoneQuery);
    if (!byLegacyPhoneSnap.empty) {
      const first = byLegacyPhoneSnap.docs[0].data() as User;
      if (first?.email) return first.email;
    }
    return '';
  };

  try {
    accountEmail = await resolveEmailFromPhone();
  } catch {
    accountEmail = '';
  }

  if (!accountEmail) {
    throw new Error('Account not found. Please sign up first.');
  }

  return loginUser(accountEmail, password, normalizedPhone);
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    if (!firebaseUser) throw new Error("No user returned");

    let resolvedUser: User;
    const userRef = doc(db, 'users', firebaseUser.uid);

    try {
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const rawUser = userSnap.data() as User;
        const normalizedUser = applyRoleByEmail({ ...rawUser, id: rawUser.id || firebaseUser.uid });
        if (rawUser.role !== normalizedUser.role) {
          try {
            await setDoc(
              userRef,
              deepSanitize({
                role: normalizedUser.role,
                permissions: normalizedUser.permissions || {},
              }),
              { merge: true }
            );
          } catch {
            // Ignore role sync failure and continue with normalized role in app state.
          }
        }
        resolvedUser = normalizedUser;
      } else {
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          role: 'user',
          addresses: [],
          permissions: {}
        };
        const normalizedUser = applyRoleByEmail(newUser);
        try {
          await setDoc(userRef, deepSanitize({ ...normalizedUser, createdAt: new Date().toISOString() }));
        } catch (profileWriteError) {
          if (!isPermissionDeniedError(profileWriteError) && !isTimeoutLikeError(profileWriteError)) {
            throw profileWriteError;
          }
        }
        resolvedUser = normalizedUser;
      }
    } catch (profileError) {
      if (!isPermissionDeniedError(profileError) && !isTimeoutLikeError(profileError)) {
        throw profileError;
      }
      resolvedUser = applyRoleByEmail({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: 'user',
        addresses: [],
        permissions: {}
      });
    }

    // Sync into local user cache so admin lists and order matching work correctly
    const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
    const existingIdx = localUsers.findIndex(u => u.id === resolvedUser.id || (u.email || '').toLowerCase() === (resolvedUser.email || '').toLowerCase());
    if (existingIdx >= 0) {
      localUsers[existingIdx] = { ...localUsers[existingIdx], ...resolvedUser };
    } else {
      localUsers.push(resolvedUser);
    }
    setMockData('users', localUsers);

    return resolvedUser;
  } catch (error: any) {
    throw mapFirebaseAuthError(error, 'Google login failed. Please continue with email.');
  }
};

export const isEmailRegistered = async (email: string): Promise<boolean> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  try {
    const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
    if (methods && methods.length > 0) return true;
  } catch {
    // Fallback below
  }

  try {
    const qEmail = query(collection(db, 'users'), where('email', '==', normalizedEmail));
    const emailSnap = await getDocs(qEmail);
    if (!emailSnap.empty) return true;
  } catch {
    // Fallback below
  }

  const users = upsertSuperAdmin(getMockData<User[]>('users', []));
  return users.some((u) => (u.email || '').trim().toLowerCase() === normalizedEmail);
};

export const isEmailRegisteredInFirebase = async (email: string): Promise<boolean> => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
  if (methods && methods.length > 0) return true;

  const qEmail = query(collection(db, 'users'), where('email', '==', normalizedEmail));
  const emailSnap = await getDocs(qEmail);
  return !emailSnap.empty;
};

const normalizeIndianPhone = (input: string): string => {
  const cleaned = input.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.slice(1)}`;
  }

  throw new Error('Invalid Indian phone number');
};

const getIndianNationalPhone = (input: string): string => normalizeIndianPhone(input).slice(3);

const mapPhoneAuthError = (error: unknown): string => {
  const code = (error as { code?: string })?.code || '';
  const rawMessage = (error as { message?: string })?.message || '';
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format. Use a valid 10-digit Indian number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please enter the correct OTP.';
    case 'auth/operation-not-allowed':
      return 'Phone auth is not enabled in Firebase Console.';
    case 'auth/app-not-authorized':
      return 'This domain is not authorized for Firebase auth.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA check failed. Refresh page and try again.';
    case 'auth/invalid-app-credential':
      return 'OTP session expired or invalid. Please resend OTP and try again.';
    case 'auth/invalid-auth-event':
      return 'Authentication session is invalid. Please resend OTP and try again.';
    case 'auth/missing-app-credential':
      return 'Missing app verification. Please resend OTP.';
    case 'auth/code-expired':
      return 'OTP expired. Please resend OTP and try again.';
    case 'auth/invalid-verification-id':
      return 'OTP session expired or invalid. Please resend OTP and try again.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase.';
    case 'auth/web-storage-unsupported':
      return 'Browser does not support required web storage for auth.';
    default:
      if (code) return `Phone authentication failed (${code}).`;
      if (rawMessage) return `Phone authentication failed: ${rawMessage}`;
      return 'Phone authentication failed. Please try again.';
  }
};

export const resetPhoneOtpFlow = () => {
  const containerId = recaptchaContainerInUse;
  phoneConfirmationResult = null;
  phoneVerificationId = null;
  recaptchaContainerInUse = null;
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch { /* ignore */ }
    recaptchaVerifier = null;
  }
  if (typeof window !== 'undefined') {
    (window as any).confirmationResult = null;
    (window as any).phoneVerificationId = null;
    try {
      window.sessionStorage.removeItem('phoneVerificationId');
    } catch {
      // no-op for restricted storage contexts
    }
    (window as any).recaptchaVerifier = null;

    // Reset the global grecaptcha widget so the next render() call starts clean.
    try {
      const win = window as any;
      if (win.grecaptcha && typeof win.grecaptcha.reset === 'function') {
        win.grecaptcha.reset();
      }
    } catch { /* ignore */ }

    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    }
  }

  // Cleanup secondary OTP auth session so it never pollutes main auth state.
  if (otpAuthApp) {
    const otpAuth = getAuthFromApp(otpAuthApp);
    void signOutFromAuth(otpAuth).catch(() => {
      // ignore
    });
    const appToDelete = otpAuthApp;
    otpAuthApp = null;
    otpAuthAppName = null;
    void deleteApp(appToDelete).catch(() => {
      // ignore
    });
  }
};

const ensureRecaptchaVerifier = async (containerId: string): Promise<RecaptchaVerifier> => {
  if (recaptchaVerifier && recaptchaContainerInUse === containerId) {
    return recaptchaVerifier;
  }

  // Clear any stale verifier instance first
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch { /* ignore */ }
    recaptchaVerifier = null;
    recaptchaContainerInUse = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container not found: #${containerId}`);
  }

  // Wipe any previously rendered grecaptcha widget inside the container.
  // Without this, Firebase throws "reCAPTCHA has already been rendered in this element"
  // on every retry, which causes auth/captcha-check-failed errors.
  container.innerHTML = '';

  // Also reset the global grecaptcha instance if available — this clears any
  // stale widget IDs that Firebase may have cached internally.
  try {
    const win = window as any;
    if (win.grecaptcha && typeof win.grecaptcha.reset === 'function') {
      win.grecaptcha.reset();
    }
  } catch { /* ignore — grecaptcha may not be loaded yet */ }

  const otpAuth = getOtpAuth();
  recaptchaVerifier = new RecaptchaVerifier(otpAuth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      // When reCAPTCHA token expires, clear so the next sendOtp
      // call creates a fresh verifier instead of reusing the expired token.
      recaptchaVerifier = null;
      recaptchaContainerInUse = null;
    },
  });

  recaptchaContainerInUse = containerId;

  await recaptchaVerifier.render();

  return recaptchaVerifier;
};

export const initPhoneRecaptcha = async (recaptchaContainerId: string): Promise<void> => {
  await ensureRecaptchaVerifier(recaptchaContainerId);
};

export const sendPhoneOtp = async (phone: string, recaptchaContainerId: string): Promise<void> => {
  const formattedPhone = normalizeIndianPhone(phone);
  phoneConfirmationResult = null;
  phoneVerificationId = null;
  if (typeof window !== 'undefined') {
    (window as any).confirmationResult = null;
    (window as any).phoneVerificationId = null;
    try {
      window.sessionStorage.removeItem('phoneVerificationId');
    } catch {
      // no-op for restricted storage contexts
    }
  }

  // Always start with a fresh verifier token per OTP send attempt.
  // Reusing older verifier sessions can trigger INVALID_APP_CREDENTIAL.
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch { /* ignore */ }
    recaptchaVerifier = null;
    recaptchaContainerInUse = null;
  }

  // Also reset the global grecaptcha widget before re-rendering.
  try {
    const win = window as any;
    if (win.grecaptcha && typeof win.grecaptcha.reset === 'function') {
      win.grecaptcha.reset();
    }
  } catch { /* ignore */ }

  // Small delay to let the browser flush the DOM after innerHTML reset
  // before Firebase tries to attach a new widget to the container.
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const appVerifier = await ensureRecaptchaVerifier(recaptchaContainerId);
    const otpAuth = getOtpAuth();
    phoneConfirmationResult = await signInWithPhoneNumber(
      otpAuth,
      formattedPhone,
      appVerifier
    );
    phoneVerificationId = phoneConfirmationResult.verificationId || null;
    if (typeof window !== 'undefined') {
      (window as any).confirmationResult = phoneConfirmationResult;
      (window as any).phoneVerificationId = phoneVerificationId;
      try {
        if (phoneVerificationId) {
          window.sessionStorage.setItem('phoneVerificationId', phoneVerificationId);
        }
      } catch {
        // no-op for restricted storage contexts
      }
    }
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (
      code === 'auth/invalid-app-credential' ||
      code === 'auth/invalid-auth-event' ||
      code === 'auth/missing-app-credential' ||
      code === 'auth/captcha-check-failed'
    ) {
      // Force fresh verifier on next attempt to avoid stale credential loops.
      resetPhoneOtpFlow();
    }
    throw new Error(mapPhoneAuthError(error));
  }
};

export const verifyPhoneOtp = async (code: string): Promise<void> => {
  const activeVerificationId =
    phoneVerificationId ||
    (typeof window !== 'undefined' ? (window as any).phoneVerificationId || window.sessionStorage.getItem('phoneVerificationId') : null);

  if (!activeVerificationId) {
    throw new Error('Please send OTP first');
  }
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new Error('Invalid OTP');
  }
  try {
    // Prefer confirmationResult flow when available; it's less prone to stale verificationId issues.
    if (phoneConfirmationResult) {
      await phoneConfirmationResult.confirm(normalizedCode);
      phoneConfirmationResult = null;
      phoneVerificationId = null;
      if (typeof window !== 'undefined') {
        (window as any).confirmationResult = null;
        (window as any).phoneVerificationId = null;
        try {
          window.sessionStorage.removeItem('phoneVerificationId');
        } catch {
          // no-op for restricted storage contexts
        }
      }
      return;
    }

    const credential = PhoneAuthProvider.credential(activeVerificationId, normalizedCode);
    await signInWithCredential(auth, credential);
    phoneConfirmationResult = null;
    phoneVerificationId = null;
    if (typeof window !== 'undefined') {
      (window as any).confirmationResult = null;
      (window as any).phoneVerificationId = null;
      try {
        window.sessionStorage.removeItem('phoneVerificationId');
      } catch {
        // no-op for restricted storage contexts
      }
    }
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/invalid-verification-code') {
      throw new Error('Incorrect OTP');
    }
    throw new Error(mapPhoneAuthError(error));
  }
};

export const sendCheckoutPhoneOtp = async (phone: string, recaptchaContainerId: string): Promise<void> => {
  const formattedPhone = normalizeIndianPhone(phone);
  phoneConfirmationResult = null;
  phoneVerificationId = null;
  if (typeof window !== 'undefined') {
    (window as any).confirmationResult = null;
    (window as any).phoneVerificationId = null;
    try {
      window.sessionStorage.removeItem('phoneVerificationId');
    } catch {
      // no-op for restricted storage contexts
    }
  }

  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch { /* ignore */ }
    recaptchaVerifier = null;
    recaptchaContainerInUse = null;
  }

  try {
    const win = window as any;
    if (win.grecaptcha && typeof win.grecaptcha.reset === 'function') {
      win.grecaptcha.reset();
    }
  } catch { /* ignore */ }

  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const appVerifier = await ensureRecaptchaVerifier(recaptchaContainerId);
    phoneConfirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      appVerifier
    );
    phoneVerificationId = phoneConfirmationResult.verificationId || null;
    if (typeof window !== 'undefined') {
      (window as any).confirmationResult = phoneConfirmationResult;
      (window as any).phoneVerificationId = phoneVerificationId;
      try {
        if (phoneVerificationId) {
          window.sessionStorage.setItem('phoneVerificationId', phoneVerificationId);
        }
      } catch {
        // no-op for restricted storage contexts
      }
    }
  } catch (error) {
    phoneConfirmationResult = null;
    phoneVerificationId = null;
    throw new Error(mapPhoneAuthError(error));
  }
};

export const verifyCheckoutPhoneOtp = async (code: string): Promise<void> => {
  const activeVerificationId =
    phoneVerificationId ||
    (typeof window !== 'undefined' ? (window as any).phoneVerificationId || window.sessionStorage.getItem('phoneVerificationId') : null);

  if (!activeVerificationId) {
    throw new Error('Please send OTP first');
  }
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    throw new Error('Invalid OTP');
  }
  try {
    if (phoneConfirmationResult) {
      await phoneConfirmationResult.confirm(normalizedCode);
    } else {
      const credential = PhoneAuthProvider.credential(activeVerificationId, normalizedCode);
      await signInWithCredential(auth, credential);
    }

    phoneConfirmationResult = null;
    phoneVerificationId = null;
    if (typeof window !== 'undefined') {
      (window as any).confirmationResult = null;
      (window as any).phoneVerificationId = null;
      try {
        window.sessionStorage.removeItem('phoneVerificationId');
      } catch {
        // no-op for restricted storage contexts
      }
    }
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/invalid-verification-code') {
      throw new Error('Incorrect OTP');
    }
    throw new Error(mapPhoneAuthError(error));
  }
};

export const upsertCheckoutPhoneUserProfile = async (shippingDetails: CheckoutShippingDetails): Promise<User> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.isAnonymous) {
    throw new Error('Please verify your phone number to continue.');
  }

  const normalizedPhone = normalizeIndianPhone(shippingDetails.phoneNumber || currentUser.phoneNumber || '');
  const nationalPhone = getIndianNationalPhone(normalizedPhone);
  const userRef = doc(db, 'users', currentUser.uid);
  let existingRemote: Partial<User> = {};

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      existingRemote = userSnap.data() as User;
    } else {
      const phoneSnap = await getDocs(query(collection(db, 'users'), where('phone', '==', normalizedPhone)));
      if (!phoneSnap.empty) existingRemote = phoneSnap.docs[0].data() as User;
    }
  } catch {
    // Local profile below still keeps the checkout account usable in the UI.
  }

  const address: Address = {
    id: `addr_${Date.now()}`,
    street: shippingDetails.address,
    city: shippingDetails.city,
    zip: shippingDetails.pincode,
    country: `India, ${shippingDetails.state}`,
  };
  const existingAddresses = existingRemote.addresses || [];
  const hasAddress = existingAddresses.some(
    (item) => item.street.toLowerCase() === address.street.toLowerCase() && item.zip === address.zip
  );

  const nextUser = resolvePreferredUserProfile({
    id: currentUser.uid,
    name: shippingDetails.name || existingRemote.name || currentUser.displayName || 'Customer',
    email: currentUser.email || existingRemote.email || '',
    phone: normalizedPhone,
    role: existingRemote.role || 'user',
    addresses: hasAddress ? existingAddresses : [address, ...existingAddresses],
    permissions: existingRemote.permissions || {},
  });

  const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
  const existingIdx = localUsers.findIndex((u) => {
    const userPhone = u.phone || '';
    return (
      u.id === nextUser.id ||
      userPhone === normalizedPhone ||
      userPhone === nationalPhone ||
      (() => {
        try {
          return getIndianNationalPhone(userPhone) === nationalPhone;
        } catch {
          return false;
        }
      })()
    );
  });

  if (existingIdx >= 0) {
    localUsers[existingIdx] = { ...localUsers[existingIdx], ...nextUser, id: currentUser.uid };
  } else {
    localUsers.push(nextUser);
  }
  setMockData('users', localUsers);

  try {
    await setDoc(
      userRef,
      deepSanitize({
        ...nextUser,
        uid: currentUser.uid,
        phone: normalizedPhone,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (profileWriteError) {
    if (!isPermissionDeniedError(profileWriteError) && !isTimeoutLikeError(profileWriteError)) {
      throw profileWriteError;
    }
  }

  return nextUser;
};

export const loginWithPhoneOtp = async (phone: string): Promise<User> => {
  const normalizedPhone = normalizeIndianPhone(phone);
  const nationalPhone = getIndianNationalPhone(phone);

  const syncRoleForCurrentAuthUser = async (sourceUser: User): Promise<User> => {
    const normalizedUser = applyRoleByEmail(sourceUser);
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return normalizedUser;

    try {
      await setDoc(
        doc(db, 'users', currentUid),
        deepSanitize({
          id: currentUid,
          uid: currentUid,
          name: normalizedUser.name || 'User',
          email: normalizedUser.email || '',
          phone: normalizedUser.phone || normalizedPhone,
          role: normalizedUser.role || 'user',
          addresses: normalizedUser.addresses || [],
          permissions: normalizedUser.permissions || {},
          offersSubscribed: true,
        }),
        { merge: true }
      );
    } catch {
      // Ignore sync failures and allow caller to handle downstream permission errors.
    }

    return { ...normalizedUser, id: currentUid };
  };

  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return await syncRoleForCurrentAuthUser(userDoc.data() as User);
    }

    const qLegacy = query(collection(db, 'users'), where('phone', '==', nationalPhone));
    const queryLegacySnapshot = await getDocs(qLegacy);
    if (!queryLegacySnapshot.empty) {
      const userDoc = queryLegacySnapshot.docs[0];
      return await syncRoleForCurrentAuthUser(userDoc.data() as User);
    }
  } catch {
    // fallback below
  }

  const users = getMockData<User[]>('users', []);
  const found = users.find((u) => {
    if (!u.phone) return false;
    try {
      return normalizeIndianPhone(u.phone) === normalizedPhone || getIndianNationalPhone(u.phone) === nationalPhone;
    } catch {
      return false;
    }
  });
  if (!found) {
    throw new Error('No account found for this phone number');
  }

  await ensureFirebaseConnection();
  return await syncRoleForCurrentAuthUser(found);
};

export const updateUserAddresses = async (userId: string, addresses: Address[]): Promise<void> => {
    // 1. Update Local Mock
    const users = getMockData<User[]>('users', []);
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
        users[userIdx].addresses = addresses;
        setMockData('users', users);
    }

    // 2. Update Firebase
    try {
        await ensureFirebaseConnection();
        const userRef = doc(db, 'users', userId);
        
        // We only update the addresses field
        await updateDoc(userRef, { addresses: deepSanitize(addresses) });
    } catch (e) {
        logDevWarning("Failed to update user address in Firebase:", e);
    }

    // 3. Sync the updated addresses into the active session (aura_active_user)
    //    so the profile page reflects changes immediately without a full reload.
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('aura_active_user') : null;
      if (raw) {
        const sessionUser = JSON.parse(raw) as User;
        if (sessionUser.id === userId) {
          const updated = { ...sessionUser, addresses };
          window.localStorage.setItem('aura_active_user', JSON.stringify(updated));
        }
      }
    } catch {
      // Ignore serialization failures.
    }
};

export const addNewAdmin = async (email: string, name: string, password: string, permissions?: UserPermissions): Promise<void> => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedName = (name || '').trim();

    if (!normalizedEmail) {
      throw new Error('Admin email is required');
    }
    if (!normalizedName) {
      throw new Error('Admin name is required');
    }

    const users = upsertSuperAdmin(getMockData<User[]>('users', []));
    const secondaryAppName = `SecondaryApp_${Date.now()}`;
    let secondaryApp: FirebaseApp | null = null;
    const adminProfile = {
      id: '',
      email: normalizedEmail,
      name: normalizedName,
      role: 'admin' as const,
      addresses: [],
      permissions: { ...DEFAULT_ADMIN_PERMISSIONS, ...(permissions || {}) },
      createdAt: new Date().toISOString()
    };

    const syncCurrentSuperAdminProfile = async () => {
      const currentEmail = (auth.currentUser?.email || '').trim().toLowerCase();
      const hasMainSuperAdminSession = Boolean(auth.currentUser?.uid) && currentEmail === SUPERADMIN_EMAIL;
      if (!hasMainSuperAdminSession || !auth.currentUser) return false;

      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        deepSanitize({
          id: auth.currentUser.uid,
          email: SUPERADMIN_EMAIL,
          name: auth.currentUser.displayName || 'Super Admin',
          role: 'superadmin',
          addresses: [],
          permissions: { ...DEFAULT_SUPERADMIN_PERMISSIONS }
        }),
        { merge: true }
      );

      return true;
    };

    try {
        await ensureFirebaseConnection();

        const existingLocalUser = users.find((u) => (u.email || '').trim().toLowerCase() === normalizedEmail);
        if (existingLocalUser) {
          if (existingLocalUser.role === 'admin' || existingLocalUser.role === 'superadmin') {
            throw new Error('This email is already an admin');
          }

          adminProfile.id = existingLocalUser.id;
          const hasSuperAdminAccess = await syncCurrentSuperAdminProfile();
          if (!hasSuperAdminAccess) {
            throw new Error('Log out and log back in as the superadmin, then try again.');
          }

          await setDoc(doc(db, 'users', existingLocalUser.id), deepSanitize(adminProfile), { merge: true });
          const refreshedUsers = upsertSuperAdmin(getMockData<User[]>('users', []))
            .map((u) => ((u.email || '').trim().toLowerCase() === normalizedEmail ? { ...u, ...adminProfile } : u));
          setMockData('users', refreshedUsers);
          return;
        }

        try {
          const existingRemoteQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail), limit(1));
          const existingRemoteSnap = await getDocs(existingRemoteQuery);
          if (!existingRemoteSnap.empty) {
            const remoteUser = applyRoleByEmail(existingRemoteSnap.docs[0].data() as User);
            if (remoteUser.role === 'admin' || remoteUser.role === 'superadmin') {
              throw new Error('This email is already an admin');
            }

            adminProfile.id = remoteUser.id || existingRemoteSnap.docs[0].id;
            const hasSuperAdminAccess = await syncCurrentSuperAdminProfile();
            if (!hasSuperAdminAccess) {
              throw new Error('Log out and log back in as the superadmin, then try again.');
            }

            await setDoc(doc(db, 'users', adminProfile.id), deepSanitize(adminProfile), { merge: true });
            const refreshedUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
            const nextUsers = refreshedUsers.some((u) => (u.email || '').trim().toLowerCase() === normalizedEmail)
              ? refreshedUsers.map((u) => ((u.email || '').trim().toLowerCase() === normalizedEmail ? { ...u, ...adminProfile } : u))
              : [...refreshedUsers, adminProfile];
            setMockData('users', nextUsers);
            return;
          }
        } catch (lookupError) {
          if (lookupError instanceof Error && lookupError.message) {
            throw lookupError;
          }
        }
        
        // Create in Firebase Auth using a dedicated secondary app to avoid logging out current admin.
        secondaryApp = initializeApp(mainApp.options, secondaryAppName);
        const secondaryAuth = getAuthFromApp(secondaryApp);
        const secondaryDb = getFirestore(secondaryApp);
        
        let userCredential: UserCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
        } catch (createError: any) {
          const createCode = createError?.code || '';
          if (createCode !== 'auth/email-already-in-use') {
            throw createError;
          }

          // Recover partially-created admins: earlier attempts may have created the Auth user
          // but failed before the Firestore user profile was written.
          userCredential = await signInWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
        }
        const uid = userCredential.user.uid;
        adminProfile.id = uid;
        
        const hasMainSuperAdminSession = await syncCurrentSuperAdminProfile();

        if (hasMainSuperAdminSession) {
          await setDoc(doc(db, 'users', uid), deepSanitize(adminProfile), { merge: true });
        } else {
          // Fallback: try writing via the newly-created user's own auth session.
          await userCredential.user.getIdToken(true).catch(() => '');
          await setDoc(doc(secondaryDb, 'users', uid), deepSanitize(adminProfile), { merge: true });
        }

        // Persist local cache only after remote creation succeeds.
        const refreshedUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
        if (!refreshedUsers.some((u) => u.id === uid || (u.email || '').toLowerCase() === normalizedEmail)) {
          refreshedUsers.push(adminProfile);
          setMockData('users', refreshedUsers);
        }

    } catch(e: any) { 
        logDevError("Error adding admin to Firebase:", e);
        const code = e?.code || '';
        if (code === 'auth/email-already-in-use') {
          throw new Error('This email already has an account. Use the same password as that account to repair and attach the admin profile, or choose a different email.');
        }
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
          throw new Error('This email already exists in Firebase Auth, but the password did not match the existing account. Enter the original password for that email or use a different email.');
        }
        if (code === 'auth/invalid-email') {
          throw new Error('Invalid email address');
        }
        if (code === 'auth/weak-password') {
          throw new Error('Password is too weak');
        }
        if (code === 'permission-denied' || code === 'firestore/permission-denied') {
          throw new Error('Missing Firestore permission to save the admin profile. Log out and log back in as the superadmin, then try again.');
        }
        throw e instanceof Error ? e : new Error('Failed to add admin');
    } finally {
        // Cleanup secondary app to prevent stale/duplicate app instances.
        if (secondaryApp) {
          try {
            await deleteApp(secondaryApp);
          } catch {
            // Ignore cleanup failures.
          }
        } else if (getApps().some((app) => app.name === secondaryAppName)) {
          try {
            await deleteApp(getApp(secondaryAppName));
          } catch {
            // Ignore cleanup failures.
          }
        }
    }
};

export const deleteAdmin = async (adminId: string): Promise<void> => {
  const users = getMockData<User[]>('users', []);
  const found = users.find((u) => u.id === adminId);
  if (found?.role === 'superadmin') {
    throw new Error('Superadmin cannot be deleted.');
  }
  const updatedUsers = users.map((user) =>
      user.id === adminId ? { ...user, role: 'user' as const, permissions: {} } : user
  );
    setMockData('users', updatedUsers);

    try {
        await ensureFirebaseConnection();
        const userRef = doc(db, 'users', adminId);
        await updateDoc(userRef, { role: 'user', permissions: {} });
    } catch (e) {
        logDevWarning("Failed to demote admin in Firebase:", e);
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
    setMockData('users', localUsers);
    try {
      await ensureFirebaseConnection();
      const querySnapshot = await withTimeout(getDocs(collection(db, 'users')), 5000);
      const fbUsers: User[] = [];
      querySnapshot.forEach((userDoc) => {
        const data = userDoc.data() as User;
        // Ensure id is always set from the document key
        fbUsers.push(applyRoleByEmail({ ...data, id: data.id || userDoc.id }));
      });
      const normalized = upsertSuperAdmin(fbUsers);

      // Merge: Firebase is the source of truth for remote users.
      // Preserve any local-only users (e.g. created offline) that don't exist remotely.
      const mergedMap = new Map<string, User>();
      normalized.forEach(u => mergedMap.set(u.id, u));
      localUsers.forEach(u => {
        if (!mergedMap.has(u.id)) mergedMap.set(u.id, u);
      });
      const merged = Array.from(mergedMap.values());

      setMockData('users', merged);
      return merged;
    } catch (error) {
      if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
        logDevWarning('Failed to fetch users from Firebase:', error);
      }
      return localUsers;
    }
};

type IndianPincodeResult = { city: string; state: string; country: string };

const PINCODE_FALLBACKS: Record<string, IndianPincodeResult> = {
  '401101': { city: 'Bhayandar West', state: 'Maharashtra', country: 'India' },
  '401104': { city: 'Mira Road', state: 'Maharashtra', country: 'India' },
  '401105': { city: 'Bhayandar East', state: 'Maharashtra', country: 'India' },
  '401107': { city: 'Mira Road East', state: 'Maharashtra', country: 'India' },
  '401201': { city: 'Vasai', state: 'Maharashtra', country: 'India' },
  '401202': { city: 'Vasai Road', state: 'Maharashtra', country: 'India' },
  '401203': { city: 'Nalasopara West', state: 'Maharashtra', country: 'India' },
  '401207': { city: 'Naigaon West', state: 'Maharashtra', country: 'India' },
  '401208': { city: 'Vasai East', state: 'Maharashtra', country: 'India' },
  '401209': { city: 'Nalasopara East', state: 'Maharashtra', country: 'India' },
  '401303': { city: 'Virar West', state: 'Maharashtra', country: 'India' },
  '401305': { city: 'Virar East', state: 'Maharashtra', country: 'India' },
};

export const verifyIndianPincode = async (
  pincode: string
): Promise<IndianPincodeResult | null> => {
  if (!/^\d{6}$/.test(pincode)) return null;

  const localMatch = PINCODE_FALLBACKS[pincode];
  if (localMatch) return localMatch;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length) {
        const office = data[0].PostOffice[0];
        const city = office.District || office.Name;
        const state = office.State || '';
        if (city && state) return { city, state, country: 'India' };
      }
    }
  } catch {
    // Try the secondary source below.
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/in/${pincode}`);
    if (response.ok) {
      const data = await response.json();
      const place = Array.isArray(data?.places) ? data.places[0] : null;
      const city = place?.['place name'] || place?.placeName || '';
      const state = place?.state || '';
      if (city && state) return { city, state, country: 'India' };
    }
  } catch {
    // Fall back to known local records below.
  }

  return PINCODE_FALLBACKS[pincode] || null;
};

// --- Order Service ---

export const createOrder = async (
  userId: string,
  items: any[],
  total: number,
  address: Address,
  meta?: {
    phoneNumber?: string;
    paymentStatus?: 'Pending' | 'Paid' | 'Failed';
    paymentMethod?: 'online' | 'cod';
    shippingDetails?: CheckoutShippingDetails;
    orderSource?: string;
    couponCode?: string;
    couponDiscount?: number;
    originalSubtotal?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }
): Promise<Order> => {
  // Identity resolution priority:
  // 1) Logged-in Firebase UID (non-anonymous) must win.
  // 2) Explicit non-guest userId from caller.
  // 3) Guest fallback for anonymous / no-session checkout.
  const authUid = auth.currentUser?.uid || '';
  const isAnonymousSession = Boolean(auth.currentUser?.isAnonymous);
  const incomingUserId = String(userId || '').trim();
  const isGuestLikeIncoming = incomingUserId === '' || incomingUserId.startsWith('guest_');
  const resolvedUserId =
    authUid && !isAnonymousSession
      ? authUid
      : !isGuestLikeIncoming
        ? incomingUserId
        : `guest_${Date.now()}`;
  const placedAt = new Date().toISOString();
  const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
  const matchingUser = localUsers.find((u) => u.id === resolvedUserId || u.id === userId);
  const currentAuthEmail = auth.currentUser?.email || '';
  const candidateEmail = (meta?.customerEmail || currentAuthEmail || matchingUser?.email || '').trim().toLowerCase();
  const verifiedCustomerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail) ? candidateEmail : '';
  const customerName = meta?.shippingDetails?.name || meta?.customerName || matchingUser?.name || 'Customer';
  const customerPhone = meta?.shippingDetails?.phoneNumber || meta?.customerPhone || matchingUser?.phone || meta?.phoneNumber || '';
  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    userId: resolvedUserId,
    items,
    total,
    status: 'Processing',
    date: placedAt,
    shippingAddress: address,
    shippingDetails: meta?.shippingDetails,
    phoneNumber: meta?.phoneNumber,
    paymentStatus: meta?.paymentStatus || 'Paid',
    paymentMethod: meta?.paymentMethod,
    createdAt: placedAt,
    orderSource: meta?.orderSource || 'Website',
    couponCode: meta?.couponCode,
    couponDiscount: meta?.couponDiscount,
    originalSubtotal: meta?.originalSubtotal,
    customerName,
    customerEmail: verifiedCustomerEmail,
    customerPhone,
  };

  const cleanOrder = deepSanitize(newOrder);

  // 1. ALWAYS Save to LocalStorage first (Source of truth for Demo)
  const localOrders = getMockData<Order[]>('orders', []);
  localOrders.push(cleanOrder);
  setMockData('orders', localOrders);

  // 2. Try Firebase (Best effort)
  try {
    // CRITICAL: Ensure we have a session (anonymous or real) before writing
    await ensureFirebaseConnection();
    
    await setDoc(doc(db, 'orders', cleanOrder.id), cleanOrder);
    
    // Reserve inventory by selected color
    for (const item of items) {
        try {
            const pRef = doc(db, 'products', item.id);
            const pSnap = await getDoc(pRef);
            if(pSnap.exists()) {
                const product = normalizeProductColors({ ...(pSnap.data() as Product), id: pSnap.id });
                const colorName = item.selectedColorName;
                const qty = Number(item.quantity || 0);
                const colors = [...(product.colors || [])];
                if (qty > 0 && colorName && colors.length) {
                  const colorIdx = colors.findIndex((c) => c.name === colorName);
                  if (colorIdx >= 0) {
                    colors[colorIdx] = {
                      ...colors[colorIdx],
                      reservedStock: Number(colors[colorIdx].reservedStock || 0) + qty
                    };
                  }
                }
                const nextProduct = normalizeProductColors({ ...product, colors });
                await updateDoc(pRef, deepSanitize(nextProduct));
            }
        } catch(invError) {
            logDevWarning("Failed to update inventory for item", item.id, invError);
        }
    }
  } catch (error) {
    logDevError("FIREBASE SAVE FAILED (Data might be undefined or Permissions denied):", error);
  }
  
  // Local inventory reserve
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  items.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p) {
        const product = normalizeProductColors(p);
        const colors = [...(product.colors || [])];
        const colorIdx = colors.findIndex((c) => c.name === item.selectedColorName);
        const qty = Number(item.quantity || 0);
        if (colorIdx >= 0 && qty > 0) {
          colors[colorIdx] = { ...colors[colorIdx], reservedStock: Number(colors[colorIdx].reservedStock || 0) + qty };
        }
        Object.assign(p, normalizeProductColors({ ...product, colors }));
      }
  });
  setMockData('products', products);

  return cleanOrder;
};

// New: Explicitly fetch all orders for Admin
export const getAllOrders = async (): Promise<Order[]> => {
    const localOrders = getMockData<Order[]>('orders', []);
    const normalizeEmailValue = (value?: string) => (value || '').trim().toLowerCase();
    const resolveOrderCustomer = (order: Order, users: User[]): Order => {
      const normalizePhoneDigits = (value?: string) => {
        const raw = (value || '').trim();
        if (!raw) return '';
        try {
          return getIndianNationalPhone(raw);
        } catch {
          const digits = raw.replace(/\D/g, '');
          if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
          if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
          return digits;
        }
      };

      const orderEmail = normalizeEmailValue(order.customerEmail);
      const orderUserIdEmail = normalizeEmailValue(order.userId);
      const orderPhone = normalizePhoneDigits(order.customerPhone || order.shippingDetails?.phoneNumber || order.phoneNumber);
      const matchedUser = users.find((u) => {
        const userEmail = normalizeEmailValue(u.email);
        const userPhone = normalizePhoneDigits(u.phone);
        return (
          u.id === order.userId ||
          Boolean(orderEmail && userEmail === orderEmail) ||
          Boolean(orderUserIdEmail && userEmail === orderUserIdEmail) ||
          Boolean(orderPhone && userPhone && userPhone === orderPhone)
        );
      });

      const emailCandidate = order.customerEmail || matchedUser?.email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.userId) ? order.userId : '');
      return {
        ...order,
        customerName: order.customerName || order.shippingDetails?.name || matchedUser?.name,
        customerEmail: emailCandidate ? emailCandidate.trim().toLowerCase() : order.customerEmail,
        customerPhone: order.customerPhone || order.shippingDetails?.phoneNumber || order.phoneNumber || matchedUser?.phone,
      };
    };

    try {
      await ensureFirebaseConnection();
      const [querySnapshot, usersSnapshot] = await Promise.all([
        withTimeout(getDocs(query(collection(db, 'orders'))), 2500),
        withTimeout(getDocs(collection(db, 'users')), 2500).catch(() => null),
      ]);
      const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
      const remoteUsers: User[] = [];
      usersSnapshot?.forEach((userDoc) => {
        const data = userDoc.data() as User;
        remoteUsers.push(applyRoleByEmail({ ...data, id: data.id || userDoc.id }));
      });
      const allUsers = [...remoteUsers, ...localUsers].reduce<User[]>((acc, user) => {
        if (!acc.some((u) => u.id === user.id || normalizeEmailValue(u.email) === normalizeEmailValue(user.email))) {
          acc.push(user);
        }
        return acc;
      }, []);
      const fbOrders: Order[] = [];
      querySnapshot.forEach((orderDoc) => fbOrders.push(resolveOrderCustomer({ ...(orderDoc.data() as Order), id: orderDoc.id }, allUsers)));

      const combined = [...fbOrders];
      localOrders.forEach((localOrder) => {
        if (!combined.find((remoteOrder) => remoteOrder.id === localOrder.id)) {
          combined.push(resolveOrderCustomer(localOrder, allUsers));
        }
      });
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
        logDevWarning('Failed to fetch orders from Firebase:', error);
      }
      const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
      return [...localOrders].map((order) => resolveOrderCustomer(order, localUsers)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  // 1. Get Local Orders
  const mockOrders = getMockData<Order[]>('orders', []);
  
  // 2. Fetch Firebase Orders (with timeout to prevent hanging on slow connections)
  let fbOrders: Order[] = [];
  try {
      await ensureFirebaseConnection();
      const q = query(collection(db, 'orders'), where('userId', '==', userId));
      const querySnapshot = await withTimeout(getDocs(q), 5000);
      // FORCE ID MAP: Explicitly overwrite the ID from the doc.id to ensure matching works
      querySnapshot.forEach((orderDoc) => fbOrders.push({ ...(orderDoc.data() as Order), id: orderDoc.id }));
  } catch (e) { 
      logDevWarning("Failed to fetch user orders from Firebase", e);
  }

  // 3. Filter Local Orders — match by userId OR by the Firebase UID (handles
  //    orders created before the user's Firebase UID was resolved).
  const firebaseUid = auth.currentUser?.uid;
  const filteredMock = mockOrders.filter(o =>
    o.userId === userId ||
    (firebaseUid && o.userId === firebaseUid)
  );

  // 4. Merge - Prioritize Firebase Orders (Source of truth for Status Updates)
  const combined = [...fbOrders];
  filteredMock.forEach(localO => {
      // Only add local order if it doesn't exist in Firebase list
      if (!combined.find(fbO => fbO.id === localO.id)) {
          combined.push(localO);
      }
  });
  
  return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const cleanOrderId = orderId.trim();
  if (!cleanOrderId) return null;

  const localOrder = getMockData<Order[]>('orders', []).find((order) => order.id === cleanOrderId);

  try {
    await ensureFirebaseConnection();
    const orderSnap = await withTimeout(getDoc(doc(db, 'orders', cleanOrderId)), 5000);
    if (orderSnap.exists()) {
      return { ...(orderSnap.data() as Order), id: orderSnap.id };
    }
  } catch (error) {
    logDevWarning('Failed to fetch order by id from Firebase', error);
  }

  return localOrder || null;
};

export const getCachedOrderById = (orderId: string): Order | null => {
  const cleanOrderId = orderId.trim();
  if (!cleanOrderId) return null;
  return getMockData<Order[]>('orders', []).find((order) => order.id === cleanOrderId) || null;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  // Local
  const orders = getMockData<Order[]>('orders', []);
  const order = orders.find(o => o.id === orderId);
  const previousStatus = order?.status;
  if (order) {
      order.status = status;
      setMockData('orders', orders);
  }

  const applyInventoryTransition = (products: Product[], targetOrder?: Order) => {
    if (!targetOrder || previousStatus === status) return products;
    return products.map((raw) => {
      let product = normalizeProductColors(raw);
      const matches = targetOrder.items.filter((item) => item.id === product.id);
      if (!matches.length || !product.colors?.length) return product;

      let colors = [...product.colors];
      for (const item of matches) {
        const qty = Number(item.quantity || 0);
        if (!qty) continue;
        const idx = colors.findIndex((c) => c.name === item.selectedColorName);
        if (idx < 0) continue;
        const color = colors[idx];
        const reserved = Number(color.reservedStock || 0);
        const sold = Number(color.sold || 0);
        const stock = Number(color.stock || 0);

        if (status === 'Delivered') {
          colors[idx] = {
            ...color,
            reservedStock: Math.max(0, reserved - qty),
            sold: sold + qty,
            stock: Math.max(0, stock - qty)
          };
        } else if (status === 'Cancelled') {
          colors[idx] = { ...color, reservedStock: Math.max(0, reserved - qty) };
        } else if (status === 'Processing' && previousStatus === 'Cancelled') {
          colors[idx] = { ...color, reservedStock: reserved + qty };
        }
      }
      return normalizeProductColors({ ...product, colors });
    });
  };

  const localProducts = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const updatedLocalProducts = applyInventoryTransition(localProducts, order);
  setMockData('products', updatedLocalProducts);

  // Firebase
  try {
      await ensureFirebaseConnection();
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });

      if (order) {
        for (const item of order.items) {
          const pRef = doc(db, 'products', item.id);
          const pSnap = await getDoc(pRef);
          if (!pSnap.exists()) continue;
          const product = normalizeProductColors({ ...(pSnap.data() as Product), id: pSnap.id });
          const colors = [...(product.colors || [])];
          const idx = colors.findIndex((c) => c.name === item.selectedColorName);
          const qty = Number(item.quantity || 0);
          if (idx < 0 || qty <= 0) continue;
          const color = colors[idx];
          const reserved = Number(color.reservedStock || 0);
          const sold = Number(color.sold || 0);
          const stock = Number(color.stock || 0);

          if (status === 'Delivered') {
            colors[idx] = {
              ...color,
              reservedStock: Math.max(0, reserved - qty),
              sold: sold + qty,
              stock: Math.max(0, stock - qty)
            };
          } else if (status === 'Cancelled') {
            colors[idx] = { ...color, reservedStock: Math.max(0, reserved - qty) };
          } else if (status === 'Processing' && previousStatus === 'Cancelled') {
            colors[idx] = { ...color, reservedStock: reserved + qty };
          }
          const nextProduct = normalizeProductColors({ ...product, colors });
          await updateDoc(pRef, deepSanitize(nextProduct));
        }
      }
  } catch (e) { }
};

export const updateOrderTracking = async (
  orderId: string,
  tracking: {
    trackingId?: string;
    trackingUrl?: string;
    trackingCarrier?: string;
  }
): Promise<void> => {
  const trackingId = (tracking.trackingId || '').trim();
  const trackingUrl = (tracking.trackingUrl || '').trim();
  const trackingCarrier = (tracking.trackingCarrier || '').trim();
  const patch: Partial<Order> = {
    trackingId,
    trackingUrl,
    trackingCarrier,
    trackingUpdatedAt: new Date().toISOString(),
  };

  const orders = getMockData<Order[]>('orders', []);
  const localOrder = orders.find((item) => item.id === orderId);
  if (localOrder) {
    Object.assign(localOrder, patch);
    setMockData('orders', orders);
  }

  try {
    await ensureFirebaseConnection();
    await updateDoc(doc(db, 'orders', orderId), deepSanitize(patch));
  } catch (e) { }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  const orders = getMockData<Order[]>('orders', []);
  setMockData('orders', orders.filter((order) => order.id !== orderId));

  try {
    await ensureFirebaseConnection();
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
      logDevWarning('Failed to delete order from Firebase:', error);
    }
  }
};

// --- Support Chat Service ---

export const getSupportChats = async (): Promise<SupportChatSession[]> => {
  const local = getMockData<SupportChatSession[]>('support_chats', []);
  try {
    await ensureFirebaseConnection();
    const snapshot = await getDocs(collection(db, 'support_chats'));
    const remote: SupportChatSession[] = [];
    snapshot.forEach((chatDoc) => {
      remote.push({ ...(chatDoc.data() as SupportChatSession), id: chatDoc.id });
    });
    if (remote.length > 0) {
      setMockData('support_chats', remote);
      return remote.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }
  } catch (e) { }
  return [...local].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
};

export const getSupportChatsByUserId = async (userId: string): Promise<SupportChatSession[]> => {
  const all = await getSupportChats();
  return all.filter((chat) => chat.userId === userId);
};

export const upsertSupportChat = async (session: SupportChatSession): Promise<void> => {
  const cleanSession = deepSanitize(session) as SupportChatSession;
  const local = getMockData<SupportChatSession[]>('support_chats', []);
  const idx = local.findIndex((item) => item.id === cleanSession.id);
  if (idx >= 0) local[idx] = cleanSession;
  else local.push(cleanSession);
  setMockData('support_chats', local);

  try {
    await ensureFirebaseConnection();
    await setDoc(doc(db, 'support_chats', cleanSession.id), cleanSession, { merge: true });
  } catch (e) { }
};

export const appendSupportChatMessage = async (
  sessionId: string,
  message: SupportChatMessage,
  metadata?: Partial<SupportChatSession>
): Promise<SupportChatSession | undefined> => {
  const existing = (await getSupportChats()).find((chat) => chat.id === sessionId);
  if (!existing) return undefined;
  const next: SupportChatSession = {
    ...existing,
    ...metadata,
    messages: [...(existing.messages || []), message],
    lastMessageAt: message.timestamp,
  };
  await upsertSupportChat(next);
  return next;
};

export const updateSupportChatSession = async (
  sessionId: string,
  patch: Partial<SupportChatSession>
): Promise<void> => {
  const existing = (await getSupportChats()).find((chat) => chat.id === sessionId);
  if (!existing) return;
  const next = { ...existing, ...patch };
  await upsertSupportChat(next);
};

// --- Settings Service ---

export const getWebsiteSettings = async (): Promise<WebsiteSettings> => {
    const localStored = readFromLocalStorage<WebsiteSettings>('settings');
    const localSettings = normalizeWebsiteSettings(localStored);

    try {
      const docRef = doc(db, 'settings', 'general');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const remoteSettings = normalizeWebsiteSettings(docSnap.data() as WebsiteSettings);

        // Backend settings should remain source of truth when available.
        // Keep local values only as fallback for fields missing from remote.
        if (localStored) {
          return normalizeWebsiteSettings({
            ...localStored,
            ...remoteSettings,
            socialLinks: { ...(localStored.socialLinks || {}), ...(remoteSettings.socialLinks || {}) },
            footerSections: remoteSettings.footerSections?.length ? remoteSettings.footerSections : localSettings.footerSections,
            pageContent: { ...(localStored.pageContent || {}), ...(remoteSettings.pageContent || {}) },
          });
        }

        return remoteSettings;
      }
    } catch {
      // Fall back to local settings when remote fetch is unavailable.
    }

    return localSettings;
};

export const subscribeWebsiteSettings = (onChange: (settings: WebsiteSettings) => void): (() => void) => {
  try {
    const docRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) return;
        const normalized = normalizeWebsiteSettings(docSnap.data() as WebsiteSettings);
        setMockData('settings', normalized);
        onChange(normalized);
      },
      () => {
        // Ignore realtime listener failures and continue with last known settings.
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
};

export const updateWebsiteSettings = async (
  settings: WebsiteSettings,
  options?: { requireCloud?: boolean }
): Promise<void> => {
    const normalizedSettings: WebsiteSettings = normalizeWebsiteSettings(settings);
    let cloudError: unknown = null;

    setMockData('settings', normalizedSettings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('website-settings-updated', { detail: normalizedSettings }));
    }
    try {
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
          throw new Error('auth/session-missing-or-anonymous');
        }
        const docRef = doc(db, 'settings', 'general');
        await setDoc(docRef, normalizedSettings, { merge: true });
    } catch (error) {
      cloudError = error;
      // Keep local settings as source of truth when cloud sync fails.
    }

    if (options?.requireCloud && cloudError) {
      const code = (cloudError as { code?: string })?.code || '';
      const rawMessage = cloudError instanceof Error ? cloudError.message : String(cloudError || '');
      const reason = code || rawMessage || 'unknown error';
      throw new Error(`Saved locally, but backend sync failed (${reason}). Please check admin permissions/login.`);
    }
};

// --- Blog service ---
// Published posts are stored separately from settings so drafts never leak into
// the public sitemap or storefront.
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const snapshot = await getDocs(collection(db, 'blog_posts'));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() } as BlogPost))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const saveBlogPost = async (post: Omit<BlogPost, 'updatedAt'> & { updatedAt?: string }): Promise<void> => {
  const slug = toProductSlug(post.slug || post.title);
  if (!slug) throw new Error('A blog title or slug is required.');
  await setDoc(doc(db, 'blog_posts', post.id), {
    ...post,
    slug,
    title: post.title.trim(),
    excerpt: post.excerpt.trim(),
    content: post.content.trim(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'blog_posts', id));
};

export const getSiteAnalyticsEvents = async (): Promise<SiteAnalyticsEvent[]> => {
  const localEvents = getLocalSiteAnalyticsEvents();
  try {
    const analyticsQuery = query(collection(db, 'site_analytics'), orderBy('timestamp', 'desc'), limit(1500));
    const snapshot = await getDocs(analyticsQuery);
    const cloudEvents: SiteAnalyticsEvent[] = [];
    snapshot.forEach((eventDoc) => {
      cloudEvents.push({ ...(eventDoc.data() as SiteAnalyticsEvent), id: eventDoc.id });
    });

    const combined = [...cloudEvents];
    localEvents.forEach((event) => {
      if (!combined.some((existing) => existing.id === event.id)) {
        combined.push(event);
      }
    });

    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

export const subscribeSiteAnalyticsEvents = (
  onEvents: (events: SiteAnalyticsEvent[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const localEvents = getLocalSiteAnalyticsEvents();
  try {
    const analyticsQuery = query(collection(db, 'site_analytics'), orderBy('timestamp', 'desc'), limit(1500));
    return onSnapshot(
      analyticsQuery,
      (snapshot) => {
        const cloudEvents: SiteAnalyticsEvent[] = [];
        snapshot.forEach((eventDoc) => {
          cloudEvents.push({ ...(eventDoc.data() as SiteAnalyticsEvent), id: eventDoc.id });
        });

        const combined = [...cloudEvents];
        localEvents.forEach((event) => {
          if (!combined.some((existing) => existing.id === event.id)) {
            combined.push(event);
          }
        });

        onEvents(combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      },
      (error) => {
        onEvents(localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        onError?.(error instanceof Error ? error : new Error('Failed to subscribe to visitor analytics.'));
      }
    );
  } catch (error) {
    onEvents(localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    onError?.(error instanceof Error ? error : new Error('Failed to start visitor analytics realtime updates.'));
    return () => {};
  }
};
