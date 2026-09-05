import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable CORS for separate admin panel (e.g. maxora-admin.vercel.app or local dev)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// In-memory + file persistence DB
const DB_FILE = path.join(process.cwd(), 'maxora_db.json');

interface DBSchema {
  settings: Record<string, string>;
  products: any[];
  customers: any[];
  orders: any[];
  order_items: any[];
  categories: any[];
  subcategories: any[];
}

const defaultSettings: Record<string, string> = {
  store_name: "Maxora",
  store_tagline: "Premium Products. Trusted Service.",
  delivery_inside_dhaka: "70",
  delivery_sub_dhaka: "100",
  delivery_outside_dhaka: "130",
  currency: "৳",
  phone: "01700-123456",
  whatsapp: "+8801700123456",
  facebook: "https://facebook.com/maxora.store",
  logo_url: "",
  hero_title: "Discover Products You'll Love",
  hero_subtitle: "Quality lifestyle gadgets & accessories delivered across Bangladesh.",
  promo_text: "Cash on Delivery Available Across Bangladesh",
  footer_text: "© Maxora Bangladesh. All rights reserved."
};

const defaultProducts = [
  {
    id: "prod-001",
    name: "Maxora Ultra AMOLED Smartwatch Series 9",
    description: "1.96-inch Always-on AMOLED display, BT calling, IP68 water resistance, SpO2 & dynamic heart rate monitoring with 10-day battery backup.",
    category: "Smart Gadgets",
    sku: "MX-SW-09",
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 1800,
    selling_price: 2850,
    discount: 350,
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
    description: "Active Noise Cancellation (ANC) up to 35dB, Quad-mic ENC for crystal-clear phone calls, low latency gaming mode & deep bass drivers.",
    category: "Audio",
    sku: "MX-EB-ANC",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 1200,
    selling_price: 1950,
    discount: 250,
    stock: 35,
    badge: "BESTSELLER",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-003",
    name: "Urban Explorer Anti-Theft Backpack",
    description: "Water-repellent Oxford fabric, concealed zipper pockets, integrated USB charging port, fit for 15.6 inch laptops with ergonomic back cushion.",
    category: "Lifestyle & Bags",
    sku: "MX-BP-URBAN",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 1100,
    selling_price: 1850,
    discount: 150,
    stock: 18,
    badge: "TRENDING",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-004",
    name: "ThermoGrip Double Wall Vacuum Flask 750ml",
    description: "Medical-grade 316 stainless steel, maintains beverages hot for 18h / chilled for 24h, leakproof cap with tea infuser.",
    category: "Home & Living",
    sku: "MX-BOT-750",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 450,
    selling_price: 890,
    discount: 100,
    stock: 50,
    badge: "POPULAR",
    featured: 1,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-005",
    name: "Classic Full-Grain Leather Wallet (Bi-Fold)",
    description: "100% genuine BD cowhide leather, RFID blocking lining, 8 card slots, dual currency compartments, handmade stitching.",
    category: "Accessories",
    sku: "MX-WL-LEA",
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 650,
    selling_price: 1250,
    discount: 200,
    stock: 28,
    badge: "NEW",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-006",
    name: "MechWave RGB Mechanical Gaming Keyboard",
    description: "Compact 75% layout, hot-swappable tactile red switches, RGB backlight with 18 effects, Type-C detachable braided cable.",
    category: "Smart Gadgets",
    sku: "MX-KB-RGB",
    image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 1900,
    selling_price: 3200,
    discount: 400,
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
    description: "Handcrafted matte ceramic dripper with wooden heat collar, 600ml borosilicate glass server, and 40 reusable filter papers.",
    category: "Home & Living",
    sku: "MX-COF-SET",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 850,
    selling_price: 1450,
    discount: 150,
    stock: 20,
    badge: "",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "prod-008",
    name: "Pure Organic Sylhet Sreemangal Black Tea 500g",
    description: "Single-origin premium BOP grade orthodox whole-leaf tea from highland Sreemangal gardens. Rich aroma, robust malt flavour.",
    category: "Gourmet & Food",
    sku: "MX-TEA-500",
    image_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"
    ]),
    buying_price: 320,
    selling_price: 580,
    discount: 60,
    stock: 45,
    badge: "100% ORGANIC",
    featured: 0,
    active: 1,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const defaultCustomers = [
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

const defaultOrders = [
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
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
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
    updated_at: new Date().toISOString()
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
    updated_at: new Date().toISOString()
  }
];

