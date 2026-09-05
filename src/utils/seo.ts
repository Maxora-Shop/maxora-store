import { Product } from '../types';

export const SITE_URL = 'https://maxora-store-ruby.vercel.app';
export const STORE_NAME = 'Maxora Shop';

/**
 * Safely generates a URL-friendly, clean slug from a string.
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid characters
    .replace(/[\s_]+/g, '-') // collapse spaces and underscores to a single dash
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-+|-+$/g, ''); // trim leading and trailing dashes
}

/**
 * Gets a stable, unique, URL-safe slug for a product.
 * Prefers product.slug if present, else generates from product.name, else product.sku, else product.id.
 */
export function getProductSlug(product: {
  slug?: string;
  name?: string;
  sku?: string;
  id?: string | number;
}): string {
  if (product.slug && product.slug.trim()) {
    const cleaned = generateSlug(product.slug);
    if (cleaned) return cleaned;
  }
  if (product.name && product.name.trim()) {
    const cleaned = generateSlug(product.name);
    if (cleaned) return cleaned;
  }
  if (product.sku && product.sku.trim()) {
    const cleaned = generateSlug(product.sku);
    if (cleaned) return cleaned;
  }
  return String(product.id || 'item');
}

/**
 * Gets the canonical product URL.
 * Example: https://maxora-store-ruby.vercel.app/product/sokany-blender-sk-03067
 */
export function getProductCanonicalUrl(
  product: { slug?: string; name?: string; sku?: string; id?: string | number },
  baseUrl = SITE_URL
): string {
  const slug = getProductSlug(product);
  return `${baseUrl.replace(/\/$/, '')}/product/${slug}`;
}

/**
 * Gets the homepage canonical URL.
 */
export function getHomepageCanonicalUrl(baseUrl = SITE_URL): string {
  return `${baseUrl.replace(/\/$/, '')}/`;
}

/**
 * Gets the canonical category URL.
 * Example: https://maxora-store-ruby.vercel.app/category/smart-gadgets
 */
export function getCategoryCanonicalUrl(
  category: { slug?: string; name?: string } | string,
  baseUrl = SITE_URL
): string {
  const slug = typeof category === 'string'
    ? generateSlug(category)
    : (category.slug || generateSlug(category.name || ''));
  return `${baseUrl.replace(/\/$/, '')}/category/${slug}`;
}

/**
 * Gets the canonical subcategory URL.
 * Example: https://maxora-store-ruby.vercel.app/category/smart-gadgets/smartwatches
 */
export function getSubCategoryCanonicalUrl(
  category: { slug?: string; name?: string } | string,
  subCategory: { slug?: string; name?: string } | string,
  baseUrl = SITE_URL
): string {
  const catSlug = typeof category === 'string'
    ? generateSlug(category)
    : (category.slug || generateSlug(category.name || ''));
  const subSlug = typeof subCategory === 'string'
    ? generateSlug(subCategory)
    : (subCategory.slug || generateSlug(subCategory.name || ''));
  return `${baseUrl.replace(/\/$/, '')}/category/${catSlug}/${subSlug}`;
}

/**
 * Finds a product in the list by matching slug, SKU, name, or id.
 */
export function findProductBySlugOrId(
  products: Product[],
  slugOrId: string
): Product | null {
  if (!slugOrId || !products || products.length === 0) return null;
  const target = slugOrId.toLowerCase().trim();

  // 1. Direct slug match
  const exactSlug = products.find((p) => p.slug && p.slug.toLowerCase().trim() === target);
  if (exactSlug) return exactSlug;

  // 2. Computed slug match
  const computedSlug = products.find((p) => getProductSlug(p) === target);
  if (computedSlug) return computedSlug;

  // 3. SKU match (raw or slugified, e.g. MX-SW-09 or mx-sw-09)
  const skuMatch = products.find(
    (p) => p.sku && (p.sku.toLowerCase().trim() === target || generateSlug(p.sku) === target)
  );
  if (skuMatch) return skuMatch;

  // 4. Name slug match
  const nameMatch = products.find((p) => p.name && generateSlug(p.name) === target);
  if (nameMatch) return nameMatch;

  // 5. ID match
  const idMatch = products.find((p) => String(p.id).toLowerCase() === target);
  if (idMatch) return idMatch;

  return null;
}

/**
 * Cleans and trims text for meta descriptions without keyword stuffing.
 */
export function cleanSeoText(text?: string, maxLength = 160): string {
  if (!text) return '';
  const cleaned = text
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/\s+/g, ' ') // collapse multiple spaces and newlines
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3).trim() + '...';
}
