
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Replace these with your actual Firebase project configuration
// or ensure these environment variables are set in your .env file
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDx62Wa4HSx97I-91AqC3poaMzcNrpfKAc",
  authDomain: "futurexweb-ae46b.firebaseapp.com",
  projectId: "futurexweb-ae46b",
  storageBucket: "futurexweb-ae46b.firebasestorage.app",
  messagingSenderId: "721727785001",
  appId: "1:721727785001:web:f0ed7c4ed7555e018ef438",
  measurementId: "G-JD32TH0PJS"
};

// Initialize Firebase (using modular SDK)
// We export 'app' so other services can access the config/options
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;