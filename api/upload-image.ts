import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

// Helper to clean credentials (strip quotes, escaped quotes, spaces, and linebreaks)
function cleanCredential(val: string | undefined): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/^\\?["']+|\\?["']+$/g, '')
    .trim();
}

// Extract and validate Cloudinary credentials from process.env
function getCloudinaryCredentials() {
  let cloudName = cleanCredential(
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_NAME ||
    process.env.VITE_CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  );
  let apiKey = cleanCredential(
    process.env.CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_KEY ||
    process.env.VITE_CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  );
  let apiSecret = cleanCredential(
    process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_SECRET ||
    process.env.VITE_CLOUDINARY_API_SECRET
  );

  // Support CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
  if (!cloudName || !apiKey || !apiSecret) {
    const cloudinaryUrl = cleanCredential(process.env.CLOUDINARY_URL);
    if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || cleanCredential(match[1]);
        apiSecret = apiSecret || cleanCredential(match[2]);
        cloudName = cloudName || cleanCredential(match[3]);
      }
    }
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Generates Cloudinary upload signature following Cloudinary's exact specification:
 * 1. Collect all parameters to be signed (excluding file, api_key, signature, resource_type, cloud_name).
 * 2. Filter out undefined, null, or empty string parameters.
 * 3. Sort parameter keys alphabetically.
 * 4. Construct 'key=value' pairs joined by '&'.
 * 5. Append CLOUDINARY_API_SECRET directly to the end of the string (without any separator).
 * 6. Compute SHA-1 hex digest: crypto.createHash('sha1').update(stringToSign + apiSecret).digest('hex').
 * Note: Never use HMAC-SHA1.
 */
function generateCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string
): { signature: string; stringToSign: string } {
  const sortedKeys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort();

  const pairs: string[] = [];
  for (const key of sortedKeys) {
    pairs.push(`${key}=${params[key]}`);
  }

  const stringToSign = pairs.join('&');

  const signature = crypto
    .createHash('sha1')
    .update(stringToSign + apiSecret)
    .digest('hex');

  return { signature, stringToSign };
}

// Secure server-side Cloudinary upload helper
async function uploadToCloudinary(
  dataUrl: string,
  productId: string
): Promise<{ success: boolean; url?: string; public_id?: string; error?: string }> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const uploadPreset = cleanCredential(
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    process.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  if (!cloudName) {
    return {
      success: false,
      error: 'Cloudinary CLOUDINARY_CLOUD_NAME is missing in environment variables.',
    };
  }

  // If upload preset is provided, we can use unsigned upload directly
  const cleanProdId = (productId || 'product').toString().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const publicId = `${cleanProdId}_${uniqueSuffix}`;
  const folder = 'products';
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  if (uploadPreset) {
    try {
      const presetFormData = new FormData();
      presetFormData.append('file', dataUrl);
      presetFormData.append('upload_preset', uploadPreset);
      presetFormData.append('folder', folder);
      presetFormData.append('public_id', publicId);

      const res = await fetch(endpoint, { method: 'POST', body: presetFormData });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.secure_url) {
        return { success: true, url: data.secure_url, public_id: data.public_id };
      }
    } catch {
      // Fall through to authenticated upload
    }
  }

  if (!apiKey || !apiSecret) {
    const missing: string[] = [];
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    return {
      success: false,
      error: `Cloudinary credentials missing: ${missing.join(', ')}. Please verify that these variables are set in the Vercel project settings and the deployment has been rebuilt.`,
    };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // ATTEMPT 1: Cloudinary official Basic Authentication for server-side uploads
  // Authorization: Basic base64(api_key:api_secret)
  // Bypasses manual signature and avoids signature mismatch algorithms entirely
  try {
    const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const basicFormData = new FormData();
    basicFormData.append('file', dataUrl);
    basicFormData.append('folder', folder);
    basicFormData.append('public_id', publicId);

    const basicRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
      body: basicFormData,
    });

    const basicData = await basicRes.json().catch(() => ({}));
    if (basicRes.ok && basicData.secure_url) {
      return {
        success: true,
        url: basicData.secure_url,
        public_id: basicData.public_id,
      };
    }
  } catch (basicErr) {
    console.warn('Basic auth attempt error, falling back to signature:', basicErr);
  }

  // ATTEMPT 2: Signature-based upload (Sorted alphabetically: folder, public_id, timestamp)
  const uploadParams: Record<string, string> = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const { signature, stringToSign } = generateCloudinarySignature(uploadParams, apiSecret);

  const formData = new FormData();
  formData.append('file', dataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', uploadParams.timestamp);
  formData.append('public_id', uploadParams.public_id);
  formData.append('folder', uploadParams.folder);
  formData.append('signature', signature);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) {
    const rawErrMsg = result.error?.message || `Cloudinary rejected upload (HTTP ${response.status}): ${JSON.stringify(result)}`;
    let errMsg = rawErrMsg;
    if (rawErrMsg.toLowerCase().includes('invalid signature')) {
      errMsg = `Cloudinary Invalid Signature: Your CLOUDINARY_API_SECRET does not match your CLOUDINARY_API_KEY ('${apiKey.slice(0, 4)}***') in Cloud Name '${cloudName}'. Please copy the exact API Secret from Cloudinary Console (Settings > Access Keys / API Keys) and update it in Vercel Environment Variables, then redeploy.`;
    }
    return { success: false, error: errMsg };
  }

  return {
    success: true,
    url: result.secure_url,
    public_id: result.public_id,
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    let payload: any = (req as any).body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // keep as is
      }
    }

    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      const rawBody = await new Promise<string>((resolve) => {
        let acc = '';
        if (typeof (req as any).on === 'function') {
          req.on('data', (chunk: any) => {
            acc += chunk;
          });
          req.on('end', () => resolve(acc));
          req.on('error', () => resolve(acc));
        } else if (typeof (req as any)[Symbol.asyncIterator] === 'function') {
          (async () => {
            try {
              for await (const chunk of req) {
                acc += chunk;
              }
              resolve(acc);
            } catch {
              resolve(acc);
            }
          })();
        } else {
          resolve('');
        }
      });

      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON request payload' }));
          return;
        }
      }
    }

    const { data_url, filename, product_id } = payload || {};

    if (!data_url || typeof data_url !== 'string') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'data_url is required' }));
      return;
    }

    // Validate that the uploaded data is an allowed image format
    if (!data_url.startsWith('data:image/')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Invalid image format. Must be a valid data:image URL.' }));
      return;
    }

    // Step 1: Secure Cloudinary Upload (Zero Firestore storage, Permanent CDN URL)
    const cloudResult = await uploadToCloudinary(data_url, product_id);
    if (!cloudResult.success || !cloudResult.url) {
      // STRICT REQUIREMENT: No silent Base64 or Firestore fallback for new uploads.
      console.error('Cloudinary upload failure:', cloudResult.error);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: cloudResult.error || 'Cloudinary upload failed',
      }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        url: cloudResult.url,
        id: cloudResult.public_id,
        provider: 'cloudinary',
      })
    );
  } catch (err: any) {
    console.error('Server upload error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }));
  }
}

