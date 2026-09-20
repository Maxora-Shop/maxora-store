import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
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
 * Outputs both a WebP Blob and Data URL with maximum dimensions of 1200x1200px.
 */
export async function compressImageToBlob(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // If SVG, preserve raw vector format without canvas conversion
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          blob: file,
          dataUrl: (e.target?.result as string) || '',
          mimeType: 'image/svg+xml',
          extension: 'svg',
          width: 800,
          height: 800,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        // If image object fails to decode, fallback to direct raw data URL
        resolve({
          blob: file,
          dataUrl: rawDataUrl,
          mimeType: file.type || 'image/jpeg',
          extension: (file.name.split('.').pop() || 'jpg').toLowerCase(),
          width: 800,
          height: 800,
        });
      };
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
            dataUrl: rawDataUrl,
            mimeType: file.type || 'image/jpeg',
            extension: (file.name.split('.').pop() || 'jpg').toLowerCase(),
            width,
            height,
          });
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let outDataUrl = '';
        try {
          outDataUrl = canvas.toDataURL('image/webp', quality);
        } catch {
          outDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Generate Blob for potential Storage upload
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve({
                blob,
                dataUrl: outDataUrl,
                mimeType: 'image/webp',
                extension: 'webp',
                width,
                height,
              });
            } else {
              // Fallback to JPEG blob
              canvas.toBlob(
                (fallbackBlob) => {
                  resolve({
                    blob: fallbackBlob || file,
                    dataUrl: outDataUrl || rawDataUrl,
                    mimeType: 'image/jpeg',
                    extension: 'jpg',
                    width,
                    height,
                  });
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
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a product image and returns an optimized image URL.
 * 
 * 1. Immediate in-browser WebP compression (<100ms)
 * 2. Short-timeout Firebase Storage attempt (bypasses hang if bucket does not exist)
 * 3. Short-timeout Server fallback (/api/upload-image)
 * 4. Direct Firestore uploaded_images metadata persistence
 * 5. Guaranteed WebP Data URL fallback ensuring zero data loss & instant rendering
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

  // Step 1: Compress image to binary Blob and WebP Data URL
  const { blob, dataUrl, mimeType, extension } = await compressImageToBlob(file, 1200, 1200, 0.82);

  const timestamp = Date.now();
  const filePrefix = options?.customName
    ? sanitizePathSegment(options.customName)
    : options?.isGallery
    ? `gallery-${options.galleryIndex || 1}`
    : 'main';
  const cleanFileName = `${timestamp}-${filePrefix}.${extension}`;
  const storagePath = `products/${cleanId}/${cleanFileName}`;

  // Step 2: Primary Secure Server Upload (/api/upload-image -> Cloudinary HTTPS URL)
  try {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 12000);

    const resp = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        data_url: dataUrl,
        filename: cleanFileName,
        product_id: cleanId,
      }),
    });
    clearTimeout(abortTimeout);

    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await resp.json();
        if (json.success && json.url && typeof json.url === 'string') {
          let cleanUrl = json.url;
          if (cleanUrl.includes('/api/product-image/')) {
            cleanUrl = cleanUrl.substring(cleanUrl.indexOf('/api/product-image/'));
          } else if (cleanUrl.includes('localhost:3000')) {
            cleanUrl = cleanUrl.replace(/^https?:\/\/localhost:3000/i, '');
          }
          return cleanUrl;
        }
      }
    }
  } catch (serverErr) {
    console.warn('Server upload error, evaluating fallbacks:', serverErr);
  }

  // Step 3: Optional Firebase Storage attempt (if configured)
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, s-maxage=31536000',
        });
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage timeout')), 2500)
      );

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      if (downloadUrl && (downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://'))) {
        return downloadUrl.replace(/^http:\/\//i, 'https://');
      }
    } catch (storageErr: any) {
      console.warn('Firebase Storage upload bypassed/timed out:', storageErr?.message || storageErr?.code);
    }
  }

  // Step 4: Write image record directly to Firestore uploaded_images collection (if db available)
  try {
    if (db) {
      const imageId = `img-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'uploaded_images', imageId), {
        id: imageId,
        product_id: cleanId,
        filename: cleanFileName,
        data_url: dataUrl,
        created_at: new Date().toISOString(),
      });
      return `/api/product-image/${imageId}`;
    }
  } catch (fsErr) {
    console.warn('Direct Firestore uploaded_images save note:', fsErr);
  }

  // Step 5: Guaranteed return of the high-clarity, ultra-lightweight WebP data URL
  if (dataUrl && dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }


  return dataUrl;
}

/**
 * Uploads a category image and returns an optimized image URL.
 */
export async function uploadCategoryImageToStorage(
  file: File,
  categoryId?: string
): Promise<string> {
  const cleanId = sanitizePathSegment(categoryId || `cat-${Date.now().toString(36)}`);

  // Step 1: Compress image to binary Blob (1000x1000 max, 0.82 quality)
  const { blob, dataUrl, mimeType, extension } = await compressImageToBlob(file, 1000, 1000, 0.82);

  const timestamp = Date.now();
  const cleanFileName = `${timestamp}-category.${extension}`;
  const storagePath = `categories/${cleanId}/${cleanFileName}`;

  // Step 2: Attempt primary Firebase Storage upload with 2.5s race timeout
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, s-maxage=31536000',
        });
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Storage timeout')), 2500)
      );

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      if (downloadUrl && (downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://'))) {
        return downloadUrl.replace(/^http:\/\//i, 'https://');
      }
    } catch (storageErr: any) {
      console.warn('Direct Firebase Storage category upload bypassed/timed out:', storageErr?.message);
    }
  }

  // Step 3: Server Fallback Upload
  try {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 2500);

    const resp = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        data_url: dataUrl,
        filename: cleanFileName,
        product_id: `category-${cleanId}`,
      }),
    });
    clearTimeout(abortTimeout);

    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await resp.json();
        if (json.success && json.url && typeof json.url === 'string') {
          let cleanUrl = json.url;
          if (cleanUrl.includes('/api/product-image/')) {
            cleanUrl = cleanUrl.substring(cleanUrl.indexOf('/api/product-image/'));
          } else if (cleanUrl.includes('localhost:3000')) {
            cleanUrl = cleanUrl.replace(/^https?:\/\/localhost:3000/i, '');
          }
          return cleanUrl;
        }
      }
    }
  } catch (serverErr) {
    console.warn('Server fallback category upload error:', serverErr);
  }

  // Step 4: Final reliable return of optimized WebP data URL
  if (dataUrl && dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return dataUrl;
}

