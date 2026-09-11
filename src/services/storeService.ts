import { Product, StoreSettings, Customer, Order, OrderItem, DashboardTotals, OrderStatus, Category, SubCategory, ProductType, ChildCategory, Review, ProductRatingStats, Brand } from '../types';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS, INITIAL_CATEGORIES, INITIAL_SUBCATEGORIES, INITIAL_PRODUCT_TYPES, INITIAL_CHILD_CATEGORIES, INITIAL_REVIEWS, INITIAL_BRANDS } from '../data/initialData';
import { reconcileCategories, reconcileSubCategories } from '../utils/categoryCompatibility';
import { generateSlug, getProductSlug } from '../utils/seo';
import { matchesTaxonomyField } from '../utils/taxonomy';
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
const CURRENT_CUSTOMER_KEY = 'maxora_current_customer_v1';
const CATEGORIES_KEY = 'maxora_categories_v1';
const SUBCATEGORIES_KEY = 'maxora_subcategories_v1';
const PRODUCT_TYPES_KEY = 'maxora_product_types_v1';
const CHILD_CATEGORIES_KEY = 'maxora_child_categories_v1';
const REVIEWS_KEY = 'maxora_reviews_v1';
const BRANDS_KEY = 'maxora_brands_v1';

function notifyCustomerAuthChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_customer_auth_changed'));
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

function notifyCategoriesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_categories_updated'));
  }
}

function notifySubCategoriesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_subcategories_updated'));
  }
}

function notifyProductTypesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_product_types_updated'));
  }
}

function notifyChildCategoriesChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_child_categories_updated'));
  }
}

function notifyReviewsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_reviews_updated'));
  }
}

function notifyBrandsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maxora_brands_updated'));
  }
}

// Sanitize data before writing to Firestore so undefined never causes a rejection
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return '' as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      } else {
        cleaned[key] = '';
      }
    }
    return cleaned as T;
  }
  return data;
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

const DELETED_ORDERS_KEY = 'maxora_deleted_orders_ids';
const DELETED_PRODUCTS_KEY = 'maxora_deleted_products_ids';

export function getDeletedOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const list = getLocal<string[]>(DELETED_ORDERS_KEY, []);
  return new Set((list || []).map(String));
}

export function markOrderDeleted(id: string | number, orderNo?: string) {
  if (typeof window === 'undefined') return;
  const list = getLocal<string[]>(DELETED_ORDERS_KEY, []);
  const set = new Set(list.map(String));
  if (id) set.add(String(id));
  if (orderNo) set.add(String(orderNo));
  setLocal(DELETED_ORDERS_KEY, Array.from(set));
}

export function getDeletedProductIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const list = getLocal<string[]>(DELETED_PRODUCTS_KEY, []);
  return new Set((list || []).map(String));
}

export function markProductDeleted(id: string | number, sku?: string, slug?: string) {
  if (typeof window === 'undefined') return;
  const list = getLocal<string[]>(DELETED_PRODUCTS_KEY, []);
  const set = new Set(list.map(String));
  if (id) set.add(String(id));
  if (sku) set.add(String(sku));
  if (slug) set.add(String(slug));
  setLocal(DELETED_PRODUCTS_KEY, Array.from(set));
}

// Ensure Local Storage is initialized
export function initLocalStorage(): void {
  const deletedProductIds = getDeletedProductIds();

  if (!localStorage.getItem(SETTINGS_KEY)) {
    setLocal(SETTINGS_KEY, INITIAL_SETTINGS);
  }
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    const initialProds = INITIAL_PRODUCTS.filter(
      (p) => !deletedProductIds.has(String(p.id)) && (!p.sku || !deletedProductIds.has(String(p.sku))) && (!p.slug || !deletedProductIds.has(String(p.slug)))
    );
    setLocal(PRODUCTS_KEY, initialProds);
  } else {
    const existingProds = getLocal<Product[]>(PRODUCTS_KEY, []);
    if (Array.isArray(existingProds) && existingProds.length > 0) {
      const cleaned = existingProds.filter(
        (p) => !deletedProductIds.has(String(p.id)) && (!p.sku || !deletedProductIds.has(String(p.sku))) && (!p.slug || !deletedProductIds.has(String(p.slug)))
      );
      if (cleaned.length !== existingProds.length) {
        setLocal(PRODUCTS_KEY, cleaned);
      }
    }
  }
  if (!localStorage.getItem(ORDERS_KEY)) {
    setLocal(ORDERS_KEY, []);
  } else {
    // Purge legacy hardcoded demo orders if present
    const existingOrders = getLocal<Order[]>(ORDERS_KEY, []);
    if (Array.isArray(existingOrders) && existingOrders.length > 0) {
      const cleaned = existingOrders.filter(
        (o) => !['ord-001', 'ord-002', 'ord-003'].includes(String(o.id)) &&
               !['Tanvir Ahmed', 'Farhana Yasmin'].includes(o.customer_name)
      );
      if (cleaned.length !== existingOrders.length) {
        setLocal(ORDERS_KEY, cleaned);
      }
    }
  }
  if (!localStorage.getItem(CUSTOMERS_KEY)) {
    setLocal(CUSTOMERS_KEY, []);
  } else {
    // Purge legacy demo customers if present
    const existingCusts = getLocal<Customer[]>(CUSTOMERS_KEY, []);
    if (Array.isArray(existingCusts) && existingCusts.length > 0) {
      const cleanedCusts = existingCusts.filter(
        (c) => !['cust-001', 'cust-002'].includes(String(c.id)) &&
               !['Tanvir Ahmed', 'Farhana Yasmin'].includes(c.name)
      );
      if (cleanedCusts.length !== existingCusts.length) {
        setLocal(CUSTOMERS_KEY, cleanedCusts);
      }
    }
  }
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    setLocal(CATEGORIES_KEY, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(SUBCATEGORIES_KEY)) {
    setLocal(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
  }
  if (!localStorage.getItem(PRODUCT_TYPES_KEY)) {
    setLocal(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);
  }
  if (!localStorage.getItem(CHILD_CATEGORIES_KEY)) {
    setLocal(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);
  }
  if (!localStorage.getItem(REVIEWS_KEY)) {
    setLocal(REVIEWS_KEY, INITIAL_REVIEWS);
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
      const deletedProductIds = getDeletedProductIds();
      if (snapshot.empty) {
        return;
      }
      const prods: Product[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Product;
        const pId = String(d.id || docSnap.id);
        const pSku = String(d.sku || '');
        const pSlug = String(d.slug || '');
        if (deletedProductIds.has(pId) || (pSku && deletedProductIds.has(pSku)) || (pSlug && deletedProductIds.has(pSlug))) {
          return;
        }
        prods.push({ ...d, id: pId });
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

    // 3. Listen for orders changes (realtime cloud sync)
    onSnapshot(collection(db, 'orders'), (snapshot) => {
      const deletedIds = getDeletedOrderIds();
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const o = docSnap.data() as Order;
        const oId = String(o.id || docSnap.id);
        const oNum = String(o.order_number || '');
        if (deletedIds.has(oId) || (oNum && deletedIds.has(oNum))) {
          return;
        }
        if (['ord-001', 'ord-002', 'ord-003'].includes(oId) || ['Tanvir Ahmed', 'Farhana Yasmin'].includes(o.customer_name)) {
          return;
        }
        orders.push({
          ...o,
          id: oId,
          order_number: oNum || `MX-${oId.slice(-6)}`,
          phone: o.phone || (o as any).customer_phone || '',
          customer_phone: o.phone || (o as any).customer_phone || '',
          total: o.total !== undefined ? Number(o.total) : Number((o as any).total_amount || 0),
          total_amount: o.total !== undefined ? Number(o.total) : Number((o as any).total_amount || 0),
          status: (o.status || (o as any).order_status || 'Pending') as OrderStatus,
          items: Array.isArray(o.items) ? o.items : [],
          created_at: o.created_at || new Date().toISOString(),
        });
      });
      orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setLocal(ORDERS_KEY, orders);
      notifyOrdersChanged();
    }, (err) => console.warn('Orders Firestore snapshot warning:', err));

    // 4. Listen for categories changes
    onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (!snapshot.empty) {
        const cats: Category[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Category;
          cats.push({ ...d, id: String(d.id || docSnap.id) });
        });
        cats.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setLocal(CATEGORIES_KEY, cats);
        notifyCategoriesChanged();
      }
    }, (err) => console.warn('Categories Firestore snapshot warning:', err));

    // 5. Listen for subcategories changes
    onSnapshot(collection(db, 'subcategories'), (snapshot) => {
      if (!snapshot.empty) {
        const subcats: SubCategory[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as SubCategory;
          subcats.push({ ...d, id: String(d.id || docSnap.id) });
        });
        subcats.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setLocal(SUBCATEGORIES_KEY, subcats);
        notifySubCategoriesChanged();
      }
    }, (err) => console.warn('Subcategories Firestore snapshot warning:', err));

    // 6. Listen for product_types changes
    onSnapshot(collection(db, 'product_types'), (snapshot) => {
      if (!snapshot.empty) {
        const types: ProductType[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as ProductType;
          types.push({ ...d, id: String(d.id || docSnap.id) });
        });
        types.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setLocal(PRODUCT_TYPES_KEY, types);
        notifyProductTypesChanged();
      }
    }, (err) => console.warn('ProductTypes Firestore snapshot warning:', err));

    // 7. Listen for child_categories changes
    onSnapshot(collection(db, 'child_categories'), (snapshot) => {
      if (!snapshot.empty) {
        const children: ChildCategory[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as ChildCategory;
          children.push({ ...d, id: String(d.id || docSnap.id) });
        });
        children.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setLocal(CHILD_CATEGORIES_KEY, children);
        notifyChildCategoriesChanged();
      }
    }, (err) => console.warn('ChildCategories Firestore snapshot warning:', err));

    // 8. Listen for reviews changes
    onSnapshot(collection(db, 'reviews'), (snapshot) => {
      if (!snapshot.empty) {
        const revs: Review[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Review;
          revs.push({ ...d, id: String(d.id || docSnap.id) });
        });
        revs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        setLocal(REVIEWS_KEY, revs);
        notifyReviewsChanged();
      }
    }, (err) => console.warn('Reviews Firestore snapshot warning:', err));
  } catch (err) {
    console.warn('Realtime listener error:', err);
  }
}

