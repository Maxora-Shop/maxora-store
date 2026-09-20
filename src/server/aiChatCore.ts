import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { Product, StoreSettings, AiFaqItem } from '../types';

export interface AiChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  currentProduct?: Partial<Product> | null;
  activeFaqs?: AiFaqItem[];
  settings?: Partial<StoreSettings>;
  candidateProducts?: Array<{
    id: string;
    name: string;
    slug?: string;
    selling_price: number;
    discount?: number;
    stock: number;
    brand?: string;
    category?: string;
    image_url?: string;
    description?: string;
  }>;
}

export interface AiChatResponse {
  reply: string;
  recommendedProductIds?: string[];
  needsWhatsApp?: boolean;
  whatsappPrefilledText?: string;
  source?: 'gemini' | 'faq' | 'catalog' | 'fallback';
}

let geminiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory high-speed cache for concurrent customers
interface CacheEntry {
  response: AiChatResponse;
  timestamp: number;
}
const aiQueryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500;

function getCacheKey(userQuery: string, currentProductId?: string): string {
  return `${currentProductId || 'catalog'}:${userQuery.toLowerCase().trim()}`;
}

type QueryLanguage = 'bn' | 'banglish' | 'en';

export function detectQueryLanguage(text: string): QueryLanguage {
  const t = text.toLowerCase().trim();
  // Check for Bengali script (Unicode range \u0980-\u09FF)
  if (/[\u0980-\u09FF]/.test(t)) {
    return 'bn';
  }

  const banglishTokens = [
    'koto', 'dam', 'daam', 'kivabe', 'ki vabe', 'order', 'korbo', 'korte', 'chai', 'parbo', 'ache', 'ase',
    'kina', 'apnader', 'apnar', 'bhai', 'vai', 'dhaka', 'dhakar', 'baire', 'taka', 'tk', 'pabo', 'deya',
    'jabe', 'advance', 'ogrim', 'shob', 'sob', 'kothay', 'kotodur', 'lagbe', 'hobe', 'ki', 'ei', 'eta',
    'oita', 'kichu', 'bhalo', 'valo', 'dekhan', 'dekhano', 'nibo', 'kena', 'shunchen', 'ashbe', 'pothano',
    'pathaben', 'shathe', 'sathe', 'shobar', 'chole', 'poshondo', 'khub', 'ekta', 'akta', 'asholei', 'asole',
    'dokan', 'showroom', 'thikana', 'somoy', 'din', 'lagbe', 'kobe', 'ashbe', 'dekhte', 'chai', 'original',
    'asol', 'nakol', 'kharap', 'nosto', 'bodle', 'change'
  ];

  const words = t.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const hasStrongBanglish = words.some((w) =>
    ['koto', 'dam', 'kivabe', 'korbo', 'korte', 'ache', 'ase', 'apnader', 'lagbe', 'pabo', 'nibo', 'taka', 'baire', 'bhai', 'vai', 'eta', 'oita', 'kina', 'dokan'].includes(w)
  );
  if (hasStrongBanglish) {
    return 'banglish';
  }

  let banglishCount = 0;
  for (const w of words) {
    if (banglishTokens.includes(w)) banglishCount++;
  }

  if (banglishCount >= 2 || (words.length <= 4 && banglishCount >= 1)) {
    return 'banglish';
  }

  return 'en';
}

function loadFallbackCatalogAndSettings(): { products: any[]; settings: any; faqs: any[] } {
  try {
    const dbPath = path.join(process.cwd(), 'maxora_db.json');
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        settings: parsed.settings || {},
        faqs: Array.isArray(parsed.settings?.ai_faqs) ? parsed.settings.ai_faqs : [],
      };
    }
  } catch (e) {
    console.warn('Could not read maxora_db.json for AI context:', e);
  }
  return { products: [], settings: {}, faqs: [] };
}

/**
 * Intelligent multilingual local intent matcher as safety fallback or fast responder for standard queries
 */