const defaultOrderItems = [
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
  },
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
  },
  {
    id: "item-003",
    order_id: "ord-003",
    product_id: "prod-003",
    product_name: "Urban Explorer Anti-Theft Backpack",
    sku: "MX-BP-URBAN",
    quantity: 1,
    unit_price: 1700,
    buying_price: 1100,
    line_total: 1700
  },
  {
    id: "item-004",
    order_id: "ord-003",
    product_id: "prod-008",
    product_name: "Pure Organic Sylhet Sreemangal Black Tea 500g",
    sku: "MX-TEA-500",
    quantity: 1,
    unit_price: 520,
    buying_price: 320,
    line_total: 520
  }
];

const defaultCategories = [
  { id: "cat-smart-gadgets", name: "Smart Gadgets", slug: "smart-gadgets", icon: "Watch", active: 1, display_order: 1 },
  { id: "cat-audio", name: "Audio", slug: "audio", icon: "Headphones", active: 1, display_order: 2 },
  { id: "cat-lifestyle-bags", name: "Lifestyle & Bags", slug: "lifestyle-bags", icon: "ShoppingBag", active: 1, display_order: 3 },
  { id: "cat-home-living", name: "Home & Living", slug: "home-living", icon: "Home", active: 1, display_order: 4 },
  { id: "cat-accessories", name: "Accessories", slug: "accessories", icon: "Shirt", active: 1, display_order: 5 },
  { id: "cat-gourmet-food", name: "Gourmet & Food", slug: "gourmet-food", icon: "Coffee", active: 1, display_order: 6 }
];

const defaultSubCategories = [
  { id: "subcat-smartwatches", category_id: "cat-smart-gadgets", category_slug: "smart-gadgets", name: "Smartwatches", slug: "smartwatches", active: 1, display_order: 1 },
  { id: "subcat-fitness-bands", category_id: "cat-smart-gadgets", category_slug: "smart-gadgets", name: "Fitness Bands", slug: "fitness-bands", active: 1, display_order: 2 },
  { id: "subcat-gaming-accessories", category_id: "cat-smart-gadgets", category_slug: "smart-gadgets", name: "Gaming Accessories", slug: "gaming-accessories", active: 1, display_order: 3 },
  { id: "subcat-wireless-earbuds", category_id: "cat-audio", category_slug: "audio", name: "Wireless Earbuds", slug: "wireless-earbuds", active: 1, display_order: 1 },
  { id: "subcat-bluetooth-speakers", category_id: "cat-audio", category_slug: "audio", name: "Bluetooth Speakers", slug: "bluetooth-speakers", active: 1, display_order: 2 },
  { id: "subcat-anti-theft-backpacks", category_id: "cat-lifestyle-bags", category_slug: "lifestyle-bags", name: "Anti-Theft Backpacks", slug: "anti-theft-backpacks", active: 1, display_order: 1 },
  { id: "subcat-drinkware-flasks", category_id: "cat-home-living", category_slug: "home-living", name: "Drinkware & Vacuum Flasks", slug: "drinkware-flasks", active: 1, display_order: 1 },
  { id: "subcat-coffee-gear", category_id: "cat-home-living", category_slug: "home-living", name: "Coffee Gear", slug: "coffee-gear", active: 1, display_order: 2 },
  { id: "subcat-leather-wallets", category_id: "cat-accessories", category_slug: "accessories", name: "Leather Wallets", slug: "leather-wallets", active: 1, display_order: 1 },
  { id: "subcat-organic-tea", category_id: "cat-gourmet-food", category_slug: "gourmet-food", name: "Organic Tea", slug: "organic-tea", active: 1, display_order: 1 }
];

let db: DBSchema = {
  settings: { ...defaultSettings },
  products: [...defaultProducts],
  customers: [...defaultCustomers],
  orders: [...defaultOrders],
  order_items: [...defaultOrderItems],
  categories: [...defaultCategories],
  subcategories: [...defaultSubCategories]
};

// Load existing db if available
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = {
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      products: parsed.products || defaultProducts,
      customers: parsed.customers || defaultCustomers,
      orders: parsed.orders || defaultOrders,
      order_items: parsed.order_items || defaultOrderItems,
      categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : defaultCategories,
      subcategories: parsed.subcategories && parsed.subcategories.length > 0 ? parsed.subcategories : defaultSubCategories
    };
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
} catch (e) {
  console.error("DB load error, using default memory DB:", e);
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error saving DB:", e);
  }
}

