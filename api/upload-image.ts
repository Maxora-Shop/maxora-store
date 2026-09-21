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

// Extract and validate Cloudinary credentials from process.env
function getCloudinaryCredentials() {
  let cloudName = (
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.VITE_CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    ''
  ).trim();
  let apiKey = (
    process.env.CLOUDINARY_API_KEY ||
    process.env.VITE_CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    ''
  ).trim();
  let apiSecret = (
    process.env.CLOUDINARY_API_SECRET ||
    process.env.VITE_CLOUDINARY_API_SECRET ||
    ''
  ).trim();

  // Strip accidental quotes
  cloudName = cloudName.replace(/^['"]+|['"]+$/g, '');
  apiKey = apiKey.replace(/^['"]+|['"]+$/g, '');
  apiSecret = apiSecret.replace(/^['"]+|['"]+$/g, '');

  // Support CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
  if (!cloudName || !apiKey || !apiSecret) {
    const cloudinaryUrl = (process.env.CLOUDINARY_URL || '').trim().replace(/^['"]+|['"]+$/g, '');
    if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    }
  }

  return { cloudName, apiKey, apiSecret };
}

// Secure server-side Cloudinary upload helper
async function uploadToCloudinary(
  dataUrl: string,
  productId: string
): Promise<{ success: boolean; url?: string; public_id?: string; error?: string }> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();

  if (!cloudName || !apiKey || !apiSecret) {
    const missing: string[] = [];
    if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
    if (!apiKey) missing.push('CLOUDINARY_API_KEY');
    if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
    return {
      success: false,
      error: `Cloudinary credentials missing: ${missing.join(', ')}. Please verify that these variables are set in the Vercel project settings and the deployment has been rebuilt.`,
    };
  }

  const cleanProdId = (productId || 'product').toString().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const publicId = `${cleanProdId}_${uniqueSuffix}`;
  const folder = 'products';
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Cloudinary signature parameters sorted alphabetically: folder, public_id, timestamp
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  // Cloudinary image upload endpoint expects multipart/form-data
  const formData = new FormData();
  formData.append('file', dataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('public_id', publicId);
  formData.append('folder', folder);
  formData.append('signature', signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url) {
    const errMsg = result.error?.message || `Cloudinary rejected upload (HTTP ${response.status}): ${JSON.stringify(result)}`;
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

