import { Product, StoreSettings, Customer, Order, OrderItem, Category, SubCategory, ProductType, ChildCategory, Review, Brand } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-electronics",
    name: "Electronics",
    slug: "electronics",
    icon: "Cpu",
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&auto=format&fit=crop&q=80",
    display_order: 1,
    active: 1,
    meta_title: "Electronics & Smart Tech in Bangladesh | Maxora",
    meta_description: "Explore smart gadgets, smartwatches, audio devices, and computer accessories with fast Cash on Delivery in Bangladesh."
  },
  {
    id: "cat-smart-gadgets",
    name: "Smart Gadgets",
    slug: "smart-gadgets",
    icon: "Watch",
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&auto=format&fit=crop&q=80",
    display_order: 2,
    active: 1,
    meta_title: "Smart Gadgets & Wearables in Bangladesh | Maxora",
    meta_description: "Explore smartwatches, fitness bands, and wearable tech with fast Cash on Delivery in Bangladesh."
  },
  {
    id: "cat-audio",
    name: "Audio",
    slug: "audio",
    icon: "Headphones",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80",
    display_order: 3,
    active: 1,
    meta_title: "Premium Wireless Earbuds & Audio in BD | Maxora",
    meta_description: "Shop Active Noise Cancelling (ANC) earbuds, headphones, and Bluetooth speakers at best prices in BD."
  },
  {
    id: "cat-computer-gaming",
    name: "Computer & Gaming",
    slug: "computer-gaming",
    icon: "Sparkles",
    image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80",
    display_order: 3,
    active: 1,
    meta_title: "Mechanical Keyboards & Gaming Gear in BD | Maxora",
    meta_description: "RGB mechanical keyboards, gaming mice, and desk accessories for gamers and professionals in Bangladesh."
  },
  {
    id: "cat-lifestyle-bags",
    name: "Lifestyle & Bags",
    slug: "lifestyle-bags",
    icon: "ShoppingBag",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80",
    display_order: 4,
    active: 1,
    meta_title: "Anti-Theft Backpacks & Travel Bags | Maxora BD",
    meta_description: "Water-repellent anti-theft backpacks, laptop bags, and travel gear delivered across 64 districts."
  },
  {
    id: "cat-home-living",
    name: "Home & Living",
    slug: "home-living",
    icon: "Home",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80",
    display_order: 5,
    active: 1,
    meta_title: "Home & Living Essentials | Maxora BD",
    meta_description: "Vacuum insulated flasks, coffee dripper sets, and premium home essentials for everyday comfort."
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    icon: "Shirt",
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop&q=80",
    display_order: 6,
    active: 1,
    meta_title: "Genuine Leather Wallets & Accessories | Maxora BD",
    meta_description: "Handcrafted 100% genuine BD cowhide leather wallets, cardholders, and everyday accessories."
  },
  {
    id: "cat-mobile-accessories",
    name: "Mobile Accessories",
    slug: "mobile-accessories",
    icon: "Sparkles",
    image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80",
    display_order: 7,
    active: 1,
    meta_title: "Fast GaN Chargers & Cables | Maxora BD",
    meta_description: "Fast chargers, GaN adapters, heavy-duty braided Type-C cables, and mobile accessories."
  },
  {
    id: "cat-gourmet-food",
    name: "Gourmet & Food",
    slug: "gourmet-food",
    icon: "Coffee",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80",
    display_order: 8,
    active: 1,
    meta_title: "Pure Organic Tea & Artisanal Food | Maxora BD",
    meta_description: "Single-origin whole-leaf Sylhet Sreemangal black tea and gourmet specialty goods."
  }
];

