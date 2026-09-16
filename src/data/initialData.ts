import userProductsJson from "./userProducts.json";
import { Product, StoreSettings, Customer, Order, OrderItem, Category, SubCategory, ProductType, ChildCategory, Review, Brand, HeroBanner, AiSuggestedQuestion, AiFaqItem, AiCustomCommand } from '../types';

export const DEFAULT_AI_CUSTOM_COMMANDS: AiCustomCommand[] = [
  {
    id: "cmd-1",
    title: "নম্র ও আন্তরিক আচরণ",
    command: "কাস্টমারদের সাথে কথা বলার সময় অত্যন্ত মার্জিত, নম্র ও আন্তরিক ভাষা ব্যবহার করবে। কথা সংক্ষিপ্ত, তথ্যবহুল ও পরিষ্কার রাখবে।",
    active: true,
    order: 1,
  },
  {
    id: "cmd-2",
    title: "অর্ডার করার নিয়ম ও Buy Now নির্দেশনা",
    command: "কাস্টমার কোনো পণ্য কিনতে চাইলে তাকে ওয়েবসাইটে পণ্যটির পেজে গিয়ে 'Buy Now' অথবা 'অর্ডার করুন' বাটনে ক্লিক করে নাম, মোবাইল নম্বর ও ঠিকানা দিয়ে অর্ডার সম্পন্ন করতে বলবে।",
    active: true,
    order: 2,
  },
  {
    id: "cmd-3",
    title: "ক্যাশ অন ডেলিভারি নিশ্চয়তা",
    command: "কাস্টমার পেমেন্ট নিয়ে জানতে চাইলে আশ্বস্ত করবে যে সারা বাংলাদেশে ১০০% ক্যাশ অন ডেলিভারি রয়েছে, ডেলিভারিম্যানের কাছ থেকে পণ্য দেখে মূল্য পরিশোধ করা যাবে।",
    active: true,
    order: 3,
  },
  {
    id: "cmd-4",
    title: "দাম ও ডিসকাউন্ট পলিসি",
    command: "ওয়েবসাইটে প্রদর্শিত মূল্যের চেয়ে কম বা অতিরিক্ত ডিসকাউন্ট অফার করবে না। যদি কাস্টমার ডিসকাউন্ট চায়, তাকে বলবে ওয়েবসাইটে দেওয়া স্পেশাল অফার মূল্যই আমাদের সেরা দাম।",
    active: true,
    order: 4,
  },
  {
    id: "cmd-5",
    title: "WhatsApp এস্কেলেশন",
    command: "পাইকারি বা হোলসেল কেনাকাটা, বড় অভিযোগ, অথবা কোনো পণ্যের সুনির্দিষ্ট তথ্য জানা না থাকলে কাস্টমারকে আমাদের অফিসিয়াল WhatsApp নম্বরে কথা বলার পরামর্শ দিবে।",
    active: true,
    order: 5,
  },
];

export const DEFAULT_AI_SUGGESTED_QUESTIONS: AiSuggestedQuestion[] = [
  { id: "sq-1", question: "এই পণ্যের দাম কত?", active: true, order: 1 },
  { id: "sq-2", question: "ঢাকায় delivery charge কত?", active: true, order: 2 },
  { id: "sq-3", question: "Cash on Delivery আছে?", active: true, order: 3 },
  { id: "sq-4", question: "কীভাবে অর্ডার করব?", active: true, order: 4 },
  { id: "sq-5", question: "আমার জন্য একটা ভালো গ্যাজেট সাজেস্ট করুন", active: true, order: 5 },
  { id: "sq-6", question: "ডেলিভারি হতে কত দিন সময় লাগে?", active: true, order: 6 },
];

