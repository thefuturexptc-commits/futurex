import { 
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';
import firebase from 'firebase/compat/app';
import { db, auth } from './firebaseConfig';
import { Product, User, Order, Address, WebsiteSettings } from '../types';
import { INITIAL_PRODUCTS } from './mockData';

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
        const productsColl = collection(db, 'products');
        const snapshot = await getDocs(productsColl);
        if (snapshot.empty) {
            for (const p of INITIAL_PRODUCTS) {
                await setDoc(doc(db, 'products', p.id), p);
            }
        }
    } catch (e) {
        // Ignore firebase errors in seed
    }
};

// --- Products Service ---

export const getProducts = async (): Promise<Product[]> => {
  // 1. Get Local
  const localProducts = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  
  // 2. Try Firebase (Background Sync concept, but here we just fetch)
  try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      if (!querySnapshot.empty) {
          const fbProducts: Product[] = [];
          querySnapshot.forEach((doc) => {
            fbProducts.push({ ...doc.data(), id: doc.id } as Product);
          });
          // In a real hybrid app we might merge, but for demo let's prefer FB if available, else Local
          return fbProducts;
      }
  } catch (e) {
      // Firebase failed, ignore
  }
  
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
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  products.push({ ...product, id: product.id || `p_${Date.now()}` });
  setMockData('products', products);

  // Firebase
  try {
      if (product.id && product.id.startsWith('p')) {
         await setDoc(doc(db, 'products', product.id), product);
      } else {
         await addDoc(collection(db, 'products'), product);
      }
  } catch (e) { }
};

export const updateProduct = async (product: Product): Promise<void> => {
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  const idx = products.findIndex(p => p.id === product.id);
  if (idx !== -1) {
      products[idx] = product;
      setMockData('products', products);
  }

  // Firebase
  try {
      const docRef = doc(db, 'products', product.id);
      await updateDoc(docRef, { ...product });
  } catch (e) { }
};

export const deleteProduct = async (id: string): Promise<void> => {
  // Local
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  setMockData('products', products.filter(p => p.id !== id));

  // Firebase
  try {
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
      await addDoc(collection(db, 'categories'), { name: category });
  } catch (e) { }
};

export const deleteCategory = async (category: string): Promise<void> => {
  const cats = getMockData<string[]>('categories', []);
  setMockData('categories', cats.filter(c => c !== category));

  try {
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

    // Local
    const users = getMockData<User[]>('users', []);
    users.push(newUser);
    setMockData('users', users);

    // Firebase
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        if (firebaseUser) {
            newUser.id = firebaseUser.uid; // Update ID to match Firebase
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        }
    } catch (e) {
        console.warn("Auth failed/unavailable. Using local user.");
    }
    
    return newUser;
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    // 1. Hardcoded Admin (Always works)
    if (email === 'admin@gmail.com' && password === 'admin123') {
        const admin: User = { id: 'admin_1', name: 'Admin User', email, role: 'admin', addresses: [] };
        // Ensure admin is in local storage for order lookups
        const users = getMockData<User[]>('users', []);
        if(!users.find(u => u.id === 'admin_1')) {
            users.push(admin);
            setMockData('users', users);
        }
        return admin;
    }

    // 2. Try Firebase
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
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
    if (found) return found;

    throw new Error("Invalid credentials");
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
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
      await setDoc(userRef, newUser);
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
    return mockUser;
  }
};

export const addNewAdmin = async (email: string, name: string): Promise<void> => {
    // Local
    const users = getMockData<User[]>('users', []);
    users.push({ id: `admin_${Date.now()}`, name, email, role: 'admin', addresses: [] });
    setMockData('users', users);

    try {
        await addDoc(collection(db, 'invites'), { email, name, role: 'admin', created: new Date() });
    } catch(e) { }
};

export const getAllUsers = async (): Promise<User[]> => {
    const localUsers = getMockData<User[]>('users', []);
    
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const fbUsers: User[] = [];
        querySnapshot.forEach((doc) => fbUsers.push(doc.data() as User));
        
        // Merge without duplicates
        const combined = [...localUsers];
        fbUsers.forEach(fbU => {
            if (!combined.find(u => u.id === fbU.id)) combined.push(fbU);
        });
        return combined;
    } catch(e) {
        return localUsers;
    }
};

// --- Order Service ---

export const createOrder = async (userId: string, items: any[], total: number, address: Address): Promise<Order> => {
  // Sanitize items (JSON stringify/parse removes undefined or non-serializable data)
  const cleanItems = JSON.parse(JSON.stringify(items));
  
  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    userId,
    items: cleanItems,
    total,
    status: 'Processing',
    date: new Date().toISOString(),
    shippingAddress: address
  };

  // 1. ALWAYS Save to LocalStorage first (Source of truth for Demo)
  const localOrders = getMockData<Order[]>('orders', []);
  localOrders.push(newOrder);
  setMockData('orders', localOrders);

  // 2. Try Firebase (Best effort)
  try {
    console.log("Saving order to Firebase...", newOrder);
    await setDoc(doc(db, 'orders', newOrder.id), newOrder);
    console.log("Order saved successfully to Firebase");
    
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
    console.error("FIREBASE SAVE FAILED:", error);
    // We ignore the error so the user flow continues (Local storage fallback active)
  }
  
  // Local Inventory Reduction
  const products = getMockData<Product[]>('products', INITIAL_PRODUCTS);
  items.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.quantity);
  });
  setMockData('products', products);

  return newOrder;
};

// New: Explicitly fetch all orders for Admin
export const getAllOrders = async (): Promise<Order[]> => {
    const localOrders = getMockData<Order[]>('orders', []);
    let fbOrders: Order[] = [];
    
    try {
        const q = query(collection(db, 'orders'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => fbOrders.push(doc.data() as Order));
    } catch (e) {
        console.error("Error fetching admin orders:", e);
    }

    // Merge logic
    const combined = [...localOrders];
    fbOrders.forEach(fbO => {
        if (!combined.find(o => o.id === fbO.id)) combined.push(fbO);
    });

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  // 1. Get Local Orders
  const mockOrders = getMockData<Order[]>('orders', []);
  
  // 2. Fetch Firebase Orders
  let fbOrders: Order[] = [];
  try {
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
        const docRef = doc(db, 'settings', 'general');
        await setDoc(docRef, settings, { merge: true });
    } catch (e) { }
};