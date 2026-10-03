import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let productId = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('productId') || '';

    if (!productId) {
      const match = parsedUrl.pathname.match(/\/api\/product-image\/([^/?#]+)/i);
      if (match) productId = decodeURIComponent(match[1]);
    }

    if (!productId) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Product ID is required');
      return;
    }

    // Load from Firestore
    let productData: any = null;
    let rawImage: string = '';
    try {
      let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        try {
          firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (err) {}
      }

      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const db = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);

      // If ID starts with img-, check uploaded_images collection first
      if (productId.startsWith('img-')) {
        const imgDoc = await getDoc(doc(db, 'uploaded_images', productId));
        if (imgDoc.exists()) {
          const imgData = imgDoc.data();
          if (imgData.data_url) {
            rawImage = imgData.data_url;
            productData = { id: productId, image_url: imgData.data_url };
          }
        }
      }

      if (!productData) {
        // Try by document ID first
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          productData = docSnap.data();
        } else {
          // Query by id field
          const qId = query(collection(db, 'products'), where('id', '==', productId));
          const qSnap = await getDocs(qId);
          if (!qSnap.empty) {
            productData = qSnap.docs[0].data();
          } else {
            // Query by slug
            const qSlug = query(collection(db, 'products'), where('slug', '==', productId));
            const slugSnap = await getDocs(qSlug);
            if (!slugSnap.empty) {
              productData = slugSnap.docs[0].data();
            }
          }
        }
      }
    } catch (e) {
      console.warn('Firestore fetch failed in product-image handler:', e);
    }

    // Fallback to local maxora_db.json
    if (!productData) {
      try {
        const dbPath = path.join(process.cwd(), 'maxora_db.json');
        if (fs.existsSync(dbPath)) {
          const localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          if (Array.isArray(localDb.products)) {
            productData = localDb.products.find(
              (p: any) => p.id === productId || p.slug === productId
            );
          }
        }
      } catch (err) {}
    }

    if (!productData) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Product not found');
      return;
    }

    // Determine the product image
    if (!rawImage) {
      if (productData.image_url && typeof productData.image_url === 'string') {
        rawImage = productData.image_url;
      } else if (Array.isArray(productData.images) && productData.images.length > 0) {
        rawImage = productData.images[0];
      } else if (typeof productData.images === 'string') {
        try {
          const parsed = JSON.parse(productData.images);
          if (Array.isArray(parsed) && parsed.length > 0) rawImage = parsed[0];
        } catch {
          rawImage = productData.images;
        }
      } else if (productData.og_image && typeof productData.og_image === 'string') {
        rawImage = productData.og_image;
      }
    }

    rawImage = (rawImage || '').trim();

    if (!rawImage) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Product image not found');
      return;
    }

    // Case 1: Base64 data URI
    if (rawImage.startsWith('data:')) {
      const match = rawImage.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        const contentType = match[1] || 'image/webp';
        const buffer = Buffer.from(match[2], 'base64');

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length.toString());
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
        res.end(buffer);
        return;
      }
    }

    // Case 2: Public HTTPS URL
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      const redirectUrl = rawImage.startsWith('http://')
        ? rawImage.replace(/^http:\/\//i, 'https://')
        : rawImage;
      res.statusCode = 302;
      res.setHeader('Location', redirectUrl);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end();
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Unsupported image format');
  } catch (err: any) {
    console.error('Error serving product image:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}
