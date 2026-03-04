import { 
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  PhoneAuthProvider,
  ConfirmationResult,
  getAuth as getAuthFromApp
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { db, auth, storage, app as mainApp } from './firebaseConfig';
import { Product, ProductColor, User, UserPermissions, Order, Address, WebsiteSettings, SupportChatMessage, SupportChatSession, CheckoutShippingDetails } from '../types';
import { INITIAL_PRODUCTS } from './mockData';

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
const DEFAULT_FOOTER_SECTIONS: NonNullable<WebsiteSettings['footerSections']> = [
  { title: 'COMPANY', items: ['About Us', 'Contact'] },
  { title: 'SUPPORT', items: ['Shipping', 'Returns', 'FAQ', 'Track Order'] },
  { title: 'LEGAL', items: ['Privacy', 'Terms', 'Refund', 'Cookies'] },
];
const DEFAULT_PAGE_CONTENT: NonNullable<WebsiteSettings['pageContent']> = {
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

let recaptchaVerifier: RecaptchaVerifier | null = null;
let phoneConfirmationResult: ConfirmationResult | null = null;
let phoneVerificationId: string | null = null;
let recaptchaContainerInUse: string | null = null;
let anonymousAuthAttempted = false;
let anonymousAuthBlocked = false;

const normalizeProductColors = (product: Product): Product => {
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
  const mappedFromVariants = rawVariants
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
        price: Number(variant?.price ?? product.salePrice ?? product.price ?? 0),
        images: Array.isArray(variant?.images) && variant.images.length > 0 ? variant.images : [...(product.images || [])],
        sizes,
        videoUrl: String(variant?.videoUrl || ''),
      };
    })
    .filter(Boolean) as Product['variants'];

  const mappedVariants: Product['variants'] =
    mappedFromVariants.length > 0
      ? mappedFromVariants
      : rawColors
          .map((color: any) => {
            const colorName = String(typeof color === 'string' ? color : color?.name || '').trim();
            if (!colorName) return null;
            const stock = Number(typeof color === 'string' ? product.stock || 0 : color?.stock ?? product.stock ?? 0);
            return {
              colorName,
              colorHex: String(typeof color === 'string' ? '#6b7280' : color?.hex || '#6b7280'),
              price: Number(product.salePrice || product.price || 0),
              images:
                typeof color === 'string'
                  ? [...(product.images || [])]
                  : Array.isArray(color?.images) && color.images.length > 0
                  ? color.images
                  : [...(product.images || [])],
              sizes: [{ size: 'Standard', stock }],
            };
          })
          .filter(Boolean) as Product['variants'];

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
      price: Number(variant.price || product.salePrice || product.price || 0),
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

  return {
    ...product,
    variants: mappedVariants,
    defaultVariant,
    colors: mappedColors,
    variations: mappedVariations,
    stock: aggregateStock,
    reservedStock: aggregateReserved,
    sold: aggregateSold,
    inStock: aggregateStock - aggregateReserved > 0,
  };
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
    password: 'superadmin123',
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
    console.warn('Anonymous auth failed or timed out (Database might be unreachable):', e);
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
      console.warn('Failed to write admin audit log to Firebase:', error);
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
      console.warn('Failed to read admin audit logs from Firebase:', error);
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
    setMockData('categories', ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring']);
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
        console.warn("Seed failed (likely permission or offline):", e);
    }
};

// --- Storage Service ---

export const uploadFile = async (file: File, path: string): Promise<string> => {
    const readFileAsBase64 = (f: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
        });
    };

    try {
        // Create a timeout promise (15 seconds) - Increased from 5s to avoid false positives on slow connections
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Upload timed out")), 15000)
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
        console.error("Firebase Storage Upload Failed or Timed Out:", error);
        
        // --- Fallback Protection ---
        // Firestore documents are limited to 1 MB. 
        // Base64 encoding increases size by ~33%. 
        // We set a safe limit of ~500KB for fallback files to avoid crashing the DB save.
        
        const MAX_FALLBACK_SIZE = 500 * 1024; // 500 KB

        if (file.size > MAX_FALLBACK_SIZE) {
            console.warn(`File ${file.name} is too large for local DB storage. Using temporary Blob URL.`);
            // Use Blob URL for immediate session playback (works for video/large images)
            // NOTE: This URL will expire on page refresh, but allows the demo to work without crashing.
            return URL.createObjectURL(file);
        }
        
        // Return Base64 string if small enough (Persistent in LocalStorage)
        return await readFileAsBase64(file);
    }
};

