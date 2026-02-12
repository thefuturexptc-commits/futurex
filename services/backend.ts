import { 
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import { Product, User, Order, Address, WebsiteSettings } from '../types';
import { INITIAL_PRODUCTS } from './mockData';

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
const getMockData = <T>(key: string, defaultVal: T): T => {
    try {
        const stored = localStorage.getItem(`mock_${key}`);
        return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

const setMockData = (key: string, data: any) => {
    try {
        localStorage.setItem(`mock_${key}`, JSON.stringify(data));
    } catch (e) {
        console.error("Local storage error", e);
    }
};

// --- Helper: Ensure Firebase Connection (Fix for Normal Users) ---
// If a user is "Local" (failed auth) or Admin, they might not have a Firebase Session.
// We force an anonymous sign-in so they can still read/write to Firestore if rules allow.
const ensureFirebaseConnection = async () => {
    if (!auth.currentUser) {
        try {
            console.log("No active Firebase user. Attempting anonymous sign-in for DB access...");
            await signInAnonymously(auth);
            console.log("Anonymous connection established.");
        } catch (e) {
            console.warn("Anonymous auth failed (Database might be unreachable):", e);
        }
    }
};

// --- Helper: Seed Database ---
export const seedDatabase = async () => {
    console.log("Seeding database...");
    
    // Ensure we have products in local storage
    const currentProducts = getMockData<Product[]>('products', []);
    if (currentProducts.length === 0) {
        setMockData('products', INITIAL_PRODUCTS);
    }
    setMockData('categories', ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring']);
    
    try {
        await ensureFirebaseConnection();
        const productsColl = collection(db, 'products');
        const snapshot = await getDocs(productsColl);
        if (snapshot.empty) {
            for (const p of INITIAL_PRODUCTS) {
                const cleanP = deepSanitize(p);
                await setDoc(doc(db, 'products', p.id), cleanP);
            }
        }
    } catch (e) {
        console.warn("Seed failed (likely permission or offline):", e);
    }
};

// --- Products Service ---

export const getProducts = async (): Promise<Product[]> => {
  // 1. Get Local
  const localProducts = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  
  // 2. Try Firebase 
  try {
      // Don't force auth for reading public products, but try if available
      const querySnapshot = await getDocs(collection(db, 'products'));
      if (!querySnapshot.empty) {
          const fbProducts: Product[] = [];
          querySnapshot.forEach((doc) => {
            fbProducts.push({ ...doc.data(), id: doc.id } as Product);
          });
          return fbProducts;
      }
  } catch (e) { }
  
  return localProducts;
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Product;
      }
  } catch (e) { }

  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  return products.find(p => p.id === id);
};

export const addProduct = async (product: Product): Promise<void> => {
  const cleanProduct = deepSanitize(product);
  
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  products.push({ ...cleanProduct, id: cleanProduct.id || `p_${Date.now()}` });
  setMockData('products', products);

  // Firebase
  try {
      await ensureFirebaseConnection();
      if (cleanProduct.id && cleanProduct.id.startsWith('p')) {
         await setDoc(doc(db, 'products', cleanProduct.id), cleanProduct);
      } else {
         await addDoc(collection(db, 'products'), cleanProduct);
      }
  } catch (e) { }
};

export const updateProduct = async (product: Product): Promise<void> => {
  const cleanProduct = deepSanitize(product);
  
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
      await updateDoc(docRef, { ...cleanProduct });
  } catch (e) { }
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
  // Local
  const localCats = getMockData<string[]>('categories', ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring']);
  
  try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const cats: string[] = [];
      querySnapshot.forEach(doc => cats.push(doc.data().name));
      if (cats.length > 0) return cats;
  } catch (e) { }
  
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
      await addDoc(collection(db, 'categories'), { name: category });
  } catch (e) { }
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

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
    const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        role: 'user',
        addresses: []
    };
    const cleanUser = deepSanitize(newUser);

    // Local
    const users = getMockData<User[]>('users', []);
    users.push(cleanUser);
    setMockData('users', users);

    // Firebase
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        if (firebaseUser) {
            cleanUser.id = firebaseUser.uid; // Update ID to match Firebase
            await setDoc(doc(db, 'users', firebaseUser.uid), cleanUser);
        }
    } catch (e) {
        console.warn("Auth failed/unavailable. Using local user fallback.");
        // CRITICAL: Force anonymous connection so this 'local' user can still write orders to DB
        await ensureFirebaseConnection();
        // Try to save the user profile to DB even if Auth failed (so Admin sees them)
        try {
           await setDoc(doc(db, 'users', cleanUser.id), cleanUser);
        } catch(dbErr) { console.error("Could not save local user to DB", dbErr); }
    }
    
    return cleanUser;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    // 1. Hardcoded Admin (Always works)
    if (email === 'admin@gmail.com' && password === 'admin123') {
        const admin: User = { id: 'admin_1', name: 'Admin User', email, role: 'admin', addresses: [] };
        
        // Ensure admin is in local storage
        const users = getMockData<User[]>('users', []);
        if(!users.find(u => u.id === 'admin_1')) {
            users.push(admin);
            setMockData('users', users);
        }

        await ensureFirebaseConnection();
        return admin;
    }

    // 2. Try Firebase
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        if (firebaseUser) {
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return docSnap.data() as User;
            // Return basic info if doc missing
            return {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                role: 'user',
                addresses: []
            };
        }
    } catch (e) {
        // Fallback to Local
    }

    // 3. Local Check
    const users = getMockData<User[]>('users', []);
    const found = users.find(u => u.email === email);
    if (found) {
        await ensureFirebaseConnection(); // Ensure connection for local users too
        return found;
    }

    throw new Error("Invalid credentials");
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
      return userSnap.data() as User;
    } else {
      const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: 'user',
        addresses: []
      };
      await setDoc(userRef, deepSanitize(newUser));
      return newUser;
    }
  } catch (error) {
    // Simulate google login for demo
    const mockUser: User = {
        id: `google_${Date.now()}`,
        name: 'Demo Google User',
        email: 'demo@gmail.com',
        role: 'user',
        addresses: []
    };
    const users = getMockData<User[]>('users', []);
    users.push(mockUser);
    setMockData('users', users);
    
    await ensureFirebaseConnection(); // Ensure connection
    return mockUser;
  }
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

