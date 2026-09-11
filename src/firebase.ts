import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

// Fallback direct credentials embedded so Vercel builds always link to the correct Firestore database
const DEFAULT_FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0786093112",
  appId: "1:69433257808:web:fb4fbbe84e9a5188354655",
  apiKey: "AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg",
  authDomain: "gen-lang-client-0786093112.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5",
  storageBucket: "gen-lang-client-0786093112.firebasestorage.app",
  messagingSenderId: "69433257808",
};

const firebaseConfig = {
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || localConfig.appId || DEFAULT_FIREBASE_CONFIG.appId,
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || localConfig.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
  firestoreDatabaseId: metaEnv.VITE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore safely with exact database ID
let firestoreDb: any;
try {
  const dbId = firebaseConfig.firestoreDatabaseId || 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5';
  firestoreDb = getFirestore(app, dbId);
} catch (err) {
  console.warn('Initializing named Firestore failed, falling back to default instance:', err);
  try {
    firestoreDb = getFirestore(app);
  } catch (err2) {
    console.error('Firestore initialization error:', err2);
  }
}

export const db = firestoreDb;
export default app;