// Start listeners immediately
initRealtimeFirestoreListeners();

// Check if online API is reachable
const isInternalHost = typeof window !== 'undefined' && (
  (window.location?.hostname || '').includes('run.app') || 
  window.location?.hostname === 'localhost' || 
  window.location?.hostname === '127.0.0.1'
);

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) 
  ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '') 
  : isInternalHost
    ? '' 
    : '';

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error || res.statusText };
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false, error: 'Non-JSON response' };
    }
    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// Seed initial products and multi-tier taxonomy to Firestore if empty
let isSeeding = false;
export async function seedInitialDataIfNeeded() {
  if (isSeeding) return;
  isSeeding = true;
  try {
    // 1. Seed Products if empty
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      const batch = writeBatch(db);
      for (const p of INITIAL_PRODUCTS) {
        const ref = doc(db, 'products', String(p.id));
        batch.set(ref, p);
      }
      await batch.commit();
      console.log('Seeded initial products to Firestore');
      const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      if (!local || local.length === 0) {
        setLocal(PRODUCTS_KEY, INITIAL_PRODUCTS);
      }
      notifyProductsChanged();
    }

    // 2. Seed Categories if empty
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      const batch = writeBatch(db);
      for (const c of INITIAL_CATEGORIES) {
        const ref = doc(db, 'categories', c.id);
        batch.set(ref, c);
      }
      await batch.commit();
      console.log('Seeded initial categories to Firestore');
      setLocal(CATEGORIES_KEY, INITIAL_CATEGORIES);
      notifyCategoriesChanged();
    }

    // 3. Seed Subcategories if empty
    const subSnap = await getDocs(collection(db, 'subcategories'));
    if (subSnap.empty) {
      const batch = writeBatch(db);
      for (const s of INITIAL_SUBCATEGORIES) {
        const ref = doc(db, 'subcategories', s.id);
        batch.set(ref, s);
      }
      await batch.commit();
      console.log('Seeded initial subcategories to Firestore');
      setLocal(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
      notifySubCategoriesChanged();
    }

    // 4. Seed Product Types (Tier 3) if empty
    const typeSnap = await getDocs(collection(db, 'product_types'));
    if (typeSnap.empty) {
      const batch = writeBatch(db);
      for (const t of INITIAL_PRODUCT_TYPES) {
        const ref = doc(db, 'product_types', t.id);
        batch.set(ref, t);
      }
      await batch.commit();
      console.log('Seeded initial product types to Firestore');
      setLocal(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);
      notifyProductTypesChanged();
    }

    // 5. Seed Child Categories (Tier 4) if empty
    const childSnap = await getDocs(collection(db, 'child_categories'));
    if (childSnap.empty) {
      const batch = writeBatch(db);
      for (const ch of INITIAL_CHILD_CATEGORIES) {
        const ref = doc(db, 'child_categories', ch.id);
        batch.set(ref, ch);
      }
      await batch.commit();
      console.log('Seeded initial child categories to Firestore');
      setLocal(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);
      notifyChildCategoriesChanged();
    }

    // 6. Seed Reviews if empty
    const revSnap = await getDocs(collection(db, 'reviews'));
    if (revSnap.empty) {
      const batch = writeBatch(db);
      for (const r of INITIAL_REVIEWS) {
        const ref = doc(db, 'reviews', String(r.id));
        batch.set(ref, r);
      }
      await batch.commit();
      console.log('Seeded initial reviews to Firestore');
      setLocal(REVIEWS_KEY, INITIAL_REVIEWS);
      notifyReviewsChanged();
    }

    // 7. Seed Brands if empty
    const brandSnap = await getDocs(collection(db, 'brands'));
    if (brandSnap.empty) {
      const batch = writeBatch(db);
      for (const b of INITIAL_BRANDS) {
        const ref = doc(db, 'brands', b.id);
        batch.set(ref, b);
      }
      await batch.commit();
      console.log('Seeded initial brands to Firestore');
      setLocal(BRANDS_KEY, INITIAL_BRANDS);
      notifyBrandsChanged();
    }

    // 8. Store Settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'store_settings'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'store_settings'), { ...INITIAL_SETTINGS, seeded_v1: true }, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore seeding check error:', e);
  } finally {
    isSeeding = false;
  }
}

// Seed in background
seedInitialDataIfNeeded();

