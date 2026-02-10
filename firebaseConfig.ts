// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your Apps
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);