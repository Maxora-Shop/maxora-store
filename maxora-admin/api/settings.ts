import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

try {
  setLogLevel('error');
} catch (e) {}

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function getFirestoreDb() {
  const app = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  const dbId = DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
  return dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
}

function cleanForFirestore(data: any): any {
  if (data === null || data === undefined) return '';
  if (Array.isArray(data)) return data.map(cleanForFirestore);
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) cleaned[k] = cleanForFirestore(v);
    }
    return cleaned;
  }
  return data;
}

let memorySettingsCache: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-token');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const db = getFirestoreDb();
      const snap = await getDoc(doc(db, 'settings', 'store_settings'));
      if (snap.exists()) {
        const firestoreData = snap.data();
        memorySettingsCache = { ...(memorySettingsCache || {}), ...firestoreData };
      }
    } catch (e: any) {
      console.warn('Firestore settings read note:', e?.message || e);
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      settings: memorySettingsCache || {
        store_name: 'Maxora Shop BD',
        free_delivery_enabled: true,
        free_delivery_threshold: 2500,
        delivery_inside_dhaka: 70,
        delivery_sub_dhaka: 100,
        delivery_outside_dhaka: 130,
      },
    }));
    return;
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    let bodyText = '';
    req.on('data', (chunk) => {
      bodyText += chunk;
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(bodyText || '{}');
        const updates = parsed.settings || parsed;

        if (updates.free_delivery_threshold !== undefined && updates.free_delivery_threshold !== null && updates.free_delivery_threshold !== '') {
          updates.free_delivery_threshold = Number(updates.free_delivery_threshold);
        }

        memorySettingsCache = {
          ...(memorySettingsCache || {}),
          ...updates,
          updated_at: new Date().toISOString(),
        };

        try {
          const db = getFirestoreDb();
          await setDoc(doc(db, 'settings', 'store_settings'), cleanForFirestore(memorySettingsCache), { merge: true });
        } catch (fsErr: any) {
          console.warn('Firestore settings write note:', fsErr?.message || fsErr);
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          message: 'Settings updated successfully',
          settings: memorySettingsCache,
        }));
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to save settings' }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
}