export const addNewAdmin = async (email: string, name: string): Promise<void> => {
    // Local
    const users = getMockData<User[]>('users', []);
    users.push({ id: `admin_${Date.now()}`, name, email, role: 'admin', addresses: [] });
    setMockData('users', users);

    try {
        await ensureFirebaseConnection();
        await addDoc(collection(db, 'invites'), { email, name, role: 'admin', created: new Date() });
    } catch(e) { }
};

export const getAllUsers = async (): Promise<User[]> => {
    const localUsers = getMockData<User[]>('users', []);
    
    try {
        // We try to fetch from DB, but don't force auth here as it's a read op often done by admin
        const querySnapshot = await getDocs(collection(db, 'users'));
        const fbUsers: User[] = [];
        querySnapshot.forEach((doc) => fbUsers.push(doc.data() as User));
        
        // Merge without duplicates (Prefer Firebase)
        const combined = [...fbUsers];
        localUsers.forEach(locU => {
            if (!combined.find(u => u.id === locU.id)) combined.push(locU);
        });
        return combined;
    } catch(e) {
        return localUsers;
    }
};

// --- Order Service ---

export const createOrder = async (userId: string, items: any[], total: number, address: Address): Promise<Order> => {
  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    userId,
    items,
    total,
    status: 'Processing',
    date: new Date().toISOString(),
    shippingAddress: address
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
    
    console.log("Saving order to Firebase...", cleanOrder);
    await setDoc(doc(db, 'orders', cleanOrder.id), cleanOrder);
    console.log("Order saved successfully to Firebase!");
    
    // Inventory reduction
    for (const item of items) {
        try {
            const pRef = doc(db, 'products', item.id);
            const pSnap = await getDoc(pRef);
            if(pSnap.exists()) {
                const currentStock = pSnap.data().stock;
                await updateDoc(pRef, { stock: Math.max(0, currentStock - item.quantity) });
            }
        } catch(invError) {
            console.warn("Failed to update inventory for item", item.id, invError);
        }
    }
  } catch (error) {
    console.error("FIREBASE SAVE FAILED (Data might be undefined or Permissions denied):", error);
  }
  
  // Local Inventory Reduction
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  items.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.quantity);
  });
  setMockData('products', products);

  return cleanOrder;
};

// New: Explicitly fetch all orders for Admin
export const getAllOrders = async (): Promise<Order[]> => {
    let fbOrders: Order[] = [];
    
    try {
        await ensureFirebaseConnection();
        console.log("Fetching all orders from Firebase...");
        const q = query(collection(db, 'orders'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => fbOrders.push(doc.data() as Order));
        console.log("Fetched orders from DB:", fbOrders.length);
    } catch (e) {
        console.error("Error fetching admin orders from DB (Check permissions):", e);
    }

    const localOrders = getMockData<Order[]>('orders', []);
    
    // Merge logic: Add local orders only if they are NOT in Firebase list
    const combined = [...fbOrders];
    localOrders.forEach(locO => {
        if (!combined.find(o => o.id === locO.id)) combined.push(locO);
    });

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      querySnapshot.forEach((doc) => fbOrders.push(doc.data() as Order));
  } catch (e) { }

  // 3. Filter Local Orders
  const filteredMock = mockOrders.filter(o => o.userId === userId);

  // 4. Merge
  const combined = [...filteredMock];
  fbOrders.forEach(fbO => {
      if (!combined.find(o => o.id === fbO.id)) combined.push(fbO);
  });
  
  return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  // Local
  const orders = getMockData<Order[]>('orders', []);
  const order = orders.find(o => o.id === orderId);
  if (order) {
      order.status = status;
      setMockData('orders', orders);
  }

  // Firebase
  try {
      await ensureFirebaseConnection();
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
  } catch (e) { }
};

// --- Settings Service ---

export const getWebsiteSettings = async (): Promise<WebsiteSettings> => {
    // Local
    const localSettings = getMockData<WebsiteSettings>('settings', { primaryColor: '#0ea5e9', logoUrl: '' });
    
    // Firebase
    try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as WebsiteSettings;
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