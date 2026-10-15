import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AboutPageData, defaultAboutPageData } from '../models/aboutPageSchema';
import { optimizeAndConvertToWebP } from '../utils/imageOptimizer';

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

function getFirestoreInstance() {
  try {
    let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {}
    }
    const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(fbApp);
  } catch (e) {
    return null;
  }
}

function cleanForFirestore(data: any): any {
  if (data === null || data === undefined) return '';
  if (Array.isArray(data)) return data.map(cleanForFirestore);
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) cleaned[k] = cleanForFirestore(v);
    }
    return cleaned;
  }
  return data;
}

// Reference to shared DB and save function injected by server
let sharedDb: any = null;
let saveDbFn: (() => void) | null = null;
let syncVersionsRef: Record<string, number> | null = null;

export function setSharedDb(db: any, saveFn: () => void, syncVersions?: Record<string, number>) {
  sharedDb = db;
  saveDbFn = saveFn;
  if (syncVersions) {
    syncVersionsRef = syncVersions;
  }
}

/**
 * Helper to ensure upload directory exists
 */
function ensureUploadDirectory(): string {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

/**
 * GET /api/about
 * Public customer-facing endpoint to fetch dynamic About Us data
 */
export async function getAboutPage(req: Request, res: Response) {
  try {
    let aboutData: AboutPageData = (sharedDb && sharedDb.about_page) || defaultAboutPageData;
    
    // Ensure all required fields exist
    if (!aboutData.features || !Array.isArray(aboutData.features) || aboutData.features.length === 0) {
      aboutData = {
        ...defaultAboutPageData,
        ...aboutData,
        features: defaultAboutPageData.features
      };
    }

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return res.json({
      success: true,
      data: aboutData
    });
  } catch (error: any) {
    console.error('Error fetching About Us data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve About Us page data',
      data: defaultAboutPageData
    });
  }
}

/**
 * PUT /api/admin/about & POST /api/admin/about
 * Secure Admin endpoint to update About Us content
 */
