import React from 'react';
import { Order, StoreSettings } from '../types';
import { Printer, X, Phone, MapPin, CheckCircle, Package } from 'lucide-react';

interface InvoiceModalProps {
  order: Order | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, settings, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 max-h-[95vh] flex flex-col">
        {/* Modal Top Actions */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 print:hidden">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-zinc-900">
              Customer Invoice & Packaging Slip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div id="printable-invoice" className="p-8 overflow-y-auto space-y-6 text-zinc-900 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white font-black text-lg flex items-center justify-center">
                  M
                </div>
                <h1 className="text-xl font-black tracking-tight">{settings.store_name || 'MAXORA'}</h1>
              </div>
              <p className="text-xs text-zinc-500">{settings.store_tagline || 'Premium Online Store Bangladesh'}</p>
              {settings.phone && (
                <p className="text-xs text-zinc-600 font-medium mt-1">Helpline: {settings.phone}</p>
              )}
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-800 font-bold text-xs rounded-lg uppercase tracking-wider mb-2">
                Cash on Delivery
              </span>
              <div className="font-mono font-bold text-base text-zinc-950">
                Order #{order.order_number}
              </div>
              <div className="text-xs text-zinc-500">
                Date: {new Date(order.created_at).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Customer & Delivery Address */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400">Deliver To</span>
              <div className="font-bold text-sm text-zinc-900">{order.customer_name}</div>
              <div className="font-semibold text-zinc-800">{order.phone}</div>
              {order.alt_phone && (
                <div className="text-zinc-500">Alt Phone: {order.alt_phone}</div>
              )}
              {order.email && <div className="text-zinc-500">{order.email}</div>}
            </div>

            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400">Shipping Details</span>
              <div className="text-zinc-700 leading-relaxed font-medium">{order.address}</div>
              <div className="font-bold text-zinc-900">{order.area}, {order.district}</div>
              <div className="text-emerald-700 font-semibold text-[11px] pt-1">
                Area: {order.delivery_area || (order.district === 'Dhaka' ? 'Dhaka City' : 'Outside Dhaka')}
              </div>
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="border border-zinc-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">SKU</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3 text-zinc-400">{index + 1}</td>
                      <td className="p-3 font-bold text-zinc-900">{item.product_name}</td>
                      <td className="p-3 text-center font-mono text-zinc-500">{item.sku || '-'}</td>
                      <td className="p-3 text-center font-bold text-zinc-900">{item.quantity}</td>
                      <td className="p-3 text-right">৳{Number(item.unit_price || 0).toLocaleString('en-BD')}</td>
                      <td className="p-3 text-right font-bold text-zinc-950">
                        ৳{Number(item.line_total || Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-BD')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-zinc-400">1</td>
                    <td className="p-3 font-bold text-zinc-900">Custom Order Package</td>
                    <td className="p-3 text-center font-mono text-zinc-500">-</td>
                    <td className="p-3 text-center font-bold text-zinc-900">1</td>
                    <td className="p-3 text-right">৳{Number(order.subtotal || 0).toLocaleString('en-BD')}</td>
                    <td className="p-3 text-right font-bold text-zinc-950">৳{Number(order.subtotal || 0).toLocaleString('en-BD')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold">৳{Number(order.subtotal || 0).toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery Charge:</span>
                <span className="font-semibold">৳{Number(order.delivery_charge || 0).toLocaleString('en-BD')}</span>
              </div>
              <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-black text-zinc-950">
                <span>Amount Payable:</span>
                <span className="text-emerald-700">৳{Number(order.total || 0).toLocaleString('en-BD')}</span>
              </div>
            </div>
          </div>

          {/* Remarks & Footer Note */}
          {order.note && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Customer Note:</span> {order.note}
            </div>
          )}

          <div className="border-t border-zinc-200 pt-4 text-center text-[11px] text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-600">Thank you for shopping with {settings.store_name || 'Maxora'}!</p>
            <p>Please inspect your package in front of the courier delivery officer before payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
