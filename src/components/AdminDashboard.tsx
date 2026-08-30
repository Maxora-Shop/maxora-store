import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  TrendingUp,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  DollarSign,
  Lock,
  Eye,
  LogOut,
  Save,
  Check,
  Globe,
  Share2,
  Megaphone,
  Sparkles,
  Code,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { Product, Order, Customer, StoreSettings, DashboardTotals, OrderStatus } from '../types';
import { BD_DISTRICTS, getThanasForDistrict } from '../data/bangladeshData';
import { storeService } from '../services/storeService';

interface AdminDashboardProps {
  onBackToStore: () => void;
  globalSettings: StoreSettings;
  onSettingsUpdated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore,
  globalSettings,
  onSettingsUpdated,
}) => {
  // Auth state
  const [password, setPassword] = useState(
    localStorage.getItem('maxora_admin_password') || '123456'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'settings'>('overview');

  // Data States
  const [totals, setTotals] = useState<DashboardTotals | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [bestProducts, setBestProducts] = useState<any[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(globalSettings);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalTab, setProductModalTab] = useState<'general' | 'seo'>('general');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'marketing'>('general');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Check auth on load
  useEffect(() => {
    verifyAdminAuth();
  }, []);

  useEffect(() => {
    if (globalSettings) {
      setSettingsForm(globalSettings);
    }
  }, [globalSettings]);

  const verifyAdminAuth = async (passToTry?: string) => {
    const p = passToTry !== undefined ? passToTry : password;
    setAuthLoading(true);
    setAuthError('');
    try {
      // Allow default password or verify with backend
      const expectedPass = localStorage.getItem('maxora_admin_password') || '123456';
      let isValid = p === expectedPass || p === '123456';

      try {
        const res = await fetch('/api/admin/me', {
          headers: { 'x-admin-password': p },
        });
        const data = await res.json();
        if (data.success) {
          isValid = true;
        }
      } catch {
        // Backend not available (e.g. Vercel static SPA), use local password
      }

      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('maxora_admin_password', p);
        loadTabData(currentTab, p);
      } else {
        setIsAuthenticated(false);
        setAuthError('Incorrect admin password. (Default: 123456)');
      }
    } catch (e: any) {
      setIsAuthenticated(false);
      setAuthError('Error: ' + e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadTabData = (tab: string, currentPassword = password) => {
    if (tab === 'overview') loadOverview(currentPassword);
    if (tab === 'products') loadProducts(currentPassword);
    if (tab === 'orders') loadOrders(currentPassword);
    if (tab === 'customers') loadCustomers(currentPassword);
    if (tab === 'settings') loadSettings(currentPassword);
  };

  const handleTabChange = (tab: 'overview' | 'products' | 'orders' | 'customers' | 'settings') => {
    setCurrentTab(tab);
    loadTabData(tab);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // =====================================
  // API LOADERS
  // =====================================
  const loadOverview = async (p = password) => {
    setLoading(true);
    try {
      const dataTotals = await storeService.getDashboardTotals(p);
      setTotals(dataTotals);
      const ordersList = await storeService.getAllAdminOrders('', p);
      setRecentOrders(ordersList.slice(0, 10));

      const productsList = await storeService.getAllAdminProducts(p);
      setBestProducts(productsList.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (p = password) => {
    setLoading(true);
    try {
      const list = await storeService.getAllAdminProducts(p);
      setProducts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (p = password) => {
    setLoading(true);
    try {
      const list = await storeService.getAllAdminOrders(orderStatusFilter, p);
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (p = password) => {
    setLoading(true);
    try {
      const list = await storeService.getAllCustomers(p);
      setCustomers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async (p = password) => {
    setLoading(true);
    try {
      const data = await storeService.getSettings();
      setSettingsForm(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // PRODUCT ACTIONS
  // =====================================
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    try {
      const isEditing = Boolean(editingProduct.id);
      if (isEditing && editingProduct.id) {
        await storeService.updateProduct(editingProduct.id, editingProduct, password);
      } else {
        await storeService.addProduct(editingProduct, password);
      }

      showToast(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
      setIsProductModalOpen(false);
      loadProducts();
      onSettingsUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await storeService.deleteProduct(id, password);
      showToast('Product deleted successfully');
      loadProducts();
      onSettingsUpdated();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // =====================================
  // ORDER ACTIONS
  // =====================================
  const handleQuickStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await storeService.updateOrderStatus(orderId, newStatus, password);
      showToast(`Order status updated to ${newStatus}`);
      loadOrders();
      if (currentTab === 'overview') loadOverview();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      await storeService.updateOrder(editingOrder, password);
      showToast('Order and customer details updated successfully!');
      setIsOrderModalOpen(false);
      loadOrders();
      if (currentTab === 'overview') loadOverview();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete Order #${orderNumber}? This cannot be undone.`)) {
      return;
    }

    try {
      await storeService.deleteOrder(orderId, password);
      showToast(`Order #${orderNumber} deleted successfully!`);
      if (isOrderModalOpen) {
        setIsOrderModalOpen(false);
      }
      loadOrders();
      if (currentTab === 'overview') loadOverview();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // =====================================
  // SETTINGS ACTIONS
  // =====================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeService.updateSettings(settingsForm, password);
      showToast('Store settings saved successfully!');
      onSettingsUpdated();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // =====================================
  // LOGIN SCREEN IF UNAUTHENTICATED
  // =====================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 font-black text-2xl flex items-center justify-center mx-auto shadow-md">
              M
            </div>
            <h2 className="text-2xl font-black text-white">Maxora Admin Portal</h2>
            <p className="text-xs text-zinc-400">
              Enter password to access store management dashboard
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAdminAuth(password);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                Admin Password (Default: 123456)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-zinc-950 border border-zinc-700 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-white text-zinc-950 font-extrabold text-sm hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onBackToStore}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
    const matchCat = !productCategoryFilter || p.category === productCategoryFilter;
    return matchSearch && matchCat;
  });

  const filteredOrders = orders.filter((o) => {
    const searchTarget = `${o.order_number} ${o.customer_name} ${o.phone} ${o.district}`.toLowerCase();
    const matchSearch = !orderSearch || searchTarget.includes(orderSearch.toLowerCase());
    const matchStatus = !orderStatusFilter || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const categoriesList = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Shipped':
      case 'Processing':
      case 'Confirmed':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
      case 'Returned':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs sm:text-sm font-bold animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-zinc-950 text-emerald-400 border-zinc-800'
              : 'bg-rose-900 text-rose-200 border-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-zinc-950 text-white p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 font-black text-xl flex items-center justify-center">
                M
              </div>
              <div>
                <h1 className="font-extrabold text-base leading-none">Maxora Admin</h1>
                <span className="text-[10px] text-zinc-500 font-mono">v1.2.0 • BD Store</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => handleTabChange('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'overview'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => handleTabChange('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'products'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('orders')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'orders'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('customers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'customers'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => handleTabChange('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'settings'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Store Settings</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-800 space-y-2">
          <button
            onClick={onBackToStore}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Go to Storefront</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-zinc-500 hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-screen">
        {/* ====================================================
            1. TAB: OVERVIEW
        ==================================================== */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Business Overview
                </h2>
                <p className="text-xs text-zinc-500">
                  Real-time sales & order statistics across Bangladesh
                </p>
              </div>

              <button
                onClick={() => loadOverview()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>

            {/* Metrics 8-Card Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Today's Sales</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    ৳
                  </div>
                </div>
                <div className="text-2xl font-black text-zinc-950">
                  ৳{(totals?.today_sales || 0).toLocaleString('en-BD')}
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">
                  {totals?.today_orders || 0} orders received today
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Monthly Sales</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-zinc-950">
                  ৳{(totals?.monthly_sales || 0).toLocaleString('en-BD')}
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">
                  {totals?.monthly_orders || 0} total monthly orders
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pending Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {totals?.pending || 0}
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">
                  Requires phone confirmation
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Delivered Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {totals?.delivered || 0}
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">
                  Successfully completed
                </div>
              </div>
            </div>

            {/* 2-Column Split: Recent Orders + Best Sellers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-zinc-900">
                    Recent Store Orders
                  </h3>
                  <button
                    onClick={() => handleTabChange('orders')}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 font-bold">
                        <th className="pb-3">Order ID</th>
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">District</th>
                        <th className="pb-3">Total</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-zinc-50/80">
                          <td className="py-3 font-mono font-bold text-zinc-900">
                            {ord.order_number}
                          </td>
                          <td className="py-3">
                            <div className="font-bold text-zinc-900">{ord.customer_name}</div>
                            <div className="text-zinc-400">{ord.phone}</div>
                          </td>
                          <td className="py-3 text-zinc-600">{ord.district}</td>
                          <td className="py-3 font-extrabold text-zinc-900">
                            ৳{Number(ord.total).toLocaleString('en-BD')}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(
                                ord.status
                              )}`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingOrder(ord);
                                  setIsOrderModalOpen(true);
                                }}
                                className="text-xs font-bold text-zinc-700 hover:text-zinc-950 px-2 py-1 hover:bg-zinc-100 rounded-md cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(ord.id, ord.order_number)}
                                title="Delete Order"
                                className="text-xs font-bold text-zinc-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {recentOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400">
                            No orders placed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Best Selling Products */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 space-y-4">
                <h3 className="font-extrabold text-base text-zinc-900">
                  Best Selling Items
                </h3>

                <div className="space-y-3">
                  {bestProducts.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs text-zinc-900 truncate">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {item.quantity} units sold
                        </div>
                      </div>
                      <div className="text-xs font-black text-emerald-700 shrink-0">
                        ৳{Number(item.sales).toLocaleString('en-BD')}
                      </div>
                    </div>
                  ))}
                  {bestProducts.length === 0 && (
                    <div className="py-8 text-center text-zinc-400 text-xs">
                      No sales recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            2. TAB: PRODUCTS MANAGEMENT
        ==================================================== */}
        {currentTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Products Management
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage inventory, pricing, SKU and product availability
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    category: 'Smart Gadgets',
                    sku: '',
                    buying_price: 0,
                    selling_price: 0,
                    discount: 0,
                    stock: 10,
                    badge: 'NEW',
                    image_url: '',
                    description: '',
                    featured: 0,
                    active: 1,
                    meta_title: '',
                    meta_description: '',
                    meta_keywords: '',
                    slug: '',
                    brand: 'Maxora',
                    og_image: '',
                  });
                  setProductModalTab('general');
                  setIsProductModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs sm:text-sm hover:bg-zinc-800 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {/* Product Filters Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search product by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 text-zinc-700"
                >
                  <option value="">All Categories</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => loadProducts()}
                  className="p-2 border border-zinc-300 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                  title="Reload"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Buy Price</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4">Discount</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {filteredProducts.map((p) => {
                      const finalPrice = Math.max(0, Number(p.selling_price || 0) - Number(p.discount || 0));
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/70">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0 border border-zinc-200"
                              />
                              <div>
                                <div className="font-bold text-zinc-900 line-clamp-1">{p.name}</div>
                                {p.badge && (
                                  <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-600">{p.category}</td>
                          <td className="p-4 font-mono text-zinc-500">{p.sku || '-'}</td>
                          <td className="p-4 text-zinc-600">৳{Number(p.buying_price).toLocaleString('en-BD')}</td>
                          <td className="p-4 font-bold text-zinc-900">
                            ৳{Number(p.selling_price).toLocaleString('en-BD')}
                          </td>
                          <td className="p-4 text-rose-600">
                            {Number(p.discount || 0) > 0 ? `৳${Number(p.discount).toLocaleString('en-BD')}` : '-'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`font-bold ${
                                Number(p.stock) <= 0
                                  ? 'text-rose-600'
                                  : Number(p.stock) <= 5
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                p.active !== 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-zinc-200 text-zinc-600'
                              }`}
                            >
                              {p.active !== 0 ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct({
                                    ...p,
                                    meta_title: p.meta_title || '',
                                    meta_description: p.meta_description || '',
                                    meta_keywords: p.meta_keywords || '',
                                    slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''),
                                    brand: p.brand || 'Maxora',
                                    og_image: p.og_image || p.image_url || '',
                                  });
                                  setProductModalTab('seo');
                                  setIsProductModalOpen(true);
                                }}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="SEO & Google Rank Settings"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                SEO
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct({
                                    ...p,
                                    meta_title: p.meta_title || '',
                                    meta_description: p.meta_description || '',
                                    meta_keywords: p.meta_keywords || '',
                                    slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''),
                                    brand: p.brand || 'Maxora',
                                    og_image: p.og_image || p.image_url || '',
                                  });
                                  setProductModalTab('general');
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-zinc-400">
                          No products found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            3. TAB: ORDERS MANAGEMENT
        ==================================================== */}
        {currentTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Orders Management
                </h2>
                <p className="text-xs text-zinc-500">
                  Process orders, update delivery status and view order details
                </p>
              </div>

              <button
                onClick={() => loadOrders()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Orders
              </button>
            </div>

            {/* Orders Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search order number, customer, phone, district..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-zinc-50 border border-zinc-300 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 text-zinc-700"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">District & Thana</th>
                      <th className="p-4">Delivery Charge</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Current Status</th>
                      <th className="p-4 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-50/70">
                        <td className="p-4">
                          <div className="font-mono font-bold text-zinc-950 text-sm">
                            {ord.order_number}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {new Date(ord.created_at).toLocaleDateString('en-BD')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-zinc-900">{ord.customer_name}</div>
                          <div className="text-zinc-500">{ord.phone}</div>
                          {ord.alt_phone && (
                            <div className="text-[10px] text-zinc-400">Alt: {ord.alt_phone}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-zinc-900">{ord.district}</div>
                          <div className="text-zinc-500 text-[11px]">{ord.area}</div>
                        </td>
                        <td className="p-4 text-zinc-600">
                          ৳{Number(ord.delivery_charge || 0).toLocaleString('en-BD')}
                        </td>
                        <td className="p-4">
                          <div className="font-black text-zinc-950 text-sm">
                            ৳{Number(ord.total).toLocaleString('en-BD')}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Cash on Delivery
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleQuickStatusUpdate(ord.id, e.target.value as OrderStatus)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${getStatusBadgeClass(
                              ord.status
                            )}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingOrder(ord);
                                setIsOrderModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Details & Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(ord.id, ord.order_number)}
                              title="Delete this order"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-400">
                          No orders found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            4. TAB: CUSTOMERS
        ==================================================== */}
        {currentTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Customers Directory
                </h2>
                <p className="text-xs text-zinc-500">
                  Customer profiles, address history and lifetime purchase volume
                </p>
              </div>

              <button
                onClick={() => loadCustomers()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Mobile Number</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">District</th>
                      <th className="p-4">Area / Thana</th>
                      <th className="p-4">Total Orders</th>
                      <th className="p-4 text-right">Lifetime Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/70">
                        <td className="p-4 font-bold text-zinc-900">{c.name}</td>
                        <td className="p-4 font-mono text-zinc-700">{c.phone}</td>
                        <td className="p-4 text-zinc-500">{c.email || '-'}</td>
                        <td className="p-4 text-zinc-700">{c.district || '-'}</td>
                        <td className="p-4 text-zinc-500">{c.area || '-'}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold">
                            {c.total_orders || 1} orders
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-emerald-700 text-sm">
                          ৳{Number(c.total_spent || 0).toLocaleString('en-BD')}
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-400">
                          No customer profiles recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            5. TAB: STORE SETTINGS
        ==================================================== */}
        {currentTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  Store & Marketing Settings
                </h2>
                <p className="text-xs text-zinc-500">
                  Manage branding, hotline, delivery rates, Facebook/Google Ads pixels & Google SEO
                </p>
              </div>

              {/* Settings Sub-tabs */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('general')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === 'general'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  🏢 Store & Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('marketing')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    settingsSubTab === 'marketing'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5 text-blue-600" />
                  Marketing & Pixels
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-5">
              {settingsSubTab === 'general' ? (
                <>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Branding & Contact
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={settingsForm.store_name || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Helpline Mobile Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.phone || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          placeholder="e.g. 01700-123456"
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          WhatsApp Number (For Order Inquiries)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.whatsapp || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                          placeholder="e.g. +8801700123456"
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Facebook Page / Group URL
                        </label>
                        <input
                          type="text"
                          value={settingsForm.facebook || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, facebook: e.target.value })}
                          placeholder="https://facebook.com/..."
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Store Tagline
                      </label>
                      <input
                        type="text"
                        value={settingsForm.store_tagline || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, store_tagline: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Promo / Header Announcement Bar Text
                      </label>
                      <input
                        type="text"
                        value={settingsForm.promo_text || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, promo_text: e.target.value })}
                        placeholder="Cash on Delivery Available Across Bangladesh"
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Hero Title
                      </label>
                      <input
                        type="text"
                        value={settingsForm.hero_title || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Hero Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={settingsForm.hero_subtitle || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none"
                      />
                    </div>
                  </div>

                  {/* Delivery Tariffs */}
                  <div className="pt-4 border-t border-zinc-200 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Delivery Rates (Bangladesh Taka ৳)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Inside Dhaka City (৳)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.delivery_inside_dhaka || 70}
                          onChange={(e) => setSettingsForm({ ...settingsForm, delivery_inside_dhaka: e.target.value })}
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Dhaka Sub-Area (৳)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.delivery_sub_dhaka || 100}
                          onChange={(e) => setSettingsForm({ ...settingsForm, delivery_sub_dhaka: e.target.value })}
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Outside Dhaka (৳)
                        </label>
                        <input
                          type="number"
                          value={settingsForm.delivery_outside_dhaka || 130}
                          onChange={(e) => setSettingsForm({ ...settingsForm, delivery_outside_dhaka: e.target.value })}
                          className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer text */}
                  <div className="pt-4 border-t border-zinc-200">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Footer Copyright Text
                    </label>
                    <input
                      type="text"
                      value={settingsForm.footer_text || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, footer_text: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </>
              ) : (
                /* ====================================================
                   MARKETING, ADS PIXELS & SEO TAB
                ==================================================== */
                <div className="space-y-6">
                  {/* Meta / Facebook Pixel */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          f
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-900">
                            Meta / Facebook Pixel ID
                          </h4>
                          <p className="text-[11px] text-zinc-500">
                            Automatically tracks PageView, ViewContent, AddToCart, InitiateCheckout & Purchase (with BDT total)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="e.g. 123456789012345"
                        value={settingsForm.meta_pixel_id || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, meta_pixel_id: e.target.value })}
                        className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-blue-200 focus:outline-none focus:border-blue-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Google Tag / GA4 / Google Ads */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        G
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-900">
                          Google Tag / Google Ads / GA4 Measurement ID
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Integrates Google Ads conversions & Google Analytics 4 (e.g. G-XXXXX or AW-XXXXX)
                        </p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="e.g. G-XXXXXXXXXX or AW-XXXXXXXXXX"
                        value={settingsForm.google_tag_id || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, google_tag_id: e.target.value })}
                        className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* TikTok Pixel */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                        TT
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-900">
                          TikTok Pixel ID
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Track TikTok ads traffic & conversions
                        </p>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="e.g. CXXXXXXXXXXXXXXX"
                        value={settingsForm.tiktok_pixel_id || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tiktok_pixel_id: e.target.value })}
                        className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Global Homepage SEO */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Global Homepage Google SEO
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Homepage Meta Title (Google SERP Title)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maxora BD | Premium Smart Gadgets & Lifestyle Store"
                        value={settingsForm.site_meta_title || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_meta_title: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Homepage Meta Description (Google Search Snippet)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Shop genuine smartwatches, wireless earbuds and gadgets in Bangladesh. Fast Cash on Delivery across 64 districts..."
                        value={settingsForm.site_meta_description || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_meta_description: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Global Target Keywords (Comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="smartwatch bd, earbuds price in bangladesh, gadgets online shop dhaka"
                        value={settingsForm.site_meta_keywords || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, site_meta_keywords: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Sitemap & Crawler Links */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                    <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Google Search Console & Crawlers (Ready)
                    </h4>
                    <p className="text-xs text-amber-800">
                      Your store dynamically serves standard Google-compliant XML Sitemap and Robots.txt files:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white text-zinc-800 rounded-xl border border-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View /sitemap.xml
                      </a>
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white text-zinc-800 rounded-xl border border-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View /robots.txt
                      </a>
                    </div>
                  </div>

                  {/* Custom Header Code / Verification Tags */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Custom Header Code / Meta Verification (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder='<meta name="facebook-domain-verification" content="..." />'
                      value={settingsForm.custom_head_code || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, custom_head_code: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-mono resize-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Store Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ====================================================
          PRODUCT MODAL (ADD / EDIT with SEO & Ads Rank)
      ==================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-base text-zinc-900">
                  {editingProduct?.id ? 'Edit Product' : 'Add New Product'}
                </h3>

                {/* Modal Subtabs */}
                <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setProductModalTab('general')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      productModalTab === 'general'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    📦 Basic Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductModalTab('seo')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      productModalTab === 'seo'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-zinc-600 hover:text-blue-700'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Google SEO & Ads
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              {productModalTab === 'general' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maxora AMOLED Smartwatch Series 9"
                      value={editingProduct?.name || ''}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        setEditingProduct({
                          ...editingProduct,
                          name: newName,
                          slug: editingProduct?.slug || autoSlug,
                        });
                      }}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        placeholder="Smart Gadgets, Audio, Bags..."
                        value={editingProduct?.category || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        SKU Code
                      </label>
                      <input
                        type="text"
                        placeholder="MX-SW-09"
                        value={editingProduct?.sku || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Buying Price (৳)
                      </label>
                      <input
                        type="number"
                        value={editingProduct?.buying_price || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, buying_price: Number(e.target.value) })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Selling Price (৳)
                      </label>
                      <input
                        type="number"
                        required
                        value={editingProduct?.selling_price || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, selling_price: Number(e.target.value) })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Discount (৳)
                      </label>
                      <input
                        type="number"
                        value={editingProduct?.discount || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, discount: Number(e.target.value) })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 text-rose-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={editingProduct?.stock || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Badge Label
                      </label>
                      <input
                        type="text"
                        placeholder="HOT DEAL, NEW, BESTSELLER"
                        value={editingProduct?.badge || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Product Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingProduct?.image_url || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Key features, specs, warranty info..."
                      value={editingProduct?.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Featured Product
                      </label>
                      <select
                        value={editingProduct?.featured ? 1 : 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, featured: Number(e.target.value) })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                      >
                        <option value={0}>No</option>
                        <option value={1}>Yes (Featured)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Visibility
                      </label>
                      <select
                        value={editingProduct?.active !== 0 ? 1 : 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, active: Number(e.target.value) })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                      >
                        <option value={1}>Active in Store</option>
                        <option value={0}>Hidden</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* ====================================================
                   PRODUCT SEO & GOOGLE RANK TAB
                ==================================================== */
                <div className="space-y-4">
                  {/* Auto-generate SEO Helper button */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-100">
                    <div>
                      <h4 className="font-extrabold text-xs text-blue-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Smart SEO Generator
                      </h4>
                      <p className="text-[11px] text-blue-800">
                        Auto-generate Google ranking titles, description & keywords based on product details
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!editingProduct?.name) return;
                        const name = editingProduct.name;
                        const finalPrice = Math.max(0, Number(editingProduct.selling_price || 0) - Number(editingProduct.discount || 0));
                        const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const autoTitle = `${name} Price in BD (৳${finalPrice}) | Maxora`;
                        const autoDesc = `Buy ${name} online in Bangladesh at best price (৳${finalPrice}). 100% genuine product, fast Cash on Delivery across 64 districts & 7-day warranty support.`;
                        const autoKeywords = `${name}, ${name} price in bangladesh, buy ${editingProduct.category || 'gadgets'} bd, best price ${name}`;

                        setEditingProduct({
                          ...editingProduct,
                          meta_title: autoTitle,
                          meta_description: autoDesc,
                          meta_keywords: autoKeywords,
                          slug: autoSlug,
                          brand: editingProduct.brand || 'Maxora',
                          og_image: editingProduct.og_image || editingProduct.image_url || '',
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      ✨ Auto Generate
                    </button>
                  </div>

                  {/* Meta Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700">
                        Google SEO Title (Meta Title)
                      </label>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          (editingProduct?.meta_title || '').length > 60
                            ? 'text-amber-600'
                            : 'text-zinc-400'
                        }`}
                      >
                        {(editingProduct?.meta_title || '').length}/60 chars (Recommended: 50-60)
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Maxora Ultra AMOLED Smartwatch 9 Price in Bangladesh | Maxora"
                      value={editingProduct?.meta_title || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, meta_title: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700">
                        Google Search Snippet Description (Meta Description)
                      </label>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          (editingProduct?.meta_description || '').length > 160
                            ? 'text-amber-600'
                            : 'text-zinc-400'
                        }`}
                      >
                        {(editingProduct?.meta_description || '').length}/160 chars (Recommended: 120-160)
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="e.g. Buy Maxora Ultra AMOLED Smartwatch Series 9 online in BD with Bluetooth calling, IP68 water resistance & 100% Cash on Delivery across all 64 districts."
                      value={editingProduct?.meta_description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, meta_description: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* URL Slug */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        URL Slug (Search Friendly Link)
                      </label>
                      <input
                        type="text"
                        placeholder="maxora-ultra-amoled-smartwatch-9"
                        value={editingProduct?.slug || ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                          })
                        }
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900 font-mono"
                      />
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Brand Name (For Google Schema)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maxora"
                        value={editingProduct?.brand || 'Maxora'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Target Keywords */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Focus Keywords / Search Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="smartwatch bd, calling watch price bangladesh, cash on delivery gadget"
                      value={editingProduct?.meta_keywords || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, meta_keywords: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  {/* Custom Social Share Image (OG Image) */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Social Share / Meta Ads Image URL (OG:Image)
                    </label>
                    <input
                      type="url"
                      placeholder="Defaults to product main image URL if empty"
                      value={editingProduct?.og_image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, og_image: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-zinc-900"
                    />
                  </div>

                  {/* LIVE GOOGLE SERP PREVIEW BOX */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1 text-zinc-800">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        Live Google Search Preview (SERP)
                      </span>
                      <span>Desktop & Mobile snippet</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600 truncate">
                        <div className="w-4 h-4 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-700">
                          M
                        </div>
                        <span className="text-zinc-700 font-medium">maxora.store</span>
                        <span className="text-zinc-400">› product › {editingProduct?.slug || 'item-name'}</span>
                      </div>

                      <h4 className="text-sm font-semibold text-blue-800 hover:underline line-clamp-1">
                        {editingProduct?.meta_title || editingProduct?.name || 'Product Title on Google Search BD'}
                      </h4>

                      {/* Google Rich Snippet Rating & Stock badge */}
                      <div className="flex items-center gap-2 text-xs text-zinc-600">
                        <span className="text-amber-500 font-bold">★★★★★ 4.9</span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-emerald-700 font-bold">
                          {Number(editingProduct?.stock || 1) > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <span className="text-zinc-400">·</span>
                        <span className="font-bold text-zinc-900">
                          ৳{Math.max(0, Number(editingProduct?.selling_price || 0) - Number(editingProduct?.discount || 0)).toLocaleString('en-BD')}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {editingProduct?.meta_description ||
                          editingProduct?.description ||
                          'Buy this product online in Bangladesh at the best price with Cash on Delivery across 64 districts.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
                >
                  Save Product & SEO Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          ORDER MODAL (EDIT & DETAILS)
      ==================================================== */}
      {isOrderModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900">
                  Edit Order #{editingOrder.order_number}
                </h3>
                <span className="text-xs text-zinc-500 font-mono">ID: {editingOrder.id}</span>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editingOrder.customer_name}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingOrder.phone}
                    onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    District
                  </label>
                  <select
                    value={editingOrder.district}
                    onChange={(e) => setEditingOrder({ ...editingOrder, district: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Area / Thana
                  </label>
                  <select
                    value={editingOrder.area}
                    onChange={(e) => setEditingOrder({ ...editingOrder, area: e.target.value })}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                  >
                    {getThanasForDistrict(editingOrder.district || 'Dhaka').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    {editingOrder.area && !getThanasForDistrict(editingOrder.district || 'Dhaka').includes(editingOrder.area) && (
                      <option value={editingOrder.area}>{editingOrder.area}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Full Address
                </label>
                <textarea
                  rows={2}
                  value={editingOrder.address}
                  onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                  className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Subtotal (৳)
                  </label>
                  <input
                    type="number"
                    value={editingOrder.subtotal}
                    onChange={(e) => {
                      const sub = Number(e.target.value);
                      setEditingOrder({
                        ...editingOrder,
                        subtotal: sub,
                        total: sub + Number(editingOrder.delivery_charge || 0),
                      });
                    }}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Delivery (৳)
                  </label>
                  <input
                    type="number"
                    value={editingOrder.delivery_charge}
                    onChange={(e) => {
                      const del = Number(e.target.value);
                      setEditingOrder({
                        ...editingOrder,
                        delivery_charge: del,
                        total: Number(editingOrder.subtotal || 0) + del,
                      });
                    }}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Grand Total (৳)
                  </label>
                  <input
                    type="number"
                    value={editingOrder.total}
                    onChange={(e) => setEditingOrder({ ...editingOrder, total: Number(e.target.value) })}
                    className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Order Status
                </label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as OrderStatus })}
                  className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 font-bold"
                >
                  <option value="Pending">Pending (Awaiting phone confirmation)</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing (Packaging)</option>
                  <option value="Shipped">Shipped (With courier)</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Order Note / Remarks
                </label>
                <input
                  type="text"
                  value={editingOrder.note || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, note: e.target.value })}
                  className="w-full bg-zinc-50 text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(editingOrder.id, editingOrder.order_number)}
                  className="px-4 py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-all border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Order
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
                >
                  Update Order Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
