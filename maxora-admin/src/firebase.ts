import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "gen-lang-client-0786093112",
  appId: "1:69433257808:web:fb4fbbe84e9a5188354655",
  apiKey: "AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg",
  authDomain: "gen-lang-client-0786093112.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5",
  storageBucket: "gen-lang-client-0786093112.firebasestorage.app",
  messagingSenderId: "69433257808",
  measurementId: "",
  oAuthClientId: "69433257808-g09qphe52ikpab7b9fate61n3idts60j.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export default app;
