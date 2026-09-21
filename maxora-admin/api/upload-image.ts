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

// Secure server-side Cloudinary upload helper
async function uploadToCloudinary(
  dataUrl: string,
  productId: string
): Promise<{ success: boolean; url?: string; public_id?: string; error?: string }> {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  let apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  let apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  // Support CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
  if (!cloudName || !apiKey || !apiSecret) {
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
    if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      success: false,
      error: 'Cloudinary credentials missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or CLOUDINARY_URL in server environment.',
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
    const errMsg = result.error?.message || `Cloudinary upload failed (status ${response.status})`;
    return { success: false, error: errMsg };
  }

  return {
    success: true,
    url: result.secure_url,
    public_id: result.public_id,
  };
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const payload = JSON.parse(body || '{}');
    const { data_url, filename, product_id } = payload;

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

