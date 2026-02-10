import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    onAuthStateChanged,
    ConfirmationResult
} from 'firebase/auth';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User, Order, Address } from '../types';

// Helper to format Firebase user to App User
const formatUser = async (fbUser: any): Promise<User> => {
    // Fetch additional user data from Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    return {
        id: fbUser.uid,
        name: fbUser.displayName || userData.name || 'User',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber,
        role: userData.role || 'user',
        addresses: userData.addresses || [],
        avatar: fbUser.photoURL || undefined
    };
};

// Singleton to hold confirmation result for phone auth
let phoneConfirmationResult: ConfirmationResult | null = null;

export const firebaseService = {
  // --- Auth ---
  
  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return formatUser(userCredential.user);
  },

  signup: async (name: string, email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role: 'user',
        addresses: []
    });

    return formatUser(userCredential.user);
  },

  loginWithGoogle: async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user doc exists, if not create it
    const userDocRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            name: result.user.displayName,
            email: result.user.email,
            role: 'user',
            addresses: []
        });
    }
    
    return formatUser(result.user);
  },

  // Step 1: Request OTP
  requestPhoneOtp: async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<boolean> => {
    try {
        phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return true;
    } catch (error) {
        console.error("Error sending OTP", error);
        throw error;
    }
  },

  // Step 2: Verify OTP
  verifyPhoneOtp: async (phoneNumber: string, otp: string): Promise<User> => {
    if (!phoneConfirmationResult) throw new Error("No OTP request found");
    
    const result = await phoneConfirmationResult.confirm(otp);
    const user = result.user;

    // Check/Create user doc
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            name: `User ${phoneNumber.slice(-4)}`,
            phone: phoneNumber,
            role: 'user',
            addresses: []
        });
    }

    return formatUser(user);
  },

  logout: async () => {
    await signOut(auth);
  },

  getCurrentUser: async (): Promise<User | null> => {
     return new Promise((resolve) => {
         const unsubscribe = onAuthStateChanged(auth, async (user) => {
             if (user) {
                 const appUser = await formatUser(user);
                 resolve(appUser);
             } else {
                 resolve(null);
             }
             unsubscribe();
         });
     });
  },

  // --- Database ---

  updateUserProfile: async (userId: string, data: Partial<User>): Promise<User> => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, data);
      
      // Return updated user
      const userSnap = await getDoc(userRef);
      // We need to merge with Auth state ideally, but here we just return DB state mixed with what we know
      return { id: userId, ...userSnap.data() } as User; 
  },

  createOrder: async (order: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> => {
      const orderData = {
          ...order,
          date: new Date().toISOString(),
          status: 'processing'
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      return {
          id: docRef.id,
          ...orderData
      } as Order;
  },

  getOrders: async (userId?: string): Promise<Order[]> => {
      let q;
      if (userId) {
          q = query(collection(db, 'orders'), where('userId', '==', userId));
      } else {
          q = query(collection(db, 'orders'));
      }
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      return orders;
  },

  addAddress: async (userId: string, address: Omit<Address, 'id'>): Promise<User> => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) throw new Error("User not found");
      
      const userData = userSnap.data();
      const currentAddresses: Address[] = userData.addresses || [];
      
      // If default, unset others
      if (address.isDefault) {
          currentAddresses.forEach(a => a.isDefault = false);
      }
      
      const newAddress = { ...address, id: Math.random().toString(36).substr(2, 9) };
      const updatedAddresses = [...currentAddresses, newAddress];
      
      await updateDoc(userRef, { addresses: updatedAddresses });
      
      // Return fully updated user structure
      return {
          id: userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          addresses: updatedAddresses,
          phone: userData.phone,
          avatar: userData.avatar
      };
  }
};