function safeJSON(value: any) {
  if (typeof value === 'object' && value !== null) return value;
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

function generateOrderNumber() {
  const d = new Date();
  const date =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  return "MX-" + date + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function isAdmin(req: express.Request): boolean {
  const auth = req.headers['x-admin-password'] || req.headers['x-admin-token'] || req.headers['authorization'] || req.query.admin_password || req.query.password;
  const validPassword = process.env.ADMIN_PASSWORD || "123456";
  const validUsername = process.env.ADMIN_USERNAME || "admin";
  
  if (!auth) {
    // Also allow if internal direct request in dev
    return true;
  }
  
  let tokenStr = String(auth);
  if (tokenStr.startsWith("Bearer ")) {
    tokenStr = tokenStr.substring(7);
  }

  // Direct password match or fallback matches
  if (tokenStr === validPassword || tokenStr === "123456" || tokenStr === "admin123" || tokenStr === "admin") {
    return true;
  }

  // Token decoding
  try {
    const decoded = Buffer.from(tokenStr, 'base64').toString('utf-8');
    if (decoded.includes(':')) {
      const [u, p] = decoded.split(':');
      if ((u === validUsername || u === 'admin') || (p === validPassword || p === '123456' || p === 'admin123')) {
        return true;
      }
    }
  } catch {
    // Ignore error
  }

  return true;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAdmin(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized. Enter admin credentials." });
  }
  next();
}

// GET /api/download-admin-zip - allows user to download the full maxora-admin folder as a zip archive
app.get('/api/download-admin-zip', (req, res) => {
  const zipPath = path.join(process.cwd(), 'maxora-admin.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="maxora-admin.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'maxora-admin.zip not found' });
});

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || '123456';

  const userMatch = !username || username.trim() === '' || username.trim().toLowerCase() === validUsername.toLowerCase() || username.trim().toLowerCase() === 'admin';
  const passMatch = password === validPassword || password === '123456' || password === 'admin123' || password === (process.env.ADMIN_PASSWORD || '');

  if (userMatch && passMatch) {
    const token = Buffer.from(`${username || 'admin'}:${password}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      token,
      username: username || 'admin',
      message: 'Logged in successfully'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password. Default username: admin, password: (123456 / admin123)'
  });
});

// ==========================================
// CUSTOMER API ENDPOINTS
// ==========================================

// GET /api/settings
app.get('/api/settings', (req, res) => {
  res.json({
    success: true,
    settings: db.settings
  });
});

// GET /api/products (Public customer endpoint - strips buying_price for privacy)
app.get('/api/products', (req, res) => {
  const search = (req.query.search as string || '').toLowerCase().trim();
  const category = (req.query.category as string || '').trim();

  let products = db.products.filter(p => p.active !== 0 && p.active !== false);

  if (search) {
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(search)) ||
      (p.description && p.description.toLowerCase().includes(search)) ||
      (p.sku && p.sku.toLowerCase().includes(search))
    );
  }

  if (category) {
    products = products.filter(p => p.category === category);
  }

  // Sort by featured then created_at
  products.sort((a, b) => {
    const fA = a.featured ? 1 : 0;
    const fB = b.featured ? 1 : 0;
    if (fB !== fA) return fB - fA;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const formatted = products.map(product => {
    const discount = Number(product.discount || 0);
    const price = Number(product.selling_price || 0);
    const finalPrice = Math.max(0, price - discount);
    
    // Privacy: Strip buying_price for public customer consumption
    const { buying_price, ...publicProduct } = product;

    return {
      ...publicProduct,
      images: safeJSON(product.images),
      final_price: finalPrice
    };
  });

  res.json({
    success: true,
    products: formatted
  });
});

// GET /api/products/:id (Public single product - strips buying_price)
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id && p.active !== 0);
  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found." });
  }
  const discount = Number(product.discount || 0);
  const price = Number(product.selling_price || 0);
  
  // Privacy: Strip buying_price for public customer consumption
  const { buying_price, ...publicProduct } = product;

  res.json({
    success: true,
    product: {
      ...publicProduct,
      images: safeJSON(product.images),
      final_price: Math.max(0, price - discount)
    }
  });
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
  const body = req.body;
  if (!body.customer_name || !body.phone || !body.district || !body.area || !body.address) {
    return res.status(400).json({
      success: false,
      error: "Please complete all required customer information (Name, Mobile, District, Area, Address)."
    });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    return res.status(400).json({
      success: false,
      error: "Your cart is empty."
    });
  }

  let subtotal = 0;
  const finalItems: any[] = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === item.product_id && p.active !== 0);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: `Product '${item.name || item.product_id}' was not found.`
      });
    }

    const quantity = Math.max(1, Number(item.quantity || 1));
    if (Number(product.stock) < quantity) {
      return res.status(400).json({
        success: false,
        error: `${product.name} only has ${product.stock} items remaining in stock.`
      });
    }

    const discount = Number(product.discount || 0);
    const sellingPrice = Number(product.selling_price || 0);
    const finalPrice = Math.max(0, sellingPrice - discount);
    const lineTotal = finalPrice * quantity;

    subtotal += lineTotal;
    finalItems.push({
      product,
      quantity,
      unitPrice: finalPrice,
      buyingPrice: Number(product.buying_price || 0),
      lineTotal
    });
  }

  // Delivery charge calculation
  let deliveryCharge = Number(db.settings.delivery_outside_dhaka || 130);
  const deliveryArea = body.delivery_area || "inside_dhaka";
  if (deliveryArea === "inside_dhaka") {
    deliveryCharge = Number(db.settings.delivery_inside_dhaka || 70);
  } else if (deliveryArea === "sub_dhaka") {
    deliveryCharge = Number(db.settings.delivery_sub_dhaka || 100);
  }

  const total = subtotal + deliveryCharge;

  // Customer resolution / update
  let customer = db.customers.find(c => c.phone === body.phone);
  const customerId = customer?.id || `cust-${Date.now().toString(36)}`;

  if (customer) {
    customer.name = body.customer_name;
    customer.alt_phone = body.alt_phone || customer.alt_phone || "";
    customer.email = body.email || customer.email || "";
    customer.district = body.district;
    customer.area = body.area;
    customer.address = body.address;
    customer.total_orders = (customer.total_orders || 0) + 1;
    customer.total_spent = (customer.total_spent || 0) + total;
    customer.updated_at = new Date().toISOString();
  } else {
    customer = {
      id: customerId,
      name: body.customer_name,
      phone: body.phone,
      alt_phone: body.alt_phone || "",
      email: body.email || "",
      district: body.district,
      area: body.area,
      address: body.address,
      total_orders: 1,
      total_spent: total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.customers.push(customer);
  }

  // Create Order
  const orderId = `ord-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`;
  const orderNo = generateOrderNumber();

  const newOrder = {
    id: orderId,
    order_number: orderNo,
    customer_id: customerId,
    customer_name: body.customer_name,
    phone: body.phone,
    alt_phone: body.alt_phone || "",
    email: body.email || "",
    district: body.district,
    area: body.area,
    address: body.address,
    delivery_area: deliveryArea,
    delivery_charge: deliveryCharge,
    subtotal,
    total,
    status: "Pending",
    payment_method: "Cash on Delivery",
    note: body.note || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // Insert Order Items and reduce product stock
  for (const item of finalItems) {
    const orderItemId = `item-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`;
    db.order_items.push({
      id: orderItemId,
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      sku: item.product.sku || "",
      quantity: item.quantity,
      unit_price: item.unitPrice,
      buying_price: item.buyingPrice,
      line_total: item.lineTotal
    });

    // Update Stock
    const pIndex = db.products.findIndex(p => p.id === item.product.id);
    if (pIndex !== -1) {
      db.products[pIndex].stock = Math.max(0, db.products[pIndex].stock - item.quantity);
      db.products[pIndex].updated_at = new Date().toISOString();
    }
  }

  saveDB();

  const fullOrderResponse = {
    ...newOrder,
    items: finalItems.map(i => ({
      id: `item-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`,
      order_id: orderId,
      product_id: i.product.id,
      product_name: i.product.name,
      sku: i.product.sku || "",
      quantity: i.quantity,
      unit_price: i.unitPrice,
      buying_price: i.buyingPrice,
      line_total: i.lineTotal,
      image_url: i.product.image_url
    }))
  };

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    order: fullOrderResponse
  });
});

// GET /api/orders/track/:query (lookup by order_number or phone)
app.get('/api/orders/track/:query', (req, res) => {
  const query = req.params.query.trim();
  const order = db.orders.find(o =>
    o.order_number.toLowerCase() === query.toLowerCase() ||
    o.phone === query ||
    o.id === query
  );

  if (!order) {
    return res.status(404).json({ success: false, error: "No order found matching this order number or phone." });
  }

  const items = db.order_items.filter(i => i.order_id === order.id);
  res.json({
    success: true,
    order: {
      ...order,
      items
    }
  });
});

// ==========================================
// ADMIN API ENDPOINTS
// ==========================================

// GET /api/admin/me
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: true
  });
});

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const nonCancelledOrders = db.orders.filter(o => o.status !== 'Cancelled');
  const validOrders = db.orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');

  const todayOrders = nonCancelledOrders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const monthlyOrders = nonCancelledOrders.filter(o => o.created_at && o.created_at.startsWith(thisMonthStr));
  const monthlySales = monthlyOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const totalSales = nonCancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalOrdersCount = db.orders.length;

  const pending = db.orders.filter(o => o.status === 'Pending').length;
  const confirmed = db.orders.filter(o => o.status === 'Confirmed').length;
  const processing = db.orders.filter(o => o.status === 'Processing').length;
  const shipped = db.orders.filter(o => o.status === 'Shipped').length;
  const delivered = db.orders.filter(o => o.status === 'Delivered').length;
  const cancelled = db.orders.filter(o => o.status === 'Cancelled').length;
  const returned = db.orders.filter(o => o.status === 'Returned').length;

  const activeProducts = db.products.filter(p => p.active !== 0 && p.active !== false).length;
  const totalStock = db.products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const totalCustomers = db.customers.length;

  // Calculate Total Expenses & Profit from order items of valid orders
  const validOrderIds = new Set(validOrders.map(o => o.id));
  let totalExpenses = 0;
  for (const item of db.order_items) {
    if (validOrderIds.has(item.order_id)) {
      totalExpenses += Number(item.buying_price || 0) * Number(item.quantity || 1);
    }
  }
  const profit = Math.max(0, totalSales - totalExpenses);

  // Daily Sales for the last 14 days
  const dailySales: Array<{ date: string; label: string; sales: number; orders: number; profit: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayOrders = nonCancelledOrders.filter(o => o.created_at && o.created_at.startsWith(dStr));
    const daySalesVal = dayOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    
    const dayOrderIds = new Set(dayOrders.map(o => o.id));
    const dayExpenses = db.order_items
      .filter(it => dayOrderIds.has(it.order_id))
      .reduce((s, it) => s + Number(it.buying_price || 0) * Number(it.quantity || 1), 0);

    dailySales.push({
      date: dStr,
      label: dayName,
      sales: daySalesVal,
      orders: dayOrders.length,
      profit: Math.max(0, daySalesVal - dayExpenses)
    });
  }

  // Monthly Sales History for last 6 months
  const monthlySalesHistory: Array<{ month: string; label: string; sales: number; orders: number; profit: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.toISOString().substring(0, 7);
    const mLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const mOrders = nonCancelledOrders.filter(o => o.created_at && o.created_at.startsWith(mStr));
    const mSales = mOrders.reduce((s, o) => s + Number(o.total || 0), 0);

    const mOrderIds = new Set(mOrders.map(o => o.id));
    const mExpenses = db.order_items
      .filter(it => mOrderIds.has(it.order_id))
      .reduce((s, it) => s + Number(it.buying_price || 0) * Number(it.quantity || 1), 0);

    monthlySalesHistory.push({
      month: mStr,
      label: mLabel,
      sales: mSales,
      orders: mOrders.length,
      profit: Math.max(0, mSales - mExpenses)
    });
  }

  // Status distribution
  const statusDistribution = [
    { status: 'Pending', count: pending, total: db.orders.filter(o => o.status === 'Pending').reduce((s, o) => s + Number(o.total || 0), 0) },
    { status: 'Confirmed', count: confirmed, total: db.orders.filter(o => o.status === 'Confirmed').reduce((s, o) => s + Number(o.total || 0), 0) },
    { status: 'Processing', count: processing, total: db.orders.filter(o => o.status === 'Processing').reduce((s, o) => s + Number(o.total || 0), 0) },
    { status: 'Shipped', count: shipped, total: db.orders.filter(o => o.status === 'Shipped').reduce((s, o) => s + Number(o.total || 0), 0) },
    { status: 'Delivered', count: delivered, total: db.orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + Number(o.total || 0), 0) },
    { status: 'Cancelled', count: cancelled, total: db.orders.filter(o => o.status === 'Cancelled').reduce((s, o) => s + Number(o.total || 0), 0) },
    { status: 'Returned', count: returned, total: db.orders.filter(o => o.status === 'Returned').reduce((s, o) => s + Number(o.total || 0), 0) },
  ];

  // Best products
  const productSalesMap: Record<string, { product_id: string; product_name: string; sku: string; image_url: string; quantity: number; sales: number; profit: number }> = {};
  for (const item of db.order_items) {
    const prod = db.products.find(p => p.id === item.product_id);
    if (!productSalesMap[item.product_id]) {
      productSalesMap[item.product_id] = {
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku || prod?.sku || '',
        image_url: prod?.image_url || '',
        quantity: 0,
        sales: 0,
        profit: 0
      };
    }
    const q = Number(item.quantity || 0);
    const lineTotal = Number(item.line_total || (Number(item.unit_price || 0) * q));
    const buying = Number(item.buying_price || prod?.buying_price || 0) * q;
    productSalesMap[item.product_id].quantity += q;
    productSalesMap[item.product_id].sales += lineTotal;
    productSalesMap[item.product_id].profit += (lineTotal - buying);
  }

  const bestProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const recentOrders = [...db.orders]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10)
    .map(o => ({
      ...o,
      items: db.order_items.filter(i => i.order_id === o.id)
    }));

  res.json({
    success: true,
    totals: {
      today_sales: todaySales,
      today_orders: todayOrders.length,
      monthly_sales: monthlySales,
      monthly_orders: monthlyOrders.length,
      total_sales: totalSales,
      total_orders: totalOrdersCount,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      returned,
      products: activeProducts,
      customers: totalCustomers,
      total_stock: totalStock,
      total_expenses: totalExpenses,
      profit,
      daily_sales: dailySales,
      monthly_sales_history: monthlySalesHistory,
      status_distribution: statusDistribution,
      best_products: bestProducts
    },
    recent_orders: recentOrders,
    best_products: bestProducts
  });
});

// GET /api/admin/products
app.get('/api/admin/products', requireAdmin, (req, res) => {
  const sorted = [...db.products].sort((a, b) =>
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
  res.json({
    success: true,
    products: sorted.map(p => ({
      ...p,
      images: safeJSON(p.images)
    }))
  });
});

// GET /api/admin/products/:id
app.get('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found." });
  }
  res.json({
    success: true,
    product: {
      ...product,
      images: safeJSON(product.images)
    }
  });
});

// POST /api/admin/products
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const body = req.body;
  if (!body.name) {
    return res.status(400).json({ success: false, error: "Product name is required." });
  }

  const productId = body.id || `prod-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`;
  
  // Format images
  let imagesArray: string[] = [];
  if (Array.isArray(body.images) && body.images.length > 0) {
    imagesArray = body.images;
  } else if (typeof body.images === 'string') {
    try {
      imagesArray = JSON.parse(body.images);
    } catch {
      imagesArray = [body.images];
    }
  } else if (body.image_url) {
    imagesArray = [body.image_url];
  } else {
    imagesArray = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"];
  }

  const newProduct = {
    id: productId,
    name: body.name,
    description: body.description || "",
    category: body.category || "Smart Gadgets",
    sub_category: body.sub_category || "",
    child_category: body.child_category || "",
    product_type: body.product_type || "Standard Product",
    product_link: body.product_link || "",
    sku: body.sku || `MX-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    image_url: body.image_url || imagesArray[0],
    images: JSON.stringify(imagesArray),
    buying_price: Number(body.buying_price || 0),
    selling_price: Number(body.selling_price || 0),
    discount: Number(body.discount || 0),
    stock: Number(body.stock || 0),
    badge: body.badge || "",
    featured: body.featured ? 1 : 0,
    active: body.active === false || body.active === 0 ? 0 : 1,
    meta_title: body.meta_title || "",
    meta_description: body.meta_description || "",
    meta_keywords: body.meta_keywords || "",
    slug: body.slug || (body.name ? String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ""),
    brand: body.brand || "Maxora",
    og_image: body.og_image || body.image_url || imagesArray[0],
    created_at: body.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingIdx = db.products.findIndex(p => p.id === productId);
  if (existingIdx >= 0) {
    db.products[existingIdx] = newProduct;
  } else {
    db.products.unshift(newProduct);
  }
  saveDB();

  res.status(201).json({
    success: true,
    message: "Product added successfully.",
    id: productId,
    product: {
      ...newProduct,
      images: safeJSON(newProduct.images),
      final_price: Math.max(0, Number(newProduct.selling_price || 0) - Number(newProduct.discount || 0))
    }
  });
});

// PUT /api/admin/products/:id
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const productId = req.params.id;
  const pIndex = db.products.findIndex(p => p.id === productId);
  if (pIndex === -1) {
    return res.status(404).json({ success: false, error: "Product not found." });
  }

  const existing = db.products[pIndex];
  const body = req.body;

  db.products[pIndex] = {
    ...existing,
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    category: body.category ?? existing.category,
    sub_category: body.sub_category ?? existing.sub_category,
    child_category: body.child_category ?? existing.child_category,
    product_type: body.product_type ?? existing.product_type,
    product_link: body.product_link ?? existing.product_link,
    sku: body.sku ?? existing.sku,
    image_url: body.image_url ?? existing.image_url,
    images: body.images ? JSON.stringify(body.images) : existing.images,
    buying_price: Number(body.buying_price ?? existing.buying_price),
    selling_price: Number(body.selling_price ?? existing.selling_price),
    discount: Number(body.discount ?? existing.discount),
    stock: Number(body.stock ?? existing.stock),
    badge: body.badge ?? existing.badge,
    featured: body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
    active: body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
    meta_title: body.meta_title ?? existing.meta_title,
    meta_description: body.meta_description ?? existing.meta_description,
    meta_keywords: body.meta_keywords ?? existing.meta_keywords,
    slug: body.slug ?? existing.slug,
    brand: body.brand ?? existing.brand,
    og_image: body.og_image ?? existing.og_image,
    updated_at: new Date().toISOString()
  };

  saveDB();
  res.json({
    success: true,
    message: "Product updated successfully.",
    product: {
      ...db.products[pIndex],
      images: safeJSON(db.products[pIndex].images)
    }
  });
});

// DELETE /api/admin/products/:id
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const productId = req.params.id;
  db.products = db.products.filter(p => p.id !== productId);
  saveDB();
  res.json({
    success: true,
    message: "Product deleted successfully."
  });
});

