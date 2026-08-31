import { Product, StoreSettings, Customer, Order, OrderItem, DashboardTotals, OrderStatus } from '../types';
import { INITIAL_SETTINGS, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS } from '../data/initialData';

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

// Check if online API is reachable
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ? String((import.meta as any).env.VITE_API_URL).replace(/\/$/, '') : '';

async function tryApi<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T }> {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const res = await fetch(fullUrl, options);
    if (!res.ok) return { success: false };
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: false };
    }
    const json = await res.json();
    return { success: true, data: json };
  } catch {
    return { success: false };
  }
}

export const storeService = {
  // 1. SETTINGS
  async getSettings(): Promise<StoreSettings> {
    const local = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
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

    // Try API
    if (adminPassword) {
      await tryApi('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(newSettings),
      });
    }

    return { success: true, settings: updated };
  },

  async saveSettings(newSettings: Partial<StoreSettings>, adminPassword?: string): Promise<{ success: boolean; settings: StoreSettings }> {
    return this.updateSettings(newSettings, adminPassword);
  },

  // 2. PRODUCTS
  async getProducts(search = '', category = ''): Promise<Product[]> {
    let local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);

    // If local was empty for any reason, re-seed
    if (!local || local.length === 0) {
      local = INITIAL_PRODUCTS;
      setLocal(PRODUCTS_KEY, local);
    }

    const apiResult = await tryApi<{ success: boolean; products: Product[] }>(
      `/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`
    );

    if (apiResult.success && Array.isArray(apiResult.data?.products) && apiResult.data.products.length > 0) {
      setLocal(PRODUCTS_KEY, apiResult.data.products);
      return apiResult.data.products;
    }

    // Filter locally
    let list = local.filter((p) => p.active !== 0 && p.active !== false);

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
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);

    if (adminPassword) {
      const apiResult = await tryApi<{ success: boolean; products: Product[] }>('/api/admin/products', {
        headers: { 'x-admin-password': adminPassword },
      });
      if (apiResult.success && Array.isArray(apiResult.data?.products)) {
        setLocal(PRODUCTS_KEY, apiResult.data.products);
        return apiResult.data.products;
      }
    }

    return [...local].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async addProduct(productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product: Product }> {
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const newId = `prod-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    local.unshift(newProd);
    setLocal(PRODUCTS_KEY, local);

    if (adminPassword) {
      tryApi('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(newProd),
      });
    }

    return { success: true, product: newProd };
  },

  async updateProduct(id: string | number, productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product?: Product }> {
    const idStr = String(id);
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const index = local.findIndex((p) => String(p.id) === idStr);

    if (index === -1) {
      return { success: false };
    }

    const current = local[index];
    const sellingPrice = productData.selling_price !== undefined ? Number(productData.selling_price) : Number(current.selling_price);
    const discount = productData.discount !== undefined ? Number(productData.discount) : Number(current.discount);

    const updated: Product = {
      ...current,
      ...productData,
      selling_price: sellingPrice,
      discount: discount,
      final_price: Math.max(0, sellingPrice - discount),
      stock: productData.stock !== undefined ? Number(productData.stock) : Number(current.stock),
      updated_at: new Date().toISOString(),
    };

    local[index] = updated;
    setLocal(PRODUCTS_KEY, local);

    if (adminPassword) {
      tryApi(`/api/admin/products/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(updated),
      });
    }

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
    const filtered = local.filter((p) => String(p.id) !== idStr);
    setLocal(PRODUCTS_KEY, filtered);

    if (adminPassword) {
      tryApi(`/api/admin/products/${idStr}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
    }

    return { success: true };
  },

  // 3. ORDERS
  async getAllAdminOrders(statusFilter = '', adminPassword?: string): Promise<Order[]> {
    if (adminPassword) {
      const url = statusFilter ? `/api/admin/orders?status=${encodeURIComponent(statusFilter)}` : '/api/admin/orders';
      const apiResult = await tryApi<{ success: boolean; orders: Order[] }>(url, {
        headers: { 'x-admin-password': adminPassword },
      });
      if (apiResult.success && Array.isArray(apiResult.data?.orders)) {
        setLocal(ORDERS_KEY, apiResult.data.orders);
        return apiResult.data.orders;
      }
    }

    let orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    if (statusFilter) {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    return [...orders].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  },

  async updateOrderStatus(orderId: string | number, status: OrderStatus, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const index = orders.findIndex((o) => String(o.id) === idStr);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updated_at = new Date().toISOString();
      setLocal(ORDERS_KEY, orders);
    }

    if (adminPassword) {
      tryApi(`/api/admin/orders/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ status }),
      });
    }

    return { success: true };
  },

  async updateOrder(orderData: Partial<Order> & { id: string | number }, adminPassword?: string): Promise<{ success: boolean }> {
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

    if (adminPassword) {
      tryApi(`/api/admin/orders/${idStr}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(orderData),
      });
    }

    return { success: true };
  },

  async updateOrderDetails(orderData: Partial<Order> & { id: string | number }, adminPassword?: string): Promise<{ success: boolean }> {
    return this.updateOrder(orderData, adminPassword);
  },

  async deleteOrder(orderId: string | number, adminPassword?: string): Promise<{ success: boolean }> {
    const idStr = String(orderId);
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const filtered = orders.filter((o) => String(o.id) !== idStr && o.order_number !== idStr);
    setLocal(ORDERS_KEY, filtered);

    if (adminPassword) {
      tryApi(`/api/admin/orders/${idStr}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
    }

    return { success: true };
  },

  async getAllCustomers(adminPassword?: string): Promise<Customer[]> {
    if (adminPassword) {
      const apiResult = await tryApi<{ success: boolean; customers: Customer[] }>('/api/admin/customers', {
        headers: { 'x-admin-password': adminPassword },
      });
      if (apiResult.success && Array.isArray(apiResult.data?.customers)) {
        setLocal(CUSTOMERS_KEY, apiResult.data.customers);
        return apiResult.data.customers;
      }
    }

    const customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    return [...customers].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  },

  async getDashboardTotals(adminPassword?: string): Promise<DashboardTotals> {
    if (adminPassword) {
      const apiResult = await tryApi<{ success: boolean; totals: DashboardTotals }>('/api/admin/dashboard', {
        headers: { 'x-admin-password': adminPassword },
      });
      if (apiResult.success && apiResult.data?.totals) {
        return apiResult.data.totals;
      }
    }

    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const products = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);

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