function matchLocalIntent(
  userQuery: string,
  req: AiChatRequest
): AiChatResponse | null {
  const q = userQuery.toLowerCase().trim();
  const currentProd = req.currentProduct;
  const faqs = (req.activeFaqs || []).filter((f) => f.active !== false);
  const settings = req.settings || {};
  const insideDhaka = settings.delivery_inside_dhaka ?? 70;
  const subDhaka = settings.delivery_sub_dhaka ?? 100;
  const outsideDhaka = settings.delivery_outside_dhaka ?? 130;
  const whatsappNum = settings.ai_whatsapp_number || settings.whatsapp || settings.phone || '+8801635451746';

  const lang = detectQueryLanguage(userQuery);

  // 1. Human / WhatsApp Escalation Request
  if (
    q.includes('মানুষ') ||
    q.includes('কথা বলতে') ||
    q.includes('human') ||
    q.includes('agent') ||
    q.includes('support team') ||
    q.includes('হোয়াটসঅ্যাপ') ||
    q.includes('whatsapp') ||
    q.includes('কল দিতে') ||
    q.includes('call') ||
    q.includes('kotha bolbo') ||
    q.includes('manush')
  ) {
    let reply = 'অবশ্যই! আমাদের ডেডিকেটেড কাস্টমার সাপোর্ট টিমের সাথে সরাসরি WhatsApp-এ কথা বলতে নিচের বাটনে ক্লিক করুন।';
    if (lang === 'en') {
      reply = 'Sure! To speak directly with our dedicated customer support agent on WhatsApp, please tap the button below.';
    } else if (lang === 'banglish') {
      reply = 'Obosshoi! Amader dedicated customer support team-er sathe shorashori WhatsApp-e kotha bolte nicher batone click korun.';
    }
    return {
      reply,
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমি কাস্টমার সাপোর্টের সাথে কথা বলতে চাই। বিষয়: ${userQuery}`,
      source: 'fallback',
    };
  }

  // 2. Bulk / Wholesale Order Request
  if (
    q.includes('bulk') ||
    q.includes('পাইকারি') ||
    q.includes('paikari') ||
    q.includes('অনেকগুলো') ||
    q.includes('৫০টা') ||
    q.includes('১০০টা') ||
    q.includes('wholesale')
  ) {
    let reply = 'পাইকারি বা বাল্ক (Bulk) অর্ডারের জন্য বিশেষ ডিসকাউন্ট রয়েছে। বিস্তারিত জানতে সরাসরি আমাদের অফিসিয়াল WhatsApp-এ যোগাযোগ করুন।';
    if (lang === 'en') {
      reply = 'We offer special discount rates for wholesale and bulk orders! Please contact our official WhatsApp support team directly for quotation.';
    } else if (lang === 'banglish') {
      reply = 'Paikari ba bulk order-er jonno bishesh discount royeche. Bistarito jante shorashori amader official WhatsApp-e jogajog korun.';
    }
    return {
      reply,
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমি পাইকারি/বাল্ক অর্ডার করতে চাই। পণ্যের বিবরণ: ${currentProd?.name || userQuery}`,
      source: 'fallback',
    };
  }

  // 3. Order Issue / Complain Request
  if (
    q.includes('সমস্যা') ||
    q.includes('কমপ্লেন') ||
    q.includes('complain') ||
    q.includes('অর্ডার পাইনি') ||
    q.includes('ত্রুটি') ||
    q.includes('problem') ||
    q.includes('somossa') ||
    q.includes('kharap') ||
    q.includes('paini')
  ) {
    let reply = 'আপনার অর্ডার সংক্রান্ত যেকোনো সমস্যা বা অনুসন্ধানে আমাদের সাপোর্ট টিম দ্রুত সহায়তা প্রদান করবে। দয়া করে আপনার অর্ডার নম্বরসহ WhatsApp-এ মেসেজ দিন।';
    if (lang === 'en') {
      reply = 'Our support team will quickly assist you with any order issue. Please message us on WhatsApp with your Order ID or phone number.';
    } else if (lang === 'banglish') {
      reply = 'Apnar order shongkranto jekono shomosshay amader support team druto shohayota korbe. Doya kore apnar Order Number shoho WhatsApp-e message din.';
    }
    return {
      reply,
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমার অর্ডারে সমস্যা হয়েছে। আমার প্রশ্ন: ${userQuery}`,
      source: 'fallback',
    };
  }

  // 4. Check against Active Admin-configured FAQs
  for (const faq of faqs) {
    const faqQ = faq.question.toLowerCase().trim();
    if (faqQ && (q.includes(faqQ) || faqQ.includes(q))) {
      return {
        reply: faq.answer,
        source: 'faq',
      };
    }
  }

  // 5. Current Product Price Query
  if (
    currentProd &&
    (q.includes('দাম') ||
      q.includes('dam') ||
      q.includes('daam') ||
      q.includes('price') ||
      q.includes('টাকা') ||
      q.includes('cost') ||
      q.includes('rate'))
  ) {
    const finalPrice = Math.max(
      0,
      Number(currentProd.selling_price || 0) - Number(currentProd.discount || 0)
    );
    const hasDiscount = Number(currentProd.discount || 0) > 0;
    const inStock = Number(currentProd.stock || 0) > 0;

    let reply = '';
    if (lang === 'en') {
      reply = `The current offer price for **${currentProd.name}** is **৳${finalPrice.toLocaleString('en-BD')}**.${hasDiscount ? ` (Regular price: ৳${Number(currentProd.selling_price).toLocaleString('en-BD')}, saving ৳${Number(currentProd.discount).toLocaleString('en-BD')})` : ''}\n\n${inStock ? '✅ It is currently **In Stock** and ready for dispatch.' : '⚠️ Currently Out of Stock.'}\n\nYou can order with 100% Cash on Delivery by clicking the **"Buy Now"** button on this page.`;
    } else if (lang === 'banglish') {
      reply = `**${currentProd.name}**-er bortoman offer mullo **৳${finalPrice.toLocaleString('en-BD')}**.${hasDiscount ? ` (Regular price: ৳${Number(currentProd.selling_price).toLocaleString('en-BD')}, ৳${Number(currentProd.discount).toLocaleString('en-BD')} discount chalche!)` : ''}\n\n${inStock ? '✅ Product-ti bortomane amader stock-e ache.' : '⚠️ Bortomane stock shesh.'}\n\nCash on Delivery-te shorashori order korte page-er **"Buy Now"** batone click korun.`;
    } else {
      let priceText = `**${currentProd.name}**-এর বর্তমান মূল্য **৳${finalPrice.toLocaleString('en-BD')}**।`;
      if (hasDiscount) {
        priceText += ` (আসল মূল্য ৳${Number(currentProd.selling_price).toLocaleString('en-BD')}, ৳${Number(currentProd.discount).toLocaleString('en-BD')} বিশেষ ছাড় চলছে!)`;
      }
      const stockStatus = inStock
        ? 'বর্তমানে পণ্যটি আমাদের স্টকে এভেইলেবল রয়েছে।'
        : 'দুঃখিত, বর্তমানে পণ্যটির স্টক শেষ।';
      reply = `${priceText}\n\n${stockStatus}\nসরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে "Buy Now" বাটনে ক্লিক করতে পারেন।`;
    }

    return {
      reply,
      recommendedProductIds: currentProd.id ? [currentProd.id] : [],
      source: 'catalog',
    };
  }

  // 6. Current Product Stock Query
  if (
    currentProd &&
    (q.includes('stock') ||
      q.includes('স্টক') ||
      q.includes('আছে কি') ||
      q.includes('available') ||
      q.includes('পাবো কি') ||
      q.includes('ache kina') ||
      q.includes('ase kina'))
  ) {
    const inStock = Number(currentProd.stock || 0) > 0;
    let reply = '';
    if (lang === 'en') {
      reply = inStock
        ? `Yes! **${currentProd.name}** is currently **in stock** and ready for fast delivery across Bangladesh. Click "Buy Now" to order!`
        : `Sorry, **${currentProd.name}** is temporarily out of stock. Contact our WhatsApp support to get notified when restocked.`;
    } else if (lang === 'banglish') {
      reply = inStock
        ? `Ji haan, **${currentProd.name}** bortomane amader stock-e ache! Apni ekhon-i 100% Cash on Delivery-te order korte paren.`
        : `Dukhkito, **${currentProd.name}** bortomane stock shesh. Restock hole jante amader WhatsApp-e message dite paren.`;
    } else {
      reply = inStock
        ? `হ্যাঁ, **${currentProd.name}** বর্তমানে আমাদের স্টকে এভেইলেবল রয়েছে। আপনি এখনই ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন।`
        : `দুঃখিত, **${currentProd.name}** বর্তমানে সাময়িকভাবে স্টক-আউট রয়েছে। স্টক রিস্টক হলে জানতে আমাদের WhatsApp-এ মেসেজ রাখতে পারেন।`;
    }
    return {
      reply,
      recommendedProductIds: currentProd.id ? [currentProd.id] : [],
      needsWhatsApp: !inStock,
      whatsappPrefilledText: `হ্যালো Maxora, আমি ${currentProd.name}-এর স্টক রিস্টক সম্পর্কে জানতে চাই।`,
      source: 'catalog',
    };
  }

  // 7. Delivery Charge & Shipping Times Query
  if (
    q.includes('delivery') ||
    q.includes('ডেলিভারি') ||
    q.includes('চার্জ') ||
    q.includes('charge') ||
    q.includes('shipping') ||
    q.includes('ভাড়া') ||
    q.includes('koto din lagbe') ||
    q.includes('delivery charge')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `**Maxora Delivery Policy & Charges:**\n\n• **Inside Dhaka City:** ৳${insideDhaka} (2–3 business days)\n• **Dhaka Sub-area (Savar, Gazipur, Narayanganj, Keraniganj):** ৳${subDhaka} (2–3 business days)\n• **Outside Dhaka (All 64 districts nationwide):** ৳${outsideDhaka} (3–5 business days)\n\nWe provide **100% Cash on Delivery (COD)** nationwide—receive your parcel at your doorstep and pay after verification!`;
    } else if (lang === 'banglish') {
      reply = `**Maxora Delivery Charges & Rules:**\n\n• **Dhaka City-te:** ৳${insideDhaka} (২-৩ কার্যদিবস)\n• **Dhaka Sub-area (Savar, Gazipur, Narayanganj, Keraniganj):** ৳${subDhaka} (২-৩ কার্যদিবস)\n• **Dhakar baire shara Bangladesh (64 jila):** ৳${outsideDhaka} (৩-৫ কার্যদিবস)\n\nShara Bangladesh-er jekono thana ba gram-e **100% Cash on Delivery (COD)** shubidha ache!`;
    } else {
      reply = `Maxora-তে ডেলিভারি চার্জের নিয়মাবলী:\n\n• **ঢাকা সিটির ভেতরে:** ৳${insideDhaka} (২-৩ কার্যদিবস)\n• **ঢাকা সাব-এরিয়া (সাভার, গাজীপুর, নারায়ণগঞ্জ, কেরানীগঞ্জ):** ৳${subDhaka} (২-৩ কার্যদিবস)\n• **ঢাকার বাইরে সমগ্র বাংলাদেশ (৬৪ জেলা):** ৳${outsideDhaka} (৩-৫ কার্যদিবস)\n\nসমগ্র বাংলাদেশের ৬৪টি জেলাতেই ১০০% ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। ডেলিভারিম্যানের কাছ থেকে পণ্য বুঝে নিয়ে মূল্য পরিশোধ করতে পারবেন।`;
    }
    return {
      reply,
      source: 'catalog',
    };
  }

  // 8. Cash On Delivery / Payment / Advance Payment Query
  if (
    q.includes('cash on delivery') ||
    q.includes('cod') ||
    q.includes('ক্যাশ অন ডেলিভারি') ||
    q.includes('পেমেন্ট') ||
    q.includes('payment') ||
    q.includes('অগ্রিম') ||
    q.includes('advance') ||
    q.includes('ogrim') ||
    q.includes('hate peye') ||
    q.includes('বিকাশ') ||
    q.includes('bkash')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `Yes! Maxora offers **100% Cash on Delivery (COD)** across all 64 districts in Bangladesh.\n\n• **No advance payment is required** for regular retail orders.\n• You receive the parcel at your doorstep, verify it, and pay the delivery agent in cash.\n• If you prefer digital payment, bKash/Nagad is also supported upon request.`;
    } else if (lang === 'banglish') {
      reply = `Ji haan! Maxora-te shara Bangladesh-e **100% Cash on Delivery (COD)** shubidha royeche.\n\n• Shadharon order-e **kono advance ba ogrim taka deya lage na!**\n• Parcel hate peye check kore delivery man-ke taka dite parben.\n• Apni chaile bKash ba Nagad-eo payment korte paren.`;
    } else {
      reply = `হ্যাঁ, Maxora-তে সারা বাংলাদেশে **Cash on Delivery (ক্যাশ অন ডেলিভারি)** সুবিধা রয়েছে। সাধারণ অর্ডারে কোনো প্রকার অগ্রিম পেমেন্টের প্রয়োজন নেই। ডেলিভারিম্যানের কাছ থেকে পণ্য বুঝে নিয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করতে পারবেন।`;
    }
    return {
      reply,
      source: 'catalog',
    };
  }

  // 9. How to Order / Ordering Steps
  if (
    q.includes('কীভাবে অর্ডার') ||
    q.includes('কিভাবে অর্ডার') ||
    q.includes('অর্ডার করব') ||
    q.includes('অর্ডার করবো') ||
    q.includes('অর্ডার দেওয়ার নিয়ম') ||
    q.includes('অর্ডার দেওয়ার নিয়ম') ||
    q.includes('অর্ডার করতে চাই') ||
    q.includes('কিনতে চাই') ||
    q.includes('order korbo') ||
    q.includes('how to order') ||
    q.includes('how to buy') ||
    q.includes('kivabe order') ||
    q.includes('kinbo kivabe')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `Ordering on Maxora is quick and simple:\n\n1. Go to your desired product page and click **"Buy Now"**.\n2. Enter your Name, active Mobile Number, and full Delivery Address.\n3. Choose your delivery zone (Inside Dhaka ৳${insideDhaka} / Sub-Dhaka ৳${subDhaka} / Outside Dhaka ৳${outsideDhaka}).\n4. Click **"Confirm Order"** to place your order!\n\nYou can also order directly by messaging our WhatsApp support.`;
    } else if (lang === 'banglish') {
      reply = `Maxora-te order kora khub-i shohoj:\n\n1. Jei product nite chan tar page-e giye **"Buy Now"** ba **"Order Now"** batone click korun.\n2. Apnar Name, Mobile Number ebong full Address likhun.\n3. Delivery Area select korun (Dhaka ৳${insideDhaka} / Sub-Dhaka ৳${subDhaka} / Dhakar baire ৳${outsideDhaka}).\n4. **"Confirm Order"** batone click korlei order confirm hoye jabe!\n\n100% Cash on Delivery—parcel hate peye taka dite parben. Kono shomosshay WhatsApp-eo order dite paren.`;
    } else {
      const prodNote = currentProd
        ? `\n\nআপনি বর্তমানে দেখছেন: **${currentProd.name}** (মূল্য: ৳${Math.max(0, Number(currentProd.selling_price || 0) - Number(currentProd.discount || 0)).toLocaleString('en-BD')})। নিচে দেওয়া পণ্য কার্ডে বা পেজের **"Buy Now"** বাটনে ট্যাপ করুন।`
        : '';
      reply = `Maxora-তে অর্ডার করার নিয়ম খুবই সহজ:\n\n1. পছন্দের পণ্যটির পেজে গিয়ে **"Buy Now"** অথবা **"অর্ডার করুন"** বাটনে ক্লিক করুন।\n2. আপনার নাম, সচল মোবাইল নম্বর ও পূর্ণাঙ্গ ডেলিভারি ঠিকানা লিখুন।\n3. ডেলিভারি এলাকা (ঢাকা সিটি ৳${insideDhaka} / সাব-ঢাকা ৳${subDhaka} / ঢাকার বাইরে ৳${outsideDhaka}) সিলেক্ট করুন।\n4. **"অর্ডার কনফার্ম করুন"** বাটনে ক্লিক করলেই আপনার অর্ডারটি কনফার্ম হয়ে যাবে!${prodNote}\n\nসারা বাংলাদেশে **১০০% ক্যাশ অন ডেলিভারি** রয়েছে—ডেলিভারিম্যানের কাছ থেকে পণ্য বুঝে পেয়ে মূল্য পরিশোধ করুন।`;
    }
    return {
      reply,
      recommendedProductIds: currentProd?.id ? [currentProd.id] : [],
      source: 'catalog',
    };
  }

  // 10. Warranty / Guarantee / Return Policy
  if (
    q.includes('warranty') ||
    q.includes('guarantee') ||
    q.includes('ওয়ারেন্টি') ||
    q.includes('গ্যারান্টি') ||
    q.includes('রিটার্ন') ||
    q.includes('ফেরত') ||
    q.includes('নষ্ট বের হলে') ||
    q.includes('সমস্যা হলে') ||
    q.includes('replacement') ||
    q.includes('nosto hole')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `Maxora offers a **7 Days Easy Replacement Warranty**!\n\nIf you receive a defective or damaged product, simply contact our WhatsApp support team within 7 days of receiving the delivery with an unboxing photo/video. We will immediately replace it for you with zero hassle.`;
    } else if (lang === 'banglish') {
      reply = `Maxora-te royeche **7 Days Easy Replacement Warranty**!\n\nDelivery paowar por product-e kono manufacturing defect ba damage thakle 7 diner moddhe amader WhatsApp support-e janale druto replacement peye jaben.`;
    } else {
      reply = `Maxora-তে আপনি পাবেন **৭ দিনের সহজ রিপ্লেসমেন্ট ওয়ারেন্টি (7 Days Replacement Warranty)**।\n\nপণ্য ডেলিভারি পাওয়ার পর কোনো ম্যানুফ্যাকচারিং ত্রুটি বা সমস্যা থাকলে ৭ দিনের মধ্যে আমাদের হেল্পলাইন বা WhatsApp-এ জানালে সাথে সাথে সমাধান বা রিপ্লেসমেন্ট প্রদান করা হবে।`;
    }
    return {
      reply,
      source: 'catalog',
    };
  }

  // 11. Shop / Office / Showroom Location
  if (
    q.includes('দোকান কোথায়') ||
    q.includes('শোরুম') ||
    q.includes('ঠিকানা') ||
    q.includes('showroom') ||
    q.includes('location') ||
    q.includes('office') ||
    q.includes('dokan kothay') ||
    q.includes('thikana ki') ||
    q.includes('outlet')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `Maxora is a premium online lifestyle & gadget store. Our central fulfillment warehouse and customer service hub are located in Dhaka, Bangladesh. We deliver 100% authentic products straight to your doorstep across all 64 districts with Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Maxora holo ekti trusted online store. Amader central warehouse ebong customer service hub Dhaka-te obosthito. Shara Bangladesh-er jekono prante ghore boshei 100% Cash on Delivery-te apnar pochonder product haate paben!`;
    } else {
      reply = `Maxora হলো একটি বিশ্বস্ত প্রিমিয়াম অনলাইন লাইফস্টাইল ও গ্যাজেট শপ। আমাদের সেন্ট্রাল ওয়্যারহাউস ও কাস্টমার সার্ভিস হাব ঢাকাতে অবস্থিত। সারা বাংলাদেশে ঘরে বসেই ক্যাশ অন ডেলিভারিতে দ্রুততম সময়ে আপনি আমাদের আসল পণ্য হাতে পাবেন।`;
    }
    return {
      reply,
      source: 'catalog',
    };
  }

  // 12. Order Tracking
  if (
    q.includes('track') ||
    q.includes('ট্র্যাক') ||
    q.includes('আমার অর্ডার') ||
    q.includes('status') ||
    q.includes('kothay ache') ||
    q.includes('order kothay')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `You can easily track your order on our website at the **Track Order** page (/track-order) using your phone number or Order ID. Alternatively, message us on WhatsApp with your details and our team will update you immediately!`;
    } else if (lang === 'banglish') {
      reply = `Apni shohojei amader website-er **Track Order** (/track-order) page-e giye apnar Mobile Number ba Order ID diye order status dekhte parben. Othoba WhatsApp-e message dile amader team janate parbe.`;
    } else {
      reply = `আপনি সহজেই আমাদের ওয়েবসাইটের **"Track Order"** পেজে (/track-order) গিয়ে আপনার মোবাইল নম্বর অথবা অর্ডার নম্বর দিয়ে বর্তমান স্ট্যাটাস জানতে পারবেন। প্রয়োজনে WhatsApp-এ যোগাযোগ করলেও আপডেট দেওয়া হবে।`;
    }
    return {
      reply,
      source: 'catalog',
    };
  }

  // 13. Authenticity & Originality
  if (
    q.includes('original') ||
    q.includes('আসল') ||
    q.includes('fake') ||
    q.includes('authentic') ||
    q.includes('asol') ||
    q.includes('copy')
  ) {
    let reply = '';
    if (lang === 'en') {
      reply = `Yes, 100%! All products sold on Maxora are guaranteed authentic, brand new, and thoroughly inspected before dispatch. You get 100% Cash on Delivery and a 7 Days Replacement Warranty so you can shop with complete peace of mind.`;
    } else if (lang === 'banglish') {
      reply = `Ji haan, 100%! Maxora-r shob product shoto-bhaag original, authentic ebong quality check kore pathano hoy. Sathe 100% Cash on Delivery ebong 7 Days Replacement Warranty royeche, tai kono risk nei!`;
    } else {
      reply = `জি হ্যাঁ, শতভাগ নিশ্চিত থাকুন! Maxora-র সকল পণ্য ১০০% আসল, নতুন ও কোয়ালিটি টেস্ট করা। সাথে পাচ্ছেন সারা বাংলাদেশে ক্যাশ অন ডেলিভারি এবং ৭ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি—তাই নিশ্চিন্তে অর্ডার করতে পারেন।`;
    }
    return {
      reply,
      source: 'catalog',
    };
  }

  return null;
}

/**
 * Intelligent context-based fallback response if Gemini is unreachable
 */
function generateSmartFallbackResponse(
  userQuery: string,
  req: AiChatRequest
): AiChatResponse {
  const currentProd = req.currentProduct;
  const settings = req.settings || {};
  const insideDhaka = settings.delivery_inside_dhaka ?? 70;
  const outsideDhaka = settings.delivery_outside_dhaka ?? 130;
  const faqs = (req.activeFaqs || []).filter((f) => f.active !== false);
  const lang = detectQueryLanguage(userQuery);

  // Check if query matches any FAQ partially
  const words = userQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  for (const faq of faqs) {
    const faqQ = faq.question.toLowerCase();
    const matched = words.some((w) => faqQ.includes(w));
    if (matched) {
      return {
        reply: faq.answer,
        source: 'faq',
      };
    }
  }

  // Check if query is a greeting
  const isGreeting = /^(hello|hi|hey|hola|hlo|helo|salam|assalamu\s*alaikum|assalamualaikum|kemon\s*achen|kemon\s*acho|bhai|vai)[\s!.,?]*$/i.test(
    userQuery.trim()
  );
  if (isGreeting) {
    let reply = `হ্যালো! 👋 Maxora-তে আপনাকে স্বাগতম। আমি আপনার শপিং অ্যাসিস্ট্যান্ট। আমাদের যেকোনো পণ্য, বর্তমান অফার মূল্য, স্টক, ডেলিভারি চার্জ বা অর্ডার সম্পর্কে জানতে পারেন। কীভাবে আপনাকে সাহায্য করতে পারি?`;
    if (lang === 'en') {
      reply = `Hello! 👋 Welcome to Maxora. I am your AI Shopping Assistant. How can I help you today? Feel free to ask about our products, special prices, stock availability, or delivery process!`;
    } else if (lang === 'banglish') {
      reply = `Hello! 👋 Maxora-te apnake shagotom. Ami apnar shopping assistant. Amader jekono product, dam, stock, delivery charge ba order somporke prosno korte paren. Kivabe sahajjo korte pari?`;
    }
    return {
      reply,
      needsWhatsApp: false,
      source: 'catalog',
    };
  }

  // Check if user says it's not working or complains about assistant
  const isNotWorking = /(kaj\s*kore\s*na|kaj\s*tho\s*kore\s*na|kaj\s*korche\s*na|not\s*working|not\s*replying|কাজ\s*করে\s*না|কাজ\s*করছে\s*না|কাজ\s*তো\s*করে\s*না)/i.test(
    userQuery
  );
  if (isNotWorking) {
    let reply = `জি, আমি সক্রিয় ও প্রস্তুত আছি! 😊 আপনি কোনো পণ্যের দাম, স্পেসিফিকেশন, ডেলিভারি চার্জ বা কীভাবে অর্ডার করবেন তা জানতে প্রশ্ন করতে পারেন। এছাড়াও সরাসরি আমাদের WhatsApp সাপোর্টে যোগাযোগ করতে নিচের বাটনে ট্যাপ করতে পারেন।`;
    if (lang === 'en') {
      reply = `I am active and ready to help! 😊 Feel free to ask about any product price, delivery charges, or ordering steps. You can also connect directly with our WhatsApp support below.`;
    } else if (lang === 'banglish') {
      reply = `Ji, ami active ebong sahajjo korte ready achi! 😊 Apni kono product-er dam, delivery charge ba kivabe order korben ta jante paren. Othoba nicher WhatsApp batone tap kore amader sathe kotha bolte paren.`;
    }
    return {
      reply,
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমি সহায়তা চাই: ${userQuery}`,
      source: 'fallback',
    };
  }

  // Check custom commands
  const customCommands = (settings.ai_custom_commands || []).filter((c: any) => c.active !== false);
  for (const cmd of customCommands) {
    const title = (cmd.title || '').toLowerCase();
    if (words.some((w) => title.includes(w))) {
      return {
        reply: cmd.command,
        source: 'catalog',
      };
    }
  }

  if (currentProd) {
    const price = Math.max(0, Number(currentProd.selling_price || 0) - Number(currentProd.discount || 0));
    let reply = `ধন্যবাদ আপনার অনুসন্ধানের জন্য। **${currentProd.name}** বর্তমানে আমাদের স্টকে রয়েছে (মূল্য: ৳${price.toLocaleString('en-BD')})। আপনি সরাসরি "Buy Now" বাটনে ক্লিক করে ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন। ডেলিভারি চার্জ: ঢাকা সিটিতে ৳${insideDhaka}, ঢাকার বাইরে ৳${outsideDhaka}। যেকোনো অতিরিক্ত তথ্যের জন্য নিচে WhatsApp বাটনে ট্যাপ করতে পারেন।`;
    if (lang === 'en') {
      reply = `Thank you for asking! **${currentProd.name}** is currently in stock at **৳${price.toLocaleString('en-BD')}**. You can order with 100% Cash on Delivery by clicking "Buy Now". Delivery charges: Dhaka ৳${insideDhaka}, Outside Dhaka ৳${outsideDhaka}. For any special assistance, tap WhatsApp below!`;
    } else if (lang === 'banglish') {
      reply = `Dhonnobad! **${currentProd.name}** bortomane amader stock-e ache (Price: ৳${price.toLocaleString('en-BD')})। Shorashori "Buy Now" batone click kore Cash on Delivery-te order korte paren. Delivery charge: Dhaka ৳${insideDhaka}, Dhakar baire ৳${outsideDhaka}। Kono prosno thakle WhatsApp-e message din.`;
    }
    return {
      reply,
      recommendedProductIds: [currentProd.id || ''],
      needsWhatsApp: false,
      source: 'catalog',
    };
  }

  // Check across all candidate products in the store
  const allCandidates = req.candidateProducts || [];
  const queryLower = userQuery.toLowerCase();
  const searchWords = queryLower.split(/[\s,?!]+/).filter((w) => w.length >= 2);

  const matched = allCandidates.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    return searchWords.some((w) => name.includes(w) || cat.includes(w) || brand.includes(w));
  });

  if (matched.length > 0 && !queryLower.includes('delivery') && !queryLower.includes('charge')) {
    const top = matched.slice(0, 3);
    const listText = top
      .map((p, i) => {
        const net = Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0));
        return `${i + 1}. **${p.name}** — বর্তমান মূল্য: **৳${net.toLocaleString('en-BD')}** ${Number(p.stock || 0) > 0 ? '(স্টকে আছে ✅)' : '(স্টক শেষ ⚠️)'}`;
      })
      .join('\n');

    let reply = `আপনার অনুসন্ধানের সাথে মিল রেখে আমাদের পণ্যসমূহ নিচে দেওয়া হলো:\n\n${listText}\n\nসরাসরি অর্ডার করতে নিচের কার্ডের **"Buy Now"** বাটনে ক্লিক করুন (১০০% ক্যাশ অন ডেলিভারি)।`;
    if (lang === 'en') {
      reply = `Here are the matching products from our store:\n\n${listText}\n\nClick **"Buy Now"** on any product card below to order with 100% Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Apnar search onujayi amader matching products nicher list-e royeche:\n\n${listText}\n\nShorashori order korte nicher **"Buy Now"** batone click korun!`;
    }

    return {
      reply,
      recommendedProductIds: top.map((p) => p.id).filter(Boolean),
      needsWhatsApp: false,
      source: 'catalog',
    };
  }

  // If user searched for smartwatch or specific category not in stock
  if (
    queryLower.includes('smartwatch') ||
    queryLower.includes('watch') ||
    queryLower.includes('স্মার্টওয়াচ') ||
    queryLower.includes('ঘড়ি') ||
    queryLower.includes('ঘরি')
  ) {
    const inStockGadgets = allCandidates.filter((p) => Number(p.stock || 0) > 0).slice(0, 3);
    let reply = `দুঃখিত, এই মুহূর্তে আমাদের স্টকে সরাসরি 'স্মার্টওয়াচ' নেই। তবে আমাদের কাছে রয়েছে দারুণ কিছু আকর্ষণীয় গ্যাজেট ও ইলেকট্রনিক্স পণ্য (যেমন: TWS Wireless Earbuds, Fast Charging Power Bank ইত্যাদি)।\n\nআপনি চাইলে নিচের জনপ্রিয় গ্যাজেটগুলো দেখতে পারেন এবং ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন!`;
    if (lang === 'en') {
      reply = `Sorry, we currently do not have smartwatches in stock. However, we have other great gadgets like TWS Wireless Earbuds and Fast Charging Power Banks available for Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Dukhkito, eimuhurte amader stock-e shorashori 'smartwatch' nei. Tobe amader kache darun kichu gadgets ache (jemon: Earbuds, Power Bank)! Apni chaile nicher popular product-gulo dekhte paren.`;
    }

    return {
      reply,
      recommendedProductIds: inStockGadgets.map((p) => p.id).filter(Boolean),
      needsWhatsApp: false,
      source: 'catalog',
    };
  }

  let defaultReply = `আমি Maxora AI Shopping Assistant। আমাদের যেকোনো পণ্য, বর্তমান অফার মূল্য, স্টক, ডেলিভারি চার্জ বা অর্ডার নিয়ে যেকোনো প্রশ্ন করতে পারেন—আমি সাথে সাথে তথ্য দেব। সরাসরি কাস্টমার কেয়ারের সাথে কথা বলতে চাইলে নিচে WhatsApp-এ ট্যাপ করুন।`;
  if (lang === 'en') {
    defaultReply = `I am your Maxora AI Shopping Assistant! Feel free to ask about any product details, prices, delivery charges, or ordering steps. For direct assistance, tap WhatsApp below!`;
  } else if (lang === 'banglish') {
    defaultReply = `Ami Maxora AI Shopping Assistant! Jekono product, dam, offer, delivery charge ba kivabe order korben ta jante prosno korun. Shorashori kotha bolte nicher WhatsApp batone tap korun.`;
  }

  return {
    reply: defaultReply,
    needsWhatsApp: true,
    whatsappPrefilledText: `হ্যালো Maxora, আমি এই বিষয়ে জানতে চাই: ${userQuery}`,
    source: 'fallback',
  };
}

