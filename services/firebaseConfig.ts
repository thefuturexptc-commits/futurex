
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
<<<<<<< HEAD
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

// Replace these with your actual Firebase project configuration
// or ensure these environment variables are set in your .env file
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};



=======
import { getAuth } from 'firebase/auth';

// Replace these with your actual Firebase project configuration
// or ensure these environment variables are set in your .env file
const firebaseConfig = {
  apiKey: "AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc",
  authDomain: "futurexweb-ae46b.firebaseapp.com",
  projectId: "futurexweb-ae46b",
  storageBucket: "futurexweb-ae46b.firebasestorage.app",
  messagingSenderId: "721727785001",
  appId: "1:721727785001:web:f0ed7c4ed7555e018ef438",
  measurementId: "G-JD32TH0PJS"
};

>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
// Initialize Firebase (using modular SDK)
// We export 'app' so other services can access the config/options
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

<<<<<<< HEAD
void setPersistence(auth, browserLocalPersistence).catch(() => {
  // Keep default persistence if explicit local persistence cannot be set.
});

export default app;

=======
export default app;
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
