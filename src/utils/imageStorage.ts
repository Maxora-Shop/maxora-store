import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface CompressedImageResult {
  blob: Blob;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
}

/**
 * Clean string for safe storage paths
 */
function sanitizePathSegment(val: string): string {
  return (val || 'general')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Compresses an image in the browser using HTML Canvas.
 * Outputs a WebP Blob (with JPEG fallback) with maximum dimensions of 1400x1400px.
 */
export async function compressImageToBlob(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // If SVG, preserve raw vector format without canvas conversion
    if (file.type === 'image/svg+xml') {
      return resolve({
        blob: file,
        mimeType: 'image/svg+xml',
        extension: 'svg',
        width: 800,
        height: 800,
      });
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image file for compression'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            blob: file,
            mimeType: file.type || 'image/jpeg',
            extension: (file.name.split('.').pop() || 'jpg').toLowerCase(),
            width,
            height,
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve({
                blob,
                mimeType: 'image/webp',
                extension: 'webp',
                width,
                height,
              });
            } else {
              // Fallback to JPEG
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob && fallbackBlob.size > 0) {
                    resolve({
                      blob: fallbackBlob,
                      mimeType: 'image/jpeg',
                      extension: 'jpg',
                      width,
                      height,
                    });
                  } else {
                    resolve({
                      blob: file,
                      mimeType: file.type || 'image/jpeg',
                      extension: (file.name.split('.').pop() || 'jpg').toLowerCase(),
                      width,
                      height,
                    });
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a product image and returns a permanent, public HTTPS image URL.
 * 
 * 1. Primary: Firebase Storage upload to `products/{productId}/{timestamp}-{filename}.webp`
 * 2. Fallback: Server-assisted public endpoint `/api/upload-image` if Firebase Storage bucket
 *    has not yet been enabled in Firebase Console.
 * 
 * In ALL cases:
 * - A valid public HTTPS URL is returned
 * - NO Base64 strings are returned
 * - Can be safely written into Firestore product.image_url and product.images
 */
export async function uploadProductImageToStorage(
  file: File,
  productId: string,
  options?: {
    isGallery?: boolean;
    galleryIndex?: number;
    customName?: string;
  }
): Promise<string> {
  const cleanId = sanitizePathSegment(productId || `prod-${Date.now().toString(36)}`);

  // Step 1: Compress image to binary Blob
  const { blob, mimeType, extension } = await compressImageToBlob(file);

  const timestamp = Date.now();
  const filePrefix = options?.customName
    ? sanitizePathSegment(options.customName)
    : options?.isGallery
    ? `gallery-${options.galleryIndex || 1}`
    : 'main';
  const cleanFileName = `${timestamp}-${filePrefix}.${extension}`;
  const storagePath = `products/${cleanId}/${cleanFileName}`;

  // Step 2: Attempt primary Firebase Storage upload
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, s-maxage=31536000',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (downloadUrl && (downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://'))) {
        // Ensure https
        return downloadUrl.replace(/^http:\/\//i, 'https://');
      }
    } catch (storageErr: any) {
      console.warn('Direct Firebase Storage upload encountered an error:', storageErr?.code || storageErr?.message);
      // If Firebase Storage is not enabled (status 404), continue to server upload fallback
    }
  }

  // Step 3: Server Fallback Upload
  // Creates a public image URL under /api/product-image/img-...
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const resp = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_url: dataUrl,
        filename: cleanFileName,
        product_id: cleanId,
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      if (json.success && json.url && typeof json.url === 'string') {
        return json.url;
      }
    }
  } catch (serverErr) {
    console.warn('Server fallback upload error:', serverErr);
  }

  throw new Error(
    'Image upload failed. Please ensure Firebase Cloud Storage is enabled in your Firebase Console (Firebase Console -> Storage -> Get Started).'
  );
}

/**
 * Uploads a category image and returns a permanent, public HTTPS image URL.
 * 
 * 1. Primary: Firebase Storage upload to `categories/{categoryId}/{timestamp}-category.webp`
 * 2. Fallback: Server-assisted endpoint `/api/upload-image`
 * 3. Final Fallback: Compressed WebP Data URL to ensure zero data loss
 */
export async function uploadCategoryImageToStorage(
  file: File,
  categoryId?: string
): Promise<string> {
  const cleanId = sanitizePathSegment(categoryId || `cat-${Date.now().toString(36)}`);

  // Step 1: Compress image to binary Blob (1000x1000 max, 0.85 quality)
  const { blob, mimeType, extension } = await compressImageToBlob(file, 1000, 1000, 0.85);

  const timestamp = Date.now();
  const cleanFileName = `${timestamp}-category.${extension}`;
  const storagePath = `categories/${cleanId}/${cleanFileName}`;

  // Step 2: Attempt primary Firebase Storage upload
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, s-maxage=31536000',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (downloadUrl && (downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://'))) {
        return downloadUrl.replace(/^http:\/\//i, 'https://');
      }
    } catch (storageErr: any) {
      console.warn('Direct Firebase Storage category upload failed, falling back to server upload:', storageErr?.message);
    }
  }

  // Step 3: Server Fallback Upload
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const resp = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_url: dataUrl,
        filename: cleanFileName,
        product_id: `category-${cleanId}`,
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      if (json.success && json.url && typeof json.url === 'string') {
        return json.url;
      }
    }

    if (dataUrl && dataUrl.startsWith('data:image/')) {
      return dataUrl;
    }
  } catch (serverErr) {
    console.warn('Server fallback category upload error:', serverErr);
  }

  // Step 4: Final reliable fallback
  const fallbackReader = new FileReader();
  return new Promise((resolve, reject) => {
    fallbackReader.onload = () => resolve(fallbackReader.result as string);
    fallbackReader.onerror = () => reject(new Error('Failed to read image file'));
    fallbackReader.readAsDataURL(blob);
  });
}