// --- Products Service ---

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
      const normalized = fbProducts.map(normalizeProductColors);
      productsCache = { data: normalized, ts: Date.now() };
      return normalized;
    } catch (error) {
      if (isAbortLikeError(error) || isPermissionDeniedError(error)) {
        const localProducts = getMockData<Product[]>('products', INITIAL_PRODUCTS).map(normalizeProductColors);
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

export const getProductById = async (id: string): Promise<Product | undefined> => {
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const localFound = products.find((p) => p.id === id);
  if (localFound) return normalizeProductColors(localFound);

  try {
      const docRef = doc(db, 'products', id);
      const docSnap = await withTimeout(getDoc(docRef), 4500);
      if (docSnap.exists()) {
        const remoteProduct = normalizeProductColors({ ...(docSnap.data() as Product), id: docSnap.id });
        const nextProducts = [remoteProduct, ...products.filter((p) => p.id !== id)];
        setMockData('products', nextProducts);
        return remoteProduct;
      }
  } catch (e) { }

  try {
      const allProducts = await getProducts();
      return allProducts.find((p) => p.id === id);
  } catch (e) {
      return undefined;
  }
};

export const addProduct = async (product: Product): Promise<void> => {
  const cleanProduct = deepSanitize(normalizeProductColors(product));
  
  // Local - SAVE HERE FIRST (Source of truth for immediate UI update)
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  // Ensure ID
  const newId = cleanProduct.id || `p_${Date.now()}`;
  cleanProduct.id = newId;
  
  products.push(cleanProduct);
  setMockData('products', products);

  // Firebase
  try {
      await ensureFirebaseConnection();
      if (newId) {

   // 🔒 ADDED: Prevent corrupted image URLs from reaching Firestore
   if ((cleanProduct as any).imageUrl && !isValidProductionUrl((cleanProduct as any).imageUrl)) {
       console.warn("Blocked invalid image URL from Firestore save.");
       delete (cleanProduct as any).imageUrl;
   }

   await setDoc(doc(db, 'products', newId), cleanProduct);
} else {

   if ((cleanProduct as any).imageUrl && !isValidProductionUrl((cleanProduct as any).imageUrl)) {
       console.warn("Blocked invalid image URL from Firestore save.");
       delete (cleanProduct as any).imageUrl;
   }

   await addDoc(collection(db, 'products'), cleanProduct);
}
  } catch (e: any) { 
      console.warn("Firebase save failed:", e);
      if (e.code === 'resource-exhausted' || e.message?.includes('exceeds the maximum allowed size')) {
          alert("Database Error: Product data size is too large (likely due to offline images/videos). Product saved locally only.");
      }
  }
};

export const updateProduct = async (product: Product): Promise<void> => {
  const cleanProduct = deepSanitize(normalizeProductColors(product));
  
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const idx = products.findIndex(p => p.id === cleanProduct.id);
  if (idx !== -1) {
      products[idx] = cleanProduct;
      setMockData('products', products);
  }

  // Firebase
  try {
      await ensureFirebaseConnection();
      const docRef = doc(db, 'products', cleanProduct.id);
     // 🔒 ADDED: Prevent corrupted image URLs from Firestore update
if ((cleanProduct as any).imageUrl && !isValidProductionUrl((cleanProduct as any).imageUrl)) {
    console.warn("Blocked invalid image URL from Firestore update.");
    delete (cleanProduct as any).imageUrl;
}

await updateDoc(docRef, { ...cleanProduct });
  } catch (e: any) {
      console.warn("Firebase update failed:", e);
      if (e.code === 'resource-exhausted' || e.message?.includes('exceeds the maximum allowed size')) {
          alert("Database Error: Product data size is too large. Product updated locally only.");
      }
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  setMockData('products', products.filter(p => p.id !== id));

  // Firebase
  try {
      await ensureFirebaseConnection();
      await deleteDoc(doc(db, 'products', id));
  } catch (e) { }
};

// --- Category Service ---
export const getCategories = async (): Promise<string[]> => {
  const localCats = getMockData<string[]>('categories', ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring']);
  try {
    await ensureFirebaseConnection();
    const querySnapshot = await withTimeout(getDocs(collection(db, 'categories')), 1200);
    const cats: string[] = [];
    querySnapshot.forEach((categoryDoc) => cats.push(categoryDoc.data().name));
    if (cats.length > 0) {
      setMockData('categories', cats);
      return cats;
    }
  } catch (error) {
    if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
      console.warn('Failed to fetch categories from Firebase:', error);
    }
  }
  return localCats;
};

export const addCategory = async (category: string): Promise<void> => {
  const cats = getMockData<string[]>('categories', []);
  if (!cats.includes(category)) {
      cats.push(category);
      setMockData('categories', cats);
  }

  try {
      await ensureFirebaseConnection();
      
      const catCol = collection(db, 'categories');
      const snapshot = await getDocs(catCol);

      // CRITICAL: If DB is empty, seed defaults first so we don't lose the "previous" ones.
      if (snapshot.empty) {
          const defaults = ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring'];
          for (const def of defaults) {
              if (def !== category) { 
                  await addDoc(catCol, { name: def });
              }
          }
      }
      
      // Check if this specific category already exists in DB to avoid duplicates
      let exists = false;
      snapshot.forEach(doc => {
          if (doc.data().name === category) exists = true;
      });

      if (!exists) {
          await addDoc(catCol, { name: category });
      }
  } catch (e) { 
      console.error("Error adding category:", e);
  }
};

export const deleteCategory = async (category: string): Promise<void> => {
  const cats = getMockData<string[]>('categories', []);
  setMockData('categories', cats.filter(c => c !== category));

  try {
      await ensureFirebaseConnection();
      const q = query(collection(db, 'categories'), where('name', '==', category));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (d) => {
        await deleteDoc(doc(db, 'categories', d.id));
      });
  } catch (e) { }
};

// --- Auth Service ---

export const registerUser = async (email: string, password: string, phone: string): Promise<User> => {
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

    const newUser: User = {
        id: `user_${Date.now()}`,
        name: normalizedEmail.split('@')[0] || 'User',
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        role: 'user',
        addresses: [],
        permissions: {}
    };
    const cleanUser = deepSanitize(newUser);

    // Firebase (strict - no local-only demo fallback)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const firebaseUser = userCredential.user;
      if (!firebaseUser) {
        throw new Error('Unable to create account right now.');
      }
      cleanUser.id = firebaseUser.uid; // Update ID to match Firebase
      await setDoc(doc(db, 'users', firebaseUser.uid), cleanUser);
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/email-already-in-use') {
        throw new Error('Email already registered');
      }
      if (code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      if (code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }
      throw new Error('Registration failed. Please try again.');
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
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const remoteUser = docSnap.data() as User;
      const remotePhone = remoteUser.phone ? normalizeIndianPhone(remoteUser.phone) : undefined;
      if (normalizedPhone && remotePhone && remotePhone !== normalizedPhone) {
        throw new Error('Phone number does not match this account');
      }
      return applyRoleByEmail(remoteUser);
    }

    return applyRoleByEmail({
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      role: 'user',
      addresses: [],
      permissions: {}
    });
  } catch (e: any) {
    const firebaseErrorCode = e?.code || '';
    if (firebaseErrorCode === 'auth/user-not-found' || firebaseErrorCode === 'auth/invalid-credential') {
      throw new Error('Account not found. Please sign up first.');
    }
    if (firebaseErrorCode === 'auth/wrong-password') {
      throw new Error('Incorrect password.');
    }
    if (firebaseErrorCode === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    }
    throw new Error('Login failed. Please use a registered email.');
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

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return applyRoleByEmail(userSnap.data() as User);
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
      await setDoc(userRef, deepSanitize(normalizedUser));
      return normalizedUser;
    }
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google login was cancelled.');
    }
    throw new Error('Google login failed. Demo login is disabled.');
  }
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
  phoneConfirmationResult = null;
  phoneVerificationId = null;
  recaptchaContainerInUse = null;
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
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
  }
};

