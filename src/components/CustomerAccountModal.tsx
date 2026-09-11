import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  UserCheck,
  ShoppingBag,
  Heart,
  Truck,
  FileText,
  LogOut,
  Lock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Clock,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Customer, Order, Product, StoreSettings } from '../types';
import { storeService } from '../services/storeService';

const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Chattogram', 'Gazipur', 'Narayanganj', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh',
  'Bagerhat', 'Bandarban', 'Barguna', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 'Chapai Nawabganj', 'Chuadanga',
  'Cox\'s Bazar', 'Cumilla', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gopalganj', 'Habiganj', 'Jamalpur',
  'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Kishoreganj', 'Kurigram', 'Kushtia',
  'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj',
  'Naogaon', 'Narail', 'Narsingdi', 'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh',
  'Patuakhali', 'Pirojpur', 'Rajbari', 'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Tangail', 'Thakurgaon'
];

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  wishlistProducts: Product[];
  onRemoveWishlist?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  onOpenInvoice?: (order: Order) => void;
  onOpenProduct?: (product: Product) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  settings,
  wishlistProducts,
  onRemoveWishlist,
  onAddToCart,
  onOpenInvoice,
  onOpenProduct,
}) => {
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'tracking' | 'saved' | 'profile'>('orders');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDistrict, setRegDistrict] = useState('Dhaka');
  const [regArea, setRegArea] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Customer orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileAltPhone, setProfileAltPhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileDistrict, setProfileDistrict] = useState('Dhaka');
  const [profileArea, setProfileArea] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Tracking query state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Synchronize customer session
  const refreshCustomer = () => {
    const cust = storeService.getCurrentCustomer();
    setCurrentCustomer(cust);
    if (cust) {
      setProfileName(cust.name || '');
      setProfileAltPhone(cust.alt_phone || '');
      setProfileEmail(cust.email || '');
      setProfileDistrict(cust.district || 'Dhaka');
      setProfileArea(cust.area || '');
      setProfileAddress(cust.address || '');
      loadOrders(cust);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCustomer();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleAuthEvent = () => refreshCustomer();
    window.addEventListener('maxora_customer_auth_changed', handleAuthEvent);
    return () => window.removeEventListener('maxora_customer_auth_changed', handleAuthEvent);
  }, []);

  const loadOrders = async (cust: Customer) => {
    setOrdersLoading(true);
    try {
      const myOrders = await storeService.getCustomerOrders(cust.phone || cust.id);
      setOrders(myOrders);
    } catch (e) {
      console.error('Failed to load customer orders:', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  if (!isOpen) return null;

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await storeService.customerLogin(loginPhoneOrEmail, loginPassword);
      if (res.success && res.customer) {
        setCurrentCustomer(res.customer);
        loadOrders(res.customer);
      } else {
        setLoginError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch {
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      const res = await storeService.customerRegister({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
        district: regDistrict,
        area: regArea,
        address: regAddress,
      });
      if (res.success && res.customer) {
        setCurrentCustomer(res.customer);
        loadOrders(res.customer);
      } else {
        setRegError(res.error || 'Failed to create account.');
      }
    } catch {
      setRegError('An unexpected error occurred. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoginPhoneOrEmail('01711223344');
    setLoginPassword('123456');
    setLoginLoading(true);
    try {
      const res = await storeService.customerLogin('01711223344', '123456');
      if (res.success && res.customer) {
        setCurrentCustomer(res.customer);
        loadOrders(res.customer);
      } else {
        // Create demo customer
        const regRes = await storeService.customerRegister({
          name: 'Tanvir Ahmed',
          phone: '01711223344',
          email: 'tanvir@example.com',
          password: '123456',
          district: 'Dhaka',
          area: 'Gulshan 2',
          address: 'House 14, Road 11, Block D',
        });
        if (regRes.customer) {
          setCurrentCustomer(regRes.customer);
          loadOrders(regRes.customer);
        }
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    storeService.customerLogout();
    setCurrentCustomer(null);
    setOrders([]);
    setActiveTab('orders');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const res = await storeService.updateCustomerProfile(currentCustomer.id, {
        name: profileName,
        alt_phone: profileAltPhone,
        email: profileEmail,
        district: profileDistrict,
        area: profileArea,
        address: profileAddress,
      });
      if (res.success) {
        setProfileSuccess('Profile details updated successfully!');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError(res.error || 'Failed to update profile.');
      }
    } catch {
      setProfileError('An unexpected error occurred.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackedOrder(null);
    try {
      const found = await storeService.trackOrder(trackQuery.trim());
      if (found) {
        setTrackedOrder(found);
      } else {
        setTrackError('No order found with this tracking number or phone number.');
      }
    } catch {
      setTrackError('Could not retrieve tracking details. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status || 'Pending';
    switch (s) {
      case 'Delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">Delivered</span>;
      case 'Shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-200">Shipped</span>;
      case 'Processing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">Processing</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">Confirmed</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
    }
  };

  return (
    <div
      id="customer-account-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="customer-account-modal-dialog"
        className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-zinc-950 text-white p-3.5 sm:p-5 flex items-center justify-between gap-3 shrink-0 border-b border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center shadow-xs shrink-0">
              {currentCustomer ? (currentCustomer.name ? currentCustomer.name.charAt(0).toUpperCase() : 'C') : <User className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                {currentCustomer ? `Hi, ${currentCustomer.name}` : 'Customer Account'}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                {currentCustomer ? (currentCustomer.phone || 'Verified Customer') : 'Manage your orders, tracking & saved products'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentCustomer && (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-rose-300 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
                title="Logout from customer account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!currentCustomer ? (
            /* =========================================================================
               AUTH VIEW: LOGIN / REGISTER FOR GUEST USERS
            ========================================================================= */
            <div className="p-4 sm:p-6 space-y-5">
              {/* Segmented Tab Switcher */}
              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer text-center ${
                    authMode === 'login'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setRegError('');
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer text-center ${
                    authMode === 'register'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Login Form */}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                      Phone Number or Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. 01711223344 or name@email.com"
                        value={loginPhoneOrEmail}
                        onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none transition-all"
                      />
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Use the phone number you used during your order checkout
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-800">
                        Password (Optional for phone sign-in)
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter account password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none transition-all"
                      />
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2.5 sm:py-3 bg-zinc-950 hover:bg-zinc-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Sign In to Account</span>
                      </>
                    )}
                  </button>

                  {/* One-click demo login for reviewer / testers */}
                  <div className="pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>⚡ 1-Click Demo Login (Tanvir Ahmed)</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister} className="space-y-3.5">
                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanvir Ahmed"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Mobile Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 01711223344"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. name@domain.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Password (Optional)
                      </label>
                      <input
                        type="password"
                        placeholder="Account password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Delivery District
                      </label>
                      <select
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      >
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Thana / Area (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mirpur, Dhanmondi"
                        value={regArea}
                        onChange={(e) => setRegArea(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Street Address (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. House 12, Road 4, Sector 7"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-2.5 sm:py-3 bg-zinc-950 hover:bg-zinc-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {regLoading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* =========================================================================
               LOGGED IN CUSTOMER DASHBOARD
            ========================================================================= */
            <div className="flex flex-col h-full">
              {/* Profile Subheader with Stat Badges */}
              <div className="bg-zinc-50 border-b border-zinc-200 p-3 sm:p-4 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Customer
                  </span>
                  {currentCustomer.district && (
                    <span className="text-[11px] font-semibold text-zinc-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      {currentCustomer.district}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="bg-white px-2.5 py-1 rounded-lg border border-zinc-200 font-bold text-zinc-800 shadow-2xs">
                    Orders: <span className="text-emerald-700">{orders.length}</span>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded-lg border border-zinc-200 font-bold text-zinc-800 shadow-2xs">
                    Saved: <span className="text-rose-600">{wishlistProducts.length}</span>
                  </div>
                </div>
              </div>

              {/* Customer Account Navigation Tabs */}
              <div className="flex items-center border-b border-zinc-200 px-3 sm:px-4 bg-white overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'orders'
                      ? 'border-zinc-950 text-zinc-950'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>My Orders ({orders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tracking')}
                  className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'tracking'
                      ? 'border-zinc-950 text-zinc-950'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('saved')}
                  className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'saved'
                      ? 'border-zinc-950 text-zinc-950'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Saved Items ({wishlistProducts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'profile'
                      ? 'border-zinc-950 text-zinc-950'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile & Address</span>
                </button>
              </div>

              {/* Tab 1: My Orders */}
              {activeTab === 'orders' && (
                <div className="p-3.5 sm:p-5 space-y-3.5">
                  {ordersLoading ? (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      <div className="animate-spin w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto mb-2" />
                      Loading your order history...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <Package className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-zinc-800 mb-1">No Orders Yet</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                        You haven't placed any orders yet. Explore our gadgets and place your first order with Cash on Delivery!
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Start Shopping</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-zinc-200 p-3.5 sm:p-4 shadow-2xs hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-xs sm:text-sm text-zinc-950">
                                {order.order_number || `#${order.id.slice(0, 8)}`}
                              </span>
                              {getStatusBadge(order.status)}
                            </div>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              {order.created_at ? new Date(order.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent order'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-sm sm:text-base text-zinc-950 block">
                              ৳{(order.total || 0).toLocaleString('en-BD')}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Cash on Delivery
                            </span>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        {Array.isArray(order.items) && order.items.length > 0 && (
                          <div className="py-2 border-t border-zinc-100 space-y-1.5">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (onOpenProduct) {
                                    onClose();
                                    const found = wishlistProducts?.find(p => String(p.id) === String(item.product_id)) || {
                                      id: item.product_id,
                                      name: item.product_name,
                                      selling_price: item.unit_price || 0,
                                      buying_price: item.buying_price || 0,
                                      slug: (item as any).slug || item.product_id,
                                      image_url: item.image_url || '',
                                      stock: 99,
                                      category: 'All',
                                      category_slug: 'all',
                                    } as Product;
                                    onOpenProduct(found);
                                  }
                                }}
                                className="flex items-center justify-between text-xs text-zinc-700 hover:text-emerald-700 cursor-pointer group transition-colors"
                                title="Click to view & order product"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={item.product_name}
                                      className="w-6 h-6 rounded-md object-cover border border-zinc-200 shrink-0 group-hover:border-emerald-500"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-[9px] font-bold shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <span className="truncate max-w-[200px] sm:max-w-xs font-medium group-hover:underline">{item.product_name}</span>
                                  <span className="text-zinc-400 font-medium">×{item.quantity}</span>
                                </div>
                                <span className="font-bold text-zinc-900 shrink-0 group-hover:text-emerald-700">
                                  ৳{((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('en-BD')}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="text-[11px] text-zinc-400 font-medium">
                                + {order.items.length - 3} more item(s)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-zinc-500 truncate max-w-[160px] sm:max-w-xs">
                            📍 {order.district ? `${order.district}` : 'Bangladesh'}
                          </span>

                          <div className="flex items-center gap-2">
                            {onOpenInvoice && (
                              <button
                                type="button"
                                onClick={() => onOpenInvoice(order)}
                                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Invoice</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setTrackQuery(order.order_number || order.phone);
                                setTrackedOrder(order);
                                setActiveTab('tracking');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Track</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Track Order */}
              {activeTab === 'tracking' && (
                <div className="p-3.5 sm:p-5 space-y-4">
                  <form onSubmit={handleTrackSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Enter Order Number (e.g. MX-2026...) or Phone"
                        value={trackQuery}
                        onChange={(e) => setTrackQuery(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                      <Truck className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    </div>
                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {trackLoading ? 'Searching...' : 'Track'}
                    </button>
                  </form>

                  {trackError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{trackError}</span>
                    </div>
                  )}

                  {trackedOrder && (
                    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-4 animate-in fade-in-50">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                        <div>
                          <span className="font-extrabold text-sm text-zinc-950">
                            {trackedOrder.order_number || trackedOrder.id}
                          </span>
                          <span className="text-xs text-zinc-500 block">
                            Recipient: {trackedOrder.customer_name} ({trackedOrder.phone})
                          </span>
                        </div>
                        <div>{getStatusBadge(trackedOrder.status)}</div>
                      </div>

                      {/* Delivery Status Steps Timeline */}
                      <div className="space-y-3 pt-1">
                        <div className="text-xs font-bold text-zinc-700">Delivery Status Timeline</div>
                        <div className="grid grid-cols-4 gap-1 text-center">
                          <div className="space-y-1">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center mx-auto">✓</div>
                            <span className="text-[10px] font-bold text-zinc-800 block">Placed</span>
                          </div>
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto ${
                              ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(trackedOrder.status)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-zinc-200 text-zinc-500'
                            }`}>
                              {['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(trackedOrder.status) ? '✓' : '2'}
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-700 block">Confirmed</span>
                          </div>
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto ${
                              ['Shipped', 'Delivered'].includes(trackedOrder.status)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-zinc-200 text-zinc-500'
                            }`}>
                              {['Shipped', 'Delivered'].includes(trackedOrder.status) ? '✓' : '3'}
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-700 block">Courier</span>
                          </div>
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center mx-auto ${
                              trackedOrder.status === 'Delivered'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-zinc-200 text-zinc-500'
                            }`}>
                              {trackedOrder.status === 'Delivered' ? '✓' : '4'}
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-700 block">Delivered</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-zinc-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Destination:</span>
                          <span className="font-semibold text-zinc-800">{trackedOrder.address}, {trackedOrder.district}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Total Payable:</span>
                          <span className="font-extrabold text-emerald-700">৳{(trackedOrder.total || 0).toLocaleString('en-BD')} (COD)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Saved / Wishlist Items */}
              {activeTab === 'saved' && (
                <div className="p-3.5 sm:p-5 space-y-3">
                  {wishlistProducts.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                      <Heart className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-zinc-800 mb-1">No Saved Items</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                        Click the heart icon on any product in our store to save it here for later.
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Browse Store</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    wishlistProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-colors"
                      >
                        <div
                          className="flex items-center gap-3 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (onOpenProduct) {
                              onClose();
                              onOpenProduct(p);
                            }
                          }}
                        >
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-contain bg-zinc-50 border border-zinc-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs sm:text-sm text-zinc-900 truncate max-w-[180px] sm:max-w-xs hover:text-emerald-700 transition-colors">
                              {p.name}
                            </h5>
                            <span className="font-black text-xs sm:text-sm text-emerald-700">
                              ৳{(p.selling_price - (p.discount || 0)).toLocaleString('en-BD')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onAddToCart && (
                            <button
                              type="button"
                              onClick={() => onAddToCart(p)}
                              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden xs:inline">Add</span>
                            </button>
                          )}
                          {onRemoveWishlist && (
                            <button
                              type="button"
                              onClick={() => onRemoveWishlist(p.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove from saved"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Profile & Address */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="p-3.5 sm:p-5 space-y-3.5">
                  {profileSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Primary Phone (Login Number)
                      </label>
                      <input
                        type="tel"
                        disabled
                        value={currentCustomer.phone}
                        className="w-full bg-zinc-100 text-zinc-500 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-200 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Alternative Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 018..."
                        value={profileAltPhone}
                        onChange={(e) => setProfileAltPhone(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. customer@domain.com"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Default Delivery District
                      </label>
                      <select
                        value={profileDistrict}
                        onChange={(e) => setProfileDistrict(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      >
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        Thana / Police Station / Area
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Banani, Gulshan"
                        value={profileArea}
                        onChange={(e) => setProfileArea(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Street Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Flat 4B, House 22, Road 15"
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm px-3 py-2 rounded-xl border border-zinc-300 focus:border-zinc-950 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
