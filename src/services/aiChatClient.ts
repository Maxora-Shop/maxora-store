import type { Product, StoreSettings, AiFaqItem } from '../types';

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

export function detectClientQueryLanguage(text: string): 'bn' | 'banglish' | 'en' {
  const t = text.toLowerCase().trim();
  if (/[\u0980-\u09FF]/.test(t)) {
    return 'bn';
  }
  const banglishTokens = [
    'kom', 'damer', 'dame', 'dam', 'daam', 'koto', 'kichu', 'dekhaw', 'dekhan', 'dekha',
    'dekhano', 'bhalo', 'valo', 'ache', 'ase', 'nai', 'nei', 'kivabe', 'order', 'korbo',
    'korte', 'chai', 'nibo', 'kena', 'kinbo', 'bhai', 'vai', 'dhaka', 'baire', 'taka',
    'tk', 'pabo', 'advance', 'ogrim', 'kothay', 'lagbe', 'hobe', 'eta', 'oita', 'dokan',
    'showroom', 'thikana', 'somoy', 'din', 'original', 'asol', 'nosto', 'ghuri', 'ghori',
    'apnader', 'apnar', 'shob', 'sob', 'jeno', 'bolun', 'bolte', 'kori', 'koren'
  ];
  const words = t.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const hasBanglishWord = words.some((w) => banglishTokens.includes(w));
  if (hasBanglishWord) {
    return 'banglish';
  }

  // Check if it's strictly English
  const englishTokens = ['what', 'how', 'when', 'where', 'which', 'who', 'why', 'can', 'please', 'tell', 'show', 'price', 'product', 'available', 'shipping', 'delivery', 'cost'];
  const hasEnglish = words.some((w) => englishTokens.includes(w));
  return hasEnglish ? 'en' : 'banglish';
}