export const DEFAULT_AI_FAQS: AiFaqItem[] = [
  {
    id: "faq-1",
    question: "কীভাবে অর্ডার করব?",
    answer: "আপনার পছন্দের পণ্য নির্বাচন করে 'Add to Cart' অথবা সরাসরি 'Buy Now' বাটনে ক্লিক করুন। এরপর আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা প্রদান করে 'Confirm Order'-এ ক্লিক করলেই অর্ডার সফলভাবে প্লেস হবে।",
    category: "অর্ডার",
    active: true,
    order: 1,
  },
  {
    id: "faq-2",
    question: "Cash on Delivery (ক্যাশ অন ডেলিভারি) সুবিধা আছে কি?",
    answer: "হ্যাঁ, Maxora-তে সমগ্র বাংলাদেশের ৬৪টি জেলাতেই ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ) সুবিধা রয়েছে।",
    category: "পেমেন্ট",
    active: true,
    order: 2,
  },
  {
    id: "faq-3",
    question: "ডেলিভারি চার্জ কত এবং ডেলিভারি হতে কত দিন সময় লাগে?",
    answer: "আমাদের ডেলিভারি চার্জ: ঢাকা সিটির ভেতরে ৭০ টাকা (২-৩ কার্যদিবস), ঢাকা সাব-এরিয়া ১০০ টাকা এবং ঢাকার বাইরে সমগ্র বাংলাদেশে ১৩০ টাকা (৩-৫ কার্যদিবস)।",
    category: "ডেলিভারি",
    active: true,
    order: 3,
  },
  {
    id: "faq-4",
    question: "পণ্য পছন্দ না হলে বা কোনো সমস্যা থাকলে কি রিপ্লেসমেন্ট পাওয়া যাবে?",
    answer: "হ্যাঁ, পণ্য গ্রহণের পর কোনো ডিফেক্ট বা অমিল পেলে ৭ দিনের মধ্যে আমাদের সাথে যোগাযোগ করলে সহজ রিপ্লেসমেন্ট সুবিধা পাবেন।",
    category: "ওয়ারেন্টি ও রিটার্ন",
    active: true,
    order: 4,
  },
  {
    id: "faq-5",
    question: "অর্ডার করার সময় কি অগ্রিম কোনো টাকা পরিশোধ করতে হবে?",
    answer: "না, সাধারণ অর্ডারে কোনো অগ্রিম টাকার প্রয়োজন নেই। আপনি পণ্য হাতে পাওয়ার পর চেক করে মূল্য পরিশোধ করতে পারবেন।",
    category: "পেমেন্ট",
    active: true,
    order: 5,
  },
];

export const DEFAULT_HERO_BANNERS: HeroBanner[] = [
  {
    id: "banner-1",
    pill: "Your Trusted Online Shopping Partner",
    titlePrimary: "Shop Smart,",
    titleAccent: "Live Better",
    subtitle: "Discover top-tier electronics, modern kitchen essentials, and daily lifestyle gear with 100% Cash on Delivery across Bangladesh.",
    cta: "Shop Now",
    ctaLink: "#products-catalog-section",
    badgeNote: "Better Products ~ Better Life",
    image1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    image2: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80",
    image3: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
    image4: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80",
    bgGradient: "from-[#e0f2fe] via-[#e8f4fc] to-[#f0f7fd]",
    active: true,
    display_order: 1,
  },
  {
    id: "banner-2",
    pill: "Flash Deals & Discounts",
    titlePrimary: "Premium Quality,",
    titleAccent: "Best Prices",
    subtitle: "Save big on verified gadgets, headphones, smart watches, and home appliances with 7-day replacement warranty.",
    cta: "Explore Offers",
    ctaLink: "#products-catalog-section",
    badgeNote: "Verified Tech ~ Fast Delivery",
    image1: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80",
    image2: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80",
    image3: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=80",
    image4: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop&q=80",
    bgGradient: "from-[#fef3c7] via-[#fffbeb] to-[#fef9c3]",
    active: true,
    display_order: 2,
  },
  {
    id: "banner-3",
    pill: "100% Cash On Delivery",
    titlePrimary: "Smart Living,",
    titleAccent: "Everyday Gear",
    subtitle: "Upgrade your lifestyle with original quality electronics and gadgets delivered fast right to your doorstep.",
    cta: "Order Now",
    ctaLink: "#products-catalog-section",
    badgeNote: "Satisfaction Guaranteed",
    image1: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80",
    image2: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    image3: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
    image4: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80",
    bgGradient: "from-[#dcfce7] via-[#f0fdf4] to-[#ecfdf5]",
    active: true,
    display_order: 3,
  }
];

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
  hero_banners: DEFAULT_HERO_BANNERS,
  banner_slide_speed: 4500,
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
  ai_assistant_enabled: true,
  ai_welcome_message: "হ্যালো! 👋 আমি Maxora AI Assistant। পণ্যের দাম, স্পেসিফিকেশন, স্টক, ডেলিভারি বা আপনার প্রয়োজন অনুযায়ী পণ্য খুঁজে দিতে আমি সাহায্য করতে পারি। কীভাবে আপনাকে সাহায্য করতে পারি?",
  ai_whatsapp_number: "+8801635451746",
  ai_suggested_questions: DEFAULT_AI_SUGGESTED_QUESTIONS,
  ai_faqs: DEFAULT_AI_FAQS,
  ai_custom_commands: DEFAULT_AI_CUSTOM_COMMANDS,
  ai_system_instructions: "কাস্টমারদের সাথে সর্বদা সর্বোচ্চ বিনম্র ও প্রফেশনাল আচরণ করুন। Maxora-এর সব পণ্য ১০০% আসল ও কোয়ালিটি নিশ্চিত।",
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