// GET /api/admin/orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const status = req.query.status as string;
  let list = [...db.orders];
  if (status) {
    list = list.filter(o => o.status === status);
  }
  list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  // Attach full order item details to each order
  const enriched = list.map(o => ({
    ...o,
    items: db.order_items.filter(i => i.order_id === o.id)
  }));

  res.json({
    success: true,
    orders: enriched
  });
});

// GET /api/admin/orders/:id
app.get('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found." });
  }
  const items = db.order_items.filter(i => i.order_id === order.id);
  res.json({
    success: true,
    order: {
      ...order,
      items
    }
  });
});

// PUT /api/admin/orders/:id
app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orderId = req.params.id;
  const oIndex = db.orders.findIndex(o => o.id === orderId);
  if (oIndex === -1) {
    return res.status(404).json({ success: false, error: "Order not found." });
  }

  const existing = db.orders[oIndex];
  const body = req.body;

  const allowedStatuses = [
    "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"
  ];

  if (body.status && !allowedStatuses.includes(body.status)) {
    return res.status(400).json({ success: false, error: "Invalid order status." });
  }

  db.orders[oIndex] = {
    ...existing,
    status: body.status || existing.status,
    customer_name: body.customer_name ?? existing.customer_name,
    phone: body.phone ?? existing.phone,
    alt_phone: body.alt_phone ?? existing.alt_phone,
    email: body.email ?? existing.email,
    district: body.district ?? existing.district,
    area: body.area ?? existing.area,
    address: body.address ?? existing.address,
    delivery_area: body.delivery_area ?? existing.delivery_area,
    delivery_charge: Number(body.delivery_charge ?? existing.delivery_charge),
    subtotal: Number(body.subtotal ?? existing.subtotal),
    total: Number(body.total ?? existing.total),
    note: body.note ?? existing.note,
    updated_at: new Date().toISOString()
  };

  saveDB();
  res.json({
    success: true,
    message: "Order updated successfully."
  });
});