export async function processAiChatMessage(
  req: AiChatRequest
): Promise<AiChatResponse> {
  const userMessage = (req.message || '').trim().slice(0, 1000);
  if (!userMessage) {
    return {
      reply: 'অনুগ্রহ করে আপনার প্রশ্নটি লিখুন। আমি পণ্য, দাম, স্টক ও ডেলিভারি সংক্রান্ত যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত। (Please enter your question)',
    };
  }

  // Auto-inject store data from maxora_db.json if candidates or settings are scarce
  if (!req.candidateProducts || req.candidateProducts.length < 5 || !req.settings) {
    const dbData = loadFallbackCatalogAndSettings();
    if ((!req.candidateProducts || req.candidateProducts.length < 5) && dbData.products.length > 0) {
      const activeProducts = dbData.products
        .filter((p: any) => p.active !== 0 && p.active !== false && String(p.active) !== '0')
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          selling_price: Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0)),
          discount: Number(p.discount || 0),
          stock: Number(p.stock || 0),
          brand: p.brand,
          category: p.category,
          image_url: p.image_url,
          description: (p.description || '').slice(0, 150),
        }));

      const existingIds = new Set((req.candidateProducts || []).map((c: any) => c.id));
      const merged = [...(req.candidateProducts || [])];
      for (const p of activeProducts) {
        if (!existingIds.has(p.id) && merged.length < 25) {
          merged.push(p);
          existingIds.add(p.id);
        }
      }
      req.candidateProducts = merged;
    }

    if (!req.settings && dbData.settings) {
      req.settings = dbData.settings;
    }

    if (!req.activeFaqs && dbData.faqs) {
      req.activeFaqs = dbData.faqs.filter((f: any) => f.active !== false);
    }
  }

  // Check fast local match first for human escalation / bulk / returns
  const localMatch = matchLocalIntent(userMessage, req);
  if (localMatch && localMatch.source === 'fallback') {
    return localMatch;
  }

  // Fast In-Memory Cache Lookup (Sub-5ms response for recurring queries)
  const cacheKey = getCacheKey(userMessage, req.currentProduct?.id);
  const cached = aiQueryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      ...cached.response,
      source: 'gemini',
    };
  }

  const ai = getAiClient();
  if (!ai) {
    // If Gemini API is not configured or key is absent, use intelligent local responder
    if (localMatch) {
      return localMatch;
    }
    return generateSmartFallbackResponse(userMessage, req);
  }

  try {
    // Build context-rich prompt for Gemini
    const settings = req.settings || {};
    const storeName = settings.store_name || 'Maxora Shop BD';
    const insideDhaka = settings.delivery_inside_dhaka ?? 70;
    const subDhaka = settings.delivery_sub_dhaka ?? 100;
    const outsideDhaka = settings.delivery_outside_dhaka ?? 130;
    const whatsappNum = settings.ai_whatsapp_number || settings.whatsapp || settings.phone || '+8801635451746';

    const faqs = (req.activeFaqs || []).filter((f) => f.active !== false);
    const faqContext = faqs.length > 0
      ? faqs.map((f, i) => `${i + 1}. প্রশ্ন: "${f.question}" -> উত্তর: "${f.answer}"`).join('\n')
      : 'No custom FAQs configured.';

    // Admin Custom Commands & Rules
    const customCommands = (settings.ai_custom_commands || []).filter((c: any) => c.active !== false);
    const customCommandsText = customCommands.length > 0
      ? customCommands
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((c: any, i: number) => `${i + 1}. [${c.title || 'নির্দেশনা'}]: ${c.command}`)
          .join('\n')
      : '';
    const adminCustomNote = (settings.ai_system_instructions || '').trim();

    // Current product context
    let currentProdContext = 'User is currently browsing the general store catalog (not on a specific product page).';
    if (req.currentProduct && req.currentProduct.name) {
      const p = req.currentProduct;
      const netPrice = Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0));
      currentProdContext = `
CURRENTLY VIEWED PRODUCT DETAILS (The customer is currently looking at this specific product page):
- Product ID: ${p.id || 'N/A'}
- Name: ${p.name}
- Brand: ${p.brand || 'Original/Maxora'}
- Category: ${p.category || 'Lifestyle Gadget'}
- Subcategory: ${p.sub_category || 'N/A'}
- Selling Price: ৳${p.selling_price || 0}
- Discount: ৳${p.discount || 0}
- Net Offer Price: ৳${netPrice}
- Stock Status: ${Number(p.stock || 0) > 0 ? `${p.stock} units available in stock` : 'OUT OF STOCK'}
- Colors / Variants: ${p.colors?.map((c) => c.name).join(', ') || 'Standard'}
- Description: ${p.description || 'Verified authentic quality product.'}
`;
    }

    // Top candidate products from catalog for recommendations or comparison
    const candidates = (req.candidateProducts || []).slice(0, 25);
    const catalogContext = candidates.length > 0
      ? candidates.map((c) => `- [ID: ${c.id}] "${c.name}" | Brand: ${c.brand || 'Maxora'} | Category: ${c.category || 'Gadgets'} | Offer Price: ৳${c.selling_price} | Stock: ${c.stock > 0 ? 'In Stock' : 'Out of Stock'} | Details: ${c.description?.slice(0, 100) || ''}`).join('\n')
      : 'Catalog search available.';

    const systemInstruction = `
You are the professional, friendly, highly intelligent Maxora AI Shopping Assistant for ${storeName}, a premier trusted e-commerce brand in Bangladesh.

### CRITICAL LANGUAGE MANDATE (সর্বোচ্চ অগ্রাধিকারের ভাষা নির্দেশনা):
The customer can communicate in ANY language or writing style:
1. **Banglish (রোমান হরফে বাংলা)**: E.g., "dam koto", "kivabe order korbo", "delivery charge koto", "apnader dokan kothay", "cash on delivery ache kina", "original kina", "advance payment lagbe kina", "bhai bhalo ekta fan dekhano jabe?".
   - **YOUR ACTION**: Understand Banglish questions with 100% accuracy. Respond in friendly, natural conversational language that directly and effortlessly communicates with the customer—either easy, fluent Banglish or warm, conversational Bangla with clear English product/price terms. Make sure numbers (৳), delivery days, and steps are crystal clear.
2. **Bangla (বাংলা লিপি)**: E.g., "দাম কত?", "ডেলিভারি চার্জ কত?", "কীভাবে কিনব?", "ক্যাশ অন ডেলিভারি আছে কি?", "পণ্যটি কি আসল?".
   - **YOUR ACTION**: Respond in polite, natural, warm Bangladeshi Bengali (যেমন: "জি স্যার/ম্যাম, ...").
3. **English**: E.g., "What is the price?", "How can I order?", "Do you provide cash on delivery?", "Can you recommend a good gadget under 1000 taka?".
   - **YOUR ACTION**: Respond in fluent, polite, clear, and professional English.
4. **Mixed or Other Languages (Hindi, Arabic, etc.)**:
   - Respond appropriately matching the customer's query so they feel completely understood and helped.

### COMPREHENSIVE KNOWLEDGE OF THE MAXORA STORE & WEBSITE:
You know EVERYTHING about the Maxora e-commerce store and website:

1. **STORE PRODUCTS & CATALOG**:
   - You have access to the currently viewed product (if any) and all available catalog candidate products listed below.
   - For ANY product in the catalog, you know its exact Name, Brand, Category, regular price, discount, net offer price in ৳ (BDT), stock status, and features.
   - When a user asks about price, stock, or features, use the EXACT verified information.
   - When recommending products (e.g. "suggest me a product", "ভালো গ্যাজেট সাজেস্ট করুন", "best gadget under 1000", "fan ache kina", "table lamp", "earbuds", "smartwatch"), recommend 2 to 3 real products from the catalog, write their exact Name in bold, their net price in ৳, and key highlights.
   - ALWAYS append \`<!--RECOMMENDED_IDS: ["id1", "id2"]-->\` so interactive product cards with images, prices, and Buy Now buttons appear directly in the chat modal!

2. **CASH ON DELIVERY & PAYMENT**:
   - 100% Cash on Delivery (COD) across all 64 districts in Bangladesh!
   - Customers do NOT need to make any advance payment for regular retail orders. They receive the package at their doorstep, inspect it, and pay the delivery agent in cash.
   - bKash / Nagad mobile payments are also supported if the customer prefers online payment.

3. **DELIVERY CHARGES & TIMELINE**:
   - Inside Dhaka City: ৳${insideDhaka} (Delivery within 2 to 3 business days).
   - Dhaka Sub-area (Savar, Gazipur, Keraniganj, Narayanganj): ৳${subDhaka} (2 to 3 business days).
   - Outside Dhaka (all 64 districts nationwide): ৳${outsideDhaka} (3 to 5 business days).
   - Delivered safely to customer doorstep via verified courier services.

4. **HOW TO ORDER**:
   - Website order: Customer selects their desired product -> clicks "Buy Now" or "অর্ডার করুন" -> enters Name, Phone number, and delivery Address -> selects delivery area -> clicks "Confirm Order".
   - WhatsApp order: Customer can also click the WhatsApp button in the chat or on the website to order directly with our customer support team!

5. **ORDER TRACKING**:
   - Customers can track their placed order anytime directly on the website at the "Track Order" page (/track-order) using their phone number or Order ID.

6. **WARRANTY, RETURNS & REPLACEMENT**:
   - Maxora provides a 7 Days Easy Replacement Warranty for manufacturing defects.
   - If a product is defective or damaged during courier shipping, the customer simply contacts WhatsApp support within 7 days (with parcel unboxing photo/video) for a quick replacement.

7. **AUTHENTICITY & STORE TRUST**:
   - Maxora is a trusted, registered online retailer in Bangladesh. All products are 100% authentic, brand-new, and strictly quality-tested before packaging.

8. **OFFICE & LOCATION**:
   - Maxora operates as a premium online store with its central warehouse and dispatch hub located in Dhaka, delivering nationwide to customer doorsteps across all 64 districts.

9. **HUMAN AGENT & WHATSAPP SUPPORT**:
   - If the customer wants to talk to a human agent, has an order complaint, or wants wholesale/bulk discounts, guide them to WhatsApp support: ${whatsappNum}.

10. **OUTPUT FORMAT**:
   - Return concise, clean, well-formatted markdown.
   - If you recommend specific products from the candidate list, list their exact IDs in a JSON block at the end of your response:
     <!--RECOMMENDED_IDS: ["id1", "id2"]-->
`;

    // Format chat history
    const contents: any[] = [];
    if (Array.isArray(req.history)) {
      for (const turn of req.history.slice(-6)) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
    }

    // Add current user prompt with attached context
    const fullUserPrompt = `
STORE DATA CONTEXT:
${currentProdContext}

ACTIVE STORE FAQS:
${faqContext}

AVAILABLE CATALOG PRODUCTS (Use these real items for questions & recommendations):
${catalogContext}

CUSTOMER'S QUERY (Detect language: Banglish, Bangla, English, etc. and reply accordingly):
"${userMessage}"
`;

    contents.push({
      role: 'user',
      parts: [{ text: fullUserPrompt }],
    });

    let response: any = null;

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config: {
          systemInstruction,
          temperature: 0.35,
          maxOutputTokens: 1024,
        },
      });
    } catch (primaryErr: any) {
      console.warn(
        'Primary model gemini-3.1-flash-lite failed, attempting gemini-flash-latest:',
        primaryErr?.message || primaryErr
      );
      try {
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents,
          config: {
            systemInstruction,
            temperature: 0.35,
            maxOutputTokens: 1024,
          },
        });
      } catch (secErr: any) {
        console.warn(
          'Secondary model gemini-flash-latest failed, attempting gemini-3.8-flash:',
          secErr?.message || secErr
        );
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.35,
            maxOutputTokens: 1024,
          },
        });
      }
    }

    const rawText = response.text || '';

    // Extract metadata comments from AI response
    let cleanReply = rawText;
    let recommendedProductIds: string[] = [];
    let needsWhatsApp = false;
    let whatsappPrefilledText = `হ্যালো Maxora, আমি এই বিষয়ে জানতে চাই: ${userMessage}`;

    const recMatch = rawText.match(/<!--RECOMMENDED_IDS:\s*(\[[^\]]*\])\s*-->/);
    if (recMatch) {
      try {
        recommendedProductIds = JSON.parse(recMatch[1]);
      } catch {}
      cleanReply = cleanReply.replace(recMatch[0], '').trim();
    }

    const waMatch = rawText.match(/<!--NEEDS_WHATSAPP:\s*(true|false)\s*-->/);
    if (waMatch) {
      needsWhatsApp = waMatch[1] === 'true';
      cleanReply = cleanReply.replace(waMatch[0], '').trim();
    }

    const waTextMatch = rawText.match(/<!--WHATSAPP_TEXT:\s*([^\n\r]+?)\s*-->/);
    if (waTextMatch) {
      whatsappPrefilledText = waTextMatch[1].trim();
      cleanReply = cleanReply.replace(waTextMatch[0], '').trim();
    }

    // If cleanReply indicates uncertainty or human escalation, trigger WhatsApp button
    if (
      cleanReply.includes('নিশ্চিত তথ্য') ||
      cleanReply.includes('WhatsApp') ||
      cleanReply.includes('হোয়াটসঅ্যাপ') ||
      cleanReply.includes('সাপোর্টে যোগাযোগ')
    ) {
      needsWhatsApp = true;
    }

    // If user asked about current product and no recommendation attached, attach current product
    if (req.currentProduct?.id && recommendedProductIds.length === 0) {
      const qLower = userMessage.toLowerCase();
      if (
        qLower.includes('এই') ||
        qLower.includes('দাম') ||
        qLower.includes('স্পেক') ||
        qLower.includes('price') ||
        qLower.includes('this product') ||
        qLower.includes('ei product') ||
        qLower.includes('dam')
      ) {
        recommendedProductIds = [req.currentProduct.id];
      }
    }

    // Auto-detect recommended products mentioned in text or from recommendation query
    if (recommendedProductIds.length === 0 && Array.isArray(req.candidateProducts)) {
      for (const prod of req.candidateProducts) {
        if (prod.name && cleanReply.toLowerCase().includes(prod.name.toLowerCase().trim())) {
          if (!recommendedProductIds.includes(prod.id)) {
            recommendedProductIds.push(prod.id);
          }
        }
      }
      const isRecQuery =
        userMessage.includes('সাজেস্ট') ||
        userMessage.includes('গ্যাজেট') ||
        userMessage.includes('ভালো') ||
        userMessage.includes('সেরা') ||
        userMessage.includes('recommend') ||
        userMessage.includes('suggest') ||
        userMessage.includes('bhalo') ||
        userMessage.includes('dekhan');
      if (isRecQuery && recommendedProductIds.length === 0) {
        recommendedProductIds = req.candidateProducts
          .filter((p) => Number(p.stock || 0) > 0)
          .slice(0, 3)
          .map((p) => p.id);
      }
    }

    const finalResponse: AiChatResponse = {
      reply: cleanReply,
      recommendedProductIds: recommendedProductIds.slice(0, 4),
      needsWhatsApp,
      whatsappPrefilledText,
      source: 'gemini',
    };

    // Cache successful answer for subsequent customers asking the same/similar query
    if (aiQueryCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = aiQueryCache.keys().next().value;
      if (oldestKey) aiQueryCache.delete(oldestKey);
    }
    aiQueryCache.set(cacheKey, {
      response: finalResponse,
      timestamp: Date.now(),
    });

    return finalResponse;
  } catch (err: any) {
    console.error('Gemini AI Chat Error:', err);
    // Fall back smoothly to local matcher or intelligent fallback so customer is always answered
    if (localMatch) {
      return localMatch;
    }
    return generateSmartFallbackResponse(userMessage, req);
  }
}