const ensureRecaptchaVerifier = async (containerId: string): Promise<RecaptchaVerifier> => {
  if (recaptchaVerifier && recaptchaContainerInUse === containerId) {
    return recaptchaVerifier;
  }

  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container not found: #${containerId}`);
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
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
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
    recaptchaContainerInUse = null;
  }

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
    // Temporary diagnostics to pinpoint Firebase OTP credential rejection.
    // Remove once phone auth is stable in production.
    console.error('Phone OTP send failed', {
      code: (error as { code?: string })?.code,
      message: (error as { message?: string })?.message,
      customData: (error as { customData?: unknown })?.customData,
      phone: formattedPhone,
      container: recaptchaContainerId,
    });
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/invalid-verification-code') {
      throw new Error('Incorrect OTP');
    }
    throw new Error(mapPhoneAuthError(error));
  }
};

export const loginWithPhoneOtp = async (phone: string): Promise<User> => {
  const normalizedPhone = normalizeIndianPhone(phone);
  const nationalPhone = getIndianNationalPhone(phone);

  try {
    const q = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as User;
    }

    const qLegacy = query(collection(db, 'users'), where('phone', '==', nationalPhone));
    const queryLegacySnapshot = await getDocs(qLegacy);
    if (!queryLegacySnapshot.empty) {
      const userDoc = queryLegacySnapshot.docs[0];
      return userDoc.data() as User;
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
  return found;
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
        console.warn("Failed to update user address in Firebase:", e);
    }
};