export const INITIAL_SUBCATEGORIES: SubCategory[] = [
  {
    id: "subcat-smartwatches",
    category_id: "cat-smart-gadgets",
    category_slug: "smart-gadgets",
    name: "Smartwatches",
    slug: "smartwatches",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-fitness-bands",
    category_id: "cat-smart-gadgets",
    category_slug: "smart-gadgets",
    name: "Fitness Bands",
    slug: "fitness-bands",
    display_order: 2,
    active: 1
  },
  {
    id: "subcat-tws-earbuds",
    category_id: "cat-audio",
    category_slug: "audio",
    name: "TWS Earbuds",
    slug: "tws-earbuds",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-bluetooth-speakers",
    category_id: "cat-audio",
    category_slug: "audio",
    name: "Bluetooth Speakers",
    slug: "bluetooth-speakers",
    display_order: 2,
    active: 1
  },
  {
    id: "subcat-mechanical-keyboards",
    category_id: "cat-computer-gaming",
    category_slug: "computer-gaming",
    name: "Mechanical Keyboards",
    slug: "mechanical-keyboards",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-gaming-mouse",
    category_id: "cat-computer-gaming",
    category_slug: "computer-gaming",
    name: "Gaming Mouse",
    slug: "gaming-mouse",
    display_order: 2,
    active: 1
  },
  {
    id: "subcat-backpacks",
    category_id: "cat-lifestyle-bags",
    category_slug: "lifestyle-bags",
    name: "Backpacks",
    slug: "backpacks",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-vacuum-flasks",
    category_id: "cat-home-living",
    category_slug: "home-living",
    name: "Vacuum Flasks",
    slug: "vacuum-flasks",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-coffee-drippers",
    category_id: "cat-home-living",
    category_slug: "home-living",
    name: "Coffee Drippers",
    slug: "coffee-drippers",
    display_order: 2,
    active: 1
  },
  {
    id: "subcat-home-appliances",
    category_id: "cat-home-living",
    category_slug: "home-living",
    name: "Home Appliances",
    slug: "home-appliances",
    display_order: 3,
    active: 1
  },
  {
    id: "subcat-wallets",
    category_id: "cat-accessories",
    category_slug: "accessories",
    name: "Wallets",
    slug: "wallets",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-chargers-cables",
    category_id: "cat-mobile-accessories",
    category_slug: "mobile-accessories",
    name: "Chargers & Cables",
    slug: "chargers-cables",
    display_order: 1,
    active: 1
  },
  {
    id: "subcat-organic-tea",
    category_id: "cat-gourmet-food",
    category_slug: "gourmet-food",
    name: "Organic Tea",
    slug: "organic-tea",
    display_order: 1,
    active: 1
  }
];

export const INITIAL_PRODUCT_TYPES: ProductType[] = [
  {
    id: "pt-smartwatch",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-smart-gadgets",
    subcategory_slug: "smart-gadgets",
    name: "Smartwatch",
    slug: "smartwatch",
    display_order: 1,
    active: 1
  },
  {
    id: "pt-wireless-earbuds",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-audio",
    subcategory_slug: "audio",
    name: "Wireless Earbuds",
    slug: "wireless-earbuds",
    display_order: 1,
    active: 1
  },
  {
    id: "pt-mechanical-keyboard",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-smart-gadgets",
    subcategory_slug: "smart-gadgets",
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    display_order: 2,
    active: 1
  },
  {
    id: "pt-travel-backpack",
    category_id: "cat-lifestyle-bags",
    category_slug: "lifestyle-bags",
    subcategory_id: "subcat-backpacks",
    subcategory_slug: "backpacks",
    name: "Travel Backpack",
    slug: "travel-backpack",
    display_order: 1,
    active: 1
  },
  {
    id: "pt-vacuum-flask",
    category_id: "cat-home-living",
    category_slug: "home-living",
    subcategory_id: "subcat-kitchen-dining",
    subcategory_slug: "kitchen-dining",
    name: "Vacuum Flask",
    slug: "vacuum-flask",
    display_order: 1,
    active: 1
  },
  {
    id: "pt-coffee-maker",
    category_id: "cat-home-living",
    category_slug: "home-living",
    subcategory_id: "subcat-kitchen-dining",
    subcategory_slug: "kitchen-dining",
    name: "Coffee Maker",
    slug: "coffee-maker",
    display_order: 2,
    active: 1
  },
  {
    id: "pt-variant-products",
    category_id: "cat-home-living",
    category_slug: "home-living",
    subcategory_id: "subcat-home-appliances",
    subcategory_slug: "home-appliances",
    name: "Variant Products",
    slug: "variant-products",
    display_order: 3,
    active: 1
  },
  {
    id: "pt-leather-wallet",
    category_id: "cat-accessories",
    category_slug: "accessories",
    subcategory_id: "subcat-wallets",
    subcategory_slug: "wallets",
    name: "Leather Wallet",
    slug: "leather-wallet",
    display_order: 1,
    active: 1
  },
  {
    id: "pt-black-tea",
    category_id: "cat-gourmet-food",
    category_slug: "gourmet-food",
    subcategory_id: "subcat-organic-tea",
    subcategory_slug: "organic-tea",
    name: "Black Tea",
    slug: "black-tea",
    display_order: 1,
    active: 1
  }
];

