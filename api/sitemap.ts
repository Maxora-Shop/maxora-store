import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanSlug(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const baseUrl = 'https://maxora-store-ruby.vercel.app';
  const today = new Date().toISOString().split('T')[0];

  let products: any[] = [];
  let categories: any[] = [];
  let subcategories: any[] = [];

  // 1. Attempt to fetch live products and categories from Firebase Firestore
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const db = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);

      const [prodsSnap, catsSnap, subsSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'subcategories')),
      ]);

      if (!prodsSnap.empty) {
        prodsSnap.forEach((d) => {
          const data = d.data();
          if (data.active !== 0 && data.active !== false) {
            products.push({ ...data, id: String(data.id || d.id) });
          }
        });
      }

      if (!catsSnap.empty) {
        catsSnap.forEach((d) => {
          categories.push({ ...d.data(), id: String(d.data().id || d.id) });
        });
      }

      if (!subsSnap.empty) {
        subsSnap.forEach((d) => {
          subcategories.push({ ...d.data(), id: String(d.data().id || d.id) });
        });
      }
    }
  } catch (err) {
    console.warn('Firestore fetch for sitemap failed, falling back to local file:', err);
  }

  // 2. Fallback to local maxora_db.json if Firestore returned empty
  if (products.length === 0) {
    try {
      const dbPath = path.join(process.cwd(), 'maxora_db.json');
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (Array.isArray(data.products)) {
          products = data.products.filter((p: any) => p.active !== 0 && p.active !== false);
        }
        if (Array.isArray(data.categories) && categories.length === 0) {
          categories = data.categories;
        }
        if (Array.isArray(data.subcategories) && subcategories.length === 0) {
          subcategories = data.subcategories;
        }
      }
    } catch (err) {
      console.error('Error reading fallback maxora_db.json for sitemap:', err);
    }
  }

  // Categories XML
  const categoryXml = categories
    .map((c) => {
      const slug = cleanSlug(c.slug || c.name || c.id);
      if (!slug) return '';
      return `  <url>
    <loc>${escapeXml(`${baseUrl}/category/${slug}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  // Subcategories XML
  const subcategoryXml = subcategories
    .map((s) => {
      const catSlug = cleanSlug(s.category_slug || s.category_name || s.category_id || '');
      const subSlug = cleanSlug(s.slug || s.name || s.id);
      if (!subSlug) return '';
      const loc = catSlug
        ? `${baseUrl}/category/${catSlug}/${subSlug}`
        : `${baseUrl}/category/${subSlug}`;
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  // Products XML (High Priority for Googlebot)
  const productXml = products
    .map((p) => {
      const slug = cleanSlug(p.slug || p.name || String(p.id));
      if (!slug) return '';
      const lastMod = (p.updated_at || p.created_at || today).split('T')[0];
      return `  <url>
    <loc>${escapeXml(`${baseUrl}/product/${slug}`)}</loc>
    <lastmod>${escapeXml(lastMod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/track</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${categoryXml ? `${categoryXml}\n` : ''}${subcategoryXml ? `${subcategoryXml}\n` : ''}${productXml}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // 5-minute CDN cache with stale-while-revalidate so new products show up promptly in Google
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.statusCode = 200;
  res.end(sitemapXml);
}

