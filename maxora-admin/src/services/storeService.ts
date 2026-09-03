import { Product, StoreSettings, Customer, Order, OrderItem, DashboardTotals, OrderStatus } from '../types';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS } from '../data/initialData';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

const SETTINGS_KEY = 'maxora_settings_v1';
const PRODUCTS_KEY = 'maxora_products_v1';
const ORDERS_KEY = 'maxora_orders_v1';
const CUSTOMERS_KEY = 'maxora_customers_v1';

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

initLocalStorage();

// Realtime Firestore Listeners
let isListening = false;
export function initRealtimeFirestoreListeners() {
  if (isListening || typeof window === 'undefined') return;
  isListening = true;

  try {
    // 1. Listen for product changes in Firestore
    onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Product;
        prods.push({ ...d, id: d.id || docSnap.id });
      });
      prods.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setLocal(PRODUCTS_KEY, prods);
      notifyProductsChanged();
    }, (err) => console.warn('Admin Products Firestore listener warning:', err));

    // 2. Listen for settings changes
    onSnapshot(doc(db, 'settings', 'store_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data() as StoreSettings;
        setLocal(SETTINGS_KEY, settings);
        notifySettingsChanged();
      }
    }, (err) => console.warn('Admin Settings Firestore listener warning:', err));

    // 3. Listen for orders changes
    onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Order;
        orders.push({ ...d, id: d.id || docSnap.id });
      });
      if (orders.length > 0) {
        orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setLocal(ORDERS_KEY, orders);
        notifyOrdersChanged();
      }
    }, (err) => console.warn('Admin Orders Firestore listener warning:', err));
  } catch (err) {
    console.warn('Admin Realtime listener error:', err);
  }
}

initRealtimeFirestoreListeners();

// Seed initial products to Firestore if empty
let isSeeding = false;
async function seedInitialDataIfNeeded() {
  if (isSeeding) return;
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'store_settings'));
    if (settingsDoc.exists() && (settingsDoc.data() as any)?.seeded_v1) {
      return; // Already initialized, never re-seed
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
      console.log('[Admin] Seeded initial products to Firestore');
    }
    await setDoc(doc(db, 'settings', 'store_settings'), { ...INITIAL_SETTINGS, seeded_v1: true }, { merge: true });
  } catch (e) {
    console.warn('[Admin] Firestore seeding check error:', e);
  } finally {
    isSeeding = false;
  }
}

seedInitialDataIfNeeded();

