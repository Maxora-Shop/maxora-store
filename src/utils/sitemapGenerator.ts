import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

export const SITEMAP_BASE_URL = 'https://maxora-store-ruby.vercel.app';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function cleanSlug(text: string): string {
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

export function isPublicIndexableProduct(data: any): boolean {
  if (!data) return false;

  // Active check: reject explicit 0, false, '0', 'false'
  if (data.active === 0 || data.active === false || data.active === '0' || data.active === 'false') {
    return false;
  }

  // Status check: reject draft, inactive, archived, deleted, unpublished, hidden
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

export function isPublicIndexableCategory(data: any): boolean {
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

/**
 * Connects directly to live Google Cloud Firestore and builds a 100% dynamic, future-proof XML Sitemap.
 * 
 * Guarantees:
 * 1. Firestore is the SOLE source of truth (no mock data, no static fallback, no hardcoded product list or count).
 * 2. Fully scales whether Firestore has 20, 30, 50, 100, or 1000+ products without requiring any code changes.
 * 3. Newly published products from the Admin Panel automatically appear immediately.
 * 4. Deleted or unpublished products are automatically excluded immediately without stale entries.
 */
export async function generateDynamicSitemapXml(baseUrl = SITEMAP_BASE_URL): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  let rawConfig: any = {};
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse firebase-applet-config.json:', e);
    }
  }

  const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || rawConfig.projectId,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || rawConfig.appId,
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || rawConfig.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
    firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId,
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

  // Directly query live Firestore collections
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

  // Dynamic Product XML URLs (Iterates over ALL eligible live products from Firestore)
  const productUrls = liveProducts
    .map((p) => {
      const slug = cleanSlug(p.slug || p.name || String(p.id));
      if (!slug) return '';
      const rawDate = p.updated_at || p.created_at || today;
      const lastMod = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(lastMod) ? lastMod : today;
      return `  <url>
    <loc>${escapeXml(`${baseUrl}/product/${slug}`)}</loc>
    <lastmod>${escapeXml(validDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  // Dynamic Category XML URLs
  const categoryUrls = liveCategories
    .map((c) => {
      const slug = cleanSlug(c.slug || c.name || c.id);
      if (!slug) return '';
      const rawDate = c.updated_at || c.created_at || today;
      const lastMod = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(lastMod) ? lastMod : today;
      return `  <url>
    <loc>${escapeXml(`${baseUrl}/category/${slug}`)}</loc>
    <lastmod>${escapeXml(validDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  // Dynamic Subcategory XML URLs
  const subcategoryUrls = liveSubcategories
    .map((s) => {
      const cat = liveCategories.find((c) => String(c.id) === String(s.category_id) || c.slug === s.category_slug);
      const catSlug = cleanSlug(cat?.slug || cat?.name || s.category_slug || s.category_name || s.category_id || '');
      const subSlug = cleanSlug(s.slug || s.name || s.id);
      if (!subSlug) return '';
      const loc = catSlug
        ? `${baseUrl}/category/${catSlug}/${subSlug}`
        : `${baseUrl}/category/${subSlug}`;
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(`${baseUrl}/`)}</loc>
    <lastmod>${escapeXml(today)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/track`)}</loc>
    <lastmod>${escapeXml(today)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${categoryUrls ? `${categoryUrls}\n` : ''}${subcategoryUrls ? `${subcategoryUrls}\n` : ''}${productUrls}
</urlset>`;
}