export const addNewAdmin = async (email: string, name: string, password: string, permissions?: UserPermissions): Promise<void> => {
    // Local
    const users = upsertSuperAdmin(getMockData<User[]>('users', []));
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User with this email already exists');
    }
    users.push({
      id: `admin_${Date.now()}`,
      name,
      email,
      password,
      role: 'admin',
      addresses: [],
      permissions: { ...DEFAULT_ADMIN_PERMISSIONS, ...(permissions || {}) }
    });
    setMockData('users', users);

    try {
        await ensureFirebaseConnection();
        
        // Create in Firebase Auth using secondary app to avoid logging out current admin
        // We use the options from the main app to initialize the secondary one
        const secondaryApp = initializeApp(mainApp.options, "SecondaryApp");
        const secondaryAuth = getAuthFromApp(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;
        
        // Save user document
        await setDoc(doc(db, 'users', uid), { 
            id: uid,
            email, 
            name, 
            password,
            role: 'admin', 
            addresses: [],
            permissions: { ...DEFAULT_ADMIN_PERMISSIONS, ...(permissions || {}) }
        });

        // Cleanup
        await deleteApp(secondaryApp);

    } catch(e) { 
        console.error("Error adding admin to Firebase:", e);
        throw e;
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
        console.warn("Failed to demote admin in Firebase:", e);
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    const localUsers = upsertSuperAdmin(getMockData<User[]>('users', []));
    setMockData('users', localUsers);
    try {
      await ensureFirebaseConnection();
      const querySnapshot = await withTimeout(getDocs(collection(db, 'users')), 1500);
      const fbUsers: User[] = [];
      querySnapshot.forEach((userDoc) => fbUsers.push(applyRoleByEmail(userDoc.data() as User)));
      const normalized = upsertSuperAdmin(fbUsers);
      setMockData('users', normalized);
      return normalized;
    } catch (error) {
      if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
        console.warn('Failed to fetch users from Firebase:', error);
      }
      return localUsers;
    }
};