export const storeService = {
  // Synchronous Cache Getters for zero-flicker instant hydration
  getCachedProducts(): Product[] {
    const deletedProductIds = getDeletedProductIds();
    const raw = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    return raw.filter(
      (p) => !deletedProductIds.has(String(p.id)) && (!p.sku || !deletedProductIds.has(String(p.sku))) && (!p.slug || !deletedProductIds.has(String(p.slug)))
    );
  },
  getCachedCategories(): Category[] {
    return getLocal<Category[]>(CATEGORIES_KEY, INITIAL_CATEGORIES);
  },
  getCachedSubCategories(): SubCategory[] {
    return getLocal<SubCategory[]>(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
  },
  getCachedProductTypes(): ProductType[] {
    return getLocal<ProductType[]>(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);
  },
  getCachedChildCategories(): ChildCategory[] {
    return getLocal<ChildCategory[]>(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);
  },
  getCachedBrands(): Brand[] {
    return getLocal<Brand[]>(BRANDS_KEY, INITIAL_BRANDS);
  },

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
  async getProducts(
    search = '',
    category = '',
    subCategory = '',
    productType = '',
    childCategory = ''
  ): Promise<Product[]> {
    const deletedProductIds = getDeletedProductIds();
    let prods: Product[] = [];

    // 1. Try Firestore directly
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        snap.forEach((d) => {
          const item = d.data() as Product;
          const pId = String(item.id || d.id);
          const pSku = String(item.sku || '');
          const pSlug = String(item.slug || '');
          if (deletedProductIds.has(pId) || (pSku && deletedProductIds.has(pSku)) || (pSlug && deletedProductIds.has(pSlug))) {
            return;
          }
          prods.push({ ...item, id: pId });
        });
        if (prods.length > 0) {
          setLocal(PRODUCTS_KEY, prods);
        }
      }
    } catch (e) {
      console.warn('Firestore getProducts error, falling back to cache:', e);
    }

    // 2. Fallback to cached local storage
    if (prods.length === 0) {
      const cached = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      prods = cached.filter(
        (p) => !deletedProductIds.has(String(p.id)) && (!p.sku || !deletedProductIds.has(String(p.sku))) && (!p.slug || !deletedProductIds.has(String(p.slug)))
      );
      setLocal(PRODUCTS_KEY, prods);
    }

    let list = prods.filter((p) => p.active !== 0 && p.active !== false);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.sub_category && p.sub_category.toLowerCase().includes(q)) ||
          (p.product_type && p.product_type.toLowerCase().includes(q)) ||
          (p.child_category && p.child_category.toLowerCase().includes(q)) ||
          (p.meta_keywords && p.meta_keywords.toLowerCase().includes(q))
      );
    }

    if (category.trim() && category.toLowerCase() !== 'all') {
      list = list.filter((p) => {
        if (p.category_id && (p.category_id === category || matchesTaxonomyField(p.category_id, category))) return true;
        return (
          matchesTaxonomyField(p.category, category) ||
          matchesTaxonomyField(p.category_slug, category)
        );
      });
    }

    if (subCategory.trim() && subCategory.toLowerCase() !== 'all') {
      list = list.filter((p) => {
        if (p.subcategory_id && (p.subcategory_id === subCategory || matchesTaxonomyField(p.subcategory_id, subCategory))) return true;
        return (
          matchesTaxonomyField(p.sub_category, subCategory) ||
          matchesTaxonomyField(p.subcategory_slug, subCategory)
        );
      });
    }

    if (productType.trim() && productType.toLowerCase() !== 'all') {
      list = list.filter((p) => {
        if (p.product_type_id && (p.product_type_id === productType || matchesTaxonomyField(p.product_type_id, productType))) return true;
        return (
          matchesTaxonomyField(p.product_type, productType) ||
          matchesTaxonomyField(p.product_type_slug, productType)
        );
      });
    }

    if (childCategory.trim() && childCategory.toLowerCase() !== 'all') {
      list = list.filter((p) => {
        const pChildId = p.childcategory_id || p.child_category_id;
        if (pChildId && (pChildId === childCategory || matchesTaxonomyField(pChildId, childCategory))) return true;
        return (
          matchesTaxonomyField(p.child_category, childCategory) ||
          matchesTaxonomyField(p.childcategory_slug, childCategory) ||
          matchesTaxonomyField(p.child_category_slug, childCategory)
        );
      });
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
    const prodMap = new Map<string, Product>();
    const deletedProductIds = getDeletedProductIds();

    const registerProduct = (p: any, docId?: string) => {
      if (!p) return;
      const id = String(p.id || docId || '');
      const sku = String(p.sku || '');
      const slug = String(p.slug || '');
      if (!id && !sku && !slug) return;

      if (deletedProductIds.has(id) || (sku && deletedProductIds.has(sku)) || (slug && deletedProductIds.has(slug))) {
        return;
      }

      const mapped: Product = {
        ...p,
        id: id || sku || slug,
        name: p.name || 'Untitled Product',
        buying_price: Number(p.buying_price || 0),
        selling_price: Number(p.selling_price || 0),
        discount: Number(p.discount || 0),
        final_price: Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0)),
        stock: Number(p.stock || 0),
        active: p.active !== undefined && (p.active === 0 || p.active === false) ? 0 : 1,
        featured: p.featured ? 1 : 0,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      };

      if (!prodMap.has(mapped.id)) {
        prodMap.set(mapped.id, mapped);
      }
    };

    // 1. Try REST API
    try {
      const apiResult = await tryApi<{ success: boolean; products: Product[] }>('/api/admin/products', {
        headers: getAuthHeaders(adminPassword),
      });
      if (apiResult.success && Array.isArray(apiResult.data?.products) && apiResult.data.products.length > 0) {
        apiResult.data.products.forEach((p) => registerProduct(p));
      }
    } catch (e) {
      console.warn('API getAllAdminProducts warning:', e);
    }

    // 2. Try Firestore (quota-safe)
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        snap.forEach((d) => registerProduct(d.data(), d.id));
      }
    } catch (e) {
      console.warn('Firestore getAllAdminProducts warning:', e);
    }

    // 3. Merge local cache
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    if (Array.isArray(local)) {
      local.forEach((p) => registerProduct(p));
    }

    const prods = Array.from(prodMap.values());
    prods.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    setLocal(PRODUCTS_KEY, prods);

    return prods;
  },

  async addProduct(productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product: Product }> {
    const newId = productData.id || `prod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    const images = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : [productData.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];

    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    let baseSlug = productData.slug ? generateSlug(productData.slug) : generateSlug(productData.name || newId);
    if (!baseSlug) baseSlug = `item-${newId.slice(-6)}`;
    let finalSlug = baseSlug;
    let counter = 1;
    while (local.some(p => String(p.id) !== String(newId) && p.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const newProd: Product = {
      id: newId,
      name: productData.name || 'New Product',
      description: productData.description || '',
      category: productData.category || 'Smart Gadgets',
      sub_category: productData.sub_category || '',
      child_category: productData.child_category || '',
      product_type: productData.product_type || 'Standard Product',
      colors: productData.colors || [],
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
      meta_title: productData.meta_title?.trim() || `${productData.name || 'Product'} Price in Bangladesh | Maxora Shop`,
      meta_description: productData.meta_description?.trim() || (productData.description ? productData.description.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().slice(0, 160) : `Buy ${productData.name || 'product'} at best price in Bangladesh with Cash on Delivery at Maxora Shop.`),
      meta_keywords: productData.meta_keywords || '',
      slug: finalSlug,
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
    const name = productData.name !== undefined ? productData.name : current.name;
    const rawSlug = productData.slug !== undefined ? productData.slug : (current.slug || name);
    let baseSlug = rawSlug ? generateSlug(rawSlug) : generateSlug(name || idStr);
    if (!baseSlug) baseSlug = `item-${idStr.slice(-6)}`;
    let finalSlug = baseSlug;
    let counter = 1;
    while (local.some(p => String(p.id) !== idStr && p.slug === finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const updated: Product = {
      ...current,
      ...productData,
      id: idStr,
      slug: finalSlug,
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
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const target = local.find((p) => String(p.id) === idStr || p.sku === idStr || p.slug === idStr);

    // Record in deleted products registry
    markProductDeleted(idStr, target?.sku, target?.slug);

    // 1. Delete from Firestore (by id, and also by sku/slug doc if exists)
    try {
      await deleteDoc(doc(db, 'products', idStr));
      if (target?.id && String(target.id) !== idStr) {
        await deleteDoc(doc(db, 'products', String(target.id))).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore delete product error:', e);
    }

    // 2. Delete via API
    tryApi(`/api/admin/products/${idStr}`, {
      method: 'DELETE',
      headers: getAuthHeaders(adminPassword),
    }).catch(() => {});

    // 3. Local state filter
    const filtered = local.filter((p) => String(p.id) !== idStr && p.sku !== idStr && p.slug !== idStr && String(p.id) !== String(target?.id));
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
    items: Array<{
      product_id: string;
      name: string;
      quantity: number;
      selected_color?: string;
      selected_color_code?: string;
      image_url?: string;
      unit_price?: number;
      sku?: string;
    }>;
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
      const price = Number(prod?.selling_price || item.unit_price || 0);
      const finalPrice = Math.max(0, price - discount);
      const lineTotal = finalPrice * qty;

      const matchedColor = prod?.colors?.find(c => c.name === item.selected_color);
      const resolvedImage = String(
        (item.selected_color && matchedColor?.image_url) ||
        item.image_url ||
        prod?.image_url ||
        (prod?.images && prod?.images[0]) ||
        matchedColor?.image_url ||
        ''
      ).trim();

      subtotal += lineTotal;
      orderItems.push({
        id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        order_id: orderId,
        product_id: String(prod?.id || item.product_id || ''),
        product_name: String(prod?.name || item.name || ''),
        sku: String(prod?.sku || item.sku || ''),
        quantity: qty,
        unit_price: finalPrice,
        buying_price: Number(prod?.buying_price || 0),
        line_total: lineTotal,
        image_url: resolvedImage,
        selected_color: String(item.selected_color || ''),
        selected_color_code: String(item.selected_color_code || matchedColor?.code || ''),
        slug: String(prod?.slug || ''),
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
      name: orderPayload.customer_name || 'Customer',
      phone: orderPayload.phone || '',
      alt_phone: orderPayload.alt_phone || '',
      email: orderPayload.email || '',
      district: orderPayload.district || '',
      area: orderPayload.area || '',
      address: orderPayload.address || '',
      total_orders: 1,
      total_spent: total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newOrder: Order = {
      id: orderId,
      order_number: orderNo,
      customer_id: customerId,
      customer_name: orderPayload.customer_name || 'Customer',
      phone: orderPayload.phone || '',
      alt_phone: orderPayload.alt_phone || '',
      email: orderPayload.email || '',
      district: orderPayload.district || '',
      area: orderPayload.area || '',
      address: orderPayload.address || '',
      delivery_area: orderPayload.delivery_area || 'inside_dhaka',
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

    // 1. SAVE TO FIRESTORE DIRECTLY (Cloud DB) - Sanitized against any undefined fields
    const firestoreOrder = cleanForFirestore({
      ...newOrder,
      customer_phone: orderPayload.phone || '',
      total_amount: total,
      order_status: 'Pending',
    });

    const firestoreCustomer = cleanForFirestore(customerData);

    try {
      if (db) {
        await setDoc(doc(db, 'orders', orderId), firestoreOrder);
        await setDoc(doc(db, 'customers', customerId), firestoreCustomer, { merge: true });
        console.log('Order successfully synced to Firestore:', orderId);
      } else {
        console.warn('Firestore db instance not available on order creation.');
      }
    } catch (e: any) {
      console.error('Firestore createOrder write error:', e?.message || e);
      // Fallback attempt directly with clean object if any field failed
      try {
        if (db) {
          const minimalDoc = {
            id: orderId,
            order_number: orderNo,
            customer_name: orderPayload.customer_name || 'Customer',
            phone: orderPayload.phone || '',
            district: orderPayload.district || '',
            area: orderPayload.area || '',
            address: orderPayload.address || '',
            delivery_charge: deliveryCharge,
            subtotal,
            total,
            total_amount: total,
            status: 'Pending',
            payment_method: 'Cash on Delivery',
            created_at: new Date().toISOString(),
            items: orderItems,
          };
          await setDoc(doc(db, 'orders', orderId), minimalDoc);
        }
      } catch (fallbackErr) {
        console.error('Firestore fallback write error:', fallbackErr);
      }
    }

    // 2. Also forward to API with complete order details for backend persistence
    const fullOrderSyncPayload = {
      ...orderPayload,
      order: newOrder,
      id: orderId,
      order_number: orderNo,
      items: orderItems,
      total,
      subtotal,
      delivery_charge: deliveryCharge,
    };
    try {
      await tryApi<{ success: boolean; message?: string; order?: any }>('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullOrderSyncPayload),
      });
    } catch (e) {
      console.warn('API /api/orders sync notice:', e);
    }

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
    const orderMap = new Map<string, Order>();
    const deletedIds = getDeletedOrderIds();

    // Helper to validate and add an order
    const registerOrder = (o: any, sourceDocId?: string) => {
      if (!o) return;
      const id = String(o.id || sourceDocId || '');
      const orderNumber = String(o.order_number || (id ? `MX-${id.slice(-6)}` : ''));
      if (!id && !orderNumber) return;

      // Filter out explicitly deleted orders
      if (deletedIds.has(id) || (orderNumber && deletedIds.has(orderNumber))) {
        return;
      }

      // Filter out legacy dummy demo orders
      if (['ord-001', 'ord-002', 'ord-003'].includes(id) || ['Tanvir Ahmed', 'Farhana Yasmin'].includes(o.customer_name)) {
        return;
      }

      const mappedOrder: Order = {
        id: id || orderNumber,
        order_number: orderNumber || `MX-${id.slice(-6)}`,
        customer_id: o.customer_id || `cust-${(o.phone || '').replace(/[^0-9]/g, '')}`,
        customer_name: o.customer_name || 'Customer',
        phone: o.phone || o.customer_phone || '',
        alt_phone: o.alt_phone || '',
        email: o.email || '',
        district: o.district || '',
        area: o.area || '',
        address: o.address || '',
        delivery_area: o.delivery_area || 'inside_dhaka',
        delivery_charge: Number(o.delivery_charge || 0),
        subtotal: Number(o.subtotal || 0),
        total: o.total !== undefined ? Number(o.total) : Number(o.total_amount || 0),
        total_amount: o.total !== undefined ? Number(o.total) : Number(o.total_amount || 0),
        status: (o.status || o.order_status || 'Pending') as OrderStatus,
        payment_method: o.payment_method || 'Cash on Delivery',
        note: o.note || '',
        items: Array.isArray(o.items) ? o.items : [],
        created_at: o.created_at || new Date().toISOString(),
        updated_at: o.updated_at || new Date().toISOString(),
      };

      const key = mappedOrder.id;
      if (!orderMap.has(key)) {
        orderMap.set(key, mappedOrder);
      } else {
        const existing = orderMap.get(key)!;
        if ((!existing.items || existing.items.length === 0) && mappedOrder.items.length > 0) {
          orderMap.set(key, { ...existing, items: mappedOrder.items });
        }
      }
    };

    // 1. Fetch from REST API (server database source of truth)
    try {
      const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
      const url = statusFilter ? `/api/admin/orders?status=${encodeURIComponent(statusFilter)}` : '/api/admin/orders';
      const apiResult = await tryApi<{ success: boolean; orders: Order[] }>(url, {
        headers: { 'x-admin-password': pass },
      });

      if (apiResult.success && Array.isArray(apiResult.data?.orders)) {
        apiResult.data.orders.forEach((o) => registerOrder(o));
      }
    } catch (e) {
      console.warn('API getAllAdminOrders notice:', e);
    }

    // 2. Fetch from Firestore (quota-tolerant cloud DB)
    try {
      const snap = await getDocs(collection(db, 'orders'));
      if (!snap.empty) {
        snap.forEach((d) => {
          registerOrder(d.data(), d.id);
        });
      }
    } catch (e) {
      console.warn('Firestore getAllAdminOrders notice (quota or offline):', e);
    }

    // 3. Merge local cached orders
    const localOrders = getLocal<Order[]>(ORDERS_KEY, []);
    if (Array.isArray(localOrders)) {
      localOrders.forEach((o) => registerOrder(o));
    }

    let orders = Array.from(orderMap.values());
    orders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    // Update local cache with sanitized orders
    setLocal(ORDERS_KEY, orders);

    if (statusFilter) {
      const filterLower = statusFilter.toLowerCase().trim();
      orders = orders.filter((o) => (o.status || '').toLowerCase().trim() === filterLower);
    }

    return orders;
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
    const orders = getLocal<Order[]>(ORDERS_KEY, []);
    const index = orders.findIndex((o) => String(o.id) === idStr || String(o.order_number) === idStr);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updated_at = new Date().toISOString();
      setLocal(ORDERS_KEY, orders);
    }

    // 3. API
    const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
    try {
      await tryApi(`/api/admin/orders/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': pass,
        },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.warn('API update order status error:', e);
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
    const orders = getLocal<Order[]>(ORDERS_KEY, []);
    const index = orders.findIndex((o) => String(o.id) === idStr || String(o.order_number) === idStr);
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        ...orderData,
        updated_at: new Date().toISOString(),
      };
      setLocal(ORDERS_KEY, orders);
    }

    // 3. API
    const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
    try {
      await tryApi(`/api/admin/orders/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': pass,
        },
        body: JSON.stringify(orderData),
      });
    } catch (e) {
      console.warn('API update order error:', e);
    }

    notifyOrdersChanged();
    return { success: true };
  },

  async updateOrderDetails(orderData: Partial<Order> & { id: string | number }, adminPassword?: string): Promise<{ success: boolean }> {
    return this.updateOrder(orderData, adminPassword);
  },

  async deleteOrder(orderId: string | number, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);

    // Find matching order in local storage to also record its order_number
    const orders = getLocal<Order[]>(ORDERS_KEY, []);
    const target = orders.find((o) => String(o.id) === idStr || String(o.order_number) === idStr);
    const orderNo = target?.order_number;

    // Mark as deleted in cache tracking
    markOrderDeleted(idStr, orderNo);

    // 1. Firestore: Delete by ID and by order number doc ref if different
    try {
      await deleteDoc(doc(db, 'orders', idStr));
      if (orderNo && orderNo !== idStr) {
        await deleteDoc(doc(db, 'orders', orderNo)).catch(() => {});
      }
    } catch (e) {
      console.warn('Firestore delete order error:', e);
    }

    // 2. Local storage: Filter out matching order
    const filtered = orders.filter(
      (o) => String(o.id) !== idStr && o.order_number !== idStr && String(o.id) !== target?.id
    );
    setLocal(ORDERS_KEY, filtered);

    // 3. API backend delete
    const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
    try {
      await tryApi(`/api/admin/orders/${idStr}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': pass },
      });
    } catch (e) {
      console.warn('API delete order error:', e);
    }

    notifyOrdersChanged();
    return { success: true };
  },

  subscribeToOrders(callback: (orders: Order[]) => void): () => void {
    if (!db) return () => {};
    try {
      const q = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orderMap = new Map<string, Order>();
          const deletedIds = getDeletedOrderIds();

          snapshot.forEach((d) => {
            const o = d.data() as any;
            if (!o) return;
            const id = String(o.id || d.id || '');
            const orderNumber = String(o.order_number || (id ? `MX-${id.slice(-6)}` : ''));
            if (!id && !orderNumber) return;
            if (deletedIds.has(id) || (orderNumber && deletedIds.has(orderNumber))) return;
            if (
              ['ord-001', 'ord-002', 'ord-003'].includes(id) ||
              ['Tanvir Ahmed', 'Farhana Yasmin'].includes(o.customer_name)
            ) {
              return;
            }

            const mappedOrder: Order = {
              id: id || orderNumber,
              order_number: orderNumber || `MX-${id.slice(-6)}`,
              customer_id: o.customer_id || `cust-${(o.phone || '').replace(/[^0-9]/g, '')}`,
              customer_name: o.customer_name || 'Customer',
              phone: o.phone || o.customer_phone || '',
              alt_phone: o.alt_phone || '',
              email: o.email || '',
              district: o.district || '',
              area: o.area || '',
              address: o.address || '',
              delivery_area: o.delivery_area || 'inside_dhaka',
              delivery_charge: Number(o.delivery_charge || 0),
              subtotal: Number(o.subtotal || 0),
              total: o.total !== undefined ? Number(o.total) : Number(o.total_amount || 0),
              total_amount: o.total !== undefined ? Number(o.total) : Number(o.total_amount || 0),
              status: (o.status || o.order_status || 'Pending') as OrderStatus,
              payment_method: o.payment_method || 'Cash on Delivery',
              note: o.note || '',
              items: Array.isArray(o.items) ? o.items : [],
              created_at: o.created_at || new Date().toISOString(),
              updated_at: o.updated_at || new Date().toISOString(),
            };
            orderMap.set(mappedOrder.id, mappedOrder);
          });

          const orders = Array.from(orderMap.values());
          orders.sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          setLocal(ORDERS_KEY, orders);
          callback(orders);
        },
        (err) => {
          console.warn('Real-time order subscription notice:', err);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Failed to setup real-time orders subscription:', e);
      return () => {};
    }
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

  // 4. CUSTOMER ACCOUNT & AUTHENTICATION
  getCurrentCustomer(): Customer | null {
    return getLocal<Customer | null>(CURRENT_CUSTOMER_KEY, null);
  },

  setCurrentCustomer(customer: Customer | null): void {
    setLocal(CURRENT_CUSTOMER_KEY, customer);
    notifyCustomerAuthChanged();
  },

  async customerLogin(phoneOrEmail: string, password?: string): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const cleanQuery = phoneOrEmail.trim();
    if (!cleanQuery) {
      return { success: false, error: 'Please enter your mobile phone number or email.' };
    }

    const cleanPhone = cleanQuery.replace(/[^0-9]/g, '');

    // 1. Check local & Firestore
    let allCustomers = await this.getAllCustomers();
    let found = allCustomers.find((c) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cEmail = (c.email || '').toLowerCase().trim();
      return (cleanPhone && cPhone === cleanPhone) || (cEmail && cEmail === cleanQuery.toLowerCase());
    });

    // If not found in memory, try Firestore direct lookup
    if (!found) {
      try {
        if (cleanPhone) {
          const custDoc = await getDoc(doc(db, 'customers', `cust-${cleanPhone}`));
          if (custDoc.exists()) {
            found = custDoc.data() as Customer;
          }
        }
      } catch (e) {
        console.warn('Firestore direct customer lookup error:', e);
      }
    }

    // Also check backend API if available
    if (!found) {
      try {
        const apiRes = await tryApi<{ success: boolean; customer?: Customer; error?: string }>('/api/customer/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneOrEmail: cleanQuery, password }),
        });
        if (apiRes.success && apiRes.data?.customer) {
          found = apiRes.data.customer;
        }
      } catch {
        // ignore
      }
    }

    if (!found) {
      // If customer has previous orders with this phone, auto-link their profile
      const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
      const matchingOrder = orders.find(o => (o.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
      if (matchingOrder) {
        found = {
          id: `cust-${cleanPhone}`,
          name: matchingOrder.customer_name || 'Valued Customer',
          phone: matchingOrder.phone,
          district: matchingOrder.district,
          area: matchingOrder.area,
          address: matchingOrder.address,
          total_orders: 1,
          total_spent: matchingOrder.total || 0,
          created_at: matchingOrder.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // Persist to local & Firestore
        const customersList = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
        customersList.push(found);
        setLocal(CUSTOMERS_KEY, customersList);
        try {
          await setDoc(doc(db, 'customers', found.id), cleanForFirestore(found), { merge: true });
        } catch {
          // ignore
        }
      } else {
        return {
          success: false,
          error: 'No account found with this phone or email. Please register a new account.',
        };
      }
    }

    // Optional password verification: if password was set on account and provided
    if (found.password && password && found.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again or reset.' };
    }

    // If customer didn't have password set yet and entered one, save it
    if (!found.password && password) {
      found.password = password;
      found.updated_at = new Date().toISOString();
      await this.updateCustomerProfile(found.id, { password });
    }

    this.setCurrentCustomer(found);
    return { success: true, customer: found };
  },

  async customerRegister(data: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    district?: string;
    area?: string;
    address?: string;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!name) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      return { success: false, error: 'Please enter a valid 11-digit Bangladesh phone number (e.g. 017...)' };
    }

    const customerId = `cust-${cleanPhone}`;
    const newCustomer: Customer = {
      id: customerId,
      name,
      phone,
      email: (data.email || '').trim().toLowerCase(),
      password: data.password || '',
      district: data.district || 'Dhaka',
      area: data.area || '',
      address: data.address || '',
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'customers', customerId), cleanForFirestore(newCustomer), { merge: true });
    } catch (e) {
      console.warn('Firestore customerRegister error:', e);
    }

    // Save locally
    const customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    const existingIdx = customers.findIndex((c) => c.id === customerId || c.phone === phone);
    if (existingIdx >= 0) {
      customers[existingIdx] = { ...customers[existingIdx], ...newCustomer };
    } else {
      customers.unshift(newCustomer);
    }
    setLocal(CUSTOMERS_KEY, customers);

    // Call backend API if running
    tryApi<{ success: boolean; customer: Customer }>('/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    }).catch(() => {});

    this.setCurrentCustomer(newCustomer);
    return { success: true, customer: newCustomer };
  },

  customerLogout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_CUSTOMER_KEY);
    }
    notifyCustomerAuthChanged();
  },

  async updateCustomerProfile(customerId: string, updates: Partial<Customer>): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    const idx = customers.findIndex((c) => c.id === customerId);
    if (idx < 0) {
      return { success: false, error: 'Customer not found.' };
    }

    const updated = {
      ...customers[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    customers[idx] = updated;
    setLocal(CUSTOMERS_KEY, customers);

    // Update active session if this is the current customer
    const current = this.getCurrentCustomer();
    if (current && current.id === customerId) {
      this.setCurrentCustomer(updated);
    }

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'customers', customerId), cleanForFirestore(updated), { merge: true });
    } catch (e) {
      console.warn('Firestore updateCustomerProfile error:', e);
    }

    // Sync to API
    tryApi('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, ...updates }),
    }).catch(() => {});

    return { success: true, customer: updated };
  },

  async getCustomerOrders(phoneOrCustomerId: string): Promise<Order[]> {
    if (!phoneOrCustomerId) return [];
    const clean = phoneOrCustomerId.trim();
    const cleanDigits = clean.replace(/[^0-9]/g, '');

    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const matched = orders.filter((o) => {
      const orderPhoneDigits = (o.phone || '').replace(/[^0-9]/g, '');
      const custPhoneDigits = (o.customer_phone || '').replace(/[^0-9]/g, '');
      return (
        o.customer_id === clean ||
        (cleanDigits && orderPhoneDigits === cleanDigits) ||
        (cleanDigits && custPhoneDigits === cleanDigits)
      );
    });

    return matched.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
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

  // 6. CATEGORIES
  async getCategories(): Promise<Category[]> {
    let cats: Category[] = [];
    let firestoreSuccess = false;
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        firestoreSuccess = true;
        snap.forEach((d) => {
          const item = d.data() as Category;
          cats.push({ ...item, id: String(item.id || d.id) });
        });
        setLocal(CATEGORIES_KEY, cats);
      }
    } catch (e) {
      console.warn('Firestore getCategories error:', e);
    }

    if (!firestoreSuccess) {
      cats = getLocal<Category[]>(CATEGORIES_KEY, INITIAL_CATEGORIES);
    }

    // Always reconcile with products in case there are unindexed categories
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    return reconcileCategories(cats, prods);
  },

  async saveCategory(catData: Partial<Category>, adminPassword?: string): Promise<{ success: boolean; category: Category }> {
    const rawName = (catData.name || '').trim();
    const slug = (catData.slug && catData.slug.trim()) ? generateSlug(catData.slug) : generateSlug(rawName);
    const id = catData.id || `cat-${slug || Date.now()}`;

    const newCategory: Category = {
      id,
      name: rawName || 'Uncategorized',
      slug: slug || 'uncategorized',
      icon: catData.icon || 'Sparkles',
      image_url: catData.image_url || '',
      display_order: Number(catData.display_order ?? 999),
      active: catData.active !== undefined ? (catData.active ? 1 : 0) : 1,
      meta_title: catData.meta_title || '',
      meta_description: catData.meta_description || '',
      created_at: catData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'categories', id), newCategory, { merge: true });
    } catch (e) {
      console.warn('Firestore saveCategory error:', e);
    }

    // Save to local cache & cascade rename if existing category was edited
    const current = getLocal<Category[]>(CATEGORIES_KEY, INITIAL_CATEGORIES);
    const existing = current.find((c) => c.id === id);
    const oldName = existing?.name;
    const oldSlug = existing?.slug;

    if (existing && (oldName !== newCategory.name || oldSlug !== newCategory.slug)) {
      // 1. Cascade update subcategories
      const subcats = getLocal<SubCategory[]>(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
      let subcatsChanged = false;
      subcats.forEach((s) => {
        if (s.category_id === id || (oldSlug && s.category_slug === oldSlug)) {
          s.category_id = newCategory.id;
          s.category_slug = newCategory.slug;
          subcatsChanged = true;
          setDoc(doc(db, 'subcategories', s.id), s, { merge: true }).catch(() => {});
        }
      });
      if (subcatsChanged) {
        setLocal(SUBCATEGORIES_KEY, subcats);
        notifySubCategoriesChanged();
      }

      // 2. Cascade update products
      const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      let prodsChanged = false;
      prods.forEach((p) => {
        if (
          p.category_id === id ||
          (oldSlug && p.category_slug === oldSlug) ||
          (oldName && p.category && p.category.toLowerCase().trim() === oldName.toLowerCase().trim())
        ) {
          p.category = newCategory.name;
          p.category_id = newCategory.id;
          p.category_slug = newCategory.slug;
          prodsChanged = true;
          setDoc(doc(db, 'products', String(p.id)), p, { merge: true }).catch(() => {});
        }
      });
      if (prodsChanged) {
        setLocal(PRODUCTS_KEY, prods);
        notifyProductsChanged();
      }
    }

    const idx = current.findIndex((c) => c.id === id || c.slug === slug);
    let updated: Category[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = newCategory;
    } else {
      updated = [...current, newCategory];
    }
    setLocal(CATEGORIES_KEY, updated);
    notifyCategoriesChanged();

    return { success: true, category: newCategory };
  },

  async deleteCategory(categoryId: string, adminPassword?: string): Promise<{ success: boolean }> {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (e) {
      console.warn('Firestore deleteCategory error:', e);
    }

    const current = getLocal<Category[]>(CATEGORIES_KEY, INITIAL_CATEGORIES);
    const catToDelete = current.find((c) => c.id === categoryId);
    const catName = catToDelete?.name?.toLowerCase().trim();
    const catSlug = catToDelete?.slug?.toLowerCase().trim();

    const updated = current.filter((c) => c.id !== categoryId);
    setLocal(CATEGORIES_KEY, updated);

    // 1. Unlink any products that were in this category
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    let prodsChanged = false;
    prods.forEach((p) => {
      if (
        p.category_id === categoryId ||
        (catSlug && (p.category_slug || '').toLowerCase().trim() === catSlug) ||
        (catName && (p.category || '').toLowerCase().trim() === catName)
      ) {
        p.category = 'Uncategorized';
        p.category_id = '';
        p.category_slug = 'uncategorized';
        prodsChanged = true;
        setDoc(doc(db, 'products', String(p.id)), {
          category: 'Uncategorized',
          category_id: '',
          category_slug: 'uncategorized',
        }, { merge: true }).catch(() => {});
      }
    });
    if (prodsChanged) {
      setLocal(PRODUCTS_KEY, prods);
      notifyProductsChanged();
    }

    // 2. Unlink or remove subcategories that belonged to this category
    const subcats = getLocal<SubCategory[]>(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
    const remainingSubcats = subcats.filter((s) => s.category_id !== categoryId && s.category_slug !== catSlug);
    if (remainingSubcats.length !== subcats.length) {
      setLocal(SUBCATEGORIES_KEY, remainingSubcats);
      notifySubCategoriesChanged();
    }

    notifyCategoriesChanged();

    return { success: true };
  },

  // 7. SUBCATEGORIES
  async getSubCategories(categorySlug?: string): Promise<SubCategory[]> {
    let subcats: SubCategory[] = [];
    let firestoreSuccess = false;
    try {
      const snap = await getDocs(collection(db, 'subcategories'));
      if (!snap.empty) {
        firestoreSuccess = true;
        snap.forEach((d) => {
          const item = d.data() as SubCategory;
          subcats.push({ ...item, id: String(item.id || d.id) });
        });
        setLocal(SUBCATEGORIES_KEY, subcats);
      }
    } catch (e) {
      console.warn('Firestore getSubCategories error:', e);
    }

    if (!firestoreSuccess) {
      subcats = getLocal<SubCategory[]>(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
    }

    const categories = await this.getCategories();
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    let reconciled = reconcileSubCategories(subcats, categories, prods);

    if (categorySlug && categorySlug.trim()) {
      const cleanSlug = categorySlug.trim().toLowerCase();
      reconciled = reconciled.filter(
        (s) => (s.category_slug || '').toLowerCase() === cleanSlug
      );
    }

    return reconciled;
  },

  async saveSubCategory(subData: Partial<SubCategory>, adminPassword?: string): Promise<{ success: boolean; subCategory: SubCategory }> {
    const rawName = (subData.name || '').trim();
    const slug = (subData.slug && subData.slug.trim()) ? generateSlug(subData.slug) : generateSlug(rawName);
    const id = subData.id || `subcat-${slug || Date.now()}`;

    const newSubCategory: SubCategory = {
      id,
      category_id: subData.category_id || '',
      category_slug: subData.category_slug || '',
      name: rawName || 'General',
      slug: slug || 'general',
      display_order: Number(subData.display_order ?? 999),
      active: subData.active !== undefined ? (subData.active ? 1 : 0) : 1,
      meta_title: subData.meta_title || '',
      meta_description: subData.meta_description || '',
      created_at: subData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'subcategories', id), newSubCategory, { merge: true });
    } catch (e) {
      console.warn('Firestore saveSubCategory error:', e);
    }

    const current = getLocal<SubCategory[]>(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
    const existing = current.find((s) => s.id === id);
    const oldName = existing?.name;
    const oldSlug = existing?.slug;

    if (existing && (oldName !== newSubCategory.name || oldSlug !== newSubCategory.slug)) {
      // 1. Cascade update products with this subcategory
      const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      let prodsChanged = false;
      prods.forEach((p) => {
        if (
          p.subcategory_id === id ||
          (oldSlug && p.subcategory_slug === oldSlug) ||
          (oldName && p.sub_category && p.sub_category.toLowerCase().trim() === oldName.toLowerCase().trim())
        ) {
          p.sub_category = newSubCategory.name;
          p.subcategory_id = newSubCategory.id;
          p.subcategory_slug = newSubCategory.slug;
          prodsChanged = true;
          setDoc(doc(db, 'products', String(p.id)), p, { merge: true }).catch(() => {});
        }
      });
      if (prodsChanged) {
        setLocal(PRODUCTS_KEY, prods);
        notifyProductsChanged();
      }

      // 2. Cascade update product types
      const types = getLocal<ProductType[]>(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);
      let typesChanged = false;
      types.forEach((t) => {
        if (t.subcategory_id === id || (oldSlug && t.subcategory_slug === oldSlug)) {
          t.subcategory_id = newSubCategory.id;
          t.subcategory_slug = newSubCategory.slug;
          typesChanged = true;
          setDoc(doc(db, 'product_types', t.id), t, { merge: true }).catch(() => {});
        }
      });
      if (typesChanged) {
        setLocal(PRODUCT_TYPES_KEY, types);
        notifyProductTypesChanged();
      }
    }

    const idx = current.findIndex((s) => s.id === id || s.slug === slug);
    let updated: SubCategory[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = newSubCategory;
    } else {
      updated = [...current, newSubCategory];
    }
    setLocal(SUBCATEGORIES_KEY, updated);
    notifySubCategoriesChanged();

    return { success: true, subCategory: newSubCategory };
  },

  async deleteSubCategory(subCategoryId: string, adminPassword?: string): Promise<{ success: boolean }> {
    try {
      await deleteDoc(doc(db, 'subcategories', subCategoryId));
    } catch (e) {
      console.warn('Firestore deleteSubCategory error:', e);
    }

    const current = getLocal<SubCategory[]>(SUBCATEGORIES_KEY, INITIAL_SUBCATEGORIES);
    const subToDelete = current.find((s) => s.id === subCategoryId);
    const subSlug = subToDelete?.slug?.toLowerCase().trim();
    const subName = subToDelete?.name?.toLowerCase().trim();

    const updated = current.filter((s) => s.id !== subCategoryId);
    setLocal(SUBCATEGORIES_KEY, updated);

    // Unlink products associated with this subcategory
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    let prodsChanged = false;
    prods.forEach((p) => {
      if (
        p.subcategory_id === subCategoryId ||
        (subSlug && (p.subcategory_slug || '').toLowerCase().trim() === subSlug) ||
        (subName && (p.sub_category || '').toLowerCase().trim() === subName)
      ) {
        p.sub_category = '';
        p.subcategory_id = '';
        p.subcategory_slug = '';
        prodsChanged = true;
        setDoc(doc(db, 'products', String(p.id)), {
          sub_category: '',
          subcategory_id: '',
          subcategory_slug: '',
        }, { merge: true }).catch(() => {});
      }
    });
    if (prodsChanged) {
      setLocal(PRODUCTS_KEY, prods);
      notifyProductsChanged();
    }

    notifySubCategoriesChanged();

    return { success: true };
  },

  // 6b. PRODUCT TYPES (Tier 3)
  async getProductTypes(subcategorySlugOrId?: string, activeOnly: boolean = false): Promise<ProductType[]> {
    const local = getLocal<ProductType[]>(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);

    try {
      const snapshot = await getDocs(collection(db, 'product_types'));
      if (!snapshot.empty) {
        const firestoreTypes: ProductType[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as ProductType;
          firestoreTypes.push({
            ...d,
            id: String(d.id || docSnap.id),
          });
        });

        // Merge with local/initial
        const existingIds = new Set(firestoreTypes.map((t) => t.id));
        const merged = [
          ...firestoreTypes,
          ...local.filter((l) => !existingIds.has(l.id)),
        ];
        merged.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setLocal(PRODUCT_TYPES_KEY, merged);

        let result = merged;
        if (activeOnly) {
          result = result.filter((t) => t.active !== 0 && t.active !== false && String(t.active) !== '0');
        }
        if (subcategorySlugOrId) {
          const target = subcategorySlugOrId.toLowerCase().trim();
          result = result.filter((t) =>
            (t.subcategory_id && t.subcategory_id.toLowerCase() === target) ||
            (t.subcategory_slug && t.subcategory_slug.toLowerCase() === target)
          );
        }
        return result;
      }
    } catch (e) {
      console.warn('Firestore getProductTypes error:', e);
    }

    let result = local;
    if (activeOnly) {
      result = result.filter((t) => t.active !== 0 && t.active !== false && String(t.active) !== '0');
    }
    if (subcategorySlugOrId) {
      const target = subcategorySlugOrId.toLowerCase().trim();
      result = result.filter((t) =>
        (t.subcategory_id && t.subcategory_id.toLowerCase() === target) ||
        (t.subcategory_slug && t.subcategory_slug.toLowerCase() === target)
      );
    }
    return result.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
  },

  async saveProductType(typeData: Partial<ProductType>, adminPassword?: string): Promise<{ success: boolean; productType: ProductType }> {
    const slug = typeData.slug ? generateSlug(typeData.slug) : generateSlug(typeData.name || `type-${Date.now()}`);
    const id = typeData.id || `pt-${slug || Date.now()}`;

    const newType: ProductType = {
      id,
      category_id: typeData.category_id || '',
      category_slug: typeData.category_slug || '',
      subcategory_id: typeData.subcategory_id || '',
      subcategory_slug: typeData.subcategory_slug || '',
      name: typeData.name || 'Untitled Product Type',
      slug,
      image_url: typeData.image_url || '',
      display_order: Number(typeData.display_order ?? 1),
      active: typeData.active !== undefined ? (typeData.active ? 1 : 0) : 1,
      meta_title: typeData.meta_title || '',
      meta_description: typeData.meta_description || '',
      created_at: typeData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'product_types', id), newType, { merge: true });
    } catch (e) {
      console.warn('Firestore saveProductType error:', e);
    }

    // Also attempt server sync if running full-stack
    try {
      fetch('/api/admin/product-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify(newType),
      }).catch(() => {});
    } catch {
      // safe ignore
    }

    const current = getLocal<ProductType[]>(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);
    const existing = current.find((t) => t.id === id);
    const oldName = existing?.name;
    const oldSlug = existing?.slug;

    if (existing && (oldName !== newType.name || oldSlug !== newType.slug)) {
      // Cascade update products
      const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      let prodsChanged = false;
      prods.forEach((p) => {
        if (
          p.product_type_id === id ||
          (oldSlug && p.product_type_slug === oldSlug) ||
          (oldName && p.product_type && p.product_type.toLowerCase().trim() === oldName.toLowerCase().trim())
        ) {
          p.product_type = newType.name;
          p.product_type_id = newType.id;
          p.product_type_slug = newType.slug;
          prodsChanged = true;
          setDoc(doc(db, 'products', String(p.id)), p, { merge: true }).catch(() => {});
        }
      });
      if (prodsChanged) {
        setLocal(PRODUCTS_KEY, prods);
        notifyProductsChanged();
      }

      // Cascade update child categories that belong to this product type
      const childs = getLocal<ChildCategory[]>(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);
      let childsChanged = false;
      childs.forEach((c) => {
        if (c.product_type_id === id || (oldSlug && c.product_type_slug === oldSlug)) {
          c.product_type_id = newType.id;
          c.product_type_slug = newType.slug;
          c.product_type_name = newType.name;
          childsChanged = true;
          setDoc(doc(db, 'child_categories', c.id), c, { merge: true }).catch(() => {});
        }
      });
      if (childsChanged) {
        setLocal(CHILD_CATEGORIES_KEY, childs);
        notifyChildCategoriesChanged();
      }
    }

    const idx = current.findIndex((t) => t.id === id || t.slug === slug);
    let updated: ProductType[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = newType;
    } else {
      updated = [...current, newType];
    }
    setLocal(PRODUCT_TYPES_KEY, updated);
    notifyProductTypesChanged();

    return { success: true, productType: newType };
  },

  async deleteProductType(typeId: string, adminPassword?: string): Promise<{ success: boolean }> {
    try {
      await deleteDoc(doc(db, 'product_types', typeId));
    } catch (e) {
      console.warn('Firestore deleteProductType error:', e);
    }

    try {
      fetch(`/api/admin/product-types/${typeId}`, {
        method: 'DELETE',
        headers: {
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
      }).catch(() => {});
    } catch {
      // safe ignore
    }

    const current = getLocal<ProductType[]>(PRODUCT_TYPES_KEY, INITIAL_PRODUCT_TYPES);
    const typeToDelete = current.find((t) => t.id === typeId);
    const typeSlug = typeToDelete?.slug?.toLowerCase().trim();
    const typeName = typeToDelete?.name?.toLowerCase().trim();

    const updated = current.filter((t) => t.id !== typeId);
    setLocal(PRODUCT_TYPES_KEY, updated);

    // Unlink products associated with this product type
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    let prodsChanged = false;
    prods.forEach((p) => {
      if (
        p.product_type_id === typeId ||
        (typeSlug && (p.product_type_slug || '').toLowerCase().trim() === typeSlug) ||
        (typeName && (p.product_type || '').toLowerCase().trim() === typeName)
      ) {
        p.product_type = 'Standard Product';
        p.product_type_id = '';
        p.product_type_slug = '';
        prodsChanged = true;
        setDoc(doc(db, 'products', String(p.id)), {
          product_type: 'Standard Product',
          product_type_id: '',
          product_type_slug: '',
        }, { merge: true }).catch(() => {});
      }
    });
    if (prodsChanged) {
      setLocal(PRODUCTS_KEY, prods);
      notifyProductsChanged();
    }

    notifyProductTypesChanged();

    return { success: true };
  },

  // 6c. CHILD CATEGORIES (Tier 4)
  async getChildCategories(productTypeSlugOrId?: string, activeOnly: boolean = false): Promise<ChildCategory[]> {
    const local = getLocal<ChildCategory[]>(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);

    try {
      const snapshot = await getDocs(collection(db, 'child_categories'));
      if (!snapshot.empty) {
        const firestoreChildren: ChildCategory[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as ChildCategory;
          firestoreChildren.push({
            ...d,
            id: String(d.id || docSnap.id),
          });
        });

        // Merge with local/initial
        const existingIds = new Set(firestoreChildren.map((c) => c.id));
        const merged = [
          ...firestoreChildren,
          ...local.filter((l) => !existingIds.has(l.id)),
        ];
        merged.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setLocal(CHILD_CATEGORIES_KEY, merged);

        let result = merged;
        if (activeOnly) {
          result = result.filter((c) => c.active !== 0 && c.active !== false && String(c.active) !== '0');
        }
        if (productTypeSlugOrId) {
          const target = productTypeSlugOrId.toLowerCase().trim();
          result = result.filter((c) =>
            (c.product_type_id && c.product_type_id.toLowerCase() === target) ||
            (c.product_type_slug && c.product_type_slug.toLowerCase() === target)
          );
        }
        return result;
      }
    } catch (e) {
      console.warn('Firestore getChildCategories error:', e);
    }

    let result = local;
    if (activeOnly) {
      result = result.filter((c) => c.active !== 0 && c.active !== false && String(c.active) !== '0');
    }
    if (productTypeSlugOrId) {
      const target = productTypeSlugOrId.toLowerCase().trim();
      result = result.filter((c) =>
        (c.product_type_id && c.product_type_id.toLowerCase() === target) ||
        (c.product_type_slug && c.product_type_slug.toLowerCase() === target)
      );
    }
    return result.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
  },

  async saveChildCategory(childData: Partial<ChildCategory>, adminPassword?: string): Promise<{ success: boolean; childCategory: ChildCategory }> {
    const slug = childData.slug ? generateSlug(childData.slug) : generateSlug(childData.name || `child-${Date.now()}`);
    const id = childData.id || `child-${slug || Date.now()}`;

    const newChild: ChildCategory = {
      id,
      category_id: childData.category_id || '',
      category_slug: childData.category_slug || '',
      subcategory_id: childData.subcategory_id || '',
      subcategory_slug: childData.subcategory_slug || '',
      product_type_id: childData.product_type_id || '',
      product_type_slug: childData.product_type_slug || '',
      product_type_name: childData.product_type_name || '',
      name: childData.name || 'Untitled Child Category',
      slug,
      image_url: childData.image_url || '',
      display_order: Number(childData.display_order ?? 1),
      active: childData.active !== undefined ? (childData.active ? 1 : 0) : 1,
      meta_title: childData.meta_title || '',
      meta_description: childData.meta_description || '',
      created_at: childData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'child_categories', id), newChild, { merge: true });
    } catch (e) {
      console.warn('Firestore saveChildCategory error:', e);
    }

    // Also attempt server sync if running full-stack
    try {
      fetch('/api/admin/child-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify(newChild),
      }).catch(() => {});
    } catch {
      // safe ignore
    }

    const current = getLocal<ChildCategory[]>(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);
    const existing = current.find((c) => c.id === id);
    const oldName = existing?.name;
    const oldSlug = existing?.slug;

    if (existing && (oldName !== newChild.name || oldSlug !== newChild.slug)) {
      // Cascade update products with this child category
      const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      let prodsChanged = false;
      prods.forEach((p) => {
        if (
          p.child_category_id === id ||
          p.childcategory_id === id ||
          (oldSlug && (p.child_category_slug === oldSlug || p.childcategory_slug === oldSlug)) ||
          (oldName && p.child_category && p.child_category.toLowerCase().trim() === oldName.toLowerCase().trim())
        ) {
          p.child_category = newChild.name;
          p.child_category_id = newChild.id;
          p.childcategory_id = newChild.id;
          p.child_category_slug = newChild.slug;
          p.childcategory_slug = newChild.slug;
          prodsChanged = true;
          setDoc(doc(db, 'products', String(p.id)), p, { merge: true }).catch(() => {});
        }
      });
      if (prodsChanged) {
        setLocal(PRODUCTS_KEY, prods);
        notifyProductsChanged();
      }
    }

    const idx = current.findIndex((c) => c.id === id || c.slug === slug);
    let updated: ChildCategory[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = newChild;
    } else {
      updated = [...current, newChild];
    }
    setLocal(CHILD_CATEGORIES_KEY, updated);
    notifyChildCategoriesChanged();

    return { success: true, childCategory: newChild };
  },

  async deleteChildCategory(childId: string, adminPassword?: string): Promise<{ success: boolean }> {
    try {
      await deleteDoc(doc(db, 'child_categories', childId));
    } catch (e) {
      console.warn('Firestore deleteChildCategory error:', e);
    }

    try {
      fetch(`/api/admin/child-categories/${childId}`, {
        method: 'DELETE',
        headers: {
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
      }).catch(() => {});
    } catch {
      // safe ignore
    }

    const current = getLocal<ChildCategory[]>(CHILD_CATEGORIES_KEY, INITIAL_CHILD_CATEGORIES);
    const updated = current.filter((c) => c.id !== childId);
    setLocal(CHILD_CATEGORIES_KEY, updated);
    notifyChildCategoriesChanged();

    return { success: true };
  },

  // 7. REVIEWS & RATINGS
  async getReviews(productId?: string): Promise<Review[]> {
    const local = getLocal<Review[]>(REVIEWS_KEY, INITIAL_REVIEWS);

    try {
      let q = query(collection(db, 'reviews'));
      if (productId) {
        q = query(collection(db, 'reviews'), where('product_id', '==', productId));
      }
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreRevs: Review[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Review;
          firestoreRevs.push({ ...d, id: String(d.id || docSnap.id) });
        });
        firestoreRevs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        
        // Merge with local to preserve immediate writes
        const map = new Map<string, Review>();
        local.forEach((r) => map.set(r.id, r));
        firestoreRevs.forEach((r) => map.set(r.id, r));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setLocal(REVIEWS_KEY, merged);
        return productId ? merged.filter((r) => r.product_id === productId) : merged;
      }
    } catch (e) {
      console.warn('Firestore getReviews error, falling back to local:', e);
    }

    // Try REST API fallback if available
    try {
      const url = productId ? `/api/reviews?product_id=${encodeURIComponent(productId)}` : '/api/reviews';
      const apiResult = await tryApi<{ success: boolean; reviews: Review[] }>(url);
      if (apiResult.success && Array.isArray(apiResult.data?.reviews)) {
        return apiResult.data.reviews;
      }
    } catch (e) {
      // ignore
    }

    if (productId) {
      return local.filter((r) => r.product_id === productId);
    }
    return local;
  },

  async addReview(reviewData: {
    product_id: string;
    rating: number;
    comment: string;
    user_name?: string;
  }): Promise<{ success: boolean; review: Review; error?: string }> {
    if (!reviewData.product_id) {
      return { success: false, error: 'Product ID is required.', review: null as any };
    }
    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(reviewData.rating) || 5)));
    const cleanComment = String(reviewData.comment || '').trim();
    if (!cleanComment) {
      return { success: false, error: 'Please enter a review comment.', review: null as any };
    }
    const cleanName = String(reviewData.user_name || '').trim() || 'Verified Customer';

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: reviewData.product_id,
      rating: cleanRating,
      comment: cleanComment,
      user_name: cleanName,
      created_at: new Date().toISOString(),
      verified_purchase: true,
    };

    // 1. Optimistically update local storage
    const current = getLocal<Review[]>(REVIEWS_KEY, INITIAL_REVIEWS);
    const updated = [newReview, ...current];
    setLocal(REVIEWS_KEY, updated);
    notifyReviewsChanged();

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'reviews', newReview.id), newReview);
    } catch (e) {
      console.warn('Firestore saveReview error:', e);
    }

    // 3. Sync with backend API if available
    try {
      await tryApi('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview),
      });
    } catch (e) {
      // non-blocking
    }

    return { success: true, review: newReview };
  },

  getProductRatingStats(productId: string, reviewsList?: Review[]): ProductRatingStats {
    const reviews = reviewsList || getLocal<Review[]>(REVIEWS_KEY, INITIAL_REVIEWS);
    const productReviews = reviews.filter((r) => r.product_id === productId);
    if (!productReviews.length) {
      return { average: 0, count: 0 };
    }
    const sum = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = Number((sum / productReviews.length).toFixed(1));
    return {
      average: avg,
      count: productReviews.length,
    };
  },

  getAllProductRatingStats(reviewsList?: Review[]): Record<string, ProductRatingStats> {
    const reviews = reviewsList || getLocal<Review[]>(REVIEWS_KEY, INITIAL_REVIEWS);
    const map: Record<string, { sum: number; count: number }> = {};

    for (const r of reviews) {
      if (!r.product_id) continue;
      if (!map[r.product_id]) {
        map[r.product_id] = { sum: 0, count: 0 };
      }
      map[r.product_id].sum += Number(r.rating) || 0;
      map[r.product_id].count += 1;
    }

    const result: Record<string, ProductRatingStats> = {};
    for (const pid in map) {
      const { sum, count } = map[pid];
      result[pid] = {
        average: count > 0 ? Number((sum / count).toFixed(1)) : 0,
        count,
      };
    }
    return result;
  },

  // 7. BRAND MANAGEMENT
  async getBrands(activeOnly: boolean = false): Promise<Brand[]> {
    let brands: Brand[] = [];
    let firestoreSuccess = false;

    // 1. Firestore
    try {
      const snap = await getDocs(collection(db, 'brands'));
      if (!snap.empty) {
        firestoreSuccess = true;
        snap.forEach((d) => {
          const item = d.data() as Brand;
          brands.push({ ...item, id: String(item.id || d.id) });
        });
        if (brands.length > 0) {
          setLocal(BRANDS_KEY, brands);
        }
      }
    } catch (e) {
      console.warn('Firestore getBrands error:', e);
    }

    // 2. REST API fallback
    if (!firestoreSuccess || brands.length === 0) {
      try {
        const apiResult = await tryApi<{ success: boolean; brands: Brand[] }>('/api/brands?all=true');
        if (apiResult.success && Array.isArray(apiResult.data?.brands) && apiResult.data.brands.length > 0) {
          brands = apiResult.data.brands;
          setLocal(BRANDS_KEY, brands);
        }
      } catch {
        // ignore
      }
    }

    // 3. Local Cache fallback
    if (brands.length === 0) {
      brands = getLocal<Brand[]>(BRANDS_KEY, INITIAL_BRANDS);
    }

    // Ensure all brands from products are represented
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const existingBrandNames = new Set(brands.map((b) => b.name.toLowerCase().trim()));
    let newBrandsFound = false;

    prods.forEach((p) => {
      const brandName = (p.brand || '').trim();
      if (brandName && brandName.toLowerCase() !== 'unbranded' && !existingBrandNames.has(brandName.toLowerCase())) {
        existingBrandNames.add(brandName.toLowerCase());
        const slug = generateSlug(brandName);
        brands.push({
          id: `brand-${slug || Date.now()}`,
          name: brandName,
          slug: slug || 'brand',
          active: 1,
          display_order: 99,
          description: `${brandName} genuine products with authentic warranty.`,
        });
        newBrandsFound = true;
      }
    });

    if (newBrandsFound) {
      setLocal(BRANDS_KEY, brands);
    }

    const sorted = [...brands].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    if (activeOnly) {
      return sorted.filter((b) => b.active !== 0 && b.active !== false && String(b.active) !== '0');
    }
    return sorted;
  },

  async saveBrand(brandData: Partial<Brand>, adminPassword?: string): Promise<{ success: boolean; brand: Brand }> {
    const rawName = (brandData.name || '').trim();
    const slug = (brandData.slug && brandData.slug.trim()) ? generateSlug(brandData.slug) : generateSlug(rawName);
    const id = brandData.id || `brand-${slug || Date.now()}`;

    const newBrand: Brand = {
      id,
      name: rawName || 'Other',
      slug: slug || 'other',
      logo_url: brandData.logo_url || '',
      description: brandData.description || '',
      display_order: Number(brandData.display_order ?? 99),
      active: brandData.active !== undefined ? (brandData.active ? 1 : 0) : 1,
      meta_title: brandData.meta_title || `${rawName} Products in Bangladesh | Maxora`,
      meta_description: brandData.meta_description || `Buy authentic ${rawName} products in Bangladesh at best prices on Maxora.`,
      meta_keywords: brandData.meta_keywords || `${rawName}, Maxora, Bangladesh, online shop`,
      created_at: brandData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Persist to Firestore
    try {
      await setDoc(doc(db, 'brands', id), newBrand, { merge: true });
    } catch (e) {
      console.warn('Firestore saveBrand error:', e);
    }

    // 2. Cascade update products if Brand name or slug changed
    const current = getLocal<Brand[]>(BRANDS_KEY, INITIAL_BRANDS);
    const existing = current.find((b) => b.id === id);
    const oldName = existing?.name;
    const oldSlug = existing?.slug;

    if (existing && (oldName !== newBrand.name || oldSlug !== newBrand.slug)) {
      const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
      let prodsChanged = false;
      prods.forEach((p) => {
        if (
          p.brand_id === id ||
          (oldSlug && p.brand_slug === oldSlug) ||
          (oldName && p.brand && p.brand.toLowerCase().trim() === oldName.toLowerCase().trim())
        ) {
          p.brand = newBrand.name;
          p.brand_id = newBrand.id;
          p.brand_slug = newBrand.slug;
          prodsChanged = true;
          setDoc(doc(db, 'products', String(p.id)), p, { merge: true }).catch(() => {});
        }
      });
      if (prodsChanged) {
        setLocal(PRODUCTS_KEY, prods);
        notifyProductsChanged();
      }
    }

    // 3. Update local cache
    const idx = current.findIndex((b) => b.id === id || b.slug === slug);
    let updated: Brand[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = newBrand;
    } else {
      updated = [...current, newBrand];
    }
    setLocal(BRANDS_KEY, updated);
    notifyBrandsChanged();

    // 4. REST API sync
    const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
    try {
      await tryApi('/api/admin/brands', {
        method: 'POST',
        headers: getAuthHeaders(pass),
        body: JSON.stringify(newBrand),
      });
    } catch {
      // non-blocking
    }

    return { success: true, brand: newBrand };
  },

  async deleteBrand(brandId: string, adminPassword?: string): Promise<{ success: boolean; affectedProductsCount: number }> {
    // 1. Delete from Firestore
    try {
      await deleteDoc(doc(db, 'brands', brandId));
    } catch (e) {
      console.warn('Firestore deleteBrand error:', e);
    }

    const current = getLocal<Brand[]>(BRANDS_KEY, INITIAL_BRANDS);
    const brandToDelete = current.find((b) => b.id === brandId);
    const brandName = brandToDelete?.name?.toLowerCase().trim();
    const brandSlug = brandToDelete?.slug?.toLowerCase().trim();

    const updated = current.filter((b) => b.id !== brandId);
    setLocal(BRANDS_KEY, updated);
    notifyBrandsChanged();

    // 2. Re-assign products belonging to this brand to "Other" so product data is never lost or orphaned
    const prods = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    let affectedCount = 0;
    let prodsChanged = false;

    prods.forEach((p) => {
      if (
        p.brand_id === brandId ||
        (brandSlug && (p.brand_slug || '').toLowerCase().trim() === brandSlug) ||
        (brandName && (p.brand || '').toLowerCase().trim() === brandName)
      ) {
        p.brand = 'Other';
        p.brand_id = 'brand-other';
        p.brand_slug = 'other';
        affectedCount++;
        prodsChanged = true;
        setDoc(doc(db, 'products', String(p.id)), {
          brand: 'Other',
          brand_id: 'brand-other',
          brand_slug: 'other',
        }, { merge: true }).catch(() => {});
      }
    });

    if (prodsChanged) {
      setLocal(PRODUCTS_KEY, prods);
      notifyProductsChanged();
    }

    // 3. REST API delete
    const pass = adminPassword || (typeof window !== 'undefined' ? localStorage.getItem('maxora_admin_password') : null) || '123456';
    try {
      await tryApi(`/api/admin/brands/${brandId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(pass),
      });
    } catch {
      // non-blocking
    }

    return { success: true, affectedProductsCount: affectedCount };
  },

  async getProductsByBrand(brandSlugOrName: string): Promise<Product[]> {
    const prods = await this.getProducts();
    const target = brandSlugOrName.toLowerCase().trim();
    return prods.filter((p) => {
      if (!p.active && p.active !== undefined && p.active !== 1) return false;
      const bName = (p.brand || '').toLowerCase().trim();
      const bSlug = (p.brand_slug || generateSlug(p.brand || '')).toLowerCase().trim();
      const bId = (p.brand_id || '').toLowerCase().trim();
      return bName === target || bSlug === target || bId === target;
    });
  },
};
