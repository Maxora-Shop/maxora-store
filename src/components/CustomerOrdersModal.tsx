import React from 'react';
import { Customer, Order } from '../types';
import { ShoppingBag, X, Calendar, Phone, MapPin, CheckCircle, Clock, Truck, AlertTriangle } from 'lucide-react';

interface CustomerOrdersModalProps {
  customer: Customer | null;
  orders: Order[];
  onClose: () => void;
  onSelectOrder: (order: Order) => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  customer,
  orders,
  onClose,
  onSelectOrder,
}) => {
  if (!customer) return null;

  // Filter orders belonging to this customer by phone or customer_id
  const customerOrders = orders.filter(
    (o) => o.customer_id === customer.id || o.phone === customer.phone || (o.customer_name && o.customer_name.toLowerCase() === customer.name.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 leading-tight">
                  {customer.name}
                </h3>
                <span className="text-xs text-zinc-500">{customer.phone}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-zinc-100/60 border-b border-zinc-200 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Orders</span>
            <div className="text-base font-black text-zinc-900">{customerOrders.length || customer.total_orders || 1}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Spent</span>
            <div className="text-base font-black text-emerald-700">
              ৳{Number(customer.total_spent || customerOrders.reduce((s, o) => s + Number(o.total || 0), 0)).toLocaleString('en-BD')}
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Location</span>
            <div className="text-xs font-bold text-zinc-800 truncate">{customer.district || 'Bangladesh'}</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-6 overflow-y-auto space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Order History ({customerOrders.length})
          </h4>

          {customerOrders.length > 0 ? (
            <div className="space-y-3">
              {customerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-950 text-sm">
                          {ord.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(ord.status)}`}>
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(ord.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-zinc-950">
                        ৳{Number(ord.total).toLocaleString('en-BD')}
                      </div>
                      <span className="text-[10px] text-zinc-400">Delivery: ৳{ord.delivery_charge}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {Array.isArray(ord.items) && ord.items.length > 0 && (
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-zinc-700">
                          <span className="font-medium truncate pr-2">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-bold text-zinc-900 shrink-0">
                            ৳{Number(item.line_total || Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-BD')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-zinc-500 text-[11px] truncate max-w-[280px]">
                      <MapPin className="w-3 h-3 inline mr-1 text-zinc-400" />
                      {ord.address}, {ord.area}, {ord.district}
                    </div>

                    <button
                      onClick={() => {
                        onSelectOrder(ord);
                        onClose();
                      }}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      View / Edit Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 text-sm">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              No past orders recorded for this customer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