export const verifyIndianPincode = async (
  pincode: string
): Promise<{ city: string; country: string } | null> => {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();
    if (!Array.isArray(data) || !data[0] || data[0].Status !== 'Success' || !data[0].PostOffice?.length) {
      return null;
    }
    const office = data[0].PostOffice[0];
    const city = office.District || office.Name;
    return { city, country: 'India' };
  } catch {
    return null;
  }
};

// --- Order Service ---

export const createOrder = async (
  userId: string,
  items: any[],
  total: number,
  address: Address,
  meta?: { phoneNumber?: string; paymentStatus?: 'Pending' | 'Paid' | 'Failed'; shippingDetails?: CheckoutShippingDetails }
): Promise<Order> => {
  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    userId,
    items,
    total,
    status: 'Processing',
    date: new Date().toISOString(),
    shippingAddress: address,
    shippingDetails: meta?.shippingDetails,
    phoneNumber: meta?.phoneNumber,
    paymentStatus: meta?.paymentStatus || 'Paid',
    createdAt: new Date().toISOString(),
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
            console.warn("Failed to update inventory for item", item.id, invError);
        }
    }
  } catch (error) {
    console.error("FIREBASE SAVE FAILED (Data might be undefined or Permissions denied):", error);
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
    try {
      await ensureFirebaseConnection();
      const ordersQuery = query(collection(db, 'orders'));
      const querySnapshot = await withTimeout(getDocs(ordersQuery), 2500);
      const fbOrders: Order[] = [];
      querySnapshot.forEach((orderDoc) => fbOrders.push({ ...(orderDoc.data() as Order), id: orderDoc.id }));

      const combined = [...fbOrders];
      localOrders.forEach((localOrder) => {
        if (!combined.find((remoteOrder) => remoteOrder.id === localOrder.id)) {
          combined.push(localOrder);
        }
      });
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      if (!isPermissionDeniedError(error) && !isAbortLikeError(error)) {
        console.warn('Failed to fetch orders from Firebase:', error);
      }
      return [...localOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  // 1. Get Local Orders
  const mockOrders = getMockData<Order[]>('orders', []);
  
  // 2. Fetch Firebase Orders
  let fbOrders: Order[] = [];
  try {
      await ensureFirebaseConnection();
      const q = query(collection(db, 'orders'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      // FORCE ID MAP: Explicitly overwrite the ID from the doc.id to ensure matching works
      querySnapshot.forEach((doc) => fbOrders.push({ ...(doc.data() as Order), id: doc.id }));
  } catch (e) { 
      console.warn("Failed to fetch user orders from Firebase", e);
  }

  // 3. Filter Local Orders
  const filteredMock = mockOrders.filter(o => o.userId === userId);

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
    // Local
    const localSettings = getMockData<WebsiteSettings>('settings', {
      primaryColor: '#0ea5e9',
      logoUrl: '',
      footerSections: DEFAULT_FOOTER_SECTIONS,
      pageContent: DEFAULT_PAGE_CONTENT
    });
    
    // Firebase
    try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as WebsiteSettings;
            return {
              primaryColor: data.primaryColor || '#0ea5e9',
              logoUrl: data.logoUrl || '',
              footerSections: data.footerSections?.length ? data.footerSections : DEFAULT_FOOTER_SECTIONS,
              pageContent: data.pageContent || DEFAULT_PAGE_CONTENT
            };
        }
    } catch(e) { }
    
    return localSettings;
};

export const updateWebsiteSettings = async (settings: WebsiteSettings): Promise<void> => {
    setMockData('settings', settings);
    try {
        await ensureFirebaseConnection();
        const docRef = doc(db, 'settings', 'general');
        await setDoc(docRef, settings, { merge: true });
    } catch (e) { }
};
