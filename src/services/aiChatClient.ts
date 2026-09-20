import { Product, StoreSettings, AiFaqItem } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  recommendedProducts?: Product[];
  needsWhatsApp?: boolean;
  whatsappPrefilledText?: string;
  isError?: boolean;
}

export interface SendAiMessageParams {
  message: string;
  history: ChatMessage[];
  currentProduct?: Product | null;
  allProducts?: Product[];
  settings?: StoreSettings;
}

export interface SendAiMessageResult {
  reply: string;
  recommendedProducts: Product[];
  needsWhatsApp: boolean;
  whatsappPrefilledText?: string;
}

/**
 * Sends a chat message to the server-side AI Chat endpoint
 */
export async function sendAiChatMessage({
  message,
  history,
  currentProduct,
  allProducts = [],
  settings,
}: SendAiMessageParams): Promise<SendAiMessageResult> {
  const activeFaqs = (settings?.ai_faqs || []).filter((f) => f.active !== false);

  // Prepare top candidate products from catalog for context
  const qLower = message.toLowerCase();
  let candidateProducts = [...allProducts];
  if (qLower) {
    const isGeneralRecommendation =
      qLower.includes('সাজেস্ট') ||
      qLower.includes('ভালো') ||
      qLower.includes('গ্যাজেট') ||
      qLower.includes('সেরা') ||
      qLower.includes('বেস্ট') ||
      qLower.includes('recommend') ||
      qLower.includes('suggest');

    const tokens = qLower.split(/\s+/).filter((t) => t.length > 2);
    const scored = allProducts.map((p) => {
      let score = 0;
      const text = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.sub_category || ''} ${p.description || ''}`.toLowerCase();
      tokens.forEach((t) => {
        if (text.includes(t)) score += 2;
      });
      if (Number(p.stock || 0) > 0) score += 3;
      if (p.featured) score += 2;
      if (isGeneralRecommendation && Number(p.stock || 0) > 0) score += 5;
      return { product: p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    candidateProducts = scored.map((s) => s.product);
  }

  // Slice candidate products to keep payload lightweight (under 25KB)
  const candidateSummary = candidateProducts.slice(0, 12).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    selling_price: Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0)),
    discount: Number(p.discount || 0),
    stock: Number(p.stock || 0),
    brand: p.brand,
    category: p.category,
    image_url: p.image_url,
    description: (p.description || '').slice(0, 100),
  }));

  // Format recent chat turns for Gemini
  const recentHistory = history.slice(-6).map((m) => ({
    role: m.sender === 'user' ? ('user' as const) : ('model' as const),
    text: m.text,
  }));

  const payload = {
    message,
    history: recentHistory,
    currentProduct: currentProduct
      ? {
          id: currentProduct.id,
          name: currentProduct.name,
          slug: currentProduct.slug,
          selling_price: currentProduct.selling_price,
          discount: currentProduct.discount,
          stock: currentProduct.stock,
          brand: currentProduct.brand,
          category: currentProduct.category,
          sub_category: currentProduct.sub_category,
          description: currentProduct.description,
          colors: currentProduct.colors,
        }
      : null,
    activeFaqs,
    settings: {
      store_name: settings?.store_name,
      delivery_inside_dhaka: settings?.delivery_inside_dhaka,
      delivery_sub_dhaka: settings?.delivery_sub_dhaka,
      delivery_outside_dhaka: settings?.delivery_outside_dhaka,
      phone: settings?.phone,
      whatsapp: settings?.whatsapp,
      ai_whatsapp_number: settings?.ai_whatsapp_number,
      ai_custom_commands: settings?.ai_custom_commands,
      ai_system_instructions: settings?.ai_system_instructions,
    },
    candidateProducts: candidateSummary,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    // Try /api/ai/chat first
    let res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // Fallback to /api/ai-chat if 404
    if (!res.ok && res.status === 404) {
      res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const recommendedIds: string[] = Array.isArray(data.recommendedProductIds)
        ? data.recommendedProductIds
        : [];
      const recProducts = allProducts.filter((p) => recommendedIds.includes(p.id));

      return {
        reply: data.reply || 'ধন্যবাদ আপনার প্রশ্নের জন্য।',
        recommendedProducts: recProducts,
        needsWhatsApp: Boolean(data.needsWhatsApp),
        whatsappPrefilledText: data.whatsappPrefilledText,
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('AI Chat API fetch error, executing client fallback:', err);
  }

  // Graceful client fallback if API is unreachable
  return clientFallbackAnswer(message, currentProduct, allProducts, settings);
}

function detectClientQueryLanguage(text: string): 'bn' | 'banglish' | 'en' {
  const t = text.toLowerCase().trim();
  if (/[\u0980-\u09FF]/.test(t)) {
    return 'bn';
  }
  const banglishTokens = [
    'koto', 'dam', 'daam', 'kivabe', 'order', 'korbo', 'korte', 'chai', 'ache', 'ase',
    'kina', 'apnader', 'bhai', 'vai', 'dhaka', 'baire', 'taka', 'tk', 'pabo', 'advance',
    'ogrim', 'kothay', 'lagbe', 'hobe', 'eta', 'oita', 'bhalo', 'valo', 'dekhan', 'nibo',
    'kena', 'dokan', 'showroom', 'thikana', 'somoy', 'din', 'original', 'asol', 'nosto'
  ];
  const words = t.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.some((w) => ['koto', 'dam', 'kivabe', 'korbo', 'ache', 'ase', 'lagbe', 'pabo', 'nibo', 'taka', 'bhai', 'dokan'].includes(w))) {
    return 'banglish';
  }
  let count = 0;
  for (const w of words) {
    if (banglishTokens.includes(w)) count++;
  }
  return count >= 1 ? 'banglish' : 'en';
}

function clientFallbackAnswer(
  query: string,
  currentProduct?: Product | null,
  allProducts: Product[] = [],
  settings?: StoreSettings
): SendAiMessageResult {
  const q = query.toLowerCase().trim();
  const insideDhaka = settings?.delivery_inside_dhaka ?? 70;
  const subDhaka = settings?.delivery_sub_dhaka ?? 100;
  const outsideDhaka = settings?.delivery_outside_dhaka ?? 130;
  const lang = detectClientQueryLanguage(query);

  // 1. Greetings & Welcomes
  const isGreeting = /^(hello|hi|hey|hola|hlo|helo|salam|assalamu\s*alaikum|assalamualaikum|kemon\s*achen|kemon\s*acho|bhai|vai)[\s!.,?]*$/i.test(
    q
  );
  if (isGreeting) {
    let reply = `হ্যালো! 👋 Maxora-তে আপনাকে স্বাগতম। আমি আপনার শপিং অ্যাসিস্ট্যান্ট। আমাদের যেকোনো পণ্য, দাম, স্টক, ডেলিভারি বা অর্ডার সম্পর্কে প্রশ্ন করতে পারেন। কীভাবে আপনাকে সাহায্য করতে পারি?`;
    if (lang === 'en') {
      reply = `Hello! 👋 Welcome to Maxora. I am your AI Shopping Assistant. How can I help you today? Feel free to ask about our products, special prices, stock availability, or delivery process!`;
    } else if (lang === 'banglish') {
      reply = `Hello! 👋 Maxora-te apnake shagotom. Ami apnar shopping assistant. Amader jekono product, dam, stock, delivery charge ba order somporke prosno korte paren. Kivabe sahajjo korte pari?`;
    }
    return {
      reply,
      recommendedProducts: currentProduct ? [currentProduct] : [],
      needsWhatsApp: false,
    };
  }

  // 2. User complains or asks if it's working ("koi kaj tho kore na", "kaj kore na", "not working")
  const isNotWorking = /(kaj\s*kore\s*na|kaj\s*tho\s*kore\s*na|kaj\s*korche\s*na|not\s*working|not\s*replying|কাজ\s*করে\s*না|কাজ\s*করছে\s*না|কাজ\s*তো\s*করে\s*না)/i.test(
    q
  );
  if (isNotWorking) {
    let reply = `জি, আমি সক্রিয় আছি এবং সাহায্য করতে প্রস্তুত! 😊 আপনার কি কোনো পণ্য সম্পর্কে জানার আছে, নাকি অর্ডার বা ডেলিভারি নিয়ে তথ্য প্রয়োজন? বিস্তারিত লিখলে আমি সাথে সাথে উত্তর দেব।`;
    if (lang === 'en') {
      reply = `I am active and ready to help! 😊 Would you like to know about any product, price, or delivery details? Just let me know what you need.`;
    } else if (lang === 'banglish') {
      reply = `Ji, ami active ebong sahajjo korte ready achi! 😊 Apnar kon product somporke jante hobe ba kon bisoye sahajjo lagbe janan, ami sathe sathe answer dichi.`;
    }
    return {
      reply,
      recommendedProducts: currentProduct ? [currentProduct] : [],
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমি সহায়তা চাই: ${query}`,
    };
  }

  // 3. Price inquiry for current product or named product
  if (q.includes('দাম') || q.includes('price') || q.includes('dam') || q.includes('daam') || q.includes('koto')) {
    if (currentProduct) {
      const price = Math.max(0, Number(currentProduct.selling_price || 0) - Number(currentProduct.discount || 0));
      let reply = `**${currentProduct.name}**-এর বর্তমান অফার মূল্য **৳${price.toLocaleString('en-BD')}**। ক্যাশ অন ডেলিভারিতে অর্ডার করতে "Buy Now" বাটনে ক্লিক করুন।`;
      if (lang === 'en') {
        reply = `The current offer price for **${currentProduct.name}** is **৳${price.toLocaleString('en-BD')}**. You can order with 100% Cash on Delivery by clicking "Buy Now".`;
      } else if (lang === 'banglish') {
        reply = `**${currentProduct.name}**-er offer price **৳${price.toLocaleString('en-BD')}**। Cash on Delivery-te order korte "Buy Now" batone click korun.`;
      }
      return {
        reply,
        recommendedProducts: [currentProduct],
        needsWhatsApp: false,
      };
    }
  }

  // 4. Product Catalog Keyword Matching
  const searchWords = q.split(/[\s,?!]+/).filter((w) => w.length >= 2);
  const matchedProducts = allProducts.filter((p) => {
    const pName = (p.name || '').toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    const pBrand = (p.brand || '').toLowerCase();
    return searchWords.some((w) => pName.includes(w) || pCat.includes(w) || pBrand.includes(w));
  });

  if (matchedProducts.length > 0 && !q.includes('delivery') && !q.includes('charge')) {
    const top = matchedProducts.slice(0, 3);
    const listText = top
      .map((p, i) => {
        const net = Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0));
        return `${i + 1}. **${p.name}** — অফার মূল্য: **৳${net.toLocaleString('en-BD')}** ${Number(p.stock || 0) > 0 ? '(স্টকে আছে ✅)' : '(স্টক শেষ)'}`;
      })
      .join('\n');

    let reply = `আপনার অনুসন্ধানের সাথে মিল রেখে আমাদের পণ্যসমূহ নিচে দেওয়া হলো:\n\n${listText}\n\nসরাসরি অর্ডার করতে নিচের কার্ডের **"Buy Now"** বাটনে ক্লিক করুন (১০০% ক্যাশ অন ডেলিভারি)।`;
    if (lang === 'en') {
      reply = `Here are the matching products from our store:\n\n${listText}\n\nClick **"Buy Now"** on the card below to place your order with 100% Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Apnar search onujayi amader matching products nicher list-e royeche:\n\n${listText}\n\nShorashori order korte nicher **"Buy Now"** batone click korun!`;
    }
    return {
      reply,
      recommendedProducts: top,
      needsWhatsApp: false,
    };
  }

  if (q.includes('ডেলিভারি') || q.includes('delivery') || q.includes('charge') || q.includes('shipping')) {
    let reply = `আমাদের ডেলিভারি চার্জ:\n• ঢাকা সিটি: ৳${insideDhaka} (২-৩ দিন)\n• ঢাকা সাব-এরিয়া: ৳${subDhaka} (২-৩ দিন)\n• ঢাকার বাইরে সমগ্র বাংলাদেশ: ৳${outsideDhaka} (৩-৫ দিন)\n\nসমগ্র বাংলাদেশে ক্যাশ অন ডেলিভারি প্রযোজ্য।`;
    if (lang === 'en') {
      reply = `Maxora Delivery Charges:\n• Inside Dhaka City: ৳${insideDhaka} (2–3 days)\n• Dhaka Sub-area: ৳${subDhaka} (2–3 days)\n• Outside Dhaka (all 64 districts): ৳${outsideDhaka} (3–5 days)\n\n100% Cash on Delivery nationwide!`;
    } else if (lang === 'banglish') {
      reply = `Maxora Delivery Charges:\n• Dhaka City: ৳${insideDhaka} (২-৩ দিন)\n• Dhaka Sub-area: ৳${subDhaka} (২-৩ দিন)\n• Dhakar baire (64 districts): ৳${outsideDhaka} (৩-৫ দিন)\n\nShara Bangladesh-e 100% Cash on Delivery shubidha ache!`;
    }
    return {
      reply,
      recommendedProducts: [],
      needsWhatsApp: false,
    };
  }

  if (q.includes('cash on delivery') || q.includes('ক্যাশ অন ডেলিভারি') || q.includes('cod') || q.includes('advance') || q.includes('ogrim') || q.includes('অগ্রিম')) {
    let reply = `হ্যাঁ, Maxora-তে সারা বাংলাদেশে Cash on Delivery (ক্যাশ অন ডেলিভারি) সুবিধা রয়েছে। সাধারণ অর্ডারে কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই। পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।`;
    if (lang === 'en') {
      reply = `Yes! Maxora provides 100% Cash on Delivery across all 64 districts in Bangladesh. No advance payment is needed for regular orders. Receive and verify at your doorstep!`;
    } else if (lang === 'banglish') {
      reply = `Ji haan! Maxora-te shara Bangladesh-e 100% Cash on Delivery (COD) ache. Kono advance taka lage na, parcel haate peye delivery man-ke taka dite parben.`;
    }
    return {
      reply,
      recommendedProducts: [],
      needsWhatsApp: false,
    };
  }

  // Order instruction / how to order
  if (
    q.includes('অর্ডার') ||
    q.includes('order') ||
    q.includes('কিনব') ||
    q.includes('কিনতে চাই') ||
    q.includes('how to buy') ||
    q.includes('how to order') ||
    q.includes('kivabe order') ||
    q.includes('kinbo kivabe')
  ) {
    let reply = `Maxora-তে অর্ডার করার নিয়ম খুবই সহজ:\n\n1. পছন্দের পণ্যটির পেজে গিয়ে **"Buy Now"** অথবা **"অর্ডার করুন"** বাটনে ক্লিক করুন।\n2. আপনার নাম, মোবাইল নম্বর ও পূর্ণাঙ্গ ডেলিভারি ঠিকানা লিখুন।\n3. ডেলিভারি এলাকা সিলেক্ট করে **"অর্ডার কনফার্ম করুন"** বাটনে ক্লিক করলেই আপনার অর্ডার সম্পন্ন হয়ে যাবে!\n\nসারা বাংলাদেশে **১০০% ক্যাশ অন ডেলিভারি** রয়েছে।`;
    if (lang === 'en') {
      reply = `Ordering on Maxora is fast and simple:\n\n1. Go to any product page and click **"Buy Now"**.\n2. Enter your Name, Mobile Number, and delivery Address.\n3. Choose your delivery zone and click **"Confirm Order"**!\n\nWe provide 100% Cash on Delivery across Bangladesh.`;
    } else if (lang === 'banglish') {
      reply = `Maxora-te order kora khub-i shohoj:\n\n1. Product page-e giye **"Buy Now"** batone click korun.\n2. Apnar Name, Mobile Number ebong Address likhun.\n3. Delivery Area select kore **"Confirm Order"** batone click korun!\n\n100% Cash on Delivery-te shara deshe delivery paben.`;
    }
    return {
      reply,
      recommendedProducts: currentProduct ? [currentProduct] : [],
      needsWhatsApp: false,
    };
  }

  // Warranty / Return
  if (
    q.includes('warranty') ||
    q.includes('ওয়ারেন্টি') ||
    q.includes('গ্যারান্টি') ||
    q.includes('রিটার্ন') ||
    q.includes('ফেরত') ||
    q.includes('replacement')
  ) {
    let reply = `Maxora-তে রয়েছে **৭ দিনের সহজ রিপ্লেসমেন্ট ওয়ারেন্টি**। পণ্যে কোনো উৎপাদনগত ত্রুটি থাকলে আমাদের WhatsApp সাপোর্টে জানালে তাৎক্ষণিক সমাধান বা রিপ্লেসমেন্ট দেওয়া হবে।`;
    if (lang === 'en') {
      reply = `Maxora provides a **7 Days Easy Replacement Warranty**! If you encounter any manufacturing defect, reach out to our WhatsApp support team for a quick replacement.`;
    } else if (lang === 'banglish') {
      reply = `Maxora-te royeche **7 Days Easy Replacement Warranty**! Product-e kono problem thakle 7 diner moddhe amader WhatsApp support-e janale replacement peye jaben.`;
    }
    return {
      reply,
      recommendedProducts: [],
      needsWhatsApp: false,
    };
  }

  // Suggestion / Recommendation query
  if (
    q.includes('সাজেস্ট') ||
    q.includes('ভালো') ||
    q.includes('গ্যাজেট') ||
    q.includes('সেরা') ||
    q.includes('বেস্ট') ||
    q.includes('পণ্য') ||
    q.includes('প্রোডাক্ট') ||
    q.includes('recommend') ||
    q.includes('suggest') ||
    q.includes('bhalo')
  ) {
    const inStock = allProducts.filter((p) => Number(p.stock || 0) > 0);
    const suggested = (inStock.length > 0 ? inStock : allProducts).slice(0, 3);
    if (suggested.length > 0) {
      const listText = suggested
        .map(
          (p, i) =>
            `${i + 1}. **${p.name}** - অফার মূল্য: ৳${Math.max(
              0,
              Number(p.selling_price || 0) - Number(p.discount || 0)
            ).toLocaleString('en-BD')}`
        )
        .join('\n');
      return {
        reply: `আপনার সুবিধার জন্য আমাদের শপের সেরা ও সবচেয়ে জনপ্রিয় আসল গ্যাজেটগুলো নিচে সাজেস্ট করা হলো:\n\n${listText}\n\nআমাদের সকল পণ্যে পাচ্ছেন সারা বাংলাদেশে **১০০% ক্যাশ অন ডেলিভারি** এবং **৭ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি**। যেকোনো পণ্য কিনতে নিচে দেওয়া কার্ডের **"Buy Now"** বাটনে ক্লিক করুন!`,
        recommendedProducts: suggested,
        needsWhatsApp: false,
      };
    }
  }

  // Check active FAQs from settings
  if (Array.isArray(settings?.ai_faqs)) {
    for (const faq of settings.ai_faqs) {
      if (faq.active !== false && faq.question) {
        const fq = faq.question.toLowerCase();
        if (fq.includes(q) || q.includes(fq)) {
          return {
            reply: faq.answer,
            recommendedProducts: currentProduct ? [currentProduct] : [],
            needsWhatsApp: false,
          };
        }
      }
    }
  }

  // Default friendly fallback with WhatsApp button
  let defaultReply = `আমি Maxora AI Shopping Assistant। পণ্য, মূল্য, অফার, ডেলিভারি চার্জ বা অর্ডার নিয়ে যেকোনো প্রশ্ন করতে পারেন—আমি সাথে সাথে তথ্য দেব। সরাসরি আমাদের টিমের সাথে কথা বলতে নিচে WhatsApp-এ ট্যাপ করতে পারেন।`;
  if (lang === 'en') {
    defaultReply = `I am your Maxora AI Shopping Assistant! Feel free to ask about any product details, prices, delivery charges, or ordering steps. For direct assistance from our team, tap WhatsApp below!`;
  } else if (lang === 'banglish') {
    defaultReply = `Ami Maxora AI Shopping Assistant! Jekono product, dam, offer, delivery charge ba kivabe order korben ta jante prosno korun. Directly kotha bolte nicher WhatsApp batone click korte paren.`;
  }

  return {
    reply: defaultReply,
    recommendedProducts: currentProduct ? [currentProduct] : [],
    needsWhatsApp: true,
    whatsappPrefilledText: `হ্যালো Maxora, আমি এই বিষয়ে জানতে চাই: ${query}`,
  };
}
