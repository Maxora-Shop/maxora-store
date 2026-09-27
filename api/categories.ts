import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocs, setDoc, deleteDoc, collection, setLogLevel } from 'firebase/firestore';

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

function getFirebaseConfig() {
  try {
    const configPaths = [
      path.join(process.cwd(), 'firebase-applet-config.json'),
      path.join(__dirname, 'firebase-applet-config.json'),
      path.join(__dirname, '..', 'firebase-applet-config.json'),
    ];
    for (const cp of configPaths) {
      if (fs.existsSync(cp)) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(fs.readFileSync(cp, 'utf8')) };
      }
    }
  } catch {}
  return DEFAULT_FIREBASE_CONFIG;
}

function getFirestoreDb() {
  const cfg = getFirebaseConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(cfg);
  const dbId = cfg.firestoreDatabaseId;
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

function generateSlug(text: string): string {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0980-\u09ff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getDbPath(): string | null {
  const candidateDbPaths = [
    path.join(process.cwd(), 'maxora_db.json'),
    path.join(__dirname, 'maxora_db.json'),
    path.join(__dirname, '..', 'maxora_db.json'),
  ];
  for (const p of candidateDbPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-token');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const idParam = (urlObj.searchParams.get('id') || '').trim();
  const activeOnly = urlObj.searchParams.get('active') !== 'false' && urlObj.searchParams.get('all') !== 'true';

  // Helper to read incoming JSON body
  const readJsonBody = async () => {
    return new Promise<any>((resolve) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'));
        } catch {
          resolve({});
        }
      });
      req.on('error', () => resolve({}));
    });
  };

  // ==========================================
  // GET: Return all categories
  // ==========================================
  if (req.method === 'GET') {
    const catMap = new Map<string, any>();

    // 1. Baseline from maxora_db.json
    try {
      const dbPath = getDbPath();
      if (dbPath) {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (Array.isArray(dbData.categories)) {
          dbData.categories.forEach((c: any) => {
            const id = String(c.id || c.slug);
            catMap.set(id, { ...c, id });
          });
        }
      }
    } catch (e) {
      console.warn('Local db read in GET /api/categories error:', e);
    }

    // 2. Query Firestore with 2.5s timeout
    try {
      const db = getFirestoreDb();
      const firestorePromise = getDocs(collection(db, 'categories'));
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 2500)
      );
      const snap = await Promise.race([firestorePromise, timeoutPromise]);
      if (snap && 'forEach' in snap) {
        snap.forEach((d: any) => {
          const data = d.data();
          const id = String(data.id || d.id);
          catMap.set(id, { ...data, id });
        });
      }
    } catch (e) {
      console.warn('Firestore read in GET /api/categories note:', e);
    }

    let list = Array.from(catMap.values());
    if (activeOnly) {
      list = list.filter((c) => c.active !== 0 && c.active !== false && String(c.active) !== '0');
    }
    list.sort((a, b) => Number(a.display_order ?? 999) - Number(b.display_order ?? 999));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, categories: list }));
    return;
  }

  // ==========================================
  // POST: Add or Update Category
  // ==========================================
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody();
      if (!body.name || !String(body.name).trim()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Category name is required' }));
        return;
      }

      const name = String(body.name).trim();
      const rawSlug = body.slug ? String(body.slug).trim() : generateSlug(name);
      const slug = generateSlug(rawSlug) || generateSlug(name) || 'category';
      const catId = String(body.id || `cat-${slug}`);

      const formattedCat = {
        ...body,
        id: catId,
        name,
        slug,
        icon: body.icon || 'Sparkles',
        image_url: body.image_url || '',
        display_order: Number(body.display_order ?? 999),
        active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
        meta_title: body.meta_title || '',
        meta_description: body.meta_description || '',
        created_at: body.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Sync to Firestore (with 2.5s timeout)
      try {
        const db = getFirestoreDb();
        const firestorePromise = setDoc(doc(db, 'categories', catId), cleanForFirestore(formattedCat), { merge: true });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500));
        await Promise.race([firestorePromise, timeoutPromise]);
      } catch (fsErr) {
        console.warn('Firestore setDoc category note:', fsErr);
      }

      // 2. Update maxora_db.json on disk if available
      try {
        const dbPath = getDbPath();
        if (dbPath) {
          const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          if (!Array.isArray(dbData.categories)) dbData.categories = [];
          const idx = dbData.categories.findIndex((c: any) => String(c.id) === catId || c.slug === slug);
          if (idx >= 0) dbData.categories[idx] = formattedCat;
          else dbData.categories.push(formattedCat);
          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
        }
      } catch (diskErr) {
        console.warn('Failed to write category to maxora_db.json:', diskErr);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, category: formattedCat }));
      return;
    } catch (err: any) {
      console.error('POST /api/categories error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to save category' }));
      return;
    }
  }

  // ==========================================
  // DELETE: Delete Category
  // ==========================================
  if (req.method === 'DELETE') {
    const targetId = idParam;
    if (!targetId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Category ID is required' }));
      return;
    }

    // 1. Delete from Firestore
    try {
      const db = getFirestoreDb();
      const firestorePromise = deleteDoc(doc(db, 'categories', targetId));
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500));
      await Promise.race([firestorePromise, timeoutPromise]);
    } catch (e) {
      console.warn('Firestore delete category note:', e);
    }

    // 2. Delete from maxora_db.json
    try {
      const dbPath = getDbPath();
      if (dbPath) {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (Array.isArray(dbData.categories)) {
          dbData.categories = dbData.categories.filter((c: any) => String(c.id) !== targetId && c.slug !== targetId);
          fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
        }
      }
    } catch (diskErr) {
      console.warn('Failed to delete category from maxora_db.json:', diskErr);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, message: 'Category deleted' }));
    return;
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
}
