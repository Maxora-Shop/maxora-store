import { Product, StoreSettings, Customer, Order, OrderItem, DashboardTotals, OrderStatus } from '../types';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS } from '../data/initialData';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

const SETTINGS_KEY = 'maxora_settings_v1';
const PRODUCTS_KEY = 'maxora_products_v1';
const ORDERS_KEY = 'maxora_orders_v1';
const CUSTOMERS_KEY = 'maxora_customers_v1';

function notifyProductsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_products_updated'));
  }
}

function notifySettingsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_settings_updated'));
  }
}

function notifyOrdersChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_orders_updated'));
  }
}

// Helpers for Local Storage
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading localStorage ${key}:`, e);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing localStorage ${key}:`, e);
  }
}

// Ensure Local Storage is initialized
export function initLocalStorage(): void {
  if (!localStorage.getItem(SETTINGS_KEY)) {
    setLocal(SETTINGS_KEY, INITIAL_SETTINGS);
  }
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    setLocal(PRODUCTS_KEY, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    setLocal(ORDERS_KEY, INITIAL_ORDERS);
  }
  if (!localStorage.getItem(CUSTOMERS_KEY)) {
    setLocal(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
  }
}

// Initialize immediately
initLocalStorage();

// Firestore Realtime Listeners
let isListening = false;
export function initRealtimeFirestoreListeners() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;

  try {
    // 1. Listen for product changes
    onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Product;
        prods.push({ ...d, id: String(d.id || docSnap.id) });
      });
      prods.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setLocal(PRODUCTS_KEY, prods);
      notifyProductsChanged();
    }, (err) => console.warn('Products Firestore snapshot warning:', err));

    // 2. Listen for settings changes
    onSnapshot(doc(db, 'settings', 'store_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data() as StoreSettings;
        setLocal(SETTINGS_KEY, settings);
        notifySettingsChanged();
      }
    }, (err) => console.warn('Settings Firestore snapshot warning:', err));

    // 3. Listen for orders changes
    onSnapshot(collection(db, 'orders'), (snapshot) => {
      if (!snapshot.empty) {
        const orders: Order[] = [];
        snapshot.forEach((docSnap) => {
          orders.push(docSnap.data() as Order);
        });
        if (orders.length > 0) {
          orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setLocal(ORDERS_KEY, orders);
          notifyOrdersChanged();
        }
      }
    }, (err) => console.warn('Orders Firestore snapshot warning:', err));
  } catch (err) {
    console.warn('Realtime listener error:', err);
  }
}

// Start listeners immediately
initRealtimeFirestoreListeners();

// Check if online API is reachable
const DEFAULT_BACKEND_URL = 'https://ais-pre-bzqlo2xsrfg32tqtn6mrvi-701931449769.asia-southeast1.run.app';
const isInternalHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('run.app') || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) 
  ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '') 
  : isInternalHost
    ? '' 
    : DEFAULT_BACKEND_URL;

function getAuthHeaders(adminPassword?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_token') : null;
  const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';

  if (pass) {
    headers['x-admin-password'] = pass;
    headers['Authorization'] = `Bearer ${pass}`;
  }
  if (token) {
    headers['x-admin-token'] = token;
  }
  return headers;
}

async function tryApi<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const res = await fetch(fullUrl, options);
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error || res.statusText };
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: true };
    }
    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// Seed initial products to Firestore if empty
let isSeeding = false;
async function seedInitialDataIfNeeded() {
  if (isSeeding) return;
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'store_settings'));
    if (settingsDoc.exists() && (settingsDoc.data() as any)?.seeded_v1) {
      return; // Already seeded, never re-seed to avoid bringing back deleted products
    }

    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      isSeeding = true;
      const batch = writeBatch(db);
      for (const p of INITIAL_PRODUCTS) {
        const ref = doc(db, 'products', String(p.id));
        batch.set(ref, p);
      }
      await batch.commit();
      console.log('Seeded initial products to Firestore');
    }

    await setDoc(doc(db, 'settings', 'store_settings'), { ...INITIAL_SETTINGS, seeded_v1: true }, { merge: true });
  } catch (e) {
    console.warn('Firestore seeding check error:', e);
  } finally {
    isSeeding = false;
  }
}

