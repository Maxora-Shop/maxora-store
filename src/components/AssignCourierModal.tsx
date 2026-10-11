import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  X,
  ShieldCheck,
  DollarSign,
  Send,
  Copy,
  Check,
  Clock,
  Package,
  ArrowRight,
  Sparkles,
  Link2,
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { storeService } from '../services/storeService';

interface AssignCourierModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  adminPassword?: string;
}

export const AssignCourierModal: React.FC<AssignCourierModalProps> = ({
  order,
  settings,
  onClose,
  onOrderUpdated,
  showToast,
  adminPassword,
}) => {
  if (!order) return null;

  const [activeTab, setActiveTab] = useState<'steadfast' | 'pathao' | 'manual'>('steadfast');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Steadfast Inputs
  const [sfApiKey, setSfApiKey] = useState(settings.steadfast_api_key || '');
  const [sfSecretKey, setSfSecretKey] = useState(settings.steadfast_secret_key || '');
  const [sfBalance, setSfBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [sfCodAmount, setSfCodAmount] = useState<number>(order.total || order.total_amount || 0);
  const [sfNote, setSfNote] = useState(order.note || `Maxora Shop Order #${order.order_number || order.id}`);

  // Pathao Inputs
  const [pathaoClientId, setPathaoClientId] = useState(settings.pathao_client_id || '');
  const [pathaoClientSecret, setPathaoClientSecret] = useState(settings.pathao_client_secret || '');
  const [pathaoUsername, setPathaoUsername] = useState(settings.pathao_username || '');
  const [pathaoPassword, setPathaoPassword] = useState(settings.pathao_password || '');
  const [pathaoStoreId, setPathaoStoreId] = useState(settings.pathao_store_id || '1');
  const [pathaoCodAmount, setPathaoCodAmount] = useState<number>(order.total || order.total_amount || 0);
  const [pathaoNote, setPathaoNote] = useState(order.note || 'Handle with care');

  // Manual Inputs
  const [manualCourier, setManualCourier] = useState(order.courier_name || 'Steadfast');
  const [manualTrackingCode, setManualTrackingCode] = useState(order.courier_tracking_code || '');
  const [manualTrackingUrl, setManualTrackingUrl] = useState(order.courier_tracking_url || '');
  const [manualNote, setManualNote] = useState('');
  const [markShipped, setMarkShipped] = useState(true);

  // Check Steadfast balance if keys are set
  const handleCheckBalance = async () => {
    if (!sfApiKey || !sfSecretKey) {
      showToast('Steadfast API Key এবং Secret Key প্রদান করুন', 'info');
      return;
    }
    try {
      setIsCheckingBalance(true);
      const res = await storeService.getSteadfastBalance(sfApiKey, sfSecretKey, adminPassword);
      if (res.success && res.current_balance !== undefined) {
        setSfBalance(res.current_balance);
        showToast(`Steadfast বর্তমান ব্যালেন্স: ৳${res.current_balance}`, 'success');
      } else {
        showToast(`ব্যালেন্স চেক করা যায়নি: ${res.error || 'Invalid credentials'}`, 'error');
      }
    } catch (err: any) {
      showToast(`সমস্যা: ${err.message}`, 'error');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  useEffect(() => {
    if (sfApiKey && sfSecretKey) {
      handleCheckBalance();
    }
  }, []);

  // Handle Steadfast 1-Click Booking
  const handleBookSteadfast = async () => {
    if (!sfApiKey.trim() || !sfSecretKey.trim()) {
      showToast('Steadfast API Key এবং Secret Key প্রয়োজন', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await storeService.bookSteadfastCourier(
        order.id,
        {
          apiKey: sfApiKey.trim(),
          secretKey: sfSecretKey.trim(),
          codAmount: Number(sfCodAmount),
          note: sfNote.trim(),
        },
        adminPassword
      );

      if (res.success && res.order) {
        showToast(res.message || 'Steadfast-এ সফলভাবে বুক করা হয়েছে!', 'success');
        onOrderUpdated(res.order);
      } else {
        showToast(`বুকিং ব্যর্থ: ${res.message || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Steadfast বুকিং ব্যর্থ: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Pathao 1-Click Booking
  const handleBookPathao = async () => {
    if (!pathaoClientId.trim() || !pathaoClientSecret.trim() || !pathaoUsername.trim() || !pathaoPassword.trim()) {
      showToast('Pathao Client ID, Secret, Username এবং Password আবশ্যক', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await storeService.bookPathaoCourier(
        order.id,
        {
          clientId: pathaoClientId.trim(),
          clientSecret: pathaoClientSecret.trim(),
          username: pathaoUsername.trim(),
          password: pathaoPassword.trim(),
          storeId: pathaoStoreId.trim() || '1',
          codAmount: Number(pathaoCodAmount),
          note: pathaoNote.trim(),
        },
        adminPassword
      );

      if (res.success && res.order) {
        showToast(res.message || 'Pathao-তে সফলভাবে বুক করা হয়েছে!', 'success');
        onOrderUpdated(res.order);
      } else {
        showToast(`বুকিং ব্যর্থ: ${res.message || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Pathao বুকিং ব্যর্থ: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Assignment
  const handleAssignManual = async () => {
    if (!manualCourier.trim()) {
      showToast('কুরিয়ারের নাম নির্বাচন করুন', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await storeService.assignOrderCourier(
        {
          orderId: order.id,
          courier_name: manualCourier.trim(),
          tracking_code: manualTrackingCode.trim(),
          tracking_url: manualTrackingUrl.trim(),
          note: manualNote.trim(),
          mark_shipped: markShipped,
        },
        adminPassword
      );

      if (res.success && res.order) {
        showToast(res.message || `${manualCourier} সফলভাবে অ্যাসাইন করা হয়েছে!`, 'success');
        onOrderUpdated(res.order);
      } else {
        showToast(`অ্যাসাইন করা যায়নি: ${res.message || 'Failed'}`, 'error');
      }
    } catch (err: any) {
      showToast(`ব্যর্থ: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('ট্র্যাকিং কোড কপি করা হয়েছে!', 'info');
    } catch {}
  };

  const recipientFullAddress = [order.address, order.area, order.thana, order.district]
    .filter(Boolean)
    .join(', ');

  const hasAssignedCourier = Boolean(order.courier_name || order.courier_tracking_code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shadow-inner">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">কুরিয়ার অ্যাসাইন ও পার্সেল বুকিং</h3>
              <p className="text-xs text-emerald-100 font-medium">
                অর্ডার: <span className="font-mono font-bold text-white">#{order.order_number || order.id}</span> • কাস্টমার: {order.customer_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Courier Status Banner (if already booked) */}
        {hasAssignedCourier && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900">
                  বর্তমান কুরিয়ার: <span className="font-bold">{order.courier_name}</span>
                </p>
                {order.courier_tracking_code && (
                  <p className="text-xs font-mono text-emerald-700">
                    ট্র্যাকিং কোড: <span className="font-bold">{order.courier_tracking_code}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {order.courier_tracking_code && (
                <button
                  type="button"
                  onClick={() => copyTrackingCode(order.courier_tracking_code!)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'কপি হয়েছে' : 'কপি করুন'}
                </button>
              )}
              {order.courier_tracking_url && (
                <a
                  href={order.courier_tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  লাইভ ট্র্যাকিং দেখুন
                </a>
              )}
            </div>
          </div>
        )}

        {/* Customer & Delivery Summary Card */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200">
            <span className="text-zinc-500 block font-medium">প্রাপক (Recipient):</span>
            <p className="font-bold text-zinc-900 mt-0.5">{order.customer_name}</p>
            <p className="font-mono text-zinc-700 mt-0.5">{order.phone || order.customer_phone}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200 sm:col-span-1">
            <span className="text-zinc-500 block font-medium">কালেকশন এমাউন্ট (COD):</span>
            <p className="font-bold text-emerald-700 text-sm mt-0.5">৳{order.total || order.total_amount || 0}</p>
            <span className="text-[11px] text-zinc-500">ডেলিভারি চার্জ: ৳{order.delivery_charge || 0}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200">
            <span className="text-zinc-500 block font-medium">ঠিকানা (Address):</span>
            <p className="text-zinc-800 font-medium line-clamp-2 mt-0.5" title={recipientFullAddress}>
              {recipientFullAddress || 'ঠিকানা দেওয়া হয়নি'}
            </p>
          </div>
        </div>

        {/* Courier Tabs */}
        <div className="flex border-b border-zinc-200 bg-white px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('steadfast')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'steadfast'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Steadfast (অটো API)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pathao')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'pathao'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Pathao (অটো API)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            ম্যানুয়াল / অন্যান্য কুরিয়ার
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {/* TAB 1: STEADFAST */}
          {activeTab === 'steadfast' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    SF
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Steadfast Courier API</h4>
                    <p className="text-[11px] text-emerald-700">১-ক্লিকে সরাসরি Steadfast পোর্টালে পার্সেল বুকিং</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sfBalance !== null && (
                    <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-800">
                      ব্যালেন্স: ৳{sfBalance}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckBalance}
                    disabled={isCheckingBalance}
                    className="p-1.5 text-xs rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Check Steadfast Balance"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBalance ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* API Credentials Check */}
              {(!settings.steadfast_api_key || !settings.steadfast_secret_key) && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                  <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Steadfast API Key & Secret Key প্রদান করুন:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 block mb-1">Steadfast Api-Key:</label>
                      <input
                        type="text"
                        value={sfApiKey}
                        onChange={(e) => setSfApiKey(e.target.value)}
                        placeholder="আপনার Steadfast Api-Key"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 block mb-1">Steadfast Secret-Key:</label>
                      <input
                        type="password"
                        value={sfSecretKey}
                        onChange={(e) => setSfSecretKey(e.target.value)}
                        placeholder="আপনার Steadfast Secret-Key"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">ক্যাশ অন ডেলিভারি (COD Amount ৳):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400 font-bold">৳</span>
                    <input
                      type="number"
                      value={sfCodAmount}
                      onChange={(e) => setSfCodAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 font-bold focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">কাস্টমার থেকে কুরিয়ার যে টাকা কালেক্ট করবে।</span>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">ডেলিভারি নোট / নির্দেশিকা:</label>
                  <input
                    type="text"
                    value={sfNote}
                    onChange={(e) => setSfNote(e.target.value)}
                    placeholder="পার্সেল নোট (ঐচ্ছিক)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">ডেলিভারি ম্যানের জন্য বিশেষ নির্দেশ।</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleBookSteadfast}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Steadfast-এ বুকিং হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    🚀 Steadfast-এ ১-ক্লিকে পার্সেল বুক করুন
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: PATHAO */}
          {activeTab === 'pathao' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                    PT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-950">Pathao Courier API</h4>
                    <p className="text-[11px] text-red-700">পাঠাও মার্চেন্ট এপিআই দিয়ে অটো বুকিং</p>
                  </div>
                </div>
              </div>

              {/* Pathao Credentials Input if not set */}
              {(!settings.pathao_client_id || !settings.pathao_client_secret || !settings.pathao_username) && (
                <div className="p-3 bg-zinc-100 rounded-2xl border border-zinc-200 text-xs space-y-2">
                  <p className="font-semibold text-zinc-900">Pathao API Credentials প্রদান করুন:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pathaoClientId}
                      onChange={(e) => setPathaoClientId(e.target.value)}
                      placeholder="Client ID"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-mono"
                    />
                    <input
                      type="password"
                      value={pathaoClientSecret}
                      onChange={(e) => setPathaoClientSecret(e.target.value)}
                      placeholder="Client Secret"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={pathaoUsername}
                      onChange={(e) => setPathaoUsername(e.target.value)}
                      placeholder="Pathao Username / Email"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs"
                    />
                    <input
                      type="password"
                      value={pathaoPassword}
                      onChange={(e) => setPathaoPassword(e.target.value)}
                      placeholder="Pathao Password"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">কালেকশন এমাউন্ট (COD ৳):</label>
                  <input
                    type="number"
                    value={pathaoCodAmount}
                    onChange={(e) => setPathaoCodAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 font-bold focus:border-red-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">স্পেশাল নোট:</label>
                  <input
                    type="text"
                    value={pathaoNote}
                    onChange={(e) => setPathaoNote(e.target.value)}
                    placeholder="বিশেষ নির্দেশনা"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookPathao}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Pathao-তে বুকিং হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    🚀 Pathao-তে বুক করুন
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: MANUAL / OTHER COURIERS */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                <h4 className="text-xs font-bold text-indigo-950">যেকোনো কুরিয়ার ম্যানুয়াল সিলেকশন</h4>
                <p className="text-[11px] text-indigo-700">
                  সুন্দরবন, এস এ পরিবহন, রেডএক্স বা যেকোনো অফলাইন/অনলাইন কুরিয়ারের ট্র্যাকিং কোড বসিয়ে Shipped করুন।
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">কুরিয়ারের নাম (Select Courier):</label>
                  <select
                    value={manualCourier}
                    onChange={(e) => {
                      setManualCourier(e.target.value);
                      // Auto-set tracking URL template if known
                      const c = e.target.value.toLowerCase();
                      if (c.includes('steadfast')) {
                        setManualTrackingUrl('https://steadfast.com.bd/t/');
                      } else if (c.includes('pathao')) {
                        setManualTrackingUrl('https://pathao.com/courier/tracking/?consignment_id=');
                      } else if (c.includes('redx')) {
                        setManualTrackingUrl('https://redx.com.bd/track/');
                      } else if (c.includes('paperfly')) {
                        setManualTrackingUrl('https://paperfly.com.bd/tracking?tracking_id=');
                      } else if (c.includes('ecourier')) {
                        setManualTrackingUrl('https://ecourier.com.bd/track/?ecr_tracking=');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 font-semibold focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Steadfast">Steadfast Courier (স্টেডফাস্ট)</option>
                    <option value="Pathao">Pathao Courier (পাঠাও)</option>
                    <option value="Sundarban Courier">Sundarban Courier (সুন্দরবন কুরিয়ার)</option>
                    <option value="SA Paribahan">SA Paribahan (এস এ পরিবহন)</option>
                    <option value="RedX">RedX (রেডএক্স)</option>
                    <option value="Paperfly">Paperfly (পেপারফ্লাই)</option>
                    <option value="eCourier">eCourier (ই-কুরিয়ার)</option>
                    <option value="Delivery Tiger">Delivery Tiger (ডেলিভারি টাইগার)</option>
                    <option value="In-House Delivery">In-House Delivery (নিজস্ব ডেলিভারি ম্যান)</option>
                    <option value="Other">অন্যান্য কুরিয়ার</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    কুরিয়ার ট্র্যাকিং / মেমো নম্বর (Consignment / Tracking ID):
                  </label>
                  <input
                    type="text"
                    value={manualTrackingCode}
                    onChange={(e) => setManualTrackingCode(e.target.value)}
                    placeholder="যেমন: TRK-8A7B6C অথবা CN-123456"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 font-mono text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">ট্র্যাকিং ইউআরএল (ঐচ্ছিক):</label>
                  <input
                    type="url"
                    value={manualTrackingUrl}
                    onChange={(e) => setManualTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-zinc-900 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    কাস্টমার ইনভয়েস বা ট্র্যাকারে এই লিঙ্কে ক্লিক করে পার্সেল অবস্থান দেখতে পারবে।
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="markShippedCheck"
                    checked={markShipped}
                    onChange={(e) => setMarkShipped(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="markShippedCheck" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                    অর্ডার স্ট্যাটাস স্বয়ংক্রিয়ভাবে "Shipped (কুরিয়ারে পাঠানো হয়েছে)" মার্ক করুন
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAssignManual}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    কুরিয়ার অ্যাসাইন সম্পন্ন করুন
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Maxora Courier Integration Suite</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
