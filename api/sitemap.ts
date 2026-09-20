import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection, setLogLevel } from 'firebase/firestore';

try {
  setLogLevel('error');
} catch (e) {}

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

function buildSitemapXml(params: {
  baseUrl: string;
  products: any[];
  categories: any[];
  subcategories: any[];
}): string {
  const { baseUrl, products, categories, subcategories } = params;
  const today = new Date().toISOString().split('T')[0];

  // Dynamic Product URLs
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

  // Dynamic Category URLs
  const categoryUrls = (categories || [])
    .filter(isPublicIndexableCategory)
    .map((c: any) => {
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

  // Dynamic Subcategory URLs
  const subcategoryUrls = (subcategories || [])
    .filter(isPublicIndexableCategory)
    .map((s: any) => {
      const cat = (categories || []).find((c: any) => String(c.id) === String(s.category_id) || c.slug === s.category_slug);
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

// Server-side module cache to protect Firestore quota and deliver instant responses (<10ms)
let cachedSitemapXml: string | null = null;
let lastSuccessfulLiveXml: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
let firestoreCooldownUntil = 0;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const now = Date.now();
    const reqUrl = req.url || '';
    const isForceRefresh =
      reqUrl.includes('refresh=1') ||
      reqUrl.includes('refresh=true') ||
      req.headers['cache-control'] === 'no-cache' ||
      req.headers['pragma'] === 'no-cache';

    // 1. Serve fresh in-memory cache if available and not explicitly requested to refresh
    if (!isForceRefresh && cachedSitemapXml && now - cacheTimestamp < CACHE_TTL_MS) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
      res.setHeader('X-Sitemap-Source', 'memory-cache');
      res.end(cachedSitemapXml);
      return;
    }

    // Resolve Firebase configuration
    let rawConfig: any = {};
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        // Safe ignore
      }
    }

    const firebaseConfig = {
      projectId:
        process.env.VITE_FIREBASE_PROJECT_ID ||
        process.env.FIREBASE_PROJECT_ID ||
        rawConfig.projectId ||
        DEFAULT_FIREBASE_CONFIG.projectId,
      appId:
        process.env.VITE_FIREBASE_APP_ID ||
        process.env.FIREBASE_APP_ID ||
        rawConfig.appId ||
        DEFAULT_FIREBASE_CONFIG.appId,
      apiKey:
        process.env.VITE_FIREBASE_API_KEY ||
        process.env.FIREBASE_API_KEY ||
        rawConfig.apiKey ||
        DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain:
        process.env.VITE_FIREBASE_AUTH_DOMAIN ||
        process.env.FIREBASE_AUTH_DOMAIN ||
        rawConfig.authDomain ||
        DEFAULT_FIREBASE_CONFIG.authDomain,
      firestoreDatabaseId:
        process.env.VITE_FIRESTORE_DATABASE_ID ||
        process.env.FIRESTORE_DATABASE_ID ||
        rawConfig.firestoreDatabaseId ||
        DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
      storageBucket:
        process.env.VITE_FIREBASE_STORAGE_BUCKET ||
        process.env.FIREBASE_STORAGE_BUCKET ||
        rawConfig.storageBucket ||
        DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId:
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
        process.env.FIREBASE_MESSAGING_SENDER_ID ||
        rawConfig.messagingSenderId ||
        DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    };

    let liveProducts: any[] = [];
    let liveCategories: any[] = [];
    let liveSubcategories: any[] = [];
    let fromLiveFirestore = false;

    // 2. Query Firestore with 3.5s timeout guard if not in quota cooldown
    if (now > firestoreCooldownUntil) {
      try {
        const firestoreFetchPromise = (async () => {
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

        // 3.5s timeout guard prevents Vercel lambda execution cutoff
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Firestore connection timeout (3500ms)')), 3500);
        });

        const firestoreResult = await Promise.race([firestoreFetchPromise, timeoutPromise]);
        if (firestoreResult && Array.isArray(firestoreResult.prods) && firestoreResult.prods.length > 0) {
          liveProducts = firestoreResult.prods;
          liveCategories = firestoreResult.cats;
          liveSubcategories = firestoreResult.subs;
          fromLiveFirestore = true;
        }
      } catch (firestoreError: any) {
        const msg = firestoreError?.message || String(firestoreError);
        console.warn('[Sitemap] Firestore fetch bypassed:', msg);
        const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted');
        firestoreCooldownUntil = Date.now() + (isQuota ? 2 * 60 * 1000 : 30 * 1000);
      }
    }

    // 3. Fallback to local maxora_db.json if Firestore returned nothing
    if (liveProducts.length === 0) {
      try {
        const dbPath = path.join(process.cwd(), 'maxora_db.json');
        if (fs.existsSync(dbPath)) {
          const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          if (Array.isArray(dbData.products)) {
            liveProducts = dbData.products.filter(isPublicIndexableProduct);
          }
          if (Array.isArray(dbData.categories)) {
            liveCategories = dbData.categories.filter(isPublicIndexableCategory);
          }
          if (Array.isArray(dbData.subcategories)) {
            liveSubcategories = dbData.subcategories.filter(isPublicIndexableCategory);
          }
        }
      } catch (dbErr) {
        console.error('[Sitemap] Local maxora_db.json read error:', dbErr);
      }
    }

    // 4. Generate compliant XML string
    let sitemapXml: string;
    let sitemapSource: string;

    if (fromLiveFirestore && liveProducts.length > 0) {
      sitemapXml = buildSitemapXml({
        baseUrl: BASE_URL,
        products: liveProducts,
        categories: liveCategories,
        subcategories: liveSubcategories,
      });
      lastSuccessfulLiveXml = sitemapXml;
      sitemapSource = 'firestore-live';
    } else if (lastSuccessfulLiveXml) {
      sitemapXml = lastSuccessfulLiveXml;
      sitemapSource = 'last-live-fallback';
    } else {
      sitemapXml = buildSitemapXml({
        baseUrl: BASE_URL,
        products: liveProducts,
        categories: liveCategories,
        subcategories: liveSubcategories,
      });
      sitemapSource = 'maxora-db-fallback';
    }

    // Update in-memory cache
    cachedSitemapXml = sitemapXml;
    cacheTimestamp = Date.now();

    // 5. Send production HTTP 200 response with XML Content-Type and CDN headers
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
    res.setHeader('X-Sitemap-Source', sitemapSource);
    res.end(sitemapXml);
  } catch (error) {
    // 6. Absolute safety guard: NEVER return 500, ALWAYS return valid XML 200
    console.error('[Sitemap] Error intercepted, returning emergency XML:', error);
    const emergencyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('X-Sitemap-Source', 'emergency-fallback');
    res.end(emergencyXml);
  }
}
