import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface CompressedImageResult {
  blob: Blob;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
}

function sanitizePathSegment(val: string): string {
  return (val || 'general')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
}

export async function compressImageToBlob(
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
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
  const { blob, mimeType, extension } = await compressImageToBlob(file);

  const timestamp = Date.now();
  const filePrefix = options?.customName
    ? sanitizePathSegment(options.customName)
    : options?.isGallery
    ? `gallery-${options.galleryIndex || 1}`
    : 'main';
  const cleanFileName = `${timestamp}-${filePrefix}.${extension}`;
  const storagePath = `products/${cleanId}/${cleanFileName}`;

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
      console.warn('Direct Firebase Storage upload encountered an error:', storageErr?.code || storageErr?.message);
    }
  }

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
    'Image upload failed. Please ensure Firebase Cloud Storage is enabled in your Firebase Console.'
  );
}
