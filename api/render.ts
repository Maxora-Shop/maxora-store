import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, getDoc, doc, collection } from 'firebase/firestore';

const BASE_URL = 'https://maxora-store-ruby.vercel.app';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

interface ProductData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sub_category?: string;
  child_category?: string;
  product_type?: string;
  sku?: string;
  image_url?: string;
  images?: string[] | string;
  selling_price?: number;
  discount?: number;
  final_price?: number;
  stock?: number;
  active?: number | boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  slug?: string;
  brand?: string;
  category_id?: string;
  category_slug?: string;
  subcategory_id?: string;
  sub_category_id?: string;
  subcategory_slug?: string;
  childcategory_id?: string;
  child_category_id?: string;
  childcategory_slug?: string;
  product_type_id?: string;
  product_type_slug?: string;
  og_image?: string;
  created_at?: string;
  updated_at?: string;
}

function isValidSlugToken(val: string | null | undefined): boolean {
  if (!val) return false;
  const t = String(val).trim();
  if (!t) return false;
  if (t.startsWith('$') || t.startsWith(':') || t === 'undefined' || t === 'null') return false;
  return true;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let type = (urlObj.searchParams.get('type') || '').trim();

    let catSlugParam = '';
    let subSlugParam = '';
    let rawSlugParam = '';

    const reqQuery = (req as any).query || {};

    const pCat = (
      reqQuery.catSlug ||
      reqQuery.categorySlug ||
      reqQuery.category ||
      urlObj.searchParams.get('catSlug') ||
      urlObj.searchParams.get('categorySlug') ||
      urlObj.searchParams.get('category') ||
      ''
    ).toString().trim();
    if (isValidSlugToken(pCat)) catSlugParam = pCat;

    const pSub = (
      reqQuery.subSlug ||
      reqQuery.subCategorySlug ||
      reqQuery.subcategory ||
      urlObj.searchParams.get('subSlug') ||
      urlObj.searchParams.get('subCategorySlug') ||
      urlObj.searchParams.get('subcategory') ||
      ''
    ).toString().trim();
    if (isValidSlugToken(pSub)) subSlugParam = pSub;

    const pSlug = (
      reqQuery.slug ||
      urlObj.searchParams.get('slug') ||
      ''
    ).toString().trim();
    if (isValidSlugToken(pSlug)) rawSlugParam = pSlug;

    // Check incoming path from Vercel headers or URL path
    const originalPath = (
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-invoke-path'] as string) ||
      urlObj.pathname ||
      ''
    ).split('?')[0];

    // If type is not set or inferred
    if (!type) {
      if (originalPath.includes('/category/') || rawSlugParam.includes('category') || Boolean(catSlugParam)) {
        type = 'category';
      } else if (originalPath.includes('/product/') || rawSlugParam.includes('product')) {
        type = 'product';
      } else if (originalPath === '/' || originalPath === '') {
        type = 'home';
      } else {
        type = 'product';
      }
    }

    // If rawSlugParam has multiple segments (e.g. "accessories/mobile-accessories")
    if (rawSlugParam && rawSlugParam.includes('/')) {
      const parts = rawSlugParam.split('/').map((p) => p.trim()).filter(Boolean);
      if (!catSlugParam && parts[0] && isValidSlugToken(parts[0])) catSlugParam = parts[0];
      if (!subSlugParam && parts[1] && isValidSlugToken(parts[1])) subSlugParam = parts[1];
    } else if (!catSlugParam && rawSlugParam) {
      catSlugParam = rawSlugParam;
    }

    // Fallback: extract directly from originalPath (e.g. /category/accessories/mobile-accessories)
    if (originalPath.includes('/category/')) {
      const catMatch = originalPath.match(/\/category\/([^/?#]+)(?:\/([^/?#]+))?/);
      if (catMatch) {
        if ((!catSlugParam || !isValidSlugToken(catSlugParam)) && catMatch[1] && isValidSlugToken(catMatch[1])) {
          catSlugParam = decodeURIComponent(catMatch[1]);
        }
        if ((!subSlugParam || !isValidSlugToken(subSlugParam)) && catMatch[2] && isValidSlugToken(catMatch[2])) {
          subSlugParam = decodeURIComponent(catMatch[2]);
        }
      }
    }

    const slug = cleanSlug(rawSlugParam || catSlugParam);

    // Read index.html from dist or root
    let templateHtml = '';
    const distIndex = path.join(process.cwd(), 'dist', 'index.html');
    const rootIndex = path.join(process.cwd(), 'index.html');

    if (fs.existsSync(distIndex)) {
      templateHtml = fs.readFileSync(distIndex, 'utf8');
    } else if (fs.existsSync(rootIndex)) {
      templateHtml = fs.readFileSync(rootIndex, 'utf8');
    } else {
      res.statusCode = 500;
      res.end('HTML template not found');
      return;
    }

    // Load products, categories, subcategories from Firestore or local fallback
    let products: ProductData[] = [];
    let categories: any[] = [];
    let subcategories: any[] = [];

    try {
      let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
      const configPaths = [
        path.join(process.cwd(), 'firebase-applet-config.json'),
        path.join(__dirname, 'firebase-applet-config.json'),
        path.join(__dirname, '..', 'firebase-applet-config.json'),
      ];
      for (const cp of configPaths) {
        if (fs.existsSync(cp)) {
          try {
            firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(fs.readFileSync(cp, 'utf8')) };
            break;
          } catch {}
        }
      }

      // 1. Seed baseline master catalog from maxora_db.json
      const prodMap = new Map<string, ProductData>();
      const catMap = new Map<string, any>();
      const subMap = new Map<string, any>();

      const candidateDbPaths = [
        path.join(process.cwd(), 'maxora_db.json'),
        path.join(__dirname, 'maxora_db.json'),
        path.join(__dirname, '..', 'maxora_db.json'),
      ];
      for (const dbPath of candidateDbPaths) {
        try {
          if (fs.existsSync(dbPath)) {
            const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            if (Array.isArray(data.products)) {
              data.products.forEach((p: any) => prodMap.set(String(p.id || p.sku || p.slug), p));
            }
            if (Array.isArray(data.categories)) {
              data.categories.forEach((c: any) => catMap.set(String(c.id || c.slug), c));
            }
            if (Array.isArray(data.subcategories)) {
              data.subcategories.forEach((s: any) => subMap.set(String(s.id || s.slug), s));
            }
            break;
          }
        } catch (e) {
          console.warn('Local db read note in render:', e);
        }
      }

      // 2. Query Firestore and overlay with timeout guard
      try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const db = firebaseConfig.firestoreDatabaseId
          ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
          : getFirestore(app);

        const fetchSnapshots = Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'subcategories')),
        ]);
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore timeout')), 3500)
        );

        const snapResult = await Promise.race([fetchSnapshots, timeoutPromise]);
        if (snapResult && Array.isArray(snapResult)) {
          const [prodsSnap, catsSnap, subsSnap] = snapResult;
          if (!prodsSnap.empty) {
            prodsSnap.forEach((d) => {
              const data = d.data() as ProductData;
              const id = String(data.id || d.id);
              prodMap.set(id, { ...data, id });
            });
          }
          if (!catsSnap.empty) {
            catsSnap.forEach((d) => {
              const data = d.data();
              const id = String(data.id || d.id);
              catMap.set(id, { ...data, id });
            });
          }
          if (!subsSnap.empty) {
            subsSnap.forEach((d) => {
              const data = d.data();
              const id = String(data.id || d.id);
              subMap.set(id, { ...data, id });
            });
          }
        }
      } catch (e) {
        console.warn('Firestore load note in render handler:', e);
      }

      // 3. Filter out any deleted products
      const deletedIds = new Set<string>();
      for (const dbPath of candidateDbPaths) {
        try {
          if (fs.existsSync(dbPath)) {
            const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            if (Array.isArray(dbData.settings?.deleted_product_ids)) {
              dbData.settings.deleted_product_ids.forEach((dId: string) => deletedIds.add(String(dId).toLowerCase().trim()));
              break;
            }
          }
        } catch {}
      }

      products = Array.from(prodMap.values()).filter((p) => {
        const idLower = String(p.id || '').toLowerCase().trim();
        const skuLower = String(p.sku || '').toLowerCase().trim();
        const slugLower = String(p.slug || '').toLowerCase().trim();
        return !deletedIds.has(idLower) && (!skuLower || !deletedIds.has(skuLower)) && (!slugLower || !deletedIds.has(slugLower));
      });
      categories = Array.from(catMap.values());
      subcategories = Array.from(subMap.values());
    } catch (err) {
      console.warn('Render load products note:', err);
    }

    // ==========================================
    // PRODUCT PAGE SSR
    // ==========================================
    if (type === 'product') {
      const product = products.find((p) => {
        const pSlug = cleanSlug(p.slug || p.name || String(p.id));
        return (
          pSlug === slug ||
          String(p.id).toLowerCase() === slug.toLowerCase() ||
          (p.sku && p.sku.toLowerCase() === slug.toLowerCase())
        );
      });

      const isProductActive = product && product.active !== 0 && product.active !== false && String(product.active) !== '0';

      // If product missing or inactive -> HTTP 404 (Never soft 404)
      if (!product || !isProductActive) {
        const notFoundTitle = 'Product Not Found (404) | Maxora Shop Bangladesh';
        const notFoundDesc = 'The requested product could not be found or has been discontinued at Maxora Shop Bangladesh.';
        const seoHeadTags = `
    <!-- Google Search Console 404 Header Directives -->
    <title>${escapeHtml(notFoundTitle)}</title>
    <meta name="description" content="${escapeHtml(notFoundDesc)}" />
    <meta name="robots" content="noindex, nofollow" />
        `;
        const semantic404Body = `
    <main class="max-w-2xl mx-auto py-16 px-4 text-center font-sans">
      <h1 class="text-3xl font-extrabold text-zinc-900 mb-3">Product Not Found (404)</h1>
      <p class="text-zinc-600 mb-6">${escapeHtml(notFoundDesc)}</p>
      <a href="${BASE_URL}/" style="display:inline-block;background:#18181b;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Return to Maxora Home</a>
    </main>
        `;
        let notFoundHtml = templateHtml
          .replace(/<title>.*?<\/title>/i, '')
          .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
          .replace(/<link\s+rel=["']canonical["'][^>]*>/i, '')
          .replace(/<head>/i, `<head>${seoHeadTags}`)
          .replace(/(<div\s+id=["']root["'][^>]*>)/i, `$1${semantic404Body}`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.statusCode = 404;
        res.end(notFoundHtml);
        return;
      }

      // Product Exists -> HTTP 200
      const sellingPrice = Number(product.selling_price || 0);
      const discount = Number(product.discount || 0);
      const finalPrice = Math.max(0, sellingPrice - discount);
      const title = product.meta_title?.trim()
        ? product.meta_title
        : `${product.name} Price in Bangladesh | Maxora Shop`;

      const plainDesc = product.description
        ? product.description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 160)
        : '';
      const description = product.meta_description?.trim()
        ? product.meta_description
        : plainDesc
        ? `${plainDesc}. Buy online at best price in Bangladesh with Cash on Delivery at Maxora Shop.`
        : `Buy ${product.name} at best price in Bangladesh. 100% authentic quality, Cash on Delivery available at Maxora Shop.`;

      let imagesArr: string[] = [];
      if (Array.isArray(product.images) && product.images.length > 0) {
        imagesArr = product.images;
      } else if (typeof product.images === 'string') {
        try {
          imagesArr = JSON.parse(product.images);
        } catch {
          imagesArr = [product.images];
        }
      }
      const mainImage = product.og_image || product.image_url || imagesArr[0] || '';
      const canonicalUrl = `${BASE_URL}/product/${cleanSlug(product.slug || product.name || String(product.id))}`;

      // Extract valid publicly accessible HTTP/HTTPS image URLs for Google Merchant Listings
      // For Base64 data URIs, expose them via the public server-side endpoint: /api/product-image/:productId
      const rawCandidates = [
        ...(Array.isArray(imagesArr) ? imagesArr : []),
        product.image_url,
        product.og_image,
      ];
      const validPublicImages: string[] = [];
      let hasStoredImage = false;

      for (const item of rawCandidates) {
        if (typeof item !== 'string') continue;
        const trimmed = item.trim();
        if (!trimmed) continue;
        hasStoredImage = true;
        if (trimmed.toLowerCase().startsWith('data:') || trimmed.toLowerCase().includes('base64')) {
          continue;
        }
        if (trimmed.startsWith('https://')) {
          if (!validPublicImages.includes(trimmed)) validPublicImages.push(trimmed);
        } else if (trimmed.startsWith('http://')) {
          const secure = trimmed.replace(/^http:\/\//i, 'https://');
          if (!validPublicImages.includes(secure)) validPublicImages.push(secure);
        } else if (trimmed.startsWith('//')) {
          const full = `https:${trimmed}`;
          if (!validPublicImages.includes(full)) validPublicImages.push(full);
        } else if (trimmed.startsWith('/') || /^[a-zA-Z0-9_-]+\//.test(trimmed)) {
          const full = `${BASE_URL.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
          if (!validPublicImages.includes(full)) validPublicImages.push(full);
        }
      }

      // If no external HTTPS URL exists, but the product has a stored image (Base64 data URI),
      // point Google Merchant Listings to the public image serving endpoint
      if (validPublicImages.length === 0 && (hasStoredImage || product.id)) {
        const publicEndpoint = `${BASE_URL}/api/product-image/${product.id}`;
        validPublicImages.push(publicEndpoint);
      }

      const publicOgImage = validPublicImages[0] || (mainImage.startsWith('data:') ? `${BASE_URL}/api/product-image/${product.id}` : mainImage);

      // Schema.org Product JSON-LD Structured Data
      const jsonLd: Record<string, any> = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        ...(validPublicImages.length > 0 ? { image: validPublicImages } : {}),
        description: plainDesc || description,
        sku: product.sku || product.id,
        mpn: product.sku || product.id,
        brand: {
          '@type': 'Brand',
          name: product.brand || 'Maxora',
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'BDT',
          price: finalPrice,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            Number(product.stock || 1) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Maxora Shop Bangladesh',
          },
        },
      };

      // Breadcrumb JSON-LD
      const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          ...(product.category
            ? [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: product.category,
                  item: `${BASE_URL}/category/${cleanSlug(product.category)}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: product.name,
                  item: canonicalUrl,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: product.name,
                  item: canonicalUrl,
                },
              ]),
        ],
      };

      const seoHeadTags = `
    <!-- Google Search Console & SEO Pre-rendered Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${product.meta_keywords ? `<meta name="keywords" content="${escapeHtml(product.meta_keywords)}" />` : ''}
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

    <!-- Open Graph (Facebook / WhatsApp / LinkedIn) -->
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Maxora Shop" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(publicOgImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta property="product:price:amount" content="${finalPrice}" />
    <meta property="product:price:currency" content="BDT" />
    <meta property="product:availability" content="${Number(product.stock || 1) > 0 ? 'in stock' : 'out of stock'}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(publicOgImage)}" />

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json" id="ssr-product-schema">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <script type="application/ld+json" id="ssr-breadcrumb-schema">
${JSON.stringify(breadcrumbLd, null, 2)}
    </script>
      `;

      // Full semantic pre-rendered body inside #root
      const semanticSsrBody = `
    <article id="ssr-product-container" class="max-w-4xl mx-auto p-4 sm:p-6 font-sans text-zinc-900">
      <nav aria-label="Breadcrumb" class="text-xs text-zinc-500 mb-4">
        <a href="${BASE_URL}">Home</a> &gt; 
        ${product.category ? `<a href="${BASE_URL}/category/${cleanSlug(product.category)}">${escapeHtml(product.category)}</a> &gt; ` : ''}
        <span class="text-zinc-800">${escapeHtml(product.name)}</span>
      </nav>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.name)}" class="w-full max-h-96 object-contain rounded-xl border border-zinc-200" />
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">${escapeHtml(product.name)}</h1>
          <div class="mb-4">
            <span class="text-2xl font-extrabold text-emerald-600">৳${finalPrice}</span>
            ${discount > 0 ? `<span class="ml-2 text-zinc-400 line-through text-lg">৳${sellingPrice}</span>` : ''}
          </div>
          <div class="text-xs text-zinc-600 space-y-1 mb-4">
            <p><strong>Availability:</strong> <span class="${Number(product.stock || 1) > 0 ? 'text-emerald-600' : 'text-rose-600'} font-semibold">${Number(product.stock || 1) > 0 ? 'In Stock' : 'Out of Stock'}</span></p>
            <p><strong>SKU:</strong> ${escapeHtml(product.sku || product.id)}</p>
            <p><strong>Category:</strong> ${escapeHtml(product.category || 'General')}</p>
          </div>
          <div class="prose prose-sm text-zinc-700 leading-relaxed border-t border-zinc-200 pt-4">
            <p>${escapeHtml(plainDesc || description)}</p>
          </div>
        </div>
      </div>
    </article>
      `;

      let modifiedHtml = templateHtml
        .replace(/<title>.*?<\/title>/i, '')
        .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
        .replace(/<link\s+rel=["']canonical["'][^>]*>/i, '')
        .replace(/<head>/i, `<head>${seoHeadTags}`)
        .replace(/(<div\s+id=["']root["'][^>]*>)/i, `$1${semanticSsrBody}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=86400');
      res.statusCode = 200;
      res.end(modifiedHtml);
      return;
    }

    // ==========================================
    // CATEGORY & SUBCATEGORY PAGE SSR
    // ==========================================
    if (type === 'category') {
      const isSubCategoryRoute = Boolean(subSlugParam);
      const cleanCatSlug = cleanSlug(catSlugParam || rawSlugParam);
      const cleanSubSlug = isSubCategoryRoute ? cleanSlug(subSlugParam) : '';

      const matchedCategory = categories.find((c) => {
        const cSlug = cleanSlug(c.slug || c.name || c.id);
        return cSlug === cleanCatSlug;
      });

      const matchedSubCategory = isSubCategoryRoute
        ? subcategories.find((s) => {
            const sSlug = cleanSlug(s.slug || s.name || s.id);
            if (sSlug !== cleanSubSlug) return false;
            if (matchedCategory) {
              const catIdMatch = s.category_id && String(s.category_id) === String(matchedCategory.id);
              const catSlugMatch = s.category_slug && cleanSlug(s.category_slug) === cleanCatSlug;
              const catNameMatch = (s.category_name || s.category) && cleanSlug(s.category_name || s.category) === cleanCatSlug;
              if (catIdMatch || catSlugMatch || catNameMatch) return true;
              return false;
            }
            return true;
          }) || subcategories.find((s) => cleanSlug(s.slug || s.name || s.id) === cleanSubSlug)
        : subcategories.find((s) => cleanSlug(s.slug || s.name || s.id) === cleanCatSlug);

      const matchingProducts = products.filter((p) => {
        if (p.active === 0 || p.active === false || String(p.active) === '0') return false;
        const pCatSlug = cleanSlug(p.category || '');
        const pSubCatSlug = cleanSlug(p.sub_category || p.subcategory_slug || '');
        const pChildCatSlug = cleanSlug(p.child_category || p.childcategory_slug || '');
        const pTypeSlug = cleanSlug(p.product_type || p.product_type_slug || '');

        if (isSubCategoryRoute) {
          const matchSub =
            pSubCatSlug === cleanSubSlug ||
            (matchedSubCategory && (
              String(p.subcategory_id || p.sub_category_id) === String(matchedSubCategory.id) ||
              cleanSlug(p.sub_category || '') === cleanSlug(matchedSubCategory.name || '')
            ));
          if (!matchSub) return false;

          if (cleanCatSlug) {
            const matchCat =
              pCatSlug === cleanCatSlug ||
              (matchedCategory && (
                String(p.category_id) === String(matchedCategory.id) ||
                cleanSlug(p.category || '') === cleanSlug(matchedCategory.name || '')
              ));
            if (!matchCat) return false;
          }
          return true;
        }

        return pCatSlug === cleanCatSlug || pSubCatSlug === cleanCatSlug || pChildCatSlug === cleanCatSlug || pTypeSlug === cleanCatSlug;
      });

      // Route existence validation:
      // A valid category or valid subcategory MUST return HTTP 200 even with 0 products!
      // An invalid category or invalid subcategory must return HTTP 404.
      const routeExists = isSubCategoryRoute
        ? Boolean((matchedCategory && matchedSubCategory) || matchingProducts.length > 0 || (matchedSubCategory && !matchedCategory))
        : Boolean(matchedCategory || matchedSubCategory || matchingProducts.length > 0);

      // If category missing -> HTTP 404 (Never soft 404)
      if (!routeExists) {
        const notFoundTitle = 'Category Not Found (404) | Maxora Shop Bangladesh';
        const notFoundDesc = 'The requested category could not be found at Maxora Shop Bangladesh.';
        const seoHeadTags = `
    <!-- Google Search Console 404 Header Directives -->
    <title>${escapeHtml(notFoundTitle)}</title>
    <meta name="description" content="${escapeHtml(notFoundDesc)}" />
    <meta name="robots" content="noindex, nofollow" />
        `;
        const semantic404Body = `
    <main class="max-w-2xl mx-auto py-16 px-4 text-center font-sans">
      <h1 class="text-3xl font-extrabold text-zinc-900 mb-3">Category Not Found (404)</h1>
      <p class="text-zinc-600 mb-6">${escapeHtml(notFoundDesc)}</p>
      <a href="${BASE_URL}/" style="display:inline-block;background:#18181b;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Explore Categories</a>
    </main>
        `;
        let notFoundHtml = templateHtml
          .replace(/<title>.*?<\/title>/i, '')
          .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
          .replace(/<link\s+rel=["']canonical["'][^>]*>/i, '')
          .replace(/<head>/i, `<head>${seoHeadTags}`)
          .replace(/(<div\s+id=["']root["'][^>]*>)/i, `$1${semantic404Body}`);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.statusCode = 404;
        res.end(notFoundHtml);
        return;
      }

      // Route exists -> HTTP 200
      const categoryName =
        matchedCategory?.name ||
        cleanCatSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const subCategoryName = isSubCategoryRoute
        ? (matchedSubCategory?.name || cleanSubSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
        : '';

      const displayName = isSubCategoryRoute ? subCategoryName : categoryName;
      const canonicalUrl = isSubCategoryRoute
        ? `${BASE_URL}/category/${cleanCatSlug}/${cleanSubSlug}`
        : `${BASE_URL}/category/${cleanCatSlug}`;

      const title = isSubCategoryRoute
        ? `${subCategoryName} Collection | Best Price in Bangladesh | Maxora Shop`
        : `${categoryName} Collection | Best Price in Bangladesh | Maxora Shop`;

      const description = isSubCategoryRoute
        ? `Shop genuine ${subCategoryName} online at Maxora Shop Bangladesh. Discover authentic ${categoryName} products with 100% Cash on Delivery across all 64 districts.`
        : `Shop genuine ${categoryName} online at Maxora Shop Bangladesh. Discover ${matchingProducts.length} authentic products with Cash on Delivery nationwide.`;

      const catImage = matchingProducts[0]?.image_url || `${BASE_URL}/og-image.png`;

      // Category Breadcrumbs JSON-LD
      const breadcrumbListElements = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: categoryName, item: `${BASE_URL}/category/${cleanCatSlug}` },
      ];
      if (isSubCategoryRoute) {
        breadcrumbListElements.push({
          '@type': 'ListItem',
          position: 3,
          name: subCategoryName,
          item: canonicalUrl,
        });
      }

      const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbListElements,
      };

      // Category ItemList JSON-LD
      const itemListLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${displayName} Products`,
        itemListElement: matchingProducts.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/product/${cleanSlug(p.slug || p.name || p.id)}`,
          name: p.name,
        })),
      };

      const seoHeadTags = `
    <!-- Google Search Console & SEO Category Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Maxora Shop" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(catImage)}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(catImage)}" />

    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(breadcrumbLd, null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(itemListLd, null, 2)}
    </script>
      `;

      const breadcrumbsHtml = isSubCategoryRoute
        ? `<nav aria-label="Breadcrumb" class="text-xs text-zinc-500 mb-4">
             <a href="${BASE_URL}">Home</a> &gt; 
             <a href="${BASE_URL}/category/${cleanCatSlug}">${escapeHtml(categoryName)}</a> &gt; 
             <span class="text-zinc-800">${escapeHtml(subCategoryName)}</span>
           </nav>`
        : `<nav aria-label="Breadcrumb" class="text-xs text-zinc-500 mb-4">
             <a href="${BASE_URL}">Home</a> &gt; 
             <span class="text-zinc-800">${escapeHtml(categoryName)}</span>
           </nav>`;

      const productsContentHtml = matchingProducts.length > 0
        ? `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             ${matchingProducts
               .map((p) => {
                 const pSelling = Number(p.selling_price || 0);
                 const pDisc = Number(p.discount || 0);
                 const pFinal = Math.max(0, pSelling - pDisc);
                 const pSlug = cleanSlug(p.slug || p.name || p.id);
                 const pImg = p.image_url || '';
                 return `
               <a href="${BASE_URL}/product/${pSlug}" class="group block border border-zinc-200 rounded-xl p-3 bg-white hover:shadow-md transition">
                 <div class="aspect-square w-full mb-3 overflow-hidden rounded-lg bg-zinc-50 flex items-center justify-center">
                   <img src="${escapeHtml(pImg)}" alt="${escapeHtml(p.name)}" class="h-full w-full object-contain group-hover:scale-105 transition" />
                 </div>
                 <h2 class="text-sm font-semibold text-zinc-800 line-clamp-2 mb-1">${escapeHtml(p.name)}</h2>
                 <div class="flex items-center gap-2">
                   <span class="text-sm font-bold text-emerald-600">৳${pFinal}</span>
                   ${pDisc > 0 ? `<span class="text-xs text-zinc-400 line-through">৳${pSelling}</span>` : ''}
                 </div>
               </a>
                 `;
               })
               .join('')}
           </div>`
        : `<div class="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-zinc-200">
             <p class="text-zinc-700 text-sm font-medium mb-1">No products found in ${escapeHtml(displayName)} at the moment.</p>
             <p class="text-xs text-zinc-400 mb-5">Explore our wide range of authentic products across all categories.</p>
             ${isSubCategoryRoute ? `<a href="${BASE_URL}/category/${cleanCatSlug}" style="display:inline-block;background:#18181b;color:#ffffff;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;margin-right:8px;">View all ${escapeHtml(categoryName)}</a>` : ''}
             <a href="${BASE_URL}/" style="display:inline-block;background:#f4f4f5;color:#18181b;padding:8px 20px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;">Return to Home</a>
           </div>`;

      const semanticCategoryBody = `
    <main id="ssr-category-container" class="max-w-6xl mx-auto p-4 sm:p-6 font-sans text-zinc-900">
      ${breadcrumbsHtml}
      <header class="mb-8 border-b border-zinc-200 pb-4">
        <h1 class="text-3xl font-extrabold text-zinc-900 mb-2">${escapeHtml(displayName)} Collection</h1>
        <p class="text-zinc-600 text-sm leading-relaxed">${escapeHtml(description)}</p>
        <p class="text-xs text-zinc-500 mt-2 font-medium">Showing ${matchingProducts.length} items</p>
      </header>
      ${productsContentHtml}
    </main>
      `;

      let modifiedHtml = templateHtml
        .replace(/<title>.*?<\/title>/i, '')
        .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
        .replace(/<link\s+rel=["']canonical["'][^>]*>/i, '')
        .replace(/<head>/i, `<head>${seoHeadTags}`)
        .replace(/(<div\s+id=["']root["'][^>]*>)/i, `$1${semanticCategoryBody}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
      res.statusCode = 200;
      res.end(modifiedHtml);
      return;
    }

    // ==========================================
    // HOMEPAGE SSR
    // ==========================================
    if (type === 'home') {
      const homeTitle = 'Maxora - Premium Online Store in Bangladesh';
      const homeDesc = 'Full-featured e-commerce platform in Bangladesh. Shop authentic gadgets, accessories, and home items with Cash on Delivery nationwide.';
      const canonicalUrl = `${BASE_URL}/`;

      const activeProducts = products.filter(
        (p) => p.active !== 0 && p.active !== false && String(p.active) !== '0'
      );
      const activeCategories = categories.filter(
        (c) => c.active !== 0 && c.active !== false && String(c.active) !== '0'
      );

      const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Maxora Shop Bangladesh',
        url: BASE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${BASE_URL}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };

      const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Maxora Shop Bangladesh',
        url: BASE_URL,
        logo: `${BASE_URL}/favicon.ico`,
      };

      const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: activeProducts.slice(0, 30).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/product/${cleanSlug(p.slug || p.name || p.id)}`,
          name: p.name,
        })),
      };

      const seoHeadTags = `
    <!-- Google Search Console & SEO Homepage Meta Tags -->
    <title>${escapeHtml(homeTitle)}</title>
    <meta name="description" content="${escapeHtml(homeDesc)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Maxora Shop" />
    <meta property="og:title" content="${escapeHtml(homeTitle)}" />
    <meta property="og:description" content="${escapeHtml(homeDesc)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(homeTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(homeDesc)}" />

    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(websiteSchema, null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(orgSchema, null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(itemListSchema, null, 2)}
    </script>
      `;

      const semanticHomeBody = `
    <main id="ssr-home-container" class="max-w-6xl mx-auto p-4 sm:p-6 font-sans text-zinc-900">
      <header class="mb-8 border-b border-zinc-200 pb-4">
        <h1 class="text-3xl font-extrabold text-zinc-900 mb-2">Maxora Shop Bangladesh</h1>
        <p class="text-zinc-600 text-sm leading-relaxed">${escapeHtml(homeDesc)}</p>
      </header>

      <section class="mb-8">
        <h2 class="text-xl font-bold text-zinc-900 mb-3">Shop by Category</h2>
        <div class="flex flex-wrap gap-2">
          ${activeCategories
            .map((c) => {
              const catSlug = cleanSlug(c.slug || c.name || c.id);
              return `<a href="${BASE_URL}/category/${catSlug}" class="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition">${escapeHtml(c.name)}</a>`;
            })
            .join('')}
        </div>
      </section>

      <section>
        <h2 class="text-xl font-bold text-zinc-900 mb-4">Featured Products</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          ${activeProducts
            .map((p) => {
              const pSelling = Number(p.selling_price || 0);
              const pDisc = Number(p.discount || 0);
              const pFinal = Math.max(0, pSelling - pDisc);
              const pSlug = cleanSlug(p.slug || p.name || p.id);
              const pImg = p.image_url || '';
              return `
            <a href="${BASE_URL}/product/${pSlug}" class="group block border border-zinc-200 rounded-xl p-3 bg-white hover:shadow-md transition">
              <div class="aspect-square w-full mb-3 overflow-hidden rounded-lg bg-zinc-50 flex items-center justify-center">
                <img src="${escapeHtml(pImg)}" alt="${escapeHtml(p.name)}" class="h-full w-full object-contain group-hover:scale-105 transition" />
              </div>
              <h3 class="text-sm font-semibold text-zinc-800 line-clamp-2 mb-1">${escapeHtml(p.name)}</h3>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-emerald-600">৳${pFinal}</span>
                ${pDisc > 0 ? `<span class="text-xs text-zinc-400 line-through">৳${pSelling}</span>` : ''}
              </div>
            </a>
              `;
            })
            .join('')}
        </div>
      </section>
    </main>
      `;

      let modifiedHtml = templateHtml
        .replace(/<title>.*?<\/title>/i, '')
        .replace(/<meta\s+name=["']description["'][^>]*>/i, '')
        .replace(/<link\s+rel=["']canonical["'][^>]*>/i, '')
        .replace(/<head>/i, `<head>${seoHeadTags}`)
        .replace(/(<div\s+id=["']root["'][^>]*>)/i, `$1${semanticHomeBody}`);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
      res.statusCode = 200;
      res.end(modifiedHtml);
      return;
    }

    // Default fallback: serve standard template
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;
    res.end(templateHtml);
  } catch (err: any) {
    console.error('Render handler error:', err);
    res.statusCode = 500;
    res.end('Server render error: ' + (err?.message || 'unknown'));
  }
}
