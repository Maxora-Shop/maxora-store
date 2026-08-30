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
async function tryApi<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T }> {
  try {
    const res = await fetch(url, options);
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

  async updateProduct(id: string, productData: Partial<Product>, adminPassword?: string): Promise<{ success: boolean; product?: Product }> {
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const index = local.findIndex((p) => p.id === id);

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
      tryApi(`/api/admin/products/${id}`, {
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

  async deleteProduct(id: string, adminPassword?: string): Promise<{ success: boolean }> {
    const local = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const filtered = local.filter((p) => p.id !== id);
    setLocal(PRODUCTS_KEY, filtered);

    if (adminPassword) {
      tryApi(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword },
      });
    }

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
    // Try backend API first
    const apiResult = await tryApi<{ success: boolean; message?: string; order?: any; error?: string }>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (apiResult.success && apiResult.data?.order) {
      // Also save to local store
      const localOrders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
      localOrders.unshift(apiResult.data.order);
      setLocal(ORDERS_KEY, localOrders);
      return { success: true, order: apiResult.data.order };
    }

    // Local fallback order creation
    const settings = getLocal<StoreSettings>(SETTINGS_KEY, INITIAL_SETTINGS);
    const products = getLocal<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    const orderId = `ord-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    for (const item of orderPayload.items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (!prod) {
        return { success: false, error: `Product '${item.name || item.product_id}' was not found.` };
      }

      const qty = Math.max(1, Number(item.quantity || 1));
      const discount = Number(prod.discount || 0);
      const price = Number(prod.selling_price || 0);
      const finalPrice = Math.max(0, price - discount);
      const lineTotal = finalPrice * qty;

      subtotal += lineTotal;
      orderItems.push({
        id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        order_id: orderId,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku || '',
        quantity: qty,
        unit_price: finalPrice,
        buying_price: Number(prod.buying_price || 0),
        line_total: lineTotal,
        image_url: prod.image_url,
      });

      // Reduce stock locally
      prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
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

    // Customer
    const customers = getLocal<Customer[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    let customer = customers.find((c) => c.phone === orderPayload.phone);
    const customerId = customer?.id || `cust-${Date.now().toString(36)}`;

    if (customer) {
      customer.name = orderPayload.customer_name;
      customer.alt_phone = orderPayload.alt_phone || customer.alt_phone || '';
      customer.email = orderPayload.email || customer.email || '';
      customer.district = orderPayload.district;
      customer.area = orderPayload.area;
      customer.address = orderPayload.address;
      customer.total_orders = (customer.total_orders || 0) + 1;
      customer.total_spent = (customer.total_spent || 0) + total;
      customer.updated_at = new Date().toISOString();
    } else {
      customer = {
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
      customers.push(customer);
    }
    setLocal(CUSTOMERS_KEY, customers);

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

    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    orders.unshift(newOrder);
    setLocal(ORDERS_KEY, orders);

    return { success: true, order: newOrder };
  },

  async trackOrder(query: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    const q = query.trim().toLowerCase();
    const apiResult = await tryApi<{ success: boolean; order?: Order; error?: string }>(
      `/api/orders/track/${encodeURIComponent(query.trim())}`
    );

    if (apiResult.success && apiResult.data?.order) {
      return { success: true, order: apiResult.data.order };
    }

    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const order = orders.find(
      (o) =>
        o.order_number.toLowerCase() === q ||
        o.phone.toLowerCase() === q ||
        o.id.toLowerCase() === q
    );

    if (!order) {
      return { success: false, error: 'No order found matching this order number or phone.' };
    }

    return { success: true, order };
  },

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

  async updateOrderStatus(orderId: string, status: OrderStatus, adminPassword?: string): Promise<{ success: boolean }> {
    const orders = getLocal<Order[]>(ORDERS_KEY, INITIAL_ORDERS);
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updated_at = new Date().toISOString();
      setLocal(ORDERS_KEY, orders);
    }

    if (adminPassword) {
      tryApi(`/api/admin/orders/${orderId}`, {
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
    const todayOrders = nonCancelled.filter((o) => o.created_at && o.created_at.startsWith(today));
    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const monthlyOrders = nonCancelled.filter((o) => o.created_at && o.created_at.startsWith(thisMonth));
    const monthlySales = monthlyOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const delivered = orders.filter((o) => o.status === 'Delivered').length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const processing = orders.filter((o) => ['Confirmed', 'Processing', 'Shipped'].includes(o.status)).length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;
    const returned = orders.filter((o) => o.status === 'Returned').length;
    const activeProducts = products.filter((p) => p.active !== 0 && p.active !== false).length;

    return {
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
      customers: customers.length,
    };
  },
};
