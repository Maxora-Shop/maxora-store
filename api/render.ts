import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

const BASE_URL = 'https://maxora-store-ruby.vercel.app';

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
  og_image?: string;
  created_at?: string;
  updated_at?: string;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const type = urlObj.searchParams.get('type') || 'product';
    const rawSlug = urlObj.searchParams.get('slug') || '';
    const slug = cleanSlug(rawSlug);

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
            const data = d.data() as ProductData;
            products.push({ ...data, id: String(data.id || d.id) });
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
    } catch (e) {
      console.warn('Firestore load failed in render handler:', e);
    }

    // Fallback to local maxora_db.json
    if (products.length === 0) {
      try {
        const dbPath = path.join(process.cwd(), 'maxora_db.json');
        if (fs.existsSync(dbPath)) {
          const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          if (Array.isArray(data.products)) products = data.products;
          if (Array.isArray(data.categories)) categories = data.categories;
          if (Array.isArray(data.subcategories)) subcategories = data.subcategories;
        }
      } catch (e) {
        console.error('Local db read error in render:', e);
      }
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

      // Schema.org Product JSON-LD Structured Data
      const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: imagesArr.length > 0 ? imagesArr : [mainImage],
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
    <meta property="og:image" content="${escapeHtml(mainImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta property="product:price:amount" content="${finalPrice}" />
    <meta property="product:price:currency" content="BDT" />
    <meta property="product:availability" content="${Number(product.stock || 1) > 0 ? 'in stock' : 'out of stock'}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(mainImage)}" />

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
    <script type="application/ld+json">
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
    // CATEGORY PAGE SSR
    // ==========================================
    if (type === 'category') {
      const matchedCategory = categories.find((c) => {
        const cSlug = cleanSlug(c.slug || c.name || c.id);
        return cSlug === slug;
      });

      const matchedSubCategory = subcategories.find((s) => {
        const sSlug = cleanSlug(s.slug || s.name || s.id);
        return sSlug === slug;
      });

      const matchingProducts = products.filter((p) => {
        if (p.active === 0 || p.active === false || String(p.active) === '0') return false;
        const pCatSlug = cleanSlug(p.category || '');
        const pSubCatSlug = cleanSlug(p.sub_category || '');
        const pChildCatSlug = cleanSlug(p.child_category || '');
        const pTypeSlug = cleanSlug(p.product_type || '');
        return pCatSlug === slug || pSubCatSlug === slug || pChildCatSlug === slug || pTypeSlug === slug;
      });

      const categoryExists = Boolean(matchedCategory || matchedSubCategory || matchingProducts.length > 0);

      // If category missing -> HTTP 404 (Never soft 404)
      if (!categoryExists) {
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

      // Category Exists -> HTTP 200
      const categoryName =
        matchedCategory?.name ||
        matchedSubCategory?.name ||
        matchingProducts[0]?.category ||
        slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const canonicalUrl = `${BASE_URL}/category/${slug}`;
      const title = `${categoryName} Collection | Best Price in Bangladesh | Maxora Shop`;
      const description = `Shop genuine ${categoryName} online at Maxora Shop Bangladesh. Discover ${matchingProducts.length} authentic products with Cash on Delivery nationwide.`;
      const catImage = matchingProducts[0]?.image_url || `${BASE_URL}/og-image.png`;

      // Category Breadcrumbs JSON-LD
      const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: categoryName, item: canonicalUrl },
        ],
      };

      // Category ItemList JSON-LD
      const itemListLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${categoryName} Products`,
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

      const semanticCategoryBody = `
    <main id="ssr-category-container" class="max-w-6xl mx-auto p-4 sm:p-6 font-sans text-zinc-900">
      <nav aria-label="Breadcrumb" class="text-xs text-zinc-500 mb-4">
        <a href="${BASE_URL}">Home</a> &gt; 
        <span class="text-zinc-800">${escapeHtml(categoryName)}</span>
      </nav>
      <header class="mb-8 border-b border-zinc-200 pb-4">
        <h1 class="text-3xl font-extrabold text-zinc-900 mb-2">${escapeHtml(categoryName)} Collection</h1>
        <p class="text-zinc-600 text-sm leading-relaxed">${escapeHtml(description)}</p>
        <p class="text-xs text-zinc-500 mt-2 font-medium">Showing ${matchingProducts.length} items</p>
      </header>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
      </div>
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