export function clientFallbackAnswer(
  query: string,
  currentProduct?: Product | null,
  allProducts: Product[] = [],
  settings?: StoreSettings
): SendAiMessageResult {
  const q = query.toLowerCase().trim();
  const insideDhaka = settings?.delivery_inside_dhaka ?? 70;
  const subDhaka = settings?.delivery_sub_dhaka ?? 100;
  const outsideDhaka = settings?.delivery_outside_dhaka ?? 130;
  const phone = settings?.phone || settings?.whatsapp || '01700-000000';
  const lang = detectClientQueryLanguage(query);

  const netPrice = (p: Product) =>
    Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0));

  const inStockProducts = allProducts.filter((p) => Number(p.stock || 0) > 0);
  const activeProducts = inStockProducts.length > 0 ? inStockProducts : allProducts;

  // 1. Greetings & Welcomes
  const isGreeting = /^(hello|hi|hey|hola|hlo|helo|salam|assalamu\s*alaikum|assalamualaikum|kemon\s*achen|kemon\s*acho|bhai|vai)[\s!.,?]*$/i.test(
    q
  );
  if (isGreeting) {
    let reply = `হ্যালো! 👋 Maxora-তে আপনাকে স্বাগতম। আমি আপনার AI শপিং অ্যাসিস্ট্যান্ট। আমাদের যেকোনো পণ্য, দাম, স্টক, ডেলিভারি চার্জ বা অর্ডার সম্পর্কে প্রশ্ন করতে পারেন। কীভাবে আপনাকে সাহায্য করতে পারি?`;
    if (lang === 'en') {
      reply = `Hello! 👋 Welcome to Maxora. I am your AI Shopping Assistant. How can I help you today? Feel free to ask about our products, special prices, stock availability, or delivery process!`;
    } else if (lang === 'banglish') {
      reply = `Hello! 👋 Maxora-te apnake shagotom. Ami apnar shopping assistant. Amader jekono product, dam, stock, delivery charge ba order somporke prosno korte paren. Kivabe sahajjo korte pari?`;
    }
    const topRecs = activeProducts.slice(0, 3);
    return {
      reply,
      recommendedProducts: currentProduct ? [currentProduct] : topRecs,
      needsWhatsApp: false,
    };
  }

  // 2. User complains or asks if it's working ("koi kaj tho kore na", "kaj kore na", "not working")
  const isNotWorking = /(kaj\s*kore\s*na|kaj\s*tho\s*kore\s*na|kaj\s*korche\s*na|not\s*working|not\s*replying|কাজ\s*করে\s*না|কাজ\s*করছে\s*না|কাজ\s*তো\s*করে\s*না)/i.test(
    q
  );
  if (isNotWorking) {
    let reply = `জি, আমি সম্পূর্ণ সক্রিয় আছি এবং আপনাকে সাহায্য করতে প্রস্তুত! 😊 আপনার কি কোনো পণ্য সম্পর্কে জানতে চান, নাকি অর্ডার বা ডেলিভারি নিয়ে তথ্য প্রয়োজন? বিস্তারিত লিখুন, আমি সাথে সাথে উত্তর দিচ্ছি।`;
    if (lang === 'en') {
      reply = `I am fully active and ready to help! 😊 Would you like to know about any product, price, or delivery details? Just let me know what you need.`;
    } else if (lang === 'banglish') {
      reply = `Ji, ami active ebong sahajjo korte ready achi! 😊 Apnar kon product somporke jante hobe ba kon bisoye sahajjo lagbe janan, ami sathe sathe answer dichi.`;
    }
    return {
      reply,
      recommendedProducts: currentProduct ? [currentProduct] : activeProducts.slice(0, 3),
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমি সহায়তা চাই: ${query}`,
    };
  }

  // 3. Low Price / Budget Inquiries ("kom damer kichu product dekhaw", "kom dame ki ache", "budget products", "sosta")
  const isLowPrice = /(kom\s*dam|kom\s*damer|kom\s*dame|sosta|shosta|budget|cheap|cheapest|low\s*price|lowest\s*price|kom\s*taka|কম\s*দাম|কম\s*দামের|কম\s*দামে|বাজেট|সস্তা|স্বল্প\s*মূল্য)/i.test(
    q
  );
  if (isLowPrice) {
    const budgetList = [...activeProducts].sort((a, b) => netPrice(a) - netPrice(b)).slice(0, 3);
    const listText = budgetList
      .map(
        (p, i) =>
          `${i + 1}. **${p.name}** — বর্তমান অফার মূল্য: **৳${netPrice(p).toLocaleString('en-BD')}**`
      )
      .join('\n');

    let reply = `জি স্যার! আমাদের স্টোরের সবচেয়ে সাশ্রয়ী ও আকর্ষণীয় মূল্যের বাজেট-ফ্রেন্ডলি পণ্যসমূহ নিচে দেওয়া হলো:\n\n${listText}\n\nপছন্দের পণ্যটি সরাসরি অর্ডার করতে নিচের কার্ডের **"Buy Now"** বাটনে ক্লিক করুন (১০০% ক্যাশ অন ডেলিভারি)!`;
    if (lang === 'en') {
      reply = `Here are the top budget-friendly, best-value products from our store:\n\n${listText}\n\nClick **"Buy Now"** on any card below to place your order with 100% Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Ji sir! Amader store-er shobcheye shashroyi o budget-friendly product-gulo niche deya holo:\n\n${listText}\n\nOrder korte nicher card-er **"Buy Now"** batone click korun (100% Cash on Delivery)!`;
    }
    return {
      reply,
      recommendedProducts: budgetList,
      needsWhatsApp: false,
    };
  }

  // 4. High Price / Premium Inquiries ("beshi damer", "dami", "premium", "luxury")
  const isPremium = /(beshi\s*dam|beshi\s*damer|dami|premium|luxury|expensive|high\s*end|বেশি\s*দাম|দামি|প্রিমিয়াম)/i.test(
    q
  );
  if (isPremium) {
    const premiumList = [...activeProducts].sort((a, b) => netPrice(b) - netPrice(a)).slice(0, 3);
    const listText = premiumList
      .map(
        (p, i) =>
          `${i + 1}. **${p.name}** — বর্তমান মূল্য: **৳${netPrice(p).toLocaleString('en-BD')}**`
      )
      .join('\n');

    let reply = `আমাদের শপের সেরা প্রিমিয়াম ও টপ-কোয়ালিটি পণ্যসমূহ নিচে দেওয়া হলো:\n\n${listText}\n\nসরাসরি অর্ডার করতে নিচের কার্ডের **"Buy Now"** বাটনে ক্লিক করুন!`;
    if (lang === 'en') {
      reply = `Here are our top premium-tier products:\n\n${listText}\n\nClick **"Buy Now"** on any card below to order!`;
    } else if (lang === 'banglish') {
      reply = `Amader shoper premium o top-quality product-gulo niche deya holo:\n\n${listText}\n\nShorashori order korte nicher **"Buy Now"** batone click korun!`;
    }
    return {
      reply,
      recommendedProducts: premiumList,
      needsWhatsApp: false,
    };
  }

  // 5. Smartwatch inquiry (not directly in stock)
  if (
    q.includes('smartwatch') ||
    q.includes('smart watch') ||
    q.includes('watch') ||
    q.includes('ঘড়ি') ||
    q.includes('ঘরি') ||
    q.includes('স্মার্টওয়াচ') ||
    q.includes('t900') ||
    q.includes('ultra watch')
  ) {
    const topGadgets = activeProducts.slice(0, 3);
    let reply = `জি স্যার, দুঃখিত যে বর্তমানে আমাদের স্টকে সরাসরি 'স্মার্টওয়াচ' নেই। তবে আমাদের কাছে রয়েছে দারুণ কিছু আকর্ষণীয় গ্যাজেট ও ইলেকট্রনিক্স পণ্য (যেমন: TWS Earbuds, Fast Charging Power Bank, Mini Thermal Printer ইত্যাদি)।\n\nআপনি চাইলে নিচের জনপ্রিয় গ্যাজেটগুলো দেখতে পারেন এবং ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন!`;
    if (lang === 'en') {
      reply = `Sorry, we do not currently have smartwatches in stock. However, we have other great gadgets like TWS Wireless Earbuds and Fast Charging Power Banks available for Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Dukhkito sir, eimuhurte amader stock-e shorashori 'smartwatch' nei. Tobe amader kache darun kichu gadgets ache (jemon: TWS Earbuds, Power Bank, Mini Printer)! Apni chaile nicher product-gulo dekhte paren.`;
    }
    return {
      reply,
      recommendedProducts: topGadgets,
      needsWhatsApp: false,
    };
  }

  // 6. Show products / browse request ("product dekhaw", "product dekhan", "kichu product", "ki ki ache", "ki ki product", "show products")
  const isShowProducts = /(product\s*dekhaw|product\s*dekhan|kichu\s*product|ki\s*ki\s*ache|ki\s*ki\s*product|show\s*product|list|পণ্য\s*দেখান|প্রোডাক্ট\s*দেখাও|কি\s*কি\s*আছে|পণ্য\s*দেখাও)/i.test(
    q
  );
  if (isShowProducts) {
    const topFeatured = activeProducts.slice(0, 3);
    const listText = topFeatured
      .map(
        (p, i) =>
          `${i + 1}. **${p.name}** — মূল্য: **৳${netPrice(p).toLocaleString('en-BD')}**`
      )
      .join('\n');

    let reply = `Maxora-র কিছু সেরা ও জনপ্রিয় পণ্য নিচে দেওয়া হলো:\n\n${listText}\n\nযেকোনো পণ্য কিনতে সরাসরি পেজের **"Buy Now"** বাটনে ক্লিক করুন (১০০% ক্যাশ অন ডেলিভারি)।`;
    if (lang === 'en') {
      reply = `Here are some of our popular products:\n\n${listText}\n\nClick **"Buy Now"** on any product below to order with 100% Cash on Delivery!`;
    } else if (lang === 'banglish') {
      reply = `Maxora-r popular kichu products niche royeche:\n\n${listText}\n\nOrder korte shorashori **"Buy Now"** batone click korun!`;
    }
    return {
      reply,
      recommendedProducts: topFeatured,
      needsWhatsApp: false,
    };
  }

  // 7. Showroom / Shop / Address / Location inquiries
  const isLocation = /(thikana|address|location|showroom|dokan|office|kothay|কোথায়|ঠিকানা|শোরুম|দোকান|অফিস)/i.test(
    q
  );
  if (isLocation) {
    let reply = `Maxora একটি বিশ্বস্ত অনলাইন শপ। আমাদের সেন্ট্রাল ওয়্যারহাউজ ও ডিসপ্যাচ হাব ঢাকায় অবস্থিত। আমরা সারা বাংলাদেশের যেকোনো জেলা ও উপজেলায় কাস্টমারের ঠিকানায় সরাসরি দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারিতে পণ্য পৌঁছে দিয়ে থাকি। কোনো অগ্রিম পেমেন্ট ছাড়াই অর্ডার করতে পারেন।`;
    if (lang === 'en') {
      reply = `Maxora is a premium online retail store. Our central dispatch hub is located in Dhaka, providing fast doorstep Cash on Delivery to all 64 districts across Bangladesh!`;
    } else if (lang === 'banglish') {
      reply = `Maxora ekti premium online shop. Amader central dispatch hub Dhaka-te abosthito. Shara Bangladesh-e 64 district-e home delivery ebong Cash on Delivery shubidha royeche!`;
    }
    return {
      reply,
      recommendedProducts: activeProducts.slice(0, 2),
      needsWhatsApp: false,
    };
  }

  // 8. Contact / Phone / Helpline
  const isContact = /(phone|number|mobile|call|helpline|contact|kotha\s*bolte\s*chai|যোগাযোগ|ফোন|নাম্বার|কল|হেল্পলাইন)/i.test(
    q
  );
  if (isContact) {
    let reply = `আমাদের কাস্টমার কেয়ারের সাথে সরাসরি যোগাযোগ করতে কল করুন: **${phone}** অথবা নিচে দেওয়া সবুজ **WhatsApp** বাটনে ট্যাপ করে আমাদের প্রতিনিধির সাথে সরাসরি কথা বলুন।`;
    if (lang === 'en') {
      reply = `To contact our customer support, call **${phone}** or tap the green **WhatsApp** button below to chat with a live representative!`;
    } else if (lang === 'banglish') {
      reply = `Amader customer care-e kotha bolte call korun: **${phone}** ba nicher **WhatsApp** batone tap kore live chat korun!`;
    }
    return {
      reply,
      recommendedProducts: [],
      needsWhatsApp: true,
      whatsappPrefilledText: `হ্যালো Maxora, আমি কাস্টমার কেয়ারে কথা বলতে চাই।`,
    };
  }

  // 9. Specific Product Keyword Matching (e.g. "earbuds", "fan", "powerbank", "lighter", "soap", "shampoo", "bag", etc.)
  const searchWords = q
    .split(/[\s,?!]+/)
    .filter(
      (w) =>
        w.length >= 2 &&
        ![
          'er', 'ar', 'r', 'ki', 'eta', 'oita', 'dam', 'daam', 'price', 'koto', 'ache', 'ase',
          'dekhaw', 'dekhan', 'chai', 'kichu', 'product', 'shob', 'bhai', 'vai'
        ].includes(w)
    );

  if (searchWords.length > 0) {
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
          const net = netPrice(p);
          return `${i + 1}. **${p.name}** — বর্তমান অফার মূল্য: **৳${net.toLocaleString('en-BD')}** ${Number(p.stock || 0) > 0 ? '(স্টকে আছে ✅)' : '(স্টক শেষ ⚠️)'}`;
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
  }

  // 10. Price inquiry for current product
  if (q.includes('দাম') || q.includes('price') || q.includes('dam') || q.includes('daam') || q.includes('koto')) {
    if (currentProduct) {
      const price = netPrice(currentProduct as Product);
      let reply = `**${currentProduct.name}**-এর বর্তমান অফার মূল্য **৳${price.toLocaleString('en-BD')}**। ক্যাশ অন ডেলিভারিতে অর্ডার করতে নিচে "Buy Now" বাটনে ক্লিক করুন।`;
      if (lang === 'en') {
        reply = `The current offer price for **${currentProduct.name}** is **৳${price.toLocaleString('en-BD')}**. You can order with 100% Cash on Delivery by clicking "Buy Now".`;
      } else if (lang === 'banglish') {
        reply = `**${currentProduct.name}**-er offer price **৳${price.toLocaleString('en-BD')}**। Cash on Delivery-te order korte "Buy Now" batone click korun.`;
      }
      return {
        reply,
        recommendedProducts: [currentProduct as Product],
        needsWhatsApp: false,
      };
    }
  }

  // 11. Delivery Charges
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

  // 12. Cash on delivery
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

  // 13. Order instruction
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
      recommendedProducts: currentProduct ? [currentProduct as Product] : activeProducts.slice(0, 3),
      needsWhatsApp: false,
    };
  }

  // 14. Warranty / Return
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

  // 15. Check active FAQs from settings
  if (Array.isArray(settings?.ai_faqs)) {
    for (const faq of settings.ai_faqs) {
      if (faq.active !== false && faq.question) {
        const fq = faq.question.toLowerCase();
        if (fq.includes(q) || q.includes(fq)) {
          return {
            reply: faq.answer,
            recommendedProducts: currentProduct ? [currentProduct as Product] : [],
            needsWhatsApp: false,
          };
        }
      }
    }
  }

  // 16. Comprehensive Helpful Fallback (ALWAYS provides real store items and prices)
  const defaultRecs = activeProducts.slice(0, 3);
  const recListText = defaultRecs
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** — বর্তমান মূল্য: **৳${netPrice(p).toLocaleString('en-BD')}**`
    )
    .join('\n');

  let defaultReply = `আমি Maxora AI Shopping Assistant। আপনার প্রশ্নের উত্তর সঠিকভাবে দিতে আমাদের ক্যাটালগের সেরা কিছু পণ্য নিচে তুলে ধরা হলো:\n\n${recListText}\n\nআমাদের সকল পণ্যে পাচ্ছেন **১০০% ক্যাশ অন ডেলিভারি**। নির্দিষ্ট কোনো পণ্যের দাম বা তথ্য জানতে চাইলে নাম লিখুন, অথবা সরাসরি আমাদের প্রতিনিধির সাথে কথা বলতে নিচে WhatsApp-এ ট্যাপ করুন।`;
  if (lang === 'en') {
    defaultReply = `I am your Maxora AI Shopping Assistant! Here are some of our popular products:\n\n${recListText}\n\nFeel free to ask about any product details, or tap WhatsApp below to chat with our live support!`;
  } else if (lang === 'banglish') {
    defaultReply = `Ami Maxora AI Shopping Assistant! Apnar sahajjer jonno amader kichu popular product niche deya holo:\n\n${recListText}\n\nAmader shob product-e 100% Cash on Delivery ache. Jekono product somporke jante prosno korun ba nicher WhatsApp batone click korun.`;
  }

  return {
    reply: defaultReply,
    recommendedProducts: currentProduct ? [currentProduct as Product] : defaultRecs,
    needsWhatsApp: true,
    whatsappPrefilledText: `হ্যালো Maxora, আমি এই বিষয়ে জানতে চাই: ${query}`,
  };
}