// Seed in background
seedInitialDataIfNeeded();

export const storeService = {
  // 1. SETTINGS
  async getSettings(): Promise<StoreSettings> {
    const local = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
    
    // 1. Try Firestore
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'store_settings'));
      if (docSnap.exists()) {
        const firestoreSettings = docSnap.data() as StoreSettings;
        const merged = { ...local, ...firestoreSettings };
        setLocal(SETTINGS_KEY, merged);
        return merged;
      }
    } catch (e) {
      console.warn('Firestore getSettings error:', e);
    }

    // 2. Try REST API
    const apiResult = await tryApi<{ success: boolean; settings: StoreSettings }>('/api/settings');
    if (apiResult.success && apiResult.data?.settings) {
      const merged = { ...local, ...apiResult.data.settings };
      setLocal(SETTINGS_KEY, merged);
      return merged;
    }
    return local;
  },

  async updateSettings(newSettings: Partial<StoreSettings>, adminPassword?: string): Promise<{ success: boolean; settings: StoreSettings }> {
    const current = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
    const updated = { ...current, ...newSettings };
    setLocal(SETTINGS_KEY, updated);

    // 1. Update Firestore
    try {
      await setDoc(doc(db, 'settings', 'store_settings'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore updateSettings error:', e);
    }

    // 2. Persist to Backend API
    tryApi<{ success: boolean; settings?: StoreSettings }>('/api/admin/settings', {
      method: 'PUT',
      headers: getAuthHeaders(adminPassword),
      body: JSON.stringify(newSettings),
    }).catch(() => {});

    notifySettingsChanged();
    return { success: true, settings: updated };
  },

  async saveSettings(newSettings: Partial<StoreSettings>, adminPassword?: string): Promise<{ success: boolean; settings: StoreSettings }> {
    return this.updateSettings(newSettings, adminPassword);
  },

  // 2. PRODUCTS
  async getProducts(search = '', category = ''): Promise<Product[]> {
    let prods: Product[] = [];
    let firestoreLoaded = false;

    // 1. Try Firestore directly
    try {
      const snap = await getDocs(collection(db, 'products'));
      firestoreLoaded = true;
      snap.forEach((d) => {
        const item = d.data() as Product;
        prods.push({ ...item, id: String(item.id || d.id) });
      });
      setLocal(PRODUCTS_KEY, prods);
    } catch (e) {
      console.warn('Firestore getProducts error, falling back to cache:', e);
    }

    // 2. Fallback to cached local storage only if Firestore network failed
    if (!firestoreLoaded) {
      prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    }

    let list = prods.filter((p) => p.active !== 0 && p.active !== false);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (category.trim()) {
      list = list.filter((p) => p.category === category.trim());
    }

    list.sort((a, b) => {
      const fA = a.featured ? 1 : 0;
      const fB = b.featured ? 1 : 0;
      if (fB !== fA) return fB - fA;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return list.map((p) => {
      const discount = Number(p.discount || 0);
      const price = Number(p.selling_price || 0);
      return {
        ...p,
        final_price: Math.max(0, price - discount),
      };
    });
  },

  async getAllAdminProducts(adminPassword?: string): Promise<Product[]> {
    let prods: Product[] = [];

    // 1. Try Firestore
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        snap.forEach((d) => prods.push(d.data() as Product));
        if (prods.length > 0) {
          setLocal(PRODUCTS_KEY, prods);
        }
      }
    } catch (e) {
      console.warn('Firestore getAllAdminProducts error:', e);
    }

    // 2. Try REST API
    if (prods.length === 0) {
      const apiResult = await tryApi<{ success: boolean; products: Product[] }>('/api/admin/products', {
        headers: getAuthHeaders(adminPassword),
      });
      if (apiResult.success && Array.isArray(apiResult.data?.products) && apiResult.data.products.length > 0) {
        prods = apiResult.data.products;
        setLocal(PRODUCTS_KEY, prods);
      }
    }

    if (prods.length === 0) {
      prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    }

    return [...prods].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async addProduct(productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product: Product }> {
    const newId = productData.id || `prod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    const images = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : [productData.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];

    const newProd: Product = {
      id: newId,
      name: productData.name || 'New Product',
      description: productData.description || '',
      category: productData.category || 'Smart Gadgets',
      sub_category: productData.sub_category || '',
      child_category: productData.child_category || '',
      product_type: productData.product_type || 'Standard Product',
      product_link: productData.product_link || '',
      sku: productData.sku || `MX-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      image_url: productData.image_url || images[0],
      images,
      buying_price: Number(productData.buying_price || 0),
      selling_price: Number(productData.selling_price || 0),
      discount: Number(productData.discount || 0),
      final_price: Math.max(0, Number(productData.selling_price || 0) - Number(productData.discount || 0)),
      stock: Number(productData.stock || 0),
      badge: productData.badge || '',
      featured: productData.featured ? 1 : 0,
      active: productData.active !== undefined ? (productData.active ? 1 : 0) : 1,
      meta_title: productData.meta_title || '',
      meta_description: productData.meta_description || '',
      meta_keywords: productData.meta_keywords || '',
      slug: productData.slug || (productData.name ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''),
      brand: productData.brand || 'Maxora',
      og_image: productData.og_image || productData.image_url || images[0],
      created_at: productData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save directly to Cloud Firestore
    try {
      await setDoc(doc(db, 'products', String(newProd.id)), newProd);
    } catch (e) {
      console.warn('Firestore save product error:', e);
    }

    // 2. Try Backend API
    tryApi<{ success: boolean; product?: Product; id?: string }>('/api/admin/products', {
      method: 'POST',
      headers: getAuthHeaders(adminPassword),
      body: JSON.stringify(newProd),
    }).catch(() => {});

    // 3. Update local cache
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const existingIdx = local.findIndex(p => String(p.id) === String(newProd.id));
    if (existingIdx >= 0) {
      local[existingIdx] = newProd;
    } else {
      local.unshift(newProd);
    }
    setLocal(PRODUCTS_KEY, local);
    notifyProductsChanged();

    return { success: true, product: newProd };
  },

  async updateProduct(id: string | number, productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product?: Product }> {
    const idStr = String(id);
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const index = local.findIndex((p) => String(p.id) === idStr);

    const current = index !== -1 ? local[index] : ({} as Product);
    const sellingPrice = productData.selling_price !== undefined ? Number(productData.selling_price) : Number(current.selling_price || 0);
    const discount = productData.discount !== undefined ? Number(productData.discount) : Number(current.discount || 0);

    const updated: Product = {
      ...current,
      ...productData,
      id: idStr,
      selling_price: sellingPrice,
      discount: discount,
      final_price: Math.max(0, sellingPrice - discount),
      stock: productData.stock !== undefined ? Number(productData.stock) : Number(current.stock || 0),
      updated_at: new Date().toISOString(),
    };

    // 1. Update Firestore
    try {
      await setDoc(doc(db, 'products', idStr), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore update product error:', e);
    }

    // 2. Try Backend API
    tryApi<{ success: boolean; product?: Product }>(`/api/admin/products/${idStr}`, {
      method: 'PUT',
      headers: getAuthHeaders(adminPassword),
      body: JSON.stringify(productData),
    }).catch(() => {});

    if (index !== -1) {
      local[index] = updated;
    } else {
      local.unshift(updated);
    }
    setLocal(PRODUCTS_KEY, local);
    notifyProductsChanged();

    return { success: true, product: updated };
  },

  async saveProduct(productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product?: Product }> {
    if (productData.id) {
      return this.updateProduct(productData.id, productData, adminPassword);
    } else {
      return this.addProduct(productData, adminPassword);
    }
  },

  async deleteProduct(id: string | number, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(id);

    // 1. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'products', idStr));
    } catch (e) {
      console.warn('Firestore delete product error:', e);
    }

    // 2. Delete via API
    tryApi(`/api/admin/products/${idStr}`, {
      method: 'DELETE',
      headers: getAuthHeaders(adminPassword),
    }).catch(() => {});

    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const filtered = local.filter((p) => String(p.id) !== idStr);
    setLocal(PRODUCTS_KEY, filtered);
    notifyProductsChanged();

    return { success: true };
  },

  // 3. ORDERS & CHECKOUT
  async createOrder(orderPayload: {
    customer_name: string;
    phone: string;
    alt_phone?: string;
    email?: string;
    district: string;
    area: string;
    address: string;
    delivery_area: 'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka' | string;
    note?: string;
    items: Array<{ product_id: string; name: string; quantity: number }>;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const settings = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
    const products = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);

    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    const orderId = `ord-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    for (const item of orderPayload.items) {
      const prod = products.find((p) => String(p.id) === String(item.product_id));
      const qty = Math.max(1, Number(item.quantity || 1));
      const discount = Number(prod?.discount || 0);
      const price = Number(prod?.selling_price || 0);
      const finalPrice = Math.max(0, price - discount);
      const lineTotal = finalPrice * qty;

      subtotal += lineTotal;
      orderItems.push({
        id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        order_id: orderId,
        product_id: prod?.id || item.product_id,
        product_name: prod?.name || item.name,
        sku: prod?.sku || '',
        quantity: qty,
        unit_price: finalPrice,
        buying_price: Number(prod?.buying_price || 0),
        line_total: lineTotal,
        image_url: prod?.image_url,
      });

      if (prod) {
        prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
        // update stock in Firestore
        setDoc(doc(db, 'products', String(prod.id)), { stock: prod.stock }, { merge: true }).catch(() => {});
      }
    }
    setLocal(PRODUCTS_KEY, products);

    // Delivery calculation
    let deliveryCharge = Number(settings.delivery_outside_dhaka || 130);
    if (orderPayload.delivery_area === 'inside_dhaka') {
      deliveryCharge = Number(settings.delivery_inside_dhaka || 70);
    } else if (orderPayload.delivery_area === 'sub_dhaka') {
      deliveryCharge = Number(settings.delivery_sub_dhaka || 100);
    }

    const total = subtotal + deliveryCharge;

    const d = new Date();
    const dateStr =
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    const orderNo = `MX-${dateStr}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Customer setup
    const customerId = `cust-${orderPayload.phone.replace(/[^0-9]/g, '') || Date.now().toString(36)}`;
    const customerData: Customer = {
      id: customerId,
      name: orderPayload.customer_name,
      phone: orderPayload.phone,
      alt_phone: orderPayload.alt_phone || '',
      email: orderPayload.email || '',
      district: orderPayload.district,
      area: orderPayload.area,
      address: orderPayload.address,
      total_orders: 1,
      total_spent: total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newOrder: Order = {
      id: orderId,
      order_number: orderNo,
      customer_id: customerId,
      customer_name: orderPayload.customer_name,
      phone: orderPayload.phone,
      alt_phone: orderPayload.alt_phone || '',
      email: orderPayload.email || '',
      district: orderPayload.district,
      area: orderPayload.area,
      address: orderPayload.address,
      delivery_area: orderPayload.delivery_area,
      delivery_charge: deliveryCharge,
      subtotal,
      total,
      status: 'Pending',
      payment_method: 'Cash on Delivery',
      note: orderPayload.note || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderItems,
    };

    // 1. SAVE TO FIRESTORE DIRECTLY (Cloud DB)
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      await setDoc(doc(db, 'customers', customerId), customerData, { merge: true });
    } catch (e) {
      console.warn('Firestore createOrder error:', e);
    }

    // 2. Also forward to API
    tryApi<{ success: boolean; message?: string; order?: any }>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    }).catch(() => {});

    // 3. Local update
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    orders.unshift(newOrder);
    setLocal(ORDERS_KEY, orders);

    const customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    const custIdx = customers.findIndex(c => c.phone === orderPayload.phone);
    if (custIdx >= 0) {
      customers[custIdx].total_orders = (customers[custIdx].total_orders || 0) + 1;
      customers[custIdx].total_spent = (customers[custIdx].total_spent || 0) + total;
      customers[custIdx].updated_at = new Date().toISOString();
    } else {
      customers.push(customerData);
    }
    setLocal(CUSTOMERS_KEY, customers);

    notifyOrdersChanged();

    return { success: true, order: newOrder };
  },

  async trackOrder(queryStr: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    const q = queryStr.trim().toLowerCase();

    // 1. Query from Firestore
    try {
      const snap = await getDocs(collection(db, 'orders'));
      let foundOrder: Order | undefined;
      snap.forEach((d) => {
        const o = d.data() as Order;
        if (
          o.order_number?.toLowerCase() === q ||
          o.phone?.toLowerCase() === q ||
          String(o.id).toLowerCase() === q
        ) {
          foundOrder = o;
        }
      });
      if (foundOrder) {
        return { success: true, order: foundOrder };
      }
    } catch (e) {
      console.warn('Firestore trackOrder error:', e);
    }

    const apiResult = await tryApi<{ success: boolean; order?: Order; error?: string }>(
      `/api/orders/track/${encodeURIComponent(queryStr.trim())}`
    );

    if (apiResult.success && apiResult.data?.order) {
      return { success: true, order: apiResult.data.order };
    }

    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const order = orders.find(
      (o) =>
        o.order_number.toLowerCase() === q ||
        o.phone.toLowerCase() === q ||
        String(o.id).toLowerCase() === q
    );

    if (!order) {
      return { success: false, error: 'No order found matching this order number or phone.' };
    }

    return { success: true, order };
  },

  async getAllAdminOrders(statusFilter = '', adminPassword?: string): Promise<Order[]> {
    let orders: Order[] = [];

    // 1. Fetch from Firestore
    try {
      const snap = await getDocs(collection(db, 'orders'));
      if (!snap.empty) {
        snap.forEach((d) => orders.push(d.data() as Order));
        if (orders.length > 0) {
          setLocal(ORDERS_KEY, orders);
        }
      }
    } catch (e) {
      console.warn('Firestore getAllAdminOrders error:', e);
    }

    // 2. Fetch from API if Firestore is empty
    if (orders.length === 0) {
      const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
      const url = statusFilter ? `/api/admin/orders?status=${encodeURIComponent(statusFilter)}` : '/api/admin/orders';
      const apiResult = await tryApi<{ success: boolean; orders: Order[] }>(url, {
        headers: { 'x-admin-password': pass },
      });

      if (apiResult.success && Array.isArray(apiResult.data?.orders) && apiResult.data.orders.length > 0) {
        orders = apiResult.data.orders;
        setLocal(ORDERS_KEY, orders);
      }
    }

    if (orders.length === 0) {
      orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    }

    if (statusFilter) {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    return [...orders].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async updateOrderStatus(orderId: string | number, status: OrderStatus, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);

    // 1. Update Firestore
    try {
      await setDoc(doc(db, 'orders', idStr), { status, updated_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore update order status error:', e);
    }

    // 2. Local
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const index = orders.findIndex((o) => String(o.id) === idStr);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updated_at = new Date().toISOString();
      setLocal(ORDERS_KEY, orders);
    }

    // 3. API
    if (adminPassword) {
      tryApi(`/api/admin/orders/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async updateOrder(orderData: Partial<Order> & { id: string | number }, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderData.id);

    // 1. Firestore
    try {
      await setDoc(doc(db, 'orders', idStr), { ...orderData, updated_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore update order error:', e);
    }

    // 2. Local
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const index = orders.findIndex((o) => String(o.id) === idStr);
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        ...orderData,
        updated_at: new Date().toISOString(),
      };
      setLocal(ORDERS_KEY, orders);
    }

    // 3. API
    if (adminPassword) {
      tryApi(`/api/admin/orders/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(orderData),
      }).catch(() => {});
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async updateOrderDetails(orderData: Partial<Order> & { id: string | number }, adminPassword?: string): Promise<{ success: boolean }> {
    return this.updateOrder(orderData, adminPassword);
  },

  async deleteOrder(orderId: string | number, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);

    // 1. Firestore
    try {
      await deleteDoc(doc(db, 'orders', idStr));
    } catch (e) {
      console.warn('Firestore delete order error:', e);
    }

    // 2. Local
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const filtered = orders.filter((o) => String(o.id) !== idStr && o.order_number !== idStr);
    setLocal(ORDERS_KEY, filtered);

    // 3. API
    if (adminPassword) {
      tryApi(`/api/admin/orders/${idStr}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      }).catch(() => {});
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async getAllCustomers(adminPassword?: string): Promise<Customer[]> {
    let customers: Customer[] = [];

    // 1. Firestore
    try {
      const snap = await getDocs(collection(db, 'customers'));
      if (!snap.empty) {
        snap.forEach((d) => customers.push(d.data() as Customer));
        if (customers.length > 0) {
          setLocal(CUSTOMERS_KEY, customers);
        }
      }
    } catch (e) {
      console.warn('Firestore getAllCustomers error:', e);
    }

    if (customers.length === 0) {
      const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
      const apiResult = await tryApi<{ success: boolean; customers: Customer[] }>('/api/admin/customers', {
        headers: { 'x-admin-password': pass },
      });
      if (apiResult.success && Array.isArray(apiResult.data?.customers) && apiResult.data.customers.length > 0) {
        customers = apiResult.data.customers;
        setLocal(CUSTOMERS_KEY, customers);
      }
    }

    if (customers.length === 0) {
      customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    }

    return [...customers].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  },

  async getDashboardTotals(adminPassword?: string): Promise<DashboardTotals> {
    const orders = await this.getAllAdminOrders('', adminPassword);
    const products = await this.getAllAdminProducts(adminPassword);
    const customers = await this.getAllCustomers(adminPassword);

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const nonCancelled = orders.filter((o) => o.status !== 'Cancelled');
    const validOrders = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Returned');
    const todayOrders = nonCancelled.filter((o) => o.created_at && o.created_at.startsWith(today));
    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const monthlyOrders = nonCancelled.filter((o) => o.created_at && o.created_at.startsWith(thisMonth));
    const monthlySales = monthlyOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const totalSales = nonCancelled.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrdersCount = orders.length;

    const pending = orders.filter((o) => o.status === 'Pending').length;
    const confirmed = orders.filter((o) => o.status === 'Confirmed').length;
    const processing = orders.filter((o) => o.status === 'Processing').length;
    const shipped = orders.filter((o) => o.status === 'Shipped').length;
    const delivered = orders.filter((o) => o.status === 'Delivered').length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;
    const returned = orders.filter((o) => o.status === 'Returned').length;
    const activeProducts = products.filter((p) => p.active !== 0 && p.active !== false).length;
    const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);

    let totalExpenses = 0;
    for (const o of validOrders) {
      if (Array.isArray(o.items)) {
        for (const it of o.items) {
          totalExpenses += Number(it.buying_price || 0) * Number(it.quantity || 1);
        }
      }
    }
    const profit = Math.max(0, totalSales - totalExpenses);

    return {
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
      customers: customers.length,
      total_stock: totalStock,
      total_expenses: totalExpenses,
      profit: profit,
    };
  },
};