export const INITIAL_CHILD_CATEGORIES: ChildCategory[] = [
  {
    id: "child-amoled",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-smart-gadgets",
    subcategory_slug: "smart-gadgets",
    product_type_id: "pt-smartwatch",
    product_type_slug: "smartwatch",
    product_type_name: "Smartwatch",
    name: "AMOLED",
    slug: "amoled",
    display_order: 1,
    active: 1
  },
  {
    id: "child-calling",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-smart-gadgets",
    subcategory_slug: "smart-gadgets",
    product_type_id: "pt-smartwatch",
    product_type_slug: "smartwatch",
    product_type_name: "Smartwatch",
    name: "Calling",
    slug: "calling",
    display_order: 2,
    active: 1
  },
  {
    id: "child-anc",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-audio",
    subcategory_slug: "audio",
    product_type_id: "pt-wireless-earbuds",
    product_type_slug: "wireless-earbuds",
    product_type_name: "Wireless Earbuds",
    name: "Active Noise Cancelling (ANC)",
    slug: "active-noise-cancelling-anc",
    display_order: 1,
    active: 1
  },
  {
    id: "child-rgb-hotswap",
    category_id: "cat-electronics",
    category_slug: "electronics",
    subcategory_id: "subcat-smart-gadgets",
    subcategory_slug: "smart-gadgets",
    product_type_id: "pt-mechanical-keyboard",
    product_type_slug: "mechanical-keyboard",
    product_type_name: "Mechanical Keyboard",
    name: "RGB Hot-swap",
    slug: "rgb-hot-swap",
    display_order: 1,
    active: 1
  },
  {
    id: "child-anti-theft",
    category_id: "cat-lifestyle-bags",
    category_slug: "lifestyle-bags",
    subcategory_id: "subcat-backpacks",
    subcategory_slug: "backpacks",
    product_type_id: "pt-travel-backpack",
    product_type_slug: "travel-backpack",
    product_type_name: "Travel Backpack",
    name: "Anti-Theft",
    slug: "anti-theft",
    display_order: 1,
    active: 1
  },
  {
    id: "child-stainless-steel",
    category_id: "cat-home-living",
    category_slug: "home-living",
    subcategory_id: "subcat-kitchen-dining",
    subcategory_slug: "kitchen-dining",
    product_type_id: "pt-vacuum-flask",
    product_type_slug: "vacuum-flask",
    product_type_name: "Vacuum Flask",
    name: "Stainless Steel",
    slug: "stainless-steel",
    display_order: 1,
    active: 1
  },
  {
    id: "child-pourover",
    category_id: "cat-home-living",
    category_slug: "home-living",
    subcategory_id: "subcat-kitchen-dining",
    subcategory_slug: "kitchen-dining",
    product_type_id: "pt-coffee-maker",
    product_type_slug: "coffee-maker",
    product_type_name: "Coffee Maker",
    name: "Pour-Over Dripper",
    slug: "pour-over-dripper",
    display_order: 1,
    active: 1
  },
  {
    id: "child-electric-fans",
    category_id: "cat-home-living",
    category_slug: "home-living",
    subcategory_id: "subcat-home-appliances",
    subcategory_slug: "home-appliances",
    product_type_id: "pt-variant-products",
    product_type_slug: "variant-products",
    product_type_name: "Variant Products",
    name: "Electric Fans",
    slug: "electric-fans",
    display_order: 1,
    active: 1
  },
  {
    id: "child-bifold-rfid",
    category_id: "cat-accessories",
    category_slug: "accessories",
    subcategory_id: "subcat-wallets",
    subcategory_slug: "wallets",
    product_type_id: "pt-leather-wallet",
    product_type_slug: "leather-wallet",
    product_type_name: "Leather Wallet",
    name: "Bi-Fold RFID",
    slug: "bi-fold-rfid",
    display_order: 1,
    active: 1
  },
  {
    id: "child-whole-leaf",
    category_id: "cat-gourmet-food",
    category_slug: "gourmet-food",
    subcategory_id: "subcat-organic-tea",
    subcategory_slug: "organic-tea",
    product_type_id: "pt-black-tea",
    product_type_slug: "black-tea",
    product_type_name: "Black Tea",
    name: "Whole-Leaf BOP",
    slug: "whole-leaf-bop",
    display_order: 1,
    active: 1
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  store_name: "Maxora",
  store_tagline: "Premium Products. Trusted Service.",
  delivery_inside_dhaka: 70,
  delivery_sub_dhaka: 100,
  delivery_outside_dhaka: 130,
  currency: "৳",
  phone: "01700-123456",
  whatsapp: "+8801700123456",
  facebook: "https://facebook.com/maxora.store",
  logo_url: "",
  hero_title: "Discover Products You'll Love",
  hero_subtitle: "Quality lifestyle gadgets & accessories delivered across Bangladesh with 100% Cash on Delivery.",
  promo_text: "Cash on Delivery Available Across Bangladesh (All 64 Districts)",
  footer_text: "© Maxora Bangladesh. All rights reserved. Premium lifestyle gadgets & accessories.",
  site_meta_title: "Maxora Store BD | Buy Premium Smart Gadgets & Lifestyle Accessories Online",
  site_meta_description: "Shop premium smartwatches, earbuds, mechanical keyboards, and lifestyle accessories online in Bangladesh. Fast Cash on Delivery across all 64 districts & 7-day easy warranty return.",
  site_meta_keywords: "smartwatch bangladesh, wireless earbuds bd, gadgets store dhaka, cash on delivery online shopping bd",
  meta_pixel_id: "",
  google_tag_id: "",
  google_ads_id: "",
  tiktok_pixel_id: "",
  custom_product_types: [
    "Standard Product",
    "Variant Product",
    "Physical Product",
    "Digital Product",
    "Combo Offer",
    "Pre-Order",
    "Hot Deal",
    "Exclusive Edition",
    "Clearance Sale"
  ],
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Maxora Ultra AMOLED Smartwatch Series 9",
    description: "1.96-inch Always-on AMOLED display, Bluetooth calling, IP68 water resistance, SpO2 & dynamic heart rate monitoring with 10-day battery backup.",
    category: "Electronics",
    sub_category: "Smart Gadgets",
    product_type: "Smartwatch",
    child_category: "AMOLED",
    sku: "MX-SW-09",
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Space Black", code: "#18181b", stock: 12, image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80" },
      { name: "Silver Starlight", code: "#e4e4e7", stock: 8, image_url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80" },
      { name: "Midnight Navy", code: "#1e3a8a", stock: 4 }
    ],
    buying_price: 1800,
    selling_price: 2850,
    discount: 350,
    final_price: 2500,
    stock: 24,
    badge: "HOT DEAL",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-009",
    name: "Maxora Pulse Bluetooth Calling Smartwatch",
    description: "Built-in HD speaker & microphone for Bluetooth phone calls, 1.85-inch vibrant curved screen, 100+ sports tracking modes & IP68 waterproof rating.",
    category: "Electronics",
    sub_category: "Smart Gadgets",
    product_type: "Smartwatch",
    child_category: "Calling",
    sku: "MX-SW-CALL",
    image_url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Matte Black", code: "#18181b", stock: 10 },
      { name: "Silver Grey", code: "#e4e4e7", stock: 8 }
    ],
    buying_price: 1600,
    selling_price: 2450,
    discount: 250,
    final_price: 2200,
    stock: 18,
    badge: "BT CALLING",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-002",
    name: "Acoustic Pro ANC Wireless Earbuds",
    description: "Active Noise Cancellation (ANC) up to 35dB, Quad-mic ENC for crystal-clear phone calls, ultra low latency gaming mode & deep bass drivers.",
    category: "Electronics",
    sub_category: "Audio",
    product_type: "Wireless Earbuds",
    child_category: "Active Noise Cancelling (ANC)",
    sku: "MX-EB-ANC",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Pearl White", code: "#f8fafc", stock: 20 },
      { name: "Matte Black", code: "#18181b", stock: 15 }
    ],
    buying_price: 1200,
    selling_price: 1950,
    discount: 250,
    final_price: 1700,
    stock: 35,
    badge: "BESTSELLER",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-003",
    name: "Urban Explorer Anti-Theft Water-Repellent Backpack",
    description: "High-density Oxford fabric, concealed zipper security pockets, integrated USB charging port, fits 15.6-inch laptops with breathable orthopedic lumbar back cushion.",
    category: "Lifestyle & Bags",
    sub_category: "Backpacks",
    product_type: "Travel Backpack",
    child_category: "Anti-Theft",
    sku: "MX-BP-URBAN",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80"
    ],
    buying_price: 1100,
    selling_price: 1850,
    discount: 150,
    final_price: 1700,
    stock: 18,
    badge: "TRENDING",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-004",
    name: "ThermoGrip Double-Wall Vacuum Insulated Flask 750ml",
    description: "Medical-grade 316 stainless steel interior, maintains drinks hot for 18h / chilled for 24h, 100% leakproof cap with removable fine tea infuser.",
    category: "Home & Living",
    sub_category: "Kitchen & Dining",
    product_type: "Vacuum Flask",
    child_category: "Stainless Steel",
    sku: "MX-BOT-750",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"
    ],
    buying_price: 450,
    selling_price: 890,
    discount: 100,
    final_price: 790,
    stock: 50,
    badge: "POPULAR",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-005",
    name: "Classic Full-Grain Genuine Leather Bi-Fold Wallet",
    description: "100% genuine BD cowhide leather, RFID blocking shield lining, 8 card slots, dual currency compartments, durable handcrafted waxed stitching.",
    category: "Accessories",
    sub_category: "Wallets",
    product_type: "Leather Wallet",
    child_category: "Bi-Fold RFID",
    sku: "MX-WL-LEA",
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80"
    ],
    buying_price: 650,
    selling_price: 1250,
    discount: 200,
    final_price: 1050,
    stock: 28,
    badge: "NEW",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-006",
    name: "MechWave RGB Mechanical Gaming Keyboard 75%",
    description: "Compact 75% layout, hot-swappable tactile red linear switches, dynamic per-key RGB backlight with 18 effects, Type-C detachable braided cable.",
    category: "Electronics",
    sub_category: "Smart Gadgets",
    product_type: "Mechanical Keyboard",
    child_category: "RGB Hot-swap",
    sku: "MX-KB-RGB",
    image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80"
    ],
    buying_price: 1900,
    selling_price: 3200,
    discount: 400,
    final_price: 2800,
    stock: 14,
    badge: "GAMER CHOICE",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-007",
    name: "Nordic Ceramic Pour-Over Coffee Dripper Set",
    description: "Handcrafted matte ceramic dripper with wooden heat collar, 600ml borosilicate glass server, and 40 reusable Japanese paper filter sheets.",
    category: "Home & Living",
    sub_category: "Kitchen & Dining",
    product_type: "Coffee Maker",
    child_category: "Pour-Over Dripper",
    sku: "MX-COF-SET",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
    ],
    buying_price: 850,
    selling_price: 1450,
    discount: 150,
    final_price: 1300,
    stock: 20,
    badge: "",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-008",
    name: "Pure Organic Sylhet Sreemangal Whole-Leaf Black Tea 500g",
    description: "Single-origin premium BOP orthodox whole-leaf tea from highland Sreemangal gardens. Rich natural aroma, robust malt liquor flavour.",
    category: "Gourmet & Food",
    sub_category: "Organic Tea",
    product_type: "Black Tea",
    child_category: "Whole-Leaf BOP",
    sku: "MX-TEA-500",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"
    ],
    buying_price: 320,
    selling_price: 580,
    discount: 60,
    final_price: 520,
    stock: 45,
    badge: "100% ORGANIC",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-010",
    name: "Maxora AeroStream Rechargeable Oscillating Desk Fan",
    description: "Whisper-quiet brushless DC motor, 4000mAh rechargeable lithium battery with up to 12h runtime, 4 speed modes, 90° auto-oscillation, USB-C fast charging, and compact portable design.",
    category: "Home & Living",
    sub_category: "Home Appliances",
    product_type: "Variant Products",
    child_category: "Electric Fans",
    sku: "MX-FAN-01",
    image_url: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [
      { name: "Arctic White", code: "#f8fafc", stock: 14 },
      { name: "Sage Green", code: "#15803d", stock: 8 }
    ],
    buying_price: 1350,
    selling_price: 2150,
    discount: 250,
    final_price: 1900,
    stock: 22,
    badge: "BESTSELLER",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-mtubpl3r-622",
    name: "National Cutting Board Zepter Knife Set and Cooking Apron Combo Offer",
    description: "National Cutting Board Zepter Knife Set and Cooking Apron Combo Offer. Premium quality 3-in-1 kitchen tools set with stainless steel knives, chopping board, and waterproof cooking apron.",
    category: "Home & Kitchen Appliances",
    sub_category: "Kitchen & Dining",
    product_type: "Combo Offer",
    child_category: "Kitchen Tools",
    sku: "MX-CBK-3016",
    image_url: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80"
    ],
    colors: [],
    buying_price: 967,
    selling_price: 1799,
    discount: 450,
    final_price: 1349,
    stock: 50,
    badge: "COMBO DEAL",
    featured: 1,
    active: 1,
    slug: "national-cutting-board-zepter-knife-set-and-cooking-apron-combo-offer",
    created_at: "2026-09-09T16:39:12.663Z",
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-001",
    product_id: "prod-001",
    rating: 5,
    comment: "The AMOLED display is stunning and responsive! Battery easily lasts a week. Excellent build quality for this price.",
    user_name: "Tanvir Ahmed",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-002",
    product_id: "prod-001",
    rating: 5,
    comment: "Very smooth Bluetooth calling and accurate step tracking. Delivery was fast inside Dhaka.",
    user_name: "Mahmudul Hasan",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-003",
    product_id: "prod-001",
    rating: 4,
    comment: "Good watch overall. Premium feel and straps are comfortable. Heart rate sensor is decently accurate.",
    user_name: "Nusrat Jahan",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-004",
    product_id: "prod-009",
    rating: 5,
    comment: "Calling speaker is crisp and loud. Pairs instantly with my Android phone. Very happy with the purchase!",
    user_name: "Sajjad Hossain",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-005",
    product_id: "prod-009",
    rating: 4,
    comment: "Nice curved screen and lots of watch faces to choose from. Worth every taka.",
    user_name: "Rafiqul Islam",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-006",
    product_id: "prod-002",
    rating: 5,
    comment: "Active Noise Cancellation works surprisingly well in traffic! Deep punchy bass and long playtime.",
    user_name: "Farhana Yasmin",
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-007",
    product_id: "prod-003",
    rating: 5,
    comment: "Typing feel is clicky and tactile. The RGB lighting modes look awesome on my gaming desk.",
    user_name: "Zubair Rahman",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    verified_purchase: true
  },
  {
    id: "rev-008",
    product_id: "prod-004",
    rating: 5,
    comment: "Waterproof fabric and hidden zipper give peace of mind while traveling. Comfortable straps too.",
    user_name: "Imtiaz Karim",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    verified_purchase: true
  }
];

