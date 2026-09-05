import { Product, StoreSettings, Customer, Order, OrderItem, Category, SubCategory } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: "cat-smart-gadgets",
    name: "Smart Gadgets",
    slug: "smart-gadgets",
    icon: "Watch",
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&auto=format&fit=crop&q=80",
    display_order: 1,
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
    display_order: 2,
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
    category: "Smart Gadgets",
    product_type: "Variant Product",
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
    id: "prod-002",
    name: "Acoustic Pro ANC Wireless Earbuds",
    description: "Active Noise Cancellation (ANC) up to 35dB, Quad-mic ENC for crystal-clear phone calls, ultra low latency gaming mode & deep bass drivers.",
    category: "Audio",
    product_type: "Variant Product",
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
    category: "Smart Gadgets",
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
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-001",
    order_number: "MX-20260828-9843B",
    customer_id: "cust-001",
    customer_name: "Tanvir Ahmed",
    phone: "01711223344",
    alt_phone: "01811223344",
    email: "tanvir.ahmed@example.com",
    district: "Dhaka",
    area: "Dhanmondi",
    address: "House 32, Road 9/A, Dhanmondi, Dhaka",
    delivery_area: "inside_dhaka",
    delivery_charge: 70,
    subtotal: 2500,
    total: 2570,
    status: "Delivered",
    payment_method: "Cash on Delivery",
    note: "Please call before arriving",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      {
        id: "item-001",
        order_id: "ord-001",
        product_id: "prod-001",
        product_name: "Maxora Ultra AMOLED Smartwatch Series 9",
        sku: "MX-SW-09",
        quantity: 1,
        unit_price: 2500,
        buying_price: 1800,
        line_total: 2500
      }
    ]
  },
  {
    id: "ord-002",
    order_number: "MX-20260829-4512A",
    customer_id: "cust-002",
    customer_name: "Farhana Yasmin",
    phone: "01988776655",
    alt_phone: "",
    email: "farhana.y@example.com",
    district: "Chattogram",
    area: "Panchlaish",
    address: "Avenue 4, Nasirabad Housing Society, Chattogram",
    delivery_area: "outside_dhaka",
    delivery_charge: 130,
    subtotal: 1950,
    total: 2080,
    status: "Processing",
    payment_method: "Cash on Delivery",
    note: "",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: "item-002",
        order_id: "ord-002",
        product_id: "prod-002",
        product_name: "Acoustic Pro ANC Wireless Earbuds",
        sku: "MX-EB-ANC",
        quantity: 1,
        unit_price: 1700,
        buying_price: 1200,
        line_total: 1700
      }
    ]
  },
  {
    id: "ord-003",
    order_number: "MX-20260830-7790K",
    customer_id: "cust-001",
    customer_name: "Tanvir Ahmed",
    phone: "01711223344",
    alt_phone: "",
    email: "tanvir.ahmed@example.com",
    district: "Dhaka",
    area: "Dhanmondi",
    address: "House 32, Road 9/A, Dhanmondi, Dhaka",
    delivery_area: "inside_dhaka",
    delivery_charge: 70,
    subtotal: 2310,
    total: 2380,
    status: "Pending",
    payment_method: "Cash on Delivery",
    note: "Deliver after 5 PM if possible",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: "item-003",
        order_id: "ord-003",
        product_id: "prod-003",
        product_name: "Urban Explorer Anti-Theft Water-Repellent Backpack",
        sku: "MX-BP-URBAN",
        quantity: 1,
        unit_price: 1700,
        buying_price: 1100,
        line_total: 1700
      }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-001",
    name: "Tanvir Ahmed",
    phone: "01711223344",
    alt_phone: "01811223344",
    email: "tanvir.ahmed@example.com",
    district: "Dhaka",
    area: "Dhanmondi",
    address: "House 32, Road 9/A, Dhanmondi, Dhaka",
    total_orders: 2,
    total_spent: 4950,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "cust-002",
    name: "Farhana Yasmin",
    phone: "01988776655",
    alt_phone: "",
    email: "farhana.y@example.com",
    district: "Chattogram",
    area: "Panchlaish",
    address: "Avenue 4, Nasirabad Housing Society, Chattogram",
    total_orders: 1,
    total_spent: 2080,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];