export async function updateAboutPage(req: Request, res: Response) {
  try {
    const payload = req.body || {};
    const uploadDir = ensureUploadDirectory();

    // 1. Process CEO Image if provided as a base64 Data URL
    let finalCeoImageUrl = payload.ceo_image_url || '';
    if (typeof finalCeoImageUrl === 'string' && finalCeoImageUrl.startsWith('data:image/')) {
      try {
        const matches = finalCeoImageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches && matches[2]) {
          let ext = matches[1].toLowerCase();
          if (ext === 'jpeg') ext = 'jpg';
          if (ext === 'svg+xml') ext = 'svg';
          const buffer = Buffer.from(matches[2], 'base64');
          const safeName = `ceo-${Date.now()}.${ext}`;
          const filePath = path.join(uploadDir, safeName);
          fs.writeFileSync(filePath, buffer);
          finalCeoImageUrl = `/uploads/${safeName}`;
        }
      } catch (imgErr) {
        console.warn('Could not write CEO image data URL to disk, keeping provided URL:', imgErr);
      }
    }

    // 2. Validate & format 3 Feature Cards
    let sanitizedFeatures = Array.isArray(payload.features) ? payload.features.slice(0, 3) : [];
    if (sanitizedFeatures.length < 3) {
      // Fill missing features from default
      while (sanitizedFeatures.length < 3) {
        const idx = sanitizedFeatures.length;
        sanitizedFeatures.push(defaultAboutPageData.features[idx] || {
          title: `সুবিধা #${idx + 1}`,
          description: "আমাদের প্রিমিয়াম পণ্য ও আন্তরিক সেবার নিশ্চয়তা।",
          icon: "ShieldCheck",
          badge: "নিশ্চিত কোয়ালিটি"
        });
      }
    }

    // Ensure icons and text exist
    sanitizedFeatures = sanitizedFeatures.map((f, i) => ({
      id: f.id || `feature-${i + 1}`,
      title: (f.title || '').trim() || `সুবিধা #${i + 1}`,
      description: (f.description || '').trim() || 'নিখুঁত গ্রাহক সেবা ও পণ্য মান।',
      icon: (f.icon || 'ShieldCheck').trim(),
      badge: (f.badge || '').trim(),
      image_url: f.image_url || ''
    }));

    // 3. Construct structured updated object
    const updatedAboutPage: AboutPageData = {
      title: (payload.title || '').trim() || defaultAboutPageData.title,
      subtitle: (payload.subtitle || '').trim() || defaultAboutPageData.subtitle,
      brand_story: (payload.brand_story || '').trim() || defaultAboutPageData.brand_story,
      mission: (payload.mission || '').trim() || defaultAboutPageData.mission,
      vision: (payload.vision || '').trim() || defaultAboutPageData.vision,
      features: sanitizedFeatures,
      contact_info: {
        phone: (payload.contact_info?.phone || payload.phone || '').trim() || defaultAboutPageData.contact_info.phone,
        email: (payload.contact_info?.email || payload.email || '').trim() || defaultAboutPageData.contact_info.email,
        address: (payload.contact_info?.address || payload.address || '').trim() || defaultAboutPageData.contact_info.address,
        whatsapp: (payload.contact_info?.whatsapp || payload.whatsapp || '').trim() || defaultAboutPageData.contact_info.whatsapp,
        facebook: (payload.contact_info?.facebook || payload.facebook || '').trim() || defaultAboutPageData.contact_info.facebook,
        working_hours: (payload.contact_info?.working_hours || payload.working_hours || '').trim() || defaultAboutPageData.contact_info.working_hours,
      },
      ceo_name: (payload.ceo_name || '').trim() || defaultAboutPageData.ceo_name,
      ceo_title: (payload.ceo_title || '').trim() || defaultAboutPageData.ceo_title,
      ceo_message: (payload.ceo_message || '').trim() || defaultAboutPageData.ceo_message,
      ceo_image_url: finalCeoImageUrl || (sharedDb?.about_page?.ceo_image_url || ''),
      established_year: (payload.established_year || defaultAboutPageData.established_year || '2023').trim(),
      happy_customers_count: (payload.happy_customers_count || defaultAboutPageData.happy_customers_count || '২৫,০০০+').trim(),
      total_deliveries: (payload.total_deliveries || defaultAboutPageData.total_deliveries || '৩৫,০০০+').trim(),
      updated_at: new Date().toISOString()
    };

    // 4. Save to shared database and persist
    if (sharedDb) {
      sharedDb.about_page = updatedAboutPage;
      if (saveDbFn) {
        saveDbFn();
      }
    }

    // Persist to Cloud Firestore
    try {
      const fsDb = getFirestoreInstance();
      if (fsDb) {
        setDoc(doc(fsDb, 'settings', 'about_page'), cleanForFirestore(updatedAboutPage), { merge: true }).catch(() => {});
        setDoc(doc(fsDb, 'site_settings', 'about_page'), cleanForFirestore(updatedAboutPage), { merge: true }).catch(() => {});
      }
    } catch (fsErr) {
      console.warn('Firestore about_page async sync note:', fsErr);
    }

    if (syncVersionsRef) {
      syncVersionsRef.settings = Date.now();
    }

    return res.json({
      success: true,
      message: 'About Us page content successfully updated and saved!',
      data: updatedAboutPage
    });
  } catch (error: any) {
    console.error('Error updating About Us page:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update About Us page'
    });
  }
}

/**
 * POST /api/admin/about/upload-ceo
 * Dedicated file upload handler specifically for the CEO's Image
 */
export async function uploadCeoImage(req: Request, res: Response) {
  try {
    const { data_url, filename } = req.body || {};
    if (!data_url || typeof data_url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Image data URL or base64 payload is required'
      });
    }

    const matches = data_url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || !matches[2]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image data URL format. Expected data:image/*;base64,...'
      });
    }

    let rawExt = matches[1].toLowerCase();
    if (rawExt === 'jpeg') rawExt = 'jpg';
    if (rawExt === 'svg+xml') rawExt = 'svg';

    const rawBuffer = Buffer.from(matches[2], 'base64');
    const { buffer, ext } = await optimizeAndConvertToWebP(rawBuffer, rawExt, {
      maxWidth: 1200,
      quality: 85,
      convertToWebP: rawExt !== 'svg'
    });

    const uploadDir = ensureUploadDirectory();
    const safeName = `ceo-profile-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);
    const serverUrl = `/uploads/${safeName}`;

    // Auto-update db.about_page if available
    if (sharedDb) {
      if (!sharedDb.about_page) {
        sharedDb.about_page = { ...defaultAboutPageData };
      }
      sharedDb.about_page.ceo_image_url = serverUrl;
      sharedDb.about_page.updated_at = new Date().toISOString();
      if (saveDbFn) {
        saveDbFn();
      }
    }

    return res.json({
      success: true,
      message: 'CEO image uploaded and saved successfully',
      url: serverUrl,
      filename: safeName
    });
  } catch (error: any) {
    console.error('Error uploading CEO image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error while uploading CEO image'
    });
  }
}
