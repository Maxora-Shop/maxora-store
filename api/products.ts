import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection, setLogLevel } from 'firebase/firestore';

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
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
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

// In-memory cache for fast read responses on serverless edge
let cachedProducts: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-token');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;
  const returnAll = searchParams.get('all') === 'true' || searchParams.get('admin') === 'true' || pathname.includes('/admin/');
  let productIdParam = searchParams.get('id') || '';

  // Extract ID from pathname if passed as /api/products/prod-123 or /api/admin/products/prod-123
  if (!productIdParam) {
    const matches = pathname.match(/\/(?:admin\/)?products\/([^/?#]+)/);
    if (matches && matches[1]) {
      productIdParam = decodeURIComponent(matches[1]);
    }
  }

  const db = getFirestoreDb();

  // ==========================================
  // GET: Fetch products or single product
  // ==========================================
  if (req.method === 'GET') {
    try {
      // Single product lookup
      if (productIdParam) {
        const snap = await getDoc(doc(db, 'products', productIdParam));
        if (!snap.exists()) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Product not found' }));
          return;
        }
        const data = snap.data();
        const discount = Number(data.discount || 0);
        const price = Number(data.selling_price || 0);
        const finalPrice = Math.max(0, price - discount);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: true,
          product: {
            ...data,
            id: snap.id,
            final_price: finalPrice,
          },
        }));
        return;
      }

      // Check in-memory cache
      const now = Date.now();
      if (cachedProducts.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
        let prods = returnAll
          ? cachedProducts
          : cachedProducts.filter((p) => p.active !== 0 && p.active !== false && String(p.active) !== '0');

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, products: prods }));
        return;
      }

      // Query Firestore
      const snap = await getDocs(collection(db, 'products'));
      const prods: any[] = [];
      if (!snap.empty) {
        snap.forEach((docSnap) => {
          const item = docSnap.data();
          const pId = String(item.id || docSnap.id);
          const pName = String(item.name || '').trim();
          if (!pName) return;

          const discount = Number(item.discount || 0);
          const price = Number(item.selling_price || 0);
          const finalPrice = Math.max(0, price - discount);

          prods.push({
            ...item,
            id: pId,
            selling_price: price,
            discount,
            final_price: finalPrice,
            stock: Number(item.stock !== undefined ? item.stock : 0),
            images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image_url ? [item.image_url] : []),
          });
        });
      }

      // Sort by created_at descending
      prods.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      cachedProducts = prods;
      cacheTimestamp = Date.now();

      const filtered = returnAll
        ? prods
        : prods.filter((p) => p.active !== 0 && p.active !== false && String(p.active) !== '0');

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, products: filtered }));
      return;
    } catch (err: any) {
      console.error('Error fetching products from Firestore:', err);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, products: cachedProducts || [] }));
      return;
    }
  }

  // Helper to read incoming JSON body
  const readJsonBody = async () => {
    return new Promise<any>((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
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
  // POST: Add new product
  // ==========================================
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody();
      if (!body.name) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Product name is required' }));
        return;
      }

      const pId = String(body.id || `prod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`);
      const newProd = {
        ...body,
        id: pId,
        created_at: body.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: body.active !== undefined ? (body.active ? 1 : 0) : 1,
      };

      const firestoreData = cleanForFirestore(newProd);
      await setDoc(doc(db, 'products', pId), firestoreData, { merge: true });

      // Invalidate memory cache
      cachedProducts = [newProd, ...cachedProducts.filter((p) => p.id !== pId)];
      cacheTimestamp = Date.now();

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, product: newProd, id: pId }));
      return;
    } catch (err: any) {
      console.error('Error adding product in Firestore:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message || 'Failed to add product' }));
      return;
    }
  }

  // ==========================================
  // PUT: Update existing product
  // ==========================================
  if (req.method === 'PUT') {
    try {
      const body = await readJsonBody();
      const pId = String(productIdParam || body.id);
      if (!pId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Product ID is required for update' }));
        return;
      }

      const updatedProd = {
        ...body,
        id: pId,
        updated_at: new Date().toISOString(),
      };

      const firestoreData = cleanForFirestore(updatedProd);
      await setDoc(doc(db, 'products', pId), firestoreData, { merge: true });

      // Update memory cache
      const existingIdx = cachedProducts.findIndex((p) => p.id === pId);
      if (existingIdx >= 0) {
        cachedProducts[existingIdx] = { ...cachedProducts[existingIdx], ...updatedProd };
      } else {
        cachedProducts.unshift(updatedProd);
      }
      cacheTimestamp = Date.now();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, product: updatedProd }));
      return;
    } catch (err: any) {
      console.error('Error updating product in Firestore:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message || 'Failed to update product' }));
      return;
    }
  }

  // ==========================================
  // DELETE: Remove product
  // ==========================================
  if (req.method === 'DELETE') {
    try {
      const pId = String(productIdParam);
      if (!pId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Product ID is required for deletion' }));
        return;
      }

      await deleteDoc(doc(db, 'products', pId));

      // Remove from memory cache
      cachedProducts = cachedProducts.filter((p) => p.id !== pId);
      cacheTimestamp = Date.now();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    } catch (err: any) {
      console.error('Error deleting product in Firestore:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message || 'Failed to delete product' }));
      return;
    }
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
}
