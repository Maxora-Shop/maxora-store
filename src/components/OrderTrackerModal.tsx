import React, { useState } from 'react';
import { X, Search, Package, Truck, CheckCircle2, Clock, AlertCircle, MapPin } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { storeService } from '../services/storeService';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered'
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const result = await storeService.trackOrder(query.trim());
      if (!result.success || !result.order) {
        throw new Error(result.error || 'No matching order found.');
      }
      setOrder(result.order);
    } catch (err: any) {
      setError(err.message || 'Unable to track order.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled' || status === 'Returned') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-zinc-900">
                Track Your Order
              </h2>
              <p className="text-xs text-zinc-500">
                Enter your Order Number (MX-...) or Mobile Number
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Input */}
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                placeholder="e.g. MX-20260830-AB12C or 01711223344"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-sm pl-10 pr-4 py-3 rounded-2xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Details View */}
          {order && (
            <div className="space-y-6 pt-2">
              {/* Status Header Banner */}
              <div className="bg-zinc-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Order Number</span>
                  <h3 className="text-lg font-black font-mono text-emerald-400">
                    {order.order_number}
                  </h3>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Placed on: {new Date(order.created_at).toLocaleDateString('en-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Status: {order.status}
                  </span>
                  <div className="text-sm font-black text-white mt-1">
                    Total: ৳{Number(order.total || 0).toLocaleString('en-BD')} (COD)
                  </div>
                </div>
              </div>

              {/* Stepper Timeline */}
              {order.status !== 'Cancelled' && order.status !== 'Returned' ? (
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(order.status);
                      const isPast = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                              isCurrent
                                ? 'bg-emerald-500 text-zinc-950 ring-4 ring-emerald-100 font-extrabold'
                                : isPast
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-200 text-zinc-400'
                            }`}
                          >
                            {isPast ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs font-bold leading-tight ${
                              isCurrent
                                ? 'text-emerald-700'
                                : isPast
                                ? 'text-zinc-900'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 text-xs font-bold text-center">
                  This order has been {order.status.toLowerCase()}.
                </div>
              )}

              {/* Delivery Details & Items */}
              <div className="space-y-3 text-xs">
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-zinc-900">{order.customer_name} ({order.phone})</div>
                    <div className="text-zinc-600 mt-0.5">{order.address}, {order.area}, {order.district}</div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="border border-zinc-200 rounded-xl p-3.5 divide-y divide-zinc-100">
                    <div className="font-bold text-zinc-900 mb-2">Ordered Items</div>
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-center text-zinc-700">
                        <span>{item.product_name} x {item.quantity}</span>
                        <span className="font-semibold text-zinc-900">৳{Number(item.line_total).toLocaleString('en-BD')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
