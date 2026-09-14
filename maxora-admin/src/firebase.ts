import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import localConfig from '../firebase-applet-config.json';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

// Support both environment variables (e.g. on Vercel) and committed local configuration
const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || localConfig.appId,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  firestoreDatabaseId: metaEnv.VITE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore safely with named database fallback
let firestoreDb: any;
try {
  firestoreDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
} catch (err) {
  console.warn('Initializing named Firestore failed, falling back to default instance:', err);
  try {
    firestoreDb = getFirestore(app);
  } catch (err2) {
    console.error('Firestore initialization error:', err2);
  }
}

export const db = firestoreDb;

// Initialize Firebase Storage safely
let storageInstance: FirebaseStorage | null = null;
try {
  const bucket = firebaseConfig.storageBucket || `${firebaseConfig.projectId}.firebasestorage.app`;
  storageInstance = getStorage(app, bucket);
} catch (err) {
  console.warn('Initializing Firebase Storage failed in admin:', err);
  try {
    storageInstance = getStorage(app);
  } catch (err2) {
    console.error('Fallback Firebase Storage initialization error in admin:', err2);
  }
}

export const storage = storageInstance;
export default app;