export const INITIAL_BRANDS: Brand[] = [
  {
    id: "brand-sokany",
    name: "Sokany",
    slug: "sokany",
    logo_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&auto=format&fit=crop&q=80",
    description: "Quality home & kitchen appliances from Sokany.",
    display_order: 1,
    active: 1,
    meta_title: "Sokany Products in Bangladesh | Maxora",
    meta_description: "Shop genuine Sokany kitchen appliances, air fryers, blenders, and beauty care items at best prices."
  },
  {
    id: "brand-miyako",
    name: "Miyako",
    slug: "miyako",
    logo_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&auto=format&fit=crop&q=80",
    description: "Household and kitchen appliances by Miyako.",
    display_order: 2,
    active: 1,
    meta_title: "Miyako Appliances in Bangladesh | Maxora",
    meta_description: "Explore Miyako blenders, electric kettles, room heaters, and kitchen essentials in BD."
  },
  {
    id: "brand-jysuper",
    name: "JYSUPER",
    slug: "jysuper",
    logo_url: "https://images.unsplash.com/photo-1584281722572-888981f440ee?w=200&auto=format&fit=crop&q=80",
    description: "Rechargeable emergency lights, desk fans, and electronic gadgets.",
    display_order: 3,
    active: 1,
    meta_title: "JYSUPER Rechargeable Fans & Gadgets | Maxora",
    meta_description: "Authentic JYSUPER emergency fans, portable lighting, and rechargeable electronics with fast BD delivery."
  },
  {
    id: "brand-xiaomi",
    name: "Xiaomi",
    slug: "xiaomi",
    logo_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=80",
    description: "Smart wearables, smart home devices, and audio accessories.",
    display_order: 4,
    active: 1,
    meta_title: "Xiaomi Gadgets & Wearables in BD | Maxora",
    meta_description: "Buy original Xiaomi smartwatches, earbuds, power banks, and smart lifestyle products in Bangladesh."
  },
  {
    id: "brand-samsung",
    name: "Samsung",
    slug: "samsung",
    logo_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200&auto=format&fit=crop&q=80",
    description: "Innovative consumer electronics, wearables, and appliances.",
    display_order: 5,
    active: 1,
    meta_title: "Samsung Electronics & Accessories | Maxora",
    meta_description: "Shop Samsung wireless chargers, earbuds, displays, and smart accessories in Bangladesh."
  },
  {
    id: "brand-philips",
    name: "Philips",
    slug: "philips",
    logo_url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&auto=format&fit=crop&q=80",
    description: "Personal grooming, health, lighting, and home appliances.",
    display_order: 6,
    active: 1,
    meta_title: "Philips Grooming & Home Appliances | Maxora",
    meta_description: "Genuine Philips trimmers, shavers, hair dryers, and kitchen appliances with warranty."
  },
  {
    id: "brand-walton",
    name: "Walton",
    slug: "walton",
    logo_url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200&auto=format&fit=crop&q=80",
    description: "Proudly manufactured electronics and home appliances for Bangladesh.",
    display_order: 7,
    active: 1,
    meta_title: "Walton Electronics in Bangladesh | Maxora",
    meta_description: "Explore Walton electronics, appliances, and accessories with nationwide service support."
  },
  {
    id: "brand-maxora",
    name: "Maxora",
    slug: "maxora",
    logo_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80",
    description: "Maxora signature series lifestyle, tech, and travel essentials.",
    display_order: 8,
    active: 1,
    meta_title: "Maxora Exclusive Signature Products | Maxora",
    meta_description: "Maxora premium brand products crafted for style, durability, and top daily performance."
  },
  {
    id: "brand-other",
    name: "Other",
    slug: "other",
    description: "Other quality manufacturers and unbranded goods.",
    display_order: 9,
    active: 1,
    meta_title: "All Other Brands | Maxora",
    meta_description: "Browse products from assorted trusted global and local brands."
  }
];
