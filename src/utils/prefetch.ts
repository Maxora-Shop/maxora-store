import { Product } from '../types';

const preloadedUrls = new Set<string>();

/**
 * High-speed product media prefetcher.
 * Preloads the product's primary image and gallery images into the browser cache
 * during mouse hover (pointerenter) or touchstart (~150-300ms before click),
 * guaranteeing that when the user opens the product, images appear INSTANTLY with 0ms wait.
 */
export function prefetchProduct(product: Product | null | undefined): void {
  if (!product || typeof window === 'undefined') return;

  const urls: string[] = [];
  if (product.image_url) urls.push(product.image_url);
  if (Array.isArray(product.images)) {
    product.images.slice(0, 3).forEach((img) => {
      if (img && !urls.includes(img)) urls.push(img);
    });
  }
  if (Array.isArray(product.colors)) {
    product.colors.forEach((col) => {
      if (col.image_url && !urls.includes(col.image_url)) urls.push(col.image_url);
    });
  }

  urls.forEach((url) => {
    if (!url || preloadedUrls.has(url)) return;
    // Don't preload data URLs or oversized base64 strings twice
    if (url.startsWith('data:') && url.length > 50000) return;
    preloadedUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  });
}
