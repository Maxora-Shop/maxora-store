import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
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

// Global in-memory cache on edge / serverless
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

  // GET: Return latest store settings
  if (req.method === 'GET') {
    try {
      const db = getFirestoreDb();
      const snap = await getDoc(doc(db, 'settings', 'store_settings'));
      if (snap.exists()) {
        const firestoreData = snap.data();
        memorySettingsCache = { ...(memorySettingsCache || {}), ...firestoreData };
      }
    } catch (e: any) {
      console.warn('Firestore settings read note (using cache):', e?.message || e);
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      settings: memorySettingsCache || {
        store_name: 'Maxora Shop BD',
        free_delivery_enabled: false,
        free_delivery_threshold: 2500,
        live_sales_popup_enabled: false,
        delivery_inside_dhaka: 70,
        delivery_sub_dhaka: 100,
        delivery_outside_dhaka: 130,
      },
    }));
    return;
  }

  // POST / PUT: Update settings
  if (req.method === 'POST' || req.method === 'PUT') {
    let bodyText = '';
    req.on('data', (chunk) => {
      bodyText += chunk;
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(bodyText || '{}');
        const updates = parsed.settings || parsed;

        if (updates.free_delivery_enabled !== undefined) {
          updates.free_delivery_enabled = Boolean(updates.free_delivery_enabled);
        }
        if (updates.live_sales_popup_enabled !== undefined) {
          updates.live_sales_popup_enabled = Boolean(updates.live_sales_popup_enabled);
        }
        if (updates.free_delivery_threshold !== undefined && updates.free_delivery_threshold !== null && updates.free_delivery_threshold !== '') {
          updates.free_delivery_threshold = Number(updates.free_delivery_threshold);
        }

        // Convert any external Cloudinary favicon URL to local relative path
        if (typeof updates.favicon_url === 'string' && updates.favicon_url.includes('cloudinary.com')) {
          updates.favicon_url = '/favicon.ico';
        }

        // Automatically offload data:image/ favicon directly to public/favicon.ico and public/uploads
        if (typeof updates.favicon_url === 'string' && updates.favicon_url.startsWith('data:image/')) {
          try {
            const matches = updates.favicon_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches[2]) {
              const mime = matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const isIco = mime.includes('ico') || mime.includes('x-icon') || mime.includes('vnd.microsoft.icon');
              const ext = isIco ? 'ico' : 'png';
              const publicDir = path.join(process.cwd(), 'public');
              const uploadDir = path.join(publicDir, 'uploads');
              if (!fs.existsSync(uploadDir)) {
                try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
              }
              try {
                fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buffer);
                fs.writeFileSync(path.join(uploadDir, `favicon.${ext}`), buffer);
                fs.writeFileSync(path.join(uploadDir, 'favicon.ico'), buffer);
                fs.writeFileSync(path.join(uploadDir, 'favicon.png'), buffer);
              } catch {}
              updates.favicon_url = '/favicon.ico';
            }
          } catch (favErr) {
            console.warn('Could not offload favicon data URL in api/settings:', favErr);
          }
        }

        // Automatically offload data:image/ logo to static server storage if present
        if (typeof updates.logo_url === 'string' && updates.logo_url.startsWith('data:image/')) {
          try {
            const matches = updates.logo_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches[2]) {
              const mime = matches[1];
              const buffer = Buffer.from(matches[2], 'base64');
              const ext = mime.includes('svg') ? 'svg' : 'png';
              const safeName = `logo-${Date.now()}.${ext}`;
              const uploadDir = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(uploadDir)) {
                try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
              }
              fs.writeFileSync(path.join(uploadDir, safeName), buffer);
              updates.logo_url = `/uploads/${safeName}`;
            }
          } catch (logoErr) {
            console.warn('Could not offload logo data URL in api/settings:', logoErr);
          }
        }

        // Merge into serverless memory cache immediately
        memorySettingsCache = {
          ...(memorySettingsCache || {}),
          ...updates,
          updated_at: new Date().toISOString(),
        };

        // Mirror to maxora_db.json if running in local environment
        try {
          const dbFilePath = path.join(process.cwd(), 'maxora_db.json');
          if (fs.existsSync(dbFilePath)) {
            const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
            dbData.settings = { ...(dbData.settings || {}), ...memorySettingsCache };
            fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2), 'utf8');
          }
        } catch (dbErr) {
          console.warn('Local db settings sync note:', dbErr);
        }

        // Persist to Firestore
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