export const storeService = {
  // 1. SETTINGS
  async getSettings(): Promise<StoreSettings> {
    const local = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
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
    return local;
  },

  async updateSettings(newSettings: Partial<StoreSettings>, _adminPassword?: string): Promise<{ success: boolean; settings: StoreSettings }> {
    const current = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
    const updated = { ...current, ...newSettings };
    setLocal(SETTINGS_KEY, updated);

    // Save directly to Cloud Firestore
    try {
      await setDoc(doc(db, 'settings', 'store_settings'), updated, { merge: true });
      console.log('[Admin] Settings saved to Cloud Firestore');
    } catch (e) {
      console.warn('Firestore updateSettings error:', e);
    }

    notifySettingsChanged();
    return { success: true, settings: updated };
  },

  async saveSettings(newSettings: Partial<StoreSettings>, adminPassword?: string): Promise<{ success: boolean; settings: StoreSettings }> {
    return this.updateSettings(newSettings, adminPassword);
  },

  // 2. PRODUCTS
  async getProducts(search = '', category = ''): Promise<Product[]> {
    let prods: Product[] = [];
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        snap.forEach((d) => {
          const p = d.data() as Product;
          prods.push({ ...p, id: p.id || d.id });
        });
        if (prods.length > 0) {
          setLocal(PRODUCTS_KEY, prods);
        }
      }
    } catch (e) {
      console.warn('Firestore getProducts error:', e);
    }

    if (prods.length === 0) {
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

  async getAllAdminProducts(_adminPassword?: string): Promise<Product[]> {
    let prods: Product[] = [];
    let firestoreLoaded = false;
    try {
      const snap = await getDocs(collection(db, 'products'));
      firestoreLoaded = true;
      snap.forEach((d) => {
        const p = d.data() as Product;
        prods.push({ ...p, id: String(p.id || d.id) });
      });
      setLocal(PRODUCTS_KEY, prods);
      return prods.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } catch (e) {
      console.warn('Firestore getAllAdminProducts error:', e);
    }

    if (!firestoreLoaded) {
      const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      return [...local].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    return prods;
  },

  async addProduct(productData: Partial<Product>, _adminPassword?: string): Promise<{ success: boolean; product: Product }> {
    const newId = String(productData.id || `prod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`);

    const images = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : [productData.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];

    const newProd: Product = {
      id: newId,
      name: productData.name || 'New Product',
      description: productData.description || '',
      category: productData.category || 'Smart Gadgets',
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
      await setDoc(doc(db, 'products', newId), newProd);
      console.log('[Admin] Product saved to Cloud Firestore:', newId);
    } catch (e) {
      console.warn('Firestore addProduct error:', e);
    }

    // 2. Update local storage
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const existingIdx = local.findIndex(p => String(p.id) === newId);
    if (existingIdx >= 0) {
      local[existingIdx] = newProd;
    } else {
      local.unshift(newProd);
    }
    setLocal(PRODUCTS_KEY, local);
    notifyProductsChanged();

    return { success: true, product: newProd };
  },

  async updateProduct(id: string | number, productData: Partial<Product>, _adminPassword?: string): Promise<{ success: boolean; product?: Product }> {
    const idStr = String(id);
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const index = local.findIndex((p) => String(p.id) === idStr);

    let current = index !== -1 ? local[index] : (INITIAL_PRODUCTS.find(p => String(p.id) === idStr) || {} as Product);
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

    // 1. Update in Cloud Firestore
    try {
      await setDoc(doc(db, 'products', idStr), updated, { merge: true });
      console.log('[Admin] Product updated in Cloud Firestore:', idStr);
    } catch (e) {
      console.warn('Firestore updateProduct error:', e);
    }

    // 2. Update local storage
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

  async deleteProduct(id: string | number, _adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(id);

    // 1. Delete from Cloud Firestore
    try {
      await deleteDoc(doc(db, 'products', idStr));
      console.log('[Admin] Product deleted from Cloud Firestore:', idStr);
    } catch (e) {
      console.warn('Firestore deleteProduct error:', e);
    }

    // 2. Update local storage
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const filtered = local.filter((p) => String(p.id) !== idStr);
    setLocal(PRODUCTS_KEY, filtered);
    notifyProductsChanged();

    return { success: true };
  },

  // 3. ORDERS
  async getAllAdminOrders(statusFilter = '', _adminPassword?: string): Promise<Order[]> {
    let orders: Order[] = [];
    try {
      const snap = await getDocs(collection(db, 'orders'));
      if (!snap.empty) {
        snap.forEach((d) => {
          const ord = d.data() as Order;
          orders.push({ ...ord, id: ord.id || d.id });
        });
        if (orders.length > 0) {
          orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setLocal(ORDERS_KEY, orders);
        }
      }
    } catch (e) {
      console.warn('Firestore getAllAdminOrders error:', e);
    }

    if (orders.length === 0) {
      orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    }

    if (statusFilter) {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    return [...orders].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async updateOrderStatus(orderId: string | number, status: OrderStatus, _adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const index = orders.findIndex((o) => String(o.id) === idStr);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updated_at = new Date().toISOString();
      setLocal(ORDERS_KEY, orders);
    }

    // Update in Cloud Firestore
    try {
      await setDoc(doc(db, 'orders', idStr), { status, updated_at: new Date().toISOString() }, { merge: true });
      console.log('[Admin] Order status updated in Cloud Firestore:', idStr, status);
    } catch (e) {
      console.warn('Firestore updateOrderStatus error:', e);
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async updateOrder(orderData: Partial<Order> & { id: string | number }, _adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderData.id);
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

    // Update in Cloud Firestore
    try {
      await setDoc(doc(db, 'orders', idStr), { ...orderData, updated_at: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore updateOrder error:', e);
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async updateOrderDetails(orderData: Partial<Order> & { id: string | number }, adminPassword?: string): Promise<{ success: boolean }> {
    return this.updateOrder(orderData, adminPassword);
  },

  async deleteOrder(orderId: string | number, _adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const filtered = orders.filter((o) => String(o.id) !== idStr && o.order_number !== idStr);
    setLocal(ORDERS_KEY, filtered);

    // Delete in Cloud Firestore
    try {
      await deleteDoc(doc(db, 'orders', idStr));
    } catch (e) {
      console.warn('Firestore deleteOrder error:', e);
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async getAllCustomers(_adminPassword?: string): Promise<Customer[]> {
    let customers: Customer[] = [];
    try {
      const snap = await getDocs(collection(db, 'customers'));
      if (!snap.empty) {
        snap.forEach((d) => {
          const c = d.data() as Customer;
          customers.push({ ...c, id: c.id || d.id });
        });
        if (customers.length > 0) {
          setLocal(CUSTOMERS_KEY, customers);
          return customers.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        }
      }
    } catch (e) {
      console.warn('Firestore getAllCustomers error:', e);
    }

    const localCustomers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    return [...localCustomers].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
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
