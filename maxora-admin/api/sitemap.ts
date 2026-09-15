import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

const BASE_URL = 'https://maxora-store-ruby.vercel.app';

// Static configuration fallback to guarantee serverless execution even if filesystem root is isolated
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanSlug(text: string): string {
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

function isPublicIndexableProduct(data: any): boolean {
  if (!data) return false;

  // Active check (boolean, string, or number)
  if (data.active === 0 || data.active === false || data.active === '0' || data.active === 'false') {
    return false;
  }

  // Status check (draft, inactive, archived, deleted, unpublished, hidden)
  if (data.status) {
    const statusStr = String(data.status).trim().toLowerCase();
    if (['draft', 'inactive', 'archived', 'deleted', 'unpublished', 'hidden'].includes(statusStr)) {
      return false;
    }
  }

  // Deletion flags
  if (data.deleted === true || data.deleted === 1 || data.deleted === '1' || data.is_deleted === true) {
    return false;
  }

  // Explicit published flag
  if (data.published === false || data.published === 'false' || data.published === 0 || data.published === '0') {
    return false;
  }

  // Must have a discernible title, name, slug, or ID
  if (!data.name && !data.title && !data.slug && !data.id) {
    return false;
  }

  return true;
}

function isPublicIndexableCategory(data: any): boolean {
  if (!data) return false;
  if (data.active === 0 || data.active === false || data.active === '0' || data.active === 'false') {
    return false;
  }
  if (data.status && ['inactive', 'archived', 'deleted', 'hidden'].includes(String(data.status).trim().toLowerCase())) {
    return false;
  }
  if (!data.name && !data.title && !data.slug && !data.id) {
    return false;
  }
  return true;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Resolve Firebase configuration
    let rawConfig: any = {};
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        console.warn('Warning: Could not read firebase-applet-config.json:', e);
      }
    }

    const firebaseConfig = {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || rawConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || rawConfig.appId || DEFAULT_FIREBASE_CONFIG.appId,
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || rawConfig.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
      firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    };

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);

    // Fetch live Firestore collections directly
    const [prodsSnap, catsSnap, subsSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'subcategories')),
    ]);

    const liveProducts: any[] = [];
    prodsSnap.forEach((doc) => {
      const data = doc.data();
      if (isPublicIndexableProduct(data)) {
        liveProducts.push({ ...data, id: String(data.id || doc.id) });
      }
    });

    const liveCategories: any[] = [];
    catsSnap.forEach((doc) => {
      const data = doc.data();
      if (isPublicIndexableCategory(data)) {
        liveCategories.push({ ...data, id: String(data.id || doc.id) });
      }
    });

    const liveSubcategories: any[] = [];
    subsSnap.forEach((doc) => {
      const data = doc.data();
      if (isPublicIndexableCategory(data)) {
        liveSubcategories.push({ ...data, id: String(data.id || doc.id) });
      }
    });

    // Dynamic Product URLs: iterates dynamically over ALL returned Firestore products without hardcoding
    const productUrls = liveProducts
      .map((p) => {
        const slug = cleanSlug(p.slug || p.name || String(p.id));
        if (!slug) return '';
        const rawDate = p.updated_at || p.created_at || today;
        const lastMod = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const validDate = /^\d{4}-\d{2}-\d{2}$/.test(lastMod) ? lastMod : today;
        return `  <url>
    <loc>${escapeXml(`${BASE_URL}/product/${slug}`)}</loc>
    <lastmod>${escapeXml(validDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
      })
      .filter(Boolean)
      .join('\n');

    // Dynamic Category URLs
    const categoryUrls = liveCategories
      .map((c) => {
        const slug = cleanSlug(c.slug || c.name || c.id);
        if (!slug) return '';
        const rawDate = c.updated_at || c.created_at || today;
        const lastMod = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const validDate = /^\d{4}-\d{2}-\d{2}$/.test(lastMod) ? lastMod : today;
        return `  <url>
    <loc>${escapeXml(`${BASE_URL}/category/${slug}`)}</loc>
    <lastmod>${escapeXml(validDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .filter(Boolean)
      .join('\n');

    // Dynamic Subcategory URLs
    const subcategoryUrls = liveSubcategories
      .map((s) => {
        const cat = liveCategories.find((c) => String(c.id) === String(s.category_id) || c.slug === s.category_slug);
        const catSlug = cleanSlug(cat?.slug || cat?.name || s.category_slug || s.category_name || s.category_id || '');
        const subSlug = cleanSlug(s.slug || s.name || s.id);
        if (!subSlug) return '';
        const loc = catSlug
          ? `${BASE_URL}/category/${catSlug}/${subSlug}`
          : `${BASE_URL}/category/${subSlug}`;
        const rawDate = s.updated_at || s.created_at || today;
        const lastMod = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const validDate = /^\d{4}-\d{2}-\d{2}$/.test(lastMod) ? lastMod : today;
        return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(validDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .filter(Boolean)
      .join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(`${BASE_URL}/`)}</loc>
    <lastmod>${escapeXml(today)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(`${BASE_URL}/track`)}</loc>
    <lastmod>${escapeXml(today)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${categoryUrls ? `${categoryUrls}\n` : ''}${subcategoryUrls ? `${subcategoryUrls}\n` : ''}${productUrls}
</urlset>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.end(sitemapXml);
  } catch (error) {
    console.error('Error generating dynamic Firestore sitemap:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Failed to generate dynamic sitemap');
  }
}
