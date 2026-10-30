import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

try {
  setLogLevel('error');
} catch (e) {}

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function getFirestoreDb() {
  const app = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  const dbId = DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
  return dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
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

const defaultAboutData = {
  title: "আমাদের পরিচিতি ও অঙ্গীকার",
  subtitle: "১০০% প্রিমিয়াম কোয়ালিটি লাইফস্টাইল পণ্য, দ্রুততম হোম ডেলিভারি ও শতভাগ গ্রাহক আস্থার অঙ্গীকার।",
  brand_story: "ম্যাক্সোরা বাংলাদেশ (maxorabd.com) এর যাত্রা শুরু হয়েছে বাংলাদেশের স্মার্ট ক্রেতাদের জন্য খাঁটি, আধুনিক এবং প্রিমিয়াম কোয়ালিটি লাইফস্টাইল ও ইলেকট্রনিক্স গ্যাজেট সহজলভ্য করার প্রত্যয় নিয়ে।\n\nআমরা বিশ্বাস করি, একটি সফল ইকমার্স কেবল পণ্য বিক্রয় নয়—এটি গ্রাহকের সাথে দীর্ঘমেয়াদী বিশ্বাস ও আস্থার সেতুবন্ধন। তাই প্রতিটি পণ্য আমরা সরাসরি ভেরিফায়েড ম্যানুফ্যাকচারার ও বিশ্বস্ত আমদানিকারকদের কাছ থেকে সংগ্রহ করি এবং আমাদের নিজস্ব টিম দ্বারা ইনস্পেকশন শেষে ডেলিভারি নিশ্চিত করি।\n\nক্যাশ অন ডেলিভারি, সাশ্রয়ী কুরিয়ার চার্জ এবং বিক্রয়োত্তর নির্ভরযোগ্য সেবা দিয়ে আমরা দেশের প্রতিটি প্রান্তে গ্রাহকের সর্বোচ্চ সন্তুষ্টি অর্জনে অবিরাম কাজ করে যাচ্ছি।",
  mission: "বাংলাদেশের প্রতিটি ঘরে সেরা কোয়ালিটির গ্যাজেট ও লাইফস্টাইল পণ্য সাশ্রয়ী মূল্যে নিরাপদে পৌঁছে দেওয়া।",
  vision: "সততা, প্রিমিয়াম গ্রাহক সেবা ও আধুনিক প্রযুক্তির সমন্বয়ে দেশের শীর্ষস্থানীয় নির্ভরযোগ্য ই-কমার্স ব্র্যান্ড হওয়া।",
  features: [
    {
      id: "feature-1",
      title: "১০০% অরিজিনাল ও অথেন্টিক পণ্য",
      description: "কোনো নকল বা নিম্নমানের পণ্য নয়; প্রতিটি গ্যাজেটের নিখুঁত গুণগত মান ও কার্যকারিতা সরাসরি যাচাইকৃত।",
      icon: "ShieldCheck",
      badge: "গুণগত মান নিশ্চিত",
      image_url: ""
    },
    {
      id: "feature-2",
      title: "সারাদেশে সুপার ফাস্ট হোম ডেলিভারি",
      description: "ঢাকায় ২৪-৪৮ ঘণ্টায় এবং ঢাকার বাইরে সর্বোচ্চ ৩-৫ দিনে নির্ভরযোগ্য কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারি।",
      icon: "Truck",
      badge: "ক্যাশ অন ডেলিভারি",
      image_url: ""
    },
    {
      id: "feature-3",
      title: "২৪/৭ আন্তরিক কাস্টমার সাপোর্ট",
      description: "অর্ডার ট্র্যাকিং, প্রোডাক্ট গাইডেন্স কিংবা যেকোনো প্রয়োজনে আমাদের এক্সপার্ট টিম কল ও হোয়াটসঅ্যাপে সদা প্রস্তুত।",
      icon: "Headphones",
      badge: "দ্রুত সমাধান",
      image_url: ""
    }
  ],
  contact_info: {
    phone: "01635451746",
    email: "support@maxorabd.com",
    address: "বাড়ি #১২, রোড #০৪, সেক্টর #১১, উত্তরা, ঢাকা-১২৩০, বাংলাদেশ",
    whatsapp: "+8801635451746",
    facebook: "https://facebook.com/maxora.store",
    working_hours: "সকাল ১০:০০ টা - রাত ১০:০০ টা (প্রতিদিন)"
  },
  ceo_name: "Lutas Biswas",
  ceo_title: "প্রতিষ্ঠাতা ও প্রধান নির্বাহী কর্মকর্তা (Founder & CEO)",
  ceo_message: "ম্যাক্সোরা-তে আমাদের প্রতিটি কাজের কেন্দ্রবিন্দুতে রয়েছেন আপনি—আমাদের সম্মানিত গ্রাহক। অনলাইন কেনাকাটায় প্রতারণা ও নিম্নমানের পণ্যের ভিড়ে আমরা সততা ও কোয়ালিটির একটি স্বচ্ছ মানদণ্ড প্রতিষ্ঠা করতে চাই।\n\nআমরা প্রতিটি প্রোডাক্টের পেছনে দাঁড়িয়ে গ্রাহককে বিক্রয়োত্তর নির্ভরযোগ্য সহায়তার গ্যারান্টি দিই। আমাদের সাথে আপনার এই আস্থার পথচলাই আমাদের সবচেয়ে বড় অর্জন।",
  ceo_image_url: "",
  established_year: "2023",
  happy_customers_count: "২৫,০০০+",
  total_deliveries: "৩৫,০০০+"
};

let memoryAboutCache: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-token');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // GET: Retrieve About Us data
  if (req.method === 'GET') {
    try {
      const db = getFirestoreDb();
      const snap = await getDoc(doc(db, 'settings', 'about_page'));
      if (snap.exists()) {
        memoryAboutCache = snap.data();
      } else {
        const snap2 = await getDoc(doc(db, 'site_settings', 'about_page'));
        if (snap2.exists()) {
          memoryAboutCache = snap2.data();
        }
      }
    } catch (e: any) {
      console.warn('Firestore about_page read warning:', e?.message || e);
    }

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      data: memoryAboutCache || defaultAboutData
    }));
    return;
  }

  // POST or PUT: Update About Us data
  if (req.method === 'POST' || req.method === 'PUT') {
    let bodyText = '';
    req.on('data', (chunk) => {
      bodyText += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');
        const dataToSave = {
          ...defaultAboutData,
          ...(memoryAboutCache || {}),
          ...(payload.data || payload),
          updated_at: new Date().toISOString()
        };

        // Offload base64 CEO image if supplied
        if (typeof dataToSave.ceo_image_url === 'string' && dataToSave.ceo_image_url.startsWith('data:image/')) {
          try {
            const matches = dataToSave.ceo_image_url.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches && matches[2]) {
              let ext = matches[1].toLowerCase();
              if (ext === 'jpeg') ext = 'jpg';
              if (ext === 'svg+xml') ext = 'svg';
              const buffer = Buffer.from(matches[2], 'base64');
              const safeName = `ceo-${Date.now()}.${ext}`;
              const uploadDir = path.join(process.cwd(), 'public', 'uploads');
              if (!fs.existsSync(uploadDir)) {
                try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
              }
              const filePath = path.join(uploadDir, safeName);
              fs.writeFileSync(filePath, buffer);
              dataToSave.ceo_image_url = `/uploads/${safeName}`;
            }
          } catch (imgErr) {
            console.warn('Could not write CEO image to disk in serverless handler:', imgErr);
          }
        }

        memoryAboutCache = dataToSave;

        // Persist to Firestore
        try {
          const db = getFirestoreDb();
          await setDoc(doc(db, 'settings', 'about_page'), cleanForFirestore(dataToSave), { merge: true });
          await setDoc(doc(db, 'site_settings', 'about_page'), cleanForFirestore(dataToSave), { merge: true });
        } catch (fsErr: any) {
          console.warn('Firestore write warning:', fsErr?.message || fsErr);
        }

        // Mirror to local maxora_db.json if available
        try {
          const dbFilePath = path.join(process.cwd(), 'maxora_db.json');
          if (fs.existsSync(dbFilePath)) {
            const dbData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
            dbData.about_page = dataToSave;
            fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2), 'utf8');
          }
        } catch {}

        res.statusCode = 200;
        res.end(JSON.stringify({
          success: true,
          message: 'About Us page saved successfully!',
          data: dataToSave
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({
          success: false,
          error: err?.message || 'Failed to save About Us page'
        }));
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
}