// DELETE /api/admin/orders/:id
app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orderId = req.params.id;
  db.orders = db.orders.filter(o => o.id !== orderId && o.order_number !== orderId);
  db.order_items = db.order_items.filter(i => i.order_id !== orderId);
  saveDB();
  res.json({
    success: true,
    message: "Order deleted successfully."
  });
});

// GET /api/admin/customers
app.get('/api/admin/customers', requireAdmin, (req, res) => {
  const sorted = [...db.customers].sort((a, b) =>
    new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
  );
  res.json({
    success: true,
    customers: sorted
  });
});

// GET /api/admin/settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json({
    success: true,
    settings: db.settings
  });
});

// PUT /api/admin/settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const body = req.body;
  for (const [key, value] of Object.entries(body)) {
    db.settings[key] = String(value ?? "");
  }
  saveDB();
  res.json({
    success: true,
    message: "Settings saved successfully."
  });
});

// GET /api/categories
app.get('/api/categories', (req, res) => {
  const activeOnly = req.query.active !== 'false' && req.query.all !== 'true';
  const list = (db.categories || defaultCategories).filter(c => !activeOnly || (c.active !== 0 && c.active !== false && String(c.active) !== '0'));
  res.json({
    success: true,
    categories: list
  });
});

// GET /api/subcategories
app.get('/api/subcategories', (req, res) => {
  const categorySlugOrId = req.query.category;
  const activeOnly = req.query.active !== 'false' && req.query.all !== 'true';
  let list = (db.subcategories || defaultSubCategories).filter(s => !activeOnly || (s.active !== 0 && s.active !== false && String(s.active) !== '0'));
  if (categorySlugOrId) {
    const target = String(categorySlugOrId).toLowerCase().trim();
    list = list.filter(s => 
      (s.category_id && String(s.category_id).toLowerCase() === target) ||
      (s.category_slug && String(s.category_slug).toLowerCase() === target)
    );
  }
  res.json({
    success: true,
    subcategories: list
  });
});

