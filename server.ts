import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory + file persistence DB
const DB_FILE = path.join(process.cwd(), 'maxora_db.json');

interface DBSchema {
  settings: Record<string, string>;
  products: any[];
  customers: any[];
  orders: any[];
  order_items: any[];
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

let db: DBSchema = {
  settings: { ...defaultSettings },
  products: [...defaultProducts],
  customers: [...defaultCustomers],
  orders: [...defaultOrders],
  order_items: [...defaultOrderItems]
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
      order_items: parsed.order_items || defaultOrderItems
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
  const auth = req.headers['x-admin-password'] || req.headers['authorization'];
  const password = process.env.ADMIN_PASSWORD || "123456";
  if (!auth) return false;
  if (typeof auth === 'string' && auth.startsWith("Bearer ")) {
    return auth.substring(7) === password;
  }
  return auth === password;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAdmin(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized. Enter admin password (default: 123456)" });
  }
  next();
}

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

// GET /api/products
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
    return {
      ...product,
      images: safeJSON(product.images),
      final_price: finalPrice
    };
  });

  res.json({
    success: true,
    products: formatted
  });
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id && p.active !== 0);
  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found." });
  }
  const discount = Number(product.discount || 0);
  const price = Number(product.selling_price || 0);
  res.json({
    success: true,
    product: {
      ...product,
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

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    order: {
      id: orderId,
      order_number: orderNo,
      subtotal,
      delivery_charge: deliveryCharge,
      total,
      items: finalItems.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.unitPrice
      }))
    }
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
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const nonCancelledOrders = db.orders.filter(o => o.status !== 'Cancelled');

  const todayOrders = nonCancelledOrders.filter(o => o.created_at && o.created_at.startsWith(today));
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const monthlyOrders = nonCancelledOrders.filter(o => o.created_at && o.created_at.startsWith(thisMonth));
  const monthlySales = monthlyOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const delivered = db.orders.filter(o => o.status === 'Delivered').length;
  const pending = db.orders.filter(o => o.status === 'Pending').length;
  const processing = db.orders.filter(o => ['Confirmed', 'Processing', 'Shipped'].includes(o.status)).length;
  const cancelled = db.orders.filter(o => o.status === 'Cancelled').length;
  const returned = db.orders.filter(o => o.status === 'Returned').length;
  const activeProducts = db.products.filter(p => p.active !== 0).length;
  const totalCustomers = db.customers.length;

  const recentOrders = [...db.orders]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 10);

  // Group order items by product
  const productSalesMap: Record<string, { product_name: string; quantity: number; sales: number }> = {};
  for (const item of db.order_items) {
    if (!productSalesMap[item.product_id]) {
      productSalesMap[item.product_id] = {
        product_name: item.product_name,
        quantity: 0,
        sales: 0
      };
    }
    productSalesMap[item.product_id].quantity += Number(item.quantity || 0);
    productSalesMap[item.product_id].sales += Number(item.line_total || 0);
  }

  const bestProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  res.json({
    success: true,
    totals: {
      today_sales: todaySales,
      today_orders: todayOrders.length,
      monthly_sales: monthlySales,
      monthly_orders: monthlyOrders.length,
      delivered,
      pending,
      processing,
      cancelled,
      returned,
      products: activeProducts,
      customers: totalCustomers
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

  const productId = `prod-${Date.now().toString(36)}-${Math.floor(Math.random()*1000)}`;
  const newProduct = {
    id: productId,
    name: body.name,
    description: body.description || "",
    category: body.category || "Other",
    sku: body.sku || "",
    image_url: body.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    images: JSON.stringify(Array.isArray(body.images) ? body.images : [body.image_url]),
    buying_price: Number(body.buying_price || 0),
    selling_price: Number(body.selling_price || 0),
    discount: Number(body.discount || 0),
    stock: Number(body.stock || 0),
    badge: body.badge || "",
    featured: body.featured ? 1 : 0,
    active: body.active === false || body.active === 0 ? 0 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDB();

  res.status(201).json({
    success: true,
    message: "Product added successfully.",
    id: productId
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
    updated_at: new Date().toISOString()
  };

  saveDB();
  res.json({
    success: true,
    message: "Product updated successfully."
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
  res.json({
    success: true,
    orders: list
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
