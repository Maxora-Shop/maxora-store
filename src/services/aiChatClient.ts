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
  let candidateProducts = allProducts;
  if (qLower) {
    const tokens = qLower.split(/\s+/).filter((t) => t.length > 2);
    const scored = allProducts.map((p) => {
      let score = 0;
      const text = `${p.name} ${p.brand || ''} ${p.category || ''} ${p.sub_category || ''} ${p.description || ''}`.toLowerCase();
      tokens.forEach((t) => {
        if (text.includes(t)) score += 2;
      });
      if (p.stock > 0) score += 1;
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
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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

function clientFallbackAnswer(
  query: string,
  currentProduct?: Product | null,
  allProducts: Product[] = [],
  settings?: StoreSettings
): SendAiMessageResult {
  const q = query.toLowerCase();
  const insideDhaka = settings?.delivery_inside_dhaka ?? 70;
  const subDhaka = settings?.delivery_sub_dhaka ?? 100;
  const outsideDhaka = settings?.delivery_outside_dhaka ?? 130;

  if (q.includes('দাম') || q.includes('price') || q.includes('dam')) {
    if (currentProduct) {
      const price = Math.max(0, Number(currentProduct.selling_price || 0) - Number(currentProduct.discount || 0));
      return {
        reply: `**${currentProduct.name}**-এর বর্তমান অফার মূল্য **৳${price.toLocaleString('en-BD')}**। ক্যাশ অন ডেলিভারিতে অর্ডার করতে "Buy Now" বাটনে ক্লিক করুন।`,
        recommendedProducts: [currentProduct],
        needsWhatsApp: false,
      };
    }
  }

  if (q.includes('ডেলিভারি') || q.includes('delivery') || q.includes('charge')) {
    return {
      reply: `আমাদের ডেলিভারি চার্জ:\n• ঢাকা সিটি: ৳${insideDhaka} (২-৩ দিন)\n• ঢাকা সাব-এরিয়া: ৳${subDhaka} (২-৩ দিন)\n• ঢাকার বাইরে সমগ্র বাংলাদেশ: ৳${outsideDhaka} (৩-৫ দিন)\n\nসমগ্র বাংলাদেশে ক্যাশ অন ডেলিভারি প্রযোজ্য।`,
      recommendedProducts: [],
      needsWhatsApp: false,
    };
  }

  if (q.includes('cash on delivery') || q.includes('ক্যাশ অন ডেলিভারি') || q.includes('cod')) {
    return {
      reply: `হ্যাঁ, Maxora-তে সারা বাংলাদেশে Cash on Delivery (ক্যাশ অন ডেলিভারি) সুবিধা রয়েছে। পণ্য হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।`,
      recommendedProducts: [],
      needsWhatsApp: false,
    };
  }

  // Default friendly fallback with WhatsApp button
  return {
    reply: `দুঃখিত, এই মুহূর্তে AI Assistant সংযোগ পেতে পারছে না। তবে আপনার যেকোনো পণ্য বা অর্ডার সংক্রান্ত সহায়তার জন্য আমাদের WhatsApp সাপোর্ট টিম সদা প্রস্তুত।`,
    recommendedProducts: currentProduct ? [currentProduct] : [],
    needsWhatsApp: true,
    whatsappPrefilledText: `হ্যালো Maxora, আমি এই বিষয়ে জানতে চাই: ${query}`,
  };
}