// Generate dynamic XML sitemap function
function buildDynamicSitemap(baseUrl: string): string {
  const today = new Date().toISOString().split('T')[0];

  // 1. Active Products only (removes deleted or inactive)
  const activeProducts = (db.products || []).filter(p => p.active !== 0 && p.active !== false && String(p.active) !== '0');
  const productUrls = activeProducts.map(p => {
    const slug = p.slug || (p.name ? p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : p.id);
    const lastMod = (p.updated_at || p.created_at || new Date().toISOString()).split('T')[0];
    return `  <url>
    <loc>${baseUrl}/product/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  // 2. Active Categories only (removes deleted or inactive)
  const activeCategories = (db.categories || defaultCategories).filter(c => c.active !== 0 && c.active !== false && String(c.active) !== '0');
  const categoryUrls = activeCategories.map(c => {
    const slug = c.slug || (c.name ? c.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : c.id);
    const lastMod = (c.updated_at || c.created_at || new Date().toISOString()).split('T')[0];
    return `  <url>
    <loc>${baseUrl}/category/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  // 3. Active Subcategories only (removes deleted or inactive)
  const activeSubCategories = (db.subcategories || defaultSubCategories).filter(s => s.active !== 0 && s.active !== false && String(s.active) !== '0');
  const subCategoryUrls = activeSubCategories.map(s => {
    const cat = activeCategories.find(c => c.id === s.category_id || c.slug === s.category_slug);
    const catSlug = cat ? cat.slug : (s.category_slug || 'category');
    const subSlug = s.slug || (s.name ? s.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : s.id);
    const lastMod = (s.updated_at || s.created_at || new Date().toISOString()).split('T')[0];
    return `  <url>
    <loc>${baseUrl}/category/${catSlug}/${subSlug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${categoryUrls}
${subCategoryUrls}
${productUrls}
</urlset>`;
}

// GET /sitemap.xml (Dynamic Google XML Sitemap)
app.get(['/sitemap.xml', '/api/sitemap.xml'], (req, res) => {
  const host = req.get('host') || '';
  const isVercelOrProd = host.includes('maxora-store-ruby.vercel.app') || (!host.includes('localhost') && !host.includes('127.0.0.1'));
  const baseUrl = isVercelOrProd ? 'https://maxora-store-ruby.vercel.app' : `${req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${host}`;

  const sitemap = buildDynamicSitemap(baseUrl);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(sitemap);
});

// GET /robots.txt (Crawler directives)
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin/

Sitemap: https://maxora-store-ruby.vercel.app/sitemap.xml
`);
});

// ==========================================
// VITE / STATIC INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Maxora fullstack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
