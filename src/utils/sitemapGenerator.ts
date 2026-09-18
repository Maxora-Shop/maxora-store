import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection, setLogLevel } from 'firebase/firestore';
import { CANONICAL_PRODUCTS, CANONICAL_CATEGORIES, CANONICAL_SUBCATEGORIES } from '../data/canonicalCatalog';

try {
  setLogLevel('error');
} catch (e) {}

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

export function buildSitemapXmlDocument(params: {
  baseUrl: string;
  products: readonly any[] | any[];
  categories: readonly any[] | any[];
  subcategories: readonly any[] | any[];
}): string {
  const { baseUrl, products, categories, subcategories } = params;
  const today = new Date().toISOString().split('T')[0];

  const productUrls = (products || [])
    .filter(isPublicIndexableProduct)
    .map((p: any) => {
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

  const categoryUrls = (categories || [])
    .filter(isPublicIndexableCategory)
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

  const subcategoryUrls = (subcategories || [])
    .filter(isPublicIndexableCategory)
    .map((s) => {
      const cat = (categories || []).find((c) => String(c.id) === String(s.category_id) || c.slug === s.category_slug);
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

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

const STATIC_CANONICAL_XML = buildSitemapXmlDocument({
  baseUrl: SITEMAP_BASE_URL,
  products: CANONICAL_PRODUCTS,
  categories: CANONICAL_CATEGORIES,
  subcategories: CANONICAL_SUBCATEGORIES,
});

let cachedXml: string = STATIC_CANONICAL_XML;
let lastSuccessfulLiveXml: string | null = null;
let lastCacheTime = 0;
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 min
let firestoreCooldown = 0;

export function invalidateSitemapCache(): void {
  lastCacheTime = 0;
  firestoreCooldown = 0;
}

/**
 * Connects directly to live Google Cloud Firestore and builds a 100% dynamic, future-proof XML Sitemap.
 * Seamlessly falls back to bundled canonical snapshot if Firestore has quota limits or timeouts.
 */
export async function generateDynamicSitemapXml(
  baseUrl = SITEMAP_BASE_URL,
  forceRefresh = false
): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedXml && now - lastCacheTime < CACHE_LIFETIME) {
    return cachedXml;
  }
  if (forceRefresh) {
    firestoreCooldown = 0;
  }

  let rawConfig: any = {};
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}
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

  let liveProducts: any[] = [];
  let liveCategories: any[] = [];
  let liveSubcategories: any[] = [];
  let fetched = false;

  if (now > firestoreCooldown) {
    try {
      const fetchPromise = (async () => {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const db = firebaseConfig.firestoreDatabaseId
          ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
          : getFirestore(app);

        const [prodsSnap, catsSnap, subsSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'subcategories')),
        ]);

        const prods: any[] = [];
        prodsSnap.forEach((doc) => {
          const data = doc.data();
          if (isPublicIndexableProduct(data)) {
            prods.push({ ...data, id: String(data.id || doc.id) });
          }
        });

        const cats: any[] = [];
        catsSnap.forEach((doc) => {
          const data = doc.data();
          if (isPublicIndexableCategory(data)) {
            cats.push({ ...data, id: String(data.id || doc.id) });
          }
        });

        const subs: any[] = [];
        subsSnap.forEach((doc) => {
          const data = doc.data();
          if (isPublicIndexableCategory(data)) {
            subs.push({ ...data, id: String(data.id || doc.id) });
          }
        });

        return { prods, cats, subs };
      })();

      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore timeout')), 3500);
      });

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (res && Array.isArray(res.prods) && res.prods.length > 0) {
        liveProducts = res.prods;
        liveCategories = res.cats;
        liveSubcategories = res.subs;
        fetched = true;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted');
      firestoreCooldown = Date.now() + (isQuota ? 2 * 60 * 1000 : 30 * 1000);
    }
  }

  let generated: string;
  if (fetched && liveProducts.length > 0) {
    generated = buildSitemapXmlDocument({
      baseUrl,
      products: liveProducts,
      categories: liveCategories,
      subcategories: liveSubcategories,
    });
    lastSuccessfulLiveXml = generated;
  } else if (lastSuccessfulLiveXml) {
    generated = lastSuccessfulLiveXml;
  } else {
    liveProducts = (CANONICAL_PRODUCTS as readonly any[]).filter(isPublicIndexableProduct);
    liveCategories = (CANONICAL_CATEGORIES as readonly any[]).filter(isPublicIndexableCategory);
    liveSubcategories = (CANONICAL_SUBCATEGORIES as readonly any[]).filter(isPublicIndexableCategory);
    generated = buildSitemapXmlDocument({
      baseUrl,
      products: liveProducts,
      categories: liveCategories,
      subcategories: liveSubcategories,
    });
  }

  cachedXml = generated;
  lastCacheTime = Date.now();
  return generated;
}
