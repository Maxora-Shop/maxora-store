import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, getDoc, collection, doc, setLogLevel } from 'firebase/firestore';

try {
  setLogLevel('error');
} catch {}

const BASE_URL = 'https://maxorabd.com';
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
  return {
    ...DEFAULT_FIREBASE_CONFIG,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  };
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function plainText(value: unknown): string {
  return String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSlug(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0980-\u09ff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function absoluteImageUrl(value: any): string {
  const raw = typeof value === 'string' ? value : (value?.url || value?.src || value?.image_url || '');
  if (!raw || typeof raw !== 'string' || raw.startsWith('data:')) return '';
  try {
    const url = new URL(raw, BASE_URL);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function isPublicProduct(p: any, deletedIds: Set<string>): boolean {
  if (!p) return false;
  if (p.active === false || p.active === 0 || p.active === '0' || p.active === 'false') return false;
  if (p.published === false || p.published === 0 || p.published === '0' || p.published === 'false') return false;
  if (p.deleted === true || p.deleted === 1 || p.deleted === '1' || p.is_deleted === true) return false;
  if (p.status && ['draft', 'inactive', 'archived', 'deleted', 'unpublished', 'hidden'].includes(String(p.status).trim().toLowerCase())) return false;

  const id = String(p.id || '').trim().toLowerCase();
  const sku = String(p.sku || '').trim().toLowerCase();
  const slug = String(p.slug || '').trim().toLowerCase();
  if ((id && deletedIds.has(id)) || (sku && deletedIds.has(sku)) || (slug && deletedIds.has(slug))) return false;
  return Boolean(p.name || p.title);
}

function buildItem(p: any): string {
  const title = plainText(p.name || p.title).slice(0, 150);
  const description = plainText(p.description || p.short_description || p.meta_description || title).slice(0, 5000);
  const id = String(p.sku || p.id || p.slug || '').trim();
  const slug = cleanSlug(p.slug || p.name || p.title || id);
  const link = `${BASE_URL}/product/${encodeURIComponent(slug)}`;

  const sellingPrice = Number(p.selling_price ?? p.price ?? 0);
  const discount = Math.max(0, Number(p.discount || 0));
  const finalPrice = Number(p.final_price ?? Math.max(0, sellingPrice - discount));
  const stock = Number(p.stock ?? 0);
  const images = Array.isArray(p.images) ? p.images : [];
  const mainImage = absoluteImageUrl(p.image_url || p.main_image || images[0]);
  const gallery = images.map(absoluteImageUrl).filter((url: string) => url && url !== mainImage);
  const brand = plainText(p.brand || p.brand_name).slice(0, 70);
  const categoryParts = [p.category, p.subcategory || p.sub_category, p.child_category, p.product_type]
    .map((v) => plainText(v))
    .filter(Boolean);
  const productType = Array.from(new Set(categoryParts)).join(' > ');
  const gtin = String(p.gtin || '').trim();
  const mpn = String(p.mpn || '').trim();

  const fields = [
    `<g:id>${escapeXml(id)}</g:id>`,
    `<g:title>${escapeXml(title)}</g:title>`,
    `<g:description>${escapeXml(description || title)}</g:description>`,
    `<g:link>${escapeXml(link)}</g:link>`,
    mainImage ? `<g:image_link>${escapeXml(mainImage)}</g:image_link>` : '',
    ...gallery.slice(0, 10).map((url: string) => `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`),
    `<g:availability>${stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>`,
    `<g:condition>new</g:condition>`,
    sellingPrice > 0 ? `<g:price>${sellingPrice.toFixed(2)} BDT</g:price>` : '',
    discount > 0 && finalPrice > 0 && finalPrice < sellingPrice
      ? `<g:sale_price>${finalPrice.toFixed(2)} BDT</g:sale_price>` : '',
    brand ? `<g:brand>${escapeXml(brand)}</g:brand>` : '',
    gtin ? `<g:gtin>${escapeXml(gtin)}</g:gtin>` : '',
    mpn ? `<g:mpn>${escapeXml(mpn)}</g:mpn>` : '',
    productType ? `<g:product_type>${escapeXml(productType)}</g:product_type>` : '',
    p.identifier_exists === false ? '<g:identifier_exists>no</g:identifier_exists>' : '',
  ].filter(Boolean);

  return `  <item>\n    ${fields.join('\n    ')}\n  </item>`;
}

let cachedXml = '';
let cacheTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours per warm serverless instance

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  const now = Date.now();
  if (cachedXml && now - cacheTime < CACHE_TTL_MS) {
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? '' : cachedXml);
    return;
  }

  try {
    const config = getFirebaseConfig();
    const app = getApps().length ? getApp() : initializeApp(config);
    const db = config.firestoreDatabaseId
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);

    // One product collection read plus one settings document read per uncached fetch.
    const [productsSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, 'products')),
      getDoc(doc(db, 'settings', 'store_settings')),
    ]);

    const deletedIds = new Set<string>();
    const deleted = settingsSnap.exists() ? settingsSnap.data()?.deleted_product_ids : [];
    if (Array.isArray(deleted)) deleted.forEach((id: any) => deletedIds.add(String(id).trim().toLowerCase()));

    const products: any[] = [];
    productsSnap.forEach((productDoc) => {
      const p = { ...productDoc.data(), id: String(productDoc.data().id || productDoc.id) };
      if (isPublicProduct(p, deletedIds)) products.push(p);
    });

    products.sort((a, b) => String(a.name || a.title || '').localeCompare(String(b.name || b.title || '')));
    const items = products.map(buildItem).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n  <title>Maxora Shop Bangladesh</title>\n  <link>${BASE_URL}/</link>\n  <description>Products available at Maxora Shop Bangladesh</description>\n${items}\n</channel>\n</rss>`;

    cachedXml = xml;
    cacheTime = Date.now();
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? '' : xml);
  } catch (error: any) {
    console.error('[Google Shopping Feed] Firestore fetch failed:', error?.message || error);
    // Do not return an empty feed on a temporary database failure; that could remove products in Merchant Center.
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.end('Google Shopping feed temporarily unavailable. Please retry later.');
  }
}
