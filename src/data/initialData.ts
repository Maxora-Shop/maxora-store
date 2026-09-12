import userProductsJson from "./userProducts.json";
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
  store_name: "Maxora Shop BD",
  store_tagline: "Premium Products. Trusted Service.",
  delivery_inside_dhaka: 70,
  delivery_sub_dhaka: 100,
  delivery_outside_dhaka: 130,
  currency: "৳",
  phone: "01635451746",
  whatsapp: "+8801635451746",
  facebook: "https://facebook.com/maxora.store",
  instagram: "https://instagram.com/maxora.store",
  youtube: "https://youtube.com/@maxorashop",
  tiktok: "https://tiktok.com/@maxorashop",
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

export const INITIAL_PRODUCTS: Product[] = (userProductsJson as Product[]);

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
