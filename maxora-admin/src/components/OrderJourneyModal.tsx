import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  Package,
  XCircle,
  AlertTriangle,
  Printer,
  Edit,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  User,
  History,
  Send,
  ShoppingBag,
} from 'lucide-react';
import { Order, OrderStatus, OrderTimelineEvent } from '../types';

interface OrderJourneyModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;
  onOpenEditModal: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
}

export const OrderJourneyModal: React.FC<OrderJourneyModalProps> = ({
  order,
  onClose,
  onStatusUpdate,
  onOpenEditModal,
  onPrintInvoice,
}) => {
  if (!order) return null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [statusNote, setStatusNote] = useState('');
  const [showStatusChanger, setShowStatusChanger] = useState(false);

  const isCancelled = order.status === 'Cancelled' || order.status === 'Returned';

  // Standard Journey Steps:
  // 1. Order Placed
  // 2. Processing (Packaging)
  // 3. Shipped (In Transit)
  // 4. Delivered / Completed
  const STEPS = [
    {
      id: 'Placed',
      label: 'Order Placed',
      description: 'Customer order submitted via checkout',
      icon: Clock,
      matches: () => true, // always true if order exists
    },
    {
      id: 'Processing',
      label: 'Processing',
      description: 'Confirmed & packaging in warehouse',
      icon: PackageCheck,
      matches: (status: string) =>
        ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(status),
    },
    {
      id: 'Shipped',
      label: 'Shipped',
      description: 'Dispatched with courier delivery partner',
      icon: Truck,
      matches: (status: string) => ['Shipped', 'Delivered'].includes(status),
    },
    {
      id: 'Delivered',
      label: 'Delivered / Completed',
      description: 'Customer received package & paid COD',
      icon: CheckCircle2,
      matches: (status: string) => status === 'Delivered',
    },
  ];

  const getStepState = (stepIndex: number) => {
    if (isCancelled) {
      if (stepIndex === 0) return 'completed';
      return 'disabled';
    }

    const currentStatus = order.status;
    let currentIdx = 0;
    if (currentStatus === 'Pending') currentIdx = 0;
    else if (currentStatus === 'Confirmed' || currentStatus === 'Processing') currentIdx = 1;
    else if (currentStatus === 'Shipped') currentIdx = 2;
    else if (currentStatus === 'Delivered') currentIdx = 3;

    if (stepIndex < currentIdx) return 'completed';
    if (stepIndex === currentIdx) return 'active';
    return 'upcoming';
  };

  const handleUpdate = async (statusToSet: OrderStatus) => {
    try {
      setIsUpdating(true);
      await onStatusUpdate(order.id, statusToSet, statusNote.trim() || undefined);
      setShowStatusChanger(false);
      setStatusNote('');
    } finally {
      setIsUpdating(false);
    }
  };

  // Synthesize timeline if not explicitly saved
  const timeline: OrderTimelineEvent[] =
    order.timeline && order.timeline.length > 0
      ? order.timeline
      : [
          {
            status: 'Pending',
            timestamp: order.created_at,
            note: 'Order placed by customer via Cash on Delivery',
            by: 'Customer',
          },
          ...(order.status !== 'Pending'
            ? [
                {
                  status: order.status,
                  timestamp: order.updated_at || order.created_at,
                  note: `Order marked as ${order.status}`,
                  by: 'Admin',
                },
              ]
            : []),
        ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-zinc-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 font-mono">
                  {order.order_number}
                </h3>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isCancelled
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : order.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : order.status === 'Shipped'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      : order.status === 'Processing' || order.status === 'Confirmed'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                <span>Placed {new Date(order.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>•</span>
                <span className="font-mono text-zinc-400">ID: {order.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintInvoice(order)}
              title="Print Packing Slip / Invoice"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invoice</span>
            </button>
            <button
              onClick={() => onOpenEditModal(order)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Order</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-900">
          {/* Visual Order Progress Tracker */}
          <div className="bg-zinc-900 text-white p-5 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Customer Order Journey
                </span>
                <h4 className="text-base font-black text-white mt-0.5">
                  Visual Progress Tracker
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusChanger(!showStatusChanger)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-colors cursor-pointer"
              >
                {showStatusChanger ? 'Hide Changer' : 'Change Status'}
              </button>
            </div>

            {/* If Order is Cancelled */}
            {isCancelled ? (
              <div className="bg-rose-950/60 border border-rose-500/40 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-rose-200">
                      Order Cancelled / Returned
                    </div>
                    <div className="text-xs text-rose-300/80 mt-0.5">
                      Journey stopped. Customer will not receive this shipment.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdate('Pending')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold cursor-pointer"
                >
                  Re-open as Pending
                </button>
              </div>
            ) : (
              /* Active Stepper */
              <div className="grid grid-cols-4 gap-2 relative pt-2">
                {STEPS.map((step, idx) => {
                  const state = getStepState(idx);
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center relative z-10">
                      {/* Connecting Line */}
                      {idx > 0 && (
                        <div
                          className={`absolute top-4 -left-1/2 w-full h-0.5 -z-10 ${
                            state === 'completed' || state === 'active'
                              ? 'bg-emerald-500'
                              : 'bg-zinc-800'
                          }`}
                        />
                      )}

                      {/* Icon Circle */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all mb-2 ${
                          state === 'completed'
                            ? 'bg-emerald-500 text-zinc-950 ring-4 ring-emerald-500/20'
                            : state === 'active'
                            ? 'bg-white text-zinc-950 ring-4 ring-white/20 font-black animate-pulse'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {state === 'completed' ? (
                          '✓'
                        ) : state === 'active' ? (
                          '●'
                        ) : (
                          '○'
                        )}
                      </div>

                      <span
                        className={`text-xs font-bold leading-tight ${
                          state === 'completed' || state === 'active'
                            ? 'text-white'
                            : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-zinc-400 hidden sm:block mt-0.5">
                        {state === 'completed' ? 'Done' : state === 'active' ? 'Current Stage' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Status Changer Drawer */}
            {showStatusChanger && (
              <div className="p-4 rounded-2xl bg-zinc-800/90 border border-zinc-700/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-xs font-bold text-zinc-300">
                  Update Order Status & Append to Journey Timeline:
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdate(st)}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          order.status === st
                            ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-400 font-black'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {order.status === st ? `✓ ${st}` : st}
                      </button>
                    )
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Optional timeline note (e.g. Courier tracking ID, call confirmed with customer...)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full bg-zinc-950 text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Customer & Delivery Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  Customer Details
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  COD Order
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-base text-zinc-900">
                  {order.customer_name}
                </h4>
                <div className="flex items-center gap-3 mt-1.5">
                  <a
                    href={`tel:${order.phone}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{order.phone}</span>
                  </a>
                  <a
                    href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
                {order.alt_phone && (
                  <div className="text-xs text-zinc-500 mt-1 font-mono">
                    Alt Phone: {order.alt_phone}
                  </div>
                )}
                {order.email && (
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Email: {order.email}
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Location & Payment */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  Delivery & Payment
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {order.payment_method || 'Cash on Delivery'}
                </span>
              </div>

              <div>
                <div className="font-bold text-zinc-900 text-sm">
                  {order.district}
                  {order.thana ? `, ${order.thana}` : ''}
                  {order.area && order.area !== order.thana ? `, ${order.area}` : ''}
                </div>
                <div className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                  {order.address}
                </div>
                <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-zinc-200/70">
                  <span className="text-zinc-500">Delivery Charge:</span>
                  <span className="font-bold text-zinc-900 font-mono">
                    ৳{Number(order.delivery_charge || 0).toLocaleString('en-BD')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-500">Total Payable:</span>
                  <span className="font-black text-emerald-800 text-sm font-mono">
                    ৳{Number(order.total).toLocaleString('en-BD')}
                  </span>
                </div>
                {(!order.payment_method || order.payment_method.toLowerCase().includes('cash') || order.payment_method.toLowerCase().includes('cod')) && (
                  <div className="flex items-center justify-between text-xs pt-1 text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-lg mt-1 border border-emerald-200">
                    <span className="font-bold">COD Amount to Collect:</span>
                    <span className="font-black font-mono">
                      ৳{Number(order.total).toLocaleString('en-BD')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="bg-zinc-50 p-3.5 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-zinc-500" />
                Products in this Order ({(order.items || []).length})
              </span>
              <span className="text-xs font-black font-mono text-zinc-900">
                Subtotal: ৳{Number(order.subtotal || 0).toLocaleString('en-BD')}
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {(order.items || []).map((it, idx) => (
                <div key={it.id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt={it.product_name}
                        className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-zinc-900 truncate">
                        {it.product_name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 flex-wrap">
                        {it.sku && <span className="font-mono text-[11px]">SKU: {it.sku}</span>}
                        {it.selected_color && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 text-[10px] font-semibold">
                            Color: {it.selected_color}
                          </span>
                        )}
                        <span>Qty: {it.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-zinc-950 font-mono">
                      ৳{Number(it.line_total || it.unit_price * it.quantity).toLocaleString('en-BD')}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      ৳{Number(it.unit_price).toLocaleString('en-BD')} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-500" />
                Status Timeline & History
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                {timeline.length} Event{timeline.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-zinc-200">
              {timeline.map((evt, idx) => (
                <div key={idx} className="flex items-start gap-3 relative pl-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-[10px] font-black z-10 shrink-0">
                    ✓
                  </div>
                  <div className="flex-1 bg-white p-2.5 rounded-xl border border-zinc-200 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-900">
                        {evt.status}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(evt.timestamp).toLocaleString('en-BD', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {evt.note && (
                      <p className="text-zinc-600 text-[11px] mt-0.5">
                        {evt.note}
                      </p>
                    )}
                    {evt.by && (
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        Updated by: {evt.by}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
